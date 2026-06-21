interface MacroBreakdown {
  proteinGrams: number;
  proteinCalories: number;
  carbsGrams: number;
  carbsCalories: number;
  fatGrams: number;
  fatCalories: number;
}

const CALORIES_PER_GRAM_PROTEIN = 4;
const CALORIES_PER_GRAM_CARBS = 4;
const CALORIES_PER_GRAM_FAT = 9;

export function calculateMacros(
  totalCalories: number,
  weightKg: number,
  proteinPerKg: number = 1.2,
  fatPercentage: number = 0.25,
  carbsPercentage?: number
): MacroBreakdown {
  // 1. Reset and Parse Inputs
  const calories = Math.max(0, parseFloat(String(totalCalories)) || 0);
  const weight = Math.max(0, parseFloat(String(weightKg)) || 0);
  let pPerKg = Math.max(0, parseFloat(String(proteinPerKg)) || 1.2);
  let fPct = Math.max(0, parseFloat(String(fatPercentage)) || 0.25);
  let cPct = carbsPercentage ? Math.max(0, parseFloat(String(carbsPercentage))) : undefined;

  // Handle case where percentages might be passed as 0-100
  if (fPct > 1) fPct = fPct / 100;
  if (cPct && cPct > 1) cPct = cPct / 100;

  if (calories <= 0 || weight <= 0) {
    return { proteinGrams: 0, proteinCalories: 0, carbsGrams: 0, carbsCalories: 0, fatGrams: 0, fatCalories: 0 };
  }

  // 2. Execution with clean values
  // Formula: Protein grams = weight * proteinPerKg
  const proteinGrams = Math.round(weight * pPerKg);
  const proteinCalories = proteinGrams * CALORIES_PER_GRAM_PROTEIN;

  // Formula: Fat grams = (Total Calories * Fat %) / 9
  const fatCalories = Math.round(calories * fPct);
  const fatGrams = Math.round(fatCalories / CALORIES_PER_GRAM_FAT);

  // Formula: Carb grams = (Remaining or Target * Carb %) / 4
  const remainingCalories = calories - proteinCalories - fatCalories;
  const finalCarbsPercentage = cPct ?? (Math.max(0, remainingCalories) / calories);
  const carbsCalories = Math.round(calories * finalCarbsPercentage);
  const carbsGrams = Math.round(carbsCalories / CALORIES_PER_GRAM_CARBS);

  // 3. Sanity Bound Guards
  // If Carbs > 1000g or Fats > 300g, force a safe fallback calculation
  if (carbsGrams > 1000 || fatGrams > 300) {
    console.warn(`[Clinical Guard] Implausible macro values detected (${carbsGrams}g C, ${fatGrams}g F). Forcing fallback.`);
    // Fallback: Standard 50% Carbs, 30% Fat, 20% Protein balance
    const fallbackCarbs = Math.round((calories * 0.5) / 4);
    const fallbackFat = Math.round((calories * 0.3) / 9);
    const fallbackProtein = Math.round((calories * 0.2) / 4);
    
    return {
      proteinGrams: fallbackProtein,
      proteinCalories: fallbackProtein * 4,
      carbsGrams: fallbackCarbs,
      carbsCalories: fallbackCarbs * 4,
      fatGrams: fallbackFat,
      fatCalories: fallbackFat * 9,
    };
  }

  return {
    proteinGrams,
    proteinCalories,
    carbsGrams,
    carbsCalories,
    fatGrams,
    fatCalories,
  };
}
