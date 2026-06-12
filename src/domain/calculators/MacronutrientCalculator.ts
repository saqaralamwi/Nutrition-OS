import { MacroBreakdown } from '../entities/NutritionPlan';

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
  if (totalCalories <= 0 || weightKg <= 0) {
    throw new Error('السعرات والوزن يجب أن يكونوا أكبر من صفر');
  }
  if (proteinPerKg <= 0 || fatPercentage <= 0) {
    throw new Error('نسب المغذيات يجب أن تكون أكبر من صفر');
  }

  const proteinGrams = Math.round(weightKg * proteinPerKg);
  const proteinCalories = proteinGrams * CALORIES_PER_GRAM_PROTEIN;

  const fatCalories = Math.round(totalCalories * fatPercentage);
  const fatGrams = Math.round(fatCalories / CALORIES_PER_GRAM_FAT);

  const remainingCalories = totalCalories - proteinCalories - fatCalories;
  const finalCarbsPercentage = carbsPercentage ?? (remainingCalories / totalCalories);
  const carbsCalories = Math.round(totalCalories * finalCarbsPercentage);
  const carbsGrams = Math.round(carbsCalories / CALORIES_PER_GRAM_CARBS);

  return {
    proteinGrams,
    proteinCalories,
    carbsGrams,
    carbsCalories,
    fatGrams,
    fatCalories,
  };
}
