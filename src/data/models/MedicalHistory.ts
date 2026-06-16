import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';

export default class MedicalHistory extends Model {
  static table = 'medical_histories';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  @field('chief_complaint') chiefComplaint!: string;
  @field('current_diagnosis') currentDiagnosis!: string;
  @field('icd_10_code') icd10Code!: string;
  @field('comorbidities') comorbidities!: string;
  @field('surgical_history') surgicalHistory!: string;
  @field('past_medical_history') pastMedicalHistory!: string;
  @field('family_history') familyHistory!: string;
  @field('medication_allergies') medicationAllergies!: string;
  @field('covid_19_status') covid19Status!: string;
  @field('comments') comments!: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
