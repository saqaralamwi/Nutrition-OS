import type { IOrthopedicInput, IOrthopedicOutput } from '../../data/types/surgical_life';

export class OrthopedicBoneHealingEngine {
  public static calculateBoneMineralTargets(input: IOrthopedicInput): IOrthopedicOutput {
    const { hasActiveFracture: fracture, ageYears: age, egfrValue: egfr, gender } = input;

    if (age <= 0 || egfr < 0 || isNaN(age) || isNaN(egfr)) {
      return {
        targetCalciumMg: 0,
        targetPhosphorusMg: 0,
        targetVitaminD3Iu: 0,
        isRenalConstrained: false,
        isSafe: false,
        arabicClinicalAlerts: ['الرجاء إدخال عمر صحيح وقيمة eGFR موجبة'],
      };
    }

    let targetCalciumMg: number;
    let targetPhosphorusMg: number;
    let targetVitaminD3Iu: number;
    let isRenalConstrained = false;
    const alerts: string[] = [];

    if (!fracture) {
      if (age > 70 || (gender === 'female' && age > 50)) {
        targetCalciumMg = 1200.00;
      } else {
        targetCalciumMg = 1000.00;
      }
      targetPhosphorusMg = 700.00;
      targetVitaminD3Iu = age > 70 ? 800.00 : 600.00;
    } else {
      if (egfr >= 60.00) {
        targetCalciumMg = 1500.00;
        targetPhosphorusMg = 1000.00;
        targetVitaminD3Iu = 2000.00;
      } else {
        targetCalciumMg = 800.00;
        targetPhosphorusMg = 700.00;
        targetVitaminD3Iu = 800.00;
        isRenalConstrained = true;
        alerts.push('🚨 كابح أمان كلوى: المريض يعاني من كسر عظمي نشط بالتوازي مع قصور كلوى (eGFR < 60). تم خفض مستهدف الكالسيوم والفوسفور إجبارياً إلى سقوف حماية الكلى (800 ملغ كالسيوم كحد أقصى) لتفادي الترسبات التكلسية في الشرايين والقلب');
      }
    }

    return {
      targetCalciumMg: OrthopedicBoneHealingEngine.round2(targetCalciumMg),
      targetPhosphorusMg: OrthopedicBoneHealingEngine.round2(targetPhosphorusMg),
      targetVitaminD3Iu: OrthopedicBoneHealingEngine.round2(targetVitaminD3Iu),
      isRenalConstrained,
      isSafe: true,
      arabicClinicalAlerts: alerts,
    };
  }

  private static round2(value: number): number {
    return parseFloat(value.toFixed(2));
  }
}
