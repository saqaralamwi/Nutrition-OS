import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../database';
import MedicationModel from '../models/Medication';
import { IMedicationRepository, MedicationRecord } from '../../domain/repositories/IMedicationRepository';

function toRecord(model: MedicationModel): MedicationRecord {
  return {
    id: model.id,
    patientId: model.patientId,
    drugName: model.drugName,
    dosage: model.dosage || undefined,
    frequency: model.frequency || undefined,
    route: model.route,
    startDate: model.startDate?.toISOString() || undefined,
    endDate: model.endDate?.toISOString() || undefined,
    prescribingPhysician: model.prescribingPhysician || undefined,
    dniRisk: model.dniRisk,
    dniNotes: model.dniNotes || undefined,
    createdAt: model.createdAt?.toISOString() || undefined,
    updatedAt: model.updatedAt?.toISOString() || undefined,
  };
}

export class MedicationRepository implements IMedicationRepository {
  async getByPatientId(patientId: string): Promise<MedicationRecord[]> {
    const db = await getDatabase();
    const results = await db.get<MedicationModel>('medications')
      .query(Q.where('patient_id', patientId))
      .fetch();
    return results.map(toRecord);
  }

  async save(record: MedicationRecord): Promise<string> {
    const db = await getDatabase();
    const now = new Date();

    const result = await db.write(async () => {
      const collection = db.get<MedicationModel>('medications');
      return collection.create((r) => {
        r.patientId = record.patientId;
        r.drugName = record.drugName;
        r.dosage = record.dosage ?? '';
        r.frequency = record.frequency ?? '';
        r.route = record.route;
        if (record.startDate) r.startDate = new Date(record.startDate);
        if (record.endDate) r.endDate = new Date(record.endDate);
        r.prescribingPhysician = record.prescribingPhysician ?? '';
        r.dniRisk = record.dniRisk;
        r.dniNotes = record.dniNotes ?? '';
        r.createdAt = now;
        r.updatedAt = now;
      });
    });
    return result.id;
  }

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.write(async () => {
      const record = await db.get<MedicationModel>('medications').find(id);
      await record.markAsDeleted();
    });
  }
}
