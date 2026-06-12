import { Model } from '@nozbe/watermelondb';
import { field, date, immutableRelation } from '@nozbe/watermelondb/decorators';

export default class MedicalHistory extends Model {
  static table = 'medical_histories';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @immutableRelation('patients', 'patient_id') patient!: any;
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
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
}
