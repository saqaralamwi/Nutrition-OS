import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';

export default class PatientMedicationLog extends Model {
  static table = 'patient_medication_logs';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  @field('medication_name') medicationName!: string;
  @field('medication_name_ar') medicationNameAr?: string;
  @field('brand_name') brandName?: string;
  @field('brand_name_ar') brandNameAr?: string;
  @field('dosage') dosage!: string;
  @field('dose') dose?: string;
  @field('frequency') frequency!: string;
  @field('frequency_ar') frequencyAr?: string;
  @field('route') route?: string;
  @field('route_ar') routeAr?: string;
  @date('taken_at') takenAt!: Date;
  @date('scheduled_time') scheduledTime?: Date;
  @date('taken_time') takenTime?: Date;
  @field('taken') taken!: boolean;
  @field('is_taken') isTaken?: boolean;
  @field('is_missed') isMissed?: boolean;
  @field('before_meal') beforeMeal?: boolean;
  @field('after_meal') afterMeal?: boolean;
  @field('with_food') withFood?: boolean;
  @field('notes') notes?: string;
  @field('notes_ar') notesAr?: string;
  @field('created_by') createdBy?: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
