import type { IMilkAllergenInput, IMilkAllergenOutput } from '../../data/types/gastrointestinal';

export class MilkAllergenEngine {
  private static readonly LACTOSE_TRIGGERS = ['lactose', 'milk sugar'];

  private static readonly CMPA_PROTEIN_FRACTIONS = [
    'milk',
    'casein',
    'whey',
    'butter',
    'cheese',
    'ghee',
    'cream',
    'yogurt',
    'lactalbumin',
    'curd',
  ];

  private static readonly CMPA_TAGS = ['contains_dairy', 'casein_heavy'];

  public static evaluateMilkSafety(input: IMilkAllergenInput): IMilkAllergenOutput {
    const { allergyType, chemicalTags, ingredientsListEn } = input;

    if (allergyType === 'none') {
      return {
        isAllowed: true,
        restrictionTier: 'none',
        isSafe: true,
        arabicClinicalAlerts: [],
      };
    }

    if (!ingredientsListEn || !chemicalTags) {
      return {
        isAllowed: false,
        restrictionTier: 'none',
        isSafe: false,
        arabicClinicalAlerts: [
          '🚨 فشل أمني: قائمة المكونات غير متوفرة. يمنع تقديم الوجبة لحماية المريض من تفاعل حليبي محتمل',
        ],
      };
    }

    const alerts: string[] = [];

    if (allergyType === 'cow_milk_protein_allergy') {
      let isAllowed = true;

      const hasCmpaTag = chemicalTags.some((tag) => MilkAllergenEngine.CMPA_TAGS.includes(tag));
      if (hasCmpaTag) {
        isAllowed = false;
      }

      for (const ingredient of ingredientsListEn) {
        const lowerIngredient = ingredient.toLowerCase();
        for (const protein of MilkAllergenEngine.CMPA_PROTEIN_FRACTIONS) {
          if (lowerIngredient.includes(protein)) {
            isAllowed = false;
          }
        }
      }

      if (!isAllowed) {
        alerts.push(
          '🚨 حظر مناعي حرج (حساسية بروتين الحليب CMPA): تم رصد جزئيات حليبية أو بروتينات الكازين/الواي في المكونات! تعديل الحليب لخلوه من اللاكتوز لا يحمي المريض هنا. إدخال هذه المادة يهدد بتحفيز صدمة حساسية حادة أو نزيف معوي مناعي وتدهور مخاطي حاد. الوجبة مرفوضة قطعياً',
        );
      }

      return {
        isAllowed,
        restrictionTier: isAllowed ? 'none' : 'absolute_dairy_protein_exclusion',
        isSafe: isAllowed,
        arabicClinicalAlerts: alerts,
      };
    }

    if (allergyType === 'lactose_intolerance') {
      let isAllowed = true;
      let restrictionTier: IMilkAllergenOutput['restrictionTier'] = 'none';

      const hasLactoseFree = chemicalTags.includes('lactose_free');

      if (hasLactoseFree) {
        restrictionTier = 'lactose_free_permitted';
      }

      if (!hasLactoseFree) {
        for (const ingredient of ingredientsListEn) {
          const lowerIngredient = ingredient.toLowerCase();
          for (const trigger of MilkAllergenEngine.LACTOSE_TRIGGERS) {
            if (lowerIngredient.includes(trigger)) {
              isAllowed = false;
              restrictionTier = 'strict_lactose_exclusion';
            }
          }
        }
      }

      if (!isAllowed) {
        alerts.push(
          '⚠️ تنبيه هضمي (عدم تحمل اللاكتوز): المكون يحتوي على سكر الحليب (اللاكتوز) دون معالجة إنزيمية. استهلاكه يتسبب في تمدد هيدروليكي معوي وتخمر غازي حاد وإسهال تشنجي. يمنع التقديم إلا ببدائل معالجة باللاكتيز',
        );
      }

      return {
        isAllowed,
        restrictionTier,
        isSafe: isAllowed,
        arabicClinicalAlerts: alerts,
      };
    }

    return {
      isAllowed: false,
      restrictionTier: 'none',
      isSafe: false,
      arabicClinicalAlerts: ['نوع الحساسية غير معروف، يمنع تقديم الوجبة احترازياً'],
    };
  }
}
