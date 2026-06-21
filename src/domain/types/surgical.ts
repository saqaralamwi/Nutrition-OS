export type SurgicalProcedure = 'elective' | 'emergency' | 'urgent';
export type ERASPhase = 'pre_op' | 'intra_op' | 'post_op' | 'recovery';
export type PainLevel = 'none' | 'mild' | 'moderate' | 'severe';
export type SurgicalNutritionStatus = 'well_nourished' | 'at_risk' | 'malnourished' | 'severely_malnourished';
export type WoundHealingStage = 'inflammatory' | 'proliferative' | 'remodeling';

export interface SurgicalAssessment {
  patientId: string;
  procedureType: SurgicalProcedure;
  erasPhase: ERASPhase;
  surgeryDate?: number;
  weightKg: number;
  heightCm: number;
  bmi: number;
  nutritionStatus: SurgicalNutritionStatus;
  painLevel: PainLevel;
  woundStage?: WoundHealingStage;
  comorbidities: string[];
  medications: string[];
  allergies: string[];
  albumin?: number;
  prealbumin?: number;
  crp?: number;
  notes?: string;
}

export interface SurgicalNutritionPlan {
  patientId: string;
  assessmentId?: string;
  totalCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fluidMl: number;
  proteinPerKg: number;
  caloriesPerKg: number;
  immunonutrition: boolean;
  immunonutritionDays?: number;
  oralSupplements?: string;
  enteralFormula?: string;
  parenteralNutrition: boolean;
  vitamins: string[];
  minerals: string[];
  recommendations: string[];
  contraindications: string[];
  createdBy?: string;
}

export interface SurgicalMonitoring {
  patientId: string;
  planId?: string;
  date: number;
  weightKg: number;
  weightChange24h?: number;
  calorieIntake: number;
  proteinIntake: number;
  fluidBalance?: number;
  woundHealing?: WoundHealingStage;
  painLevel: PainLevel;
  nausea?: boolean;
  vomiting?: boolean;
  bowelSounds?: boolean;
  flatus?: boolean;
  stool?: boolean;
  complications: string[];
  nutritionTolerance: 'good' | 'fair' | 'poor';
  notes?: string;
}
