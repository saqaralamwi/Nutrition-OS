import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';
import { AnemiaMonitoring as IAnemiaMonitoring } from '../../domain/types/anemia';

export default class AnemiaMonitoring extends Model {
  static table = 'anemia_monitoring';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  @field('plan_id') planId!: string;

  // Follow-up labs
  @field('follow_up_date') followUpDate!: string;
  @field('hemoglobin') hemoglobin!: number;
  @field('ferritin') ferritin!: number;
  @field('serum_iron') serumIron!: number;
  @field('vitamin_b12') vitaminB12!: number;
  @field('serum_folate') serumFolate!: number;
  @field('mcv') mcv!: number;

  // Clinical status
  @field('fatigue_improvement') fatigueImprovement!: 'none' | 'mild' | 'moderate' | 'significant';
  @field('weakness_improvement') weaknessImprovement!: 'none' | 'mild' | 'moderate' | 'significant';
  @field('adherence_supplements') adherenceToSupplements!: boolean;
  @field('adherence_diet') adherenceToDiet!: boolean;

  // Side effects
  @field('has_gi_side_effects') hasGISideEffects!: boolean;
  @field('side_effect_severity') sideEffectSeverity!: 'none' | 'mild' | 'moderate' | 'severe';

  // Progress
  @field('is_improving') isImproving!: boolean;
  @field('recovery_percentage') recoveryPercentage!: number;
  @field('next_follow_up_date') nextFollowUpDate!: string;

  @field('created_at') createdAt!: string;
  @field('updated_at') updatedAt!: string;

  toDomain(): IAnemiaMonitoring {
    return {
      id: this.id,
      patientId: this.patientId,
      planId: this.planId,
      followUpDate: this.followUpDate,
      hemoglobin: this.hemoglobin,
      ferritin: this.ferritin,
      serumIron: this.serumIron,
      vitaminB12: this.vitaminB12,
      serumFolate: this.serumFolate,
      mcv: this.mcv,
      fatigueImprovement: this.fatigueImprovement,
      weaknessImprovement: this.weaknessImprovement,
      adherenceToSupplements: this.adherenceToSupplements,
      adherenceToDiet: this.adherenceToDiet,
      hasGISideEffects: this.hasGISideEffects,
      sideEffectSeverity: this.sideEffectSeverity,
      isImproving: this.isImproving,
      recoveryPercentage: this.recoveryPercentage,
      nextFollowUpDate: this.nextFollowUpDate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
