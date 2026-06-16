import type { IIcuInput, IIcuOutput } from '../../data/types/critical_care';

export class IcuCriticalCareEngine {
  public static evaluateIcuNutrition(input: IIcuInput): IIcuOutput {
    const { mifflinRmr, isMechanicallyVentilated, maxTemperatureCelsius, minuteVentilationLmin, refeedingRiskLevel } = input;

    if (mifflinRmr <= 0 || maxTemperatureCelsius < 32 || maxTemperatureCelsius > 45) {
      return {
        icuEnergyTarget: 0,
        initialCaloricCeiling: 0,
        isRefeedingRestrictionEnforced: false,
        isSafe: false,
        arabicClinicalAlerts: ['بيانات غير صالحة: تأكد من معدل الأيض الأساسي ودرجة الحرارة'],
      };
    }

    if (isMechanicallyVentilated && minuteVentilationLmin <= 0) {
      return {
        icuEnergyTarget: 0,
        initialCaloricCeiling: 0,
        isRefeedingRestrictionEnforced: false,
        isSafe: false,
        arabicClinicalAlerts: ['التهوية الدقيقة غير صالحة للمريض على جهاز التنفس'],
      };
    }

    let icuEnergyTarget: number;

    if (isMechanicallyVentilated) {
      icuEnergyTarget = IcuCriticalCareEngine.round2(
        (mifflinRmr * 0.92) + (minuteVentilationLmin * 115) + (maxTemperatureCelsius * 33) - 1461,
      );
    } else {
      const feverFactor = 1 + (Math.max(0, maxTemperatureCelsius - 37) * 0.13);
      icuEnergyTarget = IcuCriticalCareEngine.round2(mifflinRmr * feverFactor);
    }

    let initialCaloricCeiling: number;
    let isRefeedingRestrictionEnforced: boolean;
    const alerts: string[] = [];

    if (refeedingRiskLevel === 'high') {
      initialCaloricCeiling = IcuCriticalCareEngine.round2(icuEnergyTarget * 0.25);
      isRefeedingRestrictionEnforced = true;
      alerts.push(
        '🚨 حظر أيضي حرج (خطر متلازمة إعادة التغذية): المريض مصنف بخطورة عالية جداً للإصابة بـ Refeeding Syndrome. تم كبح سقوف الطاقة إجبارياً إلى 25% لحماية الخلايا من الانهيار الأيوني. يمنع زيادة السعرات إلا بعد استقرار الفوسفور والبوتاسيوم والمغنيسيوم في الدم',
      );
    } else if (refeedingRiskLevel === 'moderate') {
      initialCaloricCeiling = IcuCriticalCareEngine.round2(icuEnergyTarget * 0.50);
      isRefeedingRestrictionEnforced = true;
      alerts.push(
        '⚠️ تنبيه وقائي (خطر إعادة التغذية): تم تقييد الإمداد الطاقي إلى 50% كإجراء حماية أولي لتهيئة خلايا المريض أيضياً',
      );
    } else {
      initialCaloricCeiling = icuEnergyTarget;
      isRefeedingRestrictionEnforced = false;
    }

    return {
      icuEnergyTarget,
      initialCaloricCeiling,
      isRefeedingRestrictionEnforced,
      isSafe: true,
      arabicClinicalAlerts: alerts,
    };
  }

  private static round2(value: number): number {
    return parseFloat(value.toFixed(2));
  }
}
