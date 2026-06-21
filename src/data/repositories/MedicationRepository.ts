import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../database';
import MedicationModel from '../models/Medication';
import { IMedicationRepository, MedicationRecord } from '../../domain/repositories/IMedicationRepository';

function toRecord(model: MedicationModel): MedicationRecord {
  return {
    id: model.id,
    patientId: model.patientId,
    drugName: model.drugName || undefined,
    dosage: model.dosage || undefined,
    frequency: model.frequency || undefined,
    route: model.route || undefined,
    startDate: model.startDate?.toISOString() || undefined,
    endDate: model.endDate?.toISOString() || undefined,
    prescribingPhysician: model.prescribingPhysician || undefined,
    dniRisk: model.dniRisk || undefined,
    dniNotes: model.dniNotes || undefined,
    
    name: model.name || undefined,
    nameAr: model.nameAr || undefined,
    type: model.type || undefined,
    mlPerHour: model.mlPerHour ?? undefined,
    totalMlPerDay: model.totalMlPerDay ?? undefined,
    percent: model.percent ?? undefined,
    durationHours: model.durationHours ?? undefined,
    isActive: model.isActive ?? undefined,
    notes: model.notes || undefined,
    notesAr: model.notesAr || undefined,
    hiddenCalories: model.hiddenCalories ?? 0,

    recordedAt: model.recordedAt?.toISOString() || undefined,
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

    const result = await db.write(async () => {
      const collection = db.get<MedicationModel>('medications');
      return collection.create((r) => {
        r.patientId = record.patientId;
        r.drugName = record.drugName ?? '';
        r.dosage = record.dosage ?? '';
        r.frequency = record.frequency ?? '';
        r.route = record.route ?? '';
        if (record.startDate) r.startDate = new Date(record.startDate);
        if (record.endDate) r.endDate = new Date(record.endDate);
        r.prescribingPhysician = record.prescribingPhysician ?? '';
        r.dniRisk = record.dniRisk ?? '';
        r.dniNotes = record.dniNotes ?? '';
        
        r.name = record.name ?? '';
        r.nameAr = record.nameAr ?? '';
        r.type = record.type ?? '';
        r.mlPerHour = record.mlPerHour ?? 0;
        r.totalMlPerDay = record.totalMlPerDay ?? 0;
        r.percent = record.percent ?? 0;
        r.durationHours = record.durationHours ?? 0;
        r.isActive = record.isActive ?? true;
        r.notes = record.notes ?? '';
        r.notesAr = record.notesAr ?? '';
        r.recordedAt = record.recordedAt ? new Date(record.recordedAt) : new Date();
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
