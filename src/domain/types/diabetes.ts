export type DiabetesType = 'type_1' | 'type_2' | 'gestational' | 'pre_diabetes' | 'other';

export type DiabetesSeverity = 'mild' | 'moderate' | 'severe' | 'critical';

export type InsulinType = 'short_acting' | 'intermediate_acting' | 'long_acting' | 'pre_mixed' | 'fast_acting';

export type CarbCountingLevel = 'basic' | 'advanced' | 'exact';

export interface DiabetesAssessment {
  id?: string;
  patientId: string;
  timestamp: string;
  diabetesType: DiabetesType;
  severity: DiabetesSeverity;
  diagnosisDate: string;
  hasComplications: boolean;
  hemoglobinA1c: number;
  fastingGlucose: number;
  postprandialGlucose: number;
  weight: number;
  height: number;
  bmi: number;
  onInsulin: boolean;
  currentInsulinType: InsulinType | null;
  dailyInsulinDose: number;
  onOralMedication: boolean;
  oralMedications: string[];
  dietType: string;
  exerciseFrequency: number;
  smokingStatus: boolean;
  hasRetinopathy: boolean;
  hasNeuropathy: boolean;
  hasKidneyDisease: boolean;
  hasCardiovascularDisease: boolean;
  targetA1c: number;
  targetGlucoseMorning: number;
  targetGlucosePostprandial: number;
  createdAt: string;
  updatedAt: string;
}

export interface DiabetesNutritionPlan {
  id?: string;
  patientId: string;
  assessmentId: string;
  totalCalories: number;
  carbohydrateGrams: number;
  proteinGrams: number;
  fatGrams: number;
  carbMeals: {
    breakfast: number;
    lunch: number;
    dinner: number;
    snacks: number;
  };
  carbCountingLevel: CarbCountingLevel;
  carbPerMeal: number;
  mealTiming: {
    breakfast: string;
    lunch: string;
    dinner: string;
    snacks: string[];
  };
  insulinCarbRatio: number;
  correctionFactor: number;
  recommendations: string[];
  foodSuggestions: string[];
  foodRestrictions: string[];
  glucoseMonitoringFrequency: number;
  a1cCheckFrequency: number;
  isActive: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiabetesMonitoring {
  id?: string;
  patientId: string;
  planId: string;
  timestamp: string;
  morningGlucose: number;
  preBreakfastGlucose: number;
  postBreakfastGlucose: number;
  preLunchGlucose: number;
  postLunchGlucose: number;
  preDinnerGlucose: number;
  postDinnerGlucose: number;
  bedtimeGlucose: number;
  nighttimeGlucose: number;
  insulinDoses: {
    breakfast: number;
    lunch: number;
    dinner: number;
    bedtime: number;
    total: number;
  };
  carbIntake: {
    breakfast: number;
    lunch: number;
    dinner: number;
    snacks: number;
    total: number;
  };
  hypoglycemiaEvents: number;
  hypoglycemiaTimes: string[];
  hyperglycemiaEvents: number;
  hyperglycemiaTimes: string[];
  exerciseMinutes: number;
  exerciseType: string;
  weight: number;
  bmi: number;
  hemoglobinA1c: number | null;
  notes: string;
  symptoms: string[];
  createdAt: string;
  updatedAt: string;
}

export function validateDiabetesAssessment(assessment: DiabetesAssessment): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (assessment.hemoglobinA1c < 3 || assessment.hemoglobinA1c > 15) errors.push('Invalid HbA1c value');
  if (assessment.fastingGlucose < 50 || assessment.fastingGlucose > 500) errors.push('Invalid fasting glucose value');
  if (assessment.weight <= 0 || assessment.weight > 500) errors.push('Invalid weight value');
  if (assessment.height <= 0 || assessment.height > 300) errors.push('Invalid height value');
  return { valid: errors.length === 0, errors };
}

export function validateDiabetesNutritionPlan(plan: DiabetesNutritionPlan): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (plan.totalCalories < 800 || plan.totalCalories > 5000) errors.push('Invalid calorie target');
  if (plan.carbPerMeal < 10 || plan.carbPerMeal > 150) errors.push('Invalid carb per meal');
  if (plan.insulinCarbRatio < 1 || plan.insulinCarbRatio > 3) errors.push('Invalid insulin-carb ratio');
  return { valid: errors.length === 0, errors };
}
