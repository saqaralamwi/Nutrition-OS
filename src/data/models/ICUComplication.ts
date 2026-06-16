import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import ICUAdmission from './ICUAdmission';
import ICUPatientRecord from './ICUPatientRecord';

export default class ICUComplication extends Model {
  static table = 'icu_complications';

  static associations = {
    icu_admissions: { type: 'belongs_to' as const, key: 'icu_admission_id' },
    icu_patient_records: { type: 'belongs_to' as const, key: 'icu_patient_record_id' },
  };

  @relation('icu_admissions', 'icu_admission_id') icuAdmission?: ICUAdmission;
  @relation('icu_patient_records', 'icu_patient_record_id') icuPatientRecord?: ICUPatientRecord;
  @field('icu_admission_id') icuAdmissionId!: string;
  @field('icu_patient_record_id') icuPatientRecordId?: string;
  @date('complication_date') complicationDate!: Date;
  @field('complication_type') complicationType!: string;
  @field('complication_type_ar') complicationTypeAr?: string;
  @field('category') category?: string;
  @field('category_ar') categoryAr?: string;
  @field('cause') cause?: string;
  @field('cause_ar') causeAr?: string;
  @field('risk_factors') riskFactors?: string;
  @field('risk_factors_ar') riskFactorsAr?: string;
  @field('severity') severity!: string;
  @field('severity_ar') severityAr?: string;
  @field('description') description!: string;
  @field('description_ar') descriptionAr?: string;
  @field('symptoms') symptoms?: string;
  @field('symptoms_ar') symptomsAr?: string;
  @field('onset_time') onsetTime?: string;
  @field('duration') duration?: number;
  @field('action_taken') actionTaken?: string;
  @field('action_taken_ar') actionTakenAr?: string;
  @field('medication') medication?: string;
  @field('medication_ar') medicationAr?: string;
  @field('nutrition_change') nutritionChange?: string;
  @field('nutrition_change_ar') nutritionChangeAr?: string;
  @field('protocol_used') protocolUsed?: string;
  @field('protocol_used_ar') protocolUsedAr?: string;
  @field('resolved') resolved!: boolean;
  @date('resolved_date') resolvedDate?: Date;
  @field('outcome') outcome?: string;
  @field('outcome_ar') outcomeAr?: string;
  @field('reported_by') reportedBy?: string;
  @date('reported_at') reportedAt?: Date;
  @field('created_by') createdBy?: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
