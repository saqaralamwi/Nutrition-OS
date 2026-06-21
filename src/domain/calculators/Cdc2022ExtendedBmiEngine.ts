import { getCdcRefData } from '../data/cdcRefData';
import { getAdolescentRefData } from '../data/adolescentRefData';
import type { WhoLmsPoint } from '../data/whoGrowthReference';

export type BmiExtendedClassification =
  | 'normal'
  | 'overweight'
  | 'class_i_obesity'
  | 'class_ii_severe_obesity'
  | 'class_iii_severe_obesity'
  | 'unknown';

export interface IExtendedBmiResult {
  bmi: number;
  bmiP95Percent: number;
  bmiAt95th: number;
  classification: BmiExtendedClassification;
  classificationLabelAr: string;
  zScoreForAge: number;
}

export const BMI_EXTENDED_LABELS: Record<BmiExtendedClassification, string> = {
  normal: 'طبيعي (Normal)',
  overweight: 'زيادة وزن (Overweight)',
  class_i_obesity: 'سمنة درجة أولى (Class I Obesity)',
  class_ii_severe_obesity: 'سمنة شديدة درجة ثانية (Class II Severe Obesity)',
  class_iii_severe_obesity: 'سمنة شديدة درجة ثالثة (Class III Severe Obesity)',
  unknown: 'غير معروف (Unknown)',
};

export const BMI_EXTENDED_COLORS: Record<BmiExtendedClassification, string> = {
  normal: '#34D399',
  overweight: '#F59E0B',
  class_i_obesity: '#F97316',
  class_ii_severe_obesity: '#EF4444',
  class_iii_severe_obesity: '#7C3AED',
  unknown: '#94A3B8',
};

const Z_85TH = 1.036;
const Z_95TH = 1.645;
const Z_97TH = 1.881;

function computeValueAtZ(l: number, m: number, s: number, z: number): number {
  if (m <= 0 || s === 0) return 0;
  if (l === 0) return m * Math.exp(s * z);
  const base = 1 + l * s * z;
  if (base <= 0) return m;
  return m * Math.pow(base, 1 / l);
}

function findClosestLms(
  data: WhoLmsPoint[],
  targetAge: number,
): { l: number; m: number; s: number } | null {
  if (data.length === 0) return null;
  return data.reduce((prev, curr) => {
    const prevDiff = Math.abs(prev.ageMonths - targetAge);
    const currDiff = Math.abs(curr.ageMonths - targetAge);
    return currDiff < prevDiff ? curr : prev;
  });
}

export class Cdc2022ExtendedBmiEngine {
  static computeBmiAtPercentile(l: number, m: number, s: number, z: number): number {
    return Math.round(computeValueAtZ(l, m, s, z) * 100) / 100;
  }

  static computeBmiAt95th(l: number, m: number, s: number): number {
    return this.computeBmiAtPercentile(l, m, s, Z_95TH);
  }

  static computeBmiAt85th(l: number, m: number, s: number): number {
    return this.computeBmiAtPercentile(l, m, s, Z_85TH);
  }

  static classifyExtendedBmi(
    bmi: number,
    bmiAt95th: number,
  ): {
    classification: BmiExtendedClassification;
    bmiP95Percent: number;
    thresholdNote?: string;
  } {
    if (bmi <= 0 || bmiAt95th <= 0) {
      return { classification: 'unknown', bmiP95Percent: 0 };
    }

    const bmiP95Percent = Math.round((bmi / bmiAt95th) * 10000) / 100;

    if (bmiP95Percent < 85) {
      return { classification: 'normal', bmiP95Percent };
    }

    if (bmiP95Percent < 95) {
      return { classification: 'overweight', bmiP95Percent };
    }

    const classIIThresholdPct = Math.min(120, (35 / bmiAt95th) * 100);
    const classIIIThresholdPct = Math.min(140, (40 / bmiAt95th) * 100);

    if (bmiP95Percent >= classIIIThresholdPct) {
      return {
        classification: 'class_iii_severe_obesity',
        bmiP95Percent,
        thresholdNote: classIIIThresholdPct < 140
          ? `العتبة المطلقة (BMI ≥ 40) أدنى من %140 (${classIIIThresholdPct.toFixed(1)}% < 140%)`
          : undefined,
      };
    }

    if (bmiP95Percent >= classIIThresholdPct) {
      return {
        classification: 'class_ii_severe_obesity',
        bmiP95Percent,
        thresholdNote: classIIThresholdPct < 120
          ? `العتبة المطلقة (BMI ≥ 35) أدنى من %120 (${classIIThresholdPct.toFixed(1)}% < 120%)`
          : undefined,
      };
    }

    return { classification: 'class_i_obesity', bmiP95Percent };
  }

  static calculateExtendedBmiMetrics(
    bmi: number,
    ageMonths: number,
    gender: 'male' | 'female',
  ): IExtendedBmiResult {
    const defaultResult: IExtendedBmiResult = {
      bmi,
      bmiP95Percent: 0,
      bmiAt95th: 0,
      classification: 'unknown',
      classificationLabelAr: BMI_EXTENDED_LABELS.unknown,
      zScoreForAge: 0,
    };

    if (!bmi || bmi <= 0 || ageMonths < 0) return defaultResult;

    let lmsData: WhoLmsPoint[];

    if (ageMonths <= 60) {
      lmsData = getCdcRefData(gender, 'bmifa');
    } else if (ageMonths <= 228) {
      lmsData = getAdolescentRefData(gender, 'bmifa');
    } else {
      return defaultResult;
    }

    const closest = findClosestLms(lmsData, ageMonths);
    if (!closest) return defaultResult;

    const bmiAt85th = this.computeBmiAt85th(closest.l, closest.m, closest.s);
    const bmiAt95th = this.computeBmiAt95th(closest.l, closest.m, closest.s);

    if (bmi < bmiAt85th) {
      return {
        bmi,
        bmiP95Percent: Math.round((bmi / bmiAt95th) * 10000) / 100,
        bmiAt95th,
        classification: 'normal',
        classificationLabelAr: BMI_EXTENDED_LABELS.normal,
        zScoreForAge: 0,
      };
    }

    const { classification, bmiP95Percent } = this.classifyExtendedBmi(bmi, bmiAt95th);

    return {
      bmi: Math.round(bmi * 100) / 100,
      bmiP95Percent,
      bmiAt95th,
      classification,
      classificationLabelAr: BMI_EXTENDED_LABELS[classification],
      zScoreForAge: Math.round(((bmi - bmiAt95th) / (bmiAt95th - bmiAt85th)) * 100) / 100,
    };
  }
}
