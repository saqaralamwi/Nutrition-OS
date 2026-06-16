export type EdemaGrading = 'none' | '1+' | '2+' | '3+' | '4+';

export interface ICardiovascularAssessment {
  patientId: string;
  systolicBloodPressure: number;
  diastolicBloodPressure: number;
  totalCholesterol: number;
  ldlCholesterol: number;
  hdlCholesterol: number;
  triglycerides: number;
  measuredDryWeightKg: number;
  hasPeripheralEdema: boolean;
  edemaGrading: EdemaGrading;
  recordedAt: number;
}

export type BpStage = 'normal' | 'elevated' | 'stage_1_hypertension' | 'stage_2_hypertension';

export interface IDashInput {
  systolicBloodPressure: number;
  diastolicBloodPressure: number;
  totalCholesterol: number;
  ldlCholesterol: number;
  triglycerides: number;
  targetCalories: number;
}

export interface IDashOutput {
  bpStage: BpStage;
  maxSodiumMg: number;
  isDyslipidemiaTriggered: boolean;
  maxSaturatedFatGrams: number;
  maxDietaryCholesterolMg: number;
  isSafe: boolean;
  arabicDirectives: string[];
}

export type CongestionRiskTier = 'critical' | 'moderate' | 'low';

export interface IDryWeightInput {
  measuredDryWeightKg: number;
  currentMorningWeightKg: number;
  previousWeight24hAgoKg: number;
  edemaGrading: EdemaGrading;
}

export interface IDryWeightOutput {
  netFluidGainKg: number;
  estimatedRetainedFluidMl: number;
  weightDelta24hKg: number;
  congestionRiskTier: CongestionRiskTier;
  isSafe: boolean;
  arabicClinicalAlerts: string[];
}

export type CvewsWarningStatus = 'EMERGENCY_RED' | 'WARNING_YELLOW' | 'STABLE_GREEN';

export interface ICvewsInput {
  systolicBloodPressure: number;
  diastolicBloodPressure: number;
  weightDelta24hKg: number;
  edemaGrading: EdemaGrading;
  hasDyspneaAtRest: boolean;
  hasOrthopnea: boolean;
}

export interface ICvewsOutput {
  warningStatus: CvewsWarningStatus;
  isEmergencyAlert: boolean;
  restrictFluidMl: number;
  isSafe: boolean;
  arabicClinicalAlerts: string[];
}
