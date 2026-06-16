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
  public static async calculateZScore(input: IZScoreInput): Promise<IZScoreResult> {
    if (input.measurementValue <= 0) {
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
    const L = raw.l_value;
    const M = raw.m_value;
    const S = raw.s_value;

    if (S === 0 || M <= 0) {
      return {
        zScore: 0,
        classification: 'normal',
        isSafe: false,
        errorMessage: 'بيانات مرجعية غير صالحة (قيم إحصائية خاطئة)',
      };
    }

    const ratio = input.measurementValue / M;
    let zScore: number;

    if (L !== 0) {
      zScore = (Math.pow(ratio, L) - 1) / (L * S);
    } else {
      zScore = Math.log(ratio) / S;
    }

    zScore = Math.round(zScore * 100) / 100;

    return {
      zScore,
      classification: classifyZScore(zScore),
      isSafe: true,
    };
  }
}
