export type CirrhosisStage = 'stage_1' | 'stage_2' | 'stage_3' | 'stage_4';

export type CirrhosisCause = 'viral_hepatitis' | 'alcoholic' | 'nafld' | 'autoimmune' | 'cryptogenic' | 'other';

export type AscitesSeverity = 'none' | 'mild' | 'moderate' | 'severe';

export type EncephalopathyGrade = 'none' | 'grade_1' | 'grade_2' | 'grade_3' | 'grade_4';

export type AmmoniaLevel = 'normal' | 'elevated' | 'very_elevated';

export interface CirrhosisAssessment {
  id?: string;
  patientId: string;
  timestamp: string;
  stage: CirrhosisStage;
  cause: CirrhosisCause;
  diagnosisDate: string;
  mELDscore: number;
  hasPortalHypertension: boolean;
  hasAscites: boolean;
  ascitesSeverity: AscitesSeverity;
  ascitesVolume: number;
  hasEncephalopathy: boolean;
  encephalopathyGrade: EncephalopathyGrade;
  ammoniaLevel: AmmoniaLevel;
  hasVarices: boolean;
  varicealBleeding: boolean;
  hepatorenalSyndrome: boolean;
  spontaneousBacterialPeritonitis: boolean;
  albumin: number;
  totalProtein: number;
  bilirubin: number;
  ast: number;
  alt: number;
  alkalinePhosphatase: number;
  creatinine: number;
  sodium: number;
  potassium: number;
  ammonia: number;
  platelets: number;
  hemoglobin: number;
  heartRate: number;
  bloodPressure: string;
  weight: number;
  height: number;
  bmi: number;
  muscleMass: number;
  fatMass: number;
  ascitesWeight: number;
  edemaWeight: number;
  nausea: boolean;
  vomiting: boolean;
  fatigue: boolean;
  pruritus: boolean;
  abdominalPain: boolean;
  earlySatiety: boolean;
  currentSodiumIntake: number;
  currentProteinIntake: number;
  alcoholIntake: number;
  diuretics: boolean;
  lactulose: boolean;
  rifaximin: boolean;
  betaBlockers: boolean;
  PPI: boolean;
  proteinGoal: number;
  sodiumGoal: number;
  calorieGoal: number;
  fluidGoal: number;
  createdAt: string;
  updatedAt: string;
}

export interface CirrhosisNutritionPlan {
  id?: string;
  patientId: string;
  assessmentId: string;
  totalCalories: number;
  proteinGrams: number;
  fatGrams: number;
  carbohydrateGrams: number;
  proteinPerKg: number;
  sodiumMg: number;
  proteinTiming: string;
  bedtimeSnack: boolean;
  proteinSource: string;
  fluidMl: number;
  thiamine: number;
  folate: number;
  zinc: number;
  vitaminD: number;
  vitaminK: number;
  bcaaSupplement: boolean;
  foodRestrictions: string[];
  recommendations: string[];
  isActive: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CirrhosisMonitoring {
  id?: string;
  patientId: string;
  planId: string;
  timestamp: string;
  actualWeight: number;
  dryWeight: number;
  ascitesWeight: number;
  lactuloseEffect: string;
  constipation: boolean;
  encephalopathyGrade: EncephalopathyGrade;
  bilirubin: number;
  albumin: number;
  ammonia: number;
  inr: number;
  dailySodiumIntake: number;
  dailyProteinIntake: number;
  ascitesProgression: boolean;
  bleeding: boolean;
  infection: boolean;
  createdAt: string;
  updatedAt: string;
}
