import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';
import { OsteoporosisNutritionPlan as IOsteoporosisNutritionPlan } from '../../domain/types/osteoporosis';

export default class OsteoporosisNutritionPlan extends Model {
  static table = 'osteoporosis_nutrition_plans';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  @field('assessment_id') assessmentId!: string;

  // Nutrient targets
  @field('target_calcium') targetCalcium!: number;
  @field('target_vitamin_d') targetVitaminD!: number;
  @field('target_protein') targetProtein!: number;
  @field('target_vitamin_k') targetVitaminK!: number;
  @field('target_magnesium') targetMagnesium!: number;
  @field('target_zinc') targetZinc!: number;
  @field('target_phosphorus') targetPhosphorus!: number;
  @field('target_potassium') targetPotassium!: number;

  // Supplementation
  @field('needs_calcium_supplement') needsCalciumSupplement!: boolean;
  @field('calcium_supplement_type') calciumSupplementType!: 'calcium_carbonate' | 'calcium_citrate' | 'calcium_lactate';
  @field('calcium_supplement_dose') calciumSupplementDose!: number;
  @field('calcium_supplement_timing') calciumSupplementTiming!: 'with_meals' | 'between_meals' | 'night';

  @field('needs_vitamin_d_supplement') needsVitaminDSupplement!: boolean;
  @field('vitamin_d_supplement_type') vitaminDSupplementType!: 'd2' | 'd3';
  @field('vitamin_d_supplement_dose') vitaminDSupplementDose!: number;

  @field('needs_vitamin_k_supplement') needsVitaminKSupplement!: boolean;
  @field('vitamin_k_supplement_dose') vitaminKSupplementDose!: number;

  @field('needs_magnesium_supplement') needsMagnesiumSupplement!: boolean;
  @field('magnesium_supplement_dose') magnesiumSupplementDose!: number;

  // Exercise recommendations
  @field('weight_bearing_exercise') weightBearingExercise!: boolean;
  @field('resistance_training') resistanceTraining!: boolean;
  @field('balance_exercise') balanceExercise!: boolean;
  @field('exercise_frequency') exerciseFrequency!: number;
  @field('exercise_duration') exerciseDuration!: number;

  // Fall prevention
  @field('home_safety_review') homeSafetyReview!: boolean;
  @field('vision_check') visionCheck!: boolean;
  @field('footwear_assessment') footwearAssessment!: boolean;
  @field('assistive_device') assistiveDevice!: boolean;

  // Dietary recommendations (JSON serialized strings)
  @field('calcium_rich_foods') calciumRichFoods!: string;
  @field('vitamin_d_rich_foods') vitaminDRichFoods!: string;
  @field('protein_rich_foods') proteinRichFoods!: string;
  @field('vitamin_k_rich_foods') vitaminKRichFoods!: string;

  // Avoid/restrictions
  @field('avoid_excess_sodium') avoidExcessSodium!: boolean;
  @field('avoid_excess_protein') avoidExcessProtein!: boolean;
  @field('avoid_smoking') avoidSmoking!: boolean;
  @field('avoid_excess_alcohol') avoidExcessAlcohol!: boolean;
  @field('avoid_caffeine_excess') avoidCaffeineExcess!: boolean;

  // Monitoring
  @field('bone_density_check_freq') boneDensityCheckFrequency!: 'annual' | 'biennial';
  @field('target_bone_density') targetBoneDensity!: number;
  @field('expected_improvement_months') expectedImprovementMonths!: number;

  @field('created_at') createdAt!: string;
  @field('updated_at') updatedAt!: string;

  toDomain(): IOsteoporosisNutritionPlan {
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
      assessmentId: this.assessmentId,
      targetCalcium: this.targetCalcium,
      targetVitaminD: this.targetVitaminD,
      targetProtein: this.targetProtein,
      targetVitaminK: this.targetVitaminK,
      targetMagnesium: this.targetMagnesium,
      targetZinc: this.targetZinc,
      targetPhosphorus: this.targetPhosphorus,
      targetPotassium: this.targetPotassium,
      needsCalciumSupplement: this.needsCalciumSupplement,
      calciumSupplementType: this.calciumSupplementType,
      calciumSupplementDose: this.calciumSupplementDose,
      calciumSupplementTiming: this.calciumSupplementTiming,
      needsVitaminDSupplement: this.needsVitaminDSupplement,
      vitaminDSupplementType: this.vitaminDSupplementType,
      vitaminDSupplementDose: this.vitaminDSupplementDose,
      needsVitaminKSupplement: this.needsVitaminKSupplement,
      vitaminKSupplementDose: this.vitaminKSupplementDose,
      needsMagnesiumSupplement: this.needsMagnesiumSupplement,
      magnesiumSupplementDose: this.magnesiumSupplementDose,
      weightBearingExercise: this.weightBearingExercise,
      resistanceTraining: this.resistanceTraining,
      balanceExercise: this.balanceExercise,
      exerciseFrequency: this.exerciseFrequency,
      exerciseDuration: this.exerciseDuration,
      homeSafetyReview: this.homeSafetyReview,
      visionCheck: this.visionCheck,
      footwearAssessment: this.footwearAssessment,
      assistiveDevice: this.assistiveDevice,
      calciumRichFoods: parseArray(this.calciumRichFoods),
      vitaminDRichFoods: parseArray(this.vitaminDRichFoods),
      proteinRichFoods: parseArray(this.proteinRichFoods),
      vitaminKRichFoods: parseArray(this.vitaminKRichFoods),
      avoidExcessSodium: this.avoidExcessSodium,
      avoidExcessProtein: this.avoidExcessProtein,
      avoidSmoking: this.avoidSmoking,
      avoidExcessAlcohol: this.avoidExcessAlcohol,
      avoidCaffeineExcess: this.avoidCaffeineExcess,
      boneDensityCheckFrequency: this.boneDensityCheckFrequency,
      targetBoneDensity: this.targetBoneDensity,
      expectedImprovementMonths: this.expectedImprovementMonths,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
