import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../database';
import InterventionModel from '../models/Intervention';
import { IInterventionRepository, InterventionRecord } from '../../domain/repositories/IInterventionRepository';
import { Intervention } from '../../domain/entities/Intervention';

function toRecord(model: InterventionModel): Intervention {
  return {
    id: model.id,
    patientId: model.patientId,
    nutritionDiagnosis: model.nutritionDiagnosis,
    mainGoal: model.mainGoal,
    dietType: model.dietType,
    foodTexture: model.foodTexture,
    routeOfFeeding: model.routeOfFeeding,
    targetCalories: model.targetCalories ?? undefined,
    targetProtein: model.targetProtein ?? undefined,
    targetCarbohydrates: model.targetCarbohydrates ?? undefined,
    targetFat: model.targetFat ?? undefined,
    fluidAllowance: model.fluidAllowance ?? undefined,
    dietModifications: model.dietModifications || undefined,
    dietRecommendations: model.dietRecommendations || undefined,
    supplementPlan: model.supplementPlan || undefined,
    behavioralInstructions: model.behavioralInstructions || undefined,
    followUpInterval: model.followUpInterval,
    linkedFindings: model.linkedFindings || undefined,
    status: model.status,
    supersededBy: model.supersededBy || undefined,
    comments: model.comments || undefined,
    createdAt: model.createdAt?.toISOString() || undefined,
    updatedAt: model.updatedAt?.toISOString() || undefined,
  };
}

export class InterventionRepository implements IInterventionRepository {
  async getByPatientId(patientId: string): Promise<InterventionRecord[]> {
    const db = await getDatabase();
    const results = await db.get<InterventionModel>('interventions')
      .query(
        Q.where('patient_id', patientId),
        Q.sortBy('created_at', 'desc'),
      ).fetch();
    return results.map(toRecord);
  }

  async getActiveByPatientId(patientId: string): Promise<InterventionRecord | null> {
    const db = await getDatabase();
    const results = await db.get<InterventionModel>('interventions')
      .query(
        Q.where('patient_id', patientId),
        Q.where('status', 'active'),
        Q.sortBy('created_at', 'desc'),
      ).fetch();
    return results.length > 0 ? toRecord(results[0]) : null;
  }

  async save(record: InterventionRecord): Promise<string> {
    const db = await getDatabase();
    const now = new Date();

    if (record.id) {
      const existing = await db.get<InterventionModel>('interventions').find(record.id);
      await db.write(async () => {
        await existing.update((r) => {
          r.nutritionDiagnosis = record.nutritionDiagnosis;
          r.mainGoal = record.mainGoal;
          r.dietType = record.dietType;
          r.foodTexture = record.foodTexture;
          r.routeOfFeeding = record.routeOfFeeding;
          r.targetCalories = record.targetCalories ?? 0;
          r.targetProtein = record.targetProtein ?? 0;
          r.targetCarbohydrates = record.targetCarbohydrates ?? 0;
          r.targetFat = record.targetFat ?? 0;
          r.fluidAllowance = record.fluidAllowance ?? 0;
          r.dietModifications = record.dietModifications ?? '';
          r.dietRecommendations = record.dietRecommendations ?? '';
          r.supplementPlan = record.supplementPlan ?? '';
          r.behavioralInstructions = record.behavioralInstructions ?? '';
          r.followUpInterval = record.followUpInterval;
          r.linkedFindings = record.linkedFindings ?? '';
          r.status = record.status || 'active';
          r.supersededBy = record.supersededBy ?? '';
          r.comments = record.comments ?? '';
          r.updatedAt = now;
        });
      });
      return existing.id;
    }

    const result = await db.write(async () => {
      const collection = db.get<InterventionModel>('interventions');
      return collection.create((r) => {
        r.patientId = record.patientId;
        r.nutritionDiagnosis = record.nutritionDiagnosis;
        r.mainGoal = record.mainGoal;
        r.dietType = record.dietType;
        r.foodTexture = record.foodTexture;
        r.routeOfFeeding = record.routeOfFeeding;
        r.targetCalories = record.targetCalories ?? 0;
        r.targetProtein = record.targetProtein ?? 0;
        r.targetCarbohydrates = record.targetCarbohydrates ?? 0;
        r.targetFat = record.targetFat ?? 0;
        r.fluidAllowance = record.fluidAllowance ?? 0;
        r.dietModifications = record.dietModifications ?? '';
        r.dietRecommendations = record.dietRecommendations ?? '';
        r.supplementPlan = record.supplementPlan ?? '';
        r.behavioralInstructions = record.behavioralInstructions ?? '';
        r.followUpInterval = record.followUpInterval;
        r.linkedFindings = record.linkedFindings ?? '';
        r.status = record.status || 'active';
        r.supersededBy = record.supersededBy ?? '';
        r.comments = record.comments ?? '';
        r.createdAt = now;
        r.updatedAt = now;
      });
    });
    return result.id;
  }

  async update(record: InterventionRecord): Promise<void> {
    await this.save(record);
  }

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.write(async () => {
      const record = await db.get<InterventionModel>('interventions').find(id);
      await record.markAsDeleted();
    });
  }
}
