export type PediatricAgeGroup = 'neonate' | 'infant' | 'toddler' | 'preschool' | 'school' | 'adolescent';
export type GrowthStatus = 'normal' | 'underweight' | 'stunting' | 'wasting' | 'overweight' | 'obese' | 'severe_wasting' | 'severe_underweight';
export type NutritionRisk = 'low' | 'moderate' | 'high' | 'very_high';
export type FeedingMethod = 'breastfeeding' | 'formula' | 'mixed' | 'complementary' | 'oral' | 'enteral' | 'parenteral';
export type PediatricCondition = 'acute_malnutrition' | 'chronic_malnutrition' | 'obesity' | 'food_allergy' | 'metabolic' | 'other';

export interface PediatricAssessment {
  patientId: string;
  date: number;
  ageMonths: number;
  ageGroup: PediatricAgeGroup;
  weightKg: number;
  heightCm: number;
  headCircumferenceCm?: number;
  bmi: number;
  bmiZScore?: number;
  weightForAgeZScore?: number;
  heightForAgeZScore?: number;
  weightForHeightZScore?: number;
  growthStatus: GrowthStatus;
  midUpperArmCircumferenceCm?: number;
  feedingMethod: FeedingMethod;
  condition?: PediatricCondition;
  allergies: string[];
  medications: string[];
  chronicDiseases: string[];
  notes?: string;
}

export interface PediatricNutritionPlan {
  patientId: string;
  assessmentId?: string;
  ageGroup: PediatricAgeGroup;
  weightKg: number;
  totalCalories: number;
  caloriesPerKg: number;
  proteinGrams: number;
  proteinPerKg: number;
  carbsGrams: number;
  fatGrams: number;
  fluidMl: number;
  fluidPerKg: number;
  feedingMethod: FeedingMethod;
  formulaType?: string;
  formulaVolumeMl?: number;
  feedsPerDay?: number;
  vitaminSupplements: string[];
  mineralSupplements: string[];
  recommendations: string[];
  contraindications: string[];
  followUpWeeks: number;
  createdBy?: string;
}

export interface PediatricMonitoring {
  patientId: string;
  planId?: string;
  date: number;
  weightKg: number;
  heightCm: number;
  headCircumferenceCm?: number;
  bmi: number;
  weightForAgeZScore?: number;
  heightForAgeZScore?: number;
  weightForHeightZScore?: number;
  midUpperArmCircumferenceCm?: number;
  calorieIntake: number;
  proteinIntake: number;
  fluidIntakeMl: number;
  feedingTolerance: 'good' | 'fair' | 'poor';
  vomiting?: boolean;
  diarrhea?: boolean;
  edema?: boolean;
  complications: string[];
  growthStatus: GrowthStatus;
  nutritionRisk: NutritionRisk;
  notes?: string;
}
