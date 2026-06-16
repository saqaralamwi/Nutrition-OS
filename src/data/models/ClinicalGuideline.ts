import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class ClinicalGuideline extends Model {
  static table = 'clinical_guidelines';

  @field('title') title!: string;
  @field('title_ar') titleAr?: string;
  @field('guideline_name') guidelineName?: string;
  @field('guideline_name_ar') guidelineNameAr?: string;
  @field('source') source?: string;
  @field('source_ar') sourceAr?: string;
  @field('year') year?: number;
  @field('category') category!: string;
  @field('category_ar') categoryAr?: string;
  @field('condition') condition!: string;
  @field('condition_ar') conditionAr?: string;
  @field('summary') summary?: string;
  @field('summary_ar') summaryAr?: string;
  @field('recommendation') recommendation?: string;
  @field('recommendation_ar') recommendationAr?: string;
  @field('evidence_level') evidenceLevel?: string;
  @field('evidence_level_ar') evidenceLevelAr?: string;
  @field('recommendations_json') recommendationsJson!: string;
  @field('recommendations') recommendations?: string;
  @field('recommendations_ar') recommendationsAr?: string;
  @field('details') details?: string;
  @field('details_ar') detailsAr?: string;
  @field('energy_kcal_per_kg') energyKcalPerKg?: string;
  @field('protein_g_per_kg') proteinGPerKg?: string;
  @field('carbs_percent') carbsPercent?: string;
  @field('fat_percent') fatPercent?: string;
  @field('fiber_g') fiberG?: string;
  @field('sodium_mg') sodiumMg?: string;
  @field('potassium_mg') potassiumMg?: string;
  @field('phosphorus_mg') phosphorusMg?: string;
  @field('contraindications') contraindications?: string;
  @field('contraindications_ar') contraindicationsAr?: string;
  @field('monitoring_params') monitoringParams?: string;
  @field('monitoring_params_ar') monitoringParamsAr?: string;
  @field('frequency') frequency?: string;
  @field('frequency_ar') frequencyAr?: string;
  @field('url') url?: string;
  @field('version') version?: string;
  @field('is_active') isActive!: boolean;
  @field('created_by') createdBy?: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
