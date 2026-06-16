import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';

export default class PatientWeightLog extends Model {
  static table = 'patient_weight_logs';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  @date('log_date') logDate!: Date;
  @field('weight_kg') weightKg!: number;
  @field('weight_lb') weightLb?: number;
  @field('bmi') bmi?: number;
  @field('timestamp') timestamp?: number;
  @field('time_of_day') timeOfDay?: string;
  @field('time_of_day_ar') timeOfDayAr?: string;
  @field('source') source!: string;
  @field('source_ar') sourceAr?: string;
  @field('device_id') deviceId?: string;
  @field('body_fat_percent') bodyFatPercent?: number;
  @field('muscle_mass_kg') muscleMassKg?: number;
  @field('water_percent') waterPercent?: number;
  @field('bone_mass') boneMass?: number;
  @field('weight_change') weightChange?: number;
  @field('weight_change_percent') weightChangePercent?: number;
  @field('weight_trend') weightTrend?: string;
  @field('weight_trend_ar') weightTrendAr?: string;
  @field('notes') notes?: string;
  @field('notes_ar') notesAr?: string;
  @field('created_by') createdBy?: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
