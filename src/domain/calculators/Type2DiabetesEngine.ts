export interface IType2DietInput {
  baselineREE: number;
  activityFactor: number;
  gender: 'male' | 'female';
  weightKg: number;
  targetWeightLossPercent: number;
  hasInsulinResistance: boolean;
}

export interface IType2DietOutput {
  totalEnergyExpenditure: number;
  targetCalories: number;
  carbGrams: number;
  proteinGrams: number;
  fatGrams: number;
  isFloorGuardTriggered: boolean;
  isSafe: boolean;
  clinicalRecommendations: string[];
}

const DAILY_DEFICIT = 500;
const MALE_CALORIC_FLOOR = 1500;
const FEMALE_CALORIC_FLOOR = 1200;

const CARB_KCAL_PER_G = 4;
const PROTEIN_KCAL_PER_G = 4;
const FAT_KCAL_PER_G = 9;

export class Type2DiabetesEngine {
  public static calculateType2Requirements(input: IType2DietInput): IType2DietOutput {
    if (isNaN(input.baselineREE) || isNaN(input.weightKg) || isNaN(input.activityFactor) || input.baselineREE <= 0 || input.weightKg <= 0 || input.activityFactor < 1.0) {
      return {
        totalEnergyExpenditure: 0,
        targetCalories: 0,
        carbGrams: 0,
        proteinGrams: 0,
        fatGrams: 0,
        isFloorGuardTriggered: false,
        isSafe: false,
        clinicalRecommendations: [
          'بيانات الإدخال غير صالحة - تأكد من أن معدل الأيض الأساسي والوزن أكبر من صفر ومعامل النشاط لا يقل عن 1.0',
        ],
      };
    }

    const totalEnergyExpenditure = Math.round(input.baselineREE * input.activityFactor * 100) / 100;
    const calculatedTargetCalories = totalEnergyExpenditure - DAILY_DEFICIT;

    const floor = input.gender === 'male' ? MALE_CALORIC_FLOOR : FEMALE_CALORIC_FLOOR;
    const isFloorGuardTriggered = calculatedTargetCalories < floor;
    const targetCalories = isFloorGuardTriggered ? floor : Math.round(calculatedTargetCalories * 100) / 100;

    const carbPct = input.hasInsulinResistance ? 45 : 50;
    const proteinPct = 20;
    const fatPct = input.hasInsulinResistance ? 35 : 30;

    const carbGrams = Math.round((targetCalories * (carbPct / 100) / CARB_KCAL_PER_G) * 100) / 100;
    const proteinGrams = Math.round((targetCalories * (proteinPct / 100) / PROTEIN_KCAL_PER_G) * 100) / 100;
    const fatGrams = Math.round((targetCalories * (fatPct / 100) / FAT_KCAL_PER_G) * 100) / 100;

    const recommendations: string[] = [
      `إجمالي الطاقة المستهلكة (TEE): ${totalEnergyExpenditure} سعرة/يوم`,
      `السعرات المستهدفة بعد العجز: ${targetCalories} سعرة/يوم (عجز ${DAILY_DEFICIT} سعرة/يوم)`,
      `توزيع المغذيات الكبرى: كربوهيدرات ${carbPct}% (${carbGrams}غ)، بروتين ${proteinPct}% (${proteinGrams}غ)، دهون ${fatPct}% (${fatGrams}غ)`,
      'توزيع وجبات الكربوهيدرات على مدار اليوم لتفادي طفرات الجلوكوز الحادة',
    ];

    if (isFloorGuardTriggered) {
      recommendations.push(
        `تم تطبيق حد الأمان الأدنى (${floor} سعرة) لتجنب تباطؤ الأيض أو استجابة المجاعة`,
      );
    }

    if (input.hasInsulinResistance) {
      recommendations.push(
        'يوصى بتقليل الكربوهيدرات إلى 45% مع زيادة الدهون غير المشبعة لتحسين حساسية الإنسولين',
      );
    }

    return {
      totalEnergyExpenditure,
      targetCalories,
      carbGrams,
      proteinGrams,
      fatGrams,
      isFloorGuardTriggered,
      isSafe: true,
      clinicalRecommendations: recommendations,
    };
  }
}
