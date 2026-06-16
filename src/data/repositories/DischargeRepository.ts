import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../database';
import DischargeSummaryModel from '../models/DischargeSummary';
import { IDischargeRepository, DischargeSummaryRecord } from '../../domain/repositories/IDischargeRepository';

function toRecord(model: DischargeSummaryModel): DischargeSummaryRecord {
  return {
    id: model.id,
    patientId: model.patientId,
    dischargeDate: model.dischargeDate?.getTime() || Date.now(),
    dischargeStatus: model.dischargeStatus,
    finalWeight: model.finalWeight,
    totalDaysOnEn: model.totalDaysOnEn ?? undefined,
    totalDaysOnPn: model.totalDaysOnPn ?? undefined,
    homeNutritionPlan: model.homeNutritionPlan,
    followUpRequired: model.followUpRequired,
    nextFollowUpDate: model.nextFollowUpDate?.getTime() ?? undefined,
    finalEnergyIntake: model.finalEnergyIntake,
    finalProteinIntake: model.finalProteinIntake,
    finalFluidIntake: model.finalFluidIntake,
    weightChangeKg: model.weightChangeKg ?? undefined,
    nutritionCompliance: model.nutritionCompliance,
    dischargeNutritionRecommendation: model.dischargeNutritionRecommendation,
    followupNeededDays: model.followupNeededDays ?? undefined,
    complicationsRelatedToNutrition: model.complicationsRelatedToNutrition ?? undefined,
    complicationsNotes: model.complicationsNotes ?? undefined,
    nextEnergyTargetKcal: model.nextEnergyTargetKcal ?? undefined,
    createdAt: model.createdAt?.toISOString() || undefined,
    updatedAt: model.updatedAt?.toISOString() || undefined,
  };
}

export class DischargeRepository implements IDischargeRepository {
  async getByPatientId(patientId: string): Promise<DischargeSummaryRecord | null> {
    const db = await getDatabase();
    const results = await db.get<DischargeSummaryModel>('discharge_summaries')
      .query(
        Q.where('patient_id', patientId),
        Q.sortBy('discharge_date', 'desc'),
      ).fetch();
    return results.length > 0 ? toRecord(results[0]) : null;
  }

  async create(record: DischargeSummaryRecord): Promise<string> {
    const db = await getDatabase();
    const now = new Date();
    const result = await db.write(async () => {
      const collection = db.get<DischargeSummaryModel>('discharge_summaries');
      return collection.create((r) => {
        r.patientId = record.patientId;
        r.dischargeDate = new Date(record.dischargeDate);
        r.dischargeStatus = record.dischargeStatus;
        r.finalWeight = record.finalWeight;
        r.totalDaysOnEn = record.totalDaysOnEn ?? undefined;
        r.totalDaysOnPn = record.totalDaysOnPn ?? undefined;
        r.homeNutritionPlan = record.homeNutritionPlan;
        r.followUpRequired = record.followUpRequired;
        r.nextFollowUpDate = record.nextFollowUpDate ? new Date(record.nextFollowUpDate) : undefined;
        r.finalEnergyIntake = record.finalEnergyIntake;
        r.finalProteinIntake = record.finalProteinIntake;
        r.finalFluidIntake = record.finalFluidIntake;
        r.weightChangeKg = record.weightChangeKg ?? undefined;
        r.nutritionCompliance = record.nutritionCompliance;
        r.dischargeNutritionRecommendation = record.dischargeNutritionRecommendation;
        r.followupNeededDays = record.followupNeededDays ?? undefined;
        r.complicationsRelatedToNutrition = record.complicationsRelatedToNutrition ?? undefined;
        r.complicationsNotes = record.complicationsNotes ?? undefined;
        r.nextEnergyTargetKcal = record.nextEnergyTargetKcal ?? undefined;
        r.createdAt = now;
        r.updatedAt = now;
      });
    });
    return result.id;
  }
}
