export interface NutritionPlan {
  id?: string;
  patientId: string;
  targetCalories: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  fluidTarget: number;
  mealsJson: string;
  recommendationsJson: string;
  vitalsId?: string | null;
  finalCalories?: number | null;
  isCaloriesOverridden?: boolean | null;
  finalProtein?: number | null;
  isProteinOverridden?: boolean | null;
  finalCarbs?: number | null;
  isCarbsOverridden?: boolean | null;
  finalFat?: number | null;
  isFatOverridden?: boolean | null;
  fiber?: number | null;
  sodium?: number | null;
  potassium?: number | null;
  phosphorus?: number | null;
  calcium?: number | null;
  magnesium?: number | null;
  iron?: number | null;
  zinc?: number | null;
  vitaminA?: number | null;
  vitaminC?: number | null;
  vitaminD?: number | null;
  vitaminE?: number | null;
  vitaminK?: number | null;
  folate?: number | null;
  niacin?: number | null;
  thiamin?: number | null;
  riboflavin?: number | null;
  biotin?: number | null;
  pantothenicAcid?: number | null;
  cholesterol?: number | null;
  saturatedFat?: number | null;
  monounsaturatedFat?: number | null;
  polyunsaturatedFat?: number | null;
  transFat?: number | null;
  glycemicLoad?: number | null;
  createdAt?: string;
  dietitianNotes?: string | null;
}

export const DEFAULT_PROTEIN_PER_KG = 1.2;
export const DEFAULT_FAT_PERCENTAGE = 0.25;
export const DEFAULT_CARBS_PERCENTAGE = 0.55;

export const ACTIVITY_LEVELS = {
  sedentary: { label: 'خامل', multiplier: 1.2 },
  light: { label: 'خفيف', multiplier: 1.375 },
  moderate: { label: 'معتدل', multiplier: 1.55 },
  active: { label: 'نشط', multiplier: 1.725 },
} as const;

export type ActivityLevel = keyof typeof ACTIVITY_LEVELS;
