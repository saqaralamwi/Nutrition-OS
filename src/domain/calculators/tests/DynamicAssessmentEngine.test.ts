import { describe, it, expect } from 'vitest';
import { DynamicAssessmentEngine } from '../DynamicAssessmentEngine';
import { MealPlannerEngine } from '../MealPlannerEngine';
import type { RawAssessmentInput } from '../../../data/types/assessment';
import type { FoodItem } from '../../../data/types/meal_planner';

function input(overrides?: Partial<RawAssessmentInput>): RawAssessmentInput {
  return {
    patientId: 'patient-1',
    actualWeight: 70,
    edema: 'NONE',
    ascites: 'NONE',
    labs: {},
    clinical: { gcsScore: 15 },
    ...overrides,
  };
}

describe('DynamicAssessmentEngine', () => {
  // ---------- calculateDryWeight ----------
  describe('calculateDryWeight', () => {
    it('returns actual weight when no edema or ascites', () => {
      const dw = DynamicAssessmentEngine.calculateDryWeight(70, 'NONE', 'NONE');
      expect(dw).toBe(70);
    });

    it('deducts 2% for GRADE_1 edema', () => {
      const dw = DynamicAssessmentEngine.calculateDryWeight(100, 'GRADE_1', 'NONE');
      expect(dw).toBe(98);
    });

    it('deducts 5% for GRADE_2 edema', () => {
      const dw = DynamicAssessmentEngine.calculateDryWeight(100, 'GRADE_2', 'NONE');
      expect(dw).toBe(95);
    });

    it('deducts 10% for GRADE_3 edema', () => {
      const dw = DynamicAssessmentEngine.calculateDryWeight(100, 'GRADE_3', 'NONE');
      expect(dw).toBe(90);
    });

    it('deducts 15% for GRADE_4 edema', () => {
      const dw = DynamicAssessmentEngine.calculateDryWeight(100, 'GRADE_4', 'NONE');
      expect(dw).toBe(85);
    });

    it('deducts 5% for MILD ascites', () => {
      const dw = DynamicAssessmentEngine.calculateDryWeight(100, 'NONE', 'MILD');
      expect(dw).toBe(95);
    });

    it('deducts 10% for MODERATE ascites', () => {
      const dw = DynamicAssessmentEngine.calculateDryWeight(100, 'NONE', 'MODERATE');
      expect(dw).toBe(90);
    });

    it('deducts 15% for SEVERE ascites', () => {
      const dw = DynamicAssessmentEngine.calculateDryWeight(100, 'NONE', 'SEVERE');
      expect(dw).toBe(85);
    });

    it('combines edema + ascites deductions', () => {
      const dw = DynamicAssessmentEngine.calculateDryWeight(100, 'GRADE_2', 'MODERATE');
      // 5% + 10% = 15% → 85
      expect(dw).toBe(85);
    });

    it('caps total deduction at 30%', () => {
      const dw = DynamicAssessmentEngine.calculateDryWeight(100, 'GRADE_4', 'SEVERE');
      // 15% + 15% = 30% → 70 (not 32.5% → 67.5)
      expect(dw).toBe(70);
    });

    it('clamps deduction at 30% even if combined exceeds it', () => {
      const dw = DynamicAssessmentEngine.calculateDryWeight(100, 'GRADE_4', 'SEVERE');
      expect(dw).toBe(70);
    });

    it('returns 0 for zero weight input', () => {
      const dw = DynamicAssessmentEngine.calculateDryWeight(0, 'GRADE_2', 'MILD');
      expect(dw).toBe(0);
    });

    it('returns 0 for negative weight input', () => {
      const dw = DynamicAssessmentEngine.calculateDryWeight(-10, 'NONE', 'NONE');
      expect(dw).toBe(0);
    });

    it('rounds result to 2 decimal places', () => {
      const dw = DynamicAssessmentEngine.calculateDryWeight(77.3, 'GRADE_1', 'MILD');
      // 77.3 * (1 - 0.02 - 0.05) = 77.3 * 0.93 = 71.889 → r2 = 71.89
      expect(dw).toBe(71.89);
    });
  });

  // ---------- processAssessment – Clinical Risk Flags ----------
  describe('processAssessment – protein restriction triggers', () => {
    it('activates strict protein when GCS ≤ 12', () => {
      const result = DynamicAssessmentEngine.processAssessment(input({
        clinical: { gcsScore: 12 },
      }));
      expect(result.isStrictProteinRestriction).toBe(true);
    });

    it('does NOT activate strict protein when GCS = 13', () => {
      const result = DynamicAssessmentEngine.processAssessment(input({
        clinical: { gcsScore: 13 },
      }));
      expect(result.isStrictProteinRestriction).toBe(false);
    });

    it('activates strict protein when West Haven is GRADE_3', () => {
      const result = DynamicAssessmentEngine.processAssessment(input({
        clinical: { gcsScore: 15, westHaven: 'GRADE_3' },
      }));
      expect(result.isStrictProteinRestriction).toBe(true);
    });

    it('activates strict protein when West Haven is GRADE_4', () => {
      const result = DynamicAssessmentEngine.processAssessment(input({
        clinical: { gcsScore: 15, westHaven: 'GRADE_4' },
      }));
      expect(result.isStrictProteinRestriction).toBe(true);
    });

    it('does NOT activate strict protein for West Haven GRADE_2', () => {
      const result = DynamicAssessmentEngine.processAssessment(input({
        clinical: { gcsScore: 15, westHaven: 'GRADE_2' },
      }));
      expect(result.isStrictProteinRestriction).toBe(false);
    });

    it('activates strict protein when serumAmmonia > 100', () => {
      const result = DynamicAssessmentEngine.processAssessment(input({
        labs: { serumAmmonia: 150 },
      }));
      expect(result.isStrictProteinRestriction).toBe(true);
      expect(result.activeContraindicatedNutrients).toContain('high_ammonia_triggers');
    });

    it('does NOT activate strict protein when serumAmmonia ≤ 100', () => {
      const result = DynamicAssessmentEngine.processAssessment(input({
        labs: { serumAmmonia: 100 },
      }));
      expect(result.isStrictProteinRestriction).toBe(false);
      expect(result.activeContraindicatedNutrients).not.toContain('high_ammonia_triggers');
    });
  });

  describe('processAssessment – contraindicated nutrients from labs', () => {
    it('adds potassium ban when K+ ≥ 5.2', () => {
      const result = DynamicAssessmentEngine.processAssessment(input({
        labs: { potassium: 5.2 },
      }));
      expect(result.activeContraindicatedNutrients).toContain('potassium');
    });

    it('does NOT add potassium ban when K+ < 5.2', () => {
      const result = DynamicAssessmentEngine.processAssessment(input({
        labs: { potassium: 5.1 },
      }));
      expect(result.activeContraindicatedNutrients).not.toContain('potassium');
    });

    it('adds sodium ban when Na+ < 130', () => {
      const result = DynamicAssessmentEngine.processAssessment(input({
        labs: { sodium: 129 },
      }));
      expect(result.activeContraindicatedNutrients).toContain('sodium');
    });

    it('does NOT add sodium ban when Na+ ≥ 130', () => {
      const result = DynamicAssessmentEngine.processAssessment(input({
        labs: { sodium: 130 },
      }));
      expect(result.activeContraindicatedNutrients).not.toContain('sodium');
    });
  });

  // ---------- processAssessment – Target Calculations ----------
  describe('processAssessment – target calculations', () => {
    it('calculates targets for healthy patient (no restrictions)', () => {
      const result = DynamicAssessmentEngine.processAssessment(input({
        actualWeight: 70,
        edema: 'NONE',
        ascites: 'NONE',
      }));

      expect(result.dryWeight).toBe(70);
      expect(result.targetCalories).toBe(70 * 30); // 2100
      expect(result.targetProtein).toBe(84); // 70 * 1.2
      expect(result.isStrictProteinRestriction).toBe(false);
    });

    it('calculates targets under strict protein restriction', () => {
      const result = DynamicAssessmentEngine.processAssessment(input({
        actualWeight: 70,
        clinical: { gcsScore: 11 },
      }));

      expect(result.isStrictProteinRestriction).toBe(true);
      expect(result.dryWeight).toBe(70);
      expect(result.targetCalories).toBe(2100);
      expect(result.targetProtein).toBe(56); // 70 * 0.8

      // remaining = 2100 - 56*4 = 2100 - 224 = 1876
      // fats = 1876 * 0.30 / 9 = 62.53 → Math.round = 63
      // carbs absorbs remainder: (1876 - 63*9) / 4 = 1309 / 4 = 327.25
      expect(result.targetFats).toBe(63);
      expect(result.targetCarbs).toBe(327.25);
    });

    it('calculates targets under strict with edema deduction', () => {
      const result = DynamicAssessmentEngine.processAssessment(input({
        actualWeight: 86,
        edema: 'GRADE_3',   // -10%
        ascites: 'MILD',    // -5%
        clinical: { gcsScore: 15, westHaven: 'GRADE_4' },
      }));

      // dryWeight = 86 * 0.85 = 73.1
      expect(result.dryWeight).toBe(73.1);
      expect(result.isStrictProteinRestriction).toBe(true);
      expect(result.targetCalories).toBe(Math.round(73.1 * 30)); // 2193
      expect(result.targetProtein).toBe(Math.round(73.1 * 0.8)); // 58
    });

    it('handles multiple contraindications simultaneously', () => {
      const result = DynamicAssessmentEngine.processAssessment(input({
        actualWeight: 65,
        labs: {
          potassium: 5.8,
          sodium: 125,
        },
        clinical: { gcsScore: 10 },
      }));

      expect(result.isStrictProteinRestriction).toBe(true);
      expect(result.activeContraindicatedNutrients).toContain('potassium');
      expect(result.activeContraindicatedNutrients).toContain('sodium');
    });
  });

  // ---------- Integration with MealPlannerEngine ----------
  describe('Integration – Assessment → MealPlanner pipeline', () => {
    it('outputs patient profile that MealPlannerEngine accepts', () => {
      const assessment = DynamicAssessmentEngine.processAssessment(input({
        actualWeight: 80,
        edema: 'GRADE_2',
        ascites: 'MILD',
        labs: { potassium: 5.5 },
        clinical: { gcsScore: 14 },
      }));

      const food: FoodItem = {
        id: 'test-food',
        nameAr: 'طعام اختبار',
        nameEn: 'Test Food',
        calories: 200,
        protein: 10,
        carbs: 25,
        fats: 6,
        micronutrients: {},
      };

      const result = MealPlannerEngine.filterAndPlanMeals(assessment, [food]);
      expect(result).toBeDefined();
      expect(result.safeFoods).toBeDefined();
      expect(typeof result.filteredCount.contraindicated).toBe('number');
      expect(typeof result.filteredCount.proteinViolation).toBe('number');
      expect(typeof result.filteredCount.macroMismatch).toBe('number');
    });

    it('drops potassium-rich foods after assessment flagged hyperkalemia', () => {
      const assessment = DynamicAssessmentEngine.processAssessment(input({
        actualWeight: 70,
        labs: { potassium: 5.5 },
      }));

      expect(assessment.activeContraindicatedNutrients).toContain('potassium');

      const highKFood: FoodItem = {
        id: 'high-k',
        nameAr: 'موز',
        nameEn: 'Banana',
        calories: 105,
        protein: 1.3,
        carbs: 27,
        fats: 0.4,
        micronutrients: { potassium: 422 },
      };

      // patient profile correctly flags potassium -> MealPlanner filters it
      const result = MealPlannerEngine.filterAndPlanMeals(assessment, [highKFood]);
      expect(result.filteredCount.contraindicated).toBe(1);
      expect(result.safeFoods).toHaveLength(0);
    });
  });
});
