export type DiabetesType = 'type_1' | 'type_2' | 'gestational' | 'pre_diabetes';

export interface IBaseDiabetesData {
  diabetesType: DiabetesType;
  fastingBloodGlucose: number;
  postPrandialBloodGlucose: number;
  hba1c: number;
  lastUpdatedTimestamp: number;
}

export interface IType1DiabetesData extends IBaseDiabetesData {
  diabetesType: 'type_1';
  totalDailyInsulinDose: number;
  currentInsulinRegimen: 'basal_bolus' | 'pump' | 'split_mixed';
  calculatedICR?: number;
  calculatedISF?: number;
}

export interface IType2DiabetesData extends IBaseDiabetesData {
  diabetesType: 'type_2';
  hasInsulinResistance: boolean;
  oralHypoglycemicMeds: string[];
  metabolicSyndromeMarkers: boolean;
}

export interface IGestationalDiabetesData extends IBaseDiabetesData {
  diabetesType: 'gestational';
  gestationalWeeks: number;
  prePregnancyBMI: number;
  targetWeightGainRange: { min: number; max: number };
  morningUrineKetonesPresent: boolean;
}

export type TPatientDiabetesPayload = IType1DiabetesData | IType2DiabetesData | IGestationalDiabetesData;
