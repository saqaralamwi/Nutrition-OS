export interface MacroBreakdown {
  proteinGrams: number;
  proteinCalories: number;
  carbsGrams: number;
  carbsCalories: number;
  fatGrams: number;
  fatCalories: number;
}

export interface NutritionPlan {
  id?: string;
  patientId: string;
  patientMetricsId: string;
  totalCalories: number;
  calorieAdjustment: number;
  macros: MacroBreakdown;
  recommendations: string[];
  restrictions: string[];
  createdAt?: string;
  dietitianNotes?: string;
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
