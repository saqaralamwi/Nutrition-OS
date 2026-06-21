import { describe, it, expect } from 'vitest';
import { DNIEngine } from '../DNIEngine';
import { DynamicAssessmentEngine } from '../DynamicAssessmentEngine';
import { MealPlannerEngine } from '../MealPlannerEngine';
import type { DrugNutrientInteraction, DNIResult } from '../../../data/types/dni';
import type { DrugNutrientInteractionRecord } from '../../repositories/IDrugNutrientInteractionRepository';
import type { FoodItem } from '../../../data/types/meal_planner';
import type { RawAssessmentInput } from '../../../data/types/assessment';

function dni(overrides?: Partial<DrugNutrientInteraction>): DrugNutrientInteraction {
  return {
    id: 'dni-1',
    drugNameEn: 'Spironolactone (K-sparing Diuretic)',
    drugNameAr: 'سبيرونولاكتون',
    affectedNutrient: 'potassium',
    type: 'CONTRAINDICATION',
    severity: 'CRITICAL',
    mechanismAr: 'مضاد الألدوستيرون يؤدي إلى احتباس البوتاسيوم',
    recommendationAr: 'الحد من الأطعمة الغنية بالبوتاسيوم',
    ...overrides,
  };
}

describe('DNIEngine', () => {
  // ---------- evaluateInteractions ----------
  describe('evaluateInteractions', () => {
    it('injects contraindicated nutrient for CRITICAL + CONTRAINDICATION drug', () => {
      const result = DNIEngine.evaluateInteractions(
        ['Spironolactone (K-sparing Diuretic)'],
        [],
        [dni()],
      );

      expect(result.updatedContraindicatedNutrients).toContain('potassium');
      expect(result.triggeredInteractions).toHaveLength(1);
    });

    it('does NOT inject for MODERATE + DEPLETION drug', () => {
      const metformin: DrugNutrientInteraction = dni({
        id: 'dni-2',
        drugNameEn: 'Metformin',
        affectedNutrient: 'vitamin_b12',
        type: 'DEPLETION',
        severity: 'MODERATE',
      });

      const result = DNIEngine.evaluateInteractions(
        ['Metformin'],
        [],
        [metformin],
      );

      expect(result.updatedContraindicatedNutrients).not.toContain('vitamin_b12');
      expect(result.triggeredInteractions).toHaveLength(1);
    });

    it('does NOT inject for CRITICAL + DEPLETION (only CONTRAINDICATION)', () => {
      const prednisolone: DrugNutrientInteraction = dni({
        id: 'dni-3',
        drugNameEn: 'Prednisolone (Corticosteroids)',
        affectedNutrient: 'calcium',
        type: 'DEPLETION',
        severity: 'CRITICAL',
      });

      const result = DNIEngine.evaluateInteractions(
        ['Prednisolone (Corticosteroids)'],
        [],
        [prednisolone],
      );

      expect(result.updatedContraindicatedNutrients).not.toContain('calcium');
      expect(result.triggeredInteractions).toHaveLength(1);
    });

    it('does NOT inject for MODERATE + CONTRAINDICATION', () => {
      const captopril: DrugNutrientInteraction = dni({
        id: 'dni-4',
        drugNameEn: 'Captopril (ACE Inhibitor)',
        affectedNutrient: 'potassium',
        type: 'CONTRAINDICATION',
        severity: 'MODERATE',
      });

      const result = DNIEngine.evaluateInteractions(
        ['Captopril (ACE Inhibitor)'],
        [],
        [captopril],
      );

      expect(result.updatedContraindicatedNutrients).not.toContain('potassium');
      expect(result.triggeredInteractions).toHaveLength(1);
    });

    it('handles multiple drugs matching multiple interactions', () => {
      const warfarin: DrugNutrientInteraction = dni({
        id: 'dni-5',
        drugNameEn: 'Warfarin',
        affectedNutrient: 'vitamin_k',
        type: 'CONTRAINDICATION',
        severity: 'CRITICAL',
      });
      const furosemide: DrugNutrientInteraction = dni({
        id: 'dni-6',
        drugNameEn: 'Furosemide (Loop Diuretic)',
        affectedNutrient: 'potassium',
        type: 'DEPLETION',
        severity: 'MODERATE',
      });
      const alendronate: DrugNutrientInteraction = dni({
        id: 'dni-7',
        drugNameEn: 'Alendronate (Bisphosphonate)',
        affectedNutrient: 'calcium',
        type: 'CONTRAINDICATION',
        severity: 'CRITICAL',
      });

      const result = DNIEngine.evaluateInteractions(
        ['Warfarin', 'Alendronate (Bisphosphonate)'],
        [],
        [warfarin, furosemide, alendronate],
      );

      expect(result.triggeredInteractions).toHaveLength(2);
      expect(result.updatedContraindicatedNutrients).toContain('vitamin_k');
      expect(result.updatedContraindicatedNutrients).toContain('calcium');
      expect(result.updatedContraindicatedNutrients).not.toContain('potassium');
    });

    it('returns empty result when no drugs match', () => {
      const result = DNIEngine.evaluateInteractions(
        ['Paracetamol'],
        [],
        [dni()],
      );

      expect(result.triggeredInteractions).toHaveLength(0);
      expect(result.updatedContraindicatedNutrients).toEqual([]);
    });

    it('preserves existing contraindications and adds new ones', () => {
      const spironolactone = dni({
        drugNameEn: 'Spironolactone (K-sparing Diuretic)',
        affectedNutrient: 'potassium',
      });
      const existing = ['sodium'];

      const result = DNIEngine.evaluateInteractions(
        ['Spironolactone (K-sparing Diuretic)'],
        existing,
        [spironolactone],
      );

      expect(result.updatedContraindicatedNutrients).toContain('sodium');
      expect(result.updatedContraindicatedNutrients).toContain('potassium');
    });

    it('matches drug names case-insensitively', () => {
      const result = DNIEngine.evaluateInteractions(
        ['spironolactone (k-sparing diuretic)'],
        [],
        [dni({ drugNameEn: 'Spironolactone (K-sparing Diuretic)' })],
      );

      expect(result.triggeredInteractions).toHaveLength(1);
      expect(result.updatedContraindicatedNutrients).toContain('potassium');
    });

    it('removes duplicate nutrients', () => {
      const warfarin: DrugNutrientInteraction = dni({
        id: 'dni-a',
        drugNameEn: 'Warfarin',
        affectedNutrient: 'vitamin_k',
        type: 'CONTRAINDICATION',
        severity: 'CRITICAL',
      });

      const existing = ['vitamin_k'];

      const result = DNIEngine.evaluateInteractions(
        ['Warfarin'],
        existing,
        [warfarin],
      );

      expect(result.updatedContraindicatedNutrients).toEqual(['vitamin_k']);
    });

    it('returns empty triggeredInteractions for empty drug list', () => {
      const result = DNIEngine.evaluateInteractions([], [], [dni()]);

      expect(result.triggeredInteractions).toHaveLength(0);
    });
  });

  // ---------- mapFromRepository ----------
  describe('mapFromRepository', () => {
    it('maps a known drug record correctly', () => {
      const record: DrugNutrientInteractionRecord = {
        id: 'rec-1',
        activeIngredient: 'Warfarin',
        clinicalSeverity: 'high',
        mechanismEn: 'Vitamin K antagonist',
        dietaryActionEn: 'Maintain consistent vitamin K intake',
      };

      const mapped = DNIEngine.mapFromRepository([record]);
      expect(mapped).toHaveLength(1);
      expect(mapped[0].drugNameEn).toBe('Warfarin');
      expect(mapped[0].drugNameAr).toBe('وارفارين');
      expect(mapped[0].affectedNutrient).toBe('vitamin_k');
      expect(mapped[0].type).toBe('CONTRAINDICATION');
      expect(mapped[0].severity).toBe('CRITICAL');
    });

    it('normalizes clinicalSeverity high → CRITICAL', () => {
      const record: DrugNutrientInteractionRecord = {
        activeIngredient: 'Test-Drug',
        clinicalSeverity: 'high',
      };
      const mapped = DNIEngine.mapFromRepository([record]);
      expect(mapped[0].severity).toBe('CRITICAL');
    });

    it('normalizes clinicalSeverity moderate → MODERATE', () => {
      const record: DrugNutrientInteractionRecord = {
        activeIngredient: 'Test-Drug',
        clinicalSeverity: 'moderate',
      };
      const mapped = DNIEngine.mapFromRepository([record]);
      expect(mapped[0].severity).toBe('MODERATE');
    });

    it('handles unknown drug with fallback inference', () => {
      const record: DrugNutrientInteractionRecord = {
        activeIngredient: 'SomeNewDrug',
        clinicalSeverity: 'moderate',
        mechanismEn: 'This drug affects potassium levels significantly',
        dietaryActionEn: 'Limit potassium-rich foods for the patient',
      };

      const mapped = DNIEngine.mapFromRepository([record]);
      expect(mapped[0].affectedNutrient).toBe('potassium');
      expect(mapped[0].type).toBe('CONTRAINDICATION');
      expect(mapped[0].severity).toBe('MODERATE');
    });

    it('returns empty array for empty input', () => {
      const mapped = DNIEngine.mapFromRepository([]);
      expect(mapped).toEqual([]);
    });
  });

  // ---------- updatePatientProfile ----------
  describe('updatePatientProfile', () => {
    it('replaces contraindications with DNI result', () => {
      const profile = {
        id: 'p1',
        dryWeight: 70,
        targetCalories: 2100,
        targetProtein: 84,
        targetCarbs: 250,
        targetFats: 60,
        isStrictProteinRestriction: false,
        activeContraindicatedNutrients: ['oxalate'],
      };

      const dniResult: DNIResult = {
        updatedContraindicatedNutrients: ['oxalate', 'potassium'],
        triggeredInteractions: [dni()],
      };

      const updated = DNIEngine.updatePatientProfile(profile, dniResult);
      expect(updated.activeContraindicatedNutrients).toEqual(['oxalate', 'potassium']);
      expect(updated.id).toBe('p1');
      expect(updated.dryWeight).toBe(70);
    });
  });

  // ---------- Full Pipeline Integration ----------
  describe('Integration – Assessment → DNI → MealPlanner', () => {
    it('full pipeline: raw assessment through DNI to filtered meals', () => {
      // Step 1: DynamicAssessmentEngine produces profile
      const rawInput: RawAssessmentInput = {
        patientId: 'pipeline-test',
        actualWeight: 80,
        edema: 'GRADE_2',
        ascites: 'MILD',
        labs: { potassium: 5.5 },
        clinical: { gcsScore: 15 },
      };

      const profile = DynamicAssessmentEngine.processAssessment(rawInput);
      expect(profile.activeContraindicatedNutrients).toContain('potassium');
      expect(profile.isStrictProteinRestriction).toBe(false);

      // Step 2: DNIEngine evaluates drug interactions
      const spironolactone: DrugNutrientInteraction = {
        id: 'dni-spiro',
        drugNameEn: 'Spironolactone (K-sparing Diuretic)',
        drugNameAr: 'سبيرونولاكتون',
        affectedNutrient: 'potassium',
        type: 'CONTRAINDICATION',
        severity: 'CRITICAL',
        mechanismAr: 'مضاد الألدوستيرون',
        recommendationAr: 'الحد من البوتاسيوم',
      };

      const dniResult = DNIEngine.evaluateInteractions(
        ['Spironolactone (K-sparing Diuretic)'],
        profile.activeContraindicatedNutrients,
        [spironolactone],
      );

      // Should still have potassium (no duplicate)
      expect(dniResult.updatedContraindicatedNutrients).toEqual(['potassium']);
      expect(dniResult.triggeredInteractions).toHaveLength(1);

      const updatedProfile = DNIEngine.updatePatientProfile(profile, dniResult);

      // Step 3: MealPlannerEngine filters foods
      const banana: FoodItem = {
        id: 'banana',
        nameAr: 'موز',
        nameEn: 'Banana',
        calories: 105,
        protein: 1.3,
        carbs: 27,
        fats: 0.4,
        micronutrients: { potassium: 422 },
      };

      // Compute safe food macro split to match profile:
      // P%=15.93±5, C%=58.89±5, F%=25.42±5
      const safeFood: FoodItem = {
        id: 'safe',
        nameAr: 'طعام آمن',
        nameEn: 'Safe Food',
        calories: 201,
        protein: 8,    // 8*4/201=15.92%
        carbs: 30,     // 30*4/201=59.70%
        fats: 5.5,     // 5.5*9/201=24.63%
        micronutrients: {},
      };

      const mealResult = MealPlannerEngine.filterAndPlanMeals(updatedProfile, [banana, safeFood]);
      expect(mealResult.filteredCount.contraindicated).toBe(1);
      expect(mealResult.safeFoods).toHaveLength(1);
      expect(mealResult.safeFoods[0].id).toBe('safe');
    });
  });
});
