import { describe, it, expect } from 'vitest';
import { AutomatedMenuGeneratorEngine } from '../AutomatedMenuGeneratorEngine';
import type { IMealDistributionPlan, IMealSlotAllocation } from '../AutomatedMenuGeneratorEngine';
import type { IFoodExchange, IPatientAversionRecord } from '../../../data/types/meal_planner';
import type { ICalculatedMetabolicTargets } from '../DietaryIntakeAnalyzerEngine';

const r2 = (v: number): number => {
  if (typeof v !== 'number' || isNaN(v) || !isFinite(v) || v < 0) return 0;
  return parseFloat(v.toFixed(2));
};

const RICE: IFoodExchange = {
  exchangeGroup: 'starch',
  foodNameAr: 'أرز أبيض مطبوخ',
  servingSizeDesc: 'نصف كوب - 100 غرام',
  carbsG: 15, proteinG: 3, fatG: 0, caloriesKcal: 80,
  glycemicIndex: 72, potassiumLevel: 'low', phosphorusLevel: 'medium',
  isGlutenFree: true, isLowFodmap: true, isLactoseFree: true,
  isUserDefined: false, associatedPatientId: null,
  isCompositeRecipe: false, recipeDecompositionJson: '[]',
  householdUnitsJson: JSON.stringify({ cup: 0.33, tablespoon: 1.0 }),
  micronutrientTagsJson: '[]',
};

const BREAD: IFoodExchange = {
  exchangeGroup: 'starch',
  foodNameAr: 'خبز قمح',
  servingSizeDesc: 'شريحة - 30 غرام',
  carbsG: 15, proteinG: 3, fatG: 1, caloriesKcal: 80,
  glycemicIndex: 55, potassiumLevel: 'medium', phosphorusLevel: 'high',
  isGlutenFree: false, isLowFodmap: false, isLactoseFree: true,
  isUserDefined: false, associatedPatientId: null,
  isCompositeRecipe: false, recipeDecompositionJson: '[]',
  householdUnitsJson: JSON.stringify({ slice: 1.0, piece: 0.25 }),
  micronutrientTagsJson: '[]',
};

const CHICKEN: IFoodExchange = {
  exchangeGroup: 'meat_lean',
  foodNameAr: 'صدر دجاج مشوي',
  servingSizeDesc: 'قطعة - 30 غرام',
  carbsG: 0, proteinG: 7, fatG: 2, caloriesKcal: 45,
  glycemicIndex: 0, potassiumLevel: 'medium', phosphorusLevel: 'high',
  isGlutenFree: true, isLowFodmap: true, isLactoseFree: true,
  isUserDefined: false, associatedPatientId: null,
  isCompositeRecipe: false, recipeDecompositionJson: '[]',
  householdUnitsJson: JSON.stringify({ grams: 30.0, piece: 1.0 }),
  micronutrientTagsJson: '["zinc","heme_iron"]',
};

const EGG: IFoodExchange = {
  exchangeGroup: 'meat_medium',
  foodNameAr: 'بيض مسلوق',
  servingSizeDesc: 'بيضة واحدة - 50 غرام',
  carbsG: 0, proteinG: 7, fatG: 5, caloriesKcal: 75,
  glycemicIndex: 0, potassiumLevel: 'low', phosphorusLevel: 'high',
  isGlutenFree: true, isLowFodmap: true, isLactoseFree: true,
  isUserDefined: false, associatedPatientId: null,
  isCompositeRecipe: false, recipeDecompositionJson: '[]',
  householdUnitsJson: JSON.stringify({ piece: 1.0 }),
  micronutrientTagsJson: '[]',
};

const SPINACH: IFoodExchange = {
  exchangeGroup: 'vegetable',
  foodNameAr: 'سبانخ مطبوخة',
  servingSizeDesc: 'نصف كوب - 100 غرام',
  carbsG: 5, proteinG: 2, fatG: 0, caloriesKcal: 25,
  glycemicIndex: 15, potassiumLevel: 'high', phosphorusLevel: 'low',
  isGlutenFree: true, isLowFodmap: true, isLactoseFree: true,
  isUserDefined: false, associatedPatientId: null,
  isCompositeRecipe: false, recipeDecompositionJson: '[]',
  householdUnitsJson: JSON.stringify({ cup: 0.5 }),
  micronutrientTagsJson: '["vitamin_c"]',
};

const BANANA: IFoodExchange = {
  exchangeGroup: 'fruit',
  foodNameAr: 'موز طازج',
  servingSizeDesc: 'حبة صغيرة - 60 غرام',
  carbsG: 15, proteinG: 0, fatG: 0, caloriesKcal: 60,
  glycemicIndex: 51, potassiumLevel: 'high', phosphorusLevel: 'low',
  isGlutenFree: true, isLowFodmap: false, isLactoseFree: true,
  isUserDefined: false, associatedPatientId: null,
  isCompositeRecipe: false, recipeDecompositionJson: '[]',
  householdUnitsJson: JSON.stringify({ piece: 1.0 }),
  micronutrientTagsJson: '[]',
};

const OLIVE_OIL: IFoodExchange = {
  exchangeGroup: 'fat',
  foodNameAr: 'زيت زيتون',
  servingSizeDesc: 'ملعقة - 15 غرام',
  carbsG: 0, proteinG: 0, fatG: 5, caloriesKcal: 45,
  glycemicIndex: 0, potassiumLevel: 'low', phosphorusLevel: 'low',
  isGlutenFree: true, isLowFodmap: true, isLactoseFree: true,
  isUserDefined: false, associatedPatientId: null,
  isCompositeRecipe: false, recipeDecompositionJson: '[]',
  householdUnitsJson: JSON.stringify({ tablespoon: 1.0 }),
  micronutrientTagsJson: '[]',
};

const YOGURT: IFoodExchange = {
  exchangeGroup: 'milk',
  foodNameAr: 'زبادي طبيعي',
  servingSizeDesc: 'كوب وسط - 150 غرام',
  carbsG: 12, proteinG: 8, fatG: 8, caloriesKcal: 150,
  glycemicIndex: 35, potassiumLevel: 'medium', phosphorusLevel: 'high',
  isGlutenFree: true, isLowFodmap: true, isLactoseFree: false,
  isUserDefined: false, associatedPatientId: null,
  isCompositeRecipe: false, recipeDecompositionJson: '[]',
  householdUnitsJson: JSON.stringify({ cup: 1.0 }),
  micronutrientTagsJson: '[]',
};

const masterFoods: (IFoodExchange & { id: string })[] = [
  { id: 'food-rice', ...RICE },
  { id: 'food-bread', ...BREAD },
  { id: 'food-chicken', ...CHICKEN },
  { id: 'food-egg', ...EGG },
  { id: 'food-spinach', ...SPINACH },
  { id: 'food-banana', ...BANANA },
  { id: 'food-olive-oil', ...OLIVE_OIL },
  { id: 'food-yogurt', ...YOGURT },
];

function extractDistribution(plan: { mealDistributionJson: string }): IMealDistributionPlan {
  return JSON.parse(plan.mealDistributionJson) as IMealDistributionPlan;
}

function collectAllFoodNames(distribution: IMealDistributionPlan): string[] {
  const names: string[] = [];
  for (const slot of distribution.slots) {
    for (const item of slot.items) {
      names.push(item.foodNameAr);
    }
  }
  return names;
}

describe('AutomatedMenuGeneratorEngine.generatePrescriptiveMenu', () => {
  it('builds a menu for a celiac + high-output fistula profile with zero forbidden foods and macros within 5% tolerance', () => {
    const targets: ICalculatedMetabolicTargets = {
      calories: 2150,
      protein: 110,
      carbs: 210,
      fat: 75,
      fluidMl: 2200,
      isCeliac: true,
      hasLactoseIntolerance: false,
      dietaryPatternTag: 'standard',
      isHypermetabolic: true,
    };

    const aversions: IPatientAversionRecord[] = [];

    const plan = AutomatedMenuGeneratorEngine.generatePrescriptiveMenu(
      'patient-celiac-fistula',
      targets,
      masterFoods as unknown as IFoodExchange[],
      aversions,
    );

    expect(plan.patientId).toBe('patient-celiac-fistula');
    expect(plan.dietaryPatternTag).toBe('standard');

    const distribution = extractDistribution(plan);

    const foodNames = collectAllFoodNames(distribution);

    // Assert 1: No gluten-containing foods appear (BREAD must be absent, RICE present)
    expect(foodNames).not.toContain('خبز قمح');
    expect(foodNames).toContain('أرز أبيض مطبوخ');

    // Assert 2: Only gluten-free foods in the plan
    expect(foodNames).toContain('صدر دجاج مشوي');
    expect(foodNames).toContain('بيض مسلوق');
    expect(foodNames).toContain('سبانخ مطبوخة');
    expect(foodNames).toContain('موز طازج');

    // Assert 3: Macro targets within 5% tolerance
    const calRatio = r2(distribution.totalCalories / targets.calories);
    const protRatio = r2(distribution.totalProtein / targets.protein);
    const carbRatio = r2(distribution.totalCarbs / targets.carbs);
    const fatRatio = r2(distribution.totalFat / targets.fat);

    expect(calRatio).toBeGreaterThanOrEqual(0.95);
    expect(calRatio).toBeLessThanOrEqual(1.05);
    expect(protRatio).toBeGreaterThanOrEqual(0.95);
    expect(protRatio).toBeLessThanOrEqual(1.05);
    expect(carbRatio).toBeGreaterThanOrEqual(0.95);
    expect(carbRatio).toBeLessThanOrEqual(1.05);
    expect(fatRatio).toBeGreaterThanOrEqual(0.95);
    expect(fatRatio).toBeLessThanOrEqual(1.05);

    // Assert 4: 6 meal slots present
    expect(distribution.slots.length).toBe(6);
    const slotTypes = distribution.slots.map((s: IMealSlotAllocation) => s.slot);
    expect(slotTypes).toEqual(['breakfast', 'snack_1', 'lunch', 'snack_2', 'dinner', 'late_snack']);

    // Assert 5: Educational insights present in Arabic
    const insights = JSON.parse(plan.educationalInsightsJson) as { title: string; body: string; type: string }[];
    expect(insights.length).toBeGreaterThanOrEqual(2);

    const summaryTitles = insights.filter((c) => c.type === 'dietary');
    expect(summaryTitles.length).toBe(1);
    expect(summaryTitles[0].title).toBe('ملخص السعرات الحرارية');

    const lifestyleCards = insights.filter((c) => c.type === 'lifestyle');
    expect(lifestyleCards.length).toBe(1);
    expect(lifestyleCards[0].title).toBe('التوازن الغذائي العام');

    // Assert 6: averageGlycemicLoad is computed and non-negative
    expect(plan.averageGlycemicLoad).toBeGreaterThanOrEqual(0);
  });

  it('generates diabetic_spaced menu with even carb distribution and Arabic insight', () => {
    const targets: ICalculatedMetabolicTargets = {
      calories: 1650,
      protein: 82,
      carbs: 180,
      fat: 55,
      fluidMl: 2000,
      dietaryPatternTag: 'diabetic_spaced',
    };

    const aversions: IPatientAversionRecord[] = [];

    const plan = AutomatedMenuGeneratorEngine.generatePrescriptiveMenu(
      'patient-diabetic',
      targets,
      masterFoods as unknown as IFoodExchange[],
      aversions,
    );

    expect(plan.dietaryPatternTag).toBe('diabetic_spaced');

    const insights = JSON.parse(plan.educationalInsightsJson) as { title: string; body: string; type: string }[];
    const sugarCard = insights.find((c) => c.title === 'توزيع النشويات لمرضى السكري');
    expect(sugarCard).toBeDefined();
    expect(sugarCard!.body).toContain('ثبات مستويات سكر الدم');

    // Verify macros within 5%
    const distribution = extractDistribution(plan);
    expect(r2(distribution.totalCalories / targets.calories)).toBeGreaterThanOrEqual(0.95);
    expect(r2(distribution.totalCalories / targets.calories)).toBeLessThanOrEqual(1.05);
  });

  it('generates hepatic_night_snack menu with late snack allocation and Arabic insight', () => {
    const targets: ICalculatedMetabolicTargets = {
      calories: 2000,
      protein: 100,
      carbs: 220,
      fat: 60,
      fluidMl: 2000,
      dietaryPatternTag: 'hepatic_night_snack',
    };

    const aversions: IPatientAversionRecord[] = [];

    const plan = AutomatedMenuGeneratorEngine.generatePrescriptiveMenu(
      'patient-hepatic',
      targets,
      masterFoods as unknown as IFoodExchange[],
      aversions,
    );

    expect(plan.dietaryPatternTag).toBe('hepatic_night_snack');

    const distribution = extractDistribution(plan);
    const lateSnack = distribution.slots.find((s: IMealSlotAllocation) => s.slot === 'late_snack');
    expect(lateSnack).toBeDefined();

    // late_snack should have starch and meat items
    const starchItems = lateSnack!.items.filter((i) => i.foodExchangeGroup === 'starch');
    const meatItems = lateSnack!.items.filter((i) => i.foodExchangeGroup === 'meat_medium');
    expect(starchItems.length).toBeGreaterThanOrEqual(1);
    expect(meatItems.length).toBeGreaterThanOrEqual(1);

    // Arabic insight for hepatic
    const insights = JSON.parse(plan.educationalInsightsJson) as { title: string; body: string; type: string }[];
    const hepaticCard = insights.find((c) => c.title === 'وجبة ما قبل النوم للكبد الدهني');
    expect(hepaticCard).toBeDefined();
    expect(hepaticCard!.body).toContain('الكبد المتعب');

    // Macros within 5%
    expect(r2(distribution.totalCalories / targets.calories)).toBeGreaterThanOrEqual(0.95);
    expect(r2(distribution.totalCalories / targets.calories)).toBeLessThanOrEqual(1.05);
  });

  it('removes averted foods from the safe pool', () => {
    const targets: ICalculatedMetabolicTargets = {
      calories: 1800, protein: 90, carbs: 200, fat: 50, fluidMl: 2000,
      dietaryPatternTag: 'standard',
    };

    const aversions: IPatientAversionRecord[] = [
      { patientId: 'p1', foodExchangeId: 'food-rice', exclusionReason: 'craving' },
    ];

    const plan = AutomatedMenuGeneratorEngine.generatePrescriptiveMenu(
      'p1',
      targets,
      masterFoods as unknown as IFoodExchange[],
      aversions,
    );

    const distribution = extractDistribution(plan);
    const foodNames = collectAllFoodNames(distribution);

    // Rice is averted, should not appear; bread is not averted but is gluten
    // bread is NOT selected because there's no celiac flag — but it's not averted
    // So bread COULD appear if there's no other starch. But rice is averted,
    // so bread is the only remaining starch. So bread SHOULD appear.
    expect(foodNames).not.toContain('أرز أبيض مطبوخ');
    expect(foodNames).toContain('خبز قمح');
  });
});
