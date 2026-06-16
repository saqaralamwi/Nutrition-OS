import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';

export default class VitalsRecord extends Model {
  static table = 'vitals_records';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  @date('record_date') recordDate!: Date;
  @field('weight_kg') weightKg?: number;
  @field('height_cm') heightCm?: number;
  @field('bmi') bmi?: number;
  @field('temperature') temperature?: number;
  @field('heart_rate') heartRate?: number;
  @field('bp_systolic') bpSystolic?: number;
  @field('bp_diastolic') bpDiastolic?: number;
  @field('respiratory_rate') respiratoryRate?: number;
  @field('o2_sat') o2Sat?: number;
  @field('pain_score') painScore?: number;
  @field('weight') weight?: number;
  @field('height') height?: number;
  @field('waist_circumference') waistCircumference?: number;
  @field('hip_circumference') hipCircumference?: number;
  @field('waist_hip_ratio') waistHipRatio?: number;
  @field('body_fat_percent') bodyFatPercent?: number;
  @field('muscle_mass') muscleMass?: number;
  @field('screening_score') screeningScore?: number;
  @field('screening_status') screeningStatus?: string;
  @field('malnutrition_risk') malnutritionRisk?: string;
  @field('weight_change_1m') weightChange1m?: number;
  @field('weight_change_3m') weightChange3m?: number;
  @field('weight_change_6m') weightChange6m?: number;
  @field('dietary_intake') dietaryIntake?: string;
  @field('eating_difficulty') eatingDifficulty?: string;
  @field('npo_status') npoStatus?: boolean;
  @field('npo_duration') npoDuration?: string;
  @field('recorded_by') recordedBy?: string;
  @date('recorded_at') recordedAt?: Date;

  get bmiCategory(): string {
    if (this.bmi == null) return 'unknown';
    if (this.bmi < 18.5) return 'underweight';
    if (this.bmi < 25) return 'normal';
    if (this.bmi < 30) return 'overweight';
    return 'obese';
  }

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
