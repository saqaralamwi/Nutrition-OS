import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';
import ClinicalGuideline from './ClinicalGuideline';

export default class ClinicalRecommendation extends Model {
  static table = 'clinical_recommendations';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
    clinical_guidelines: { type: 'belongs_to' as const, key: 'guideline_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('condition') condition?: string;
  @field('condition_ar') conditionAr?: string;
  @field('recommendation_type') recommendationType!: string;
  @field('recommendation_type_ar') recommendationTypeAr?: string;
  @field('title') title!: string;
  @field('title_ar') titleAr?: string;
  @field('description') description!: string;
  @field('description_ar') descriptionAr?: string;
  @field('message') message?: string;
  @field('message_ar') messageAr?: string;
  @field('details') details?: string;
  @field('details_ar') detailsAr?: string;
  @field('benefit') benefit?: string;
  @field('benefit_ar') benefitAr?: string;
  @field('evidence') evidence?: string;
  @field('evidence_ar') evidenceAr?: string;
  @field('evidence_level') evidenceLevel?: string;
  @field('evidence_level_ar') evidenceLevelAr?: string;
  @field('food_recommendations') foodRecommendations?: string;
  @field('food_recommendations_ar') foodRecommendationsAr?: string;
  @field('food_avoid') foodAvoid?: string;
  @field('food_avoid_ar') foodAvoidAr?: string;
  @field('supplement_name') supplementName?: string;
  @field('supplement_name_ar') supplementNameAr?: string;
  @field('dose') dose?: string;
  @field('monitoring_param') monitoringParam?: string;
  @field('monitoring_param_ar') monitoringParamAr?: string;
  @field('target_value') targetValue?: string;
  @field('frequency') frequency?: string;
  @field('frequency_ar') frequencyAr?: string;
  @field('lifestyle_tip') lifestyleTip?: string;
  @field('lifestyle_tip_ar') lifestyleTipAr?: string;
  @field('exercise_recommendation') exerciseRecommendation?: string;
  @field('exercise_recommendation_ar') exerciseRecommendationAr?: string;
  @field('source') source?: string;
  @field('guideline') guideline?: string;
  @field('guideline_ar') guidelineAr?: string;
  @field('url') url?: string;
  @field('patient_id') patientId?: string;
  @relation('clinical_guidelines', 'guideline_id') guidelineRel?: ClinicalGuideline;
  @field('guideline_id') guidelineId?: string;
  @field('status') status!: string;
  @date('accepted_at') acceptedAt?: Date;
  @field('rejected_reason') rejectedReason?: string;
  @field('is_active') isActive?: boolean;
  @field('priority') priority!: string;
  @field('priority_ar') priorityAr?: string;
  @field('created_by') createdBy?: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
