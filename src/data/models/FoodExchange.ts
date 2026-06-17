import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class FoodExchange extends Model {
  static table = 'food_exchanges';

  @field('exchange_group') exchangeGroup!: string;
  @field('food_name_ar') foodNameAr!: string;
  @field('serving_size_desc') servingSizeDesc!: string;
  @field('carbs_g') carbsG!: number;
  @field('protein_g') proteinG!: number;
  @field('fat_g') fatG!: number;
  @field('calories_kcal') caloriesKcal!: number;
  @field('potassium_level') potassiumLevel!: string;
  @field('phosphorus_level') phosphorusLevel!: string;
  @field('is_gluten_free') isGlutenFree!: boolean;
  @field('is_low_fodmap') isLowFodmap!: boolean;
  @field('is_lactose_free') isLactoseFree!: boolean;
  @field('is_user_defined') isUserDefined!: boolean;
  @field('associated_patient_id') associatedPatientId?: string;
  @field('is_composite_recipe') isCompositeRecipe!: boolean;
  @field('recipe_decomposition_json') recipeDecompositionJson!: string;
  @field('household_units_json') householdUnitsJson!: string;
  @field('micronutrient_tags_json') micronutrientTagsJson!: string;
}
