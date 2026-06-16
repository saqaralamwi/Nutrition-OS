export type DiarrheaGrading = 'none' | 'mild' | 'moderate' | 'severe';

export interface IGastrointestinalAssessment {
  patientId: string;
  stoolFrequencyPer24h: number;
  diarrheaGrading: DiarrheaGrading;
  hasIntestinalBleeding: boolean;
  hasMalabsorptionSigns: boolean;
  fecalFatG24h: number;
  steatorrheaPresent: boolean;
  recordedAt: number;
  createdAt: number;
  updatedAt: number;
}

export type GlutenDiagnosis = 'celiac_disease' | 'wheat_allergy' | 'none';

export interface IGlutenIsolationInput {
  diagnosis: GlutenDiagnosis;
  foodNameAr: string;
  foodNameEn: string;
  chemicalTags: string[];
  ingredientsListEn: string[];
}

export interface IGlutenIsolationOutput {
  isAllowed: boolean;
  severityLevel: 'critical' | 'none';
  crossContaminationRisk: boolean;
  arabicClinicalAlerts: string[];
}

export type FodmapDiagnosis = 'IBS' | 'IBD_active' | 'none';

export interface IFodmapInput {
  diagnosis: FodmapDiagnosis;
  chemicalTags: string[];
  ingredientsListEn: string[];
  isReintroductionPhase: boolean;
}

export type LimitationLevel = 'strict_elimination' | 'moderate_restriction' | 'none';

export interface IFodmapOutput {
  isHighFodmapDetected: boolean;
  limitationLevel: LimitationLevel;
  isSafe: boolean;
  arabicClinicalAlerts: string[];
}

export type SeverityTier = 'normal_low' | 'high_output' | 'severe_crisis_loss';

export type AnatomicalSource = 'gastric' | 'duodenal' | 'jejunal_ileal' | 'colostomy';

export interface IGastroLossInput {
  fistulaOutputMl24h: number;
  anatomicalSource: AnatomicalSource;
  patientWeightKg: number;
}

export interface IGastroLossOutput {
  severityTier: SeverityTier;
  fluidReplacementMl: number;
  totalNaRequiredMeq: number;
  totalKRequiredMeq: number;
  isSafe: boolean;
  arabicClinicalAlerts: string[];
}

export type MilkAllergyType = 'lactose_intolerance' | 'cow_milk_protein_allergy' | 'none';

export type RestrictionTier = 'absolute_dairy_protein_exclusion' | 'strict_lactose_exclusion' | 'lactose_free_permitted' | 'none';

export interface IMilkAllergenInput {
  allergyType: MilkAllergyType;
  chemicalTags: string[];
  ingredientsListEn: string[];
}

export interface IMilkAllergenOutput {
  isAllowed: boolean;
  restrictionTier: RestrictionTier;
  isSafe: boolean;
  arabicClinicalAlerts: string[];
}
