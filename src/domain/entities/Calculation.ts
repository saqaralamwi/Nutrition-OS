export interface CalculationInputValues {
  weightKg?: number;
  heightCm?: number;
  age?: number;
  isMale?: boolean;
  bmr?: number;
  bmrFormula?: string;
  activityLevel?: string;
  stressFactor?: number;
  ibw?: number;
  actualWeight?: number;
  method?: string;
  [key: string]: any;
}

export interface CalculationStep {
  label: string;
  value: string;
  description?: string;
}

export interface CalculationResult {
  id?: string;
  patientId: string;
  calculationType: string;
  formulaName: string;
  inputValues: CalculationInputValues;
  resultValue: number;
  steps?: CalculationStep[];
  isOverridden?: boolean;
  overrideValue?: number;
  overrideReason?: string;
  createdAt?: string;
  updatedAt?: string;
}
