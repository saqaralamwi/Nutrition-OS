import { NutritionPlan } from '../entities/NutritionPlan';

export interface INutritionPlanRepository {
  save(plan: NutritionPlan): Promise<string>;
  getByPatientId(patientId: string): Promise<NutritionPlan[]>;
  getLatestByPatientId(patientId: string): Promise<NutritionPlan | null>;
  updateNotes(id: string, notes: string): Promise<void>;
}
