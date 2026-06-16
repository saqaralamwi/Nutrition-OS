import type { IFodmapInput, IFodmapOutput } from '../../data/types/gastrointestinal';

export class LowFodmapEngine {
  private static readonly FODMAP_TAGS = [
    'high_fructose',
    'contains_lactose',
    'high_fructan',
    'contains_polyols',
  ];

  private static readonly HIGH_FODMAP_INGREDIENTS = [
    'onion',
    'garlic',
    'sorbitol',
    'xylitol',
    'mannitol',
    'honey',
    'agave',
    'high fructose corn syrup',
    'artichoke',
    'watermelon',
  ];

  public static evaluateFodmapCompliance(input: IFodmapInput): IFodmapOutput {
    const { diagnosis, chemicalTags, ingredientsListEn, isReintroductionPhase } = input;

    if (diagnosis === 'none') {
      return {
        isHighFodmapDetected: false,
        limitationLevel: 'none',
        isSafe: true,
        arabicClinicalAlerts: [],
      };
    }

    if (!ingredientsListEn || !chemicalTags) {
      return {
        isHighFodmapDetected: true,
        limitationLevel: 'strict_elimination',
        isSafe: false,
        arabicClinicalAlerts: [
          '🚨 فشل أمني: قائمة المكونات غير متوفرة. يمنع تقديم الوجبة لحماية الأمعاء الهشة من التخمر البكتيري الحاد',
        ],
      };
    }

    let isHighFodmapDetected = false;

    const hasTriggerTag = chemicalTags.some((tag) => LowFodmapEngine.FODMAP_TAGS.includes(tag));
    if (hasTriggerTag) {
      isHighFodmapDetected = true;
    }

    for (const ingredient of ingredientsListEn) {
      const lowerIngredient = ingredient.toLowerCase();
      for (const fodmapItem of LowFodmapEngine.HIGH_FODMAP_INGREDIENTS) {
        if (lowerIngredient.includes(fodmapItem)) {
          isHighFodmapDetected = true;
        }
      }
    }

    let limitationLevel: IFodmapOutput['limitationLevel'];
    const alerts: string[] = [];

    if (isHighFodmapDetected) {
      if (!isReintroductionPhase) {
        limitationLevel = 'strict_elimination';
        alerts.push(
          '🚨 حظر هضمي حرج (حمية FODMAPs): تم رصد سكريات قابلة للتخمر (مثل البصل، الثوم، اللاكتوز، أو البوليولات) في المكونات! إدخال هذه الكربوهيدرات قصيرة السلسلة يتسبب في سحب الماء هيدروليكياً وتخمر بكتيري حاد يؤدي إلى تشنجات، غازات، وتفاقم التهاب الأمعاء النشط. يمنع تقديم الوجبة في مرحلة الإقصاء الصارمة',
        );
      } else {
        limitationLevel = 'moderate_restriction';
        alerts.push(
          '⚠️ تنبيه مرحلة إعادة الإدخال: المادة تحتوي على كربوهيدرات مرتفعة الـ FODMAP. يُسمح بتقديمها بكميات مقننة جداً ومراقبة حية للأعراض (الانتفاخ والألم) لتحديد مدى تحمل الأمعاء الفسيولوجي لها',
        );
      }
    } else {
      limitationLevel = 'none';
    }

    return {
      isHighFodmapDetected,
      limitationLevel,
      isSafe: !isHighFodmapDetected,
      arabicClinicalAlerts: alerts,
    };
  }
}
