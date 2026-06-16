import type { IRespiratoryInput, IRespiratoryOutput } from '../../data/types/respiratory';

export class RespiratoryQuotientEngine {
  public static evaluateRespiratoryConstraints(input: IRespiratoryInput): IRespiratoryOutput {
    const { fev1Percentage, hasCo2Retention, oxygenDeliveryMode, totalEnergyTargetKcal } = input;

    if (totalEnergyTargetKcal <= 0 || fev1Percentage < 0 || fev1Percentage > 120) {
      return {
        targetRq: 0.85,
        maxCarbohydrateEnergyRatio: 0,
        maxCarbKcal: 0,
        minLipidEnergyRatio: 0,
        isSafe: false,
        arabicClinicalAlerts: ['بيانات غير صالحة: تأكد من السعرات الحرارية الكلية وقيمة FEV1'],
      };
    }

    const alerts: string[] = [];
    let targetRq: number;
    let maxCarbohydrateEnergyRatio: number;
    let minLipidEnergyRatio: number;

    const isAcuteRespiratory =
      hasCo2Retention === true ||
      fev1Percentage < 50 ||
      oxygenDeliveryMode === 'mechanical_ventilation';

    if (isAcuteRespiratory) {
      targetRq = 0.80;
      maxCarbohydrateEnergyRatio = 0.40;
      minLipidEnergyRatio = 0.45;

      alerts.push(
        '🚨 حظر أيضي تنفسي (احتباس CO2 حاد): المريض يعاني من فشل تنفسي أو انسداد رئوي حرج (FEV1 < 50% أو تحت التنفس الاصطناعي) مع خطر احتباس كربوني. تم خفض سقف الكربوهيدرات إجبارياً إلى 40% كحد أقصى لتقليل المعامل التنفسي (Target RQ = 0.80) وتفادي إجهاد الرئة بغاز ثاني أكسيد الكربون، مما يمنع فشل الفطام عن جهاز التنفس (Weaning Failure)',
      );
      alerts.push(
        '⚠️ تعديل ركيزة الوقود غير البروتيني: تم رفع مستهدف الدهون الأدنى إلى 45% لتعويض عجز السعرات الحرارية بأمان عبر أكسدة دهنية منخفضة الإنتاج لغاز CO2 مقارنة بالسكريات',
      );
    } else {
      targetRq = 0.85;
      maxCarbohydrateEnergyRatio = 0.55;
      minLipidEnergyRatio = 0.25;
    }

    const maxCarbKcal = RespiratoryQuotientEngine.round2(totalEnergyTargetKcal * maxCarbohydrateEnergyRatio);

    return {
      targetRq,
      maxCarbohydrateEnergyRatio,
      maxCarbKcal,
      minLipidEnergyRatio,
      isSafe: true,
      arabicClinicalAlerts: alerts,
    };
  }

  private static round2(value: number): number {
    return parseFloat(value.toFixed(2));
  }
}
