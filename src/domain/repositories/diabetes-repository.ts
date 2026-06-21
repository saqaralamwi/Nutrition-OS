import { DiabetesAssessment, DiabetesNutritionPlan, DiabetesMonitoring } from '../types/diabetes';

export interface DiabetesRepository {
  createAssessment(assessment: DiabetesAssessment): Promise<DiabetesAssessment>;
  getAssessment(id: string): Promise<DiabetesAssessment | null>;
  updateAssessment(id: string, assessment: DiabetesAssessment): Promise<DiabetesAssessment | null>;
  deleteAssessment(id: string): Promise<boolean>;
  listAssessments(patientId: string): Promise<DiabetesAssessment[]>;

  createPlan(plan: DiabetesNutritionPlan): Promise<DiabetesNutritionPlan>;
  getPlan(id: string): Promise<DiabetesNutritionPlan | null>;
  updatePlan(id: string, plan: DiabetesNutritionPlan): Promise<DiabetesNutritionPlan | null>;
  deletePlan(id: string): Promise<boolean>;
  listPlans(patientId: string): Promise<DiabetesNutritionPlan[]>;
  getActivePlan(patientId: string): Promise<DiabetesNutritionPlan | null>;

  createMonitoring(monitoring: DiabetesMonitoring): Promise<DiabetesMonitoring>;
  getMonitoring(id: string): Promise<DiabetesMonitoring | null>;
  updateMonitoring(id: string, monitoring: DiabetesMonitoring): Promise<DiabetesMonitoring | null>;
  deleteMonitoring(id: string): Promise<boolean>;
  listMonitoring(patientId: string): Promise<DiabetesMonitoring[]>;
  getRecentMonitoring(patientId: string, limit: number): Promise<DiabetesMonitoring[]>;

  validateAssessment(assessment: DiabetesAssessment): Promise<{ valid: boolean; errors: string[] }>;
  validatePlan(plan: DiabetesNutritionPlan): Promise<{ valid: boolean; errors: string[] }>;
}

export class DiabetesRepositoryImpl implements DiabetesRepository {
  private assessments = new Map<string, DiabetesAssessment>();
  private plans = new Map<string, DiabetesNutritionPlan>();
  private monitoring = new Map<string, DiabetesMonitoring>();

  async createAssessment(assessment: DiabetesAssessment): Promise<DiabetesAssessment> {
    const { valid, errors } = await this.validateAssessment(assessment);
    if (!valid) throw new Error(`Validation failed: ${errors.join(', ')}`);
    this.assessments.set(assessment.id!, assessment);
    return assessment;
  }

  async getAssessment(id: string): Promise<DiabetesAssessment | null> {
    return this.assessments.get(id) || null;
  }

  async updateAssessment(id: string, assessment: DiabetesAssessment): Promise<DiabetesAssessment | null> {
    if (!this.assessments.has(id)) return null;
    const { valid, errors } = await this.validateAssessment(assessment);
    if (!valid) throw new Error(`Validation failed: ${errors.join(', ')}`);
    this.assessments.set(id, assessment);
    return assessment;
  }

  async deleteAssessment(id: string): Promise<boolean> {
    return this.assessments.delete(id);
  }

  async listAssessments(patientId: string): Promise<DiabetesAssessment[]> {
    return Array.from(this.assessments.values()).filter((a) => a.patientId === patientId);
  }

  async createPlan(plan: DiabetesNutritionPlan): Promise<DiabetesNutritionPlan> {
    const { valid, errors } = await this.validatePlan(plan);
    if (!valid) throw new Error(`Validation failed: ${errors.join(', ')}`);
    this.plans.set(plan.id!, plan);
    return plan;
  }

  async getPlan(id: string): Promise<DiabetesNutritionPlan | null> {
    return this.plans.get(id) || null;
  }

  async updatePlan(id: string, plan: DiabetesNutritionPlan): Promise<DiabetesNutritionPlan | null> {
    if (!this.plans.has(id)) return null;
    const { valid, errors } = await this.validatePlan(plan);
    if (!valid) throw new Error(`Validation failed: ${errors.join(', ')}`);
    this.plans.set(id, plan);
    return plan;
  }

  async deletePlan(id: string): Promise<boolean> {
    return this.plans.delete(id);
  }

  async listPlans(patientId: string): Promise<DiabetesNutritionPlan[]> {
    return Array.from(this.plans.values()).filter((p) => p.patientId === patientId);
  }

  async getActivePlan(patientId: string): Promise<DiabetesNutritionPlan | null> {
    return Array.from(this.plans.values()).find((p) => p.patientId === patientId && p.isActive) || null;
  }

  async createMonitoring(monitoring: DiabetesMonitoring): Promise<DiabetesMonitoring> {
    this.monitoring.set(monitoring.id!, monitoring);
    return monitoring;
  }

  async getMonitoring(id: string): Promise<DiabetesMonitoring | null> {
    return this.monitoring.get(id) || null;
  }

  async updateMonitoring(id: string, monitoring: DiabetesMonitoring): Promise<DiabetesMonitoring | null> {
    if (!this.monitoring.has(id)) return null;
    this.monitoring.set(id, monitoring);
    return monitoring;
  }

  async deleteMonitoring(id: string): Promise<boolean> {
    return this.monitoring.delete(id);
  }

  async listMonitoring(patientId: string): Promise<DiabetesMonitoring[]> {
    return Array.from(this.monitoring.values()).filter((m) => m.patientId === patientId);
  }

  async getRecentMonitoring(patientId: string, limit: number): Promise<DiabetesMonitoring[]> {
    return Array.from(this.monitoring.values())
      .filter((m) => m.patientId === patientId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit);
  }

  async validateAssessment(assessment: DiabetesAssessment): Promise<{ valid: boolean; errors: string[] }> {
    const { validateDiabetesAssessment } = await import('../types/diabetes');
    return validateDiabetesAssessment(assessment);
  }

  async validatePlan(plan: DiabetesNutritionPlan): Promise<{ valid: boolean; errors: string[] }> {
    const { validateDiabetesNutritionPlan } = await import('../types/diabetes');
    return validateDiabetesNutritionPlan(plan);
  }
}

export const diabetesRepository = new DiabetesRepositoryImpl();
