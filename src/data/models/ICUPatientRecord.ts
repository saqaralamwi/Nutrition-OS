import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';

export default class ICUPatientRecord extends Model {
  static table = 'icu_patient_records';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  
  // Clinical Metrics
  @field('apache_ii_score') apacheIiScore?: number;
  @field('sofa_score') sofaScore?: number;
  @field('nutric_score') nutricScore?: number;
  
  // Metabolic State
  @field('is_hemodynamically_stable') isHemodynamicallyStable!: boolean;
  @field('vasopressor_dose') vasopressorDose?: string;
  @field('lactate_level') lactateLevel?: number;
  
  // Nutrition Access
  @field('access_type') accessType?: string; // 'ngt', 'peg', 'tpn', etc.
  @field('gastric_residual_volume') grv?: number;
  
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
