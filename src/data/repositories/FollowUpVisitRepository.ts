import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../database';
import FollowUpVisitModel from '../models/FollowUpVisit';
import { IFollowUpVisitRepository, FollowUpVisitRecord } from '../../domain/repositories/IFollowUpVisitRepository';

function toRecord(model: FollowUpVisitModel): FollowUpVisitRecord {
  return {
    id: model.id,
    patientId: model.patientId,
    interventionId: model.interventionId,
    visitDate: model.visitDate?.getTime() || Date.now(),
    currentWeight: model.currentWeight,
    height: model.height ?? undefined,
    bmi: model.bmi ?? undefined,
    edema: model.edema,
    dehydration: model.dehydration,
    stoolFrequency: model.stoolFrequency ?? undefined,
    stoolConsistency: model.stoolConsistency || undefined,
    enteralTolerance: model.enteralTolerance,
    parenteralTolerance: model.parenteralTolerance,
    fluidIntake: model.fluidIntake ?? undefined,
    fluidOutput: model.fluidOutput ?? undefined,
    gastricResidual: model.gastricResidual ?? undefined,
    respiratoryStatus: model.respiratoryStatus,
    drugNutrientConsequences: model.drugNutrientConsequences || undefined,
    overallProgress: model.overallProgress,
    planSuccessful: model.planSuccessful,
    replanRequired: !!model.replanRequired,
    replanNotes: model.replanNotes || undefined,
    comments: model.comments || undefined,
    createdAt: model.createdAt?.toISOString() || undefined,
    updatedAt: model.updatedAt?.toISOString() || undefined,
  };
}

export class FollowUpVisitRepository implements IFollowUpVisitRepository {
  async getByPatientId(patientId: string): Promise<FollowUpVisitRecord[]> {
    const db = await getDatabase();
    const results = await db.get<FollowUpVisitModel>('follow_up_visits')
      .query(
        Q.where('patient_id', patientId),
        Q.sortBy('visit_date', 'desc'),
      ).fetch();
    return results.map(toRecord);
  }

  async create(record: FollowUpVisitRecord): Promise<string> {
    const db = await getDatabase();
    const now = new Date();
    const result = await db.write(async () => {
      const collection = db.get<FollowUpVisitModel>('follow_up_visits');
      return collection.create((r) => {
        r.patientId = record.patientId;
        r.interventionId = record.interventionId;
        r.visitDate = new Date(record.visitDate);
        r.currentWeight = record.currentWeight;
        r.height = record.height ?? 0;
        r.bmi = record.bmi ?? 0;
        r.edema = record.edema;
        r.dehydration = record.dehydration;
        r.stoolFrequency = record.stoolFrequency ?? 0;
        r.stoolConsistency = record.stoolConsistency ?? '';
        r.enteralTolerance = record.enteralTolerance;
        r.parenteralTolerance = record.parenteralTolerance;
        r.fluidIntake = record.fluidIntake ?? 0;
        r.fluidOutput = record.fluidOutput ?? 0;
        r.gastricResidual = record.gastricResidual ?? 0;
        r.respiratoryStatus = record.respiratoryStatus;
        r.drugNutrientConsequences = record.drugNutrientConsequences ?? '';
        r.overallProgress = record.overallProgress;
        r.planSuccessful = record.planSuccessful;
        r.replanRequired = record.replanRequired;
        r.replanNotes = record.replanNotes ?? '';
        r.comments = record.comments ?? '';
        r.createdAt = now;
        r.updatedAt = now;
      });
    });
    return result.id;
  }
}
