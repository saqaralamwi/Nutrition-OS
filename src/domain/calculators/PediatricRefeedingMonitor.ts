export type PediatricRfsTier = 'critical' | 'moderate' | 'low';

export interface PediatricRefeedingInput {
  serumPhosphorus: number;
  serumPotassium: number;
  serumMagnesium: number;
  weightKg: number;
  daysOfMalnutrition: number;
  plannedKcal: number;
}

export interface PediatricRefeedingOutput {
  riskTier: PediatricRfsTier;
  adjustedKcal: number;
  isCapApplied: boolean;
  isSafe: boolean;
  alerts: string[];
}

export class PediatricRefeedingMonitor {
  private static readonly CRITICAL_PHOSPHORUS = 2.5;
  private static readonly CRITICAL_POTASSIUM = 3.5;
  private static readonly CRITICAL_MAGNESIUM = 1.5;
  private static readonly CRITICAL_DAYS = 10;

  private static readonly MODERATE_PHOSPHORUS_MIN = 2.5;
  private static readonly MODERATE_PHOSPHORUS_MAX = 3.0;
  private static readonly MODERATE_POTASSIUM_MIN = 3.5;
  private static readonly MODERATE_POTASSIUM_MAX = 3.8;
  private static readonly MODERATE_MAGNESIUM_MIN = 1.5;
  private static readonly MODERATE_MAGNESIUM_MAX = 1.8;

  private static readonly PEDIATRIC_KCAL_PER_KG = 10;

  public static evaluate(input: PediatricRefeedingInput): PediatricRefeedingOutput {
    const { serumPhosphorus, serumPotassium, serumMagnesium, weightKg, daysOfMalnutrition, plannedKcal } = input;

    if (
      isNaN(weightKg) || isNaN(plannedKcal) || isNaN(daysOfMalnutrition) ||
      weightKg <= 0 || plannedKcal <= 0 || daysOfMalnutrition < 0
    ) {
      return {
        riskTier: 'low',
        adjustedKcal: 0,
        isCapApplied: false,
        isSafe: false,
        alerts: ['الرجاء التحقق من المدخلات؛ جميع القيم يجب أن تكون موجبة'],
      };
    }

    const tier = this.resolveTier(serumPhosphorus, serumPotassium, serumMagnesium, daysOfMalnutrition);
    const alerts: string[] = [];

    let adjustedKcal = plannedKcal;
    let isCapApplied = false;

    if (tier === 'critical' || tier === 'moderate') {
      const ceiling = parseFloat((weightKg * PediatricRefeedingMonitor.PEDIATRIC_KCAL_PER_KG).toFixed(2));
      if (plannedKcal > ceiling) {
        isCapApplied = true;
        adjustedKcal = ceiling;
        alerts.push(
          `تم تطبيق الحد الآمن للسعرات حسب وزن الطفل: ${ceiling} سعرة/يوم (${weightKg} كغ × ${PediatricRefeedingMonitor.PEDIATRIC_KCAL_PER_KG}) بدلاً من ${plannedKcal}`,
        );
      }
    }

    if (tier === 'critical') {
      alerts.push('خطر شديد لمتلازمة إعادة التغذية لدى الطفل - البدء بكمية سعرات منخفضة جداً وزيادتها تدريجياً');
    } else if (tier === 'moderate') {
      alerts.push('خطر متوسط لمتلازمة إعادة التغذية لدى الطفل - يجب مراقبة الشوارد يومياً');
    } else {
      alerts.push('خطر منخفض لمتلازمة إعادة التغذية لدى الطفل');
    }

    if (daysOfMalnutrition >= PediatricRefeedingMonitor.CRITICAL_DAYS) {
      alerts.push(`تنبيه: فترة سوء تغذية طويلة (${daysOfMalnutrition} يوماً) لدى الطفل`);
    }

    return {
      riskTier: tier,
      adjustedKcal: Math.round(adjustedKcal),
      isCapApplied,
      isSafe: true,
      alerts,
    };
  }

  private static resolveTier(
    phosphorus: number,
    potassium: number,
    magnesium: number,
    days: number,
  ): PediatricRfsTier {
    const lowPhos = isNaN(phosphorus) || phosphorus < PediatricRefeedingMonitor.CRITICAL_PHOSPHORUS;
    const lowPot = isNaN(potassium) || potassium < PediatricRefeedingMonitor.CRITICAL_POTASSIUM;
    const lowMag = isNaN(magnesium) || magnesium < PediatricRefeedingMonitor.CRITICAL_MAGNESIUM;
    const longStarvation = days >= PediatricRefeedingMonitor.CRITICAL_DAYS;

    if (lowPhos || lowPot || lowMag || longStarvation) {
      return 'critical';
    }

    const modPhos = phosphorus >= PediatricRefeedingMonitor.MODERATE_PHOSPHORUS_MIN &&
      phosphorus <= PediatricRefeedingMonitor.MODERATE_PHOSPHORUS_MAX;
    const modPot = potassium >= PediatricRefeedingMonitor.MODERATE_POTASSIUM_MIN &&
      potassium <= PediatricRefeedingMonitor.MODERATE_POTASSIUM_MAX;
    const modMag = magnesium >= PediatricRefeedingMonitor.MODERATE_MAGNESIUM_MIN &&
      magnesium <= PediatricRefeedingMonitor.MODERATE_MAGNESIUM_MAX;
    const modDays = days >= 5 && days < PediatricRefeedingMonitor.CRITICAL_DAYS;

    if (modPhos || modPot || modMag || modDays) {
      return 'moderate';
    }

    return 'low';
  }
}
