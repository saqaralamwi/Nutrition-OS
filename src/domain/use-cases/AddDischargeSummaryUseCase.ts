import { DischargeSummaryRecord } from '../repositories/IDischargeRepository';
import { DischargeRepository } from '../../data/repositories/DischargeRepository';
import { PatientRepository } from '../../data/repositories/PatientRepository';

export interface AddDischargeSummaryInput {
  patientId: string;
  dischargeDate: number;
  dischargeStatus: string;
  finalWeight: number;
  totalDaysOnEn?: number;
  totalDaysOnPn?: number;
  homeNutritionPlan: string;
  followUpRequired: boolean;
  nextFollowUpDate?: number;
  finalEnergyIntake: number;
  finalProteinIntake: number;
  finalFluidIntake: number;
  weightChangeKg?: number;
  nutritionCompliance: number;
  dischargeNutritionRecommendation: string;
  followupNeededDays?: number;
  complicationsRelatedToNutrition?: boolean;
  complicationsNotes?: string;
  nextEnergyTargetKcal?: number;
}

export class AddDischargeSummaryUseCase {
  private dischargeRepository: DischargeRepository;
  private patientRepository: PatientRepository;

  constructor() {
    this.dischargeRepository = new DischargeRepository();
    this.patientRepository = new PatientRepository();
  }

  async execute(input: AddDischargeSummaryInput): Promise<string> {
    const patient = await this.patientRepository.findById(input.patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    patient.status = 'discharged';
    await this.patientRepository.update(patient);

    const record: DischargeSummaryRecord = {
      patientId: input.patientId,
      dischargeDate: input.dischargeDate,
      dischargeStatus: input.dischargeStatus,
      finalWeight: input.finalWeight,
      totalDaysOnEn: input.totalDaysOnEn,
      totalDaysOnPn: input.totalDaysOnPn,
      homeNutritionPlan: input.homeNutritionPlan,
      followUpRequired: input.followUpRequired,
      nextFollowUpDate: input.nextFollowUpDate,
      finalEnergyIntake: input.finalEnergyIntake,
      finalProteinIntake: input.finalProteinIntake,
      finalFluidIntake: input.finalFluidIntake,
      weightChangeKg: input.weightChangeKg,
      nutritionCompliance: input.nutritionCompliance,
      dischargeNutritionRecommendation: input.dischargeNutritionRecommendation,
      followupNeededDays: input.followupNeededDays,
      complicationsRelatedToNutrition: input.complicationsRelatedToNutrition,
      complicationsNotes: input.complicationsNotes,
      nextEnergyTargetKcal: input.nextEnergyTargetKcal,
    };

    return this.dischargeRepository.create(record);
  }
}
