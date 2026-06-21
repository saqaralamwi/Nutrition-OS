export type KidneyDiseaseStage = 'stage_1' | 'stage_2' | 'stage_3' | 'stage_4' | 'stage_5' | 'esrd' | 'transplant';

export type KidneyDiseaseType = 'diabetic' | 'hypertensive' | 'glomerulonephritis' | 'polycystic' | 'other';

export type DialysisType = 'none' | 'hemodialysis' | 'peritoneal' | 'continuous_renal_replacement';

export type DialysisFrequency = 'three_per_week' | 'daily' | 'continuous' | 'nocturnal';

export type FluidRestrictionLevel = 'none' | 'mild' | 'moderate' | 'severe';

export interface NephrologyAssessment {
  id?: string;
  patientId: string;
  timestamp: string;
  diseaseStage: KidneyDiseaseStage;
  diseaseType: KidneyDiseaseType;
  diagnosisDate: string;
  eGFR: number;
  creatinine: number;
  bun: number;
  potassium: number;
  sodium: number;
  phosphorus: number;
  calcium: number;
  albumin: number;
  hemoglobin: number;
  isFluidRestricted: boolean;
  fluidLimit: number;
  currentFluidIntake: number;
  edema: string;
  onDialysis: boolean;
  dialysisType: DialysisType;
  dialysisFrequency: DialysisFrequency;
  dialysisStartDate: string | null;
  dialysisAccess: string;
  weight: number;
  dryWeight: number;
  height: number;
  bmi: number;
  hasHypertension: boolean;
  hasAnemia: boolean;
  hasBoneDisease: boolean;
  hasCardiovascularDisease: boolean;
  calorieGoal: number;
  proteinGoal: number;
  potassiumGoal: number;
  phosphorusGoal: number;
  sodiumGoal: number;
  fluidGoal: number;
  createdAt: string;
  updatedAt: string;
}

export interface NephrologyNutritionPlan {
  id?: string;
  patientId: string;
  assessmentId: string;
  totalCalories: number;
  proteinGrams: number;
  fatGrams: number;
  carbohydrateGrams: number;
  proteinPerKg: number;
  potassiumLimit: number;
  phosphorusLimit: number;
  sodiumLimit: number;
  fluidLimit: number;
  phosphateBinders: string;
  ironDose: string;
  epoSupportNutrients: string[];
  highPotassiumFoods: string[];
  highPhosphorusFoods: string[];
  recommendations: string[];
  isActive: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface NephrologyMonitoring {
  id?: string;
  patientId: string;
  planId: string;
  timestamp: string;
  creatinine: number;
  bun: number;
  potassium: number;
  phosphorus: number;
  calcium: number;
  dryWeight: number;
  actualWeight: number;
  fluidIntake: number;
  fluidOutput: number;
  fluidBalance: number;
  dialysisDate: string | null;
  dialysisDuration: number;
  weightBeforeDialysis: number;
  weightAfterDialysis: number;
  ultrafiltrationVolume: number;
  hasFatigue: boolean;
  hasNausea: boolean;
  hasLegCramps: boolean;
  hasShortnessOfBreath: boolean;
  createdAt: string;
  updatedAt: string;
}
