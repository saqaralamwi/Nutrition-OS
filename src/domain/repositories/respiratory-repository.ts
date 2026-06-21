import {
  RespiratoryAssessment,
  RespiratoryNutritionPlan,
  RespiratoryMonitoring,
} from '../types/respiratory';

export interface RespiratoryRepository {
  createAssessment(assessment: RespiratoryAssessment): Promise<RespiratoryAssessment>;
  getAssessment(id: string): Promise<RespiratoryAssessment | null>;
  updateAssessment(id: string, assessment: RespiratoryAssessment): Promise<RespiratoryAssessment | null>;
  deleteAssessment(id: string): Promise<boolean>;
  listAssessments(patientId: string): Promise<RespiratoryAssessment[]>;

  createPlan(plan: RespiratoryNutritionPlan): Promise<RespiratoryNutritionPlan>;
  getPlan(id: string): Promise<RespiratoryNutritionPlan | null>;
  updatePlan(id: string, plan: RespiratoryNutritionPlan): Promise<RespiratoryNutritionPlan | null>;
  deletePlan(id: string): Promise<boolean>;
  listPlans(patientId: string): Promise<RespiratoryNutritionPlan[]>;
  getActivePlan(patientId: string): Promise<RespiratoryNutritionPlan | null>;

  createMonitoring(monitoring: RespiratoryMonitoring): Promise<RespiratoryMonitoring>;
  getMonitoring(id: string): Promise<RespiratoryMonitoring | null>;
  updateMonitoring(id: string, monitoring: RespiratoryMonitoring): Promise<RespiratoryMonitoring | null>;
  deleteMonitoring(id: string): Promise<boolean>;
  listMonitoring(patientId: string): Promise<RespiratoryMonitoring[]>;
  getRecentMonitoring(patientId: string, limit: number): Promise<RespiratoryMonitoring[]>;

  validateAssessment(assessment: RespiratoryAssessment): Promise<{ valid: boolean; errors: string[] }>;
  validatePlan(plan: RespiratoryNutritionPlan): Promise<{ valid: boolean; errors: string[] }>;
}

export class RespiratoryRepositoryImpl implements RespiratoryRepository {
  private assessments = new Map<string, RespiratoryAssessment>();
  private plans = new Map<string, RespiratoryNutritionPlan>();
  private monitoring = new Map<string, RespiratoryMonitoring>();

  async createAssessment(assessment: RespiratoryAssessment): Promise<RespiratoryAssessment> {
    const { valid, errors } = await this.validateAssessment(assessment);
    if (!valid) throw new Error(`Validation failed: ${errors.join(', ')}`);
    this.assessments.set(assessment.id!, assessment);
    return assessment;
  }

  async getAssessment(id: string): Promise<RespiratoryAssessment | null> {
    return this.assessments.get(id) || null;
  }

  async updateAssessment(id: string, assessment: RespiratoryAssessment): Promise<RespiratoryAssessment | null> {
    if (!this.assessments.has(id)) return null;
    const { valid, errors } = await this.validateAssessment(assessment);
    if (!valid) throw new Error(`Validation failed: ${errors.join(', ')}`);
    this.assessments.set(id, assessment);
    return assessment;
  }

  async deleteAssessment(id: string): Promise<boolean> {
    return this.assessments.delete(id);
  }

  async listAssessments(patientId: string): Promise<RespiratoryAssessment[]> {
    return Array.from(this.assessments.values()).filter((a) => a.patientId === patientId);
  }

  async createPlan(plan: RespiratoryNutritionPlan): Promise<RespiratoryNutritionPlan> {
    const { valid, errors } = await this.validatePlan(plan);
    if (!valid) throw new Error(`Validation failed: ${errors.join(', ')}`);
    this.plans.set(plan.id!, plan);
    return plan;
  }

  async getPlan(id: string): Promise<RespiratoryNutritionPlan | null> {
    return this.plans.get(id) || null;
  }

  async updatePlan(id: string, plan: RespiratoryNutritionPlan): Promise<RespiratoryNutritionPlan | null> {
    if (!this.plans.has(id)) return null;
    const { valid, errors } = await this.validatePlan(plan);
    if (!valid) throw new Error(`Validation failed: ${errors.join(', ')}`);
    this.plans.set(id, plan);
    return plan;
  }

  async deletePlan(id: string): Promise<boolean> {
    return this.plans.delete(id);
  }

  async listPlans(patientId: string): Promise<RespiratoryNutritionPlan[]> {
    return Array.from(this.plans.values()).filter((p) => p.patientId === patientId);
  }

  async getActivePlan(patientId: string): Promise<RespiratoryNutritionPlan | null> {
    return Array.from(this.plans.values()).find((p) => p.patientId === patientId && p.isActive) || null;
  }

  async createMonitoring(monitoring: RespiratoryMonitoring): Promise<RespiratoryMonitoring> {
    this.monitoring.set(monitoring.id!, monitoring);
    return monitoring;
  }

  async getMonitoring(id: string): Promise<RespiratoryMonitoring | null> {
    return this.monitoring.get(id) || null;
  }

  async updateMonitoring(id: string, monitoring: RespiratoryMonitoring): Promise<RespiratoryMonitoring | null> {
    if (!this.monitoring.has(id)) return null;
    this.monitoring.set(id, monitoring);
    return monitoring;
  }

  async deleteMonitoring(id: string): Promise<boolean> {
    return this.monitoring.delete(id);
  }

  async listMonitoring(patientId: string): Promise<RespiratoryMonitoring[]> {
    return Array.from(this.monitoring.values()).filter((m) => m.patientId === patientId);
  }

  async getRecentMonitoring(patientId: string, limit: number): Promise<RespiratoryMonitoring[]> {
    return Array.from(this.monitoring.values())
      .filter((m) => m.patientId === patientId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit);
  }

  async validateAssessment(assessment: RespiratoryAssessment): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    if (assessment.forcedExpiratoryVolume < 0.5 || assessment.forcedExpiratoryVolume > 6) errors.push('Invalid FEV1');
    if (assessment.bmi < 15 || assessment.bmi > 50) errors.push('Invalid BMI');
    if (assessment.oxygenSaturationResting < 70 || assessment.oxygenSaturationResting > 100) errors.push('Invalid SpO2');
    return { valid: errors.length === 0, errors };
  }

  async validatePlan(plan: RespiratoryNutritionPlan): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    if (plan.totalCalories < 1500 || plan.totalCalories > 5000) errors.push('Invalid calorie target');
    if (plan.proteinPerKg < 0.8 || plan.proteinPerKg > 2.5) errors.push('Invalid protein per kg');
    return { valid: errors.length === 0, errors };
  }
}

export const respiratoryRepository = new RespiratoryRepositoryImpl();
