export interface IRefeedingInput {
  serumPhosphorus: number;
  serumPotassium: number;
  serumMagnesium: number;
  daysOfStarvationOrSevereMalnutrition: number;
  plannedInitialCalories: number;
  weightKg: number;
}

export type RiskTier = 'critical' | 'moderate' | 'low';

export interface IRefeedingResult {
  riskTier: RiskTier;
  isCalorieCapTriggered: boolean;
  maxSafeCaloriesCeiling: number;
  adjustedCalories: number;
  isSafe: boolean;
  arabicClinicalAlerts: string[];
}

export class RefeedingSyndromeMonitor {
  public static evaluateRefeedingRisk(input: IRefeedingInput): IRefeedingResult {
    const {
      serumPhosphorus,
      serumPotassium,
      serumMagnesium,
      daysOfStarvationOrSevereMalnutrition,
      plannedInitialCalories,
      weightKg,
    } = input;

    if (isNaN(weightKg) || isNaN(plannedInitialCalories) || isNaN(daysOfStarvationOrSevereMalnutrition) || weightKg <= 0 || plannedInitialCalories <= 0 || daysOfStarvationOrSevereMalnutrition < 0) {
      return {
        riskTier: 'low',
        isCalorieCapTriggered: false,
        maxSafeCaloriesCeiling: 0,
        adjustedCalories: 0,
        isSafe: false,
        arabicClinicalAlerts: ['الرجاء التحقق من المدخلات؛ الوزن والسعرات الحرارية يجب أن تكون أكبر من الصفر'],
      };
    }

    const riskTier = RefeedingSyndromeMonitor.resolveRiskTier(input);
    const alerts: string[] = [];

    let adjustedCalories: number;
    let isCalorieCapTriggered: boolean;
    let maxSafeCaloriesCeiling: number;

    if (riskTier === 'critical' || riskTier === 'moderate') {
      maxSafeCaloriesCeiling = RefeedingSyndromeMonitor.round2(weightKg * 15);
      if (plannedInitialCalories > maxSafeCaloriesCeiling) {
        isCalorieCapTriggered = true;
        adjustedCalories = maxSafeCaloriesCeiling;
        alerts.push(
          `تم تطبيق الحد الآمن للسعرات: ${maxSafeCaloriesCeiling} سعرة/يوم (${weightKg} كغ × 15) بدلاً من ${plannedInitialCalories} سعرة`,
        );
      } else {
        isCalorieCapTriggered = false;
        adjustedCalories = plannedInitialCalories;
      }
    } else {
      maxSafeCaloriesCeiling = 0;
      isCalorieCapTriggered = false;
      adjustedCalories = plannedInitialCalories;
    }

    if (riskTier === 'critical') {
      alerts.push('خطر شديد لمتلازمة إعادة التغذية - يجب البدء بكمية سعرات منخفضة جداً وزيادتها تدريجياً');
    } else if (riskTier === 'moderate') {
      alerts.push('خطر متوسط لمتلازمة إعادة التغذية - يجب مراقبة الشوارد يومياً');
    } else {
      alerts.push('خطر منخفض لمتلازمة إعادة التغذية');
    }

    if (daysOfStarvationOrSevereMalnutrition >= 10) {
      alerts.push(`تنبيه: فترة صيام طويلة (${daysOfStarvationOrSevereMalnutrition} يوماً) - خطر متلازمة إعادة التغذية`);
    }

    return {
      riskTier,
      isCalorieCapTriggered,
      maxSafeCaloriesCeiling,
      adjustedCalories: RefeedingSyndromeMonitor.round2(adjustedCalories),
      isSafe: true,
      arabicClinicalAlerts: alerts,
    };
  }

  private static resolveRiskTier(input: IRefeedingInput): RiskTier {
    const { serumPhosphorus, serumPotassium, serumMagnesium, daysOfStarvationOrSevereMalnutrition } = input;

    if (
      isNaN(serumPhosphorus) ||
      isNaN(serumPotassium) ||
      isNaN(serumMagnesium) ||
      isNaN(daysOfStarvationOrSevereMalnutrition) ||
      serumPhosphorus < 2.5 ||
      serumPotassium < 3.5 ||
      serumMagnesium < 1.5 ||
      daysOfStarvationOrSevereMalnutrition >= 10
    ) {
      return 'critical';
    }

    if (
      (serumPhosphorus >= 2.5 && serumPhosphorus <= 3.0) ||
      (serumPotassium >= 3.5 && serumPotassium <= 3.8) ||
      (serumMagnesium >= 1.5 && serumMagnesium <= 1.8) ||
      (daysOfStarvationOrSevereMalnutrition >= 5 && daysOfStarvationOrSevereMalnutrition < 10)
    ) {
      return 'moderate';
    }

    return 'low';
  }

  private static round2(value: number): number {
    return parseFloat(value.toFixed(2));
  }
}
