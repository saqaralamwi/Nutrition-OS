export type BurnDegree = 'first' | 'second' | 'third' | 'fourth';

export interface IBurnAssessmentRecord {
  patientId: string;
  tbsaPercentage: number;
  burnDegree: BurnDegree;
  isIntubated: boolean;
  curreriEnergyTarget: number;
  parklandFluidTarget: number;
  recordedAt: number;
  createdAt: number;
  updatedAt: number;
}

export interface IBurnMetabolicInput {
  patientWeightKg: number;
  tbsaPercentage: number;
  burnDegree: BurnDegree;
  isIntubated: boolean;
}

export interface IBurnMetabolicOutput {
  parklandFluidMl24h: number;
  first8hFluidMl: number;
  remaining16hFluidMl: number;
  curreriEnergyKcal24h: number;
  targetProteinGrams: number;
  isSafe: boolean;
  arabicClinicalAlerts: string[];
}
