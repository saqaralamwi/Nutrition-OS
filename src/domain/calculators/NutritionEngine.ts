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

function safeNum(v: unknown, fallback: number = 0): number {
  if (typeof v === 'number' && isFinite(v)) return v;
  return fallback;
}

export function calculatePatientMetrics(input: CalculateMetricsInput): PatientMetrics {
  if (!input || typeof input !== 'object') {
    return { patientId: '', weightKg: 70, heightCm: 170, bmi: { value: 0, category: 'unknown' }, bmr: { value: 1500, formula: 'fallback' }, tdee: 1800 };
  }
  const w = safeNum(input.weightKg, 70);
  const h = safeNum(input.heightCm, 170);
  const a = safeNum(input.age, 40);

  const bmi = w > 0 && h > 0 ? calculateBmi(w, h) : { value: 0, category: 'unknown' as const };
  const bmr = w > 0 && h > 0 ? calculateBmr(w, h, a, input.isMale) : { value: 1500, formula: 'fallback' as const };
  const tdee = calculateTdee(bmr.value, input.activityLevel);

  return {
    patientId: input.patientId,
    weightKg: w,
    heightCm: h,
    bmi,
    bmr,
    tdee,
  };
}

export function generateNutritionPlan(input: GeneratePlanInput): NutritionPlan {
  if (!input || typeof input !== 'object') {
    return { patientId: '', patientMetricsId: '', totalCalories: 1500, calorieAdjustment: 0, macros: { protein: 84, carbs: 250, fat: 55 }, recommendations: [], restrictions: [] };
  }
  const w = safeNum(input.weightKg, 70);
  const tee = safeNum(input.tdee, 2000);

  const diseaseAdjustment = getDiseaseAdjustments(
    input.diagnosis,
    tee,
    w
  );

  const adjustedCalories = tee + diseaseAdjustment.calorieAdjustment;
  const finalCalories = Math.max(Math.round(adjustedCalories), 800);

  const proteinPerKg = diseaseAdjustment.proteinPerKg ?? 1.2;
  const fatPct = diseaseAdjustment.fatPercentage ?? 0.25;
  const carbsPct = diseaseAdjustment.carbsPercentage;

  const macros = calculateMacros(
    finalCalories,
    w,
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

import { getDatabase } from '../../data/database';
import { Q } from '@nozbe/watermelondb';
import Medication from '../../data/models/Medication';
import { calculateTotalEnergy } from './TotalEnergyCalculator';
import {
  calculateHollidaySegarFluid,
  calculateTotalHiddenCalories,
} from '../utils/kauRequirementsEngine';

export interface NutritionRequirements {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fluid: number;
  hiddenCalories: {
    total: number;
    propofol: number;
    dextrose: number;
    midol: number;
    lipids: number;
    breakdown: string;
  };
  baseTee: number;
  adjustedTee: number;
}

async function getPatientWeight(patientId: string): Promise<number> {
  if (!patientId) return 70;
  const db = await getDatabase();
  try {
    const vitals = await db.get('vitals_records').query(Q.where('patient_id', patientId)).fetch();
    if (vitals.length > 0) {
      const sorted = [...vitals].sort((a, b) => {
        const dateA = a.recordDate ? new Date(a.recordDate).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const dateB = b.recordDate ? new Date(b.recordDate).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return dateB - dateA;
      });
      const raw = sorted[0] as Record<string, unknown>;
      const wt = safeNum(raw['weightKg'] as number) || safeNum(raw['weight'] as number);
      if (wt > 0) return wt;
    }
    const icuAdmissions = await db.get('icu_admissions').query(Q.where('patient_id', patientId)).fetch();
    if (icuAdmissions.length > 0) {
      const sorted = [...icuAdmissions].sort((a, b) => {
        const dateA = a.admissionDate ? new Date(a.admissionDate).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const dateB = b.admissionDate ? new Date(b.admissionDate).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return dateB - dateA;
      });
      const raw = sorted[0] as Record<string, unknown>;
      const wt = safeNum(raw['weightKg'] as number);
      if (wt > 0) return wt;
    }
  } catch (err) {
    console.warn('[NutritionEngine] Failed to fetch patient weight, using default:', err);
  }
  return 70;
}

export async function calculateNutritionalRequirementsWithHiddenCalories(
  patientId: string
): Promise<NutritionRequirements> {
  if (!patientId) {
    return { calories: 1500, protein: 84, carbs: 200, fat: 55, fluid: 2100, hiddenCalories: { total: 0, propofol: 0, dextrose: 0, midol: 0, lipids: 0, breakdown: '' }, baseTee: 1500, adjustedTee: 1500 };
  }
  const db = await getDatabase();

  let patientRecord;
  try {
    patientRecord = await db.get('patients').find(patientId);
  } catch {
    console.warn('[NutritionEngine] Patient not found, using defaults');
    return { calories: 1500, protein: 84, carbs: 200, fat: 55, fluid: 2100, hiddenCalories: { total: 0, propofol: 0, dextrose: 0, midol: 0, lipids: 0, breakdown: '' }, baseTee: 1500, adjustedTee: 1500 };
  }
  const patientRaw = patientRecord as Record<string, unknown>;
  const isMale = patientRaw['gender'] === 'male';
  const age = safeNum(patientRaw['age'] as number, 30);

  const weight = await getPatientWeight(patientId);
  let height = 170;
  try {
    const vitals = await db.get('vitals_records').query(Q.where('patient_id', patientId)).fetch();
    if (vitals.length > 0) {
      const sorted = [...vitals].sort((a, b) => {
        const dateA = a.recordDate ? new Date(a.recordDate).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const dateB = b.recordDate ? new Date(b.recordDate).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return dateB - dateA;
      });
      const raw = sorted[0] as Record<string, unknown>;
      height = safeNum(raw['heightCm'] as number) || safeNum(raw['height'] as number) || 170;
    }
  } catch {
    console.warn('[NutritionEngine] Failed to fetch vitals for height');
  }

  let medications: Medication[] = [];
  try {
    medications = await db.get<Medication>('medications')
      .query(Q.where('patient_id', patientId), Q.where('is_active', true))
      .fetch();
  } catch {
    console.warn('[NutritionEngine] Failed to fetch medications');
  }

  const hiddenCaloriesResult = calculateTotalHiddenCalories(medications);

  let activityFactor = 1.2;
  let stressFactor = 1.0;
  let calcs: any[] = [];
  try {
    calcs = await db.get('calculations')
      .query(Q.where('patient_id', patientId), Q.where('calculation_type', 'total_energy'))
      .fetch();
  } catch {
    console.warn('[NutritionEngine] Failed to fetch calculations');
  }

  if (calcs.length > 0) {
    const raw = calcs[0] as Record<string, unknown>;
    const inputVal = raw['inputValues'];
    if (inputVal) {
      try {
        const inputs = typeof inputVal === 'string' ? JSON.parse(inputVal as string) : inputVal;
        if (inputs.activityFactor) activityFactor = safeNum(inputs.activityFactor, 1.2);
        if (inputs.injuryFactor) stressFactor = safeNum(inputs.injuryFactor, 1.0);
      } catch {
        // ignore JSON parse errors
      }
    }
  }

  const safeW = safeNum(weight, 70);
  const safeH = safeNum(height, 170);
  const safeAge = safeNum(age, 30);

  const bmrValue = calculateBmr(safeW, safeH, safeAge, isMale).value;
  const activityLabel = activityFactor <= 1.2 ? 'sedentary' : activityFactor <= 1.375 ? 'light' : activityFactor <= 1.55 ? 'moderate' : 'active';
  const totalEnergyResult = calculateTotalEnergy(bmrValue, activityLabel, stressFactor);
  const baseTee = totalEnergyResult.value;

  const adjustedTee = baseTee - hiddenCaloriesResult.total;

  const minCalories = Math.round(10 * safeW);
  const finalCalories = Math.max(adjustedTee, minCalories);

  let proteinFactor = 1.2;
  if (calcs.length > 0) {
    try {
      const raw = calcs[0] as Record<string, unknown>;
      const inputVal = raw['inputValues'];
      const inputs = typeof inputVal === 'string' ? JSON.parse(inputVal as string) : inputVal;
      if (inputs.proteinFactor) proteinFactor = safeNum(inputs.proteinFactor, 1.2);
    } catch {}
  }

  const macros = calculateMacros(finalCalories, safeW, proteinFactor, 0.30);
  const protein = macros.proteinGrams;
  const carbs = macros.carbsGrams;
  const fat = macros.fatGrams;

  const fluid = Math.round(calculateHollidaySegarFluid(safeW));

  return {
    calories: finalCalories,
    protein,
    carbs,
    fat,
    fluid,
    hiddenCalories: {
      total: hiddenCaloriesResult.total,
      propofol: hiddenCaloriesResult.propofol,
      dextrose: hiddenCaloriesResult.dextrose,
      midol: hiddenCaloriesResult.midol,
      lipids: hiddenCaloriesResult.lipids,
      breakdown: hiddenCaloriesResult.breakdown,
    },
    baseTee,
    adjustedTee,
  };
}
