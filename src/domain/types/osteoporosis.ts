export type BoneDensityClassification =
  | 'normal'
  | 'low_bone_mass'
  | 'osteoporosis'
  | 'severe_osteoporosis';

export type FractureRiskLevel =
  | 'low'
  | 'moderate'
  | 'high'
  | 'very_high';

export type CalciumStatus =
  | 'adequate'
  | 'insufficient'
  | 'deficient';

export type VitaminDStatus =
  | 'normal'
  | 'insufficient'
  | 'deficient'
  | 'severely_deficient';

export interface OsteoporosisAssessment {
  id?: string;
  patientId: string;
  femoralNeckTScore: number;
  lumbarSpineTScore: number;
  overallTScore: number;
  femoralNeckZScore: number;
  lumbarZScore: number;
  overallZScore: number;
  boneDensityUnit: 'g/cm²';
  classification: BoneDensityClassification;
  fractureRisk: FractureRiskLevel;
  serumCalcium: number;
  calciumIntake: number;
  calciumStatus: CalciumStatus;
  vitaminD25OH: number;
  vitaminDStatus: VitaminDStatus;
  serumPhosphorus: number;
  serumMagnesium: number;
  serumPTH: number;
  urinaryCalcium: number;
  p1NP: number;
  dPyrid: number;
  age: number;
  gender: 'male' | 'female';
  weight: number;
  height: number;
  bmi: number;
  hasFamilyHistory: boolean;
  hasEarlyMenopause: boolean;
  isPostmenopausal: boolean;
  yearsPostMenopause: number;
  hasSmoking: boolean;
  smokingCigarettesPerDay: number;
  hasAlcoholUse: boolean;
  alcoholUnitsPerWeek: number;
  hasLowPhysicalActivity: boolean;
  hasFallHistory: boolean;
  hasHipFracture: boolean;
  hasVertebralFracture: boolean;
  hasOtherFracture: boolean;
  hasGlucocorticoids: boolean;
  glucocorticoidDose: number;
  glucocorticoidDuration: number;
  hasThyroidMedication: boolean;
  hasAnticoagulants: boolean;
  hasAromataseInhibitors: boolean;
  hasProtonInhibitors: boolean;
  hasHyperthyroidism: boolean;
  hasHyperparathyroidism: boolean;
  hasCKD: boolean;
  hasGIDisease: boolean;
  hasRheumatoidArthritis: boolean;
  hasDiabetes: boolean;
  dietaryPattern: 'regular' | 'vegetarian' | 'vegan' | 'restricted';
  dairyConsumption: number;
  isVegetarian: boolean;
  isVegan: boolean;
  hasBackPain: boolean;
  hasLostHeight: boolean;
  heightLost: number;
  hasKyphosis: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OsteoporosisNutritionPlan {
  id?: string;
  patientId: string;
  assessmentId: string;
  targetCalcium: number;
  targetVitaminD: number;
  targetProtein: number;
  targetVitaminK: number;
  targetMagnesium: number;
  targetZinc: number;
  targetPhosphorus: number;
  targetPotassium: number;
  needsCalciumSupplement: boolean;
  calciumSupplementType: 'calcium_carbonate' | 'calcium_citrate' | 'calcium_lactate';
  calciumSupplementDose: number;
  calciumSupplementTiming: 'with_meals' | 'between_meals' | 'night';
  needsVitaminDSupplement: boolean;
  vitaminDSupplementType: 'd2' | 'd3';
  vitaminDSupplementDose: number;
  needsVitaminKSupplement: boolean;
  vitaminKSupplementDose: number;
  needsMagnesiumSupplement: boolean;
  magnesiumSupplementDose: number;
  weightBearingExercise: boolean;
  resistanceTraining: boolean;
  balanceExercise: boolean;
  exerciseFrequency: number;
  exerciseDuration: number;
  homeSafetyReview: boolean;
  visionCheck: boolean;
  footwearAssessment: boolean;
  assistiveDevice: boolean;
  calciumRichFoods: string[];
  vitaminDRichFoods: string[];
  proteinRichFoods: string[];
  vitaminKRichFoods: string[];
  avoidExcessSodium: boolean;
  avoidExcessProtein: boolean;
  avoidSmoking: boolean;
  avoidExcessAlcohol: boolean;
  avoidCaffeineExcess: boolean;
  boneDensityCheckFrequency: 'annual' | 'biennial';
  targetBoneDensity: number;
  expectedImprovementMonths: number;
  createdAt: string;
  updatedAt: string;
}

export interface OsteoporosisMonitoring {
  id?: string;
  patientId: string;
  planId: string;
  followUpDate: string;
  femoralNeckTScore: number;
  lumbarSpineTScore: number;
  overallTScore: number;
  weight: number;
  height: number;
  bmi: number;
  vitaminD25OH: number;
  serumCalcium: number;
  hasNewFracture: boolean;
  fractureType: 'hip' | 'vertebral' | 'other' | null;
  backPainImprovement: 'none' | 'mild' | 'moderate' | 'significant';
  physicalActivityImprovement: 'none' | 'mild' | 'moderate' | 'significant';
  adherenceToSupplements: boolean;
  adherenceToExercise: boolean;
  adherenceToDiet: boolean;
  isImproving: boolean;
  boneDensityChange: number;
  improvementPercentage: number;
  nextFollowUpDate: string;
  createdAt: string;
  updatedAt: string;
}
