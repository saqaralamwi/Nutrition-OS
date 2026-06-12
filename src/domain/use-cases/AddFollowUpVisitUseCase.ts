import { FollowUpVisitRecord } from '../repositories/IFollowUpVisitRepository';
import { FollowUpVisitRepository } from '../../data/repositories/FollowUpVisitRepository';
import { GetActiveInterventionUseCase } from './GetActiveInterventionUseCase';

export interface AddFollowUpVisitInput {
  patientId: string;
  visitDate: number;
  currentWeight: number;
  height?: number;
  bmi?: number;
  edema: string;
  dehydration: string;
  stoolFrequency?: number;
  stoolConsistency?: string;
  enteralTolerance: string;
  parenteralTolerance: string;
  fluidIntake?: number;
  fluidOutput?: number;
  gastricResidual?: number;
  respiratoryStatus: string;
  drugNutrientConsequences?: string;
  overallProgress: string;
  planSuccessful: string;
  replanRequired: boolean;
  replanNotes?: string;
  comments?: string;
}

export class AddFollowUpVisitUseCase {
  private repository: FollowUpVisitRepository;
  private getActiveIntervention: GetActiveInterventionUseCase;

  constructor() {
    this.repository = new FollowUpVisitRepository();
    this.getActiveIntervention = new GetActiveInterventionUseCase();
  }

  async execute(input: AddFollowUpVisitInput): Promise<string> {
    const activeIntervention = await this.getActiveIntervention.execute(input.patientId);
    if (!activeIntervention) {
      throw new Error('لا توجد خطة تدخل نشطة. يجب إنشاء خطة تدخل أولاً.');
    }

    const record: FollowUpVisitRecord = {
      patientId: input.patientId,
      interventionId: activeIntervention.id!,
      visitDate: input.visitDate,
      currentWeight: input.currentWeight,
      height: input.height,
      bmi: input.bmi,
      edema: input.edema,
      dehydration: input.dehydration,
      stoolFrequency: input.stoolFrequency,
      stoolConsistency: input.stoolConsistency,
      enteralTolerance: input.enteralTolerance,
      parenteralTolerance: input.parenteralTolerance,
      fluidIntake: input.fluidIntake,
      fluidOutput: input.fluidOutput,
      gastricResidual: input.gastricResidual,
      respiratoryStatus: input.respiratoryStatus,
      drugNutrientConsequences: input.drugNutrientConsequences,
      overallProgress: input.overallProgress,
      planSuccessful: input.planSuccessful,
      replanRequired: input.replanRequired,
      replanNotes: input.replanNotes,
      comments: input.comments,
    };

    return this.repository.create(record);
  }
}
