import {
  BurnsAssessment,
  BurnsNutritionPlan,
  BurnsMonitoring,
} from '../types/burns';

export interface BurnsRepository {
  createAssessment(assessment: BurnsAssessment): Promise<BurnsAssessment>;
  getAssessment(id: string): Promise<BurnsAssessment | null>;
  updateAssessment(id: string, assessment: BurnsAssessment): Promise<BurnsAssessment | null>;
  deleteAssessment(id: string): Promise<boolean>;
  listAssessments(patientId: string): Promise<BurnsAssessment[]>;

  createPlan(plan: BurnsNutritionPlan): Promise<BurnsNutritionPlan>;
  getPlan(id: string): Promise<BurnsNutritionPlan | null>;
  updatePlan(id: string, plan: BurnsNutritionPlan): Promise<BurnsNutritionPlan | null>;
  deletePlan(id: string): Promise<boolean>;
  listPlans(patientId: string): Promise<BurnsNutritionPlan[]>;
  getActivePlan(patientId: string): Promise<BurnsNutritionPlan | null>;

  createMonitoring(monitoring: BurnsMonitoring): Promise<BurnsMonitoring>;
  getMonitoring(id: string): Promise<BurnsMonitoring | null>;
  updateMonitoring(id: string, monitoring: BurnsMonitoring): Promise<BurnsMonitoring | null>;
  deleteMonitoring(id: string): Promise<boolean>;
  listMonitoring(patientId: string): Promise<BurnsMonitoring[]>;
  getRecentMonitoring(patientId: string, limit: number): Promise<BurnsMonitoring[]>;

  validateAssessment(assessment: BurnsAssessment): Promise<{ valid: boolean; errors: string[] }>;
  validatePlan(plan: BurnsNutritionPlan): Promise<{ valid: boolean; errors: string[] }>;
}

export class BurnsRepositoryImpl implements BurnsRepository {
  private assessments = new Map<string, BurnsAssessment>();
  private plans = new Map<string, BurnsNutritionPlan>();
  private monitoring = new Map<string, BurnsMonitoring>();

  async createAssessment(assessment: BurnsAssessment): Promise<BurnsAssessment> {
    const { valid, errors } = await this.validateAssessment(assessment);
    if (!valid) throw new Error(`Validation failed: ${errors.join(', ')}`);
    this.assessments.set(assessment.id!, assessment);
    return assessment;
  }

  async getAssessment(id: string): Promise<BurnsAssessment | null> {
    return this.assessments.get(id) || null;
  }

  async updateAssessment(id: string, assessment: BurnsAssessment): Promise<BurnsAssessment | null> {
    if (!this.assessments.has(id)) return null;
    const { valid, errors } = await this.validateAssessment(assessment);
    if (!valid) throw new Error(`Validation failed: ${errors.join(', ')}`);
    this.assessments.set(id, assessment);
    return assessment;
  }

  async deleteAssessment(id: string): Promise<boolean> {
    return this.assessments.delete(id);
  }

  async listAssessments(patientId: string): Promise<BurnsAssessment[]> {
    return Array.from(this.assessments.values()).filter((a) => a.patientId === patientId);
  }

  async createPlan(plan: BurnsNutritionPlan): Promise<BurnsNutritionPlan> {
    const { valid, errors } = await this.validatePlan(plan);
    if (!valid) throw new Error(`Validation failed: ${errors.join(', ')}`);
    this.plans.set(plan.id!, plan);
    return plan;
  }

  async getPlan(id: string): Promise<BurnsNutritionPlan | null> {
    return this.plans.get(id) || null;
  }

  async updatePlan(id: string, plan: BurnsNutritionPlan): Promise<BurnsNutritionPlan | null> {
    if (!this.plans.has(id)) return null;
    const { valid, errors } = await this.validatePlan(plan);
    if (!valid) throw new Error(`Validation failed: ${errors.join(', ')}`);
    this.plans.set(id, plan);
    return plan;
  }

  async deletePlan(id: string): Promise<boolean> {
    return this.plans.delete(id);
  }

  async listPlans(patientId: string): Promise<BurnsNutritionPlan[]> {
    return Array.from(this.plans.values()).filter((p) => p.patientId === patientId);
  }

  async getActivePlan(patientId: string): Promise<BurnsNutritionPlan | null> {
    return Array.from(this.plans.values()).find((p) => p.patientId === patientId && p.isActive) || null;
  }

  async createMonitoring(monitoring: BurnsMonitoring): Promise<BurnsMonitoring> {
    this.monitoring.set(monitoring.id!, monitoring);
    return monitoring;
  }

  async getMonitoring(id: string): Promise<BurnsMonitoring | null> {
    return this.monitoring.get(id) || null;
  }

  async updateMonitoring(id: string, monitoring: BurnsMonitoring): Promise<BurnsMonitoring | null> {
    if (!this.monitoring.has(id)) return null;
    this.monitoring.set(id, monitoring);
    return monitoring;
  }

  async deleteMonitoring(id: string): Promise<boolean> {
    return this.monitoring.delete(id);
  }

  async listMonitoring(patientId: string): Promise<BurnsMonitoring[]> {
    return Array.from(this.monitoring.values()).filter((m) => m.patientId === patientId);
  }

  async getRecentMonitoring(patientId: string, limit: number): Promise<BurnsMonitoring[]> {
    return Array.from(this.monitoring.values())
      .filter((m) => m.patientId === patientId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit);
  }

  async validateAssessment(assessment: BurnsAssessment): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    if (assessment.totalBodySurfaceArea < 0 || assessment.totalBodySurfaceArea > 100) errors.push('Invalid TBSA');
    if (assessment.painLevel < 0 || assessment.painLevel > 10) errors.push('Invalid pain level');
    if (assessment.weight <= 0 || assessment.weight > 300) errors.push('Invalid weight');
    return { valid: errors.length === 0, errors };
  }

  async validatePlan(plan: BurnsNutritionPlan): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    if (plan.totalCalories < 1500 || plan.totalCalories > 6000) errors.push('Invalid calorie target');
    if (plan.proteinPerKg < 1 || plan.proteinPerKg > 3) errors.push('Invalid protein per kg');
    return { valid: errors.length === 0, errors };
  }
}

export const burnsRepository = new BurnsRepositoryImpl();
