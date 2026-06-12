import { PatientMetrics } from '../entities/PatientMetrics';
import { NutritionPlan, ActivityLevel } from '../entities/NutritionPlan';
import { calculateBmi } from './BmiCalculator';
import { calculateBmr } from './BmrCalculator';
import { calculateTdee } from './TdeeCalculator';
import { calculateMacros } from './MacronutrientCalculator';
import { getDiseaseAdjustments } from './DiseaseRules';

export interface CalculateMetricsInput {
  patientId: string;
  weightKg: number;
  heightCm: number;
  age: number;
  isMale: boolean;
  activityLevel?: ActivityLevel;
}

export interface GeneratePlanInput {
  patientId: string;
  metricsId: string;
  weightKg: number;
  tdee: number;
  diagnosis: string;
  activityLevel?: ActivityLevel;
}

export function calculatePatientMetrics(input: CalculateMetricsInput): PatientMetrics {
  const bmi = calculateBmi(input.weightKg, input.heightCm);
  const bmr = calculateBmr(
    input.weightKg,
    input.heightCm,
    input.age,
    input.isMale
  );
  const tdee = calculateTdee(bmr.value, input.activityLevel);

  return {
    patientId: input.patientId,
    weightKg: input.weightKg,
    heightCm: input.heightCm,
    bmi,
    bmr,
    tdee,
  };
}

export function generateNutritionPlan(input: GeneratePlanInput): NutritionPlan {
  const diseaseAdjustment = getDiseaseAdjustments(
    input.diagnosis,
    input.tdee,
    input.weightKg
  );

  const adjustedCalories = input.tdee + diseaseAdjustment.calorieAdjustment;
  const finalCalories = Math.max(adjustedCalories, 800);

  const proteinPerKg = diseaseAdjustment.proteinPerKg ?? 1.2;
  const fatPct = diseaseAdjustment.fatPercentage ?? 0.25;
  const carbsPct = diseaseAdjustment.carbsPercentage;

  const macros = calculateMacros(
    finalCalories,
    input.weightKg,
    proteinPerKg,
    fatPct,
    carbsPct
  );

  return {
    patientId: input.patientId,
    patientMetricsId: input.metricsId,
    totalCalories: finalCalories,
    calorieAdjustment: diseaseAdjustment.calorieAdjustment,
    macros,
    recommendations: diseaseAdjustment.recommendations,
    restrictions: diseaseAdjustment.restrictions,
  };
}
