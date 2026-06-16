export type ClinicalPhase =
  | 'healthy'
  | 'pediatrics'
  | 'pregnancy'
  | 'sports'
  | 'weight_management'
  | 'chronic_disease'
  | 'critical_care'
  | 'special_conditions';

export type PatientCategory =
  | 'healthy_adult'
  | 'healthy_elderly'
  | 'infant'
  | 'toddler'
  | 'child'
  | 'adolescent'
  | 'pregnancy_normal'
  | 'pregnancy_high_risk'
  | 'lactation'
  | 'endurance_athlete'
  | 'strength_athlete'
  | 'recreational_athlete'
  | 'obesity_loss'
  | 'underweight_gain'
  | 'diabetes_t1'
  | 'diabetes_t2'
  | 'ckd_nondialysis'
  | 'ckd_dialysis'
  | 'cardiovascular'
  | 'hypertension'
  | 'icu_ventilated'
  | 'icu_non_ventilated'
  | 'sepsis'
  | 'trauma'
  | 'gastrointestinal'
  | 'liver_disease'
  | 'respiratory_disease'
  | 'oncology'
  | 'autoimmune'
  | 'transplant';

export type Severity = 'mild' | 'moderate' | 'severe' | 'critical';
export type AlertPriority = 'critical' | 'high' | 'medium' | 'low';

export interface ProtocolNutrientTargets {
  calories: string;
  protein: number;
  carbsPercent: number;
  fatPercent: number;
  fluid: string;
  glucoseTarget?: string;
  specialNutrients?: string[];
}

export interface ClinicalProtocol {
  id: string;
  category: PatientCategory;
  phase: ClinicalPhase;
  name: string;
  nameAr: string;
  nutrientTargets: ProtocolNutrientTargets;
  guidelines: string[];
  specialConsiderations: string[];
  contraindications: string[];
  monitoringRequirements: string[];
}

export interface PatientStory {
  summary: string;
  medicalHistory: {
    primaryDiagnosis: string;
    chronicConditions: string[];
    surgeries: string[];
    hospitalizations: string[];
    allergies: string[];
  };
  nutritionHistory: {
    previousDiets: string[];
    foodPreferences: string[];
    foodIntolerances: string[];
    eatingPatterns: string[];
  };
  currentMedications: {
    medications: string[];
    hiddenCalories: number;
  };
  currentIssues: {
    weightChange: number;
    glucoseIssues: boolean;
    electrolyteIssues: boolean;
    malnutrition: boolean;
  };
  narrative: string;
}

export interface RiskAssessment {
  refeeding: { riskScore: number; riskLevel: 'low' | 'medium' | 'high'; recommendations: string[] };
  overfeeding: { riskScore: number; riskLevel: 'low' | 'medium' | 'high'; hiddenCalories: number };
  muscleWasting: { riskScore: number; riskLevel: 'low' | 'medium' | 'high' };
  hyperglycemia: { riskScore: number; riskLevel: 'low' | 'medium' | 'high' };
  malnutrition: { riskScore: number; riskLevel: 'low' | 'medium' | 'high'; type?: string };
}

export interface ClinicalAssessment {
  severity: Severity;
  nutritionalDiagnosis: string;
  risks: RiskAssessment;
  problems: string[];
  goals: string[];
  overallAssessment: string;
}

export interface NutritionIntervention {
  immediate: string[];
  shortTerm: string[];
  longTerm: string[];
  education: string[];
}

export interface ClinicalRecommendation {
  priority: AlertPriority;
  category: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  evidenceLevel?: string;
}

export interface MonitoringPlan {
  frequency: string;
  parameters: string[];
  tests: string[];
  followUpSchedule: string;
  reassessmentCriteria: string[];
}

export interface TreatmentPlan {
  nutrition: {
    calories: number;
    protein: number;
    proteinPerKg: number;
    carbs: number;
    carbsPercent: number;
    fat: number;
    fatPercent: number;
    fluid: number;
  };
  medications: string[];
  monitoring: MonitoringPlan;
  followUp: string[];
  goals: string[];
  expectations: string;
}

export interface ComprehensiveReport {
  patientInfo: {
    name: string;
    age: number;
    gender: string;
    weight: number;
    height: number;
    bmi: number;
    department: string;
    diagnosis: string;
  };
  patientStory: PatientStory;
  clinicalAssessment: ClinicalAssessment;
  protocol: ClinicalProtocol;
  treatmentPlan: TreatmentPlan;
  interventions: NutritionIntervention;
  recommendations: ClinicalRecommendation[];
  monitoringPlan: MonitoringPlan;
  executiveSummary: string;
  alerts: string[];
  conclusion: string;
  generatedAt: string;
  therapeuticFoods?: EngineFoodSuggestion[];
  drugInteractions?: EngineDrugAlert[];
}

export interface TherapeuticFoodInfo {
  nameAr: string;
  nameEn: string;
  therapeuticBenefits: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

export interface DrugInteractionInfo {
  activeIngredient: string;
  clinicalSeverity: string;
  mechanismDescription?: string;
  dietaryActionRequired?: string;
}

export interface EngineFoodSuggestion {
  nameAr: string;
  nameEn: string;
  benefit: string;
  caloriesPer100g: number;
  proteinPer100g: number;
}

export interface EngineDrugAlert {
  ingredient: string;
  severity: string;
  action: string;
  mechanism: string;
}

export interface ClinicalEngineInput {
  patient: import('../../entities/Patient').Patient;
  weightKg: number;
  heightCm: number;
  age: number;
  isMale: boolean;
  diagnosis: string;
  department: string;
  glucoseMgDl?: number;
  phosphorus?: number;
  potassium?: number;
  magnesium?: number;
  albumin?: number;
  creatinine?: number;
  urea?: number;
  medications?: string[];
  isVentilated?: boolean;
  onDialysis?: boolean;
  hasDiabetes?: boolean;
  hasKidneyDisease?: boolean;
  weightChangePercent?: number;
  npoDays?: number;
  hasMalnutrition?: boolean;
  therapeuticFoods?: TherapeuticFoodInfo[];
  drugInteractions?: DrugInteractionInfo[];
}

export interface ClinicalEngineOutput {
  patientStory: PatientStory;
  assessment: ClinicalAssessment;
  protocol: ClinicalProtocol;
  treatmentPlan: TreatmentPlan;
  interventions: NutritionIntervention;
  recommendations: ClinicalRecommendation[];
  monitoringPlan: MonitoringPlan;
  report: ComprehensiveReport;
  therapeuticFoods?: EngineFoodSuggestion[];
  drugInteractions?: EngineDrugAlert[];
}
