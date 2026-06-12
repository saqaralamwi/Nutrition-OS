export interface InterventionRecord {
  id?: string;
  patientId: string;
  nutritionDiagnosis: string;
  mainGoal: string;
  dietType: string;
  foodTexture: string;
  routeOfFeeding: string;
  targetCalories?: number;
  targetProtein?: number;
  targetCarbohydrates?: number;
  targetFat?: number;
  fluidAllowance?: number;
  dietModifications?: string;
  dietRecommendations?: string;
  supplementPlan?: string;
  behavioralInstructions?: string;
  followUpInterval: string;
  linkedFindings?: string;
  status: string;
  supersededBy?: string;
  comments?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IInterventionRepository {
  getByPatientId(patientId: string): Promise<InterventionRecord[]>;
  getActiveByPatientId(patientId: string): Promise<InterventionRecord | null>;
  save(record: InterventionRecord): Promise<string>;
  update(record: InterventionRecord): Promise<void>;
  delete(id: string): Promise<void>;
}
