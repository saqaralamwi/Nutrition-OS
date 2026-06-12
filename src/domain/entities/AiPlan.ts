import { NutritionPlan, MacroBreakdown } from './NutritionPlan';

export interface AiMealSuggestion {
  meal: string;
  foods: string[];
  calories?: number;
}

export interface AiPlan extends NutritionPlan {
  mealPlan: AiMealSuggestion[];
  aiGenerated: true;
  model: string;
  disclaimer: string;
  clinicalNotes?: string;
}

export const AI_DISCLAIMER =
  'هذه الخطة مولّدة بالذكاء الاصطناعي ويجب مراجعتها من قبل أخصائي تغذية مؤهل قبل التطبيق.';

export const AI_MODEL_DEFAULT = 'gpt-4o-mini';

export interface AiGenerateInput {
  patientId: string;
  age: number;
  gender: 'male' | 'female';
  weightKg: number;
  heightCm: number;
  bmi: number;
  bmiCategory: string;
  diagnosis: string;
  activityLevel: string;
  department?: string;
  additionalNotes?: string;
}

export interface AiGenerateResult {
  plan: AiPlan;
  rawResponse: string;
  latencyMs: number;
}
