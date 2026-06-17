import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';

export default class LaboratoryRecord extends Model {
  static table = 'laboratory_results';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  @field('test_name') testName!: string;
  @field('value') resultValue!: number;
  @field('unit') unit!: string;
  @field('normal_low') normalLow!: number | null;
  @field('normal_high') normalHigh!: number | null;
  @field('is_abnormal') isAbnormal!: boolean;
  @field('severity') severity!: string | null;
  @date('test_date') testDate!: Date;
  @field('collected_by') collectedBy!: string | null;
  @field('recorded_by') recordedBy!: string | null;
  @field('lab_instance_id') labInstanceId!: string | null;
  @field('notes') notes!: string | null;
  @field('notes_ar') notesAr!: string | null;
  @field('source') source!: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
