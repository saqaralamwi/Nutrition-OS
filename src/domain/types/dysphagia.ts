export type DysphagiaSeverity = 'mild' | 'moderate' | 'severe' | 'critical';

export type DysphagiaLocation = 'oral' | 'pharyngeal' | 'esophageal' | 'oropharyngeal';

export type IDDSILevel = 'level_0' | 'level_1' | 'level_2' | 'level_3' | 'level_4' | 'level_5';

export type TextureModification = 'thin' | 'coarse' | 'minced' | 'pureed' | 'liquidified' | 'regular';

export type ConsistencyModification = 'thick' | 'normal' | 'thin';

export type AspirationRisk = 'low' | 'medium' | 'high';

export type FeedingAssistance = 'none' | 'minimal' | 'moderate' | 'maximal';

export interface DysphagiaAssessment {
  id?: string;
  patientId: string;
  timestamp: string;
  severity: DysphagiaSeverity;
  location: DysphagiaLocation;
  onsetDate: string;
  underlyingCondition: string;
  iddsiLevel: IDDSILevel;
  texture: TextureModification;
  consistency: ConsistencyModification;
  thickeningFactor: string;
  oralPhasePass: boolean;
  pharyngealPhasePass: boolean;
  aspiration: boolean;
  cough: boolean;
  weightLoss: boolean;
  weightLossPercent: number;
  appetiteDecrease: boolean;
  foodAvoidance: string[];
  mealDuration: number;
  albumin: number;
  prealbumin: number;
  hemoglobin: number;
  weight: number;
  height: number;
  bmi: number;
  oralMotorFunction: string;
  dentition: string;
  saliva: string;
  tongueStrength: string;
  coughStrength: string;
  respiratoryFunction: string;
  oxygenSaturation: number;
  aspirationRisk: AspirationRisk;
  feedingAssistance: FeedingAssistance;
  textureLevelGoal: number;
  calorieGoal: number;
  proteinGoal: number;
  createdAt: string;
  updatedAt: string;
}

export interface DysphagiaNutritionPlan {
  id?: string;
  patientId: string;
  assessmentId: string;
  textureLevel: number;
  texture: string;
  consistency: string;
  totalCalories: number;
  proteinGrams: number;
  fatGrams: number;
  carbohydrateGrams: number;
  thickenerType: string;
  feedingPosition: string;
  headTilt: boolean;
  chinTuck: boolean;
  slowFeeding: boolean;
  smallBites: boolean;
  smallFrequentMeals: boolean;
  carefulMonitoring: boolean;
  noDistractions: boolean;
  liquidModification: string;
  supplements: { name: string; dose: string; frequency: string }[];
  oralCareBeforeMeals: boolean;
  oralCareAfterMeals: boolean;
  suctionAvailable: boolean;
  aspirationMonitoring: string;
  emergencyPlan: string;
  recommendations: string[];
  isActive: boolean;
  notes: string;
  nextAssessment: string;
  createdAt: string;
  updatedAt: string;
}

export interface DysphagiaMonitoring {
  id?: string;
  patientId: string;
  planId: string;
  timestamp: string;
  actualCalories: number;
  actualProtein: number;
  actualFluid: number;
  aspirationIncidents: number;
  coughing: boolean;
  choking: boolean;
  wetVoice: boolean;
  weight: number;
  toleratedTextures: string[];
  rejectedTextures: string[];
  mealDuration: number;
  fatigue: boolean;
  assistanceLevel: FeedingAssistance;
  oralHealth: string;
  saO2BeforeMeal: number;
  saO2AfterMeal: number;
  createdAt: string;
  updatedAt: string;
}
