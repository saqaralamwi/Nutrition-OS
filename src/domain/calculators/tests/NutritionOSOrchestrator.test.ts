import { describe, it, expect } from 'vitest';
import { NutritionOSOrchestrator } from '../NutritionOSOrchestrator';
import type { RawAssessmentInput } from '../../../data/types/assessment';
import type { DrugNutrientInteractionRecord } from '../../repositories/IDrugNutrientInteractionRepository';
import type { FoodItem } from '../../../data/types/meal_planner';

function assessment(overrides?: Partial<RawAssessmentInput>): RawAssessmentInput {
  return {
    patientId: 'orchestrator-test',
    actualWeight: 70,
    edema: 'NONE',
    ascites: 'NONE',
    labs: {},
    clinical: { gcsScore: 15 },
    ...overrides,
  };
}

/**
 * Returns a food matching the macro targets produced by a 70kg healthy assessment:
 * P≈16%, C≈58.9%, F≈25.3%
 */
function matchingFood(overrides?: Partial<FoodItem>): FoodItem {
  return {
    id: 'food-matching',
    nameAr: 'طعام',
    nameEn: 'Food',
    calories: 198,
    protein: 8,       // 8*4/198 = 16.16%
    carbs: 29,        // 29*4/198 = 58.59%
    fats: 5.5,        // 5.5*9/198 = 25%
    micronutrients: {},
    ...overrides,
  };
}

const SPIRONOLACTONE_RECORD: DrugNutrientInteractionRecord = {
  id: 'dni-spiro',
  activeIngredient: 'Spironolactone (K-sparing Diuretic)',
  clinicalSeverity: 'high',
  mechanismDescription: 'Aldosterone antagonist leads to potassium retention',
  dietaryActionRequired: 'Limit high-potassium foods. Monitor serum potassium.',
};

const WARFARIN_RECORD: DrugNutrientInteractionRecord = {
  id: 'dni-warf',
  activeIngredient: 'Warfarin',
  clinicalSeverity: 'high',
  mechanismDescription: 'Vitamin K antagonist',
  dietaryActionRequired: 'Maintain consistent vitamin K intake. Monitor INR.',
};

const METFORMIN_RECORD: DrugNutrientInteractionRecord = {
  id: 'dni-met',
  activeIngredient: 'Metformin',
  clinicalSeverity: 'moderate',
  mechanismDescription: 'Impairs vitamin B12 absorption',
  dietaryActionRequired: 'Monitor B12 levels annually. Supplement if deficient.',
};

describe('NutritionOSOrchestrator', () => {
  describe('runPipeline – basic flows', () => {
    it('processes a healthy patient with no drugs and safe foods', () => {
      const result = NutritionOSOrchestrator.runPipeline(
        assessment(),
        [],
        [],
        [matchingFood()],
      );

      expect(result.patientProfile.id).toBe('orchestrator-test');
      expect(result.patientProfile.dryWeight).toBe(70);
      expect(result.patientProfile.isStrictProteinRestriction).toBe(false);
      expect(result.patientProfile.activeContraindicatedNutrients).toEqual([]);
      expect(result.mealPlanResult.safeFoods).toHaveLength(1);
      expect(result.summary.alerts).toEqual([]);
      expect(result.summary.suggestedActionPlanAr).toContain('خطة اعتيادية');
    });

    it('processes a patient with empty food array', () => {
      const result = NutritionOSOrchestrator.runPipeline(
        assessment(),
        [],
        [],
        [],
      );

      expect(result.mealPlanResult.safeFoods).toEqual([]);
      expect(result.mealPlanResult.filteredCount.contraindicated).toBe(0);
    });
  });

  describe('runPipeline – drug interaction injection', () => {
    it('injects potassium ban for Spironolactone + hyperkalemia', () => {
      const result = NutritionOSOrchestrator.runPipeline(
        assessment({ labs: { potassium: 5.5 } }),
        ['Spironolactone (K-sparing Diuretic)'],
        [SPIRONOLACTONE_RECORD],
        [matchingFood()],
      );

      expect(result.patientProfile.activeContraindicatedNutrients).toContain('potassium');
      const kAlert = result.summary.alerts.find((a) => a.titleAr.includes('بوتاسيوم'));
      expect(kAlert).toBeDefined();
      expect(result.summary.suggestedActionPlanAr).toBeTruthy();
    });

    it('processes Warfarin and generates vitamin_K alert', () => {
      const result = NutritionOSOrchestrator.runPipeline(
        assessment(),
        ['Warfarin'],
        [WARFARIN_RECORD],
        [matchingFood()],
      );

      expect(result.patientProfile.activeContraindicatedNutrients).toContain('vitamin_k');
      const vkAlert = result.summary.alerts.find((a) => a.id.includes('VITK_BAN'));
      expect(vkAlert).toBeDefined();
      expect(vkAlert!.level).toBe('critical');
    });

    it('processes Metformin without injecting contraindication (DEPLETION only)', () => {
      const result = NutritionOSOrchestrator.runPipeline(
        assessment(),
        ['Metformin'],
        [METFORMIN_RECORD],
        [matchingFood()],
      );

      expect(result.patientProfile.activeContraindicatedNutrients).toEqual([]);
      const metAlert = result.summary.alerts.find((a) => a.titleAr.includes('ميتفورمين'));
      expect(metAlert).toBeDefined();
      expect(metAlert!.level).toBe('warning');
    });
  });

  describe('runPipeline – protein restriction cascade', () => {
    it('activates protein restriction for GCS ≤ 12', () => {
      // Strict protein profile: P≈10.67%, C≈62.48%, F≈27%
      const strictFood: FoodItem = {
        id: 'strict-food',
        nameAr: 'طعام مقيد',
        nameEn: 'Strict Food',
        calories: 199,
        protein: 5.3,   // 5.3*4/199 = 10.65%
        carbs: 31,       // 31*4/199 = 62.31%
        fats: 6,         // 6*9/199 = 27.14%
        micronutrients: {},
      };

      const result = NutritionOSOrchestrator.runPipeline(
        assessment({ clinical: { gcsScore: 10 } }),
        [],
        [],
        [strictFood],
      );

      expect(result.patientProfile.isStrictProteinRestriction).toBe(true);
      expect(result.patientProfile.targetProtein).toBe(56); // 70 * 0.8
      const protAlert = result.summary.alerts.find((a) => a.titleAr.includes('بروتيني'));
      expect(protAlert).toBeDefined();
      expect(protAlert!.level).toBe('critical');
      expect(result.summary.suggestedActionPlanAr).toContain('خطة حرجة');
    });

    it('activates protein restriction for high ammonia', () => {
      const result = NutritionOSOrchestrator.runPipeline(
        assessment({ labs: { serumAmmonia: 150 } }),
        [],
        [],
        [matchingFood()],
      );

      expect(result.patientProfile.isStrictProteinRestriction).toBe(true);
      expect(result.patientProfile.activeContraindicatedNutrients).toContain('high_ammonia_triggers');
    });
  });

  describe('runPipeline – macro filtering', () => {
    it('filters foods by macro targets from assessment', () => {
      // 100kg healthy: P=16%, C=58.8%, F=25.2%
      // Use a food with 50% carbs → |50-58.8| = 8.8 > 5 → filtered
      const mismatchedFood: FoodItem = {
        id: 'mismatch',
        nameAr: 'غير متطابق',
        nameEn: 'Mismatched',
        calories: 200,
        protein: 10,      // 20% → |20-16| = 4 ✓
        carbs: 25,        // 50% → |50-58.8| = 8.8 > 5 ✗
        fats: 6,          // 27% → |27-25.2| = 1.8 ✓
        micronutrients: {},
      };

      const result = NutritionOSOrchestrator.runPipeline(
        assessment({ actualWeight: 100 }),
        [],
        [],
        [mismatchedFood],
      );

      expect(result.mealPlanResult.safeFoods).toHaveLength(0);
      expect(result.mealPlanResult.filteredCount.macroMismatch).toBe(1);
    });
  });

  describe('runPipeline – complex clinical scenario', () => {
    it('handles hepatic encephalopathy + Spironolactone + Warfarin together', () => {
      const banana: FoodItem = {
        id: 'banana', nameAr: 'موز', nameEn: 'Banana',
        calories: 105, protein: 1.3, carbs: 27, fats: 0.4,
        micronutrients: { potassium: 422 },
      };
      // Strict protein 80kg*0.9=72kg dry, GCS10→protein=58g
      // P=58*4/2160=10.74%, C=62.3%, F=27%
      const safeFood: FoodItem = {
        id: 'safe', nameAr: 'طعام آمن', nameEn: 'Safe Food',
        calories: 199,
        protein: 5.3,   // 10.65%
        carbs: 31,       // 62.31%
        fats: 6,         // 27.14%
        micronutrients: {},
      };

      const result = NutritionOSOrchestrator.runPipeline(
        assessment({
          actualWeight: 80,
          edema: 'GRADE_2',
          ascites: 'MILD',
          labs: { potassium: 5.5, serumAmmonia: 150 },
          clinical: { gcsScore: 10, westHaven: 'GRADE_3' },
        }),
        ['Spironolactone (K-sparing Diuretic)', 'Warfarin'],
        [SPIRONOLACTONE_RECORD, WARFARIN_RECORD],
        [banana, safeFood],
      );

      expect(result.patientProfile.dryWeight).toBe(72); // 80 * 0.9
      expect(result.patientProfile.isStrictProteinRestriction).toBe(true);
      expect(result.patientProfile.activeContraindicatedNutrients).toContain('potassium');
      expect(result.patientProfile.activeContraindicatedNutrients).toContain('high_ammonia_triggers');
      expect(result.patientProfile.activeContraindicatedNutrients).toContain('vitamin_k');

      expect(result.mealPlanResult.filteredCount.contraindicated).toBeGreaterThanOrEqual(1);
      expect(result.mealPlanResult.safeFoods.length).toBeGreaterThanOrEqual(0);

      const criticalAlerts = result.summary.alerts.filter((a) => a.level === 'critical');
      expect(criticalAlerts.length).toBeGreaterThanOrEqual(2);
      expect(result.summary.educationalNotesAr.length).toBeGreaterThan(0);
      expect(result.summary.suggestedActionPlanAr).toContain('خطة حرجة');
    });
  });

  describe('runPipeline – all path result structure', () => {
    it('returns a fully structured result object with all 3 keys', () => {
      const result = NutritionOSOrchestrator.runPipeline(
        assessment(),
        [],
        [],
        [matchingFood()],
      );

      expect(result).toHaveProperty('patientProfile');
      expect(result).toHaveProperty('mealPlanResult');
      expect(result).toHaveProperty('summary');

      expect(result.patientProfile).toHaveProperty('id');
      expect(result.patientProfile).toHaveProperty('dryWeight');
      expect(result.patientProfile).toHaveProperty('targetCalories');
      expect(result.patientProfile).toHaveProperty('targetProtein');
      expect(result.patientProfile).toHaveProperty('targetCarbs');
      expect(result.patientProfile).toHaveProperty('targetFats');
      expect(result.patientProfile).toHaveProperty('isStrictProteinRestriction');
      expect(result.patientProfile).toHaveProperty('activeContraindicatedNutrients');

      expect(result.mealPlanResult).toHaveProperty('safeFoods');
      expect(result.mealPlanResult).toHaveProperty('filteredCount');

      expect(result.summary).toHaveProperty('alerts');
      expect(result.summary).toHaveProperty('educationalNotesAr');
      expect(result.summary).toHaveProperty('suggestedActionPlanAr');
    });
  });
});
