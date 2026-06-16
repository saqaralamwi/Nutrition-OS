export interface IIcuLipidInput {
  targetCalories: number;
  propofolInfusionRateMlHr: number;
  clevedipineInfusionRateMlHr?: number;
}

export interface IIcuLipidOutput {
  propofolDailyVolumeMl: number;
  totalHiddenLipidCalories: number;
  netCaloricRequirement: number;
  isOverfeedingRisk: boolean;
  isSafe: boolean;
  clinicalAlerts: string[];
}

export class IcuLipidCalorieEngine {
  private static readonly PROPOFOL_KCAL_PER_ML = 1.1;
  private static readonly CLEVEDIPINE_KCAL_PER_ML = 2.0;

  public static calculateNetRequirements(input: IIcuLipidInput): IIcuLipidOutput {
    const { targetCalories, propofolInfusionRateMlHr, clevedipineInfusionRateMlHr } = input;

    if (targetCalories <= 0 || propofolInfusionRateMlHr < 0) {
      return {
        propofolDailyVolumeMl: 0,
        totalHiddenLipidCalories: 0,
        netCaloricRequirement: 0,
        isOverfeedingRisk: false,
        isSafe: false,
        clinicalAlerts: ['الرجاء التحقق من المدخلات؛ السعرات الحرارية المستهدفة أو معدل التسريب غير صالح'],
      };
    }

    const propofolDailyVolumeMl = IcuLipidCalorieEngine.round2(propofolInfusionRateMlHr * 24);
    const propofolDailyCalories = IcuLipidCalorieEngine.round2(propofolDailyVolumeMl * IcuLipidCalorieEngine.PROPOFOL_KCAL_PER_ML);
    const clevedipineDailyCalories = IcuLipidCalorieEngine.round2(
      (clevedipineInfusionRateMlHr || 0) * 24 * IcuLipidCalorieEngine.CLEVEDIPINE_KCAL_PER_ML,
    );
    const totalHiddenLipidCalories = IcuLipidCalorieEngine.round2(
      propofolDailyCalories + clevedipineDailyCalories,
    );

    const rawNet = targetCalories - totalHiddenLipidCalories;
    const netCaloricRequirement = IcuLipidCalorieEngine.round2(rawNet > 0 ? rawNet : 0);

    const overfeedingThreshold = targetCalories * 0.30;
    const isOverfeedingRisk = totalHiddenLipidCalories > overfeedingThreshold;

    const alerts: string[] = [];

    if (isOverfeedingRisk) {
      alerts.push(
        `تحذير: السعرات الدهنية الخفية (${totalHiddenLipidCalories} سعرة) تتجاوز 30% من السعرات المستهدفة (${targetCalories} سعرة) - خطر فرط التغذية`,
      );
    }
    if (netCaloricRequirement <= 0) {
      alerts.push('تنبيه: تم ضبط السعرات المطلوبة على صفر بسبب تجاوز السعرات الدهنية الخفية للسعرات المستهدفة');
    }

    alerts.push(
      `السعرات الدهنية الخفية من البروبوفول: ${propofolDailyCalories} سعرة/يوم`,
      `صافي الاحتياج السعري بعد خصم السعرات الدهنية: ${netCaloricRequirement} سعرة/يوم`,
    );

    return {
      propofolDailyVolumeMl,
      totalHiddenLipidCalories,
      netCaloricRequirement,
      isOverfeedingRisk,
      isSafe: true,
      clinicalAlerts: alerts,
    };
  }

  private static round2(value: number): number {
    return parseFloat(value.toFixed(2));
  }
}
