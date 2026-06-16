import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';

// Unified model: now uses 'laboratory_results' table (merged from lab_results + laboratory_records)
export default class LabResult extends Model {
  static table = 'laboratory_results';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  @field('test_name') testName!: string;
  @field('value') resultValue!: number;
  @field('unit') unit!: string;
  @field('normal_low') referenceRangeLow!: number;
  @field('normal_high') referenceRangeHigh!: number;
  @field('is_abnormal') isAbnormal!: boolean;
  @field('severity') severity!: string | null;
  @date('test_date') testDate!: Date;
  @field('notes') comments!: string;
  @field('source') source!: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
