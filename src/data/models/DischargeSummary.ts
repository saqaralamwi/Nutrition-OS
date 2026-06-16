import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';

export default class DischargeSummary extends Model {
  static table = 'discharge_summaries';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  @date('discharge_date') dischargeDate!: Date;
  @field('discharge_status') dischargeStatus!: string;
  @field('final_weight') finalWeight!: number;
  @field('total_days_on_en') totalDaysOnEn?: number;
  @field('total_days_on_pn') totalDaysOnPn?: number;
  @field('home_nutrition_plan') homeNutritionPlan!: string;
  @field('follow_up_required') followUpRequired!: boolean;
  @date('next_follow_up_date') nextFollowUpDate?: Date;
  @field('final_energy_intake') finalEnergyIntake!: number;
  @field('final_protein_intake') finalProteinIntake!: number;
  @field('final_fluid_intake') finalFluidIntake!: number;
  @field('weight_change_kg') weightChangeKg?: number;
  @field('nutrition_compliance') nutritionCompliance!: number;
  @field('discharge_nutrition_recommendation') dischargeNutritionRecommendation!: string;
  @field('followup_needed_days') followupNeededDays?: number;
  @field('complications_related_to_nutrition') complicationsRelatedToNutrition?: boolean;
  @field('complications_notes') complicationsNotes?: string;
  @field('next_energy_target_kcal') nextEnergyTargetKcal?: number;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
