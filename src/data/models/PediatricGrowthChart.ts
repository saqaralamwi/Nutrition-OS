import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';

export default class PediatricGrowthChart extends Model {
  static table = 'pediatric_growth_charts';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  @date('record_date') recordDate!: Date;
  @field('age_months') ageMonths!: number;
  @field('chart_type') chartType?: string;
  @field('gender') gender?: string;
  @field('source') source?: string;
  @field('mean') mean?: number;
  @field('sd') sd?: number;
  @field('centile_3') centile3?: number;
  @field('centile_5') centile5?: number;
  @field('centile_10') centile10?: number;
  @field('centile_25') centile25?: number;
  @field('centile_50') centile50?: number;
  @field('centile_75') centile75?: number;
  @field('centile_90') centile90?: number;
  @field('centile_95') centile95?: number;
  @field('centile_97') centile97?: number;
  @field('zscore_3') zscoreN3?: number;
  @field('zscore_2') zscoreN2?: number;
  @field('zscore_1') zscoreN1?: number;
  @field('zscore_0') zscore0?: number;
  @field('zscore_pos1') zscorePos1?: number;
  @field('zscore_pos2') zscorePos2?: number;
  @field('zscore_pos3') zscorePos3?: number;
  @field('unit') unit?: string;
  @field('weight_kg') weightKg?: number;
  @field('height_cm') heightCm?: number;
  @field('head_circumference_cm') headCircumferenceCm?: number;
  @field('weight_z_score') weightZScore?: number;
  @field('height_z_score') heightZScore?: number;
  @field('weight_for_height_z') weightForHeightZ?: number;
  @field('bmi_z_score') bmiZScore?: number;
  @field('head_circumference_z') headCircumferenceZ?: number;
  @field('who_percentile') whoPercentile?: number;
  @field('standard_used') standardUsed?: string;
  @field('bmi_p95_percent') bmiP95Percent?: number;
  @field('bmi_extended_classification') bmiExtendedClassification?: string;

  get ageYears(): number {
    return this.ageMonths / 12;
  }

  calculateZScore(value: number): number {
    if (this.mean == null || this.sd == null || this.sd === 0) return 0;
    return (value - this.mean) / this.sd;
  }

  calculatePercentile(zScore: number): number {
    return (1 - 0.5 * (1 + 0.196854 * Math.abs(zScore)) ** -2) * 100;
  }

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
