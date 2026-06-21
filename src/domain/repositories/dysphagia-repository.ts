import {
  DysphagiaAssessment,
  DysphagiaNutritionPlan,
  DysphagiaMonitoring,
} from '../types/dysphagia';

export interface DysphagiaRepository {
  createAssessment(assessment: DysphagiaAssessment): Promise<DysphagiaAssessment>;
  getAssessment(id: string): Promise<DysphagiaAssessment | null>;
  updateAssessment(id: string, assessment: DysphagiaAssessment): Promise<DysphagiaAssessment | null>;
  deleteAssessment(id: string): Promise<boolean>;
  listAssessments(patientId: string): Promise<DysphagiaAssessment[]>;

  createPlan(plan: DysphagiaNutritionPlan): Promise<DysphagiaNutritionPlan>;
  getPlan(id: string): Promise<DysphagiaNutritionPlan | null>;
  updatePlan(id: string, plan: DysphagiaNutritionPlan): Promise<DysphagiaNutritionPlan | null>;
  deletePlan(id: string): Promise<boolean>;
  listPlans(patientId: string): Promise<DysphagiaNutritionPlan[]>;
  getActivePlan(patientId: string): Promise<DysphagiaNutritionPlan | null>;

  createMonitoring(monitoring: DysphagiaMonitoring): Promise<DysphagiaMonitoring>;
  getMonitoring(id: string): Promise<DysphagiaMonitoring | null>;
  updateMonitoring(id: string, monitoring: DysphagiaMonitoring): Promise<DysphagiaMonitoring | null>;
  deleteMonitoring(id: string): Promise<boolean>;
  listMonitoring(patientId: string): Promise<DysphagiaMonitoring[]>;
  getRecentMonitoring(patientId: string, limit: number): Promise<DysphagiaMonitoring[]>;

  validateAssessment(assessment: DysphagiaAssessment): Promise<{ valid: boolean; errors: string[] }>;
  validatePlan(plan: DysphagiaNutritionPlan): Promise<{ valid: boolean; errors: string[] }>;
}

export class DysphagiaRepositoryImpl implements DysphagiaRepository {
  private assessments = new Map<string, DysphagiaAssessment>();
  private plans = new Map<string, DysphagiaNutritionPlan>();
  private monitoring = new Map<string, DysphagiaMonitoring>();

  async createAssessment(assessment: DysphagiaAssessment): Promise<DysphagiaAssessment> {
    const { valid, errors } = await this.validateAssessment(assessment);
    if (!valid) throw new Error(`Validation failed: ${errors.join(', ')}`);
    this.assessments.set(assessment.id!, assessment);
    return assessment;
  }

  async getAssessment(id: string): Promise<DysphagiaAssessment | null> {
    return this.assessments.get(id) || null;
  }

  async updateAssessment(id: string, assessment: DysphagiaAssessment): Promise<DysphagiaAssessment | null> {
    if (!this.assessments.has(id)) return null;
    const { valid, errors } = await this.validateAssessment(assessment);
    if (!valid) throw new Error(`Validation failed: ${errors.join(', ')}`);
    this.assessments.set(id, assessment);
    return assessment;
  }

  async deleteAssessment(id: string): Promise<boolean> {
    return this.assessments.delete(id);
  }

  async listAssessments(patientId: string): Promise<DysphagiaAssessment[]> {
    return Array.from(this.assessments.values()).filter((a) => a.patientId === patientId);
  }

  async createPlan(plan: DysphagiaNutritionPlan): Promise<DysphagiaNutritionPlan> {
    const { valid, errors } = await this.validatePlan(plan);
    if (!valid) throw new Error(`Validation failed: ${errors.join(', ')}`);
    this.plans.set(plan.id!, plan);
    return plan;
  }

  async getPlan(id: string): Promise<DysphagiaNutritionPlan | null> {
    return this.plans.get(id) || null;
  }

  async updatePlan(id: string, plan: DysphagiaNutritionPlan): Promise<DysphagiaNutritionPlan | null> {
    if (!this.plans.has(id)) return null;
    const { valid, errors } = await this.validatePlan(plan);
    if (!valid) throw new Error(`Validation failed: ${errors.join(', ')}`);
    this.plans.set(id, plan);
    return plan;
  }

  async deletePlan(id: string): Promise<boolean> {
    return this.plans.delete(id);
  }

  async listPlans(patientId: string): Promise<DysphagiaNutritionPlan[]> {
    return Array.from(this.plans.values()).filter((p) => p.patientId === patientId);
  }

  async getActivePlan(patientId: string): Promise<DysphagiaNutritionPlan | null> {
    return Array.from(this.plans.values()).find((p) => p.patientId === patientId && p.isActive) || null;
  }

  async createMonitoring(monitoring: DysphagiaMonitoring): Promise<DysphagiaMonitoring> {
    this.monitoring.set(monitoring.id!, monitoring);
    return monitoring;
  }

  async getMonitoring(id: string): Promise<DysphagiaMonitoring | null> {
    return this.monitoring.get(id) || null;
  }

  async updateMonitoring(id: string, monitoring: DysphagiaMonitoring): Promise<DysphagiaMonitoring | null> {
    if (!this.monitoring.has(id)) return null;
    this.monitoring.set(id, monitoring);
    return monitoring;
  }

  async deleteMonitoring(id: string): Promise<boolean> {
    return this.monitoring.delete(id);
  }

  async listMonitoring(patientId: string): Promise<DysphagiaMonitoring[]> {
    return Array.from(this.monitoring.values()).filter((m) => m.patientId === patientId);
  }

  async getRecentMonitoring(patientId: string, limit: number): Promise<DysphagiaMonitoring[]> {
    return Array.from(this.monitoring.values())
      .filter((m) => m.patientId === patientId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit);
  }

  async validateAssessment(assessment: DysphagiaAssessment): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    if (assessment.weight <= 0 || assessment.weight > 300) errors.push('Invalid weight');
    if (assessment.bmi < 10 || assessment.bmi > 50) errors.push('Invalid BMI');
    return { valid: errors.length === 0, errors };
  }

  async validatePlan(plan: DysphagiaNutritionPlan): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    if (plan.totalCalories < 1000 || plan.totalCalories > 4000) errors.push('Invalid calorie target');
    if (plan.textureLevel < 0 || plan.textureLevel > 5) errors.push('Invalid texture level');
    return { valid: errors.length === 0, errors };
  }
}

export const dysphagiaRepository = new DysphagiaRepositoryImpl();
