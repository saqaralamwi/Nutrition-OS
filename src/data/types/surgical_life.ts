export type SurgeryType = 'abdominal' | 'orthopedic' | 'cardiac' | 'general';

export interface ISurgicalErasRecord {
  patientId: string;
  surgeryType: SurgeryType;
  surgeryScheduledAt: number;
  lastSolidFoodIntakeAt: number;
  lastClearFluidIntakeAt: number;
  isErasProtocolEnforced: boolean;
  recordedAt: number;
}

export interface ISurgicalErasInput {
  surgeryScheduledAt: number;
  lastSolidFoodIntakeAt: number;
  lastClearFluidIntakeAt: number;
  isErasProtocolEnforced: boolean;
}

export type ClinicalAction = 'advance_to_surgery' | 'delay_surgery';

export interface ISurgicalErasOutput {
  solidFastingHours: number;
  fluidFastingHours: number;
  isPreOpSafe: boolean;
  clinicalAction: ClinicalAction;
  recommendPreOpCarbLoading: boolean;
  carbSolutionPrescription: string;
  isSafe: boolean;
  arabicClinicalAlerts: string[];
}

export interface IPregnancyInput {
  baselineCalories: number;
  baselineProteinGrams: number;
  gestationalAgeWeeks: number;
  prePregnancyBmi: number;
}

export interface IPregnancyOutput {
  trimester: number;
  energyIncrement: number;
  proteinIncrement: number;
  totalCaloriesTarget: number;
  totalProteinGramsTarget: number;
  recommendedWeightGainMinKg: number;
  recommendedWeightGainMaxKg: number;
  isSafe: boolean;
  arabicClinicalAlerts: string[];
}

export interface ILactationInput {
  baselineCalories: number;
  baselineProteinGrams: number;
  baselineFluidsMl: number;
  monthsPostpartum: number;
  isExclusivelyBreastfeeding: boolean;
}

export interface ILactationOutput {
  energyIncrement: number;
  proteinIncrement: number;
  fluidIncrement: number;
  totalCaloriesTarget: number;
  totalProteinGramsTarget: number;
  totalFluidsMlTarget: number;
  isSafe: boolean;
  arabicClinicalAlerts: string[];
}

export type DysphagiaSeverity = 'none' | 'mild' | 'moderate' | 'severe';

export type ClinicalCondition = 'stroke' | 'parkinson' | 'dementia' | 'frailty' | 'none';

export interface IIddsiInput {
  patientAgeYears: number;
  hasDysphagia: boolean;
  clinicalCondition: ClinicalCondition;
  dysphagiaSeverity: DysphagiaSeverity;
}

export interface IIddsiOutput {
  liquidLevelCode: number;
  liquidLevelNameAr: string;
  foodTextureCode: number;
  foodTextureNameAr: string;
  isSafe: boolean;
  arabicClinicalAlerts: string[];
}

export interface IOrthopedicInput {
  hasActiveFracture: boolean;
  ageYears: number;
  egfrValue: number;
  gender: 'male' | 'female';
}

export interface IOrthopedicOutput {
  targetCalciumMg: number;
  targetPhosphorusMg: number;
  targetVitaminD3Iu: number;
  isRenalConstrained: boolean;
  isSafe: boolean;
  arabicClinicalAlerts: string[];
}
