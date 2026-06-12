export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese';

export interface BmiResult {
  value: number;
  category: BmiCategory;
  categoryLabel: string;
  clinicalNote: string;
}

export interface BmrResult {
  value: number;
  formulaName: string;
  description: string;
}

export interface TdeeResult {
  value: number;
  activityMultiplier: number;
  activityLabel: string;
}

export interface PatientMetrics {
  id?: string;
  patientId: string;
  weightKg: number;
  heightCm: number;
  bmi: BmiResult;
  bmr: BmrResult;
  tdee: TdeeResult;
  createdAt?: string;
}

export const BMI_CATEGORIES: Record<BmiCategory, { label: string; note: string }> = {
  underweight: {
    label: 'نقص وزن',
    note: 'المريض يعاني من نقص في الوزن. ينصح بزيادة السعرات الحرارية والبروتين.',
  },
  normal: {
    label: 'وزن طبيعي',
    note: 'المريض ضمن نطاق الوزن الصحي. حافظ على النظام الغذائي الحالي.',
  },
  overweight: {
    label: 'وزن زائد',
    note: 'المريض يعاني من زيادة في الوزن. ينصح بتقليل السعرات وت增加 النشاط البدني.',
  },
  obese: {
    label: 'سمنة',
    note: 'المريض يعاني من السمنة. ينصح ببرنامج غذائي منخفض السعرات وإشراف طبي.',
  },
};
