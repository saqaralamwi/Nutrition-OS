export type CardioCondition = 'hypertension' | 'heart_failure' | 'coronary_artery_disease' | 'atrial_fibrillation' | 'valvular_disease' | 'hyperlipidemia' | 'other';

export type HeartFailureClass = 'class_1' | 'class_2' | 'class_3' | 'class_4';

export type CardioRiskLevel = 'low' | 'moderate' | 'high' | 'very_high';

export type DietaryPattern = 'dash' | 'mediterranean' | 'low_sodium' | 'low_fat' | 'cardiac' | 'other';

export type FluidStatus = 'dry' | 'euvolemic' | 'mild_overload' | 'moderate_overload' | 'severe_overload';

export interface CardioAssessment {
  id?: string;
  patientId: string;
  timestamp: string;
  condition: CardioCondition;
  heartFailureClass: HeartFailureClass | null;
  riskLevel: CardioRiskLevel;
  diagnosisDate: string;
  heartRate: number;
  systolicBP: number;
  diastolicBP: number;
  oxygenSaturation: number;
  fluidStatus: FluidStatus;
  dryWeight: number;
  currentWeight: number;
  edema: boolean;
  edemaLocation: string;
  sodium: number;
  potassium: number;
  creatinine: number;
  bun: number;
  albumin: number;
  hemoglobin: number;
  bnp: number;
  troponin: number;
  totalCholesterol: number;
  ldl: number;
  hdl: number;
  triglycerides: number;
  glucose: number;
  onDiuretics: boolean;
  diureticDose: number;
  onACEInhibitor: boolean;
  onBetaBlocker: boolean;
  onAnticoagulant: boolean;
  onStatin: boolean;
  weight: number;
  height: number;
  bmi: number;
  waistCircumference: number;
  currentDietaryPattern: DietaryPattern;
  sodiumIntake: number;
  fluidIntake: number;
  alcoholIntake: number;
  exerciseCapacity: string;
  exerciseFrequency: number;
  exerciseLimitations: string;
  hasKidneyDisease: boolean;
  hasDiabetes: boolean;
  hasAnemia: boolean;
  hasObesity: boolean;
  sodiumGoal: number;
  fluidGoal: number;
  calorieGoal: number;
  proteinGoal: number;
  weightGoal: number;
  createdAt: string;
  updatedAt: string;
}

export interface CardioNutritionPlan {
  id?: string;
  patientId: string;
  assessmentId: string;
  totalCalories: number;
  proteinGrams: number;
  fatGrams: number;
  carbohydrateGrams: number;
  sodiumMg: number;
  fluidMl: number;
  saturatedFatGrams: number;
  transFatGrams: number;
  omega3Grams: number;
  cholesterolMg: number;
  potassiumTarget: number;
  dietaryPattern: DietaryPattern;
  foodsToAvoid: string[];
  foodsToIncrease: string[];
  targetWeight: number;
  weightLossRate: number;
  exerciseType: string;
  exerciseFrequency: number;
  exerciseDuration: number;
  exerciseIntensity: string;
  supplements: { name: string; dose: string; frequency: string }[];
  recommendations: string[];
  isActive: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CardioMonitoring {
  id?: string;
  patientId: string;
  planId: string;
  timestamp: string;
  weight: number;
  dryWeight: number;
  fluidGain: number;
  heartRate: number;
  systolicBP: number;
  diastolicBP: number;
  hasShortnessOfBreath: boolean;
  hasEdema: boolean;
  hasFatigue: boolean;
  hasChestPain: boolean;
  sodium: number;
  potassium: number;
  creatinine: number;
  bnp: number;
  totalCholesterol: number;
  ldl: number;
  hdl: number;
  triglycerides: number;
  dietarySodiumIntake: number;
  dietaryFluidIntake: number;
  medicationAdherence: boolean;
  exerciseMinutes: number;
  exerciseType: string;
  exerciseTolerance: string;
  createdAt: string;
  updatedAt: string;
}
