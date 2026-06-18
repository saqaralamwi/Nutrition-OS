import { getDatabase } from '../../data/database';
import { Q } from '@nozbe/watermelondb';
import { getCdcRefData } from '../data/cdcRefData';
import { generateReferenceCurve } from '../data/whoGrowthReference';

export type GrowthStandard = 'WHO' | 'CDC';

export interface IZScoreInput {
  gender: 'male' | 'female';
  indicatorType: 'wfa' | 'lhfa' | 'wfh' | 'bmifa';
  measurementValue: number;
  ageMonths: number;
  lengthHeightCm?: number;
  standard?: GrowthStandard;
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

function computeAdjustedZScore(y: number, L: number, M: number, S: number, isWeightBased: boolean): number {
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

function findClosestLms(
  records: WhoGrowthRecord[],
  targetValue: number,
  axisField: 'age_months' | 'length_height_cm',
): WhoGrowthRecord {
  return records.reduce((prev, curr) => {
    const prevDiff = Math.abs(prev[axisField] - targetValue);
    const currDiff = Math.abs(curr[axisField] - targetValue);
    return currDiff < prevDiff ? curr : prev;
  });
}

function computeFromLmsData(
  data: { l: number; m: number; s: number }[],
  measurementValue: number,
  targetAge: number,
  isWeightBased: boolean,
): number {
  if (data.length === 0) return 0;

  const closest = data.reduce((prev, curr) => {
    const key = 'ageMonths' in curr ? (curr as any).ageMonths ?? 0 : 0;
    const prevKey = 'ageMonths' in prev ? (prev as any).ageMonths ?? 0 : 0;
    const prevDiff = Math.abs(prevKey - targetAge);
    const currDiff = Math.abs(key - targetAge);
    return currDiff < prevDiff ? curr : prev;
  });

  return computeAdjustedZScore(measurementValue, closest.l, closest.m, closest.s, isWeightBased);
}

export class PediatricZScoreEngine {
  public static async calculateZScore(input: IZScoreInput): Promise<IZScoreResult> {
    if (!input.measurementValue || input.measurementValue <= 0) {
      return {
        zScore: 0,
        classification: 'normal',
        isSafe: false,
        errorMessage: 'قيمة القياس يجب أن تكون أكبر من صفر',
      };
    }

    const standard = input.standard || 'WHO';
    const isWeightBased = ['wfa', 'wfh', 'bmifa'].includes(input.indicatorType);

    if (standard === 'CDC') {
      return this.calculateCdcZScore(input, isWeightBased);
    }

    return this.calculateWhoZScore(input, isWeightBased);
  }

  private static async calculateWhoZScore(
    input: IZScoreInput,
    isWeightBased: boolean,
  ): Promise<IZScoreResult> {
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

    const rawRecords = records.map((r) => r._raw as WhoGrowthRecord);
    const closest = findClosestLms(rawRecords, targetValue, axisField);

    const zScoreRaw = computeAdjustedZScore(
      input.measurementValue,
      closest.l_value,
      closest.m_value,
      closest.s_value,
      isWeightBased,
    );

    const zScore = Math.round(zScoreRaw * 100) / 100;

    return {
      zScore,
      classification: classifyZScore(zScore),
      isSafe: true,
    };
  }

  private static calculateCdcZScore(
    input: IZScoreInput,
    isWeightBased: boolean,
  ): IZScoreResult {
    const indicatorMap: Record<string, 'wfa' | 'lhfa' | 'bmifa'> = {
      wfa: 'wfa',
      lhfa: 'lhfa',
      wfh: 'lhfa',
      bmifa: 'bmifa',
    };
    const mappedIndicator = indicatorMap[input.indicatorType] || 'wfa';

    const cdcPoints = getCdcRefData(input.gender, mappedIndicator);
    if (cdcPoints.length === 0) {
      return {
        zScore: 0,
        classification: 'normal',
        isSafe: false,
        errorMessage: 'لم يتم العثور على بيانات مرجعية لمراكز السيطرة على الأمراض',
      };
    }

    const targetAge = input.indicatorType === 'wfh'
      ? (input.lengthHeightCm ?? input.ageMonths)
      : input.ageMonths;

    const closest = cdcPoints.reduce((prev, curr) => {
      const prevDiff = Math.abs(prev.ageMonths - targetAge);
      const currDiff = Math.abs(curr.ageMonths - targetAge);
      return currDiff < prevDiff ? curr : prev;
    });

    const zScoreRaw = computeAdjustedZScore(
      input.measurementValue,
      closest.l,
      closest.m,
      closest.s,
      isWeightBased,
    );

    const zScore = Math.round(zScoreRaw * 100) / 100;

    return {
      zScore,
      classification: classifyZScore(zScore),
      isSafe: true,
    };
  }
}
