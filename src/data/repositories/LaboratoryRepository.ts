import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../database';
import LaboratoryRecordModel from '../models/LaboratoryRecord';
import { ILaboratoryRepository, LaboratoryRecordRecord } from '../../domain/repositories/ILaboratoryRepository';

/**
 * Laboratory panel tests mapped to individual test_name values in the unified table
 */
function panelToRows(record: LaboratoryRecordRecord): { test_name: string; value: number; unit: string }[] {
  const rows: { test_name: string; value: number; unit: string }[] = [];
  const pairs: [string, number | undefined, string][] = [
    ['ALT', record.alt, 'U/L'],
    ['AST', record.ast, 'U/L'],
    ['Albumin', record.albumin, 'g/dL'],
    ['Bilirubin', record.bilirubin, 'mg/dL'],
    ['Potassium', record.potassium, 'mmol/L'],
    ['Sodium', record.sodium, 'mmol/L'],
    ['Phosphorus', record.phosphorus, 'mg/dL'],
    ['Urea', record.urea, 'mg/dL'],
    ['Creatinine', record.creatinine, 'mg/dL'],
    ['Blood Glucose', record.bloodGlucose, 'mg/dL'],
    ['HbA1c', record.hba1c, '%'],
  ];
  for (const [name, val, u] of pairs) {
    if (val !== undefined && val !== null) {
      rows.push({ test_name: name, value: val, unit: u });
    }
  }
  return rows;
}

function toRecord(model: LaboratoryRecordModel): LaboratoryRecordRecord {
  return {
    id: model.id,
    patientId: model.patientId,
    testDate: model.testDate?.getTime() || Date.now(),
    testType: model.testType,
    createdAt: model.createdAt?.toISOString() || undefined,
    updatedAt: model.updatedAt?.toISOString() || undefined,
  };
}

export class LaboratoryRepository implements ILaboratoryRepository {
  async getByPatientId(patientId: string): Promise<LaboratoryRecordRecord[]> {
    const db = await getDatabase();
    const results = await db.get<LaboratoryRecordModel>('laboratory_results')
      .query(
        Q.where('patient_id', patientId),
        Q.sortBy('test_date', 'desc'),
      ).fetch();
    return results.map(toRecord);
  }

  async create(record: LaboratoryRecordRecord): Promise<string> {
    const db = await getDatabase();
    const now = new Date();
    const rows = panelToRows(record);

    if (rows.length === 0) {
      throw new Error('LaboratoryRecord must have at least one test value');
    }

    const result = await db.write(async () => {
      const collection = db.get<LaboratoryRecordModel>('laboratory_results');
      return collection.create((r) => {
        r.patientId = record.patientId;
        r.testDate = new Date(record.testDate);
        r.testType = rows[0].test_name;
        r.value = rows[0].value;
        r.unit = rows[0].unit;
        r.isAbnormal = false;
        r.severity = null;
        r.source = 'manual';
        r.createdAt = now;
        r.updatedAt = now;
      });
    });
    return result.id;
  }
}
