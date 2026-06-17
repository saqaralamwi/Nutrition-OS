import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../database';
import Food from '../models/Food';
import FoodExchange from '../models/FoodExchange';
import { IFoodExchange } from '../types/meal_planner';

export class FoodRepository {
  /**
   * Robust search for the 'foods' table using case-insensitive wildcard matching
   * and checking multiple fields (name, aliases, category).
   */
  static async searchFoods(query: string) {
    const db = await getDatabase();
    const sanitized = query.trim().toLowerCase();
    
    if (!sanitized) return [];

    return await db.get<Food>('foods')
      .query(
        Q.or(
          Q.where('name_ar', Q.like(`%${sanitized}%`)),
          Q.where('name_en', Q.like(`%${sanitized}%`)),
          Q.where('category_ar', Q.like(`%${sanitized}%`)),
          Q.where('subcategory', Q.like(`%${sanitized}%`)),
          Q.where('allergens_ar', Q.like(`%${sanitized}%`)),
          Q.where('culture_ar', Q.like(`%${sanitized}%`)),
          Q.where('region_ar', Q.like(`%${sanitized}%`))
        ),
        Q.take(50)
      )
      .fetch();
  }

  /**
   * Robust search for the 'food_exchanges' table.
   */
  static async searchExchanges(query: string): Promise<FoodExchange[]> {
    const db = await getDatabase();
    const sanitized = query.trim().toLowerCase();
    
    if (!sanitized) return [];

    return await db.get<FoodExchange>('food_exchanges')
      .query(
        Q.or(
          Q.where('food_name_ar', Q.like(`%${sanitized}%`)),
          Q.where('exchange_group', Q.like(`%${sanitized}%`))
        ),
        Q.take(50)
      )
      .fetch();
  }

  static async getAllExchanges(): Promise<FoodExchange[]> {
    const db = await getDatabase();
    return await db.get<FoodExchange>('food_exchanges').query().fetch();
  }


  /**
   * Helper to map FoodExchange models to the IFoodExchange plain object interface
   */
  static mapExchangeToInterface(model: FoodExchange): IFoodExchange {
    return {
      exchangeGroup: model.exchangeGroup as any,
      foodNameAr: model.foodNameAr,
      servingSizeDesc: model.servingSizeDesc,
      carbsG: model.carbsG,
      proteinG: model.proteinG,
      fatG: model.fatG,
      caloriesKcal: model.caloriesKcal,
      glycemicIndex: (model as any).glycemicIndex ?? 50,
      potassiumLevel: model.potassiumLevel as any,
      phosphorusLevel: model.phosphorusLevel as any,
      isGlutenFree: model.isGlutenFree,
      isLowFodmap: model.isLowFodmap,
      isLactoseFree: model.isLactoseFree,
      isUserDefined: model.isUserDefined,
      associatedPatientId: model.associatedPatientId ?? null,
      isCompositeRecipe: model.isCompositeRecipe,
      recipeDecompositionJson: model.recipeDecompositionJson,
      householdUnitsJson: model.householdUnitsJson,
      micronutrientTagsJson: model.micronutrientTagsJson,
    };
  }
}
