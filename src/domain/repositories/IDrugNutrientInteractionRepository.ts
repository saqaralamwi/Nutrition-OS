export interface DrugNutrientInteractionRecord {
  id?: string;
  activeIngredient: string;
  clinicalSeverity: string;
  mechanismAr?: string;
  mechanismEn?: string;
  dietaryActionAr?: string;
  dietaryActionEn?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IDrugNutrientInteractionRepository {
  getAll(): Promise<DrugNutrientInteractionRecord[]>;
  getByIngredient(ingredient: string): Promise<DrugNutrientInteractionRecord[]>;
  getBySeverity(severity: string): Promise<DrugNutrientInteractionRecord[]>;
}
