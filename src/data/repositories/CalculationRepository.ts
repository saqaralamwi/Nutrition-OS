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

export class CalculationRepository implements ICalculationRepository {
  async getByPatientId(patientId: string): Promise<CalculationResult[]> {
    const db = await getDatabase();
    const records = await db.get<CalculationModel>('calculations')
      .query(
        Q.where('patient_id', patientId),
        Q.sortBy('created_at', 'desc'),
      ).fetch();
    return records.map(toDomain);
  }

  async getByPatientIdAndType(patientId: string, calculationType: string): Promise<CalculationResult[]> {
    const db = await getDatabase();
    const records = await db.get<CalculationModel>('calculations')
      .query(
        Q.where('patient_id', patientId),
        Q.where('calculation_type', calculationType),
        Q.sortBy('created_at', 'desc'),
      ).fetch();
    return records.map(toDomain);
  }

  async upsert(calculation: CalculationResult): Promise<string> {
    const db = await getDatabase();
    const existing = await db.get<CalculationModel>('calculations')
      .query(
        Q.where('patient_id', calculation.patientId),
        Q.where('calculation_type', calculation.calculationType),
        Q.sortBy('created_at', 'desc'),
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
            Q.sortBy('created_at', 'desc'),
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
