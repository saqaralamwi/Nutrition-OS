export type BurnSeverity = 'minor' | 'moderate' | 'severe' | 'critical';

export type BurnType = 'thermal' | 'chemical' | 'electrical' | 'radiation';

export type BurnLocation = 'head_neck' | 'upper_extremity' | 'lower_extremity' | 'anterior_trunk' | 'posterior_trunk' | 'genital' | 'other';

export type WoundHealingPhase = 'acute' | 'inflammatory' | 'regenerative' | 'maturation';

export type BurnDepth = 'superficial' | 'mid_partial' | 'deep_partial' | 'full_thickness';

export interface BurnsAssessment {
  id?: string;
  patientId: string;
  timestamp: string;
  severity: BurnSeverity;
  type: BurnType;
  totalBodySurfaceArea: number;
  depth: BurnDepth;
  burnLocations: BurnLocation[];
  hasInhalationInjury: boolean;
  respiratoryBurn: boolean;
  heartRate: number;
  bloodPressure: string;
  temperature: number;
  oxygenSaturation: number;
  albumin: number;
  prealbumin: number;
  hemoglobin: number;
  whiteBloodCells: number;
  creatinine: number;
  glucose: number;
  sodium: number;
  potassium: number;
  weight: number;
  height: number;
  bmi: number;
  preBurnWeight: number;
  weightLossPercent: number;
  daysSinceBurn: number;
  infection: boolean;
  sepsis: boolean;
  multiOrganFailure: boolean;
  renalFailure: boolean;
  painLevel: number;
  painManagement: string;
  calorieGoal: number;
  proteinGoal: number;
  fluidGoal: number;
  vitaminAGoal: number;
  vitaminCGoal: number;
  zincGoal: number;
  createdAt: string;
  updatedAt: string;
}

export interface BurnsNutritionPlan {
  id?: string;
  patientId: string;
  assessmentId: string;
  totalCalories: number;
  proteinGrams: number;
  fatGrams: number;
  carbohydrateGrams: number;
  proteinPerKg: number;
  fluidGoal: number;
  vitaminAIU: number;
  vitaminCMg: number;
  zincMg: number;
  copperMg: number;
  vitaminEIU: number;
  targetGlucoseMin: number;
  targetGlucoseMax: number;
  enteralNutrition: boolean;
  parenteralNutrition: boolean;
  formulaType: string;
  proteinSources: string[];
  supplements: { name: string; dose: string; frequency: string }[];
  stressUlcerPrevention: string;
  infectionPrevention: string[];
  recommendations: string[];
  isActive: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface BurnsMonitoring {
  id?: string;
  patientId: string;
  planId: string;
  timestamp: string;
  weight: number;
  fluidBalance: number;
  actualCalories: number;
  goalCalories: number;
  percentHealed: number;
  newWounds: boolean;
  infectionSigns: boolean;
  albumin: number;
  prealbumin: number;
  glucose: number;
  painScore: number;
  infection: boolean;
  sepsis: boolean;
  woundBreakdown: boolean;
  oralIntakeTolerance: string;
  tubeTolerance: string;
  createdAt: string;
  updatedAt: string;
}
