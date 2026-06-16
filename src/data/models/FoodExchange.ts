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
}
