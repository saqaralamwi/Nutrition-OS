export interface FollowUpVisit {
  id?: string;
  patientId: string;
  interventionId: string;
  visitDate: string;
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
  createdAt?: string;
  updatedAt?: string;
}
