export type OxygenDeliveryMode = 'none' | 'nasal_cannula' | 'cpap_bipap' | 'mechanical_ventilation';

export interface IRespiratoryAssessmentRecord {
  patientId: string;
  fev1Percentage: number;
  hasCo2Retention: boolean;
  respiratoryQuotientTarget: number;
  oxygenDeliveryMode: OxygenDeliveryMode;
  maxCarbohydrateEnergyRatio: number;
  recordedAt: number;
  createdAt: number;
  updatedAt: number;
}

export interface IRespiratoryInput {
  fev1Percentage: number;
  hasCo2Retention: boolean;
  oxygenDeliveryMode: OxygenDeliveryMode;
  totalEnergyTargetKcal: number;
}

export interface IRespiratoryOutput {
  targetRq: number;
  maxCarbohydrateEnergyRatio: number;
  maxCarbKcal: number;
  minLipidEnergyRatio: number;
  isSafe: boolean;
  arabicClinicalAlerts: string[];
}
