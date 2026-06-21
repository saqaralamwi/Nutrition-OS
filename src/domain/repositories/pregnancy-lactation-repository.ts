import {
  PregnancyAssessment,
  PregnancyNutritionPlan,
  LactationAssessment,
  LactationNutritionPlan,
} from '../types/pregnancy-lactation';

export interface PregnancyLactationRepository {
  createPregnancyAssessment(assessment: PregnancyAssessment): Promise<PregnancyAssessment>;
  getPregnancyAssessment(id: string): Promise<PregnancyAssessment | null>;
  updatePregnancyAssessment(id: string, assessment: PregnancyAssessment): Promise<PregnancyAssessment | null>;
  deletePregnancyAssessment(id: string): Promise<boolean>;
  listPregnancyAssessments(patientId: string): Promise<PregnancyAssessment[]>;

  createPregnancyPlan(plan: PregnancyNutritionPlan): Promise<PregnancyNutritionPlan>;
  getPregnancyPlan(id: string): Promise<PregnancyNutritionPlan | null>;
  updatePregnancyPlan(id: string, plan: PregnancyNutritionPlan): Promise<PregnancyNutritionPlan | null>;
  deletePregnancyPlan(id: string): Promise<boolean>;
  listPregnancyPlans(patientId: string): Promise<PregnancyNutritionPlan[]>;
  getActivePregnancyPlan(patientId: string): Promise<PregnancyNutritionPlan | null>;

  createLactationAssessment(assessment: LactationAssessment): Promise<LactationAssessment>;
  getLactationAssessment(id: string): Promise<LactationAssessment | null>;
  updateLactationAssessment(id: string, assessment: LactationAssessment): Promise<LactationAssessment | null>;
  deleteLactationAssessment(id: string): Promise<boolean>;
  listLactationAssessments(patientId: string): Promise<LactationAssessment[]>;

  createLactationPlan(plan: LactationNutritionPlan): Promise<LactationNutritionPlan>;
  getLactationPlan(id: string): Promise<LactationNutritionPlan | null>;
  updateLactationPlan(id: string, plan: LactationNutritionPlan): Promise<LactationNutritionPlan | null>;
  deleteLactationPlan(id: string): Promise<boolean>;
  listLactationPlans(patientId: string): Promise<LactationNutritionPlan[]>;
  getActiveLactationPlan(patientId: string): Promise<LactationNutritionPlan | null>;

  validatePregnancyAssessment(assessment: PregnancyAssessment): Promise<{ valid: boolean; errors: string[] }>;
  validatePregnancyPlan(plan: PregnancyNutritionPlan): Promise<{ valid: boolean; errors: string[] }>;
  validateLactationAssessment(assessment: LactationAssessment): Promise<{ valid: boolean; errors: string[] }>;
  validateLactationPlan(plan: LactationNutritionPlan): Promise<{ valid: boolean; errors: string[] }>;
}

export class PregnancyLactationRepositoryImpl implements PregnancyLactationRepository {
  private pregnancyAssessments = new Map<string, PregnancyAssessment>();
  private pregnancyPlans = new Map<string, PregnancyNutritionPlan>();
  private lactationAssessments = new Map<string, LactationAssessment>();
  private lactationPlans = new Map<string, LactationNutritionPlan>();

  async createPregnancyAssessment(assessment: PregnancyAssessment): Promise<PregnancyAssessment> {
    const { valid, errors } = await this.validatePregnancyAssessment(assessment);
    if (!valid) throw new Error(`Validation failed: ${errors.join(', ')}`);
    this.pregnancyAssessments.set(assessment.id!, assessment);
    return assessment;
  }

  async getPregnancyAssessment(id: string): Promise<PregnancyAssessment | null> {
    return this.pregnancyAssessments.get(id) || null;
  }

  async updatePregnancyAssessment(id: string, assessment: PregnancyAssessment): Promise<PregnancyAssessment | null> {
    if (!this.pregnancyAssessments.has(id)) return null;
    const { valid, errors } = await this.validatePregnancyAssessment(assessment);
    if (!valid) throw new Error(`Validation failed: ${errors.join(', ')}`);
    this.pregnancyAssessments.set(id, assessment);
    return assessment;
  }

  async deletePregnancyAssessment(id: string): Promise<boolean> {
    return this.pregnancyAssessments.delete(id);
  }

  async listPregnancyAssessments(patientId: string): Promise<PregnancyAssessment[]> {
    return Array.from(this.pregnancyAssessments.values()).filter((a) => a.patientId === patientId);
  }

  async createPregnancyPlan(plan: PregnancyNutritionPlan): Promise<PregnancyNutritionPlan> {
    const { valid, errors } = await this.validatePregnancyPlan(plan);
    if (!valid) throw new Error(`Validation failed: ${errors.join(', ')}`);
    this.pregnancyPlans.set(plan.id!, plan);
    return plan;
  }

  async getPregnancyPlan(id: string): Promise<PregnancyNutritionPlan | null> {
    return this.pregnancyPlans.get(id) || null;
  }

  async updatePregnancyPlan(id: string, plan: PregnancyNutritionPlan): Promise<PregnancyNutritionPlan | null> {
    if (!this.pregnancyPlans.has(id)) return null;
    const { valid, errors } = await this.validatePregnancyPlan(plan);
    if (!valid) throw new Error(`Validation failed: ${errors.join(', ')}`);
    this.pregnancyPlans.set(id, plan);
    return plan;
  }

  async deletePregnancyPlan(id: string): Promise<boolean> {
    return this.pregnancyPlans.delete(id);
  }

  async listPregnancyPlans(patientId: string): Promise<PregnancyNutritionPlan[]> {
    return Array.from(this.pregnancyPlans.values()).filter((p) => p.patientId === patientId);
  }

  async getActivePregnancyPlan(patientId: string): Promise<PregnancyNutritionPlan | null> {
    return Array.from(this.pregnancyPlans.values()).find((p) => p.patientId === patientId && p.isActive) || null;
  }

  async createLactationAssessment(assessment: LactationAssessment): Promise<LactationAssessment> {
    const { valid, errors } = await this.validateLactationAssessment(assessment);
    if (!valid) throw new Error(`Validation failed: ${errors.join(', ')}`);
    this.lactationAssessments.set(assessment.id!, assessment);
    return assessment;
  }

  async getLactationAssessment(id: string): Promise<LactationAssessment | null> {
    return this.lactationAssessments.get(id) || null;
  }

  async updateLactationAssessment(id: string, assessment: LactationAssessment): Promise<LactationAssessment | null> {
    if (!this.lactationAssessments.has(id)) return null;
    const { valid, errors } = await this.validateLactationAssessment(assessment);
    if (!valid) throw new Error(`Validation failed: ${errors.join(', ')}`);
    this.lactationAssessments.set(id, assessment);
    return assessment;
  }

  async deleteLactationAssessment(id: string): Promise<boolean> {
    return this.lactationAssessments.delete(id);
  }

  async listLactationAssessments(patientId: string): Promise<LactationAssessment[]> {
    return Array.from(this.lactationAssessments.values()).filter((a) => a.patientId === patientId);
  }

  async createLactationPlan(plan: LactationNutritionPlan): Promise<LactationNutritionPlan> {
    const { valid, errors } = await this.validateLactationPlan(plan);
    if (!valid) throw new Error(`Validation failed: ${errors.join(', ')}`);
    this.lactationPlans.set(plan.id!, plan);
    return plan;
  }

  async getLactationPlan(id: string): Promise<LactationNutritionPlan | null> {
    return this.lactationPlans.get(id) || null;
  }

  async updateLactationPlan(id: string, plan: LactationNutritionPlan): Promise<LactationNutritionPlan | null> {
    if (!this.lactationPlans.has(id)) return null;
    const { valid, errors } = await this.validateLactationPlan(plan);
    if (!valid) throw new Error(`Validation failed: ${errors.join(', ')}`);
    this.lactationPlans.set(id, plan);
    return plan;
  }

  async deleteLactationPlan(id: string): Promise<boolean> {
    return this.lactationPlans.delete(id);
  }

  async listLactationPlans(patientId: string): Promise<LactationNutritionPlan[]> {
    return Array.from(this.lactationPlans.values()).filter((p) => p.patientId === patientId);
  }

  async getActiveLactationPlan(patientId: string): Promise<LactationNutritionPlan | null> {
    return Array.from(this.lactationPlans.values()).find((p) => p.patientId === patientId && p.isActive) || null;
  }

  async validatePregnancyAssessment(assessment: PregnancyAssessment): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    if (assessment.gestationalAge < 1 || assessment.gestationalAge > 42) errors.push('Invalid gestational age');
    if (assessment.weight <= 0 || assessment.weight > 300) errors.push('Invalid weight');
    if (assessment.weightGain < 0 || assessment.weightGain > 30) errors.push('Invalid weight gain');
    return { valid: errors.length === 0, errors };
  }

  async validatePregnancyPlan(plan: PregnancyNutritionPlan): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    if (plan.totalCalories < 1200 || plan.totalCalories > 4000) errors.push('Invalid calorie target');
    if (plan.ironMg < 0 || plan.ironMg > 100) errors.push('Invalid iron amount');
    return { valid: errors.length === 0, errors };
  }

  async validateLactationAssessment(assessment: LactationAssessment): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    if (assessment.infantAge < 0 || assessment.infantAge > 104) errors.push('Invalid infant age');
    if (assessment.weight <= 0 || assessment.weight > 300) errors.push('Invalid weight');
    return { valid: errors.length === 0, errors };
  }

  async validateLactationPlan(plan: LactationNutritionPlan): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    if (plan.totalCalories < 1200 || plan.totalCalories > 4000) errors.push('Invalid calorie target');
    if (plan.waterMl < 500 || plan.waterMl > 5000) errors.push('Invalid water target');
    return { valid: errors.length === 0, errors };
  }
}

export const pregnancyLactationRepository = new PregnancyLactationRepositoryImpl();
