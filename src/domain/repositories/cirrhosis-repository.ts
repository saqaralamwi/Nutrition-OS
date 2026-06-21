import {
  CirrhosisAssessment,
  CirrhosisNutritionPlan,
  CirrhosisMonitoring,
} from '../types/cirrhosis';

export interface CirrhosisRepository {
  createAssessment(assessment: CirrhosisAssessment): Promise<CirrhosisAssessment>;
  getAssessment(id: string): Promise<CirrhosisAssessment | null>;
  updateAssessment(id: string, assessment: CirrhosisAssessment): Promise<CirrhosisAssessment | null>;
  deleteAssessment(id: string): Promise<boolean>;
  listAssessments(patientId: string): Promise<CirrhosisAssessment[]>;

  createPlan(plan: CirrhosisNutritionPlan): Promise<CirrhosisNutritionPlan>;
  getPlan(id: string): Promise<CirrhosisNutritionPlan | null>;
  updatePlan(id: string, plan: CirrhosisNutritionPlan): Promise<CirrhosisNutritionPlan | null>;
  deletePlan(id: string): Promise<boolean>;
  listPlans(patientId: string): Promise<CirrhosisNutritionPlan[]>;
  getActivePlan(patientId: string): Promise<CirrhosisNutritionPlan | null>;

  createMonitoring(monitoring: CirrhosisMonitoring): Promise<CirrhosisMonitoring>;
  getMonitoring(id: string): Promise<CirrhosisMonitoring | null>;
  updateMonitoring(id: string, monitoring: CirrhosisMonitoring): Promise<CirrhosisMonitoring | null>;
  deleteMonitoring(id: string): Promise<boolean>;
  listMonitoring(patientId: string): Promise<CirrhosisMonitoring[]>;
  getRecentMonitoring(patientId: string, limit: number): Promise<CirrhosisMonitoring[]>;

  validateAssessment(assessment: CirrhosisAssessment): Promise<{ valid: boolean; errors: string[] }>;
  validatePlan(plan: CirrhosisNutritionPlan): Promise<{ valid: boolean; errors: string[] }>;
}

export class CirrhosisRepositoryImpl implements CirrhosisRepository {
  private assessments = new Map<string, CirrhosisAssessment>();
  private plans = new Map<string, CirrhosisNutritionPlan>();
  private monitoring = new Map<string, CirrhosisMonitoring>();

  async createAssessment(assessment: CirrhosisAssessment): Promise<CirrhosisAssessment> {
    const { valid, errors } = await this.validateAssessment(assessment);
    if (!valid) throw new Error(`Validation failed: ${errors.join(', ')}`);
    this.assessments.set(assessment.id!, assessment);
    return assessment;
  }

  async getAssessment(id: string): Promise<CirrhosisAssessment | null> {
    return this.assessments.get(id) || null;
  }

  async updateAssessment(id: string, assessment: CirrhosisAssessment): Promise<CirrhosisAssessment | null> {
    if (!this.assessments.has(id)) return null;
    const { valid, errors } = await this.validateAssessment(assessment);
    if (!valid) throw new Error(`Validation failed: ${errors.join(', ')}`);
    this.assessments.set(id, assessment);
    return assessment;
  }

  async deleteAssessment(id: string): Promise<boolean> {
    return this.assessments.delete(id);
  }

  async listAssessments(patientId: string): Promise<CirrhosisAssessment[]> {
    return Array.from(this.assessments.values()).filter((a) => a.patientId === patientId);
  }

  async createPlan(plan: CirrhosisNutritionPlan): Promise<CirrhosisNutritionPlan> {
    const { valid, errors } = await this.validatePlan(plan);
    if (!valid) throw new Error(`Validation failed: ${errors.join(', ')}`);
    this.plans.set(plan.id!, plan);
    return plan;
  }

  async getPlan(id: string): Promise<CirrhosisNutritionPlan | null> {
    return this.plans.get(id) || null;
  }

  async updatePlan(id: string, plan: CirrhosisNutritionPlan): Promise<CirrhosisNutritionPlan | null> {
    if (!this.plans.has(id)) return null;
    const { valid, errors } = await this.validatePlan(plan);
    if (!valid) throw new Error(`Validation failed: ${errors.join(', ')}`);
    this.plans.set(id, plan);
    return plan;
  }

  async deletePlan(id: string): Promise<boolean> {
    return this.plans.delete(id);
  }

  async listPlans(patientId: string): Promise<CirrhosisNutritionPlan[]> {
    return Array.from(this.plans.values()).filter((p) => p.patientId === patientId);
  }

  async getActivePlan(patientId: string): Promise<CirrhosisNutritionPlan | null> {
    return Array.from(this.plans.values()).find((p) => p.patientId === patientId && p.isActive) || null;
  }

  async createMonitoring(monitoring: CirrhosisMonitoring): Promise<CirrhosisMonitoring> {
    this.monitoring.set(monitoring.id!, monitoring);
    return monitoring;
  }

  async getMonitoring(id: string): Promise<CirrhosisMonitoring | null> {
    return this.monitoring.get(id) || null;
  }

  async updateMonitoring(id: string, monitoring: CirrhosisMonitoring): Promise<CirrhosisMonitoring | null> {
    if (!this.monitoring.has(id)) return null;
    this.monitoring.set(id, monitoring);
    return monitoring;
  }

  async deleteMonitoring(id: string): Promise<boolean> {
    return this.monitoring.delete(id);
  }

  async listMonitoring(patientId: string): Promise<CirrhosisMonitoring[]> {
    return Array.from(this.monitoring.values()).filter((m) => m.patientId === patientId);
  }

  async getRecentMonitoring(patientId: string, limit: number): Promise<CirrhosisMonitoring[]> {
    return Array.from(this.monitoring.values())
      .filter((m) => m.patientId === patientId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit);
  }

  async validateAssessment(assessment: CirrhosisAssessment): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    if (assessment.bilirubin < 0.1 || assessment.bilirubin > 50) errors.push('Invalid bilirubin');
    if (assessment.ammonia < 10 || assessment.ammonia > 200) errors.push('Invalid ammonia');
    if (assessment.weight <= 0 || assessment.weight > 300) errors.push('Invalid weight');
    return { valid: errors.length === 0, errors };
  }

  async validatePlan(plan: CirrhosisNutritionPlan): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    if (plan.sodiumMg < 500 || plan.sodiumMg > 5000) errors.push('Invalid sodium target');
    if (plan.proteinPerKg < 0.8 || plan.proteinPerKg > 2) errors.push('Invalid protein per kg');
    return { valid: errors.length === 0, errors };
  }
}

export const cirrhosisRepository = new CirrhosisRepositoryImpl();
