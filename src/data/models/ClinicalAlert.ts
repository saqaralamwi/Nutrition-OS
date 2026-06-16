import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';

export default class ClinicalAlert extends Model {
  static table = 'clinical_alerts';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('condition') condition?: string;
  @field('condition_ar') conditionAr?: string;
  @field('medication') medication?: string;
  @field('medication_ar') medicationAr?: string;
  @field('alert_type') alertType!: string;
  @field('alert_type_ar') alertTypeAr?: string;
  @field('reason') reason?: string;
  @field('reason_ar') reasonAr?: string;
  @field('mechanism') mechanism?: string;
  @field('mechanism_ar') mechanismAr?: string;
  @field('title') title!: string;
  @field('title_ar') titleAr?: string;
  @field('message') message!: string;
  @field('message_ar') messageAr?: string;
  @field('severity') severity!: string;
  @field('severity_ar') severityAr?: string;
  @field('food_contraindication') foodContraindication?: string;
  @field('food_contraindication_ar') foodContraindicationAr?: string;
  @field('food_recommendation') foodRecommendation?: string;
  @field('food_recommendation_ar') foodRecommendationAr?: string;
  @field('action') action?: string;
  @field('action_ar') actionAr?: string;
  @field('alternative') alternative?: string;
  @field('alternative_ar') alternativeAr?: string;
  @field('recommendation') recommendation?: string;
  @field('guideline') guideline?: string;
  @field('guideline_ar') guidelineAr?: string;
  @field('url') url?: string;
  @field('patient_id') patientId?: string;
  @field('is_read') isRead!: boolean;
  @field('is_dismissed') isDismissed!: boolean;
  @field('triggered_by') triggeredBy?: string;
  @field('trigger_value') triggerValue?: string;
  @field('is_active') isActive?: boolean;
  @field('created_by') createdBy?: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
