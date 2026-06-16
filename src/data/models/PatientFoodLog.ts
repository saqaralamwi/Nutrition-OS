import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';

export default class PatientFoodLog extends Model {
  static table = 'patient_food_logs';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  @date('log_date') logDate!: Date;
  @field('food_id') foodId?: string;
  @field('recipe_id') recipeId?: string;
  @field('is_custom_food') isCustomFood?: boolean;
  @field('food_name') foodName!: string;
  @field('food_name_ar') foodNameAr?: string;
  @field('meal_type') mealType!: string;
  @field('meal_type_ar') mealTypeAr?: string;
  @field('category') category?: string;
  @field('category_ar') categoryAr?: string;
  @field('serving_size') servingSize!: string;
  @field('portion') portion?: number;
  @field('unit') unit?: string;
  @field('quantity') quantity!: number;
  @field('servings') servings?: number;
  @field('calories') calories?: number;
  @field('protein') protein?: number;
  @field('carbs') carbs?: number;
  @field('fat') fat?: number;
  @field('fiber') fiber?: number;
  @field('sugar') sugar?: number;
  @field('saturated_fat') saturatedFat?: number;
  @field('cholesterol_mg') cholesterolMg?: number;
  @field('sodium_mg') sodiumMg?: number;
  @field('potassium_mg') potassiumMg?: number;
  @field('calcium_mg') calciumMg?: number;
  @field('iron_mg') ironMg?: number;
  @field('protein_g') proteinG?: number;
  @field('carbs_g') carbsG?: number;
  @field('fat_g') fatG?: number;
  @field('timestamp') timestamp?: number;
  @field('photo_path') photoPath?: string;
  @field('image_url') imageUrl?: string;
  @field('notes') notes?: string;
  @field('notes_ar') notesAr?: string;
  @field('created_by') createdBy?: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
