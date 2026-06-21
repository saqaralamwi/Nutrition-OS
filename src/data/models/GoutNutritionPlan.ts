import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';
import { GoutNutritionPlan as IGoutNutritionPlan } from '../../domain/types/gout';

export default class GoutNutritionPlan extends Model {
  static table = 'gout_nutrition_plans';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  @field('assessment_id') assessmentId!: string;

  // Uric acid targets
  @field('target_uric_acid') targetUricAcid!: number;
  @field('target_urinary_uric_acid') targetUrinaryUricAcid!: number;
  @field('max_purine_intake') maxPurineIntake!: number;
  @field('purine_intake_level') purineIntakeLevel!: string;

  // Macronutrient targets
  @field('target_calories') targetCalories!: number;
  @field('target_protein') targetProtein!: number;
  @field('target_carbs') targetCarbs!: number;
  @field('target_fat') targetFat!: number;
  @field('target_fiber') targetFiber!: number;

  // Supplementation
  @field('needs_vitamin_c') needsVitaminC!: boolean;
  @field('vitamin_c_dose') vitaminCDose!: number;
  @field('needs_coq10') needsCoq10!: boolean;
  @field('coq10_dose') coq10Dose!: number;
  @field('needs_fish_oil') needsFishOil!: boolean;
  @field('fish_oil_dose') fishOilDose!: number;

  // Food lists (JSON serialized strings)
  @field('allowed_foods') allowedFoods!: string;
  @field('limited_foods') limitedFoods!: string;
  @field('avoid_foods') avoidFoods!: string;
  @field('low_purine_proteins') lowPurineProteins!: string;
  @field('low_purine_vegetables') lowPurineVegetables!: string;
  @field('low_purine_fruits') lowPurineFruits!: string;
  @field('low_purine_grains') lowPurineGrains!: string;
  @field('high_purine_meats') highPurineMeats!: string;
  @field('high_purine_seafood') highPurineSeafood!: string;
  @field('high_purine_vegetables') highPurineVegetables!: string;
  @field('high_purine_legumes') highPurineLegumes!: string;

  // Alcohol recommendations
  @field('avoid_beer') avoidBeer!: boolean;
  @field('avoid_liquor') avoidLiquor!: boolean;
  @field('limit_wine') limitWine!: boolean;
  @field('max_alcohol_units') maxAlcoholUnits!: number;

  // Fluid recommendations
  @field('target_fluid') targetFluid!: number;
  @field('encourage_water') encourageWater!: boolean;
  @field('avoid_sugary_drinks') avoidSugaryDrinks!: boolean;
  @field('encourage_coffee') encourageCoffee!: boolean;
  @field('encourage_cherry') encourageCherry!: boolean;

  // Weight management
  @field('needs_weight_loss') needsWeightLoss!: boolean;
  @field('target_weight') targetWeight!: number;
  @field('weight_loss_rate') weightLossRate!: number;

  // Medication
  @field('on_urate_lowering_therapy') onUrateLoweringTherapy!: boolean;
  @field('medication_name') medicationName!: string;
  @field('medication_dose') medicationDose!: number;
  @field('medication_adherence') medicationAdherence!: boolean;

  // Monitoring
  @field('uric_acid_check_freq') uricAcidCheckFreq!: string;
  @field('target_flare_frequency') targetFlareFrequency!: number;
  @field('expected_improvement_months') expectedImprovementMonths!: number;

  @field('created_at') createdAt!: string;
  @field('updated_at') updatedAt!: string;

  toDomain(): IGoutNutritionPlan {
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
      targetUricAcid: this.targetUricAcid,
      targetUrinaryUricAcid: this.targetUrinaryUricAcid,
      maxPurineIntake: this.maxPurineIntake,
      purineIntakeLevel: this.purineIntakeLevel as IGoutNutritionPlan['purineIntakeLevel'],
      targetCalories: this.targetCalories,
      targetProtein: this.targetProtein,
      targetCarbs: this.targetCarbs,
      targetFat: this.targetFat,
      targetFiber: this.targetFiber,
      needsVitaminC: this.needsVitaminC,
      vitaminCDose: this.vitaminCDose,
      needsCoenzymeQ10: this.needsCoq10,
      coq10Dose: this.coq10Dose,
      needsFishOil: this.needsFishOil,
      fishOilDose: this.fishOilDose,
      allowedFoods: parseArray(this.allowedFoods),
      limitedFoods: parseArray(this.limitedFoods),
      avoidFoods: parseArray(this.avoidFoods),
      lowPurineProteins: parseArray(this.lowPurineProteins),
      lowPurineVegetables: parseArray(this.lowPurineVegetables),
      lowPurineFruits: parseArray(this.lowPurineFruits),
      lowPurineGrains: parseArray(this.lowPurineGrains),
      highPurineMeats: parseArray(this.highPurineMeats),
      highPurineSeafood: parseArray(this.highPurineSeafood),
      highPurineVegetables: parseArray(this.highPurineVegetables),
      highPurineLegumes: parseArray(this.highPurineLegumes),
      avoidBeer: this.avoidBeer,
      avoidLiquor: this.avoidLiquor,
      limitWine: this.limitWine,
      maxAlcoholUnits: this.maxAlcoholUnits,
      targetFluid: this.targetFluid,
      encourageWater: this.encourageWater,
      avoidSugaryDrinks: this.avoidSugaryDrinks,
      encourageCoffee: this.encourageCoffee,
      encourageCherry: this.encourageCherry,
      needsWeightLoss: this.needsWeightLoss,
      targetWeight: this.targetWeight,
      weightLossRate: this.weightLossRate,
      onUrateLoweringTherapy: this.onUrateLoweringTherapy,
      medicationName: this.medicationName,
      medicationDose: this.medicationDose,
      medicationAdherence: this.medicationAdherence,
      uricAcidCheckFrequency: this.uricAcidCheckFreq as IGoutNutritionPlan['uricAcidCheckFrequency'],
      targetFlareFrequency: this.targetFlareFrequency,
      expectedImprovementMonths: this.expectedImprovementMonths,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
