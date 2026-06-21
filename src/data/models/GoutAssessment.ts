import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';
import { GoutAssessment as IGoutAssessment, GoutSeverity, GoutStage, UricAcidStatus, PurineIntakeLevel } from '../../domain/types/gout';

export default class GoutAssessment extends Model {
  static table = 'gout_assessments';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;

  // Serum uric acid
  @field('serum_uric_acid') serumUricAcid!: number;
  @field('uric_acid_unit') uricAcidUnit!: string;
  @field('uric_acid_status') uricAcidStatus!: string;
  @field('urinary_uric_acid') urinaryUricAcid!: number;

  // Gout classification
  @field('severity') severity!: string;
  @field('stage') stage!: string;

  // Flare history
  @field('flare_frequency') flareFrequency!: number;
  @field('last_flare_date') lastFlareDate!: string;
  @field('average_flare_duration') averageFlareDuration!: number;
  @field('has_chronic_pain') hasChronicPain!: boolean;
  @field('affected_joints') affectedJoints!: string;
  @field('has_tophi') hasTophi!: boolean;
  @field('tophi_location') tophiLocation!: string;

  // Demographics
  @field('age') age!: number;
  @field('gender') gender!: string;
  @field('weight') weight!: number;
  @field('height') height!: number;
  @field('bmi') bmi!: number;

  // Comorbidities
  @field('has_obesity') hasObesity!: boolean;
  @field('has_metabolic_syndrome') hasMetabolicSyndrome!: boolean;
  @field('has_diabetes') hasDiabetes!: boolean;
  @field('has_ckd') hasCKD!: boolean;
  @field('has_htn') hasHTN!: boolean;
  @field('has_dyslipidemia') hasDyslipidemia!: boolean;

  // Lifestyle
  @field('has_smoking') hasSmoking!: boolean;
  @field('has_alcohol_use') hasAlcoholUse!: boolean;
  @field('alcohol_type') alcoholType!: string;
  @field('alcohol_units_per_week') alcoholUnitsPerWeek!: number;

  // Medications
  @field('has_diuretics') hasDiuretics!: boolean;
  @field('has_aspirin') hasAspirin!: boolean;
  @field('has_niacin') hasNiacin!: boolean;
  @field('has_cyclosporine') hasCyclosporine!: boolean;
  @field('has_levodopa') hasLevodopa!: boolean;

  // Dietary assessment
  @field('dietary_pattern') dietaryPattern!: string;
  @field('avg_purine_intake') avgPurineIntake!: number;
  @field('purine_intake_level') purineIntakeLevel!: string;
  @field('meat_consumption') meatConsumption!: number;
  @field('seafood_consumption') seafoodConsumption!: number;
  @field('dairy_consumption') dairyConsumption!: number;
  @field('vegetable_consumption') vegetableConsumption!: number;
  @field('fruit_consumption') fruitConsumption!: number;
  @field('has_high_purine_foods') hasHighPurineFoods!: boolean;
  @field('high_purine_foods_consumed') highPurineFoodsConsumed!: string;

  // Acute symptoms
  @field('has_acute_pain') hasAcutePain!: boolean;
  @field('pain_severity') painSeverity!: string;
  @field('has_swelling') hasSwelling!: boolean;
  @field('has_redness') hasRedness!: boolean;
  @field('has_warmth') hasWarmth!: boolean;
  @field('has_limited_mobility') hasLimitedMobility!: boolean;

  // Complications
  @field('has_kidney_stones') hasKidneyStones!: boolean;
  @field('has_joint_damage') hasJointDamage!: boolean;

  @field('created_at') createdAt!: string;
  @field('updated_at') updatedAt!: string;

  toDomain(): IGoutAssessment {
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
      serumUricAcid: this.serumUricAcid,
      uricAcidUnit: this.uricAcidUnit as 'mg/dL' | 'µmol/L',
      uricAcidStatus: this.uricAcidStatus as UricAcidStatus,
      urinaryUricAcid: this.urinaryUricAcid,
      severity: this.severity as GoutSeverity,
      stage: this.stage as GoutStage,
      flareFrequency: this.flareFrequency,
      lastFlareDate: this.lastFlareDate,
      averageFlareDuration: this.averageFlareDuration,
      hasChronicPain: this.hasChronicPain,
      affectedJoints: parseArray(this.affectedJoints),
      hasTophi: this.hasTophi,
      tophiLocation: parseArray(this.tophiLocation),
      age: this.age,
      gender: this.gender as 'male' | 'female',
      weight: this.weight,
      height: this.height,
      bmi: this.bmi,
      hasObesity: this.hasObesity,
      hasMetabolicSyndrome: this.hasMetabolicSyndrome,
      hasDiabetes: this.hasDiabetes,
      hasCKD: this.hasCKD,
      hasHTN: this.hasHTN,
      hasDyslipidemia: this.hasDyslipidemia,
      hasSmoking: this.hasSmoking,
      hasAlcoholUse: this.hasAlcoholUse,
      alcoholType: this.alcoholType as 'beer' | 'wine' | 'liquor' | 'mixed',
      alcoholUnitsPerWeek: this.alcoholUnitsPerWeek,
      hasDiuretics: this.hasDiuretics,
      hasAspirin: this.hasAspirin,
      hasNiacin: this.hasNiacin,
      hasCyclosporine: this.hasCyclosporine,
      hasLevodopa: this.hasLevodopa,
      dietaryPattern: this.dietaryPattern as 'regular' | 'vegetarian' | 'vegan' | 'restricted',
      avgPurineIntake: this.avgPurineIntake,
      purineIntakeLevel: this.purineIntakeLevel as PurineIntakeLevel,
      meatConsumption: this.meatConsumption,
      seafoodConsumption: this.seafoodConsumption,
      dairyConsumption: this.dairyConsumption,
      vegetableConsumption: this.vegetableConsumption,
      fruitConsumption: this.fruitConsumption,
      hasHighPurineFoods: this.hasHighPurineFoods,
      highPurineFoodsConsumed: parseArray(this.highPurineFoodsConsumed),
      hasAcutePain: this.hasAcutePain,
      painSeverity: this.painSeverity as 'mild' | 'moderate' | 'severe',
      hasSwelling: this.hasSwelling,
      hasRedness: this.hasRedness,
      hasWarmth: this.hasWarmth,
      hasLimitedMobility: this.hasLimitedMobility,
      hasKidneyStones: this.hasKidneyStones,
      hasJointDamage: this.hasJointDamage,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
