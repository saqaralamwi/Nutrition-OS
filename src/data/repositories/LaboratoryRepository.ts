import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../database';
import LaboratoryRecordModel from '../models/LaboratoryRecord';
import { ILaboratoryRepository, LaboratoryRecordRecord } from '../../domain/repositories/ILaboratoryRepository';

function toRecord(model: LaboratoryRecordModel): LaboratoryRecordRecord {
  return {
    id: model.id,
    patientId: model.patientId,
    testDate: model.testDate?.getTime() || Date.now(),
    testType: model.testType,
    alt: model.alt ?? undefined,
    ast: model.ast ?? undefined,
    albumin: model.albumin ?? undefined,
    bilirubin: model.bilirubin ?? undefined,
    potassium: model.potassium ?? undefined,
    sodium: model.sodium ?? undefined,
    phosphorus: model.phosphorus ?? undefined,
    urea: model.urea ?? undefined,
    creatinine: model.creatinine ?? undefined,
    bloodGlucose: model.bloodGlucose ?? undefined,
    hba1c: model.hba1c ?? undefined,
    createdAt: model.createdAt?.toISOString() || undefined,
    updatedAt: model.updatedAt?.toISOString() || undefined,
  };
}

export class LaboratoryRepository implements ILaboratoryRepository {
  async getByPatientId(patientId: string): Promise<LaboratoryRecordRecord[]> {
    const db = await getDatabase();
    const results = await db.get<LaboratoryRecordModel>('laboratory_records')
      .query(
        Q.where('patient_id', patientId),
        Q.sortBy('test_date', 'desc'),
      ).fetch();
    return results.map(toRecord);
  }

  async create(record: LaboratoryRecordRecord): Promise<string> {
    const db = await getDatabase();
    const now = new Date();
    const result = await db.write(async () => {
      const collection = db.get<LaboratoryRecordModel>('laboratory_records');
      return collection.create((r) => {
        r.patientId = record.patientId;
        r.testDate = new Date(record.testDate);
        r.testType = record.testType;
        r.alt = record.alt ?? undefined;
        r.ast = record.ast ?? undefined;
        r.albumin = record.albumin ?? undefined;
        r.bilirubin = record.bilirubin ?? undefined;
        r.potassium = record.potassium ?? undefined;
        r.sodium = record.sodium ?? undefined;
        r.phosphorus = record.phosphorus ?? undefined;
        r.urea = record.urea ?? undefined;
        r.creatinine = record.creatinine ?? undefined;
        r.bloodGlucose = record.bloodGlucose ?? undefined;
        r.hba1c = record.hba1c ?? undefined;
        r.createdAt = now;
        r.updatedAt = now;
      });
    });
    return result.id;
  }
}
