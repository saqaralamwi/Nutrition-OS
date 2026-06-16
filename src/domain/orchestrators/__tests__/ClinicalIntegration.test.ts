import { describe, it, expect } from 'vitest';
import { ClinicalIntegrationOrchestrator } from '../ClinicalIntegrationOrchestrator';
import type { IClinicalIntegrationInput } from '../ClinicalIntegrationOrchestrator';
import { AutomatedMenuGeneratorEngine } from '../../calculators/AutomatedMenuGeneratorEngine';
import type { IFoodExchange, IPatientAversionRecord } from '../../../data/types/meal_planner';

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

const masterFoods: IFoodExchange[] = [RICE, BREAD, CHICKEN, EGG, SPINACH, BANANA, OLIVE_OIL];

describe('ClinicalIntegrationOrchestrator.fetchAndAggregatePatientTargets', () => {
  it('aggregates burn + COPD + celiac multi-comorbidity into correct metabolic targets', () => {
    const input: IClinicalIntegrationInput = {
      patientId: 'multi-morbid-1',
      patientWeightKg: 70,
      burnAssessment: { tbsaPercentage: 40 },
      respiratoryAssessment: { hasCo2Retention: true },
      celiacDiagnosis: 'celiac_disease',
      hasDialysis: false,
    };

    const result = ClinicalIntegrationOrchestrator.fetchAndAggregatePatientTargets(input);

    // === ASSERTS ===

    // 1. Protein highly elevated: burn = 2.0g/kg × 70kg = 140g
    expect(result.targets.protein).toBe(140);

    // 2. Hypermetabolic flag set
    expect(result.targets.isHypermetabolic).toBe(true);
    expect(result.targets.dietaryPatternTag).toBe('hypermetabolic_built');

    // 3. CO2 retention flag
    expect(result.targets.hasCo2Retention).toBe(true);

    // 4. Celiac flag
    expect(result.targets.isCeliac).toBe(true);

    // 5. Carbs restricted to ≤40% of total calories
    // Calories: 25*70 + 40*40 = 1750+1600 = 3350
    // Max carb kcal = 3350*0.4 = 1340 → max carb g = 1340/4 = 335
    // Baseline carbs = 250 < 335, so carbs remain 250 (no reduction needed)
    // Actually, let me verify: the burn sets calories to 25*70 + 40*min(40,50) = 1750+1600 = 3350
    // Then respiratory caps carbs at 40% of 3350 = 1340 kcal = 335g
    // Baseline is 250g which is under 335g, so carbs stay at 250
    expect(result.targets.carbs).toBeLessThanOrEqual(335);

    // 6. Conflict resolutions notes present
    expect(result.conflictResolutionNotes.length).toBeGreaterThanOrEqual(3);

    // Verify specific notes
    const burnNote = result.conflictResolutionNotes.find((n) => n.startsWith('[Burns]'));
    expect(burnNote).toBeDefined();
    expect(burnNote).toContain('TBSA=40%');

    const respNote = result.conflictResolutionNotes.find((n) => n.startsWith('[Respiratory]'));
    expect(respNote).toBeDefined();
    expect(respNote).toContain('CO2 retention');

    const celiacNote = result.conflictResolutionNotes.find((n) => n.startsWith('[Celiac]'));
    expect(celiacNote).toBeDefined();

    // 7. No renal stage set (no renal assessment provided)
    expect(result.targets.renalStage).toBeUndefined();
  });

  it('auto-generates a 6-slot prescriptive eating layout from the aggregated targets (gluten-free enforced)', () => {
    const input: IClinicalIntegrationInput = {
      patientId: 'multi-morbid-2',
      patientWeightKg: 70,
      burnAssessment: { tbsaPercentage: 30 },
      respiratoryAssessment: { hasCo2Retention: true },
      celiacDiagnosis: 'celiac_disease',
      hasDialysis: false,
    };

    const result = ClinicalIntegrationOrchestrator.fetchAndAggregatePatientTargets(input);
    const aversions: IPatientAversionRecord[] = [];

    const plan = AutomatedMenuGeneratorEngine.generatePrescriptiveMenu(
      input.patientId,
      result.targets,
      masterFoods,
      aversions,
    );

    // Plan has 6 slots
    const distribution = JSON.parse(plan.mealDistributionJson) as { slots: { slot: string; items: { foodNameAr: string }[] }[] };
    expect(distribution.slots.length).toBe(6);

    // Collect all food names
    const allFoods = distribution.slots.flatMap((s) => s.items.map((i) => i.foodNameAr));

    // Gluten-free enforced: bread (خبز قمح) must NOT appear
    expect(allFoods).not.toContain('خبز قمح');

    // Rice (gluten-free starch) should appear
    expect(allFoods).toContain('أرز أبيض مطبوخ');

    // Educational insights present (hypermetabolic card)
    const insights = JSON.parse(plan.educationalInsightsJson) as { title: string }[];
    const hyperCard = insights.find((c) => c.title === 'دعم التمثيل الغذائي المتسارع');
    expect(hyperCard).toBeDefined();

    // averageGlycemicLoad computed
    expect(plan.averageGlycemicLoad).toBeGreaterThanOrEqual(0);
  });

  it('resolves burn-renal conflict by capping protein when no dialysis', () => {
    const input: IClinicalIntegrationInput = {
      patientId: 'burn-renal-conflict',
      patientWeightKg: 70,
      burnAssessment: { tbsaPercentage: 40 },
      renalAssessment: { ckdStage: 'stage_5', measuredUrineOutput: 600 },
      hasDialysis: false,
    };

    const result = ClinicalIntegrationOrchestrator.fetchAndAggregatePatientTargets(input);

    // Burn wants 140g protein (2.0g/kg), renal wants <0.8g/kg
    // No dialysis → cap at 1.2g/kg = 84g
    expect(result.targets.protein).toBe(84);

    const conflictNote = result.conflictResolutionNotes.find((n) => n.startsWith('[Conflict]'));
    expect(conflictNote).toBeDefined();
    expect(conflictNote).toContain('capped at 84g');

    // Fluid restricted
    expect(result.targets.fluidMl).toBeLessThanOrEqual(1100); // 600+500
  });

  it('resolves burn-renal conflict by enforcing high protein when on dialysis', () => {
    const input: IClinicalIntegrationInput = {
      patientId: 'burn-dialysis',
      patientWeightKg: 70,
      burnAssessment: { tbsaPercentage: 40 },
      renalAssessment: { ckdStage: 'stage_5', measuredUrineOutput: 200 },
      hasDialysis: true,
    };

    const result = ClinicalIntegrationOrchestrator.fetchAndAggregatePatientTargets(input);

    // Dialysis active → burn protein enforced (140g)
    expect(result.targets.protein).toBe(140);

    const conflictNote = result.conflictResolutionNotes.find((n) => n.startsWith('[Conflict]'));
    expect(conflictNote).toBeDefined();
    expect(conflictNote).toContain('enforcing high protein');
  });

  it('returns clean baseline when no comorbidities provided', () => {
    const input: IClinicalIntegrationInput = {
      patientId: 'healthy',
      patientWeightKg: 70,
    };

    const result = ClinicalIntegrationOrchestrator.fetchAndAggregatePatientTargets(input);

    expect(result.targets.calories).toBe(2000);
    expect(result.targets.protein).toBe(60);
    expect(result.targets.carbs).toBe(250);
    expect(result.targets.fat).toBe(65);
    expect(result.targets.fluidMl).toBe(2000);
    expect(result.targets.isHypermetabolic).toBeUndefined();
    expect(result.targets.hasCo2Retention).toBeUndefined();
    expect(result.targets.isCeliac).toBeUndefined();
    expect(result.conflictResolutionNotes.length).toBe(0);
  });

  it('handles high-output GI loss fluid boost', () => {
    const input: IClinicalIntegrationInput = {
      patientId: 'gi-loss',
      patientWeightKg: 70,
      giLossOutputMl24h: 1200,
    };

    const result = ClinicalIntegrationOrchestrator.fetchAndAggregatePatientTargets(input);

    // Baseline 2000 + 1200*0.5 = 2600
    expect(result.targets.fluidMl).toBe(2600);

    const giNote = result.conflictResolutionNotes.find((n) => n.startsWith('[GI Loss]'));
    expect(giNote).toBeDefined();
  });
});
