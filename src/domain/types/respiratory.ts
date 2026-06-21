export type RespiratoryCondition = 'copd' | 'pneumonia' | 'asthma' | 'ild' | 'bronchiectasis' | 'tb' | 'other';

export type COPDSeverity = 'mild' | 'moderate' | 'severe' | 'very_severe';

export type VentilationStatus = 'none' | 'non_invasive' | 'invasive' | 'tracheostomy';

export type NutritionStatus = 'underweight' | 'normal' | 'overweight';

export type EnergyExpenditureLevel = 'low' | 'normal' | 'high' | 'very_high';

export interface RespiratoryAssessment {
  id?: string;
  patientId: string;
  timestamp: string;
  condition: RespiratoryCondition;
  copdSeverity: COPDSeverity | null;
  diagnosisDate: string;
  chronicCondition: boolean;
  forcedExpiratoryVolume: number;
  fev1PercentPredicted: number;
  forcedVitalCapacity: number;
  fvcPercentPredicted: number;
  fev1fvcRatio: number;
  oxygenSaturationResting: number;
  oxygenSaturationExertion: number;
  ventilationStatus: VentilationStatus;
  oxygenUse: boolean;
  oxygenLitersPerMin: number;
  shortnessOfBreath: boolean;
  cough: boolean;
  sputumProduction: boolean;
  wheezing: boolean;
  fatigue: boolean;
  albumin: number;
  prealbumin: number;
  hemoglobin: number;
  whiteBloodCells: number;
  crp: number;
  co2: number;
  oxygen: number;
  weight: number;
  height: number;
  bmi: number;
  nutritionStatus: NutritionStatus;
  recentWeightLoss: boolean;
  weightLossKg: number;
  weightLossPercent: number;
  muscleWasting: boolean;
  muscleWastingSeverity: string;
  fatMass: number;
  muscleMass: number;
  energyExpenditure: EnergyExpenditureLevel;
  metabolicRate: number;
  currentCalorieIntake: number;
  mealFrequency: number;
  appetite: string;
  bronchodilators: boolean;
  steroids: boolean;
  diuretics: boolean;
  onOxygenTherapy: boolean;
  exerciseCapacity: string;
  exerciseLimitations: string;
  physicalActivity: string;
  calorieGoal: number;
  proteinGoal: number;
  weightGoal: number;
  createdAt: string;
  updatedAt: string;
}

export interface RespiratoryNutritionPlan {
  id?: string;
  patientId: string;
  assessmentId: string;
  totalCalories: number;
  proteinGrams: number;
  fatGrams: number;
  carbohydrateGrams: number;
  proteinPerKg: number;
  fluidGoal: number;
  sodiumMg: number;
  vitaminD: number;
  calcium: number;
  magnesium: number;
  potassium: number;
  gasProducingFoods: string[];
  smallFrequentMeals: boolean;
  notTooFull: boolean;
  energyExpenditure: EnergyExpenditureLevel;
  supplements: { name: string; dose: string; frequency: string }[];
  preExerciseNutrition: string;
  postExerciseNutrition: string;
  recommendations: string[];
  isActive: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface RespiratoryMonitoring {
  id?: string;
  patientId: string;
  planId: string;
  timestamp: string;
  weight: number;
  weightChange: number;
  actualCalories: number;
  actualProtein: number;
  shortnessOfBreath: boolean;
  coughFrequency: string;
  oxygenSaturationResting: number;
  oxygenSaturationExertion: number;
  exerciseDuration: number;
  fatigue: boolean;
  albumin: number;
  prealbumin: number;
  muscleMass: number;
  createdAt: string;
  updatedAt: string;
}
