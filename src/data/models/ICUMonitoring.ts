import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import ICUAdmission from './ICUAdmission';
import ICUPatientRecord from './ICUPatientRecord';

export default class ICUMonitoring extends Model {
  static table = 'icu_monitorings';

  static associations = {
    icu_admissions: { type: 'belongs_to' as const, key: 'icu_admission_id' },
    icu_patient_records: { type: 'belongs_to' as const, key: 'icu_patient_record_id' },
  };

  @relation('icu_admissions', 'icu_admission_id') icuAdmission?: ICUAdmission;
  @relation('icu_patient_records', 'icu_patient_record_id') icuPatientRecord?: ICUPatientRecord;
  @field('icu_admission_id') icuAdmissionId!: string;
  @field('icu_patient_record_id') icuPatientRecordId?: string;
  @date('monitoring_date') monitoringDate!: Date;
  @field('actual_calories_kcal') actualCaloriesKcal?: number;
  @field('actual_protein_g') actualProteinG?: number;
  @field('actual_carbs_g') actualCarbsG?: number;
  @field('actual_fat_g') actualFatG?: number;
  @field('actual_fluid_ml') actualFluidMl?: number;
  @field('tube_feeding_volume_ml') tubeFeedingVolumeMl?: number;
  @field('tolerance_issues') toleranceIssues?: string;
  @field('gastric_residual_ml') gastricResidualMl?: number;
  @field('vomiting') vomiting!: boolean;
  @field('diarrhea') diarrhea!: boolean;
  @field('constipation') constipation!: boolean;
  @field('abdominal_distension') abdominalDistension!: boolean;
  @field('labs_json') labsJson?: string;
  @field('glucose') glucose?: number;
  @field('glucose_target_min') glucoseTargetMin?: number;
  @field('glucose_target_max') glucoseTargetMax?: number;
  @field('is_glucose_high') isGlucoseHigh?: boolean;
  @field('is_glucose_low') isGlucoseLow?: boolean;
  @field('glucose_trend') glucoseTrend?: string;
  @field('ketones') ketones?: number;
  @field('ketones_normal') ketonesNormal?: boolean;
  @field('triglycerides') triglycerides?: number;
  @field('triglycerides_target') triglyceridesTarget?: number;
  @field('is_triglycerides_high') isTriglyceridesHigh?: boolean;
  @field('cholesterol') cholesterol?: number;
  @field('total_protein') totalProtein?: number;
  @field('albumin') albumin?: number;
  @field('albumin_target') albuminTarget?: number;
  @field('is_albumin_low') isAlbuminLow?: boolean;
  @field('total_bilirubin') totalBilirubin?: number;
  @field('alt') alt?: number;
  @field('ast') ast?: number;
  @field('creatinine') creatinine?: number;
  @field('bun') bun?: number;
  @field('egfr') egfr?: number;
  @field('is_creatinine_high') isCreatinineHigh?: boolean;
  @field('sodium') sodium?: number;
  @field('sodium_target_min') sodiumTargetMin?: number;
  @field('sodium_target_max') sodiumTargetMax?: number;
  @field('is_sodium_high') isSodiumHigh?: boolean;
  @field('is_sodium_low') isSodiumLow?: boolean;
  @field('potassium') potassium?: number;
  @field('potassium_target_min') potassiumTargetMin?: number;
  @field('potassium_target_max') potassiumTargetMax?: number;
  @field('is_potassium_high') isPotassiumHigh?: boolean;
  @field('is_potassium_low') isPotassiumLow?: boolean;
  @field('chloride') chloride?: number;
  @field('phosphorus') phosphorus?: number;
  @field('phosphorus_target_min') phosphorusTargetMin?: number;
  @field('phosphorus_target_max') phosphorusTargetMax?: number;
  @field('is_phosphorus_low') isPhosphorusLow?: boolean;
  @field('magnesium') magnesium?: number;
  @field('magnesium_target_min') magnesiumTargetMin?: number;
  @field('magnesium_target_max') magnesiumTargetMax?: number;
  @field('is_magnesium_low') isMagnesiumLow?: boolean;
  @field('urine_output_ml') urineOutputMl?: number;
  @field('fluid_intake_ml') fluidIntakeMl?: number;
  @field('fluid_balance_ml') fluidBalanceMl?: number;
  @field('is_fluid_positive') isFluidPositive?: boolean;
  @field('is_fluid_negative') isFluidNegative?: boolean;
  @field('current_weight') currentWeight?: number;
  @field('weight_change') weightChange?: number;
  @field('weight_change_percent') weightChangePercent?: number;
  @field('recorded_by') recordedBy?: string;
  @date('recorded_at') recordedAt?: Date;
  @field('created_by') createdBy?: string;

  get toleranceIssuesList(): string[] | null {
    if (!this.toleranceIssues) return null;
    try { return JSON.parse(this.toleranceIssues) as string[]; } catch { return null; }
  }

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
