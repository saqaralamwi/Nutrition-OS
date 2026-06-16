export interface DrugNutrientInteractionRecord {
  id?: string;
  activeIngredient: string;
  clinicalSeverity: string;
  mechanismDescription?: string;
  dietaryActionRequired?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IDrugNutrientInteractionRepository {
  getAll(): Promise<DrugNutrientInteractionRecord[]>;
  getByIngredient(ingredient: string): Promise<DrugNutrientInteractionRecord[]>;
  getBySeverity(severity: string): Promise<DrugNutrientInteractionRecord[]>;
}
