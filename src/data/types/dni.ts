export type DNISeverity = 'CRITICAL' | 'MODERATE' | 'MILD';
export type DNIInteractionType = 'CONTRAINDICATION' | 'DEPLETION' | 'MONITORING';

export interface DrugNutrientInteraction {
  id: string;
  drugNameEn: string;
  drugNameAr: string;
  affectedNutrient: string;
  type: DNIInteractionType;
  severity: DNISeverity;
  mechanismAr: string;
  recommendationAr: string;
}

export interface DNIResult {
  updatedContraindicatedNutrients: string[];
  triggeredInteractions: DrugNutrientInteraction[];
}
