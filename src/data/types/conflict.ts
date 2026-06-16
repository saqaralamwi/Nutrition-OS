export type DiseaseCategory =
  | 'renal'
  | 'cardiovascular'
  | 'metabolic'
  | 'oncology'
  | 'hepatic'
  | 'pulmonary'
  | 'neurologic'
  | 'gastrointestinal'
  | 'hematologic'
  | 'endocrine'
  | 'nutrition'
  | 'immunologic';

export interface IClinicalPriorityMatrix {
  conditionCode: string;
  diseaseCategory: DiseaseCategory;
  absolutePriorityScore: number;
  fluidImpactWeight: number;
  proteinImpactWeight: number;
  isOverrideAllowed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface IActiveCondition {
  conditionCode: string;
  priorityScore: number;
  suggestedFluidMl: number;
  suggestedProteinGrams: number;
  isOverrideAllowed: boolean;
}

export interface IConflictResolverInput {
  activeConditions: IActiveCondition[];
}

export interface IConflictResolverOutput {
  governingConditionCode: string;
  resolvedFluidMl: number;
  resolvedProteinGrams: number;
  requiresMultidisciplinarySignOff: boolean;
  isSafe: boolean;
  arabicResolutionDirectives: string[];
}
