import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, children, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';
import FollowUpVisit from './FollowUpVisit';

export default class Intervention extends Model {
  static table = 'interventions';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
    follow_up_visits: { type: 'has_many' as const, foreignKey: 'intervention_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  @children('follow_up_visits') followUpVisits?: FollowUpVisit[];
  @field('nutrition_diagnosis') nutritionDiagnosis!: string;
  @field('main_goal') mainGoal!: string;
  @field('diet_type') dietType!: string;
  @field('food_texture') foodTexture!: string;
  @field('route_of_feeding') routeOfFeeding!: string;
  @field('target_calories') targetCalories!: number;
  @field('target_protein') targetProtein!: number;
  @field('target_carbohydrates') targetCarbohydrates!: number;
  @field('target_fat') targetFat!: number;
  @field('fluid_allowance') fluidAllowance!: number;
  @field('diet_modifications') dietModifications!: string;
  @field('diet_recommendations') dietRecommendations!: string;
  @field('supplement_plan') supplementPlan!: string;
  @field('behavioral_instructions') behavioralInstructions!: string;
  @field('follow_up_interval') followUpInterval!: string;
  @field('linked_findings') linkedFindings!: string;
  @field('status') status!: string;
  @field('superseded_by') supersededBy!: string;
  @field('comments') comments!: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
