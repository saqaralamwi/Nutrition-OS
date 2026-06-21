import { WhoLmsPoint } from '../data/whoGrowthReference';
import {
  WFA_BOYS,
  WFA_GIRLS,
  LHFA_BOYS,
  LHFA_GIRLS,
  BMIFA_BOYS,
  BMIFA_GIRLS,
} from '../data/whoGrowthReference';
import {
  HCFA_BOYS,
  HCFA_GIRLS,
  WFL_WFH_BOYS,
  WFL_WFH_GIRLS,
} from '../data/pediatricMockRefData';
import {
  CDC2000_WFA_BOYS,
  CDC2000_WFA_GIRLS,
  CDC2000_SFA_BOYS,
  CDC2000_SFA_GIRLS,
  CDC2000_BMIFA_BOYS,
  CDC2000_BMIFA_GIRLS,
} from '../data/cdc2000RefData';

export interface IIndicatorCalculationResult {
  zScore: number;
  percentile: number;
  classification: string;
  classificationAr: string;
  isRedFlag: boolean;
}

export interface IPediatricGrowthResult {
  ageInMonths: number;
  sex: 'male' | 'female';
  standardUsed: 'WHO' | 'CDC' | 'CDC_EXTENDED';
  weightForAge?: IIndicatorCalculationResult;
  heightForAge?: IIndicatorCalculationResult;
  bmiForAge?: IIndicatorCalculationResult;
  headCircumferenceForAge?: IIndicatorCalculationResult;
  weightForLengthOrHeight?: IIndicatorCalculationResult;
  extendedBmiObesityClass?: 'class_ii' | 'class_iii' | 'none';
  extendedBmiObesityClassLabelAr?: string;
  percentageOf95thBmi?: number;
  clinicalFlags: string[];
  clinicalFlagsAr: string[];
}

export class PediatricGrowthEngine {
  /**
   * Performs Box-Cox power exponential LMS calculation.
   * Z = (((X / M) ^ L) - 1) / (L * S)
   * If L = 0: Z = ln(X / M) / S
   */
  public static calculateLmsZScore(x: number, l: number, m: number, s: number): number {
    if (m <= 0 || s === 0) return 0;
    let z: number;
    if (Math.abs(l) < 1e-7) {
      z = Math.log(x / m) / s;
    } else {
      z = (Math.pow(x / m, l) - 1) / (l * s);
    }
    return Math.round(z * 100) / 100;
  }

  /**
   * Reverse LMS formula to find value corresponding to a Z-score.
   * X = M * (1 + Z * L * S)^(1/L)
   * If L = 0: X = M * exp(Z * S)
   */
  public static calculateValueFromLms(z: number, l: number, m: number, s: number): number {
    if (Math.abs(l) < 1e-7) {
      return m * Math.exp(z * s);
    }
    const val = 1 + z * l * s;
    if (val <= 0) return 0;
    return m * Math.pow(val, 1 / l);
  }

  /**
   * Approximates the error function (erf) using Abramowitz and Stegun formula.
   * Accuracy: 1.5 x 10^-7
   */
  public static erf(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    const absX = Math.abs(x);

    const t = 1.0 / (1.0 + p * absX);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

    return sign * y;
  }

  /**
   * Converts Z-score to standard percentile.
   */
  public static zScoreToPercentile(z: number): number {
    const normalCDF = 0.5 * (1 + this.erf(z / Math.sqrt(2)));
    const pct = normalCDF * 100;
    return Math.round(pct * 10) / 10;
  }

  /**
   * Finds the closest LMS reference point from data array.
   */
  private static findClosestLms(data: WhoLmsPoint[], target: number): WhoLmsPoint {
    if (data.length === 0) {
      throw new Error('Reference data array is empty');
    }
    return data.reduce((prev, curr) => 
      Math.abs(curr.ageMonths - target) < Math.abs(prev.ageMonths - target) ? curr : prev
    );
  }

  /**
   * Main calculation engine that routes to correct standard based on age.
   */
  public static calculate(
    ageInMonths: number,
    sex: 'male' | 'female',
    weightInKg?: number,
    heightInCm?: number,
    headCircumferenceInCm?: number
  ): IPediatricGrowthResult {
    if (ageInMonths < 0 || ageInMonths > 240) {
      throw new Error('Age must be between 0 and 240 months');
    }

    const isWho = ageInMonths <= 60;
    let standardUsed: 'WHO' | 'CDC' | 'CDC_EXTENDED' = isWho ? 'WHO' : 'CDC';

    const result: IPediatricGrowthResult = {
      ageInMonths,
      sex,
      standardUsed,
      clinicalFlags: [],
      clinicalFlagsAr: [],
    };

    // Calculate BMI
    let bmi: number | undefined;
    if (weightInKg && heightInCm && heightInCm > 0) {
      const heightInMeters = heightInCm / 100;
      bmi = weightInKg / (heightInMeters * heightInMeters);
    }

    if (isWho) {
      // 1. WHO Standards (0 to 60 months)
      
      // Weight-for-Age
      if (weightInKg) {
        const ref = sex === 'male' ? WFA_BOYS : WFA_GIRLS;
        const lms = this.findClosestLms(ref, ageInMonths);
        result.weightForAge = this.buildResult(weightInKg, lms);
      }

      // Length/Height-for-Age
      if (heightInCm) {
        const ref = sex === 'male' ? LHFA_BOYS : LHFA_GIRLS;
        const lms = this.findClosestLms(ref, ageInMonths);
        result.heightForAge = this.buildResult(heightInCm, lms);
      }

      // BMI-for-Age
      if (bmi) {
        const ref = sex === 'male' ? BMIFA_BOYS : BMIFA_GIRLS;
        const lms = this.findClosestLms(ref, ageInMonths);
        result.bmiForAge = this.buildResult(bmi, lms);
      }

      // Head Circumference-for-Age
      if (headCircumferenceInCm) {
        const ref = sex === 'male' ? HCFA_BOYS : HCFA_GIRLS;
        const lms = this.findClosestLms(ref, ageInMonths);
        result.headCircumferenceForAge = this.buildResult(headCircumferenceInCm, lms);
      }

      // Weight-for-Length/Height
      if (weightInKg && heightInCm) {
        // Under 24 months: Weight-for-Length
        // 24 to 60 months: Weight-for-Height
        const ref = sex === 'male' ? WFL_WFH_BOYS : WFL_WFH_GIRLS;
        const lms = this.findClosestLms(ref, heightInCm);
        result.weightForLengthOrHeight = this.buildResult(weightInKg, lms);
      }
    } else {
      // 2. CDC Standards (> 60 to 240 months)
      
      // Weight-for-Age
      if (weightInKg) {
        const ref = sex === 'male' ? CDC2000_WFA_BOYS : CDC2000_WFA_GIRLS;
        const lms = this.findClosestLms(ref, ageInMonths);
        result.weightForAge = this.buildResult(weightInKg, lms);
      }

      // Stature-for-Age
      if (heightInCm) {
        const ref = sex === 'male' ? CDC2000_SFA_BOYS : CDC2000_SFA_GIRLS;
        const lms = this.findClosestLms(ref, ageInMonths);
        result.heightForAge = this.buildResult(heightInCm, lms);
      }

      // BMI-for-Age & CDC 2022 Extended BMI Obesity logic
      if (bmi) {
        const ref = sex === 'male' ? CDC2000_BMIFA_BOYS : CDC2000_BMIFA_GIRLS;
        const lms = this.findClosestLms(ref, ageInMonths);
        result.bmiForAge = this.buildResult(bmi, lms);

        // Extended BMI calculations
        if (result.bmiForAge.percentile >= 95) {
          const bmi95 = this.calculateValueFromLms(1.64485, lms.l, lms.m, lms.s);
          if (bmi95 > 0) {
            const percentage = (bmi / bmi95) * 100;
            result.percentageOf95thBmi = Math.round(percentage * 10) / 10;
            result.standardUsed = 'CDC_EXTENDED';

            if (bmi >= 40 || percentage >= 140) {
              result.extendedBmiObesityClass = 'class_iii';
              result.extendedBmiObesityClassLabelAr = 'سمنة شديدة درجة ثالثة (Class III)';
            } else if (bmi >= 35 || percentage >= 120) {
              result.extendedBmiObesityClass = 'class_ii';
              result.extendedBmiObesityClassLabelAr = 'سمنة شديدة درجة ثانية (Class II)';
            } else {
              result.extendedBmiObesityClass = 'none';
            }
          }
        }
      }
    }

    // Evaluate Clinical Flags and Alerts
    this.evaluateClinicalFlags(result);

    return result;
  }

  /**
   * Builds single indicator result.
   */
  private static buildResult(x: number, lms: WhoLmsPoint): IIndicatorCalculationResult {
    const zScore = this.calculateLmsZScore(x, lms.l, lms.m, lms.s);
    const percentile = this.zScoreToPercentile(zScore);

    let classification = 'Normal';
    let classificationAr = 'طبيعي';

    if (zScore < -3) {
      classification = 'Severe Deficit';
      classificationAr = 'نقص شديد';
    } else if (zScore < -2) {
      classification = 'Moderate Deficit';
      classificationAr = 'نقص متوسط';
    } else if (zScore > 3) {
      classification = 'Severe Excess';
      classificationAr = 'زيادة شديدة';
    } else if (zScore > 2) {
      classification = 'Moderate Excess';
      classificationAr = 'زيادة متوسطة';
    }

    const isRedFlag = percentile < 5 || percentile > 95;

    return {
      zScore,
      percentile,
      classification,
      classificationAr,
      isRedFlag,
    };
  }

  /**
   * Evaluates and populates clinical flags based on clinical thresholds.
   */
  private static evaluateClinicalFlags(result: IPediatricGrowthResult): void {
    const cf = result.clinicalFlags;
    const cfa = result.clinicalFlagsAr;

    // Height-for-Age < -2: Stunting
    if (result.heightForAge && result.heightForAge.zScore < -2) {
      cf.push('Stunting');
      cfa.push('تقزم (Stunting)');
    }

    // Weight-for-Height/Length < -2: Wasting
    if (result.weightForLengthOrHeight && result.weightForLengthOrHeight.zScore < -2) {
      cf.push('Wasting');
      cfa.push('هزال (Wasting)');
    }

    // Weight-for-Age < -3: Severe Underweight
    if (result.weightForAge && result.weightForAge.zScore < -3) {
      cf.push('Severe Underweight');
      cfa.push('نقص وزن شديد (Severe Underweight)');
    }

    // Red Flags: percentile < 5 or > 95
    if (result.weightForAge && (result.weightForAge.percentile < 5 || result.weightForAge.percentile > 95)) {
      cf.push('Weight Out of Range');
      cfa.push('تحذير: الوزن خارج النطاق الطبيعي (أقل من 5% أو أعلى من 95%)');
    }

    if (result.heightForAge && (result.heightForAge.percentile < 5 || result.heightForAge.percentile > 95)) {
      cf.push('Height Out of Range');
      cfa.push('تحذير: الطول خارج النطاق الطبيعي (أقل من 5% أو أعلى من 95%)');
    }

    if (result.bmiForAge) {
      if (result.bmiForAge.percentile < 5) {
        cf.push('Underweight BMI');
        cfa.push('تحذير: مؤشر كتلة الجسم منخفض جداً (نحافة)');
      } else if (result.bmiForAge.percentile > 95) {
        if (result.extendedBmiObesityClass === 'class_ii' || result.extendedBmiObesityClass === 'class_iii') {
          cf.push(`Severe Obesity ${result.extendedBmiObesityClass === 'class_ii' ? 'Class II' : 'Class III'}`);
          cfa.push(`تحذير: سمنة مفرطة شديدة (${result.extendedBmiObesityClassLabelAr})`);
        } else {
          cf.push('Obesity');
          cfa.push('تحذير: مؤشر كتلة الجسم مرتفع (سمنة)');
        }
      }
    }
  }
}
