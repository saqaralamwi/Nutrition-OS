import { Model } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';

export default class PatientMealPlan extends Model {
  static table = 'patient_meal_plans';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  @field('plan_date') planDate!: number;
  @field('target_calories') targetCalories!: number;
  @field('target_protein') targetProtein!: number;
  @field('target_carbs') targetCarbs!: number;
  @field('target_fat') targetFat!: number;
  @field('meal_distribution_json') mealDistributionJson!: string;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
}
