import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation, children } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';
import ICUAdmission from './ICUAdmission';
import ICUNutritionAssessment from './ICUNutritionAssessment';

export default class ICUPatientRecord extends Model {
  static table = 'icu_patient_records';

  static associations = {
    icu_admissions: { type: 'belongs_to' as const, key: 'icu_admission_id' },
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
    icu_nutrition_assessments: { type: 'has_many' as const, foreignKey: 'icu_patient_record_id' },
  };

  @relation('icu_admissions', 'icu_admission_id') icuAdmission?: ICUAdmission;
  @relation('patients', 'patient_id') patient?: Patient;
  @field('icu_admission_id') icuAdmissionId!: string;
  @field('patient_id') patientId?: string;
  @date('record_date') recordDate!: Date;
  @field('weight_kg') weightKg?: number;
  @field('bmi') bmi?: number;
  @field('heart_rate') heartRate?: number;
  @field('bp_systolic') bpSystolic?: number;
  @field('bp_diastolic') bpDiastolic?: number;
  @field('respiratory_rate') respiratoryRate?: number;
  @field('temperature') temperature?: number;
  @field('o2_sat') o2Sat?: number;
  @field('gcs') gcs?: number;
  @field('urine_output_ml') urineOutputMl?: number;
  @field('fluid_balance_ml') fluidBalanceMl?: number;
  @field('sedation_level') sedationLevel?: string;
  @field('lab_values_json') labValuesJson?: string;
  @field('notes') notes?: string;
  @field('icu_bed_number') icuBedNumber?: string;
  @field('icu_room_number') icuRoomNumber?: string;
  @field('icu_nurse_assigned') icuNurseAssigned?: string;
  @field('icu_nurse_assigned_ar') icuNurseAssignedAr?: string;
  @field('icu_physician_assigned') icuPhysicianAssigned?: string;
  @field('icu_physician_assigned_ar') icuPhysicianAssignedAr?: string;
  @date('transfer_date') transferDate?: Date;
  @field('status') status?: string;
  @field('status_ar') statusAr?: string;
  @field('current_heart_rate') currentHeartRate?: number;
  @field('current_bp_systolic') currentBpSystolic?: number;
  @field('current_bp_diastolic') currentBpDiastolic?: number;
  @field('current_rr') currentRr?: number;
  @field('current_temperature') currentTemperature?: number;
  @field('current_o2_sat') currentO2Sat?: number;
  @field('current_weight') currentWeight?: number;
  @field('fluid_intake_ml') fluidIntakeMl?: number;
  @field('created_by') createdBy?: string;

  @children('icu_nutrition_assessments') icuNutritionAssessments?: ICUNutritionAssessment[];

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
