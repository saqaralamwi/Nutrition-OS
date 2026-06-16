import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../database';
import CalculationModel from '../models/Calculation';
import { ICalculationRepository } from '../../domain/repositories/ICalculationRepository';
import { CalculationResult } from '../../domain/entities/Calculation';

function toDomain(model: CalculationModel): CalculationResult {
  return {
    id: model.id,
    patientId: model.patientId,
    calculationType: model.calculationType,
    formulaName: model.formulaName,
    inputValues: JSON.parse(model.inputValues || '{}'),
    resultValue: model.resultValue,
    isOverridden: !!model.isOverridden,
    overrideValue: model.overrideValue ?? undefined,
    overrideReason: model.overrideReason || undefined,
    createdAt: model.createdAt?.toISOString(),
    updatedAt: model.updatedAt?.toISOString(),
  };
}

function populateFlatColumns(r: CalculationModel, calculation: CalculationResult) {
  const iv = calculation.inputValues || {};
  
  // Extract inputs
  r.inputWeightKg = iv.weightKg ?? iv.weight_kg ?? iv.actualWeight ?? 0;
  r.inputHeightCm = iv.heightCm ?? iv.height_cm ?? 0;
  r.inputAge = iv.age ?? 0;
  r.inputGender = iv.isMale !== undefined ? (iv.isMale ? 'male' : 'female') : (iv.gender || '');
  r.inputBmi = iv.bmi ?? (r.inputWeightKg && r.inputHeightCm ? r.inputWeightKg / Math.pow(r.inputHeightCm / 100, 2) : 0);
  
  // Extract activity/stress
  let act = 1.2;
  if (iv.activityLevel) {
    if (iv.activityLevel === 'bed_rest') act = 1.1;
    else if (iv.activityLevel === 'ambulatory') act = 1.2;
    else act = parseFloat(iv.activityLevel) || 1.2;
  } else if (iv.activityFactor) {
    act = iv.activityFactor;
  } else if (iv.activity_factor) {
    act = iv.activity_factor;
  }
  r.inputActivityFactor = act;
  r.inputStressFactor = iv.stressFactor ?? iv.stress_factor ?? iv.injuryFactor ?? iv.injury_factor ?? 1.0;
  
  // Extract results
  r.resultTee = calculation.calculationType === 'total_energy' || calculation.calculationType === 'tee' ? calculation.resultValue : 0;
  r.resultRee = iv.bmr ?? iv.ree ?? 0;
  r.resultProteinG = iv.proteinTarget ?? iv.protein_g ?? 0;
  r.resultCarbsG = iv.carbsTarget ?? iv.carbs_g ?? 0;
  r.resultFatG = iv.fatTarget ?? iv.fat_g ?? 0;
  r.resultFluidMl = iv.fluidTarget ?? iv.fluid_ml ?? 0;
  r.resultCalories = calculation.resultValue;
  r.createdBy = (calculation as any).createdBy || 'system';
}

export class CalculationRepository implements ICalculationRepository {
  async getByPatientId(patientId: string): Promise<CalculationResult[]> {
    const db = await getDatabase();
    const records = await db.get<CalculationModel>('calculations')
      .query(
        Q.where('patient_id', patientId),
        Q.sortBy('created_at', Q.desc),
      ).fetch();
    return records.map(toDomain);
  }

  async getByPatientIdAndType(patientId: string, calculationType: string): Promise<CalculationResult[]> {
    const db = await getDatabase();
    const records = await db.get<CalculationModel>('calculations')
      .query(
        Q.where('patient_id', patientId),
        Q.where('calculation_type', calculationType),
        Q.sortBy('created_at', Q.desc),
      ).fetch();
    return records.map(toDomain);
  }

  async upsert(calculation: CalculationResult): Promise<string> {
    const db = await getDatabase();
    const existing = await db.get<CalculationModel>('calculations')
      .query(
        Q.where('patient_id', calculation.patientId),
        Q.where('calculation_type', calculation.calculationType),
        Q.sortBy('created_at', Q.desc),
      ).fetch();

    const now = new Date();
    const inputJson = JSON.stringify(calculation.inputValues);

    if (existing.length > 0) {
      const record = existing[0];
      await db.write(async () => {
        await record.update((r) => {
          r.formulaName = calculation.formulaName;
          r.inputValues = inputJson;
          r.resultValue = calculation.resultValue;
          r.isOverridden = calculation.isOverridden ?? false;
          r.overrideValue = calculation.overrideValue ?? 0;
          r.overrideReason = calculation.overrideReason ?? '';
          populateFlatColumns(r, calculation);
          r.updatedAt = now;
        });
      });
      return record.id;
    }

    const result = await db.write(async () => {
      const collection = db.get<CalculationModel>('calculations');
      return collection.create((r) => {
        r.patientId = calculation.patientId;
        r.calculationType = calculation.calculationType;
        r.formulaName = calculation.formulaName;
        r.inputValues = inputJson;
        r.resultValue = calculation.resultValue;
        r.isOverridden = calculation.isOverridden ?? false;
        r.overrideValue = calculation.overrideValue ?? 0;
        r.overrideReason = calculation.overrideReason ?? '';
        populateFlatColumns(r, calculation);
        r.createdAt = now;
        r.updatedAt = now;
      });
    });
    return result.id;
  }

  async upsertBatch(calculations: CalculationResult[]): Promise<string[]> {
    const db = await getDatabase();
    const now = new Date();
    const ids: string[] = [];

    await db.write(async () => {
      for (const calculation of calculations) {
        const existing = await db.get<CalculationModel>('calculations')
          .query(
            Q.where('patient_id', calculation.patientId),
            Q.where('calculation_type', calculation.calculationType),
            Q.sortBy('created_at', Q.desc),
          ).fetch();

        const inputJson = JSON.stringify(calculation.inputValues);
        const collection = db.get<CalculationModel>('calculations');

        if (existing.length > 0) {
          const record = existing[0];
          await record.update((r) => {
            r.formulaName = calculation.formulaName;
            r.inputValues = inputJson;
            r.resultValue = calculation.resultValue;
            r.isOverridden = calculation.isOverridden ?? false;
            r.overrideValue = calculation.overrideValue ?? 0;
            r.overrideReason = calculation.overrideReason ?? '';
            populateFlatColumns(r, calculation);
            r.updatedAt = now;
          });
          ids.push(record.id);
        } else {
          const record = await collection.create((r) => {
            r.patientId = calculation.patientId;
            r.calculationType = calculation.calculationType;
            r.formulaName = calculation.formulaName;
            r.inputValues = inputJson;
            r.resultValue = calculation.resultValue;
            r.isOverridden = calculation.isOverridden ?? false;
            r.overrideValue = calculation.overrideValue ?? 0;
            r.overrideReason = calculation.overrideReason ?? '';
            populateFlatColumns(r, calculation);
            r.createdAt = now;
            r.updatedAt = now;
          });
          ids.push(record.id);
        }
      }
    });
    return ids;
  }
}

/**
 * Create Calculation (Typed, No JSON)
 */
export async function createCalculation(
  calculationData: {
    patient_id: string;
    calculation_type: string;
    input_weight_kg: number;
    input_height_cm: number;
    input_age: number;
    input_gender: string;
    input_bmi?: number;
    input_activity_factor?: number;
    input_stress_factor?: number;
    result_tee: number;
    result_ree?: number;
    result_protein_g: number;
    result_carbs_g: number;
    result_fat_g: number;
    result_fluid_ml?: number;
    result_calories: number;
    created_by: string;
  }
): Promise<CalculationModel> {
  const db = await getDatabase();
  const now = new Date();
  const inputValuesJson = JSON.stringify({
    weightKg: calculationData.input_weight_kg,
    heightCm: calculationData.input_height_cm,
    age: calculationData.input_age,
    gender: calculationData.input_gender,
    isMale: calculationData.input_gender === 'male',
    bmi: calculationData.input_bmi,
    activityFactor: calculationData.input_activity_factor,
    stressFactor: calculationData.input_stress_factor,
    bmr: calculationData.result_ree,
    proteinTarget: calculationData.result_protein_g,
    carbsTarget: calculationData.result_carbs_g,
    fatTarget: calculationData.result_fat_g,
    fluidTarget: calculationData.result_fluid_ml,
  });

  const result = await db.write(async () => {
    const collection = db.get<CalculationModel>('calculations');
    return collection.create((r) => {
      r.patientId = calculationData.patient_id;
      r.calculationType = calculationData.calculation_type;
      r.formulaName = 'Standard';
      r.inputValues = inputValuesJson;
      r.resultValue = calculationData.result_calories;
      r.isOverridden = false;
      r.overrideValue = 0;
      r.overrideReason = '';
      
      // Flat columns
      r.inputWeightKg = calculationData.input_weight_kg;
      r.inputHeightCm = calculationData.input_height_cm;
      r.inputAge = calculationData.input_age;
      r.inputGender = calculationData.input_gender;
      r.inputBmi = calculationData.input_bmi ?? 0;
      r.inputActivityFactor = calculationData.input_activity_factor ?? 1.2;
      r.inputStressFactor = calculationData.input_stress_factor ?? 1.0;
      r.resultTee = calculationData.result_tee;
      r.resultRee = calculationData.result_ree ?? 0;
      r.resultProteinG = calculationData.result_protein_g;
      r.resultCarbsG = calculationData.result_carbs_g;
      r.resultFatG = calculationData.result_fat_g;
      r.resultFluidMl = calculationData.result_fluid_ml ?? 0;
      r.resultCalories = calculationData.result_calories;
      r.createdBy = calculationData.created_by;

      r.createdAt = now;
      r.updatedAt = now;
    });
  });
  return result;
}

/**
 * Query Calculations by Input Weight (SQL-safe, Indexed)
 */
export async function queryCalculationsByWeight(
  minWeight: number,
  calculationType?: string
): Promise<CalculationModel[]> {
  const db = await getDatabase();
  const conditions: any[] = [Q.where('input_weight_kg', Q.gte(minWeight))];
  if (calculationType) {
    conditions.push(Q.where('calculation_type', calculationType));
  }
  return db
    .get<CalculationModel>('calculations')
    .query(...conditions, Q.sortBy('input_weight_kg', Q.desc))
    .fetch();
}

/**
 * Query Calculations by Result TEE (SQL-safe, Indexed)
 */
export async function queryCalculationsByTEE(
  maxTee: number,
  calculationType?: string
): Promise<CalculationModel[]> {
  const db = await getDatabase();
  const conditions: any[] = [Q.where('result_tee', Q.lte(maxTee))];
  if (calculationType) {
    conditions.push(Q.where('calculation_type', calculationType));
  }
  return db
    .get<CalculationModel>('calculations')
    .query(...conditions, Q.sortBy('result_tee', Q.asc))
    .fetch();
}

/**
 * Aggregate Calculations (SQL-safe, No JSON parsing)
 */
export async function aggregateCalculations(
  calculationType: string,
  groupBy: string
): Promise<Record<string, { count: number; avgTee: number; avgProtein: number }>> {
  const db = await getDatabase();
  const calculations = await db
    .get<CalculationModel>('calculations')
    .query(Q.where('calculation_type', calculationType))
    .fetch();

  const aggregated: Record<string, { count: number; avgTee: number; avgProtein: number }> = {};

  for (const calc of calculations) {
    let groupKey = 'unknown';
    if (groupBy === 'input_gender') {
      groupKey = calc.inputGender || 'unknown';
    } else if (groupBy === 'patient_id') {
      groupKey = calc.patientId;
    } else {
      groupKey = (calc as any)[groupBy] || 'unknown';
    }

    if (!aggregated[groupKey]) {
      aggregated[groupKey] = { count: 0, avgTee: 0, avgProtein: 0 };
    }

    aggregated[groupKey].count++;
    aggregated[groupKey].avgTee += calc.resultTee || 0;
    aggregated[groupKey].avgProtein += calc.resultProteinG || 0;
  }

  // Calculate averages
  for (const key in aggregated) {
    if (aggregated[key].count > 0) {
      aggregated[key].avgTee = Math.round(aggregated[key].avgTee / aggregated[key].count);
      aggregated[key].avgProtein = Math.round((aggregated[key].avgProtein / aggregated[key].count) * 10) / 10;
    }
  }

  return aggregated;
}

/**
 * Get Latest Calculation for Patient
 */
export async function getLatestCalculation(
  patientId: string,
  calculationType: string
): Promise<CalculationModel | null> {
  const db = await getDatabase();
  const calculations = await db
    .get<CalculationModel>('calculations')
    .query(
      Q.where('patient_id', patientId),
      Q.where('calculation_type', calculationType),
      Q.sortBy('created_at', Q.desc),
      Q.take(1)
    )
    .fetch();

  return calculations.length > 0 ? calculations[0] : null;
}
