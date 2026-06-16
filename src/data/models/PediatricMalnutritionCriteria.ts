import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';

export default class PediatricMalnutritionCriteria extends Model {
  static table = 'pediatric_malnutrition_criteria';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  @date('assessment_date') assessmentDate!: Date;
  @field('indicator') indicator?: string;
  @field('indicator_ar') indicatorAr?: string;
  @field('mild_min') mildMin?: number;
  @field('mild_max') mildMax?: number;
  @field('mild_label') mildLabel?: string;
  @field('mild_label_en') mildLabelEn?: string;
  @field('moderate_min') moderateMin?: number;
  @field('moderate_max') moderateMax?: number;
  @field('moderate_label') moderateLabel?: string;
  @field('moderate_label_en') moderateLabelEn?: string;
  @field('severe_min') severeMin?: number;
  @field('severe_max') severeMax?: number;
  @field('severe_label') severeLabel?: string;
  @field('severe_label_en') severeLabelEn?: string;
  @field('underweight_threshold') underweightThreshold?: number;
  @field('overweight_threshold') overweightThreshold?: number;
  @field('obese_threshold') obeseThreshold?: number;
  @field('unit') unit?: string;
  @field('age_min_months') ageMinMonths?: number;
  @field('age_max_months') ageMaxMonths?: number;
  @field('age_range_label') ageRangeLabel?: string;
  @field('age_range_label_en') ageRangeLabelEn?: string;
  @field('source') source?: string;
  @field('weight_kg') weightKg!: number;
  @field('height_cm') heightCm!: number;
  @field('weight_for_height_z') weightForHeightZ?: number;
  @field('bmi_z_score') bmiZScore?: number;
  @field('mid_upper_arm_circumference') midUpperArmCircumference?: number;
  @field('muscle_wasting') muscleWasting?: string;
  @field('growth_faltered') growthFaltered!: boolean;
  @field('weight_loss_percent') weightLossPercent?: number;
  @field('inadequate_intake') inadequateIntake!: boolean;
  @field('edema') edema!: boolean;
  @field('malnutrition_severity') malnutritionSeverity!: string;

  classifyMalnutrition(value: number): 'none' | 'mild' | 'moderate' | 'severe' {
    if (this.mildMin != null && this.mildMax != null && value >= this.mildMin && value <= this.mildMax) return 'mild';
    if (this.moderateMin != null && this.moderateMax != null && value >= this.moderateMin && value <= this.moderateMax) return 'moderate';
    if (this.severeMin != null && value >= this.severeMin) return 'severe';
    return 'none';
  }

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
