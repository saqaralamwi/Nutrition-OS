import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../database';
import TherapeuticFoodModel from '../models/TherapeuticFood';
import { ITherapeuticFoodRepository, TherapeuticFoodRecord } from '../../domain/repositories/ITherapeuticFoodRepository';

function toRecord(model: TherapeuticFoodModel): TherapeuticFoodRecord {
  return {
    id: model.id,
    nameAr: model.nameAr,
    nameEn: model.nameEn,
    caloriesPer100g: model.caloriesPer100g,
    proteinPer100g: model.proteinPer100g,
    carbsPer100g: model.carbsPer100g,
    fatPer100g: model.fatPer100g,
    potassiumMg: model.potassiumMg ?? undefined,
    phosphorusMg: model.phosphorusMg ?? undefined,
    sodiumMg: model.sodiumMg ?? undefined,
    calciumMg: model.calciumMg ?? undefined,
    glycemicIndex: model.glycemicIndex ?? undefined,
    purineLevel: model.purineLevel ?? undefined,
    allergenTags: model.allergenTags ?? undefined,
    therapeuticBenefits: model.therapeuticBenefits ?? undefined,
    createdAt: model.createdAt?.toISOString() || undefined,
    updatedAt: model.updatedAt?.toISOString() || undefined,
  };
}

export class TherapeuticFoodRepository implements ITherapeuticFoodRepository {
  async getAll(): Promise<TherapeuticFoodRecord[]> {
    const db = await getDatabase();
    const results = await db.get<TherapeuticFoodModel>('therapeutic_foods')
      .query()
      .fetch();
    return results.map(toRecord);
  }

  async getById(id: string): Promise<TherapeuticFoodRecord | null> {
    const db = await getDatabase();
    const result = await db.get<TherapeuticFoodModel>('therapeutic_foods')
      .find(id)
      .catch(() => null);
    return result ? toRecord(result) : null;
  }

  async search(query: string): Promise<TherapeuticFoodRecord[]> {
    const db = await getDatabase();
    const lower = query.toLowerCase();
    const results = await db.get<TherapeuticFoodModel>('therapeutic_foods')
      .query(
        Q.or(
          Q.where('name_ar', Q.like(`%${lower}%`)),
          Q.where('name_en', Q.like(`%${lower}%`)),
        ),
      )
      .fetch();
    return results.map(toRecord);
  }

  async getByTherapeuticBenefit(benefit: string): Promise<TherapeuticFoodRecord[]> {
    const db = await getDatabase();
    const results = await db.get<TherapeuticFoodModel>('therapeutic_foods')
      .query(
        Q.where('therapeutic_benefits', Q.like(`%${benefit}%`)),
      )
      .fetch();
    return results.map(toRecord);
  }
}
