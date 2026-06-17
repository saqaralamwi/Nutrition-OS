import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../database';
import LaboratoryRecord from '../models/LaboratoryRecord';

type LabResultModel = LaboratoryRecord;
import { ILabResultRepository, LabResultRecord } from '../../domain/repositories/ILabResultRepository';

function toRecord(model: LabResultModel): LabResultRecord {
  return {
    id: model.id,
    patientId: model.patientId,
    testName: model.testName,
    resultValue: model.resultValue,
    unit: model.unit,
    referenceRangeLow: model.normalLow,
    referenceRangeHigh: model.normalHigh,
    interpretation: model.isAbnormal ? 'abnormal' : 'normal',
    overrideReason: model.severity || undefined,
    testDate: model.testDate?.toISOString() || new Date().toISOString(),
    comments: model.notes || undefined,
    attachedImagePath: undefined,
    createdAt: model.createdAt?.toISOString() || undefined,
    updatedAt: model.updatedAt?.toISOString() || undefined,
  };
}

export class LabResultRepository implements ILabResultRepository {
  async getByPatientId(patientId: string): Promise<LabResultRecord[]> {
    const db = await getDatabase();
    const results = await db.get<LabResultModel>('laboratory_results')
      .query(
        Q.where('patient_id', patientId),
        Q.sortBy('test_date', 'desc'),
      )
      .fetch();
    return results.map(toRecord);
  }

  async getByTestName(patientId: string, testName: string): Promise<LabResultRecord[]> {
    const db = await getDatabase();
    const results = await db.get<LabResultModel>('laboratory_results')
      .query(
        Q.where('patient_id', patientId),
        Q.where('test_name', testName),
        Q.sortBy('test_date', 'desc'),
      )
      .fetch();
    return results.map(toRecord);
  }

  async save(record: LabResultRecord): Promise<string> {
    const db = await getDatabase();

    const result = await db.write(async () => {
      const collection = db.get<LabResultModel>('laboratory_results');
      return collection.create((r) => {
        r.patientId = record.patientId;
        r.testName = record.testName;
        r.resultValue = record.resultValue;
        r.unit = record.unit;
        r.normalLow = record.referenceRangeLow;
        r.normalHigh = record.referenceRangeHigh;
        r.isAbnormal = record.interpretation === 'abnormal';
        r.severity = record.overrideReason || null;
        r.source = 'lab_machine';
        r.testDate = new Date(record.testDate);
        r.notes = record.comments ?? '';
      });
    });
    return result.id;
  }

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.write(async () => {
      const record = await db.get<LabResultModel>('laboratory_results').find(id);
      await record.markAsDeleted();
    });
  }
}
