import { Model } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';

export default class DietaryHistorySession extends Model {
  static table = 'patient_dietary_history_sessions';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  @field('interview_date') interviewDate!: number;
  @field('day_type') dayType!: string;
  @field('reliability_score') reliabilityScore!: string;
  @field('total_computed_calories') totalComputedCalories!: number;
  @field('total_computed_protein') totalComputedProtein!: number;
  @field('total_fluid_intake_ml') totalFluidIntakeMl!: number;
  @date('recorded_at') recordedAt!: Date;
}
