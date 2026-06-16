import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class FoodItem extends Model {
  static table = 'food_items';

  @field('name_ar') nameAr!: string;
  @field('name_en') nameEn?: string;
  @field('category') category!: string;
  @field('serving_size') servingSize!: string;
  @field('calories') calories!: number;
  @field('carbohydrates') carbohydrates!: number;
  @field('protein') protein!: number;
  @field('fat') fat!: number;
  @field('potassium') potassium?: number;
  @field('sodium') sodium?: number;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
