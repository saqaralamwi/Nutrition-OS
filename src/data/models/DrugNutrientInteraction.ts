import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class DrugNutrientInteraction extends Model {
  static table = 'drug_nutrient_interactions';

  @field('active_ingredient') activeIngredient!: string;
  @field('clinical_severity') clinicalSeverity!: string;
  @field('mechanism_description') mechanismDescription!: string;
  @field('dietary_action_required') dietaryActionRequired!: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  get isCritical(): boolean {
    return this.clinicalSeverity === 'critical';
  }

  get isModerate(): boolean {
    return this.clinicalSeverity === 'moderate';
  }

  get isMild(): boolean {
    return this.clinicalSeverity === 'mild';
  }
}
