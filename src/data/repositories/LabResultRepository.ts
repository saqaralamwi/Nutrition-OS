import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../database';
import LabResultModel from '../models/LabResult';
import { ILabResultRepository, LabResultRecord } from '../../domain/repositories/ILabResultRepository';

function toRecord(model: LabResultModel): LabResultRecord {
  return {
    id: model.id,
    patientId: model.patientId,
    testName: model.testName,
    resultValue: model.resultValue,
    unit: model.unit,
    referenceRangeLow: model.referenceRangeLow,
    referenceRangeHigh: model.referenceRangeHigh,
    interpretation: model.interpretation,
    overrideReason: model.overrideReason || undefined,
    testDate: model.testDate?.toISOString() || new Date().toISOString(),
    comments: model.comments || undefined,
    attachedImagePath: model.attachedImagePath || undefined,
    createdAt: model.createdAt?.toISOString() || undefined,
    updatedAt: model.updatedAt?.toISOString() || undefined,
  };
}

export class LabResultRepository implements ILabResultRepository {
  async getByPatientId(patientId: string): Promise<LabResultRecord[]> {
    const db = await getDatabase();
    const results = await db.get<LabResultModel>('lab_results')
      .query(
        Q.where('patient_id', patientId),
        Q.sortBy('test_date', 'desc'),
      )
      .fetch();
    return results.map(toRecord);
  }

  async getByTestName(patientId: string, testName: string): Promise<LabResultRecord[]> {
    const db = await getDatabase();
    const results = await db.get<LabResultModel>('lab_results')
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
    const now = new Date();

    const result = await db.write(async () => {
      const collection = db.get<LabResultModel>('lab_results');
      return collection.create((r) => {
        r.patientId = record.patientId;
        r.testName = record.testName;
        r.resultValue = record.resultValue;
        r.unit = record.unit;
        r.referenceRangeLow = record.referenceRangeLow;
        r.referenceRangeHigh = record.referenceRangeHigh;
        r.interpretation = record.interpretation;
        r.overrideReason = record.overrideReason ?? '';
        r.testDate = new Date(record.testDate);
        r.comments = record.comments ?? '';
        r.attachedImagePath = record.attachedImagePath ?? '';
        r.createdAt = now;
        r.updatedAt = now;
      });
    });
    return result.id;
  }

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.write(async () => {
      const record = await db.get<LabResultModel>('lab_results').find(id);
      await record.markAsDeleted();
    });
  }
}
