import type { IIddsiInput, IIddsiOutput } from '../../data/types/surgical_life';

const LIQUID_NAMES: Record<number, string> = {
  0: 'رقيقة للغاية (ماء صافي)',
  2: 'سميكة قليلاً',
  3: 'سميكة متوسطاً',
  4: 'سميكة للغاية (قوام محقون)',
};

const FOOD_NAMES: Record<number, string> = {
  4: 'مهروس بالكامل',
  5: 'مفروم ورطب',
  6: 'لينة وحجم اللقمة',
  7: 'طعام اعتيادي',
};

export class IddsiTextureEngine {
  public static evaluateIddsiRequirement(input: IIddsiInput): IIddsiOutput {
    const { patientAgeYears, hasDysphagia, dysphagiaSeverity } = input;

    if (patientAgeYears <= 0 || isNaN(patientAgeYears)) {
      return {
        liquidLevelCode: 0,
        liquidLevelNameAr: LIQUID_NAMES[0],
        foodTextureCode: 7,
        foodTextureNameAr: FOOD_NAMES[7],
        isSafe: false,
        arabicClinicalAlerts: ['الرجاء إدخال عمر صحيح للمريض (عدد موجب)'],
      };
    }

    let liquidLevelCode: number;
    let foodTextureCode: number;
    const alerts: string[] = [];

    if (!hasDysphagia || dysphagiaSeverity === 'none') {
      liquidLevelCode = 0;
      foodTextureCode = 7;
    } else if (dysphagiaSeverity === 'mild') {
      liquidLevelCode = 2;
      foodTextureCode = 6;
    } else if (dysphagiaSeverity === 'moderate') {
      liquidLevelCode = 3;
      foodTextureCode = 5;
    } else {
      liquidLevelCode = 4;
      foodTextureCode = 4;
    }

    if (patientAgeYears >= 65 && hasDysphagia && dysphagiaSeverity !== 'none') {
      alerts.push('🧓 تحذير الشيخوخة الحرجة: المريض مصاب بعسر بلع شيخوخي/عصبي فوق عمر 65. خطر الارتشاف الرئوي الصامت (Silent Aspiration) مرتفع جداً. يمنع منعاً باتاً تقديم المياه الصافية بدون مغلظات القوام المعتمدة، ويجب اختبار القوام بملعقة الفحص قبل التقديم حماية للمجرى الهوائي');
    }

    return {
      liquidLevelCode,
      liquidLevelNameAr: LIQUID_NAMES[liquidLevelCode],
      foodTextureCode,
      foodTextureNameAr: FOOD_NAMES[foodTextureCode],
      isSafe: true,
      arabicClinicalAlerts: alerts,
    };
  }
}
