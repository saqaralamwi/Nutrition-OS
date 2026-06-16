import type { FoodItem, PatientProfile } from '../../data/types/meal_planner';

export interface IFilterAndPlanResult {
  safeFoods: FoodItem[];
  filteredCount: {
    contraindicated: number;
    proteinViolation: number;
    macroMismatch: number;
  };
}

export class MealPlannerEngine {
  private static readonly CALORIES_PER_G_PROTEIN = 4;
  private static readonly CALORIES_PER_G_CARBS = 4;
  private static readonly CALORIES_PER_G_FATS = 9;
  private static readonly CONTRAINDICATED_THRESHOLD_MG = 100;
  private static readonly MACRO_TOLERANCE_PCT = 5;
  private static readonly STRICT_PROTEIN_MAX_G = 20;

  public static filterAndPlanMeals(
    patient: PatientProfile,
    availableFoods: FoodItem[],
  ): IFilterAndPlanResult {
    const safe = MealPlannerEngine.defensiveGuard(patient, availableFoods);
    if (!safe) {
      return { safeFoods: [], filteredCount: { contraindicated: 0, proteinViolation: 0, macroMismatch: 0 } };
    }

    let contraindicated = 0;
    let proteinViolation = 0;
    let macroMismatch = 0;

    const afterFilter1 = MealPlannerEngine.filterContraindicated(
      patient.activeContraindicatedNutrients,
      availableFoods,
    );
    contraindicated = availableFoods.length - afterFilter1.length;

    const afterFilter2 = MealPlannerEngine.filterProteinRestriction(
      patient,
      afterFilter1,
    );
    proteinViolation = afterFilter1.length - afterFilter2.length;

    const afterFilter3 = MealPlannerEngine.filterAndSortByMacros(
      patient,
      afterFilter2,
    );
    macroMismatch = afterFilter2.length - afterFilter3.length;

    return {
      safeFoods: afterFilter3,
      filteredCount: { contraindicated, proteinViolation, macroMismatch },
    };
  }

  /* ---------- Filter 1: DNI / Safety Brake ---------- */
  private static filterContraindicated(
    bannedNutrients: string[],
    foods: FoodItem[],
  ): FoodItem[] {
    if (!bannedNutrients.length) return foods;
    return foods.filter((food) =>
      bannedNutrients.every(
        (nutrient) =>
          !food.micronutrients[nutrient] ||
          food.micronutrients[nutrient] <= MealPlannerEngine.CONTRAINDICATED_THRESHOLD_MG,
      ),
    );
  }

  /* ---------- Filter 2: Clinical Protocol Boundaries ---------- */
  private static filterProteinRestriction(
    patient: PatientProfile,
    foods: FoodItem[],
  ): FoodItem[] {
    if (!patient.isStrictProteinRestriction) return foods;
    return foods.filter(
      (food) =>
        food.protein >= 0 &&
        food.protein <= MealPlannerEngine.STRICT_PROTEIN_MAX_G,
    );
  }

  /* ---------- Filter 3: Macro Matching +/- 5% ---------- */
  private static filterAndSortByMacros(
    patient: PatientProfile,
    foods: FoodItem[],
  ): FoodItem[] {
    const macroRatios = MealPlannerEngine.computeMacroRatios(patient);
    if (!macroRatios) return [];

    const scored = foods
      .map((food) => {
        const score = MealPlannerEngine.computeFoodScore(food, macroRatios);
        return { food, score, passes: score !== -1 };
      })
      .filter((f) => f.passes)
      .sort((a, b) => a.score - b.score);

    return scored.map((f) => f.food);
  }

  private static computeMacroRatios(patient: PatientProfile): {
    proteinPct: number;
    carbsPct: number;
    fatsPct: number;
  } | null {
    const { targetCalories, targetProtein, targetCarbs, targetFats } = patient;
    if (
      targetCalories == null || targetCalories <= 0 || isNaN(targetCalories) ||
      targetProtein == null || targetProtein < 0 || isNaN(targetProtein) ||
      targetCarbs == null || targetCarbs <= 0 || isNaN(targetCarbs) ||
      targetFats == null || targetFats <= 0 || isNaN(targetFats)
    ) {
      return null;
    }

    const proteinPct = MealPlannerEngine.r2(
      (targetProtein * MealPlannerEngine.CALORIES_PER_G_PROTEIN) / targetCalories * 100,
    );
    const carbsPct = MealPlannerEngine.r2(
      (targetCarbs * MealPlannerEngine.CALORIES_PER_G_CARBS) / targetCalories * 100,
    );
    const fatsPct = MealPlannerEngine.r2(
      (targetFats * MealPlannerEngine.CALORIES_PER_G_FATS) / targetCalories * 100,
    );
    return { proteinPct, carbsPct, fatsPct };
  }

  private static computeFoodScore(
    food: FoodItem,
    target: { proteinPct: number; carbsPct: number; fatsPct: number },
  ): number {
    const { calories, protein, carbs, fats } = food;
    if (!calories || calories <= 0 || isNaN(calories)) return -1;
    if (isNaN(protein) || isNaN(carbs) || isNaN(fats)) return -1;

    const foodProteinPct = MealPlannerEngine.r2(
      (protein * MealPlannerEngine.CALORIES_PER_G_PROTEIN) / calories * 100,
    );
    const foodCarbsPct = MealPlannerEngine.r2(
      (carbs * MealPlannerEngine.CALORIES_PER_G_CARBS) / calories * 100,
    );
    const foodFatsPct = MealPlannerEngine.r2(
      (fats * MealPlannerEngine.CALORIES_PER_G_FATS) / calories * 100,
    );

    const tol = MealPlannerEngine.MACRO_TOLERANCE_PCT;
    if (
      Math.abs(foodProteinPct - target.proteinPct) > tol ||
      Math.abs(foodCarbsPct - target.carbsPct) > tol ||
      Math.abs(foodFatsPct - target.fatsPct) > tol
    ) {
      return -1;
    }

    const dist = Math.sqrt(
      (foodProteinPct - target.proteinPct) ** 2 +
      (foodCarbsPct - target.carbsPct) ** 2 +
      (foodFatsPct - target.fatsPct) ** 2,
    );
    return MealPlannerEngine.r2(dist);
  }

  private static defensiveGuard(
    patient: PatientProfile,
    availableFoods: FoodItem[],
  ): boolean {
    if (!patient || !availableFoods || !Array.isArray(availableFoods)) return false;
    return true;
  }

  private static r2(value: number): number {
    return parseFloat(value.toFixed(2));
  }
}
