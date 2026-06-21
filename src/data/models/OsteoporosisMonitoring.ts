import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';
import { OsteoporosisMonitoring as IOsteoporosisMonitoring } from '../../domain/types/osteoporosis';

export default class OsteoporosisMonitoring extends Model {
  static table = 'osteoporosis_monitoring';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  @field('plan_id') planId!: string;

  // Follow-up
  @field('follow_up_date') followUpDate!: string;

  // Bone density
  @field('femoral_neck_t_score') femoralNeckTScore!: number;
  @field('lumbar_spine_t_score') lumbarSpineTScore!: number;
  @field('overall_t_score') overallTScore!: number;

  // Anthropometrics
  @field('weight') weight!: number;
  @field('height') height!: number;
  @field('bmi') bmi!: number;

  // Follow-up labs
  @field('vitamin_d25oh') vitaminD25OH!: number;
  @field('serum_calcium') serumCalcium!: number;

  // Clinical status
  @field('has_new_fracture') hasNewFracture!: boolean;
  @field('fracture_type') fractureType!: 'hip' | 'vertebral' | 'other' | null;
  @field('back_pain_improvement') backPainImprovement!: 'none' | 'mild' | 'moderate' | 'significant';
  @field('physical_activity_improvement') physicalActivityImprovement!: 'none' | 'mild' | 'moderate' | 'significant';

  // Adherence
  @field('adherence_supplements') adherenceToSupplements!: boolean;
  @field('adherence_exercise') adherenceToExercise!: boolean;
  @field('adherence_diet') adherenceToDiet!: boolean;

  // Progress
  @field('is_improving') isImproving!: boolean;
  @field('bone_density_change') boneDensityChange!: number;
  @field('improvement_percentage') improvementPercentage!: number;
  @field('next_follow_up_date') nextFollowUpDate!: string;

  @field('created_at') createdAt!: string;
  @field('updated_at') updatedAt!: string;

  toDomain(): IOsteoporosisMonitoring {
    return {
      id: this.id,
      patientId: this.patientId,
      planId: this.planId,
      followUpDate: this.followUpDate,
      femoralNeckTScore: this.femoralNeckTScore,
      lumbarSpineTScore: this.lumbarSpineTScore,
      overallTScore: this.overallTScore,
      weight: this.weight,
      height: this.height,
      bmi: this.bmi,
      vitaminD25OH: this.vitaminD25OH,
      serumCalcium: this.serumCalcium,
      hasNewFracture: this.hasNewFracture,
      fractureType: this.fractureType,
      backPainImprovement: this.backPainImprovement,
      physicalActivityImprovement: this.physicalActivityImprovement,
      adherenceToSupplements: this.adherenceToSupplements,
      adherenceToExercise: this.adherenceToExercise,
      adherenceToDiet: this.adherenceToDiet,
      isImproving: this.isImproving,
      boneDensityChange: this.boneDensityChange,
      improvementPercentage: this.improvementPercentage,
      nextFollowUpDate: this.nextFollowUpDate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
