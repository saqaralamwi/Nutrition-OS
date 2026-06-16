import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class ClinicalPriorityMatrix extends Model {
  static table = 'clinical_priority_matrices';

  @field('condition_code') conditionCode!: string;
  @field('disease_category') diseaseCategory!: string;
  @field('absolute_priority_score') absolutePriorityScore!: number;
  @field('fluid_impact_weight') fluidImpactWeight!: number;
  @field('protein_impact_weight') proteinImpactWeight!: number;
  @field('is_override_allowed') isOverrideAllowed!: boolean;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
}
