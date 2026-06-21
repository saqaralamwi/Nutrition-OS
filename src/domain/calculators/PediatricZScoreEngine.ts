import { getDatabase } from '../../data/database';
import { Q } from '@nozbe/watermelondb';
import { getCdcRefData } from '../data/cdcRefData';
import { computeZScoreFromReference } from '../data/whoGrowthReference';
import { getAdolescentRefData } from '../data/adolescentRefData';
import { Cdc2022ExtendedBmiEngine } from './Cdc2022ExtendedBmiEngine';
import type { IExtendedBmiResult } from './Cdc2022ExtendedBmiEngine';

export type GrowthStandard = 'WHO' | 'CDC' | 'WHO_2007_Adolescent';

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
  classification: 'severely_low' | 'low' | 'normal' | 'high' | 'severely_high' | 'unknown';
  isSafe: boolean;
  errorMessage?: string;
  action?: string;
  standard: GrowthStandard;
}

export type StuntingLevel = 'normal' | 'at_risk' | 'moderate' | 'severe';

export interface IStuntingResult {
  zScore: number;
  level: StuntingLevel;
  label: string;
  directive: string;
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

function selectDefaultStandard(ageMonths: number): GrowthStandard {
  if (ageMonths <= 24) return 'WHO';
  return 'CDC';
}

function zScoreBoundsCheck(zScore: number, measurementValue: number, ageMonths: number): void {
  if (zScore < -6 || zScore > 6) {
    throw new Error(
      '⚠️ قيمة zScore خارج الحدود الآمنة (-6 إلى 6). يرجى التحقق من البيانات (القياس: ' +
      measurementValue + ', العمر: ' + ageMonths + ' شهرًا).',
    );
  }
}

export class PediatricZScoreEngine {
  public static async calculateZScore(input: IZScoreInput): Promise<IZScoreResult> {
    if (!input.measurementValue || input.measurementValue <= 0) {
      return {
        zScore: 0,
        classification: 'unknown',
        isSafe: false,
        errorMessage: 'قيمة القياس يجب أن تكون أكبر من صفر',
        action: 'إدخال يدوي',
        standard: input.standard || selectDefaultStandard(input.ageMonths),
      };
    }

    const standard = input.standard || selectDefaultStandard(input.ageMonths);
    const isWeightBased = ['wfa', 'wfh', 'bmifa'].includes(input.indicatorType);

    if (standard === 'CDC') {
      return this.calculateCdcZScore(input, isWeightBased);
    }

    const isAdolescent = input.ageMonths > 60 && input.ageMonths <= 228;
    if (standard === 'WHO_2007_Adolescent' || (standard === 'WHO' && isAdolescent)) {
      return this.calculateAdolescentZScore(input);
    }

    if (input.ageMonths > 228) {
      return {
        zScore: 0,
        classification: 'unknown',
        isSafe: false,
        errorMessage: 'العمر يتجاوز الحد الأقصى للمراجع المتاحة (228 شهرًا)',
        action: 'إدخال يدوي',
        standard,
      };
    }

    return this.calculateWhoZScore(input, isWeightBased);
  }

  private static async calculateWhoZScore(
    input: IZScoreInput,
    isWeightBased: boolean,
  ): Promise<IZScoreResult> {
    const db = await getDatabase();
    const whoTable = db.get('who_growth_standards');
    if (!whoTable) {
      console.warn('[PediatricZScoreEngine] who_growth_standards table not found — falling back to static WHO reference data');
      return this.fallbackToStaticReference(input);
    }
    const records = await whoTable.query(
      Q.where('gender', input.gender),
      Q.where('indicator_type', input.indicatorType),
    ).fetch();

    if (records.length === 0) {
      return {
        zScore: 0,
        classification: 'unknown',
        isSafe: false,
        errorMessage: 'لم يتم العثور على بيانات مرجعية لمنظمة الصحة العالمية للمعايير المحددة',
        action: 'إدخال يدوي',
        standard: 'WHO',
      };
    }

    const axisField = input.indicatorType === 'wfh' ? 'length_height_cm' : 'age_months';
    const targetValue = input.indicatorType === 'wfh'
      ? (input.lengthHeightCm ?? input.ageMonths)
      : input.ageMonths;

    const rawRecords = records.map((r) => r._raw as unknown as WhoGrowthRecord);
    const closest = findClosestLms(rawRecords, targetValue, axisField);

    const zScoreRaw = computeAdjustedZScore(
      input.measurementValue,
      closest.l_value,
      closest.m_value,
      closest.s_value,
      isWeightBased,
    );

    const zScore = Math.round(zScoreRaw * 100) / 100;

    if (zScore < -6 || zScore > 6) {
      return {
        zScore: 0,
        classification: 'unknown',
        isSafe: false,
        errorMessage: '⚠️ قيمة zScore خارج الحدود الآمنة (-6 إلى 6). يرجى التحقق من البيانات.',
        action: 'إدخال يدوي',
        standard: 'WHO',
      };
    }

    return {
      zScore,
      classification: classifyZScore(zScore),
      isSafe: true,
      standard: 'WHO',
    };
  }

  private static fallbackToStaticReference(input: IZScoreInput): IZScoreResult {
    const indicatorMap: Record<string, 'wfa' | 'lhfa' | 'bmifa'> = {
      wfa: 'wfa',
      lhfa: 'lhfa',
      wfh: 'lhfa',
      bmifa: 'bmifa',
      hfa: 'lhfa',
      bfa: 'bmifa',
      wfl: 'lhfa',
    };
    const mappedIndicator = indicatorMap[input.indicatorType] || 'wfa';
    const result = computeZScoreFromReference(
      input.measurementValue,
      input.ageMonths,
      input.gender,
      mappedIndicator,
    );

    const classification = classifyZScore(result.zScore);

    return {
      zScore: result.zScore,
      classification: classification as IZScoreResult['classification'],
      isSafe: true,
      standard: 'WHO',
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
        classification: 'unknown',
        isSafe: false,
        errorMessage: 'لم يتم العثور على بيانات مرجعية لمراكز السيطرة على الأمراض',
        action: 'إدخال يدوي',
        standard: 'CDC',
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
      standard: 'CDC',
    };
  }

  private static calculateAdolescentZScore(input: IZScoreInput): IZScoreResult {
    const { indicatorType, ageMonths, gender } = input;
    const isWeightBased = indicatorType === 'wfa' || indicatorType === 'bmifa';

    if (ageMonths < 61 || ageMonths > 228) {
      return {
        zScore: 0,
        classification: 'unknown',
        isSafe: false,
        errorMessage: 'مرجع WHO 2007 للمراهقين يغطي 61–228 شهرًا فقط',
        action: 'إدخال يدوي',
        standard: 'WHO_2007_Adolescent',
      };
    }

    if (indicatorType === 'wfa' && ageMonths > 120) {
      return {
        zScore: 0,
        classification: 'unknown',
        isSafe: false,
        errorMessage: 'مرجع الوزن حسب العمر WHO 2007 للمراهقين يغطي 61–120 شهرًا فقط',
        action: 'إدخال يدوي',
        standard: 'WHO_2007_Adolescent',
      };
    }

    const mappedIndicator = indicatorType === 'wfh' ? 'lhfa' : indicatorType;
    const adolescentData = getAdolescentRefData(gender, mappedIndicator);
    if (adolescentData.length === 0) {
      return {
        zScore: 0,
        classification: 'unknown',
        isSafe: false,
        errorMessage: 'لم يتم العثور على بيانات مرجعية للمراهقين',
        action: 'إدخال يدوي',
        standard: 'WHO_2007_Adolescent',
      };
    }

    const closest = adolescentData.reduce((prev, curr) => {
      const prevDiff = Math.abs(prev.ageMonths - ageMonths);
      const currDiff = Math.abs(curr.ageMonths - ageMonths);
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
      standard: 'WHO_2007_Adolescent',
    };
  }

  public static async calculateStuntingIndex(
    ageInMonths: number,
    heightCm: number,
    gender: 'male' | 'female',
    standard?: GrowthStandard,
  ): Promise<IStuntingResult> {
    if (!heightCm || heightCm <= 0 || ageInMonths < 0) {
      return { zScore: 0, level: 'normal', label: 'نمو طبيعي', directive: 'الرجاء إدخال الطول والعمر' };
    }

    const engineStandard = ageInMonths > 60 && ageInMonths <= 228
      ? 'WHO_2007_Adolescent'
      : (standard || selectDefaultStandard(ageInMonths));

    const result = await this.calculateZScore({
      gender,
      indicatorType: 'lhfa',
      measurementValue: heightCm,
      ageMonths: ageInMonths,
      standard: engineStandard,
    });

    let zScore: number;
    if (result.isSafe) {
      zScore = result.zScore;
    } else {
      const fallback = computeZScoreFromReference(heightCm, ageInMonths, gender, 'lhfa');
      zScore = fallback.zScore;
    }

    let level: StuntingLevel;
    let label: string;
    let directive: string;

    if (zScore > -1) {
      level = 'normal';
      label = 'نمو طبيعي';
      directive = 'المتابعة الروتينية حسب الجدول الزمني الموصى به';
    } else if (zScore >= -2) {
      level = 'at_risk';
      label = 'خطر التقزم (Mild)';
      directive = 'متابعة غذائية وقائية — تقييم النظام الغذائي وتحسين المدخول الغذائي';
    } else if (zScore >= -3) {
      level = 'moderate';
      label = 'تقزم متوسط (Moderate Stunting)';
      directive = 'متابعة غذائية مكثفة — تحويل لأخصائي تغذية أطفال، تقييم التدخلات الغذائية';
    } else {
      level = 'severe';
      label = 'تقزم حاد (Severe Stunting)';
      directive = 'تدخل غذائي عاجل — تحويل فوري لأخصائي تغذية أطفال، تقييم شامل للحالة';
    }

    return { zScore, level, label, directive };
  }

  public static calculateExtendedBmiMetrics(
    bmi: number,
    ageMonths: number,
    gender: 'male' | 'female',
  ): IExtendedBmiResult {
    return Cdc2022ExtendedBmiEngine.calculateExtendedBmiMetrics(bmi, ageMonths, gender);
  }
}
