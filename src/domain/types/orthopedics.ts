export type OrthopedicCondition = 'fracture' | 'joint_replacement' | 'osteoarthritis' | 'rheumatoid_arthritis' | 'spinal_injury' | 'amputation' | 'other';

export type FractureType = 'hip' | 'spine' | 'wrist' | 'ankle' | 'femur' | 'other';

export type SurgeryType = 'total_hip_replacement' | 'total_knee_replacement' | 'spinal_fusion' | 'amputation' | 'open_reduction' | 'other';

export type RecoveryPhase = 'pre_surgery' | 'acute_post_surgery' | 'rehabilitation' | 'maintenance';

export type MobilityLevel = 'bed_rest' | 'wheelchair' | 'crutches' | 'walker' | 'independent';

export interface OrthopedicAssessment {
  id?: string;
  patientId: string;
  timestamp: string;
  condition: OrthopedicCondition;
  fractureType: FractureType | null;
  surgeryType: SurgeryType | null;
  surgeryDate: string | null;
  recoveryPhase: RecoveryPhase;
  painLevel: number;
  painLocation: string;
  painType: string;
  mobilityLevel: MobilityLevel;
  canBearWeight: boolean;
  physicalTherapy: boolean;
  boneDensityTScore: number;
  hasOsteoporosis: boolean;
  hasOsteopenia: boolean;
  vitaminDLevel: number;
  calciumLevel: number;
  weight: number;
  height: number;
  bmi: number;
  muscleMass: number;
  fatMass: number;
  appetiteDecrease: boolean;
  weightLoss: boolean;
  weightLossAmount: number;
  albumin: number;
  prealbumin: number;
  hemoglobin: number;
  vitaminD: number;
  calcium: number;
  phosphorus: number;
  magnesium: number;
  calorieGoal: number;
  proteinGoal: number;
  calciumGoal: number;
  vitaminDGoal: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrthopedicNutritionPlan {
  id?: string;
  patientId: string;
  assessmentId: string;
  totalCalories: number;
  proteinGrams: number;
  fatGrams: number;
  carbohydrateGrams: number;
  calciumMg: number;
  vitaminDIU: number;
  magnesiumMg: number;
  phosphorusMg: number;
  omega3Grams: number;
  zincMg: number;
  vitaminCMg: number;
  copperMg: number;
  recoveryPhase: RecoveryPhase;
  supplements: { name: string; dose: string; frequency: string }[];
  calciumRichFoods: string[];
  vitaminDRichFoods: string[];
  proteinRichFoods: string[];
  recommendations: string[];
  isActive: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrthopedicMonitoring {
  id?: string;
  patientId: string;
  planId: string;
  timestamp: string;
  painScore: number;
  weight: number;
  alkalinePhosphatase: number;
  osteocalcin: number;
  muscleMass: number;
  mobilityLevel: MobilityLevel;
  createdAt: string;
  updatedAt: string;
}

export function validateOrthopedicAssessment(assessment: OrthopedicAssessment): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (assessment.boneDensityTScore < -5 || assessment.boneDensityTScore > 3) errors.push('Invalid bone density T-score');
  if (assessment.painLevel < 0 || assessment.painLevel > 10) errors.push('Invalid pain level');
  if (assessment.weight <= 0 || assessment.weight > 300) errors.push('Invalid weight value');
  return { valid: errors.length === 0, errors };
}

export function validateOrthopedicNutritionPlan(plan: OrthopedicNutritionPlan): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (plan.calciumMg < 500 || plan.calciumMg > 3000) errors.push('Invalid calcium target');
  if (plan.vitaminDIU < 200 || plan.vitaminDIU > 10000) errors.push('Invalid vitamin D target');
  if (plan.totalCalories < 1000 || plan.totalCalories > 5000) errors.push('Invalid calorie target');
  return { valid: errors.length === 0, errors };
}
