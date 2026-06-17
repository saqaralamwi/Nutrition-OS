import { getDatabase } from '../../data/database';
import { Q } from '@nozbe/watermelondb';

export interface IZScoreInput {
  gender: 'male' | 'female';
  indicatorType: 'wfa' | 'lhfa' | 'wfh' | 'bmifa';
  measurementValue: number;
  ageMonths: number;
  lengthHeightCm?: number;
}

export interface IZScoreResult {
  zScore: number;
  classification: 'severely_low' | 'low' | 'normal' | 'high' | 'severely_high';
  isSafe: boolean;
  errorMessage?: string;
}

interface WhoGrowthRecord {
  gender: string;
  age_months: number;
  length_height_cm: number;
  indicator_type: string;
  l_value: number;
  m_value: number;
  s_value: number;
}

function classifyZScore(zScore: number): IZScoreResult['classification'] {
  if (zScore < -3) return 'severely_low';
  if (zScore < -2) return 'low';
  if (zScore <= 2) return 'normal';
  if (zScore <= 3) return 'high';
  return 'severely_high';
}

export class PediatricZScoreEngine {
  /**
   * Calculates adjusted WHO Z-score
   */
  private static calculateAdjustedZScore(y: number, L: number, M: number, S: number, isWeightBased: boolean): number {
    if (M <= 0 || S === 0) return 0;

    let z: number;
    if (L !== 0) {
      z = (Math.pow(y / M, L) - 1) / (L * S);
    } else {
      z = Math.log(y / M) / S;
    }

    if (isWeightBased) {
      if (z > 3) {
        const sd2pos = L !== 0 ? M * Math.pow(1 + L * S * 2, 1 / L) : M * Math.exp(S * 2);
        const sd3pos = L !== 0 ? M * Math.pow(1 + L * S * 3, 1 / L) : M * Math.exp(S * 3);
        const diff = sd3pos - sd2pos;
        return diff !== 0 ? 3 + (y - sd3pos) / diff : z;
      }
      if (z < -3) {
        const sd2neg = L !== 0 ? M * Math.pow(1 + L * S * (-2), 1 / L) : M * Math.exp(S * (-2));
        const sd3neg = L !== 0 ? M * Math.pow(1 + L * S * (-3), 1 / L) : M * Math.exp(S * (-3));
        const diff = sd2neg - sd3neg;
        return diff !== 0 ? -3 + (y - sd3neg) / diff : z;
      }
    }

    return z;
  }

  public static async calculateZScore(input: IZScoreInput): Promise<IZScoreResult> {
    if (!input.measurementValue || input.measurementValue <= 0) {
      return {
        zScore: 0,
        classification: 'normal',
        isSafe: false,
        errorMessage: 'قيمة القياس يجب أن تكون أكبر من صفر',
      };
    }

    const db = await getDatabase();
    const records = await db.get('who_growth_standards').query(
      Q.where('gender', input.gender),
      Q.where('indicator_type', input.indicatorType),
    ).fetch();

    if (records.length === 0) {
      return {
        zScore: 0,
        classification: 'normal',
        isSafe: false,
        errorMessage: 'لم يتم العثور على بيانات مرجعية لمنظمة الصحة العالمية للمعايير المحددة',
      };
    }

    const axisField = input.indicatorType === 'wfh' ? 'length_height_cm' : 'age_months';
    const targetValue = input.indicatorType === 'wfh'
      ? (input.lengthHeightCm ?? input.ageMonths)
      : input.ageMonths;

    const closest = records.reduce((prev, curr) => {
      const prevDiff = Math.abs((prev._raw as WhoGrowthRecord)[axisField] - targetValue);
      const currDiff = Math.abs((curr._raw as WhoGrowthRecord)[axisField] - targetValue);
      return currDiff < prevDiff ? curr : prev;
    });

    const raw = closest._raw as WhoGrowthRecord;
    const isWeightBased = ['wfa', 'wfh', 'bmifa'].includes(input.indicatorType);
    
    const zScoreRaw = this.calculateAdjustedZScore(
      input.measurementValue,
      raw.l_value,
      raw.m_value,
      raw.s_value,
      isWeightBased
    );

    const zScore = Math.round(zScoreRaw * 100) / 100;

    return {
      zScore,
      classification: classifyZScore(zScore),
      isSafe: true,
    };
  }
}
