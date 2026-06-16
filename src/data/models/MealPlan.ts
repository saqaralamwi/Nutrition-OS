import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';

export default class MealPlan extends Model {
  static table = 'meal_plans';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  @date('plan_date') planDate!: Date;
  @field('meal_type') mealType!: string;
  @field('food_details') foodDetails!: string;
  @field('total_calories') totalCalories!: number;
  @field('total_carbs') totalCarbs!: number;
  @field('total_protein') totalProtein!: number;
  @field('total_fat') totalFat!: number;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
