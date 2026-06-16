import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../database';
import DrugNutrientInteractionModel from '../models/DrugNutrientInteraction';
import { IDrugNutrientInteractionRepository, DrugNutrientInteractionRecord } from '../../domain/repositories/IDrugNutrientInteractionRepository';

function toRecord(model: DrugNutrientInteractionModel): DrugNutrientInteractionRecord {
  return {
    id: model.id,
    activeIngredient: model.activeIngredient,
    clinicalSeverity: model.clinicalSeverity,
    mechanismDescription: model.mechanismDescription ?? undefined,
    dietaryActionRequired: model.dietaryActionRequired ?? undefined,
    createdAt: model.createdAt?.toISOString() || undefined,
    updatedAt: model.updatedAt?.toISOString() || undefined,
  };
}

export class DrugNutrientInteractionRepository implements IDrugNutrientInteractionRepository {
  async getAll(): Promise<DrugNutrientInteractionRecord[]> {
    const db = await getDatabase();
    const results = await db.get<DrugNutrientInteractionModel>('drug_nutrient_interactions')
      .query()
      .fetch();
    return results.map(toRecord);
  }

  async getByIngredient(ingredient: string): Promise<DrugNutrientInteractionRecord[]> {
    const db = await getDatabase();
    const results = await db.get<DrugNutrientInteractionModel>('drug_nutrient_interactions')
      .query(Q.where('active_ingredient', ingredient))
      .fetch();
    return results.map(toRecord);
  }

  async getBySeverity(severity: string): Promise<DrugNutrientInteractionRecord[]> {
    const db = await getDatabase();
    const results = await db.get<DrugNutrientInteractionModel>('drug_nutrient_interactions')
      .query(Q.where('clinical_severity', severity))
      .fetch();
    return results.map(toRecord);
  }
}
