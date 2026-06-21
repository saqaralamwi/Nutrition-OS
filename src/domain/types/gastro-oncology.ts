export type GIDisorderType = 'gerd' | 'ibd' | 'ibs' | 'pancreatitis' | 'gastritis' | 'colitis' | 'other';

export type CancerType = 'gastrointestinal' | 'head_neck' | 'liver' | 'pancreatic' | 'colon' | 'other';

export type CancerStage = 'stage_0' | 'stage_1' | 'stage_2' | 'stage_3' | 'stage_4' | 'unknown';

export type CachexiaSeverity = 'none' | 'pre_cachexia' | 'cachexia' | 'refractory_cachexia';

export type NutritionRoute = 'oral' | 'enteral' | 'parenteral' | 'mixed';

export interface GIAssessment {
  id?: string;
  patientId: string;
  timestamp: string;
  disorderType: GIDisorderType;
  severity: string;
  diagnosisDate: string;
  duration: number;
  nausea: boolean;
  nauseaFrequency: number;
  vomiting: boolean;
  vomitingFrequency: number;
  diarrhea: boolean;
  diarrheaFrequency: number;
  constipation: boolean;
  abdominalPain: boolean;
  painSeverity: number;
  bloating: boolean;
  earlySatiety: boolean;
  dysphagia: boolean;
  weightLoss: boolean;
  weightLossAmount: number;
  weightLossDuration: number;
  percentWeightLoss: number;
  appetiteDecrease: boolean;
  foodAvoidance: string[];
  albumin: number;
  prealbumin: number;
  hemoglobin: number;
  iron: number;
  ferritin: number;
  weight: number;
  height: number;
  bmi: number;
  calorieGoal: number;
  proteinGoal: number;
  weightGoal: number;
  createdAt: string;
  updatedAt: string;
}

export interface GastroOncologyAssessment {
  id?: string;
  patientId: string;
  timestamp: string;
  cancerType: CancerType;
  cancerStage: CancerStage;
  diagnosisDate: string;
  primaryTumor: string;
  metastasis: string[];
  treatmentType: string;
  treatmentStartDate: string;
  treatmentCycle: number;
  isCurrentTreatment: boolean;
  hasCachexia: boolean;
  cachexiaSeverity: CachexiaSeverity;
  weightLoss: number;
  weightLossPercent: number;
  muscleLoss: boolean;
  fatLoss: boolean;
  nausea: boolean;
  nauseaSeverity: number;
  vomiting: boolean;
  vomitingFrequency: number;
  diarrhea: boolean;
  diarrheaFrequency: number;
  constipation: boolean;
  abdominalPain: boolean;
  painSeverity: number;
  bloating: boolean;
  earlySatiety: boolean;
  dysphagia: boolean;
  mouthSores: boolean;
  tasteChanges: boolean;
  dryMouth: boolean;
  appetiteDecrease: boolean;
  foodAvoidance: string[];
  oralIntakePercent: number;
  needsSupplements: boolean;
  needsTPN: boolean;
  needsEN: boolean;
  albumin: number;
  prealbumin: number;
  hemoglobin: number;
  lymphocytes: number;
  weight: number;
  height: number;
  bmi: number;
  percentExpectedWeight: number;
  calorieGoal: number;
  proteinGoal: number;
  weightGoal: number;
  proteinPerKg: number;
  createdAt: string;
  updatedAt: string;
}

export interface GastroOncologyNutritionPlan {
  id?: string;
  patientId: string;
  assessmentId: string;
  totalCalories: number;
  proteinGrams: number;
  fatGrams: number;
  carbohydrateGrams: number;
  proteinPerKg: number;
  mealsPerDay: number;
  snacksPerDay: number;
  smallFrequentMeals: boolean;
  mealTiming: {
    breakfast: string;
    morningSnack: string | null;
    lunch: string;
    afternoonSnack: string | null;
    dinner: string;
    eveningSnack: string | null;
  };
  route: NutritionRoute;
  supplements: { name: string; type: string; dose: string; frequency: string }[];
  highProtein: boolean;
  highCalorie: boolean;
  lowFiber: boolean;
  lowFat: boolean;
  lactoseFree: boolean;
  glutenFree: boolean;
  nauseaManagement: string[];
  diarrheaManagement: string[];
  constipationManagement: string[];
  painManagement: string[];
  recommendations: string[];
  foodSuggestions: string[];
  foodRestrictions: string[];
  isActive: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export function validateGIAssessment(assessment: GIAssessment): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (assessment.bmi < 10 || assessment.bmi > 50) errors.push('Invalid BMI value');
  if (assessment.weight <= 0 || assessment.weight > 300) errors.push('Invalid weight value');
  if (assessment.painSeverity < 0 || assessment.painSeverity > 10) errors.push('Invalid pain severity');
  return { valid: errors.length === 0, errors };
}

export function validateGastroOncologyAssessment(assessment: GastroOncologyAssessment): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (assessment.bmi < 10 || assessment.bmi > 50) errors.push('Invalid BMI value');
  if (assessment.weight <= 0 || assessment.weight > 300) errors.push('Invalid weight value');
  if (assessment.nauseaSeverity < 0 || assessment.nauseaSeverity > 10) errors.push('Invalid nausea severity');
  if (assessment.painSeverity < 0 || assessment.painSeverity > 10) errors.push('Invalid pain severity');
  return { valid: errors.length === 0, errors };
}
