import type { IBurnMetabolicInput, IBurnMetabolicOutput } from '../../data/types/burn_metabolic';

export class BurnMetabolicEngine {
  public static calculateBurnRequirements(input: IBurnMetabolicInput): IBurnMetabolicOutput {
    const { patientWeightKg, tbsaPercentage, burnDegree, isIntubated } = input;

    if (patientWeightKg <= 0 || tbsaPercentage < 0 || tbsaPercentage > 100) {
      return {
        parklandFluidMl24h: 0,
        first8hFluidMl: 0,
        remaining16hFluidMl: 0,
        curreriEnergyKcal24h: 0,
        targetProteinGrams: 0,
        isSafe: false,
        arabicClinicalAlerts: ['بيانات غير صالحة: تأكد من وزن المريض ونسبة مساحة الحرق (0-100%)'],
      };
    }

    const parklandFluidMl24h = BurnMetabolicEngine.round2(4.0 * patientWeightKg * tbsaPercentage);
    const first8hFluidMl = BurnMetabolicEngine.round2(parklandFluidMl24h * 0.50);
    const remaining16hFluidMl = BurnMetabolicEngine.round2(parklandFluidMl24h * 0.50);

    const effectiveTbsa = Math.min(50, tbsaPercentage);
    const curreriEnergyKcal24h = BurnMetabolicEngine.round2((25 * patientWeightKg) + (40 * effectiveTbsa));

    const targetProteinGrams = BurnMetabolicEngine.round2(patientWeightKg * 2.0);

    const alerts: string[] = [];

    if (tbsaPercentage >= 20) {
      alerts.push(
        '🚨 إنذار طارئ (حروق بليغة صدمية): مساحة الحرق الكلية تتجاوز الحدود الآمنة للترشيح الفسيولوجي (>= 20%). يفرض النظام تطبيق بروتوكول Parkland الفوري لإنعاش السوائل لتجنب الفشل الكلوي الحاد والصدمة الدموية (Hypovolemic Burn Shock). يجب تزويد المريض بنصف الكمية المحسوبة (50%) خلال أول 8 ساعات بالتمام والكمال من لحظة الإصابة',
      );
    }

    if (targetProteinGrams > 0) {
      alerts.push(
        '🔥 كبح الهدم العضلي الحاد: تم فرض مستهدف بروتيني رفيع جداً (2.0 غرام/كغم) بشكل إجباري لإعادة بناء الطعم الجلدي والأنسجة المتمزقة وتعويض النتروجين الهائل المفقود عبر المسامات المحروقة',
      );
    }

    return {
      parklandFluidMl24h,
      first8hFluidMl,
      remaining16hFluidMl,
      curreriEnergyKcal24h,
      targetProteinGrams,
      isSafe: true,
      arabicClinicalAlerts: alerts,
    };
  }

  private static round2(value: number): number {
    return parseFloat(value.toFixed(2));
  }
}
