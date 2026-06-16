import { describe, test, expect } from 'vitest';
import { DepartmentPlannerRegistry, DefaultPlanner, IcuPlanner, DiabetesPlanner, NephrologyPlanner, NutritionPlanner, PlannerPatient } from '../DepartmentPlannerRegistry';

const basePatient: PlannerPatient = {
  id: 'test-1',
  fileNumber: 'FN-001',
  fullName: 'Test Patient',
  age: 45,
  dateOfBirth: null,
  gender: 'male',
  nationalId: null,
  nationality: null,
  phoneNumber: null,
  department: '',
  bedNumber: null,
  admissionDate: new Date().toISOString(),
  referringPhysician: null,
  primaryDiagnosis: '',
  patientType: 'inpatient',
  status: 'active',
  notes: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  weight_kg: 70,
  height_cm: 175,
  is_ventilated: false,
  has_diabetes: false,
  has_kidney_disease: false,
  on_dialysis: false,
  activity_factor: 1.2,
  stress_factor: 1.0,
};

describe('DepartmentPlannerRegistry', () => {
  describe('DefaultPlanner', () => {
    const planner = new DefaultPlanner();

    test('getDepartmentName returns Default', () => {
      expect(planner.getDepartmentName()).toBe('Default');
    });

    test('calculateProtein returns 0.8 g/kg', () => {
      expect(planner.calculateProtein(basePatient)).toBe(56);
    });

    test('calculateCarbs returns 55% of calories', () => {
      const carbs = planner.calculateCarbs(basePatient, 2000);
      expect(carbs).toBe(275);
    });

    test('calculateFat returns 30% of calories', () => {
      const fat = planner.calculateFat(basePatient, 2000);
      expect(fat).toBeCloseTo(66.7, 1);
    });

    test('getAlertThresholds returns default values', () => {
      const thresholds = planner.getAlertThresholds(basePatient);
      expect(thresholds.glucoseLow).toBe(70);
      expect(thresholds.glucoseHigh).toBe(180);
      expect(thresholds.proteinLow).toBe(0.8);
      expect(thresholds.proteinHigh).toBe(2.0);
    });

    test('validatePlan returns valid by default', () => {
      const result = planner.validatePlan({
        patient: basePatient,
        calories: 2000,
        protein_g: 56,
        carbs_g: 275,
        fat_g: 67,
        totalCalories: 2000,
      });
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('getSpecialConsiderations returns empty array', () => {
      expect(planner.getSpecialConsiderations(basePatient)).toHaveLength(0);
    });
  });

  describe('IcuPlanner', () => {
    const planner = new IcuPlanner();

    test('getDepartmentName returns ICU', () => {
      expect(planner.getDepartmentName()).toBe('ICU');
    });

    test('calculateProtein returns 1.8 g/kg (higher than default)', () => {
      const protein = planner.calculateProtein(basePatient);
      expect(protein).toBe(126);
    });

    test('calculateCarbs returns 40% (lower than default for CO2)', () => {
      const carbs = planner.calculateCarbs(basePatient, 2000);
      expect(carbs).toBe(200);
    });

    test('calculateFat returns 45% (higher than default)', () => {
      const fat = planner.calculateFat(basePatient, 2000);
      expect(fat).toBe(100);
    });

    test('getAlertThresholds has tighter glucose control', () => {
      const thresholds = planner.getAlertThresholds(basePatient);
      expect(thresholds.glucoseHigh).toBe(150);
      expect(thresholds.refeedingRisk).toBe(true);
    });

    test('validatePlan flags low protein', () => {
      const result = planner.validatePlan({
        patient: basePatient,
        calories: 2000,
        protein_g: 80,
        carbs_g: 200,
        fat_g: 100,
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ICU: Protein < 1.5 g/kg may lead to muscle wasting');
    });

    test('validatePlan passes with adequate protein', () => {
      const result = planner.validatePlan({
        patient: basePatient,
        calories: 2000,
        protein_g: 126,
        carbs_g: 200,
        fat_g: 100,
      });
      expect(result.isValid).toBe(true);
    });

    test('getSpecialConsiderations includes ventilator note', () => {
      const ventPatient = { ...basePatient, is_ventilated: true };
      const considerations = planner.getSpecialConsiderations(ventPatient);
      expect(considerations).toContain('Lower carbs to reduce CO2 production');
    });
  });

  describe('DiabetesPlanner', () => {
    const planner = new DiabetesPlanner();

    test('getDepartmentName returns Diabetes', () => {
      expect(planner.getDepartmentName()).toBe('Diabetes');
    });

    test('calculateProtein returns 1.2 g/kg', () => {
      expect(planner.calculateProtein(basePatient)).toBe(84);
    });

    test('calculateCarbs returns 40% (lower for glucose control)', () => {
      const carbs = planner.calculateCarbs(basePatient, 1800);
      expect(carbs).toBe(180);
    });

    test('calculateFat returns 40%', () => {
      const fat = planner.calculateFat(basePatient, 1800);
      expect(fat).toBe(80);
    });

    test('getAlertThresholds has tight glucose (80-140)', () => {
      const thresholds = planner.getAlertThresholds(basePatient);
      expect(thresholds.glucoseHigh).toBe(140);
    });

    test('validatePlan warns on high carbs', () => {
      const result = planner.validatePlan({
        patient: basePatient,
        calories: 1800,
        protein_g: 84,
        carbs_g: 300,
        fat_g: 80,
        totalCalories: 1800,
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Diabetes: Carbs > 45% may cause hyperglycemia');
    });
  });

  describe('NephrologyPlanner', () => {
    const planner = new NephrologyPlanner();

    test('getDepartmentName returns Nephrology', () => {
      expect(planner.getDepartmentName()).toBe('Nephrology');
    });

    test('calculateProtein returns 0.7 g/kg for non-dialysis', () => {
      const nonDialysis = { ...basePatient, on_dialysis: false };
      expect(planner.calculateProtein(nonDialysis)).toBe(49);
    });

    test('calculateProtein returns 1.2 g/kg for dialysis', () => {
      const dialysis = { ...basePatient, on_dialysis: true };
      expect(planner.calculateProtein(dialysis)).toBe(84);
    });

    test('validatePlan errors on high protein for non-dialysis', () => {
      const nonDialysis = { ...basePatient, on_dialysis: false, weight_kg: 70 };
      const result = planner.validatePlan({
        patient: nonDialysis,
        calories: 2000,
        protein_g: 70,
        carbs_g: 275,
        fat_g: 67,
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('CKD non-dialysis: Protein > 0.8 g/kg may worsen kidney function');
    });

    test('getSpecialConsiderations differs by dialysis status', () => {
      const nonDialysis = { ...basePatient, on_dialysis: false };
      const considerations = planner.getSpecialConsiderations(nonDialysis);
      expect(considerations[0]).toContain('CKD non-dialysis');
    });
  });

  describe('Registry', () => {
    test('getPlanner returns correct planner by name', () => {
      expect(DepartmentPlannerRegistry.getPlanner('ICU').getDepartmentName()).toBe('ICU');
      expect(DepartmentPlannerRegistry.getPlanner('icu').getDepartmentName()).toBe('ICU');
      expect(DepartmentPlannerRegistry.getPlanner('Diabetes').getDepartmentName()).toBe('Diabetes');
      expect(DepartmentPlannerRegistry.getPlanner('nephrology').getDepartmentName()).toBe('Nephrology');
    });

    test('getPlanner returns Default for unknown', () => {
      expect(DepartmentPlannerRegistry.getPlanner('unknown').getDepartmentName()).toBe('Default');
    });

    test('getPlannerByPatient auto-detects ICU', () => {
      const icuPatient = { ...basePatient, department: 'ICU', is_ventilated: true };
      expect(DepartmentPlannerRegistry.getPlannerByPatient(icuPatient).getDepartmentName()).toBe('ICU');
    });

    test('getPlannerByPatient auto-detects Diabetes', () => {
      const dmPatient = { ...basePatient, department: 'Diabetes', has_diabetes: true };
      expect(DepartmentPlannerRegistry.getPlannerByPatient(dmPatient).getDepartmentName()).toBe('Diabetes');
    });

    test('getPlannerByPatient auto-detects Nephrology', () => {
      const renalPatient = { ...basePatient, department: 'Nephrology', has_kidney_disease: true };
      expect(DepartmentPlannerRegistry.getPlannerByPatient(renalPatient).getDepartmentName()).toBe('Nephrology');
    });

    test('getPlannerByPatient detects via primaryDiagnosis', () => {
      const icuByDiag = { ...basePatient, primaryDiagnosis: 'ICU admission for sepsis' };
      expect(DepartmentPlannerRegistry.getPlannerByPatient(icuByDiag).getDepartmentName()).toBe('ICU');

      const dmByDiag = { ...basePatient, primaryDiagnosis: 'Type 2 Diabetes mellitus' };
      expect(DepartmentPlannerRegistry.getPlannerByPatient(dmByDiag).getDepartmentName()).toBe('Diabetes');

      const ckdByDiag = { ...basePatient, primaryDiagnosis: 'CKD stage 3' };
      expect(DepartmentPlannerRegistry.getPlannerByPatient(ckdByDiag).getDepartmentName()).toBe('Nephrology');
    });

    test('registerPlanner allows extension', () => {
      class TestPlanner implements NutritionPlanner {
        getDepartmentName() { return 'TestDept'; }
        getDepartmentNameAr() { return 'اختبار'; }
        calculateREE() { return 1500; }
        calculateTEE() { return 1800; }
        calculateProtein(p: PlannerPatient) { return p.weight_kg! * 1.0; }
        calculateCarbs() { return 200; }
        calculateFat() { return 70; }
        getCalorieTargetMin() { return 1500; }
        getCalorieTargetMax() { return 2000; }
        getProteinTargetMin(p: PlannerPatient) { return p.weight_kg! * 0.8; }
        getProteinTargetMax(p: PlannerPatient) { return p.weight_kg! * 1.2; }
        getAlertThresholds() { return { glucoseLow: 70, glucoseHigh: 180, proteinLow: 0.8, proteinHigh: 2.0 }; }
        validatePlan() { return { isValid: true, warnings: [], errors: [] }; }
        getSpecialConsiderations() { return ['Custom consideration']; }
      }

      DepartmentPlannerRegistry.registerPlanner('test-dept', new TestPlanner());
      const planner = DepartmentPlannerRegistry.getPlanner('test-dept');
      expect(planner.getDepartmentName()).toBe('TestDept');
      expect(planner.getDepartmentNameAr()).toBe('اختبار');
    });

    test('getRegisteredDepartments includes all departments', () => {
      const departments = DepartmentPlannerRegistry.getRegisteredDepartments();
      expect(departments).toContain('icu');
      expect(departments).toContain('diabetes');
      expect(departments).toContain('nephrology');
    });
  });
});
