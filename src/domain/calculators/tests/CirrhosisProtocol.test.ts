import { describe, it, expect } from 'vitest';
import { CirrhosisProtocol, CirrhosisPatient } from '../CirrhosisProtocol';

describe('CirrhosisProtocol', () => {
  const compensatedPatient: CirrhosisPatient = {
    weight: 70,
    height: 170,
    age: 50,
    gender: 'male',
    childPughScore: 6,
    ascites: 'none',
    edema: 'none',
    encephalopathy: 'none',
    albumin: 3.8,
    bilirubin: 1.8,
    INR: 1.2,
    sodium: 138,
    creatinine: 0.9,
    medications: [],
    electrolytes: null,
  };

  const decompensatedPatient: CirrhosisPatient = {
    weight: 65,
    height: 165,
    age: 55,
    gender: 'female',
    childPughScore: 9,
    ascites: 'moderate',
    edema: 'moderate',
    encephalopathy: 'grade2',
    albumin: 2.8,
    bilirubin: 4.2,
    INR: 1.7,
    sodium: 132,
    creatinine: 1.4,
    medications: ['spironolactone 100mg', 'furosemide 40mg'],
    electrolytes: null,
  };

  const severeAscitesPatient: CirrhosisPatient = {
    ...compensatedPatient,
    childPughScore: 11,
    ascites: 'severe',
    edema: 'severe',
    encephalopathy: 'grade1',
    albumin: 2.5,
    INR: 1.8,
  };

  describe('calculateCalories', () => {
    it('should calculate calories for compensated cirrhosis', () => {
      const calories = CirrhosisProtocol.calculateCalories(compensatedPatient);
      expect(calories).toBeGreaterThanOrEqual(1500);
      expect(calories).toBeLessThanOrEqual(3500);
    });

    it('should increase calories for decompensated cirrhosis (Child-Pugh >= 7, stress factor 1.3)', () => {
      const calories = CirrhosisProtocol.calculateCalories(decompensatedPatient);
      expect(calories).toBeGreaterThanOrEqual(1500);
      expect(calories).toBeLessThanOrEqual(3500);
    });

    it('should use stress factor 1.5 for Child-Pugh >= 10', () => {
      const calories = CirrhosisProtocol.calculateCalories(severeAscitesPatient);
      expect(calories).toBeGreaterThanOrEqual(1500);
      expect(calories).toBeLessThanOrEqual(3500);
    });

    it('should floor calories at 1500 for invalid inputs', () => {
      const result = CirrhosisProtocol.calculateCalories({
        ...compensatedPatient,
        weight: -1,
      });
      expect(result).toBe(1500);
    });
  });

  describe('calculateProtein', () => {
    it('should use 1.2 g/kg when encephalopathy is none and Child-Pugh < 7', () => {
      const protein = CirrhosisProtocol.calculateProtein(compensatedPatient);
      expect(protein).toBe(Math.round(70 * 1.2));
    });

    it('should use 1.5 g/kg when encephalopathy is none and Child-Pugh >= 7', () => {
      const cp9 = CirrhosisProtocol.calculateProtein({
        ...compensatedPatient,
        childPughScore: 8,
        encephalopathy: 'none',
      });
      expect(cp9).toBe(Math.round(70 * 1.5));
    });

    it('should use 1.2 g/kg for grade 2 encephalopathy', () => {
      const protein = CirrhosisProtocol.calculateProtein(decompensatedPatient);
      expect(protein).toBe(Math.round(65 * 1.2));
    });

    it('should use 1.0 g/kg for grade 3 or 4 encephalopathy', () => {
      const protein = CirrhosisProtocol.calculateProtein({
        ...compensatedPatient,
        encephalopathy: 'grade3',
      });
      expect(protein).toBe(Math.round(70 * 1.0));
    });

    it('should cap protein at 150g', () => {
      const protein = CirrhosisProtocol.calculateProtein({
        ...compensatedPatient,
        weight: 120,
        encephalopathy: 'none',
        childPughScore: 8,
      });
      expect(protein).toBeLessThanOrEqual(150);
    });

    it('should floor protein at 60g for invalid inputs', () => {
      const protein = CirrhosisProtocol.calculateProtein({
        ...compensatedPatient,
        weight: 0,
      });
      expect(protein).toBe(60);
    });
  });

  describe('calculateMacros', () => {
    it('should distribute remaining calories as 55% carbs and 30% fat', () => {
      const { carbs, fat } = CirrhosisProtocol.calculateMacros(2000, 84);
      const proteinCalories = 84 * 4;
      const nonProteinCalories = 2000 - proteinCalories;
      const expectedCarbs = Math.round((nonProteinCalories * 0.55 / 0.85) / 4);
      const expectedFat = Math.round((nonProteinCalories * 0.30 / 0.85) / 9);
      expect(carbs).toBe(expectedCarbs);
      expect(fat).toBe(expectedFat);
    });

    it('should return zeros for invalid inputs', () => {
      const { carbs, fat } = CirrhosisProtocol.calculateMacros(0, 0);
      expect(carbs).toBe(0);
      expect(fat).toBe(0);
    });
  });

  describe('calculateSodium', () => {
    it('should return 2500 mg when no ascites or edema', () => {
      const sodium = CirrhosisProtocol.calculateSodium(compensatedPatient);
      expect(sodium).toBe(2500);
    });

    it('should return 2000 mg when ascites is present', () => {
      const sodium = CirrhosisProtocol.calculateSodium(decompensatedPatient);
      expect(sodium).toBe(2000);
    });

    it('should return 2000 mg when edema is present without ascites', () => {
      const sodium = CirrhosisProtocol.calculateSodium({
        ...compensatedPatient,
        ascites: 'none',
        edema: 'mild',
      });
      expect(sodium).toBe(2000);
    });
  });

  describe('createMealPlan', () => {
    it('should create 3 main meals and 2 snacks', () => {
      const plan = CirrhosisProtocol.createMealPlan(2000, 84, 250, 65, 2000, 'none');
      expect(plan.mainMeals).toHaveLength(3);
      expect(plan.snacks).toHaveLength(2);
    });

    it('should distribute calories correctly across meals', () => {
      const plan = CirrhosisProtocol.createMealPlan(2000, 84, 250, 65, 2000, 'none');
      const totalCalories = plan.mainMeals.reduce((s, m) => s + m.calories, 0) +
                            plan.snacks.reduce((s, m) => s + m.calories, 0);
      expect(totalCalories).toBe(2000);
    });

    it('should set fluid restriction at 1500 mL for severe ascites', () => {
      const plan = CirrhosisProtocol.createMealPlan(2000, 84, 250, 65, 2000, 'severe');
      expect(plan.fluidRestriction).toBe(1500);
    });

    it('should not set fluid restriction when ascites is not severe', () => {
      const plan = CirrhosisProtocol.createMealPlan(2000, 84, 250, 65, 2000, 'moderate');
      expect(plan.fluidRestriction).toBeNull();
    });

    it('should return empty arrays for invalid inputs', () => {
      const plan = CirrhosisProtocol.createMealPlan(0, 0, 0, 0, 0, 'none');
      expect(plan.mainMeals).toHaveLength(0);
      expect(plan.snacks).toHaveLength(0);
    });
  });

  describe('createSupplementPlan', () => {
    it('should include zinc supplement', () => {
      const supp = CirrhosisProtocol.createSupplementPlan(compensatedPatient);
      expect(supp.zinc).not.toBeNull();
      expect(supp.zinc!.dose).toBe(25);
    });

    it('should include vitamin D supplement', () => {
      const supp = CirrhosisProtocol.createSupplementPlan(compensatedPatient);
      expect(supp.vitaminD).not.toBeNull();
      expect(supp.vitaminD!.dose).toBe(1000);
    });

    it('should include vitamin K when INR > 1.5', () => {
      const supp = CirrhosisProtocol.createSupplementPlan(decompensatedPatient);
      expect(supp.vitaminK).not.toBeNull();
      expect(supp.vitaminK!.dose).toBe(5);
    });

    it('should not include vitamin K when INR <= 1.5', () => {
      const supp = CirrhosisProtocol.createSupplementPlan(compensatedPatient);
      expect(supp.vitaminK).toBeNull();
    });

    it('should include multivitamin', () => {
      const supp = CirrhosisProtocol.createSupplementPlan(compensatedPatient);
      expect(supp.multivitamin).not.toBeNull();
    });
  });

  describe('createAlerts', () => {
    it('should prohibit alcohol', () => {
      const alerts = CirrhosisProtocol.createAlerts(compensatedPatient);
      expect(alerts).toEqual(expect.arrayContaining([
        expect.stringContaining('كحول: ممنوع تماماً'),
      ]));
    });

    it('should include encephalopathy caution for grade 3 or 4', () => {
      const alerts = CirrhosisProtocol.createAlerts({
        ...compensatedPatient,
        encephalopathy: 'grade3',
      });
      expect(alerts).toEqual(expect.arrayContaining([
        expect.stringContaining('بروتين: استخدام 1.0 غ/كغ بحذر'),
      ]));
    });

    it('should include sodium restriction alert when ascites present', () => {
      const alerts = CirrhosisProtocol.createAlerts(decompensatedPatient);
      expect(alerts).toEqual(expect.arrayContaining([
        expect.stringContaining('صوديوم: محدود'),
      ]));
    });

    it('should include fluid restriction alert for severe ascites', () => {
      const alerts = CirrhosisProtocol.createAlerts(severeAscitesPatient);
      expect(alerts).toEqual(expect.arrayContaining([
        expect.stringContaining('سوائل: محدود < 1500 مل/يوم'),
      ]));
    });

    it('should include vitamin K alert when INR > 1.5', () => {
      const alerts = CirrhosisProtocol.createAlerts(decompensatedPatient);
      expect(alerts).toEqual(expect.arrayContaining([
        expect.stringContaining('فيتامين K'),
      ]));
    });

    it('should include hypoalbuminemia alert when albumin < 3.0', () => {
      const alerts = CirrhosisProtocol.createAlerts(decompensatedPatient);
      expect(alerts).toEqual(expect.arrayContaining([
        expect.stringContaining('ألبومين منخفض'),
      ]));
    });

    it('should include hyponatremia alert when sodium < 130', () => {
      const alerts = CirrhosisProtocol.createAlerts({
        ...compensatedPatient,
        sodium: 128,
      });
      expect(alerts).toEqual(expect.arrayContaining([
        expect.stringContaining('صوديوم منخفض جداً'),
      ]));
    });

    it('should include high creatinine alert when > 1.5', () => {
      const alerts = CirrhosisProtocol.createAlerts({
        ...compensatedPatient,
        creatinine: 1.8,
      });
      expect(alerts).toEqual(expect.arrayContaining([
        expect.stringContaining('كرياتينين مرتفع'),
      ]));
    });

    it('should include high bilirubin alert when > 5.0', () => {
      const alerts = CirrhosisProtocol.createAlerts({
        ...compensatedPatient,
        bilirubin: 5.5,
      });
      expect(alerts).toEqual(expect.arrayContaining([
        expect.stringContaining('بيليروبين مرتفع جداً'),
      ]));
    });

    it('should include laxative precaution', () => {
      const alerts = CirrhosisProtocol.createAlerts(compensatedPatient);
      expect(alerts).toEqual(expect.arrayContaining([
        expect.stringContaining('مسهلات: تجنب المسهلات القوية'),
      ]));
    });

    it('should detect DNI interactions for spironolactone', () => {
      const alerts = CirrhosisProtocol.createAlerts(decompensatedPatient);
      expect(alerts).toEqual(expect.arrayContaining([
        expect.stringContaining('سبيرونولاكتون'),
      ]));
    });

    it('should detect DNI interactions for furosemide', () => {
      const alerts = CirrhosisProtocol.createAlerts(decompensatedPatient);
      expect(alerts).toEqual(expect.arrayContaining([
        expect.stringContaining('فوروسيميد'),
      ]));
    });

    it('should handle invalid lab values gracefully', () => {
      const alerts = CirrhosisProtocol.createAlerts({
        ...compensatedPatient,
        albumin: NaN,
        bilirubin: NaN,
        INR: NaN,
      });
      expect(alerts).toEqual(expect.arrayContaining([
        expect.stringContaining('بعض القيم المخبرية غير صالحة'),
      ]));
    });
  });

  describe('createMonitoringPlan', () => {
    it('should include basic lab tests', () => {
      const plan = CirrhosisProtocol.createMonitoringPlan(compensatedPatient);
      expect(plan.labTests.map(t => t.test)).toContain('Albumin');
      expect(plan.labTests.map(t => t.test)).toContain('Bilirubin');
      expect(plan.labTests.map(t => t.test)).toContain('INR');
      expect(plan.labTests.map(t => t.test)).toContain('Sodium');
      expect(plan.labTests.map(t => t.test)).toContain('Creatinine');
    });

    it('should include clinical monitoring parameters', () => {
      const plan = CirrhosisProtocol.createMonitoringPlan(compensatedPatient);
      expect(plan.clinical.map(c => c.parameter)).toContain('Weight');
      expect(plan.clinical.map(c => c.parameter)).toContain('Ascites');
      expect(plan.clinical.map(c => c.parameter)).toContain('Edema');
      expect(plan.clinical.map(c => c.parameter)).toContain('Encephalopathy');
    });

    it('should target encephalopathy reduction when present', () => {
      const plan = CirrhosisProtocol.createMonitoringPlan(decompensatedPatient);
      const encParam = plan.clinical.find(c => c.parameter === 'Encephalopathy');
      expect(encParam).toBeDefined();
      expect(encParam!.target).toBe('تقليل الدرجة');
    });

    it('should include fluid monitoring for severe ascites', () => {
      const plan = CirrhosisProtocol.createMonitoringPlan(severeAscitesPatient);
      const fluidParam = plan.clinical.find(c => c.parameter === 'Fluid intake');
      expect(fluidParam).toBeDefined();
      expect(fluidParam!.target).toContain('1500 مل/يوم');
    });
  });

  describe('createTitrationPlan', () => {
    it('should return plan for Child-Pugh >= 10', () => {
      const plan = CirrhosisProtocol.createTitrationPlan(severeAscitesPatient);
      expect(plan).not.toBeNull();
      expect(plan!.increaseCalories).toBe(100);
      expect(plan!.increaseProtein).toBe(5);
    });

    it('should return plan for albumin < 3.0', () => {
      const plan = CirrhosisProtocol.createTitrationPlan(decompensatedPatient);
      expect(plan).not.toBeNull();
      expect(plan!.increaseCalories).toBe(100);
    });

    it('should return null for compensated cirrhosis', () => {
      const plan = CirrhosisProtocol.createTitrationPlan(compensatedPatient);
      expect(plan).toBeNull();
    });
  });

  describe('checkRefeedingRisk', () => {
    it('should detect high risk for low weight with low albumin', () => {
      const result = CirrhosisProtocol.checkRefeedingRisk({
        ...compensatedPatient,
        weight: 45,
        albumin: 2.5,
        childPughScore: 10,
      });
      expect(result.isHighRisk).toBe(true);
    });

    it('should not flag risk for stable compensated patient', () => {
      const result = CirrhosisProtocol.checkRefeedingRisk(compensatedPatient);
      expect(result.isHighRisk).toBe(false);
    });
  });

  describe('generatePrescription', () => {
    it('should generate a complete prescription for compensated cirrhosis', () => {
      const rx = CirrhosisProtocol.generatePrescription(compensatedPatient);
      expect(rx.calories).toBeGreaterThanOrEqual(1500);
      expect(rx.protein).toBeGreaterThanOrEqual(60);
      expect(rx.sodium).toBe(2500);
      expect(rx.meals.mainMeals).toHaveLength(3);
      expect(rx.meals.snacks).toHaveLength(2);
      expect(rx.supplements.zinc).not.toBeNull();
      expect(rx.supplements.vitaminD).not.toBeNull();
      expect(rx.supplements.vitaminK).toBeNull();
      expect(rx.alerts.length).toBeGreaterThan(0);
      expect(rx.monitoring.labTests.length).toBeGreaterThan(0);
      expect(rx.monitoring.clinical.length).toBeGreaterThan(0);
    });

    it('should generate a complete prescription for decompensated cirrhosis', () => {
      const rx = CirrhosisProtocol.generatePrescription(decompensatedPatient);
      expect(rx.calories).toBeGreaterThanOrEqual(1500);
      expect(rx.protein).toBeLessThanOrEqual(120);
      expect(rx.sodium).toBe(2000);
      expect(rx.meals.fluidRestriction).toBeNull();
      expect(rx.supplements.vitaminK).not.toBeNull();
      expect(rx.alerts).toEqual(expect.arrayContaining([
        expect.stringContaining('فيتامين K'),
      ]));
    });

    it('should include fluid restriction for severe ascites', () => {
      const rx = CirrhosisProtocol.generatePrescription(severeAscitesPatient);
      expect(rx.meals.fluidRestriction).toBe(1500);
    });

    it('should include titration plan for decompensated patient', () => {
      const rx = CirrhosisProtocol.generatePrescription(decompensatedPatient);
      expect(rx.titration).not.toBeNull();
    });

    it('should not include titration plan for compensated patient', () => {
      const rx = CirrhosisProtocol.generatePrescription(compensatedPatient);
      expect(rx.titration).toBeNull();
    });

    it('should return safe fallback for invalid inputs', () => {
      const rx = CirrhosisProtocol.generatePrescription({
        ...compensatedPatient,
        weight: -1,
      });
      expect(rx.calories).toBe(0);
      expect(rx.protein).toBe(0);
      expect(rx.meals.mainMeals).toHaveLength(0);
      expect(rx.alerts[0]).toContain('الرجاء إدخال بيانات صحيحة');
    });
  });
});
