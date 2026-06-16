import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';

export default class SmartScaleDatum extends Model {
  static table = 'smart_scale_data';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  @date('measured_at') measuredAt!: Date;
  @field('timestamp') timestamp?: number;
  @field('weight_kg') weightKg!: number;
  @field('weight_lb') weightLb?: number;
  @field('bmi') bmi?: number;
  @field('body_fat_percent') bodyFatPercent?: number;
  @field('muscle_mass_kg') muscleMassKg?: number;
  @field('muscle_mass') muscleMass?: number;
  @field('bone_mass_kg') boneMassKg?: number;
  @field('bone_mass') boneMass?: number;
  @field('body_water_percent') bodyWaterPercent?: number;
  @field('water_percent') waterPercent?: number;
  @field('visceral_fat_level') visceralFatLevel?: number;
  @field('bmr_kcal') bmrKcal?: number;
  @field('metabolic_age') metabolicAge?: number;
  @field('device_id') deviceId?: string;
  @field('device_name') deviceName?: string;
  @field('device_name_ar') deviceNameAr?: string;
  @field('sync_status') syncState?: string;
  @field('sync_status_ar') syncStatusAr?: string;
  @date('sync_at') syncAt?: Date;
  @field('sync_error') syncError?: string;
  @field('created_by') createdBy?: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
