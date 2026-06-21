import {
  OrthopedicAssessment,
  OrthopedicNutritionPlan,
} from '../types/orthopedics';

export interface OrthopedicsRepository {
  // CRUD for OrthopedicAssessment
  createAssessment(assessment: OrthopedicAssessment): Promise<OrthopedicAssessment>;
  getAssessment(id: string): Promise<OrthopedicAssessment | null>;
  updateAssessment(id: string, assessment: OrthopedicAssessment): Promise<OrthopedicAssessment | null>;
  deleteAssessment(id: string): Promise<boolean>;
  listAssessments(patientId: string): Promise<OrthopedicAssessment[]>;

  // CRUD for OrthopedicNutritionPlan
  createPlan(plan: OrthopedicNutritionPlan): Promise<OrthopedicNutritionPlan>;
  getPlan(id: string): Promise<OrthopedicNutritionPlan | null>;
  updatePlan(id: string, plan: OrthopedicNutritionPlan): Promise<OrthopedicNutritionPlan | null>;
  deletePlan(id: string): Promise<boolean>;
  listPlans(patientId: string): Promise<OrthopedicNutritionPlan[]>;
  getActivePlan(patientId: string): Promise<OrthopedicNutritionPlan | null>;

  // Validation
  validateAssessment(assessment: OrthopedicAssessment): Promise<{ valid: boolean; errors: string[]; }>;
  validatePlan(plan: OrthopedicNutritionPlan): Promise<{ valid: boolean; errors: string[]; }>;
}

export class OrthopedicsRepositoryImpl implements OrthopedicsRepository {
  private assessments: Map<string, OrthopedicAssessment> = new Map();
  private plans: Map<string, OrthopedicNutritionPlan> = new Map();

  // Assessment CRUD
  async createAssessment(assessment: OrthopedicAssessment): Promise<OrthopedicAssessment> {
    const { valid, errors } = await this.validateAssessment(assessment);
    if (!valid) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    this.assessments.set(assessment.id!, assessment);
    return assessment;
  }

  async getAssessment(id: string): Promise<OrthopedicAssessment | null> {
    return this.assessments.get(id) || null;
  }

  async updateAssessment(id: string, assessment: OrthopedicAssessment): Promise<OrthopedicAssessment | null> {
    if (!this.assessments.has(id)) {
      return null;
    }

    const { valid, errors } = await this.validateAssessment(assessment);
    if (!valid) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    this.assessments.set(id, assessment);
    return assessment;
  }

  async deleteAssessment(id: string): Promise<boolean> {
    return this.assessments.delete(id);
  }

  async listAssessments(patientId: string): Promise<OrthopedicAssessment[]> {
    return Array.from(this.assessments.values()).filter(
      (a) => a.patientId === patientId
    );
  }

  // Plan CRUD
  async createPlan(plan: OrthopedicNutritionPlan): Promise<OrthopedicNutritionPlan> {
    const { valid, errors } = await this.validatePlan(plan);
    if (!valid) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    this.plans.set(plan.id!, plan);
    return plan;
  }

  async getPlan(id: string): Promise<OrthopedicNutritionPlan | null> {
    return this.plans.get(id) || null;
  }

  async updatePlan(id: string, plan: OrthopedicNutritionPlan): Promise<OrthopedicNutritionPlan | null> {
    if (!this.plans.has(id)) {
      return null;
    }

    const { valid, errors } = await this.validatePlan(plan);
    if (!valid) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    this.plans.set(id, plan);
    return plan;
  }

  async deletePlan(id: string): Promise<boolean> {
    return this.plans.delete(id);
  }

  async listPlans(patientId: string): Promise<OrthopedicNutritionPlan[]> {
    return Array.from(this.plans.values()).filter(
      (p) => p.patientId === patientId
    );
  }

  async getActivePlan(patientId: string): Promise<OrthopedicNutritionPlan | null> {
    const plans = await this.listPlans(patientId);
    return plans.find((p) => p.isActive) || null;
  }

  // Validation
  async validateAssessment(assessment: OrthopedicAssessment): Promise<{ valid: boolean; errors: string[]; }> {
    const errors: string[] = [];

    if (assessment.bmi < 10 || assessment.bmi > 50) {
      errors.push('Invalid BMI');
    }

    if (assessment.weight <= 0 || assessment.weight > 300) {
      errors.push('Invalid weight');
    }

    if (assessment.painLevel < 0 || assessment.painLevel > 10) {
      errors.push('Invalid pain level');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async validatePlan(plan: OrthopedicNutritionPlan): Promise<{ valid: boolean; errors: string[]; }> {
    const errors: string[] = [];

    if (plan.totalCalories < 800 || plan.totalCalories > 5000) {
      errors.push('Invalid calorie target');
    }

    if (plan.proteinGrams < 20 || plan.proteinGrams > 300) {
      errors.push('Invalid protein amount');
    }

    if (plan.calciumMg < 500 || plan.calciumMg > 3000) {
      errors.push('Invalid calcium amount');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const orthopedicsRepository = new OrthopedicsRepositoryImpl();
