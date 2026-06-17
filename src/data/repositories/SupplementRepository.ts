import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../database';
import SupplementModel from '../models/Supplement';
import { ISupplementRepository, SupplementRecord } from '../../domain/repositories/ISupplementRepository';

function toRecord(model: SupplementModel): SupplementRecord {
  return {
    id: model.id,
    patientId: model.patientId,
    supplementName: model.supplementName,
    dosage: model.dosage || undefined,
    supplementType: model.supplementType,
    createdAt: model.createdAt?.toISOString() || undefined,
    updatedAt: model.updatedAt?.toISOString() || undefined,
  };
}

export class SupplementRepository implements ISupplementRepository {
  async getByPatientId(patientId: string): Promise<SupplementRecord[]> {
    const db = await getDatabase();
    const results = await db.get<SupplementModel>('supplements')
      .query(Q.where('patient_id', patientId))
      .fetch();
    return results.map(toRecord);
  }

  async save(record: SupplementRecord): Promise<string> {
    const db = await getDatabase();

    const result = await db.write(async () => {
      const collection = db.get<SupplementModel>('supplements');
      return collection.create((r) => {
        r.patientId = record.patientId;
        r.supplementName = record.supplementName;
        r.dosage = record.dosage ?? '';
        r.supplementType = record.supplementType;
      });
    });
    return result.id;
  }

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.write(async () => {
      const record = await db.get<SupplementModel>('supplements').find(id);
      await record.markAsDeleted();
    });
  }
}
