import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';

// Unified model: now uses 'laboratory_results' table (merged from lab_results + laboratory_records)
// Panel-level records (ALT, AST, etc.) are stored as individual test_name rows
export default class LaboratoryRecord extends Model {
  static table = 'laboratory_results';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  @date('test_date') testDate!: Date;
  @field('test_name') testType!: string;
  @field('value') value!: number;
  @field('unit') unit!: string;
  @field('is_abnormal') isAbnormal!: boolean;
  @field('severity') severity!: string | null;
  @field('notes') notes!: string | null;
  @field('source') source!: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
