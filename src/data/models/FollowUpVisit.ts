import { Model } from '@nozbe/watermelondb';
import { field, date, immutableRelation, relation } from '@nozbe/watermelondb/decorators';

export default class FollowUpVisit extends Model {
  static table = 'follow_up_visits';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
    interventions: { type: 'belongs_to' as const, key: 'intervention_id' },
  };

  @immutableRelation('patients', 'patient_id') patient!: any;
  @field('patient_id') patientId!: string;
  @relation('interventions', 'intervention_id') intervention!: any;
  @field('intervention_id') interventionId!: string;
  @date('visit_date') visitDate!: Date;
  @field('current_weight') currentWeight!: number;
  @field('height') height!: number;
  @field('bmi') bmi!: number;
  @field('edema') edema!: string;
  @field('dehydration') dehydration!: string;
  @field('stool_frequency') stoolFrequency!: number;
  @field('stool_consistency') stoolConsistency!: string;
  @field('enteral_tolerance') enteralTolerance!: string;
  @field('parenteral_tolerance') parenteralTolerance!: string;
  @field('fluid_intake') fluidIntake!: number;
  @field('fluid_output') fluidOutput!: number;
  @field('gastric_residual') gastricResidual!: number;
  @field('respiratory_status') respiratoryStatus!: string;
  @field('drug_nutrient_consequences') drugNutrientConsequences!: string;
  @field('overall_progress') overallProgress!: string;
  @field('plan_successful') planSuccessful!: string;
  @field('replan_required') replanRequired!: boolean;
  @field('replan_notes') replanNotes!: string;
  @field('comments') comments!: string;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
}
