import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';

export default class FhirNutritionStatus extends Model {
  static table = 'fhir_nutrition_statuses';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  @date('recorded_date') recordedDate!: Date;
  @field('status') status!: string;
  @field('code') code?: string;
  @field('subject') subject?: string;
  @field('encounter') encounter?: string;
  @field('dietary_intake_json') dietaryIntakeJson?: string;
  @field('enteral_intake_json') enteralIntakeJson?: string;
  @field('parenteral_intake_json') parenteralIntakeJson?: string;
  @field('note') note?: string;
  @field('fhir_id') fhirId?: string;
  @field('fhir_version') fhirVersion?: string;
  @field('nutritional_requirement') nutritionalRequirement?: string;
  @field('nutritional_requirement_ar') nutritionalRequirementAr?: string;
  @field('dietary_intake') dietaryIntake?: string;
  @field('dietary_intake_ar') dietaryIntakeAr?: string;
  @field('assessment') assessment?: string;
  @field('assessment_ar') assessmentAr?: string;
  @field('sync_status') syncState?: string;
  @field('sync_status_ar') syncStatusAr?: string;
  @date('sync_at') syncAt?: Date;
  @field('sync_error') syncError?: string;
  @field('created_by') createdBy?: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
