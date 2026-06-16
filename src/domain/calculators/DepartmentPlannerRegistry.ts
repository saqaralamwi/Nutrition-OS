import { Patient } from '../entities/Patient';

export interface AlertThresholds {
  glucoseLow: number;
  glucoseHigh: number;
  proteinLow: number;
  proteinHigh: number;
  refeedingRisk?: boolean;
  potassiumLow?: number;
  potassiumHigh?: number;
  phosphorusHigh?: number;
}

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

export interface PlannerPatient extends Patient {
  weight_kg?: number;
  height_cm?: number;
  activity_factor?: number;
  stress_factor?: number;
  is_ventilated?: boolean;
  has_diabetes?: boolean;
  has_kidney_disease?: boolean;
  on_dialysis?: boolean;
}

export interface PlannerNutritionPlan {
  patient: PlannerPatient;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  totalCalories?: number;
  glucose_avg?: number;
}

/**
 * Nutrition Planner Interface (Strategy Pattern)
 */
export interface NutritionPlanner {
  getDepartmentName(): string;
  getDepartmentNameAr(): string;

  calculateREE(patient: PlannerPatient): number;
  calculateTEE(patient: PlannerPatient): number;
  calculateProtein(patient: PlannerPatient): number;
  calculateCarbs(patient: PlannerPatient, totalCalories: number): number;
  calculateFat(patient: PlannerPatient, totalCalories: number): number;

  getCalorieTargetMin(patient: PlannerPatient): number;
  getCalorieTargetMax(patient: PlannerPatient): number;
  getProteinTargetMin(patient: PlannerPatient): number;
  getProteinTargetMax(patient: PlannerPatient): number;

  getAlertThresholds(patient?: PlannerPatient): AlertThresholds;
  validatePlan(plan: PlannerNutritionPlan): ValidationResult;
  getSpecialConsiderations(patient: PlannerPatient): string[];
}

/**
 * Default Planner (Base Implementation)
 */
export class DefaultPlanner implements NutritionPlanner {
  getDepartmentName(): string { return 'Default'; }
  getDepartmentNameAr(): string { return 'عام'; }

  calculateREE(patient: PlannerPatient): number {
    const w = patient.weight_kg ?? 70;
    const h = patient.height_cm ?? 170;
    const a = patient.age ?? 40;
    // Harris-Benedict equation
    if (patient.gender === 'male') {
      return 88.5 + (13.7 * w) + (4.8 * h) - (5.7 * a);
    } else {
      return 447.6 + (9.2 * w) + (3.1 * h) - (4.3 * a);
    }
  }

  calculateTEE(patient: PlannerPatient): number {
    const ree = this.calculateREE(patient);
    const act = patient.activity_factor ?? 1.2;
    const stress = patient.stress_factor ?? 1.0;
    return ree * act * stress;
  }

  calculateProtein(patient: PlannerPatient): number {
    const w = patient.weight_kg ?? 70;
    return w * 0.8; // 0.8 g/kg default
  }

  calculateCarbs(patient: PlannerPatient, totalCalories: number): number {
    return (totalCalories * 0.55) / 4; // 55% carbs
  }

  calculateFat(patient: PlannerPatient, totalCalories: number): number {
    return (totalCalories * 0.30) / 9; // 30% fat
  }

  getCalorieTargetMin(patient: PlannerPatient): number {
    return this.calculateTEE(patient) * 0.9;
  }

  getCalorieTargetMax(patient: PlannerPatient): number {
    return this.calculateTEE(patient) * 1.1;
  }

  getProteinTargetMin(patient: PlannerPatient): number {
    return this.calculateProtein(patient) * 0.9;
  }

  getProteinTargetMax(patient: PlannerPatient): number {
    return this.calculateProtein(patient) * 1.1;
  }

  getAlertThresholds(patient?: PlannerPatient): AlertThresholds {
    return {
      glucoseLow: 70,
      glucoseHigh: 180,
      proteinLow: 0.8,
      proteinHigh: 2.0,
    };
  }

  validatePlan(plan: PlannerNutritionPlan): ValidationResult {
    return { isValid: true, warnings: [], errors: [] };
  }

  getSpecialConsiderations(patient: PlannerPatient): string[] {
    return [];
  }
}

/**
 * ICU Planner (Critical Care Specific)
 */
export class IcuPlanner implements NutritionPlanner {
  getDepartmentName(): string { return 'ICU'; }
  getDepartmentNameAr(): string { return 'عناية مركزة'; }

  calculateREE(patient: PlannerPatient): number {
    const w = patient.weight_kg ?? 70;
    const h = patient.height_cm ?? 170;
    const a = patient.age ?? 40;

    // Penn State equation for ventilated patients
    if (patient.is_ventilated) {
      const ree_hb = this.harrisBenedictREE(patient);
      // Ventilation specific logic (simplified Penn State)
      return ree_hb * 1.15;
    }

    // Ireton-Jones for non-ventilated
    const isMale = patient.gender === 'male' ? 1 : 0;
    return 1100 + (20 * w) - (30 * a) + (100 * isMale);
  }

  calculateTEE(patient: PlannerPatient): number {
    const ree = this.calculateREE(patient);
    const stress = patient.stress_factor ?? 1.2;
    // ICU: Lower activity factor (bedridden)
    return ree * 1.1 * stress;
  }

  calculateProtein(patient: PlannerPatient): number {
    const w = patient.weight_kg ?? 70;
    // ICU: Higher protein (1.5-2.0 g/kg)
    return w * 1.8;
  }

  calculateCarbs(patient: PlannerPatient, totalCalories: number): number {
    // ICU: Lower carbs (to reduce CO2 production)
    return (totalCalories * 0.40) / 4; // 40% carbs
  }

  calculateFat(patient: PlannerPatient, totalCalories: number): number {
    // ICU: Higher fat (to reduce CO2)
    return (totalCalories * 0.45) / 9; // 45% fat
  }

  getCalorieTargetMin(patient: PlannerPatient): number {
    return this.calculateTEE(patient) * 0.85; // ICU: Tighter range
  }

  getCalorieTargetMax(patient: PlannerPatient): number {
    return this.calculateTEE(patient) * 1.0; // ICU: No overfeeding
  }

  getProteinTargetMin(patient: PlannerPatient): number {
    const w = patient.weight_kg ?? 70;
    return w * 1.5;
  }

  getProteinTargetMax(patient: PlannerPatient): number {
    const w = patient.weight_kg ?? 70;
    return w * 2.0;
  }

  getAlertThresholds(patient?: PlannerPatient): AlertThresholds {
    return {
      glucoseLow: 80,
      glucoseHigh: 150, // ICU: Tighter glucose control
      proteinLow: 1.5,
      proteinHigh: 2.5,
      refeedingRisk: true, // ICU: High refeeding risk
    };
  }

  validatePlan(plan: PlannerNutritionPlan): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    const w = plan.patient.weight_kg ?? 70;
    const tee = plan.calories;

    if (plan.protein_g < w * 1.5) {
      errors.push('ICU: Protein < 1.5 g/kg may lead to muscle wasting');
    }

    if (plan.calories > tee * 1.0) {
      errors.push('ICU: Overfeeding risk - do not exceed TEE');
    }

    return { isValid: errors.length === 0, warnings, errors };
  }

  getSpecialConsiderations(patient: PlannerPatient): string[] {
    const considerations = [
      'Monitor for refeeding syndrome',
      'Consider parenteral nutrition if enteral not feasible',
      'Tighter glucose control (80-150 mg/dL)',
    ];

    if (patient.is_ventilated) {
      considerations.push('Lower carbs to reduce CO2 production');
    }

    return considerations;
  }

  private harrisBenedictREE(patient: PlannerPatient): number {
    const w = patient.weight_kg ?? 70;
    const h = patient.height_cm ?? 170;
    const a = patient.age ?? 40;
    if (patient.gender === 'male') {
      return 66.5 + (13.75 * w) + (5.003 * h) - (6.775 * a);
    } else {
      return 665.1 + (9.563 * w) + (1.850 * h) - (4.676 * a);
    }
  }
}

/**
 * Diabetes Planner (DM Specific)
 */
export class DiabetesPlanner implements NutritionPlanner {
  getDepartmentName(): string { return 'Diabetes'; }
  getDepartmentNameAr(): string { return 'سكري'; }

  calculateREE(patient: PlannerPatient): number {
    return DefaultPlanner.prototype.calculateREE(patient);
  }

  calculateTEE(patient: PlannerPatient): number {
    return DefaultPlanner.prototype.calculateTEE(patient);
  }

  calculateProtein(patient: PlannerPatient): number {
    const w = patient.weight_kg ?? 70;
    // Diabetes: Moderate protein (1.0-1.4 g/kg)
    return w * 1.2;
  }

  calculateCarbs(patient: PlannerPatient, totalCalories: number): number {
    // Diabetes: Lower carbs (40-45%)
    return (totalCalories * 0.40) / 4; // 40% carbs
  }

  calculateFat(patient: PlannerPatient, totalCalories: number): number {
    // Diabetes: Higher healthy fat (35-40%)
    return (totalCalories * 0.40) / 9; // 40% fat
  }

  getCalorieTargetMin(patient: PlannerPatient): number {
    return this.calculateTEE(patient) * 0.9;
  }

  getCalorieTargetMax(patient: PlannerPatient): number {
    return this.calculateTEE(patient) * 1.0; // No overfeeding
  }

  getProteinTargetMin(patient: PlannerPatient): number {
    const w = patient.weight_kg ?? 70;
    return w * 1.0;
  }

  getProteinTargetMax(patient: PlannerPatient): number {
    const w = patient.weight_kg ?? 70;
    return w * 1.4;
  }

  getAlertThresholds(patient?: PlannerPatient): AlertThresholds {
    return {
      glucoseLow: 80,
      glucoseHigh: 140, // Diabetes: Tighter control
      proteinLow: 1.0,
      proteinHigh: 1.5,
    };
  }

  validatePlan(plan: PlannerNutritionPlan): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    const totalCal = plan.totalCalories ?? plan.calories;

    if (plan.carbs_g > totalCal * 0.45 / 4) {
      errors.push('Diabetes: Carbs > 45% may cause hyperglycemia');
    }

    if (plan.glucose_avg && plan.glucose_avg > 180) {
      warnings.push('Consider insulin adjustment');
    }

    return { isValid: errors.length === 0, warnings, errors };
  }

  getSpecialConsiderations(patient: PlannerPatient): string[] {
    return [
      'Lower carb percentage (40-45%)',
      'Tighter glucose control (80-140 mg/dL)',
      'Monitor HbA1c every 3 months',
      'Consider carbohydrate counting',
    ];
  }
}

/**
 * Nephrology Planner (Kidney Disease Specific)
 */
export class NephrologyPlanner implements NutritionPlanner {
  getDepartmentName(): string { return 'Nephrology'; }
  getDepartmentNameAr(): string { return 'كلى'; }

  calculateREE(patient: PlannerPatient): number {
    return DefaultPlanner.prototype.calculateREE(patient);
  }

  calculateTEE(patient: PlannerPatient): number {
    return DefaultPlanner.prototype.calculateTEE(patient);
  }

  calculateProtein(patient: PlannerPatient): number {
    const w = patient.weight_kg ?? 70;
    // Nephrology: Lower protein (CKD: 0.6-0.8 g/kg, dialysis: 1.2 g/kg)
    if (patient.on_dialysis) {
      return w * 1.2;
    } else {
      return w * 0.7; // CKD non-dialysis
    }
  }

  calculateCarbs(patient: PlannerPatient, totalCalories: number): number {
    return (totalCalories * 0.55) / 4;
  }

  calculateFat(patient: PlannerPatient, totalCalories: number): number {
    return (totalCalories * 0.30) / 9;
  }

  getCalorieTargetMin(patient: PlannerPatient): number {
    return this.calculateTEE(patient) * 0.9;
  }

  getCalorieTargetMax(patient: PlannerPatient): number {
    return this.calculateTEE(patient) * 1.1;
  }

  getProteinTargetMin(patient: PlannerPatient): number {
    const w = patient.weight_kg ?? 70;
    return patient.on_dialysis ? w * 1.1 : w * 0.6;
  }

  getProteinTargetMax(patient: PlannerPatient): number {
    const w = patient.weight_kg ?? 70;
    return patient.on_dialysis ? w * 1.3 : w * 0.8;
  }

  getAlertThresholds(patient?: PlannerPatient): AlertThresholds {
    const onDialysis = patient?.on_dialysis ?? false;
    return {
      glucoseLow: 70,
      glucoseHigh: 180,
      proteinLow: 0.6,
      proteinHigh: onDialysis ? 1.3 : 0.8,
      potassiumLow: 3.5,
      potassiumHigh: 5.0,
      phosphorusHigh: 4.5,
    };
  }

  validatePlan(plan: PlannerNutritionPlan): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    const w = plan.patient.weight_kg ?? 70;

    if (!plan.patient.on_dialysis && plan.protein_g > w * 0.8) {
      errors.push('CKD non-dialysis: Protein > 0.8 g/kg may worsen kidney function');
    }

    if (plan.patient.on_dialysis && plan.protein_g < w * 1.1) {
      warnings.push('Dialysis: Protein < 1.1 g/kg may lead to malnutrition');
    }

    return { isValid: errors.length === 0, warnings, errors };
  }

  getSpecialConsiderations(patient: PlannerPatient): string[] {
    const considerations = [
      patient.on_dialysis
        ? 'Dialysis: Higher protein (1.2 g/kg) to prevent malnutrition'
        : 'CKD non-dialysis: Lower protein (0.6-0.8 g/kg) to preserve kidney function',
    ];

    considerations.push('Monitor potassium and phosphorus');
    considerations.push('Limit sodium if hypertensive');

    return considerations;
  }
}

/**
 * Department Planner Registry (Polymorphic - No Brittle String Matching)
 */
export class DepartmentPlannerRegistry {
  private static planners: Map<string, NutritionPlanner> = new Map([
    ['icu', new IcuPlanner()],
    ['critical-care', new IcuPlanner()],
    ['diabetes', new DiabetesPlanner()],
    ['dm', new DiabetesPlanner()],
    ['t1d', new DiabetesPlanner()],
    ['t2d', new DiabetesPlanner()],
    ['nephrology', new NephrologyPlanner()],
    ['kidney', new NephrologyPlanner()],
    ['ckd', new NephrologyPlanner()],
  ]);

  /**
   * Get Planner by Department ID (Polymorphic)
   */
  static getPlanner(department: string): NutritionPlanner {
    const normalized = department.toLowerCase().trim();
    return this.planners.get(normalized) || new DefaultPlanner();
  }

  /**
   * Get Planner by Patient (Auto-resolution)
   */
  static getPlannerByPatient(patient: PlannerPatient): NutritionPlanner {
    const dept = (patient.department || '').toLowerCase().trim();
    if (dept === 'icu' || dept === 'critical-care' || patient.is_ventilated) {
      return this.getPlanner('icu');
    }
    if (dept === 'diabetes' || dept === 'dm' || patient.has_diabetes) {
      return this.getPlanner('diabetes');
    }
    if (dept === 'nephrology' || dept === 'kidney' || patient.has_kidney_disease) {
      return this.getPlanner('nephrology');
    }

    const diag = (patient.primaryDiagnosis || '').toLowerCase().trim();
    if (diag.includes('icu') || diag.includes('critical care') || diag.includes('ventilat')) {
      return this.getPlanner('icu');
    }
    if (diag.includes('diabetes') || diag.includes('dm') || diag.includes('t1d') || diag.includes('t2d')) {
      return this.getPlanner('diabetes');
    }
    if (diag.includes('nephro') || diag.includes('kidney') || diag.includes('ckd') || diag.includes('renal')) {
      return this.getPlanner('nephrology');
    }

    return new DefaultPlanner();
  }

  /**
   * Register New Planner (Extendability)
   */
  static registerPlanner(departmentId: string, planner: NutritionPlanner): void {
    this.planners.set(departmentId.toLowerCase().trim(), planner);
  }

  /**
   * Get All Registered Departments
   */
  static getRegisteredDepartments(): string[] {
    return Array.from(this.planners.keys());
  }
}
