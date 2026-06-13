import { Model } from '@nozbe/watermelondb';
import { field, date, children } from '@nozbe/watermelondb/decorators';

export default class Patient extends Model {
  static table = 'patients';

  static associations = {
    social_histories: { type: 'has_many' as const, foreignKey: 'patient_id' },
    medical_histories: { type: 'has_many' as const, foreignKey: 'patient_id' },
    medications: { type: 'has_many' as const, foreignKey: 'patient_id' },
    supplements: { type: 'has_many' as const, foreignKey: 'patient_id' },
    lab_results: { type: 'has_many' as const, foreignKey: 'patient_id' },
    physical_exam_items: { type: 'has_many' as const, foreignKey: 'patient_id' },
    calculations: { type: 'has_many' as const, foreignKey: 'patient_id' },
    interventions: { type: 'has_many' as const, foreignKey: 'patient_id' },
    follow_up_visits: { type: 'has_many' as const, foreignKey: 'patient_id' },
    attachments: { type: 'has_many' as const, foreignKey: 'patient_id' },
    laboratory_records: { type: 'has_many' as const, foreignKey: 'patient_id' },
    discharge_summaries: { type: 'has_many' as const, foreignKey: 'patient_id' },
    meal_plans: { type: 'has_many' as const, foreignKey: 'patient_id' },
  };

  @field('file_number') fileNumber!: string;
  @field('full_name') fullName!: string;
  @field('age') age!: number;
  @field('date_of_birth') dateOfBirth!: string;
  @field('gender') gender!: string;
  @field('national_id') nationalId!: string;
  @field('nationality') nationality!: string;
  @field('phone_number') phoneNumber!: string;
  @field('department') department!: string;
  @field('bed_number') bedNumber!: string;
  @date('admission_date') admissionDate!: Date;
  @field('referring_physician') referringPhysician!: string;
  @field('primary_diagnosis') primaryDiagnosis!: string;
  @field('patient_type') patientType!: string;
  @field('status') status!: string;
  @field('notes') notes!: string;
  @field('incomplete_sections') incompleteSections!: string;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  @children('discharge_summaries') dischargeSummaries!: any;
  @children('meal_plans') mealPlans!: any;
}
