import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';

export default class NutritionRequirements extends Model {
  static table = 'nutrition_requirements';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  @field('calculated_date') calculatedDate!: string;
  @field('base_tee') baseTee!: number;
  @field('adjusted_tee') adjustedTee!: number;
  @field('calories') calories!: number;
  @field('protein') protein!: number;
  @field('carbs') carbs!: number;
  @field('fat') fat!: number;
  @field('fluid') fluid!: number;
  @field('hidden_calories_total') hiddenCaloriesTotal!: number;
  @field('hidden_calories_propofol') hiddenCaloriesPropofol!: number;
  @field('hidden_calories_dextrose') hiddenCaloriesDextrose!: number;
  @field('hidden_calories_midol') hiddenCaloriesMidol!: number;
  @field('hidden_calories_lipids') hiddenCaloriesLipids!: number;
  @field('hidden_calories_breakdown') hiddenCaloriesBreakdown!: string;
  @field('is_adjusted') isAdjusted!: boolean;
  @field('adjustment_reason') adjustmentReason?: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  get overfeedingRisk(): boolean {
    return this.adjustedTee < this.calories * 0.9;
  }
}
