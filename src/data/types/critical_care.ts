export interface IIcuCriticalAssessment {
  patientId: string;
  isMechanicallyVentilated: boolean;
  isOnVasopressors: boolean;
  propofolInfusionRateMlHr: number;
  dexmedetomidineInfusionRateMlHr: number;
  gastricResidualVolumeMl: number;
  crpLevel: number;
  nitrogenBalanceG: number;
  recordedAt: number;
}

export type RefeedingRiskLevel = 'low' | 'moderate' | 'high';

export interface IIcuInput {
  mifflinRmr: number;
  isMechanicallyVentilated: boolean;
  maxTemperatureCelsius: number;
  minuteVentilationLmin: number;
  refeedingRiskLevel: RefeedingRiskLevel;
}

export interface IIcuOutput {
  icuEnergyTarget: number;
  initialCaloricCeiling: number;
  isRefeedingRestrictionEnforced: boolean;
  isSafe: boolean;
  arabicClinicalAlerts: string[];
}

export interface ITpnInput {
  aminoAcidGrams: number;
  dextroseGrams: number;
  lipidGrams: number;
  sodiumMeq: number;
  potassiumMeq: number;
  totalFluidVolumeMl: number;
}

export type VenousRoute = 'central_line' | 'peripheral_line';

export interface ITpnOutput {
  calculatedOsmolarityMosmL: number;
  recommendedRoute: VenousRoute;
  isSafe: boolean;
  arabicClinicalAlerts: string[];
}
