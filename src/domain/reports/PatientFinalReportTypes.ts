export interface PatientProfileData {
  patientId: string;
  fullName: string;
  age: number;
  gender: 'male' | 'female';
  phone: string;
  address: {
    governorate: string;
    district: string;
    ezla: string;
  };
  occupation: string;
  maritalStatus: string;
  emergencyContact: string;
}

export interface ClinicalMetricsData {
  weight: number | null;
  height: number | null;
  bmi: number | null;
  bmiCategory: string;
  bmr: number | null;
  tdee: number | null;
  bodyFatPercentage: number | null;
  waistCircumference: number | null;
  hipCircumference: number | null;
  waistToHipRatio: number | null;
  activityLevel: string;
  activityMultiplier: number | null;
}

export interface LaboratoryResultItem {
  testName: string;
  value: number;
  unit: string;
  normalLow: number;
  normalHigh: number;
  isAbnormal: boolean;
  isCritical: boolean;
  recordedBy: string;
  timestamp: string;
}

export interface DiagnosisData {
  primaryDiagnosis: string;
  secondaryDiagnoses: string[];
  chronicConditions: string[];
  allergies: string[];
  currentMedications: {
    name: string;
    dosage: string;
    frequency: string;
  }[];
}

export interface NutritionPlanData {
  planId: string;
  caloricTarget: number;
  macroSplit: {
    proteinGrams: number;
    proteinPercentage: number;
    carbsGrams: number;
    carbsPercentage: number;
    fatGrams: number;
    fatPercentage: number;
  };
  mealTiming: {
    mealsPerDay: number;
    snacksPerDay: number;
    breakfastTime: string;
    lunchTime: string;
    dinnerTime: string;
  };
  dietType: string;
  restrictions: string[];
  preferences: string[];
  hydrationTarget: number;
  fiberTarget: number;
}

export interface DietitianNotesData {
  notes: string;
  followUpFrequency: string;
  nextFollowUpDate: string;
  specialInstructions: string;
}

export interface RecommendationItem {
  name: string;
  dosage: string;
  reason: string;
}

export interface RecommendationsData {
  dietaryRecommendations: string[];
  lifestyleRecommendations: string[];
  supplementRecommendations: RecommendationItem[];
  warningFlags: string[];
}

export interface RiskAssessmentData {
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  icuAdmissionRequired: boolean;
  samRisk: boolean;
  stampRisk: boolean;
  diabetesRisk: boolean;
  cvdRisk: boolean;
}

export interface PatientFinalReport {
  patientProfile: PatientProfileData;
  clinicalMetrics: ClinicalMetricsData;
  laboratoryResults: LaboratoryResultItem[];
  abnormalTestsCount: number;
  criticalTestsCount: number;
  diagnosis: DiagnosisData;
  nutritionPlan: NutritionPlanData;
  dietitianNotes: DietitianNotesData;
  recommendations: RecommendationsData;
  riskAssessment: RiskAssessmentData;
  reportDate: string;
  reportId: string;
  clinicianName: string;
  medicalDisclaimer: string;
}

export interface PatientReportOutput {
  reportText: string;
  summary: {
    patientId: string;
    fullName: string;
    age: number;
    gender: string;
    primaryDiagnosis: string;
    overallRiskLevel: string;
    riskScore: number;
    caloricTarget: number;
    abnormalTestsCount: number;
    icuAdmissionRequired: boolean;
  };
  abnormalTests: LaboratoryResultItem[];
  warningFlags: string[];
  keyRecommendations: string[];
  reportDate: string;
  medicalDisclaimer: string;
  rawData: PatientFinalReport;
}
