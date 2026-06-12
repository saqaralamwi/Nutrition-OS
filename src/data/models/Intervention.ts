import { Model } from '@nozbe/watermelondb';
import { field, date, children, immutableRelation } from '@nozbe/watermelondb/decorators';

export default class Intervention extends Model {
  static table = 'interventions';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
    follow_up_visits: { type: 'has_many' as const, foreignKey: 'intervention_id' },
  };

  @immutableRelation('patients', 'patient_id') patient!: any;
  @field('patient_id') patientId!: string;
  @children('follow_up_visits') followUpVisits!: any;
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
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
}
