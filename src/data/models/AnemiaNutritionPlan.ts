import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';
import { AnemiaNutritionPlan as IAnemiaNutritionPlan } from '../../domain/types/anemia';

export default class AnemiaNutritionPlan extends Model {
  static table = 'anemia_nutrition_plans';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  @field('assessment_id') assessmentId!: string;

  // Nutrient targets
  @field('target_iron') targetIron!: number;
  @field('target_b12') targetB12!: number;
  @field('target_folate') targetFolate!: number;
  @field('target_protein') targetProtein!: number;
  @field('target_vitamin_c') targetVitaminC!: number;
  @field('target_zinc') targetZinc!: number;

  // Supplementation
  @field('needs_iron_supplement') needsIronSupplement!: boolean;
  @field('iron_supplement_type') ironSupplementType!: 'ferrous_sulfate' | 'ferrous_fumarate' | 'ferrous_glucosate' | 'heme_iron';
  @field('iron_supplement_dose') ironSupplementDose!: number;
  @field('iron_supplement_duration') ironSupplementDuration!: number;

  @field('needs_b12_supplement') needsB12Supplement!: boolean;
  @field('b12_supplement_type') b12SupplementType!: 'oral' | 'sublingual' | 'intranasal' | 'intramuscular';
  @field('b12_supplement_dose') b12SupplementDose!: number;

  @field('needs_folate_supplement') needsFolateSupplement!: boolean;
  @field('folate_supplement_dose') folateSupplementDose!: number;

  // Dietary recommendations (JSON serialized strings)
  @field('iron_rich_foods') ironRichFoods!: string;
  @field('b12_rich_foods') b12RichFoods!: string;
  @field('folate_rich_foods') folateRichFoods!: string;
  @field('vitamin_c_rich_foods') vitaminCRichFoods!: string;

  // Avoid/inhibitors (JSON serialized strings)
  @field('avoid_with_iron') avoidWithIron!: string;
  @field('avoid_timing') avoidTiming!: string;

  // Monitoring
  @field('hemoglobin_check_freq') hemoglobinCheckFrequency!: 'weekly' | 'biweekly' | 'monthly';
  @field('target_hemoglobin') targetHemoglobin!: number;
  @field('expected_recovery_weeks') expectedRecoveryWeeks!: number;

  @field('created_at') createdAt!: string;
  @field('updated_at') updatedAt!: string;

  toDomain(): IAnemiaNutritionPlan {
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
      targetIron: this.targetIron,
      targetB12: this.targetB12,
      targetFolate: this.targetFolate,
      targetProtein: this.targetProtein,
      targetVitaminC: this.targetVitaminC,
      targetZinc: this.targetZinc,
      needsIronSupplement: this.needsIronSupplement,
      ironSupplementType: this.ironSupplementType,
      ironSupplementDose: this.ironSupplementDose,
      ironSupplementDuration: this.ironSupplementDuration,
      needsB12Supplement: this.needsB12Supplement,
      b12SupplementType: this.b12SupplementType,
      b12SupplementDose: this.b12SupplementDose,
      needsFolateSupplement: this.needsFolateSupplement,
      folateSupplementDose: this.folateSupplementDose,
      ironRichFoods: parseArray(this.ironRichFoods),
      b12RichFoods: parseArray(this.b12RichFoods),
      folateRichFoods: parseArray(this.folateRichFoods),
      vitaminCRichFoods: parseArray(this.vitaminCRichFoods),
      avoidWithIron: parseArray(this.avoidWithIron),
      avoidTiming: this.avoidTiming,
      hemoglobinCheckFrequency: this.hemoglobinCheckFrequency,
      targetHemoglobin: this.targetHemoglobin,
      expectedRecoveryWeeks: this.expectedRecoveryWeeks,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
