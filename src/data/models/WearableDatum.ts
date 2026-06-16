import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';

export default class WearableDatum extends Model {
  static table = 'wearable_data';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  @date('recorded_at') recordedAt!: Date;
  @field('timestamp') timestamp?: number;
  @field('device_type') deviceType!: string;
  @field('device') device?: string;
  @field('device_ar') deviceAr?: string;
  @field('device_id') deviceId?: string;
  @field('steps') steps?: number;
  @field('heart_rate') heartRate?: number;
  @field('heart_rate_min') heartRateMin?: number;
  @field('heart_rate_max') heartRateMax?: number;
  @field('heart_rate_avg') heartRateAvg?: number;
  @field('calories_burned') caloriesBurned?: number;
  @field('activity_calories') activityCalories?: number;
  @field('sleep_hours') sleepHours?: number;
  @field('sleep_quality') sleepQuality?: string;
  @field('sleep_quality_ar') sleepQualityAr?: string;
  @field('activity_minutes') activityMinutes?: number;
  @field('active_minutes') activeMinutes?: number;
  @field('activity_type') activityType?: string;
  @field('distance_meters') distanceMeters?: number;
  @field('distance_km') distanceKm?: number;
  @field('sync_status') syncState?: string;
  @field('sync_status_ar') syncStatusAr?: string;
  @date('sync_at') syncAt?: Date;
  @field('sync_error') syncError?: string;
  @field('created_by') createdBy?: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
