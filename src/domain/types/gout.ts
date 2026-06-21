export type GoutSeverity =
  | 'none'
  | 'mild'
  | 'moderate'
  | 'severe'
  | 'chronic_tophaceous';

export type GoutStage =
  | 'hyperuricemia'
  | 'acute_flare'
  | 'intercritical'
  | 'chronic_tophaceous';

export type UricAcidStatus =
  | 'normal'
  | 'elevated'
  | 'high'
  | 'very_high';

export type PurineIntakeLevel =
  | 'very_low'
  | 'low'
  | 'moderate'
  | 'high'
  | 'very_high';

export interface GoutAssessment {
  id?: string;
  patientId: string;
  serumUricAcid: number;
  uricAcidUnit: 'mg/dL' | 'µmol/L';
  uricAcidStatus: UricAcidStatus;
  urinaryUricAcid: number;
  severity: GoutSeverity;
  stage: GoutStage;
  flareFrequency: number;
  lastFlareDate: string;
  averageFlareDuration: number;
  hasChronicPain: boolean;
  affectedJoints: string[];
  hasTophi: boolean;
  tophiLocation: string[];
  age: number;
  gender: 'male' | 'female';
  weight: number;
  height: number;
  bmi: number;
  hasObesity: boolean;
  hasMetabolicSyndrome: boolean;
  hasDiabetes: boolean;
  hasCKD: boolean;
  hasHTN: boolean;
  hasDyslipidemia: boolean;
  hasSmoking: boolean;
  hasAlcoholUse: boolean;
  alcoholType: 'beer' | 'wine' | 'liquor' | 'mixed';
  alcoholUnitsPerWeek: number;
  hasDiuretics: boolean;
  hasAspirin: boolean;
  hasNiacin: boolean;
  hasCyclosporine: boolean;
  hasLevodopa: boolean;
  dietaryPattern: 'regular' | 'vegetarian' | 'vegan' | 'restricted';
  avgPurineIntake: number;
  purineIntakeLevel: PurineIntakeLevel;
  meatConsumption: number;
  seafoodConsumption: number;
  dairyConsumption: number;
  vegetableConsumption: number;
  fruitConsumption: number;
  hasHighPurineFoods: boolean;
  highPurineFoodsConsumed: string[];
  hasAcutePain: boolean;
  painSeverity: 'mild' | 'moderate' | 'severe';
  hasSwelling: boolean;
  hasRedness: boolean;
  hasWarmth: boolean;
  hasLimitedMobility: boolean;
  hasKidneyStones: boolean;
  hasJointDamage: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GoutNutritionPlan {
  id?: string;
  patientId: string;
  assessmentId: string;
  targetUricAcid: number;
  targetUrinaryUricAcid: number;
  maxPurineIntake: number;
  purineIntakeLevel: PurineIntakeLevel;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  targetFiber: number;
  needsVitaminC: boolean;
  vitaminCDose: number;
  needsCoenzymeQ10: boolean;
  coq10Dose: number;
  needsFishOil: boolean;
  fishOilDose: number;
  allowedFoods: string[];
  limitedFoods: string[];
  avoidFoods: string[];
  lowPurineProteins: string[];
  lowPurineVegetables: string[];
  lowPurineFruits: string[];
  lowPurineGrains: string[];
  highPurineMeats: string[];
  highPurineSeafood: string[];
  highPurineVegetables: string[];
  highPurineLegumes: string[];
  avoidBeer: boolean;
  avoidLiquor: boolean;
  limitWine: boolean;
  maxAlcoholUnits: number;
  targetFluid: number;
  encourageWater: boolean;
  avoidSugaryDrinks: boolean;
  encourageCoffee: boolean;
  encourageCherry: boolean;
  needsWeightLoss: boolean;
  targetWeight: number;
  weightLossRate: number;
  onUrateLoweringTherapy: boolean;
  medicationName: string;
  medicationDose: number;
  medicationAdherence: boolean;
  uricAcidCheckFrequency: 'monthly' | 'bimonthly' | 'quarterly';
  targetFlareFrequency: number;
  expectedImprovementMonths: number;
  createdAt: string;
  updatedAt: string;
}

export interface GoutMonitoring {
  id?: string;
  patientId: string;
  planId: string;
  followUpDate: string;
  serumUricAcid: number;
  urinaryUricAcid: number;
  hasFlare: boolean;
  flareDate: string;
  flareSeverity: 'mild' | 'moderate' | 'severe';
  flareDuration: number;
  affectedJoints: string[];
  painSeverity: 'none' | 'mild' | 'moderate' | 'severe';
  hasSwelling: boolean;
  hasTophi: boolean;
  tophiSize: number;
  weight: number;
  weightChange: number;
  adherenceToDiet: boolean;
  adherenceToMedication: boolean;
  adherenceToFluids: boolean;
  hasMedicationSideEffects: boolean;
  sideEffectSeverity: 'none' | 'mild' | 'moderate' | 'severe';
  isImproving: boolean;
  uricAcidChange: number;
  flareReduction: number;
  improvementPercentage: number;
  nextFollowUpDate: string;
  createdAt: string;
  updatedAt: string;
}
