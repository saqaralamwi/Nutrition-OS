import { Model } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';
import type { IGastroSurgeryAssessment } from '../../data/types/gastro_oncology';

export default class GastroSurgeryAssessment extends Model {
  static table = 'gastro_surgery_assessments';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  @field('cancer_site_type') cancerSiteType!: string;
  @field('oncology_cachexia_stage') oncologyCachexiaStage!: string;
  @field('unintentional_weight_loss_percent') unintentionalWeightLossPercent!: number;
  @field('bariatric_surgery_type') bariatricSurgeryType!: string;
  @field('post_op_day_milestone') postOpDayMilestone!: number;
  @field('has_dumping_syndrome_symptoms') hasDumpingSyndromeSymptoms!: boolean;
  @field('stoma_or_fistula_output_ml_24h') stomaOrFistulaOutputMl24h!: number;
  @date('recorded_at') recordedAt!: Date;

  toDomain(): IGastroSurgeryAssessment {
    return {
      patientId: this.patientId,
      cancerSiteType: this.cancerSiteType as IGastroSurgeryAssessment['cancerSiteType'],
      oncologyCachexiaStage: this.oncologyCachexiaStage as IGastroSurgeryAssessment['oncologyCachexiaStage'],
      unintentionalWeightLossPercent: this.unintentionalWeightLossPercent,
      bariatricSurgeryType: this.bariatricSurgeryType as IGastroSurgeryAssessment['bariatricSurgeryType'],
      postOpDayMilestone: this.postOpDayMilestone,
      hasDumpingSyndromeSymptoms: this.hasDumpingSyndromeSymptoms,
      stomaOrFistulaOutputMl24h: this.stomaOrFistulaOutputMl24h,
      recordedAt: this.recordedAt?.getTime() ?? Date.now(),
    };
  }
}
