import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';

export default class CgmDatum extends Model {
  static table = 'cgm_data';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  @date('recorded_at') recordedAt!: Date;
  @field('timestamp') timestamp?: number;
  @field('glucose_mg_dl') glucoseMgDl!: number;
  @field('glucose_mmol_l') glucoseMmolL?: number;
  @field('direction') direction?: string;
  @field('direction_ar') directionAr?: string;
  @field('is_hypoglycemia') isHypoglycemia?: boolean;
  @field('is_hyperglycemia') isHyperglycemia?: boolean;
  @field('sensor_status') sensorStatus?: string;
  @field('sensor_status_ar') sensorStatusAr?: string;
  @field('trend_arrow') trendArrow?: string;
  @field('device_id') deviceId?: string;
  @field('device_name') deviceName?: string;
  @field('device_name_ar') deviceNameAr?: string;
  @field('sync_status') syncState?: string;
  @field('sync_status_ar') syncStatusAr?: string;
  @date('sync_at') syncAt?: Date;
  @field('sync_error') syncError?: string;
  @field('notes') notes?: string;
  @field('created_by') createdBy?: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
