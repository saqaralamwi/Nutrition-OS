import type { ITpnInput, ITpnOutput } from '../../data/types/critical_care';

export class TpnCompoundingEngine {
  public static calculateTpnRequirements(input: ITpnInput): ITpnOutput {
    const { aminoAcidGrams, dextroseGrams, lipidGrams, sodiumMeq, potassiumMeq, totalFluidVolumeMl } = input;

    if (totalFluidVolumeMl <= 0 || aminoAcidGrams < 0 || dextroseGrams < 0 || lipidGrams < 0 || sodiumMeq < 0 || potassiumMeq < 0) {
      return {
        calculatedOsmolarityMosmL: 0,
        recommendedRoute: 'peripheral_line',
        isSafe: false,
        arabicClinicalAlerts: ['بيانات غير صالحة: تأكد من حجم السائل الكلي والمغذيات المضافة'],
      };
    }

    const aminoAcidOsm = aminoAcidGrams * 10.0;
    const dextroseOsm = dextroseGrams * 5.0;
    const lipidOsm = lipidGrams * 1.5;
    const electrolyteOsm = (sodiumMeq + potassiumMeq) * 2.0;
    const totalMosmParticleCount = aminoAcidOsm + dextroseOsm + lipidOsm + electrolyteOsm;

    const calculatedOsmolarityMosmL = TpnCompoundingEngine.round2(
      totalMosmParticleCount / (totalFluidVolumeMl / 1000),
    );

    const recommendedRoute: ITpnOutput['recommendedRoute'] =
      calculatedOsmolarityMosmL > 900 ? 'central_line' : 'peripheral_line';

    const alerts: string[] = [];

    if (recommendedRoute === 'central_line') {
      alerts.push(
        '🚨 إنذار التغذية الوريدية (خطر التهاب الوريد الخثاري): الأسموزية الكلية للمحلول المحسوب تتجاوز الحد الآمن للأوردة الطرفية (> 900 mOsm/L). يمنع منعاً باتاً التسريب عبر أوردة الذراع لخطر حدوث تفحم وعائي والتهاب وريدي خثاري حاد (Thrombophlebitis). يفرض النظام إجبارياً استخدام قسطرة وريدية مركزية (Central Venous Catheter)',
      );
    } else {
      alerts.push(
        '✅ مسار وريدي طرفي آمن: المحلول يقع ضمن النطاق الأسموزي المقبول للأوردة الطرفية (< 900 mOsm/L). يمكن التسريب عبر كانيولا طرفية مع مراقبة موضع الإدخال',
      );
    }

    return {
      calculatedOsmolarityMosmL,
      recommendedRoute,
      isSafe: true,
      arabicClinicalAlerts: alerts,
    };
  }

  private static round2(value: number): number {
    return parseFloat(value.toFixed(2));
  }
}
