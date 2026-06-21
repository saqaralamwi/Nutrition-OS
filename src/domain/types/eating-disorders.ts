export type EatingDisorderType = 'anorexia' | 'bulimia' | 'binge_eating' | 'avoidant_restrictive' | 'purge_syndrome' | 'other';

export type EatingDisorderSeverity = 'mild' | 'moderate' | 'severe' | 'critical';

export type BMICategory = 'underweight' | 'normal' | 'overweight' | 'obese_1' | 'obese_2' | 'obese_3';

export type RefeedingRisk = 'low' | 'moderate' | 'high' | 'critical';

export interface AnorexiaAssessment {
  id?: string;
  patientId: string;
  timestamp: string;
  disorderType: EatingDisorderType;
  severity: EatingDisorderSeverity;
  diagnosisDate: string;
  duration: number;
  weight: number;
  height: number;
  bmi: number;
  bmiCategory: BMICategory;
  percentOfExpectedBMI: number;
  heartRate: number;
  bloodPressure: string;
  temperature: number;
  hasElectrolyteImbalance: boolean;
  hasHypothermia: boolean;
  hasBradycardia: boolean;
  albumin: number;
  prealbumin: number;
  transferrin: number;
  magnesium: number;
  phosphorus: number;
  potassium: number;
  depressionScore: number;
  anxietyScore: number;
  obsessionWithFood: boolean;
  fearOfWeightGain: boolean;
  bodyImageDistortion: boolean;
  mealRestriction: boolean;
  bingeEpisodes: number;
  purgeEpisodes: number;
  exerciseCompulsively: boolean;
  exerciseMinutes: number;
  priorHospitalizations: number;
  priorTreatmentAttempts: number;
  targetWeight: number;
  weightGainRate: number;
  calorieGoal: number;
  createdAt: string;
  updatedAt: string;
}

export interface AnorexiaNutritionPlan {
  id?: string;
  patientId: string;
  assessmentId: string;
  startingCalories: number;
  currentCalories: number;
  targetCalories: number;
  calorieIncreaseRate: number;
  proteinGrams: number;
  fatGrams: number;
  carbohydrateGrams: number;
  mealsPerDay: number;
  snacksPerDay: number;
  mealTiming: {
    breakfast: string;
    morningSnack: string | null;
    lunch: string;
    afternoonSnack: string | null;
    dinner: string;
    eveningSnack: string | null;
  };
  refeedingRisk: RefeedingRisk;
  refeedingProtocol: string;
  electrolyteMonitoringFrequency: number;
  supplements: { name: string; dose: string; frequency: string }[];
  recommendations: string[];
  foodSuggestions: string[];
  foodRestrictions: string[];
  isActive: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface BulimiaAssessment {
  id?: string;
  patientId: string;
  timestamp: string;
  disorderType: EatingDisorderType;
  severity: EatingDisorderSeverity;
  diagnosisDate: string;
  duration: number;
  weight: number;
  height: number;
  bmi: number;
  bmiCategory: BMICategory;
  heartRate: number;
  bloodPressure: string;
  hasElectrolyteImbalance: boolean;
  hasDentalErosion: boolean;
  hasEsophagealDamage: boolean;
  hasSalivaryEnlargement: boolean;
  potassium: number;
  chloride: number;
  bicarbonate: number;
  creatinine: number;
  bingeEpisodes: number;
  purgeEpisodes: number;
  purgeMethods: string[];
  exerciseCompulsively: boolean;
  exerciseMinutes: number;
  depressionScore: number;
  anxietyScore: number;
  guiltAfterEating: boolean;
  fearOfWeightGain: boolean;
  priorHospitalizations: number;
  priorTreatmentAttempts: number;
  bingeFrequencyGoal: number;
  purgeFrequencyGoal: number;
  calorieGoal: number;
  createdAt: string;
  updatedAt: string;
}

export interface BulimiaNutritionPlan {
  id?: string;
  patientId: string;
  assessmentId: string;
  totalCalories: number;
  proteinGrams: number;
  fatGrams: number;
  carbohydrateGrams: number;
  mealsPerDay: number;
  snacksPerDay: number;
  mealTiming: {
    breakfast: string;
    morningSnack: string | null;
    lunch: string;
    afternoonSnack: string | null;
    dinner: string;
    eveningSnack: string | null;
  };
  triggerIdentification: string[];
  copingStrategies: string[];
  emergencyPlan: string;
  focusNutrients: string[];
  supplements: { name: string; dose: string; frequency: string }[];
  recommendations: string[];
  foodSuggestions: string[];
  foodRestrictions: string[];
  isActive: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export function validateAnorexiaAssessment(assessment: AnorexiaAssessment): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (assessment.bmi < 10 || assessment.bmi > 50) errors.push('Invalid BMI value');
  if (assessment.weight <= 0 || assessment.weight > 300) errors.push('Invalid weight value');
  if (assessment.height <= 0 || assessment.height > 300) errors.push('Invalid height value');
  if (assessment.heartRate < 30 || assessment.heartRate > 200) errors.push('Invalid heart rate');
  return { valid: errors.length === 0, errors };
}

export function validateAnorexiaNutritionPlan(plan: AnorexiaNutritionPlan): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (plan.startingCalories < 500 || plan.startingCalories > 3000) errors.push('Invalid starting calories');
  if (plan.targetCalories < 1200 || plan.targetCalories > 4000) errors.push('Invalid target calories');
  if (plan.calorieIncreaseRate < 100 || plan.calorieIncreaseRate > 500) errors.push('Invalid calorie increase rate');
  return { valid: errors.length === 0, errors };
}

export function validateBulimiaAssessment(assessment: BulimiaAssessment): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (assessment.bmi < 10 || assessment.bmi > 50) errors.push('Invalid BMI value');
  if (assessment.bingeEpisodes < 0 || assessment.bingeEpisodes > 50) errors.push('Invalid binge episodes count');
  if (assessment.purgeEpisodes < 0 || assessment.purgeEpisodes > 50) errors.push('Invalid purge episodes count');
  return { valid: errors.length === 0, errors };
}
