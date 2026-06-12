import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../database';
import MedicalHistoryModel from '../models/MedicalHistory';
import { IMedicalHistoryRepository, MedicalHistoryRecord } from '../../domain/repositories/IMedicalHistoryRepository';

function toRecord(model: MedicalHistoryModel): MedicalHistoryRecord {
  return {
    id: model.id,
    patientId: model.patientId,
    chiefComplaint: model.chiefComplaint,
    currentDiagnosis: model.currentDiagnosis,
    icd10Code: model.icd10Code || undefined,
    comorbidities: model.comorbidities || undefined,
    surgicalHistory: model.surgicalHistory || undefined,
    pastMedicalHistory: model.pastMedicalHistory || undefined,
    familyHistory: model.familyHistory || undefined,
    medicationAllergies: model.medicationAllergies || undefined,
    covid19Status: model.covid19Status,
    comments: model.comments || undefined,
    createdAt: model.createdAt?.toISOString() || undefined,
    updatedAt: model.updatedAt?.toISOString() || undefined,
  };
}

export class MedicalHistoryRepository implements IMedicalHistoryRepository {
  async getByPatientId(patientId: string): Promise<MedicalHistoryRecord | null> {
    const db = await getDatabase();
    const results = await db.get<MedicalHistoryModel>('medical_histories')
      .query(Q.where('patient_id', patientId))
      .fetch();
    return results.length > 0 ? toRecord(results[0]) : null;
  }

  async save(record: MedicalHistoryRecord): Promise<string> {
    const db = await getDatabase();
    const existing = await db.get<MedicalHistoryModel>('medical_histories')
      .query(Q.where('patient_id', record.patientId))
      .fetch();

    const now = new Date();

    if (existing.length > 0) {
      const existingRecord = existing[0];
      await db.write(async () => {
        await existingRecord.update((r) => {
          r.chiefComplaint = record.chiefComplaint;
          r.currentDiagnosis = record.currentDiagnosis;
          r.icd10Code = record.icd10Code ?? '';
          r.comorbidities = record.comorbidities ?? '';
          r.surgicalHistory = record.surgicalHistory ?? '';
          r.pastMedicalHistory = record.pastMedicalHistory ?? '';
          r.familyHistory = record.familyHistory ?? '';
          r.medicationAllergies = record.medicationAllergies ?? '';
          r.covid19Status = record.covid19Status;
          r.comments = record.comments ?? '';
          r.updatedAt = now;
        });
      });
      return existingRecord.id;
    }

    const result = await db.write(async () => {
      const collection = db.get<MedicalHistoryModel>('medical_histories');
      return collection.create((r) => {
        r.patientId = record.patientId;
        r.chiefComplaint = record.chiefComplaint;
        r.currentDiagnosis = record.currentDiagnosis;
        r.icd10Code = record.icd10Code ?? '';
        r.comorbidities = record.comorbidities ?? '';
        r.surgicalHistory = record.surgicalHistory ?? '';
        r.pastMedicalHistory = record.pastMedicalHistory ?? '';
        r.familyHistory = record.familyHistory ?? '';
        r.medicationAllergies = record.medicationAllergies ?? '';
        r.covid19Status = record.covid19Status;
        r.comments = record.comments ?? '';
        r.createdAt = now;
        r.updatedAt = now;
      });
    });
    return result.id;
  }

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.write(async () => {
      const record = await db.get<MedicalHistoryModel>('medical_histories').find(id);
      await record.markAsDeleted();
    });
  }
}
