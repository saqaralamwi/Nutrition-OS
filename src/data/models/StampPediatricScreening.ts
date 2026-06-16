import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';
import VitalsRecord from './VitalsRecord';

export default class StampPediatricScreening extends Model {
  static table = 'stamp_pediatric_screenings';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
    vitals_records: { type: 'belongs_to' as const, key: 'vitals_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @relation('vitals_records', 'vitals_id') vitalsRecord?: VitalsRecord;
  @field('patient_id') patientId!: string;
  @field('vitals_id') vitalsId?: string;
  @date('screening_date') screeningDate!: Date;
  @field('medical_condition_risk') medicalConditionRisk?: number;
  @field('medical_condition_risk_label') medicalConditionRiskLabel?: string;
  @field('medical_condition_risk_label_ar') medicalConditionRiskLabelAr?: string;
  @field('medical_condition_description') medicalConditionDescription?: string;
  @field('medical_condition_description_ar') medicalConditionDescriptionAr?: string;
  @field('nutritional_status') nutritionalStatus?: number;
  @field('nutritional_status_label') nutritionalStatusLabel?: string;
  @field('nutritional_status_label_ar') nutritionalStatusLabelAr?: string;
  @field('dietary_intake') dietaryIntake?: string;
  @field('dietary_intake_ar') dietaryIntakeAr?: string;
  @field('weight_loss') weightLoss?: number;
  @field('weight_loss_label') weightLossLabel?: string;
  @field('weight_loss_label_ar') weightLossLabelAr?: string;
  @field('weight_loss_percent') weightLossPercent?: number;
  @field('weight_loss_duration') weightLossDuration?: string;
  @field('total_score') totalScore!: number;
  @field('risk_level') riskLevel!: string;
  @field('risk_level_label') riskLevelLabel?: string;
  @field('risk_level_label_ar') riskLevelLabelAr?: string;
  @field('recommended_actions') recommendedActions?: string;
  @field('recommended_actions_ar') recommendedActionsAr?: string;
  @field('action_details') actionDetails?: string;
  @field('action_details_ar') actionDetailsAr?: string;
  @field('urgency') urgency?: string;
  @field('additional_notes') additionalNotes?: string;
  @field('additional_notes_ar') additionalNotesAr?: string;
  @field('dietitian_name') dietitianName?: string;
  @field('dietitian_name_ar') dietitianNameAr?: string;
  @field('screened_by') screenedBy?: string;
  @date('screened_at') screenedAt?: Date;
  @field('nutritional_risk_score') nutritionalRiskScore!: number;
  @field('diagnosis_category') diagnosisCategory!: string;
  @field('nutritional_intake_score') nutritionalIntakeScore!: number;
  @field('weight_loss_score') weightLossScore!: number;
  @field('bmi_percentile') bmiPercentile?: number;
  @field('recommended_action') recommendedAction!: string;

  get parsedActionDetails(): string[] | null {
    if (!this.actionDetails) return null;
    try { return JSON.parse(this.actionDetails) as string[]; } catch { return null; }
  }

  get parsedActionDetailsAr(): string[] | null {
    if (!this.actionDetailsAr) return null;
    try { return JSON.parse(this.actionDetailsAr) as string[]; } catch { return null; }
  }

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
