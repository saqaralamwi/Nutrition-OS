import { Model } from '@nozbe/watermelondb';
import { field, date, immutableRelation } from '@nozbe/watermelondb/decorators';

export default class DischargeSummary extends Model {
  static table = 'discharge_summaries';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @immutableRelation('patients', 'patient_id') patient!: any;
  @field('patient_id') patientId!: string;
  @date('discharge_date') dischargeDate!: Date;
  @field('discharge_status') dischargeStatus!: string;
  @field('final_weight') finalWeight!: number;
  @field('total_days_on_en') totalDaysOnEn?: number;
  @field('total_days_on_pn') totalDaysOnPn?: number;
  @field('home_nutrition_plan') homeNutritionPlan!: string;
  @field('follow_up_required') followUpRequired!: boolean;
  @date('next_follow_up_date') nextFollowUpDate?: Date;

  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
}
