import { foods } from './foods';
import { recipes } from './recipes';
import { clinicalGuidelines } from './clinicalGuidelines';
import { clinicalAlerts } from './clinicalAlerts';
import { clinicalRecommendations } from './clinicalRecommendations';
import { nutritionTemplates } from './nutritionTemplates';
import { foodContraindicationFilters } from './foodContraindicationFilters';
import type { FoodSeed, RecipeSeed, ClinicalGuidelineSeed, ClinicalAlertSeed, ClinicalRecommendationSeed, NutritionTemplateSeed, FoodContraindicationFilterSeed } from './seedData';

export interface SeedStats {
  foods: number;
  recipes: number;
  clinicalGuidelines: number;
  clinicalAlerts: number;
  clinicalRecommendations: number;
  nutritionTemplates: number;
  foodContraindicationFilters: number;
  total: number;
}

export function getSeedStats(): SeedStats {
  const stats = {
    foods: foods.length,
    recipes: recipes.length,
    clinicalGuidelines: clinicalGuidelines.length,
    clinicalAlerts: clinicalAlerts.length,
    clinicalRecommendations: clinicalRecommendations.length,
    nutritionTemplates: nutritionTemplates.length,
    foodContraindicationFilters: foodContraindicationFilters.length,
    total: 0,
  };
  stats.total = stats.foods + stats.recipes + stats.clinicalGuidelines + stats.clinicalAlerts + stats.clinicalRecommendations + stats.nutritionTemplates + stats.foodContraindicationFilters;
  return stats;
}

export async function importSeedData(db: any): Promise<SeedStats> {
  const stats = getSeedStats();

  console.log('=== Starting Seed Data Import ===');
  console.log(`Foods: ${stats.foods}`);
  console.log(`Recipes: ${stats.recipes}`);
  console.log(`Clinical Guidelines: ${stats.clinicalGuidelines}`);
  console.log(`Clinical Alerts: ${stats.clinicalAlerts}`);
  console.log(`Clinical Recommendations: ${stats.clinicalRecommendations}`);
  console.log(`Nutrition Templates: ${stats.nutritionTemplates}`);
  console.log(`Food Contraindication Filters: ${stats.foodContraindicationFilters}`);
  console.log(`Total Records: ${stats.total}`);

  if (db.bulkPut) {
    await db.bulkPut('foods', foods);
    await db.bulkPut('recipes', recipes);
    await db.bulkPut('clinical_guidelines', clinicalGuidelines);
    await db.bulkPut('clinical_alerts', clinicalAlerts);
    await db.bulkPut('clinical_recommendations', clinicalRecommendations);
    await db.bulkPut('nutrition_templates', nutritionTemplates);
    await db.bulkPut('food_contraindication_filters', foodContraindicationFilters);
  } else {
    const collections: Array<{ name: string; data: any[] }> = [
      { name: 'foods', data: foods },
      { name: 'recipes', data: recipes },
      { name: 'clinical_guidelines', data: clinicalGuidelines },
      { name: 'clinical_alerts', data: clinicalAlerts },
      { name: 'clinical_recommendations', data: clinicalRecommendations },
      { name: 'nutrition_templates', data: nutritionTemplates },
      { name: 'food_contraindication_filters', data: foodContraindicationFilters },
    ];

    for (const collection of collections) {
      const existing = await db.get(collection.name).query().fetchCount();
      if (existing > 0) {
        console.log(`[Seed] Skipping ${collection.name}, ${existing} records already exist.`);
        continue;
      }

      const col = db.get(collection.name);
      const NOW = Date.now();

      await db.write(async () => {
        const records = collection.data.map((item: any) =>
          col.prepareCreate((record: any) => {
            Object.assign(record._raw, item);
            record._raw.created_at = NOW;
            record._raw.updated_at = NOW;
          }),
        );
        await db.batch(records);
      });

      console.log(`[Seed] ${collection.name}: ${collection.data.length} records imported`);
    }
  }

  console.log('=== Seed Import Complete ===');
  return stats;
}

export { foods } from './foods';
export { recipes } from './recipes';
export { clinicalGuidelines } from './clinicalGuidelines';
export { clinicalAlerts } from './clinicalAlerts';
export { clinicalRecommendations } from './clinicalRecommendations';
export { nutritionTemplates } from './nutritionTemplates';
export { foodContraindicationFilters } from './foodContraindicationFilters';
