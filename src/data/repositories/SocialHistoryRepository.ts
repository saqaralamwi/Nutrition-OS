import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../database';
import SocialHistoryModel from '../models/SocialHistory';
import { ISocialHistoryRepository, SocialHistoryRecord } from '../../domain/repositories/ISocialHistoryRepository';

function toRecord(model: SocialHistoryModel): SocialHistoryRecord {
  return {
    id: model.id,
    patientId: model.patientId,
    maritalStatus: model.maritalStatus || undefined,
    educationLevel: model.educationLevel || undefined,
    occupation: model.occupation || undefined,
    livingArea: model.livingArea || undefined,
    familyStructure: model.familyStructure || undefined,
    incomeLevel: model.incomeLevel || undefined,
    smoking: model.smoking,
    cigarettesPerDay: model.cigarettesPerDay ?? undefined,
    yearsSmoked: model.yearsSmoked ?? undefined,
    alcoholSubstanceUse: model.alcoholSubstanceUse,
    physicalActivity: model.physicalActivity,
    activityDescription: model.activityDescription || undefined,
    dietaryHistory: model.dietaryHistory || undefined,
    foodAllergies: model.foodAllergies || undefined,
    specialDietBeforeAdmission: model.specialDietBeforeAdmission,
    comments: model.comments || undefined,
    createdAt: model.createdAt?.toISOString() || undefined,
    updatedAt: model.updatedAt?.toISOString() || undefined,
  };
}

export class SocialHistoryRepository implements ISocialHistoryRepository {
  async getByPatientId(patientId: string): Promise<SocialHistoryRecord | null> {
    const db = await getDatabase();
    const results = await db.get<SocialHistoryModel>('social_histories')
      .query(Q.where('patient_id', patientId))
      .fetch();
    return results.length > 0 ? toRecord(results[0]) : null;
  }

  async save(record: SocialHistoryRecord): Promise<string> {
    const db = await getDatabase();
    const existing = await db.get<SocialHistoryModel>('social_histories')
      .query(Q.where('patient_id', record.patientId))
      .fetch();

    const now = new Date();

    if (existing.length > 0) {
      const existingRecord = existing[0];
      await db.write(async () => {
        await existingRecord.update((r) => {
          r.maritalStatus = record.maritalStatus ?? '';
          r.educationLevel = record.educationLevel ?? '';
          r.occupation = record.occupation ?? '';
          r.livingArea = record.livingArea ?? '';
          r.familyStructure = record.familyStructure ?? '';
          r.incomeLevel = record.incomeLevel ?? '';
          r.smoking = record.smoking;
          r.cigarettesPerDay = record.cigarettesPerDay ?? 0;
          r.yearsSmoked = record.yearsSmoked ?? 0;
          r.alcoholSubstanceUse = record.alcoholSubstanceUse;
          r.physicalActivity = record.physicalActivity;
          r.activityDescription = record.activityDescription ?? '';
          r.dietaryHistory = record.dietaryHistory ?? '';
          r.foodAllergies = record.foodAllergies ?? '';
          r.specialDietBeforeAdmission = record.specialDietBeforeAdmission;
          r.comments = record.comments ?? '';
          r.updatedAt = now;
        });
      });
      return existingRecord.id;
    }

    const result = await db.write(async () => {
      const collection = db.get<SocialHistoryModel>('social_histories');
      return collection.create((r) => {
        r.patientId = record.patientId;
        r.maritalStatus = record.maritalStatus ?? '';
        r.educationLevel = record.educationLevel ?? '';
        r.occupation = record.occupation ?? '';
        r.livingArea = record.livingArea ?? '';
        r.familyStructure = record.familyStructure ?? '';
        r.incomeLevel = record.incomeLevel ?? '';
        r.smoking = record.smoking;
        r.cigarettesPerDay = record.cigarettesPerDay ?? 0;
        r.yearsSmoked = record.yearsSmoked ?? 0;
        r.alcoholSubstanceUse = record.alcoholSubstanceUse;
        r.physicalActivity = record.physicalActivity;
        r.activityDescription = record.activityDescription ?? '';
        r.dietaryHistory = record.dietaryHistory ?? '';
        r.foodAllergies = record.foodAllergies ?? '';
        r.specialDietBeforeAdmission = record.specialDietBeforeAdmission;
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
      const record = await db.get<SocialHistoryModel>('social_histories').find(id);
      await record.markAsDeleted();
    });
  }
}
