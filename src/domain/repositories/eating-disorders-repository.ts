import {
  AnorexiaAssessment,
  AnorexiaNutritionPlan,
  BulimiaAssessment,
  BulimiaNutritionPlan,
} from '../types/eating-disorders';

export interface EatingDisordersRepository {
  // CRUD for AnorexiaAssessment
  createAnorexiaAssessment(assessment: AnorexiaAssessment): Promise<AnorexiaAssessment>;
  getAnorexiaAssessment(id: string): Promise<AnorexiaAssessment | null>;
  updateAnorexiaAssessment(id: string, assessment: AnorexiaAssessment): Promise<AnorexiaAssessment | null>;
  deleteAnorexiaAssessment(id: string): Promise<boolean>;
  listAnorexiaAssessments(patientId: string): Promise<AnorexiaAssessment[]>;

  // CRUD for AnorexiaNutritionPlan
  createAnorexiaPlan(plan: AnorexiaNutritionPlan): Promise<AnorexiaNutritionPlan>;
  getAnorexiaPlan(id: string): Promise<AnorexiaNutritionPlan | null>;
  updateAnorexiaPlan(id: string, plan: AnorexiaNutritionPlan): Promise<AnorexiaNutritionPlan | null>;
  deleteAnorexiaPlan(id: string): Promise<boolean>;
  listAnorexiaPlans(patientId: string): Promise<AnorexiaNutritionPlan[]>;
  getActiveAnorexiaPlan(patientId: string): Promise<AnorexiaNutritionPlan | null>;

  // CRUD for BulimiaAssessment
  createBulimiaAssessment(assessment: BulimiaAssessment): Promise<BulimiaAssessment>;
  getBulimiaAssessment(id: string): Promise<BulimiaAssessment | null>;
  updateBulimiaAssessment(id: string, assessment: BulimiaAssessment): Promise<BulimiaAssessment | null>;
  deleteBulimiaAssessment(id: string): Promise<boolean>;
  listBulimiaAssessments(patientId: string): Promise<BulimiaAssessment[]>;

  // CRUD for BulimiaNutritionPlan
  createBulimiaPlan(plan: BulimiaNutritionPlan): Promise<BulimiaNutritionPlan>;
  getBulimiaPlan(id: string): Promise<BulimiaNutritionPlan | null>;
  updateBulimiaPlan(id: string, plan: BulimiaNutritionPlan): Promise<BulimiaNutritionPlan | null>;
  deleteBulimiaPlan(id: string): Promise<boolean>;
  listBulimiaPlans(patientId: string): Promise<BulimiaNutritionPlan[]>;
  getActiveBulimiaPlan(patientId: string): Promise<BulimiaNutritionPlan | null>;

  // Validation
  validateAnorexiaAssessment(assessment: AnorexiaAssessment): Promise<{ valid: boolean; errors: string[]; }>;
  validateAnorexiaPlan(plan: AnorexiaNutritionPlan): Promise<{ valid: boolean; errors: string[]; }>;
  validateBulimiaAssessment(assessment: BulimiaAssessment): Promise<{ valid: boolean; errors: string[]; }>;
}

export class EatingDisordersRepositoryImpl implements EatingDisordersRepository {
  private anorexiaAssessments: Map<string, AnorexiaAssessment> = new Map();
  private anorexiaPlans: Map<string, AnorexiaNutritionPlan> = new Map();
  private bulimiaAssessments: Map<string, BulimiaAssessment> = new Map();
  private bulimiaPlans: Map<string, BulimiaNutritionPlan> = new Map();

  // Anorexia CRUD
  async createAnorexiaAssessment(assessment: AnorexiaAssessment): Promise<AnorexiaAssessment> {
    const { valid, errors } = await this.validateAnorexiaAssessment(assessment);
    if (!valid) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    this.anorexiaAssessments.set(assessment.id!, assessment);
    return assessment;
  }

  async getAnorexiaAssessment(id: string): Promise<AnorexiaAssessment | null> {
    return this.anorexiaAssessments.get(id) || null;
  }

  async updateAnorexiaAssessment(id: string, assessment: AnorexiaAssessment): Promise<AnorexiaAssessment | null> {
    if (!this.anorexiaAssessments.has(id)) {
      return null;
    }

    const { valid, errors } = await this.validateAnorexiaAssessment(assessment);
    if (!valid) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    this.anorexiaAssessments.set(id, assessment);
    return assessment;
  }

  async deleteAnorexiaAssessment(id: string): Promise<boolean> {
    return this.anorexiaAssessments.delete(id);
  }

  async listAnorexiaAssessments(patientId: string): Promise<AnorexiaAssessment[]> {
    return Array.from(this.anorexiaAssessments.values()).filter(
      (a) => a.patientId === patientId
    );
  }

  async createAnorexiaPlan(plan: AnorexiaNutritionPlan): Promise<AnorexiaNutritionPlan> {
    const { valid, errors } = await this.validateAnorexiaPlan(plan);
    if (!valid) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    this.anorexiaPlans.set(plan.id!, plan);
    return plan;
  }

  async getAnorexiaPlan(id: string): Promise<AnorexiaNutritionPlan | null> {
    return this.anorexiaPlans.get(id) || null;
  }

  async updateAnorexiaPlan(id: string, plan: AnorexiaNutritionPlan): Promise<AnorexiaNutritionPlan | null> {
    if (!this.anorexiaPlans.has(id)) {
      return null;
    }

    const { valid, errors } = await this.validateAnorexiaPlan(plan);
    if (!valid) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    this.anorexiaPlans.set(id, plan);
    return plan;
  }

  async deleteAnorexiaPlan(id: string): Promise<boolean> {
    return this.anorexiaPlans.delete(id);
  }

  async listAnorexiaPlans(patientId: string): Promise<AnorexiaNutritionPlan[]> {
    return Array.from(this.anorexiaPlans.values()).filter(
      (p) => p.patientId === patientId
    );
  }

  async getActiveAnorexiaPlan(patientId: string): Promise<AnorexiaNutritionPlan | null> {
    const plans = await this.listAnorexiaPlans(patientId);
    return plans.find((p) => p.isActive) || null;
  }

  // Bulimia CRUD
  async createBulimiaAssessment(assessment: BulimiaAssessment): Promise<BulimiaAssessment> {
    const { valid, errors } = await this.validateBulimiaAssessment(assessment);
    if (!valid) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    this.bulimiaAssessments.set(assessment.id!, assessment);
    return assessment;
  }

  async getBulimiaAssessment(id: string): Promise<BulimiaAssessment | null> {
    return this.bulimiaAssessments.get(id) || null;
  }

  async updateBulimiaAssessment(id: string, assessment: BulimiaAssessment): Promise<BulimiaAssessment | null> {
    if (!this.bulimiaAssessments.has(id)) {
      return null;
    }

    const { valid, errors } = await this.validateBulimiaAssessment(assessment);
    if (!valid) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    this.bulimiaAssessments.set(id, assessment);
    return assessment;
  }

  async deleteBulimiaAssessment(id: string): Promise<boolean> {
    return this.bulimiaAssessments.delete(id);
  }

  async listBulimiaAssessments(patientId: string): Promise<BulimiaAssessment[]> {
    return Array.from(this.bulimiaAssessments.values()).filter(
      (a) => a.patientId === patientId
    );
  }

  async createBulimiaPlan(plan: BulimiaNutritionPlan): Promise<BulimiaNutritionPlan> {
    this.bulimiaPlans.set(plan.id!, plan);
    return plan;
  }

  async getBulimiaPlan(id: string): Promise<BulimiaNutritionPlan | null> {
    return this.bulimiaPlans.get(id) || null;
  }

  async updateBulimiaPlan(id: string, plan: BulimiaNutritionPlan): Promise<BulimiaNutritionPlan | null> {
    if (!this.bulimiaPlans.has(id)) {
      return null;
    }

    this.bulimiaPlans.set(id, plan);
    return plan;
  }

  async deleteBulimiaPlan(id: string): Promise<boolean> {
    return this.bulimiaPlans.delete(id);
  }

  async listBulimiaPlans(patientId: string): Promise<BulimiaNutritionPlan[]> {
    return Array.from(this.bulimiaPlans.values()).filter(
      (p) => p.patientId === patientId
    );
  }

  async getActiveBulimiaPlan(patientId: string): Promise<BulimiaNutritionPlan | null> {
    const plans = await this.listBulimiaPlans(patientId);
    return plans.find((p) => p.isActive) || null;
  }

  // Validation
  async validateAnorexiaAssessment(
    assessment: AnorexiaAssessment
  ): Promise<{ valid: boolean; errors: string[]; }> {
    const { validateAnorexiaAssessment } = await import('../types/eating-disorders');
    return validateAnorexiaAssessment(assessment);
  }

  async validateAnorexiaPlan(
    plan: AnorexiaNutritionPlan
  ): Promise<{ valid: boolean; errors: string[]; }> {
    const { validateAnorexiaNutritionPlan } = await import('../types/eating-disorders');
    return validateAnorexiaNutritionPlan(plan);
  }

  async validateBulimiaAssessment(
    assessment: BulimiaAssessment
  ): Promise<{ valid: boolean; errors: string[]; }> {
    const { validateBulimiaAssessment } = await import('../types/eating-disorders');
    return validateBulimiaAssessment(assessment);
  }
}

export const eatingDisordersRepository = new EatingDisordersRepositoryImpl();
