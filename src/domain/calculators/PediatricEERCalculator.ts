export interface PediatricEERCalcInput {
  ageInMonths: number;
  weightKg: number;
  heightCm: number;
  gender: 'MALE' | 'FEMALE';
  isCriticallyIll: boolean;
  hasFever: boolean;
}

export interface PediatricEERCalcOutput {
  eerKcal: number;
  kcalPerKg: number;
  isSafe: boolean;
  appliedAdjustment: string;
}

export class PediatricEERCalculator {
  private static readonly ESPEN_WEIGHT_RANGES = [
    { minKg: 0, maxKg: 10, baseKcal: 100 },
    { minKg: 10, maxKg: 20, baseKcal: 1000 },
    { minKg: 20, maxKg: Infinity, baseKcal: 1500 },
  ];

  public static calculate(input: PediatricEERCalcInput): PediatricEERCalcOutput {
    const { ageInMonths, weightKg, heightCm, gender, isCriticallyIll, hasFever } = input;

    if (isNaN(weightKg) || weightKg <= 0) {
      return { eerKcal: 0, kcalPerKg: 0, isSafe: false, appliedAdjustment: 'الوزن غير صالح' };
    }

    if (isNaN(ageInMonths) || ageInMonths < 0) {
      return { eerKcal: 0, kcalPerKg: 0, isSafe: false, appliedAdjustment: 'العمر غير صالح' };
    }

    if (isNaN(heightCm) || heightCm <= 0) {
      return { eerKcal: 0, kcalPerKg: 0, isSafe: false, appliedAdjustment: 'الطول غير صالح' };
    }

    let eer: number;

    if (ageInMonths < 1) {
      eer = weightKg * 120;
    } else if (ageInMonths < 12) {
      eer = weightKg * 100;
    } else if (ageInMonths < 36) {
      eer = weightKg * 95;
    } else if (gender === 'MALE') {
      eer = 88.5 - (61.9 * (ageInMonths / 12)) + 1.13 * (26.7 * weightKg + 903 * (heightCm / 100)) + 25;
    } else {
      eer = 135.3 - (30.8 * (ageInMonths / 12)) + 1.16 * (10.0 * weightKg + 934 * (heightCm / 100)) + 20;
    }

    let adjustment = 'لا يوجد تعديل';

    if (isCriticallyIll) {
      eer *= 1.3;
      adjustment = 'تطبيق معامل الحالات الحرجة (×1.3)';
    }

    if (hasFever) {
      eer *= 1.12;
      adjustment += adjustment === 'لا يوجد تعديل' ? 'تطبيق معامل الحمى (×1.12)' : ' + الحمى (×1.12)';
    }

    if (eer < 0) {
      eer = 0;
      adjustment = 'تم تطبيق الحد الأدنى للسعرات';
    }

    const kcalPerKg = parseFloat((eer / weightKg).toFixed(2));

    return {
      eerKcal: Math.round(eer),
      kcalPerKg,
      isSafe: true,
      appliedAdjustment: adjustment,
    };
  }
}
