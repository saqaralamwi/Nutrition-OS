export type ExchangeGroup = 'starch' | 'meat_lean' | 'meat_medium' | 'meat_high' | 'vegetable' | 'fruit' | 'milk' | 'fat';

export type MineralLevel = 'low' | 'medium' | 'high';

export type DayType = 'normal_weekday' | 'weekend_holiday' | 'sick_day';

export type ReliabilityScore = 'high' | 'medium' | 'low';

export type MealSlotType = 'breakfast' | 'snack_1' | 'lunch' | 'snack_2' | 'dinner' | 'late_snack';

export type ServingUnit = 'grams' | 'tablespoon' | 'cup' | 'slice' | 'piece';

export type DietaryPatternTag = 'standard' | 'diabetic_spaced' | 'hepatic_night_snack' | 'hypermetabolic_built';

export interface IFoodExchange {
  exchangeGroup: ExchangeGroup;
  foodNameAr: string;
  servingSizeDesc: string;
  carbsG: number;
  proteinG: number;
  fatG: number;
  caloriesKcal: number;
  glycemicIndex: number;
  potassiumLevel: MineralLevel;
  phosphorusLevel: MineralLevel;
  isGlutenFree: boolean;
  isLowFodmap: boolean;
  isLactoseFree: boolean;
  isUserDefined: boolean;
  associatedPatientId: string | null;
  isCompositeRecipe: boolean;
  recipeDecompositionJson: string;
  householdUnitsJson: string;
  micronutrientTagsJson: string;
}

export interface IDietaryHistorySession {
  patientId: string;
  interviewDate: number;
  dayType: DayType;
  reliabilityScore: ReliabilityScore;
  totalComputedCalories: number;
  totalComputedProtein: number;
  totalFluidIntakeMl: number;
  recordedAt: number;
}

export interface IDietaryHistoryItem {
  sessionId: string;
  mealSlotType: MealSlotType;
  consumptionTime: string;
  foodExchangeId: string;
  customReportedName: string;
  servingUnitUsed: ServingUnit;
  servingsConsumed: number;
  derivedFluidMl: number;
  derivedCalories: number;
  derivedProtein: number;
  derivedCarbs: number;
  derivedFat: number;
}

export interface IPatientAversionRecord {
  patientId: string;
  foodExchangeId: string;
  exclusionReason: string;
}

export interface IPatientMealPlan {
  patientId: string;
  planDate: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  averageGlycemicLoad: number;
  dietaryPatternTag: DietaryPatternTag;
  mealDistributionJson: string;
  educationalInsightsJson: string;
  createdAt: number;
  updatedAt: number;
}

export interface PatientProfile {
  id: string;
  dryWeight: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
  activeContraindicatedNutrients: string[];
  isStrictProteinRestriction: boolean;
}

export interface FoodItem {
  id: string;
  nameAr: string;
  nameEn: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  micronutrients: Record<string, number>;
}
