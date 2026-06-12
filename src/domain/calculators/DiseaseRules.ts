import { DiseaseRule, DiseaseAdjustment } from '../entities/DiseaseRule';

const OBESITY_CALORIE_DEFICIT = -500;

const diseaseRules: DiseaseRule[] = [
  {
    keywords: ['سكري', 'diabetes', 'DM', 'type 2'],
    apply: (calories: number, _weightKg: number): DiseaseAdjustment => ({
      calorieAdjustment: 0,
      recommendations: [
        'توزيع الوجبات على 3 وجبات رئيسية + 2 وجبة خفيفة',
        'اختيار الكربوهيدرات المعقدة (الحبوب الكاملة، البقوليات)',
        'زيادة الألياف الغذائية إلى 25-30 غرام يومياً',
        'متابعة مستوى السكر بانتظام',
      ],
      restrictions: [
        'تجنب السكريات البسيطة والمشروبات المحلاة',
        'تجنب الكربوهيدرات المكررة (الخبز الأبيض، الأرز الأبيض)',
      ],
      carbsPercentage: 0.45,
    }),
  },
  {
    keywords: ['ضغط', 'hypertension', 'HTN', 'ارتفاع ضغط'],
    apply: (calories: number, _weightKg: number): DiseaseAdjustment => ({
      calorieAdjustment: 0,
      recommendations: [
        'اتباع نظام DASH الغذائي',
        'زيادة تناول البوتاسيوم (الموز، البطاطس، السبانخ)',
        'تناول الخضروات والفواكه الطازجة يومياً',
      ],
      restrictions: [
        'تقليل الصوديوم إلى أقل من 2000 ملغ يومياً',
        'تجنب الأطعمة المعلبة والمصنعة',
        'تجنب إضافة الملح إلى الطعام',
      ],
    }),
  },
  {
    keywords: ['سمنة', 'obesity', 'obese', 'زيادة وزن'],
    apply: (calories: number, _weightKg: number): DiseaseAdjustment => ({
      calorieAdjustment: OBESITY_CALORIE_DEFICIT,
      recommendations: [
        'تقليل السعرات الحرارية تدريجياً',
        'زيادة النشاط البدني (30 دقيقة مشي يومياً على الأقل)',
        'تناول وجبات صغيرة متكررة',
        'شرب الماء قبل الوجبات',
      ],
      restrictions: [
        'تجنب الوجبات السريعة والمقلية',
        'تجنب المشروبات الغازية والعصائر المحلاة',
      ],
    }),
  },
  {
    keywords: ['فشل كلوي', 'renal', 'kidney', ' CKD'],
    apply: (calories: number, weightKg: number): DiseaseAdjustment => ({
      calorieAdjustment: 0,
      recommendations: [
        'الحفاظ على السعرات الحرارية المناسبة لتجنب الهزال',
        'طهي الخضروات لتقليل محتوى البوتاسيوم',
      ],
      restrictions: [
        'تقييد البروتين حسب توصية الطبيب',
        'مراقبة البوتاسيوم والفوسفور',
        'تجنب الأطعمة عالية الصوديوم',
      ],
      proteinPerKg: 0.6,
    }),
  },
  {
    keywords: ['أمراض كبد', 'liver', 'hepatic', ' cirrhosis'],
    apply: (calories: number, _weightKg: number): DiseaseAdjustment => ({
      calorieAdjustment: 0,
      recommendations: [
        'تقسيم الوجبات إلى 4-6 وجبات صغيرة يومياً',
        'تناول الكربوهيدرات المعقدة للحفاظ على مستوى الطاقة',
      ],
      restrictions: [
        'تجنب الكحول تماماً',
        'تقييد الصوديوم في حالة الاستسقاء',
        'تجنب الأطعمة النيئة أو غير المطبوخة جيداً',
      ],
    }),
  },
];

export function getDiseaseAdjustments(
  diagnosis: string,
  totalCalories: number,
  weightKg: number
): DiseaseAdjustment {
  const lowerDiagnosis = diagnosis.toLowerCase();
  const matchedRules = diseaseRules.filter((rule) =>
    rule.keywords.some((kw) => lowerDiagnosis.includes(kw.toLowerCase()))
  );

  if (matchedRules.length === 0) {
    return {
      calorieAdjustment: 0,
      recommendations: ['اتباع نظام غذائي متوازن', 'تناول وجبات منتظمة'],
      restrictions: [],
    };
  }

  const adjustments = matchedRules.map((r) =>
    r.apply(totalCalories, weightKg)
  );

  return {
    calorieAdjustment: adjustments.reduce(
      (sum, a) => sum + (a.calorieAdjustment ?? 0),
      0
    ),
    recommendations: [
      ...new Set(adjustments.flatMap((a) => a.recommendations)),
    ],
    restrictions: [...new Set(adjustments.flatMap((a) => a.restrictions))],
    proteinPerKg: adjustments
      .map((a) => a.proteinPerKg)
      .find((p) => p !== undefined),
    fatPercentage: adjustments
      .map((a) => a.fatPercentage)
      .find((p) => p !== undefined),
    carbsPercentage: adjustments
      .map((a) => a.carbsPercentage)
      .find((p) => p !== undefined),
  };
}
