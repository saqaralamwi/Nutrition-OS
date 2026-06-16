import { describe, it, expect } from 'vitest';
import { MealPlannerEngine } from '../MealPlannerEngine';
import type { PatientProfile, FoodItem } from '../../../data/types/meal_planner';

function patient(overrides?: Partial<PatientProfile>): PatientProfile {
  return {
    id: 'patient-1',
    dryWeight: 70,
    targetCalories: 2000,
    targetProtein: 100,
    targetCarbs: 250,
    targetFats: 60,
    activeContraindicatedNutrients: [],
    isStrictProteinRestriction: false,
    ...overrides,
  };
}

function food(overrides?: Partial<FoodItem>): FoodItem {
  return {
    id: 'food-default',
    nameAr: 'طعام',
    nameEn: 'Food',
    calories: 200,
    protein: 10,
    carbs: 25,
    fats: 6,
    micronutrients: {},
    ...overrides,
  };
}

/** Returns a food whose macro-% distribution matches the default patient (20%P / 50%C / 27%F). */
function matchingFood(overrides?: Partial<FoodItem>): FoodItem {
  return food(overrides);
}

describe('MealPlannerEngine', () => {
  // ---------- Filter 1: DNI / Safety Brake ----------
  describe('Filter 1 – Contraindicated nutrient drop', () => {
    it('drops food when contraindicated micronutrient exceeds 100mg threshold', () => {
      const p = patient({ activeContraindicatedNutrients: ['potassium'] });
      const safe = matchingFood({ id: 'safe', micronutrients: { potassium: 50 } });
      const banned = matchingFood({ id: 'banned', micronutrients: { potassium: 422 } });

      const result = MealPlannerEngine.filterAndPlanMeals(p, [banned, safe]);
      expect(result.safeFoods).toHaveLength(1);
      expect(result.safeFoods[0].id).toBe('safe');
      expect(result.filteredCount.contraindicated).toBe(1);
    });

    it('allows food when contraindicated micronutrient is below 100mg', () => {
      const p = patient({ activeContraindicatedNutrients: ['potassium'] });
      const result = MealPlannerEngine.filterAndPlanMeals(
        p,
        [matchingFood({ micronutrients: { potassium: 50 } })],
      );

      expect(result.safeFoods).toHaveLength(1);
      expect(result.filteredCount.contraindicated).toBe(0);
    });

    it('keeps food with micronutrient absent from banned list', () => {
      const p = patient({ activeContraindicatedNutrients: ['oxalate'] });
      const result = MealPlannerEngine.filterAndPlanMeals(p, [
        matchingFood({ id: 'a' }),
        matchingFood({ id: 'b' }),
      ]);

      expect(result.safeFoods).toHaveLength(2);
      expect(result.filteredCount.contraindicated).toBe(0);
    });

    it('allows food with no micronutrient record for a banned nutrient', () => {
      const p = patient({ activeContraindicatedNutrients: ['potassium'] });
      const result = MealPlannerEngine.filterAndPlanMeals(p, [matchingFood()]);

      expect(result.safeFoods).toHaveLength(1);
    });

    it('passes all foods when no contraindicated nutrients', () => {
      const result = MealPlannerEngine.filterAndPlanMeals(patient(), [
        matchingFood({ id: 'a' }),
        matchingFood({ id: 'b' }),
        matchingFood({ id: 'c' }),
      ]);

      expect(result.safeFoods).toHaveLength(3);
      expect(result.filteredCount.contraindicated).toBe(0);
    });
  });

  // ---------- Filter 2: Strict Protein Restriction ----------
  describe('Filter 2 – Clinical Protocol Boundaries', () => {
    it('drops food with protein > 20g when strict flag is set', () => {
      const p = patient({ isStrictProteinRestriction: true });
      const high = matchingFood({ id: 'high', protein: 45 });
      const low = matchingFood({ id: 'low', protein: 10 });

      const result = MealPlannerEngine.filterAndPlanMeals(p, [high, low]);
      expect(result.safeFoods).toHaveLength(1);
      expect(result.safeFoods[0].id).toBe('low');
      expect(result.filteredCount.proteinViolation).toBe(1);
    });

    it('passes all foods when strict flag is not set', () => {
      // 45gP ×4=180cal / target 20%P → total=900cal
      // 50% of 900=450cal=112.5gC / 27% of 900=243cal=27gF
      const highPro = matchingFood({ id: 'high-pro', protein: 45, carbs: 112.5, fats: 27, calories: 900 });

      const result = MealPlannerEngine.filterAndPlanMeals(patient(), [highPro]);
      expect(result.safeFoods).toHaveLength(1);
      expect(result.filteredCount.proteinViolation).toBe(0);
    });

    it('allows food at exactly 20g protein boundary', () => {
      const p = patient({ isStrictProteinRestriction: true });
      // 20gP=80cal / 50gC=200cal / 10gF=90cal → total 370cal
      // P% = 80/370=21.62% within ±5 of 20 ✓
      // C% = 200/370=54.05% within ±5 of 50 ✓
      // F% = 90/370=24.32% within ±5 of 27 ✓
      const result = MealPlannerEngine.filterAndPlanMeals(p, [
        matchingFood({ protein: 20, carbs: 50, fats: 10, calories: 370 }),
      ]);

      expect(result.safeFoods).toHaveLength(1);
    });

    it('handles zero-protein food under strict restriction', () => {
      const p = patient({ isStrictProteinRestriction: true, targetProtein: 0, targetFats: 111 });
      // zero-protein: P=0g(0%), C=25g(100cal=52.63%), F=10g(90cal=47.37%)
      // target: P=0%, C=50%, F=50% → within ±5 ✓
      const zeroPro = matchingFood({ protein: 0, fats: 10, calories: 190 });
      const result = MealPlannerEngine.filterAndPlanMeals(p, [zeroPro]);

      expect(result.safeFoods).toHaveLength(1);
    });
  });

  // ---------- Filter 3: Macro Matching +/- 5% ----------
  describe('Filter 3 – Macro Matching tolerance', () => {
    it('accepts food with all macros within +/- 5% of target distribution', () => {
      const p = patient({ targetCalories: 2000, targetProtein: 100, targetCarbs: 250, targetFats: 60 });
      const result = MealPlannerEngine.filterAndPlanMeals(p, [food()]);

      expect(result.safeFoods).toHaveLength(1);
    });

    it('rejects food with macro deviation > 5% from target', () => {
      const p = patient({ targetCalories: 2000, targetProtein: 100, targetCarbs: 250, targetFats: 60 });
      const pureFat = matchingFood({ id: 'pure-fat', calories: 100, protein: 0, carbs: 0, fats: 11.1 });

      const result = MealPlannerEngine.filterAndPlanMeals(p, [pureFat]);
      expect(result.safeFoods).toHaveLength(0);
      expect(result.filteredCount.macroMismatch).toBe(1);
    });

    it('sorts by closest macro fit ascending', () => {
      const p = patient({ targetCalories: 2000, targetProtein: 100, targetCarbs: 250, targetFats: 60 });
      // closer: P=10.1*4=40.4, C=25*4=100, F=6*9=54 → total=194.4
      //   P%=20.78, C%=51.44, F%=27.78 → dist≈1.81
      const closer = food({ id: 'closer', protein: 10.1, carbs: 25, fats: 6,
        calories: 10.1 * 4 + 25 * 4 + 6 * 9 });
      // close:  P=9.8*4=39.2, C=25*4=100, F=6.1*9=54.9 → total=194.1
      //   P%=20.20, C%=51.52, F%=28.28 → dist≈2.00
      const close = food({ id: 'close', protein: 9.8, carbs: 25, fats: 6.1,
        calories: 9.8 * 4 + 25 * 4 + 6.1 * 9 });

      const result = MealPlannerEngine.filterAndPlanMeals(p, [close, closer]);
      expect(result.safeFoods).toHaveLength(2);
      expect(result.safeFoods[0].id).toBe('closer');
      expect(result.safeFoods[1].id).toBe('close');
    });

    it('returns empty array when no foods pass macro filter', () => {
      const p = patient({ targetCalories: 2000, targetProtein: 375, targetCarbs: 0, targetFats: 44 });
      const result = MealPlannerEngine.filterAndPlanMeals(p, [matchingFood()]);

      expect(result.safeFoods).toHaveLength(0);
    });
  });

  // ---------- Full Pipeline Integration ----------
  describe('Integration – full 3-filter pipeline', () => {
    it('applies all 3 filters sequentially and returns filtered + counts', () => {
      const p = patient({
        activeContraindicatedNutrients: ['potassium'],
        isStrictProteinRestriction: true,
      });

      const f1Ban = matchingFood({ id: 'f1-ban', micronutrients: { potassium: 200 } });
      const f2Ban = matchingFood({ id: 'f2-ban', protein: 45 });
      const safe = matchingFood({ id: 'safe' });

      const result = MealPlannerEngine.filterAndPlanMeals(p, [f1Ban, f2Ban, safe]);
      expect(result.filteredCount.contraindicated).toBe(1);
      expect(result.filteredCount.proteinViolation).toBe(1);
      expect(result.safeFoods).toHaveLength(1);
      expect(result.safeFoods[0].id).toBe('safe');
    });
  });

  // ---------- Defensive / Edge Cases ----------
  describe('Defensive guards', () => {
    it('returns empty result for null/undefined input', () => {
      const r1 = MealPlannerEngine.filterAndPlanMeals(null as unknown as PatientProfile, []);
      expect(r1.safeFoods).toEqual([]);

      const r2 = MealPlannerEngine.filterAndPlanMeals(patient(), null as unknown as FoodItem[]);
      expect(r2.safeFoods).toEqual([]);
    });

    it('returns empty result for empty food array', () => {
      const result = MealPlannerEngine.filterAndPlanMeals(patient(), []);
      expect(result.safeFoods).toEqual([]);
      expect(result.filteredCount.contraindicated).toBe(0);
      expect(result.filteredCount.proteinViolation).toBe(0);
      expect(result.filteredCount.macroMismatch).toBe(0);
    });

    it('handles foods with zero or negative calorie values', () => {
      const zeroCal = matchingFood({ id: 'zero', calories: 0 });
      const negCal = matchingFood({ id: 'neg', calories: -50, protein: -5, carbs: -6, fats: -1 });

      const result = MealPlannerEngine.filterAndPlanMeals(patient(), [zeroCal, negCal]);
      expect(result.safeFoods).toHaveLength(0);
    });
  });
});
