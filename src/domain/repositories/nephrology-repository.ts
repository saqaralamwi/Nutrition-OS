import {
  NephrologyAssessment,
  NephrologyNutritionPlan,
  NephrologyMonitoring,
} from '../types/nephrology';

export interface NephrologyRepository {
  createAssessment(assessment: NephrologyAssessment): Promise<NephrologyAssessment>;
  getAssessment(id: string): Promise<NephrologyAssessment | null>;
  updateAssessment(id: string, assessment: NephrologyAssessment): Promise<NephrologyAssessment | null>;
  deleteAssessment(id: string): Promise<boolean>;
  listAssessments(patientId: string): Promise<NephrologyAssessment[]>;

  createPlan(plan: NephrologyNutritionPlan): Promise<NephrologyNutritionPlan>;
  getPlan(id: string): Promise<NephrologyNutritionPlan | null>;
  updatePlan(id: string, plan: NephrologyNutritionPlan): Promise<NephrologyNutritionPlan | null>;
  deletePlan(id: string): Promise<boolean>;
  listPlans(patientId: string): Promise<NephrologyNutritionPlan[]>;
  getActivePlan(patientId: string): Promise<NephrologyNutritionPlan | null>;

  createMonitoring(monitoring: NephrologyMonitoring): Promise<NephrologyMonitoring>;
  getMonitoring(id: string): Promise<NephrologyMonitoring | null>;
  updateMonitoring(id: string, monitoring: NephrologyMonitoring): Promise<NephrologyMonitoring | null>;
  deleteMonitoring(id: string): Promise<boolean>;
  listMonitoring(patientId: string): Promise<NephrologyMonitoring[]>;
  getRecentMonitoring(patientId: string, limit: number): Promise<NephrologyMonitoring[]>;

  validateAssessment(assessment: NephrologyAssessment): Promise<{ valid: boolean; errors: string[] }>;
  validatePlan(plan: NephrologyNutritionPlan): Promise<{ valid: boolean; errors: string[] }>;
}

export class NephrologyRepositoryImpl implements NephrologyRepository {
  private assessments = new Map<string, NephrologyAssessment>();
  private plans = new Map<string, NephrologyNutritionPlan>();
  private monitoring = new Map<string, NephrologyMonitoring>();

  async createAssessment(assessment: NephrologyAssessment): Promise<NephrologyAssessment> {
    const { valid, errors } = await this.validateAssessment(assessment);
    if (!valid) throw new Error(`Validation failed: ${errors.join(', ')}`);
    this.assessments.set(assessment.id!, assessment);
    return assessment;
  }

  async getAssessment(id: string): Promise<NephrologyAssessment | null> {
    return this.assessments.get(id) || null;
  }

  async updateAssessment(id: string, assessment: NephrologyAssessment): Promise<NephrologyAssessment | null> {
    if (!this.assessments.has(id)) return null;
    const { valid, errors } = await this.validateAssessment(assessment);
    if (!valid) throw new Error(`Validation failed: ${errors.join(', ')}`);
    this.assessments.set(id, assessment);
    return assessment;
  }

  async deleteAssessment(id: string): Promise<boolean> {
    return this.assessments.delete(id);
  }

  async listAssessments(patientId: string): Promise<NephrologyAssessment[]> {
    return Array.from(this.assessments.values()).filter((a) => a.patientId === patientId);
  }

  async createPlan(plan: NephrologyNutritionPlan): Promise<NephrologyNutritionPlan> {
    const { valid, errors } = await this.validatePlan(plan);
    if (!valid) throw new Error(`Validation failed: ${errors.join(', ')}`);
    this.plans.set(plan.id!, plan);
    return plan;
  }

  async getPlan(id: string): Promise<NephrologyNutritionPlan | null> {
    return this.plans.get(id) || null;
  }

  async updatePlan(id: string, plan: NephrologyNutritionPlan): Promise<NephrologyNutritionPlan | null> {
    if (!this.plans.has(id)) return null;
    const { valid, errors } = await this.validatePlan(plan);
    if (!valid) throw new Error(`Validation failed: ${errors.join(', ')}`);
    this.plans.set(id, plan);
    return plan;
  }

  async deletePlan(id: string): Promise<boolean> {
    return this.plans.delete(id);
  }

  async listPlans(patientId: string): Promise<NephrologyNutritionPlan[]> {
    return Array.from(this.plans.values()).filter((p) => p.patientId === patientId);
  }

  async getActivePlan(patientId: string): Promise<NephrologyNutritionPlan | null> {
    return Array.from(this.plans.values()).find((p) => p.patientId === patientId && p.isActive) || null;
  }

  async createMonitoring(monitoring: NephrologyMonitoring): Promise<NephrologyMonitoring> {
    this.monitoring.set(monitoring.id!, monitoring);
    return monitoring;
  }

  async getMonitoring(id: string): Promise<NephrologyMonitoring | null> {
    return this.monitoring.get(id) || null;
  }

  async updateMonitoring(id: string, monitoring: NephrologyMonitoring): Promise<NephrologyMonitoring | null> {
    if (!this.monitoring.has(id)) return null;
    this.monitoring.set(id, monitoring);
    return monitoring;
  }

  async deleteMonitoring(id: string): Promise<boolean> {
    return this.monitoring.delete(id);
  }

  async listMonitoring(patientId: string): Promise<NephrologyMonitoring[]> {
    return Array.from(this.monitoring.values()).filter((m) => m.patientId === patientId);
  }

  async getRecentMonitoring(patientId: string, limit: number): Promise<NephrologyMonitoring[]> {
    return Array.from(this.monitoring.values())
      .filter((m) => m.patientId === patientId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit);
  }

  async validateAssessment(assessment: NephrologyAssessment): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    if (assessment.eGFR < 0 || assessment.eGFR > 120) errors.push('Invalid eGFR');
    if (assessment.creatinine < 0.5 || assessment.creatinine > 20) errors.push('Invalid creatinine');
    if (assessment.potassium < 2 || assessment.potassium > 8) errors.push('Invalid potassium');
    return { valid: errors.length === 0, errors };
  }

  async validatePlan(plan: NephrologyNutritionPlan): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    if (plan.proteinPerKg < 0.6 || plan.proteinPerKg > 2) errors.push('Invalid protein per kg');
    if (plan.fluidLimit < 500 || plan.fluidLimit > 3000) errors.push('Invalid fluid limit');
    return { valid: errors.length === 0, errors };
  }
}

export const nephrologyRepository = new NephrologyRepositoryImpl();
