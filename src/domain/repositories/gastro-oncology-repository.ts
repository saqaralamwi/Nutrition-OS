import {
  GIAssessment,
  GastroOncologyAssessment,
  GastroOncologyNutritionPlan,
} from '../types/gastro-oncology';

export interface GastroOncologyRepository {
  // CRUD for GIAssessment
  createGIAssessment(assessment: GIAssessment): Promise<GIAssessment>;
  getGIAssessment(id: string): Promise<GIAssessment | null>;
  updateGIAssessment(id: string, assessment: GIAssessment): Promise<GIAssessment | null>;
  deleteGIAssessment(id: string): Promise<boolean>;
  listGIAssessments(patientId: string): Promise<GIAssessment[]>;

  // CRUD for GastroOncologyAssessment
  createGastroOncologyAssessment(assessment: GastroOncologyAssessment): Promise<GastroOncologyAssessment>;
  getGastroOncologyAssessment(id: string): Promise<GastroOncologyAssessment | null>;
  updateGastroOncologyAssessment(id: string, assessment: GastroOncologyAssessment): Promise<GastroOncologyAssessment | null>;
  deleteGastroOncologyAssessment(id: string): Promise<boolean>;
  listGastroOncologyAssessments(patientId: string): Promise<GastroOncologyAssessment[]>;

  // CRUD for GastroOncologyNutritionPlan
  createPlan(plan: GastroOncologyNutritionPlan): Promise<GastroOncologyNutritionPlan>;
  getPlan(id: string): Promise<GastroOncologyNutritionPlan | null>;
  updatePlan(id: string, plan: GastroOncologyNutritionPlan): Promise<GastroOncologyNutritionPlan | null>;
  deletePlan(id: string): Promise<boolean>;
  listPlans(patientId: string): Promise<GastroOncologyNutritionPlan[]>;
  getActivePlan(patientId: string): Promise<GastroOncologyNutritionPlan | null>;

  // Validation
  validateGIAssessment(assessment: GIAssessment): Promise<{ valid: boolean; errors: string[]; }>;
  validateGastroOncologyAssessment(assessment: GastroOncologyAssessment): Promise<{ valid: boolean; errors: string[]; }>;
  validatePlan(plan: GastroOncologyNutritionPlan): Promise<{ valid: boolean; errors: string[]; }>;
}

export class GastroOncologyRepositoryImpl implements GastroOncologyRepository {
  private giAssessments: Map<string, GIAssessment> = new Map();
  private gastroOncologyAssessments: Map<string, GastroOncologyAssessment> = new Map();
  private plans: Map<string, GastroOncologyNutritionPlan> = new Map();

  // GI Assessment CRUD
  async createGIAssessment(assessment: GIAssessment): Promise<GIAssessment> {
    const { valid, errors } = await this.validateGIAssessment(assessment);
    if (!valid) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    this.giAssessments.set(assessment.id!, assessment);
    return assessment;
  }

  async getGIAssessment(id: string): Promise<GIAssessment | null> {
    return this.giAssessments.get(id) || null;
  }

  async updateGIAssessment(id: string, assessment: GIAssessment): Promise<GIAssessment | null> {
    if (!this.giAssessments.has(id)) {
      return null;
    }

    const { valid, errors } = await this.validateGIAssessment(assessment);
    if (!valid) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    this.giAssessments.set(id, assessment);
    return assessment;
  }

  async deleteGIAssessment(id: string): Promise<boolean> {
    return this.giAssessments.delete(id);
  }

  async listGIAssessments(patientId: string): Promise<GIAssessment[]> {
    return Array.from(this.giAssessments.values()).filter(
      (a) => a.patientId === patientId
    );
  }

  // Gastro-Oncology Assessment CRUD
  async createGastroOncologyAssessment(assessment: GastroOncologyAssessment): Promise<GastroOncologyAssessment> {
    const { valid, errors } = await this.validateGastroOncologyAssessment(assessment);
    if (!valid) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    this.gastroOncologyAssessments.set(assessment.id!, assessment);
    return assessment;
  }

  async getGastroOncologyAssessment(id: string): Promise<GastroOncologyAssessment | null> {
    return this.gastroOncologyAssessments.get(id) || null;
  }

  async updateGastroOncologyAssessment(id: string, assessment: GastroOncologyAssessment): Promise<GastroOncologyAssessment | null> {
    if (!this.gastroOncologyAssessments.has(id)) {
      return null;
    }

    const { valid, errors } = await this.validateGastroOncologyAssessment(assessment);
    if (!valid) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    this.gastroOncologyAssessments.set(id, assessment);
    return assessment;
  }

  async deleteGastroOncologyAssessment(id: string): Promise<boolean> {
    return this.gastroOncologyAssessments.delete(id);
  }

  async listGastroOncologyAssessments(patientId: string): Promise<GastroOncologyAssessment[]> {
    return Array.from(this.gastroOncologyAssessments.values()).filter(
      (a) => a.patientId === patientId
    );
  }

  // Plan CRUD
  async createPlan(plan: GastroOncologyNutritionPlan): Promise<GastroOncologyNutritionPlan> {
    const { valid, errors } = await this.validatePlan(plan);
    if (!valid) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    this.plans.set(plan.id!, plan);
    return plan;
  }

  async getPlan(id: string): Promise<GastroOncologyNutritionPlan | null> {
    return this.plans.get(id) || null;
  }

  async updatePlan(id: string, plan: GastroOncologyNutritionPlan): Promise<GastroOncologyNutritionPlan | null> {
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

  async listPlans(patientId: string): Promise<GastroOncologyNutritionPlan[]> {
    return Array.from(this.plans.values()).filter(
      (p) => p.patientId === patientId
    );
  }

  async getActivePlan(patientId: string): Promise<GastroOncologyNutritionPlan | null> {
    const plans = await this.listPlans(patientId);
    return plans.find((p) => p.isActive) || null;
  }

  // Validation
  async validateGIAssessment(assessment: GIAssessment): Promise<{ valid: boolean; errors: string[]; }> {
    const { validateGIAssessment } = await import('../types/gastro-oncology');
    return validateGIAssessment(assessment);
  }

  async validateGastroOncologyAssessment(assessment: GastroOncologyAssessment): Promise<{ valid: boolean; errors: string[]; }> {
    const { validateGastroOncologyAssessment } = await import('../types/gastro-oncology');
    return validateGastroOncologyAssessment(assessment);
  }

  async validatePlan(plan: GastroOncologyNutritionPlan): Promise<{ valid: boolean; errors: string[]; }> {
    const errors: string[] = [];

    if (plan.totalCalories < 800 || plan.totalCalories > 5000) {
      errors.push('Invalid calorie target');
    }

    if (plan.proteinGrams < 20 || plan.proteinGrams > 300) {
      errors.push('Invalid protein amount');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const gastroOncologyRepository = new GastroOncologyRepositoryImpl();
