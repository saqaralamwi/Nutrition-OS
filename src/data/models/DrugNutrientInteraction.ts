import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class DrugNutrientInteraction extends Model {
  static table = 'drug_nutrient_interactions';

  @field('active_ingredient') activeIngredient!: string;
  @field('pharmacological_class') pharmacologicalClass?: string;
  @field('clinical_severity') clinicalSeverity!: string;
  @field('mechanism_ar') mechanismAr?: string;
  @field('mechanism_en') mechanismEn?: string;
  @field('dietary_action_ar') dietaryActionAr?: string;
  @field('dietary_action_en') dietaryActionEn?: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  get isCritical(): boolean {
    return this.clinicalSeverity.toLowerCase() === 'high' || this.clinicalSeverity.toLowerCase() === 'severe';
  }

  get isModerate(): boolean {
    return this.clinicalSeverity.toLowerCase() === 'medium' || this.clinicalSeverity.toLowerCase() === 'moderate';
  }

  get isMild(): boolean {
    return this.clinicalSeverity.toLowerCase() === 'low' || this.clinicalSeverity.toLowerCase() === 'mild';
  }
}
