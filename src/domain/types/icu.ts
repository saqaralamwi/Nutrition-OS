export type ICUAdmissionStatus = 'admitted' | 'transferred' | 'discharged' | 'death';

export type ICULevelOfCare = 'general' | 'monitoring' | 'critical';

export type VentilationStatus = 'none' | 'non_invasive' | 'invasive' | 'tracheostomy';

export type ICUNutritionRoute = 'oral' | 'enteral' | 'parenteral' | 'mixed';

export interface ICUAdmission {
  id?: string;
  patientId: string;
  admissionDate: string;
  timestamp: string;
  admissionStatus: ICUAdmissionStatus;
  admissionType: string;
  admittingDepartment: string;
  primaryDiagnosis: string;
  secondaryDiagnoses: string[];
  levelOfCare: ICULevelOfCare;
  icuUnit: string;
  bedNumber: string;
  heartRate: number;
  bloodPressure: string;
  respiratoryRate: number;
  temperature: number;
  oxygenSaturation: number;
  ventilationStatus: VentilationStatus;
  ventilatorSettings: {
    mode: string;
    fI02: number;
    pEEP: number;
    pIP: number;
    tidalVolume: number;
    rate: number;
  } | null;
  weight: number;
  height: number;
  bmi: number;
  nutritionRoute: ICUNutritionRoute;
  nutritionStartDate: string | null;
  hemoglobin: number;
  wbc: number;
  platelets: number;
  creatinine: number;
  bun: number;
  isActive: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface IcuCriticalAssessment {
  id?: string;
  patientId: string;
  admissionId: string;
  timestamp: string;
  gcs: number;
  apacheII: number;
  heartRate: number;
  bloodPressure: string;
  systolicBP: number;
  diastolicBP: number;
  meanArterialPressure: number;
  onVasopressors: boolean;
  vasopressorType: string | null;
  respiratoryRate: number;
  oxygenSaturation: number;
  ventilationStatus: VentilationStatus;
  peep: number;
  fI02: number;
  paO2: number;
  paCO2: number;
  creatinine: number;
  bun: number;
  urineOutput: number;
  onDialysis: boolean;
  dialysisType: string | null;
  glucose: number;
  sodium: number;
  potassium: number;
  chloride: number;
  bicarbonate: number;
  lactate: number;
  albumin: number;
  prealbumin: number;
  nutritionRoute: ICUNutritionRoute;
  currentCalories: number;
  currentProtein: number;
  tolerance: string;
  calorieGoal: number;
  proteinGoal: number;
  fluidGoal: number;
  createdAt: string;
  updatedAt: string;
}

export interface ICUNutritionPlan {
  id?: string;
  patientId: string;
  assessmentId: string;
  totalCalories: number;
  proteinGrams: number;
  fatGrams: number;
  carbohydrateGrams: number;
  proteinPerKg: number;
  nutritionRoute: ICUNutritionRoute;
  formulaType: string;
  rate: number;
  frequency: string;
  totalFluids: number;
  freeWater: number;
  sodium: number;
  potassium: number;
  chloride: number;
  bicarbonate: number;
  phosphorus: number;
  magnesium: number;
  supplements: { name: string; dose: string; frequency: string }[];
  glucoseMonitoringFrequency: number;
  electrolyteMonitoringFrequency: number;
  currentTolerance: string;
  issues: string[];
  recommendations: string[];
  isActive: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
