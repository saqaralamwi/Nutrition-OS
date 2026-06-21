import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';
import { GoutMonitoring as IGoutMonitoring } from '../../domain/types/gout';

export default class GoutMonitoring extends Model {
  static table = 'gout_monitoring';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  @field('plan_id') planId!: string;

  // Follow-up labs
  @field('follow_up_date') followUpDate!: string;
  @field('serum_uric_acid') serumUricAcid!: number;
  @field('urinary_uric_acid') urinaryUricAcid!: number;

  // Flare assessment
  @field('has_flare') hasFlare!: boolean;
  @field('flare_date') flareDate!: string;
  @field('flare_severity') flareSeverity!: string;
  @field('flare_duration') flareDuration!: number;
  @field('affected_joints') affectedJoints!: string;
  @field('pain_severity') painSeverity!: string;
  @field('has_swelling') hasSwelling!: boolean;

  // Tophi assessment
  @field('has_tophi') hasTophi!: boolean;
  @field('tophi_size') tophiSize!: number;

  // Weight status
  @field('weight') weight!: number;
  @field('weight_change') weightChange!: number;

  // Adherence
  @field('adherence_diet') adherenceDiet!: boolean;
  @field('adherence_medication') adherenceMedication!: boolean;
  @field('adherence_fluids') adherenceFluids!: boolean;

  // Side effects
  @field('has_medication_side_effects') hasMedicationSideEffects!: boolean;
  @field('side_effect_severity') sideEffectSeverity!: string;

  // Progress
  @field('is_improving') isImproving!: boolean;
  @field('uric_acid_change') uricAcidChange!: number;
  @field('flare_reduction') flareReduction!: number;
  @field('improvement_percentage') improvementPercentage!: number;
  @field('next_follow_up_date') nextFollowUpDate!: string;

  @field('created_at') createdAt!: string;
  @field('updated_at') updatedAt!: string;

  toDomain(): IGoutMonitoring {
    const parseArray = (val: string): string[] => {
      if (!val) return [];
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    };

    return {
      id: this.id,
      patientId: this.patientId,
      planId: this.planId,
      followUpDate: this.followUpDate,
      serumUricAcid: this.serumUricAcid,
      urinaryUricAcid: this.urinaryUricAcid,
      hasFlare: this.hasFlare,
      flareDate: this.flareDate,
      flareSeverity: this.flareSeverity as 'mild' | 'moderate' | 'severe',
      flareDuration: this.flareDuration,
      affectedJoints: parseArray(this.affectedJoints),
      painSeverity: this.painSeverity as 'none' | 'mild' | 'moderate' | 'severe',
      hasSwelling: this.hasSwelling,
      hasTophi: this.hasTophi,
      tophiSize: this.tophiSize,
      weight: this.weight,
      weightChange: this.weightChange,
      adherenceToDiet: this.adherenceDiet,
      adherenceToMedication: this.adherenceMedication,
      adherenceToFluids: this.adherenceFluids,
      hasMedicationSideEffects: this.hasMedicationSideEffects,
      sideEffectSeverity: this.sideEffectSeverity as 'none' | 'mild' | 'moderate' | 'severe',
      isImproving: this.isImproving,
      uricAcidChange: this.uricAcidChange,
      flareReduction: this.flareReduction,
      improvementPercentage: this.improvementPercentage,
      nextFollowUpDate: this.nextFollowUpDate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
