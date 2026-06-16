import type { IGlutenIsolationInput, IGlutenIsolationOutput } from '../../data/types/gastrointestinal';

export class GlutenIsolationEngine {
  private static readonly GLUTEN_INGREDIENTS = ['wheat', 'barley', 'rye', 'malt', 'oats'];

  private static readonly TRIGGER_TAGS = ['contains_gluten', 'contains_wheat', 'processed_with_wheat'];

  public static evaluateGlutenSafety(input: IGlutenIsolationInput): IGlutenIsolationOutput {
    const { diagnosis, chemicalTags, ingredientsListEn } = input;

    if (diagnosis === 'none') {
      return {
        isAllowed: true,
        severityLevel: 'none',
        crossContaminationRisk: false,
        arabicClinicalAlerts: [],
      };
    }

    if (!chemicalTags || !ingredientsListEn || ingredientsListEn.length === 0) {
      return {
        isAllowed: false,
        severityLevel: 'critical',
        crossContaminationRisk: false,
        arabicClinicalAlerts: [
          '🚨 فشل أمني: المكونات غير متوفرة أو العلامات الكيميائية غير مهيأة. يمنع تقديم الوجبة حفاظاً على سلامة المريض مناعيًا',
        ],
      };
    }

    let isAllowed = true;
    const alerts: string[] = [];

    const hasCertifiedGlutenFree = chemicalTags.includes('certified_gluten_free');

    const hasTriggerTag = chemicalTags.some((tag) => GlutenIsolationEngine.TRIGGER_TAGS.includes(tag));
    if (hasTriggerTag) {
      isAllowed = false;
    }

    for (const ingredient of ingredientsListEn) {
      const lowerIngredient = ingredient.toLowerCase();
      for (const grain of GlutenIsolationEngine.GLUTEN_INGREDIENTS) {
        if (hasCertifiedGlutenFree && grain === 'oats') {
          continue;
        }
        if (lowerIngredient.includes(grain)) {
          isAllowed = false;
        }
      }
    }

    const crossContaminationRisk = chemicalTags.includes('processed_with_wheat');

    if (!isAllowed) {
      if (diagnosis === 'celiac_disease') {
        alerts.push(
          '🚨 حظر مناعي حرج (داء السيلياك): تم رصد قمح أو جلوتين أو تلوث خلطي في المكونات! إدخال هذه المادة يتسبب في تحفيز هجوم مناعي ذاتي يؤدي إلى ضمور زغابات الأمعاء (Villous Atrophy) وسوء امتصاص حاد. يمنع تقديم الوجبة منعا باتاً',
        );
      }

      if (diagnosis === 'wheat_allergy') {
        alerts.push(
          '🚨 إنذار حرج (حساسية القمح): المكون يحتوي على بروتينات القمحة المثيرة للمناعة (IgE-mediated). خطر حدوث صدمة حساسية حادة (Anaphylaxis) أو طفح جلدي وضيق تنفس وشيك. استبعد المادة فوراً',
        );
      }

      if (crossContaminationRisk) {
        alerts.push(
          '⚠️ تنبيه التلوث التبادلي: المنتج مصنع في خطوط إنتاج تحتوي على القمح، مرفوض لحماية السطح المعوي الحساس',
        );
      }
    }

    return {
      isAllowed,
      severityLevel: isAllowed ? 'none' : 'critical',
      crossContaminationRisk,
      arabicClinicalAlerts: alerts,
    };
  }
}
