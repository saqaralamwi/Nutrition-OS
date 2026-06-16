import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';

export default class LaboratoryResults extends Model {
  static table = 'laboratory_results';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') declare patient: Patient;
  @field('patient_id') declare patientId: string;
  @field('test_name') declare testName: string;
  @field('value') declare value: number;
  @field('unit') declare unit: string;
  @field('normal_low') declare normalLow: number | null;
  @field('normal_high') declare normalHigh: number | null;
  @field('is_abnormal') declare isAbnormal: boolean;
  @field('severity') declare severity: string | null;
  @date('test_date') declare testDate: Date;
  @field('collected_by') declare collectedBy: string | null;
  @field('recorded_by') declare recordedBy: string | null;
  @field('lab_instance_id') declare labInstanceId: string | null;
  @field('notes') declare notes: string | null;
  @field('notes_ar') declare notesAr: string | null;
  @field('source') declare source: string;

  @readonly @date('created_at') declare createdAt: Date;
  @readonly @date('updated_at') declare updatedAt: Date;
}
