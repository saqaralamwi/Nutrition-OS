import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../database';
import PhysicalExamModel from '../models/PhysicalExamItem';
import { IPhysicalExamRepository, PhysicalExamRecord } from '../../domain/repositories/IPhysicalExamRepository';

function toRecord(model: PhysicalExamModel): PhysicalExamRecord {
  return {
    id: model.id,
    patientId: model.patientId,
    domain: model.domain,
    itemKey: model.itemKey,
    response: model.response,
    comments: model.comments || undefined,
    createdAt: model.createdAt?.toISOString() || undefined,
    updatedAt: model.updatedAt?.toISOString() || undefined,
  };
}

export class PhysicalExamRepository implements IPhysicalExamRepository {
  async getByPatientId(patientId: string): Promise<PhysicalExamRecord[]> {
    const db = await getDatabase();
    const results = await db.get<PhysicalExamModel>('physical_exam_items')
      .query(Q.where('patient_id', patientId))
      .fetch();
    return results.map(toRecord);
  }

  async getByDomain(patientId: string, domain: string): Promise<PhysicalExamRecord[]> {
    const db = await getDatabase();
    const results = await db.get<PhysicalExamModel>('physical_exam_items')
      .query(
        Q.where('patient_id', patientId),
        Q.where('domain', domain),
      )
      .fetch();
    return results.map(toRecord);
  }

  async saveBatch(patientId: string, items: PhysicalExamRecord[]): Promise<void> {
    const db = await getDatabase();
    const existing = await db.get<PhysicalExamModel>('physical_exam_items')
      .query(Q.where('patient_id', patientId))
      .fetch();

    const existingByKey = new Map<string, PhysicalExamModel>();
    for (const record of existing) {
      existingByKey.set(record.itemKey, record);
    }

    const now = new Date();

    await db.write(async () => {
      const operations = items.map((item) => {
        const existingRecord = existingByKey.get(item.itemKey);
        if (existingRecord) {
          return existingRecord.prepareUpdate((r) => {
            r.response = item.response;
            r.comments = item.comments ?? '';
            r.updatedAt = now;
          });
        }
        const collection = db.get<PhysicalExamModel>('physical_exam_items');
        return collection.prepareCreate((r) => {
          r.patientId = patientId;
          r.domain = item.domain;
          r.itemKey = item.itemKey;
          r.response = item.response;
          r.comments = item.comments ?? '';
          r.createdAt = now;
          r.updatedAt = now;
        });
      });

      await db.batch(...operations);
    });
  }
}
