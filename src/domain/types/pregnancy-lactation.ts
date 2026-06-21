export type PregnancyTrimester = 'first' | 'second' | 'third' | 'postpartum';

export type PregnancyComplication = 'none' | 'gestational_diabetes' | 'hypertension' | 'preeclampsia' | 'anemia' | 'multiple_pregnancy' | 'other';

export type LactationStatus = 'not_breastfeeding' | 'exclusively_breastfeeding' | 'mixed_feeding' | 'formula_only';

export type PregnancyWeightCategory = 'underweight' | 'normal' | 'overweight' | 'obese';

export interface PregnancyAssessment {
  id?: string;
  patientId: string;
  timestamp: string;
  trimester: PregnancyTrimester;
  gestationalAge: number;
  expectedDeliveryDate: string;
  isMultiplePregnancy: boolean;
  numberOfFetuses: number;
  prePregnancyWeight: number;
  prePregnancyBMI: number;
  prePregnancyWeightCategory: PregnancyWeightCategory;
  weight: number;
  height: number;
  currentBMI: number;
  weightGain: number;
  targetWeightGain: number;
  complications: PregnancyComplication[];
  hasGestationalDiabetes: boolean;
  hasHypertension: boolean;
  hasPreeclampsia: boolean;
  hasAnemia: boolean;
  hemoglobin: number;
  ferritin: number;
  folate: number;
  vitaminD: number;
  calcium: number;
  glucose: number;
  hbA1c: number | null;
  appetiteChanges: boolean;
  nauseaVomiting: boolean;
  foodAversions: string[];
  foodCravings: string[];
  pica: boolean;
  prenatalVitamins: boolean;
  folicAcid: boolean;
  iron: boolean;
  onVitaminD: boolean;
  omega3: boolean;
  iodine: boolean;
  calorieGoal: number;
  proteinGoal: number;
  calciumGoal: number;
  ironGoal: number;
  folateGoal: number;
  createdAt: string;
  updatedAt: string;
}

export interface LactationAssessment {
  id?: string;
  patientId: string;
  timestamp: string;
  lactationStatus: LactationStatus;
  infantAge: number;
  isExclusivelyBreastfeeding: boolean;
  milkSupplyAdequate: boolean;
  weight: number;
  height: number;
  bmi: number;
  weightLossSinceBirth: number;
  hemoglobin: number;
  vitaminD: number;
  calcium: number;
  iodine: number;
  calorieIntake: number;
  hydrationStatus: string;
  supplementsUsed: string[];
  calorieGoal: number;
  proteinGoal: number;
  calciumGoal: number;
  vitaminDGoal: number;
  iodineGoal: number;
  hydrationGoal: number;
  createdAt: string;
  updatedAt: string;
}

export interface PregnancyNutritionPlan {
  id?: string;
  patientId: string;
  assessmentId: string;
  totalCalories: number;
  proteinGrams: number;
  fatGrams: number;
  carbohydrateGrams: number;
  folateUg: number;
  ironMg: number;
  calciumMg: number;
  vitaminDIU: number;
  iodineUg: number;
  omega3Grams: number;
  cholineMg: number;
  foodsToIncrease: string[];
  foodsToAvoid: string[];
  mealsPerDay: number;
  snacksPerDay: number;
  supplements: { name: string; dose: string; frequency: string }[];
  nauseaManagement: string[];
  gestationalDiabetesManagement: string[];
  recommendations: string[];
  isActive: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface LactationNutritionPlan {
  id?: string;
  patientId: string;
  assessmentId: string;
  extraCalories: number;
  totalCalories: number;
  proteinGrams: number;
  fatGrams: number;
  carbohydrateGrams: number;
  calciumMg: number;
  vitaminDIU: number;
  iodineUg: number;
  omega3Grams: number;
  cholineMg: number;
  waterMl: number;
  caffeineLimit: boolean;
  avoidAlcohol: boolean;
  avoidHighMercuryFish: string[];
  supplements: { name: string; dose: string; frequency: string }[];
  recommendations: string[];
  isActive: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
