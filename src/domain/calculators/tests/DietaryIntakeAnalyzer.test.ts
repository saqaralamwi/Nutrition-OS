import { describe, it, expect } from 'vitest';
import { DietaryIntakeAnalyzerEngine } from '../DietaryIntakeAnalyzerEngine';
import type { IFoodExchange, IDietaryHistorySession, IDietaryHistoryItem } from '../../../data/types/meal_planner';

const banana: IFoodExchange = {
  exchangeGroup: 'fruit',
  foodNameAr: 'موز',
  servingSizeDesc: 'حبة صغيرة - 60 غرام',
  carbsG: 23,
  proteinG: 1.1,
  fatG: 0.3,
  caloriesKcal: 89,
  glycemicIndex: 52,
  potassiumLevel: 'medium',
  phosphorusLevel: 'low',
  isGlutenFree: true,
  isLowFodmap: false,
  isLactoseFree: true,
  isUserDefined: false,
  associatedPatientId: null,
  isCompositeRecipe: false,
  recipeDecompositionJson: '[]',
  householdUnitsJson: '{}',
  micronutrientTagsJson: '["potassium","vitamin_b6"]',
};

const kabsahBase: IFoodExchange = {
  exchangeGroup: 'starch',
  foodNameAr: 'كبسة دجاج',
  servingSizeDesc: 'طبق وسط - 300 غرام',
  carbsG: 0,
  proteinG: 0,
  fatG: 0,
  caloriesKcal: 0,
  glycemicIndex: 65,
  potassiumLevel: 'high',
  phosphorusLevel: 'high',
  isGlutenFree: false,
  isLowFodmap: false,
  isLactoseFree: true,
  isUserDefined: false,
  associatedPatientId: null,
  isCompositeRecipe: true,
  recipeDecompositionJson: JSON.stringify([
    { exchangeGroup: 'starch', carbsG: 45, proteinG: 4, fatG: 0.5, caloriesKcal: 200, servingMultiplier: 1.5 },
    { exchangeGroup: 'meat_lean', carbsG: 0, proteinG: 21, fatG: 3, caloriesKcal: 120, servingMultiplier: 1 },
    { exchangeGroup: 'vegetable', carbsG: 5, proteinG: 1, fatG: 0.5, caloriesKcal: 30, servingMultiplier: 0.5 },
  ]),
  householdUnitsJson: '{}',
  micronutrientTagsJson: '["zinc","vitamin_c","heme_iron"]',
};

const yogurt: IFoodExchange = {
  exchangeGroup: 'milk',
  foodNameAr: 'زبادي',
  servingSizeDesc: 'كوب وسط - 150 غرام',
  carbsG: 12,
  proteinG: 8,
  fatG: 3.5,
  caloriesKcal: 100,
  glycemicIndex: 30,
  potassiumLevel: 'low',
  phosphorusLevel: 'medium',
  isGlutenFree: true,
  isLowFodmap: true,
  isLactoseFree: false,
  isUserDefined: false,
  associatedPatientId: null,
  isCompositeRecipe: false,
  recipeDecompositionJson: '[]',
  householdUnitsJson: '{}',
  micronutrientTagsJson: '["calcium","vitamin_d"]',
};

const masterFoods: IFoodExchange[] = [banana, kabsahBase, yogurt];

const session: IDietaryHistorySession = {
  patientId: 'patient-1',
  interviewDate: 20260615,
  dayType: 'normal_weekday',
  reliabilityScore: 'high',
  totalComputedCalories: 0,
  totalComputedProtein: 0,
  totalFluidIntakeMl: 0,
  recordedAt: 202606151800,
};

const breakfastItem: IDietaryHistoryItem = {
  sessionId: 'session-1',
  mealSlotType: 'breakfast',
  consumptionTime: '08:00',
  foodExchangeId: 'food-banana',
  customReportedName: 'موز',
  servingUnitUsed: 'piece',
  servingsConsumed: 1,
  derivedFluidMl: 0,
  derivedCalories: 0,
  derivedProtein: 0,
  derivedCarbs: 0,
  derivedFat: 0,
};

const lunchItem: IDietaryHistoryItem = {
  sessionId: 'session-1',
  mealSlotType: 'lunch',
  consumptionTime: '13:30',
  foodExchangeId: 'food-kabsah',
  customReportedName: 'كبسة دجاج',
  servingUnitUsed: 'cup',
  servingsConsumed: 2,
  derivedFluidMl: 150,
  derivedCalories: 0,
  derivedProtein: 0,
  derivedCarbs: 0,
  derivedFat: 0,
};

const snackItem: IDietaryHistoryItem = {
  sessionId: 'session-1',
  mealSlotType: 'late_snack',
  consumptionTime: '22:00',
  foodExchangeId: 'food-yogurt',
  customReportedName: 'زبادي',
  servingUnitUsed: 'cup',
  servingsConsumed: 1,
  derivedFluidMl: 100,
  derivedCalories: 0,
  derivedProtein: 0,
  derivedCarbs: 0,
  derivedFat: 0,
};

const threeMealItems: IDietaryHistoryItem[] = [breakfastItem, lunchItem, snackItem];

describe('DietaryIntakeAnalyzerEngine.analyzeSessionIntake', () => {
  it('calculates exact totals with 2-decimal rounding across 3 meal slots (banana + kabsah + yogurt)', () => {
    const result = DietaryIntakeAnalyzerEngine.analyzeSessionIntake(
      session,
      threeMealItems,
      masterFoods,
      { calories: 2000, protein: 150, carbs: 250, fat: 55, fluidMl: 2000 },
    );

    // Breakfast: 1 piece banana → coefficient=1 → 89 kcal, 1.1g P, 23g C, 0.3g F
    // Lunch: 2 cups kabsah (composite) → coeff=2, baseMultiplier=4
    //   rice: 200*4*1.5=1200, chicken: 120*4*1=480, veg: 30*4*0.5=60 → 1740 kcal
    //   protein: 4*4*1.5=24 + 21*4*1=84 + 1*4*0.5=2 → 110g
    //   carbs: 45*4*1.5=270 + 0 + 5*4*0.5=10 → 280g
    //   fat: 0.5*4*1.5=3 + 3*4*1=12 + 0.5*4*0.5=1 → 16g
    // Snack: 1 cup yogurt → coefficient=2 → 200 kcal, 16g P, 24g C, 7g F
    // Totals: kcal=89+1740+200=2029, P=1.1+110+16=127.1, C=23+280+24=327, F=0.3+16+7=23.3
    // Fluid: 0+150+100=250

    expect(result.actualTotals.calories).toBe(2029);
    expect(result.actualTotals.protein).toBe(127.1);
    expect(result.actualTotals.carbs).toBe(327);
    expect(result.actualTotals.fat).toBe(23.3);
    expect(result.actualTotals.fluidMl).toBe(250);

    // Coverage: 2029/2000*100=101.45, 127.1/150*100=84.73, 327/250*100=130.80
    // 23.3/55*100=42.36, 250/2000*100=12.50
    expect(result.coveragePercentages.calories).toBe(101.45);
    expect(result.coveragePercentages.protein).toBe(84.73);
    expect(result.coveragePercentages.carbs).toBe(130.80);
    expect(result.coveragePercentages.fat).toBe(42.36);
    expect(result.coveragePercentages.fluid).toBe(12.50);

    expect(result.isSafe).toBe(true);
  });

  it('fires CO2 retention critical alert when carb ratio exceeds 50% and hasCo2Retention is true', () => {
    const result = DietaryIntakeAnalyzerEngine.analyzeSessionIntake(
      session,
      threeMealItems,
      masterFoods,
      { calories: 2000, protein: 150, carbs: 250, fat: 55, fluidMl: 2000, hasCo2Retention: true },
    );

    // carbEnergy = 327*4 = 1308, total = 2029, ratio = 1308/2029 ≈ 0.645 > 0.5
    const respiratoryAlerts = result.clinicalAlerts.filter((a) => a.type === 'respiratory');
    expect(respiratoryAlerts.length).toBe(1);
    expect(respiratoryAlerts[0].severity).toBe('critical');
    expect(respiratoryAlerts[0].arabicMessage).toContain('CO2');
    expect(result.isSafe).toBe(false);
  });

  it('fires renal critical alerts when renalStage is severe_aki_ckd and high K/Ph foods consumed', () => {
    const result = DietaryIntakeAnalyzerEngine.analyzeSessionIntake(
      session,
      threeMealItems,
      masterFoods,
      { calories: 2000, protein: 150, carbs: 250, fat: 55, fluidMl: 2000, renalStage: 'severe_aki_ckd' },
    );

    const renalAlerts = result.clinicalAlerts.filter((a) => a.type === 'renal');
    expect(renalAlerts.length).toBeGreaterThanOrEqual(1);
    for (const alert of renalAlerts) {
      expect(alert.severity).toBe('critical');
      expect(alert.arabicMessage).toContain('البوتاسيوم/الفوسفور');
    }
    expect(result.isSafe).toBe(false);
  });

  it('generates hypermetabolic educational card when calorie coverage < 50% and isHypermetabolic is true', () => {
    const result = DietaryIntakeAnalyzerEngine.analyzeSessionIntake(
      session,
      threeMealItems,
      masterFoods,
      { calories: 5000, protein: 150, carbs: 250, fat: 55, fluidMl: 2000, isHypermetabolic: true },
    );

    // coverage: 2029/5000*100 = 40.58% < 50%
    expect(result.coveragePercentages.calories).toBe(40.58);
    const hasBurnCard = result.educationalCards.some((c) => c.includes('مريض الحروق'));
    expect(hasBurnCard).toBe(true);
    expect(result.isSafe).toBe(true);
  });

  it('generates zinc+vitamin C educational card when those micronutrients are consumed', () => {
    const result = DietaryIntakeAnalyzerEngine.analyzeSessionIntake(
      session,
      threeMealItems,
      masterFoods,
      { calories: 2000, protein: 150, carbs: 250, fat: 55, fluidMl: 2000 },
    );

    const hasCollagenCard = result.educationalCards.some((c) => c.includes('الكولاجين'));
    expect(hasCollagenCard).toBe(true);
  });

  it('returns safe with zero totals for empty items array', () => {
    const result = DietaryIntakeAnalyzerEngine.analyzeSessionIntake(
      session,
      [],
      masterFoods,
      { calories: 2000, protein: 150, carbs: 250, fat: 55, fluidMl: 2000 },
    );

    expect(result.actualTotals.calories).toBe(0);
    expect(result.actualTotals.protein).toBe(0);
    expect(result.actualTotals.carbs).toBe(0);
    expect(result.actualTotals.fat).toBe(0);
    expect(result.actualTotals.fluidMl).toBe(0);
    expect(result.isSafe).toBe(true);
    expect(result.clinicalAlerts.length).toBe(0);
  });
});
