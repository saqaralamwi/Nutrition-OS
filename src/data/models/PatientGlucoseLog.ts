import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';

export default class PatientGlucoseLog extends Model {
  static table = 'patient_glucose_logs';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  @date('log_date') logDate!: Date;
  @field('glucose_value') glucoseValue!: number;
  @field('glucose_mg_dl') glucoseMgDl?: number;
  @field('glucose_mmol_l') glucoseMmolL?: number;
  @field('unit') unit!: string;
  @date('measurement_time') measurementTime!: string;
  @field('timestamp') timestamp?: number;
  @field('time_of_day') timeOfDay?: string;
  @field('time_of_day_ar') timeOfDayAr?: string;
  @field('direction') direction?: string;
  @field('direction_ar') directionAr?: string;
  @field('is_hypoglycemia') isHypoglycemia?: boolean;
  @field('is_hyperglycemia') isHyperglycemia?: boolean;
  @field('glucose_category') glucoseCategory?: string;
  @field('glucose_category_ar') glucoseCategoryAr?: string;
  @field('before_meal') beforeMeal?: string;
  @field('before_meal_ar') beforeMealAr?: string;
  @field('after_meal') afterMeal?: string;
  @field('after_meal_ar') afterMealAr?: string;
  @field('physical_activity') physicalActivity?: boolean;
  @field('stress_level') stressLevel?: string;
  @field('stress_level_ar') stressLevelAr?: string;
  @field('source') source?: string;
  @field('source_ar') sourceAr?: string;
  @field('device_id') deviceId?: string;
  @field('notes') notes?: string;
  @field('notes_ar') notesAr?: string;
  @field('created_by') createdBy?: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
