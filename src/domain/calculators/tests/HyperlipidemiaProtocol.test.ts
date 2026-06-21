import { describe, it, expect } from 'vitest';
import { HyperlipidemiaProtocol, HyperlipidemiaPatient } from '../HyperlipidemiaProtocol';

describe('HyperlipidemiaProtocol', () => {
  const highLdlPatient: HyperlipidemiaPatient = {
    weight: 80,
    height: 175,
    age: 50,
    gender: 'male',
    bmi: 26,
    type: 'cholesterol',
    lipids: { ldl: 160, hdl: 35, tg: 180, total: 250 },
    riskFactors: ['smoking', 'diabetes'],
    familyHistory: true,
    diabetes: true,
    hypertension: false,
    smoking: true,
    alcohol: false,
    diet: { saturatedFat: 'high', transFat: 'moderate', fiber: 'low', carbs: 'moderate' },
    weightLoss: 2,
    medications: ['statin'],
  };

  const highTgPatient: HyperlipidemiaPatient = {
    weight: 75,
    height: 175,
    age: 50,
    gender: 'male',
    bmi: 25,
    type: 'triglycerides',
    lipids: { ldl: 110, hdl: 30, tg: 350, total: 200 },
    riskFactors: [],
    familyHistory: false,
    diabetes: false,
    hypertension: false,
    smoking: false,
    alcohol: true,
    diet: { saturatedFat: 'moderate', transFat: 'low', fiber: 'moderate', carbs: 'high' },
    weightLoss: 1,
    medications: ['gemfibrozil', 'niacin'],
  };

  const obesePatient: HyperlipidemiaPatient = {
    weight: 100,
    height: 165,
    age: 45,
    gender: 'female',
    bmi: 36,
    type: 'mixed',
    lipids: { ldl: 200, hdl: 32, tg: 450, total: 320 },
    riskFactors: ['smoking', 'diabetes', 'hypertension'],
    familyHistory: true,
    diabetes: true,
    hypertension: true,
    smoking: true,
    alcohol: false,
    diet: { saturatedFat: 'high', transFat: 'high', fiber: 'low', carbs: 'high' },
    weightLoss: 8,
    medications: ['atorvastatin', 'fenofibrate'],
  };

  describe('calculateCalories', () => {
    it('should calculate calories for standard patient', () => {
      const calories = HyperlipidemiaProtocol.calculateCalories(highLdlPatient);
      expect(calories).toBeGreaterThanOrEqual(1500);
      expect(calories).toBeLessThanOrEqual(3000);
    });

    it('should reduce calories for obese patient (BMI >= 30)', () => {
      const normalCal = HyperlipidemiaProtocol.calculateCalories(highLdlPatient);
      const obCal = HyperlipidemiaProtocol.calculateCalories(obesePatient);
      expect(obCal).toBeLessThan(normalCal);
    });

    it('should add 100 kcal for excessive weight loss', () => {
      const normalCal = HyperlipidemiaProtocol.calculateCalories({
        ...highLdlPatient,
        weightLoss: 2,
      });
      const highLossCal = HyperlipidemiaProtocol.calculateCalories({
        ...highLdlPatient,
        weightLoss: 8,
      });
      expect(highLossCal).toBeGreaterThanOrEqual(normalCal);
    });

    it('should return fallback 1500 for invalid inputs', () => {
      const calories = HyperlipidemiaProtocol.calculateCalories({
        ...highLdlPatient,
        weight: -1,
      });
      expect(calories).toBe(1500);
    });
  });

  describe('calculateProtein', () => {
    it('should calculate 1.0 g/kg for standard patient', () => {
      const protein = HyperlipidemiaProtocol.calculateProtein(highLdlPatient);
      expect(protein).toBeGreaterThanOrEqual(50);
    });

    it('should increase protein for diabetic patient', () => {
      const nonDiabetic = HyperlipidemiaProtocol.calculateProtein({
        ...highLdlPatient,
        diabetes: false,
      });
      const diabetic = HyperlipidemiaProtocol.calculateProtein(highLdlPatient);
      expect(diabetic).toBeGreaterThanOrEqual(nonDiabetic);
    });

    it('should floor protein at 50g for low weight', () => {
      const protein = HyperlipidemiaProtocol.calculateProtein({
        ...highLdlPatient,
        weight: 30,
      });
      expect(protein).toBe(50);
    });

    it('should return fallback 50 for invalid weight', () => {
      const protein = HyperlipidemiaProtocol.calculateProtein({
        ...highLdlPatient,
        weight: -1,
      });
      expect(protein).toBe(50);
    });
  });

  describe('calculateMacros', () => {
    it('should calculate low saturated fat (< 7%)', () => {
      const { saturatedFat } = HyperlipidemiaProtocol.calculateMacros(2000, 80, highLdlPatient);
      expect(saturatedFat).toBeLessThan(20);
    });

    it('should calculate lower carbs for TG type', () => {
      const { carbs: cholCarbs } = HyperlipidemiaProtocol.calculateMacros(2000, 80, highLdlPatient);
      const { carbs: tgCarbs } = HyperlipidemiaProtocol.calculateMacros(2000, 80, highTgPatient);
      expect(tgCarbs).toBeLessThan(cholCarbs);
    });

    it('should calculate fat at approximately 30% of calories', () => {
      const { fat } = HyperlipidemiaProtocol.calculateMacros(2000, 80, highLdlPatient);
      const fatCal = fat * 9;
      const fatPercent = fatCal / 2000;
      expect(fatPercent).toBeGreaterThan(0.20);
      expect(fatPercent).toBeLessThan(0.40);
    });

    it('should return zero fallback for invalid inputs', () => {
      const result = HyperlipidemiaProtocol.calculateMacros(-1, 80, highLdlPatient);
      expect(result.carbs).toBe(0);
      expect(result.fat).toBe(0);
    });
  });

  describe('createMealPlan', () => {
    it('should create 3 main meals and 2 snacks', () => {
      const plan = HyperlipidemiaProtocol.createMealPlan(2000, 80, 250, 60, highLdlPatient);
      expect(plan.mainMeals.length).toBe(3);
      expect(plan.snacks.length).toBe(2);
    });

    it('should use unsaturated fat type', () => {
      const plan = HyperlipidemiaProtocol.createMealPlan(2000, 80, 250, 60, highLdlPatient);
      expect(plan.fatType).toBe('unsaturated');
    });

    it('should return empty fallback for invalid inputs', () => {
      const plan = HyperlipidemiaProtocol.createMealPlan(-1, 80, 250, 60, highLdlPatient);
      expect(plan.mainMeals).toEqual([]);
    });
  });

  describe('createRestrictions', () => {
    it('should include saturated fat restriction', () => {
      const restrictions = HyperlipidemiaProtocol.createRestrictions(highLdlPatient);
      expect(restrictions.some(r => r.includes('مشبعة'))).toBe(true);
    });

    it('should restrict egg yolk if LDL > 130', () => {
      const restrictions = HyperlipidemiaProtocol.createRestrictions(highLdlPatient);
      expect(restrictions.some(r => r.includes('البيض'))).toBe(true);
    });

    it('should restrict alcohol if TG high', () => {
      const restrictions = HyperlipidemiaProtocol.createRestrictions(highTgPatient);
      expect(restrictions.some(r => r.includes('الكحول'))).toBe(true);
    });

    it('should restrict simple carbs if TG high', () => {
      const restrictions = HyperlipidemiaProtocol.createRestrictions(highTgPatient);
      expect(restrictions.some(r => r.includes('الكربوهيدرات'))).toBe(true);
    });
  });

  describe('createRecommendations', () => {
    it('should include Omega-3 recommendation', () => {
      const recs = HyperlipidemiaProtocol.createRecommendations(highLdlPatient);
      expect(recs.some(r => r.includes('Omega-3'))).toBe(true);
    });

    it('should include fiber recommendation', () => {
      const recs = HyperlipidemiaProtocol.createRecommendations(highLdlPatient);
      expect(recs.some(r => r.includes('fiber'))).toBe(true);
    });

    it('should include exercise recommendation', () => {
      const recs = HyperlipidemiaProtocol.createRecommendations(highLdlPatient);
      expect(recs.some(r => r.includes('تمرين'))).toBe(true);
    });

    it('should include weight loss recommendation for BMI >= 25', () => {
      const recs = HyperlipidemiaProtocol.createRecommendations(obesePatient);
      expect(recs.some(r => r.includes('الوزن'))).toBe(true);
    });
  });

  describe('createAlerts', () => {
    it('should generate LDL alert for high LDL', () => {
      const alerts = HyperlipidemiaProtocol.createAlerts(highLdlPatient);
      expect(alerts.some(a => a.includes('LDL'))).toBe(true);
    });

    it('should generate severe LDL alert for LDL > 190', () => {
      const alerts = HyperlipidemiaProtocol.createAlerts(obesePatient);
      expect(alerts.some(a => a.includes('severe'))).toBe(true);
    });

    it('should generate TG alert for high TG', () => {
      const alerts = HyperlipidemiaProtocol.createAlerts(highTgPatient);
      expect(alerts.some(a => a.includes('TG'))).toBe(true);
    });

    it('should generate smoking alert', () => {
      const alerts = HyperlipidemiaProtocol.createAlerts(highLdlPatient);
      expect(alerts.some(a => a.includes('Smoking'))).toBe(true);
    });

    it('should generate DNI alerts for medications', () => {
      const alerts = HyperlipidemiaProtocol.createAlerts(highLdlPatient);
      expect(alerts.some(a => a.includes('ستاتين'))).toBe(true);
    });

    it('should generate risk factor alert for 3+ risk factors', () => {
      const alerts = HyperlipidemiaProtocol.createAlerts(obesePatient);
      expect(alerts.some(a => a.includes('Risk factors'))).toBe(true);
    });
  });

  describe('createMonitoringPlan', () => {
    it('should include 5 lab tests', () => {
      const plan = HyperlipidemiaProtocol.createMonitoringPlan(highLdlPatient);
      expect(plan.labTests.length).toBe(5);
    });

    it('should set LDL target < 70 for diabetics', () => {
      const plan = HyperlipidemiaProtocol.createMonitoringPlan(highLdlPatient);
      const ldlTest = plan.labTests.find(t => t.test === 'LDL');
      expect(ldlTest!.target).toBe('< 70 mg/dL');
    });

    it('should set LDL target < 100 for non-diabetic', () => {
      const plan = HyperlipidemiaProtocol.createMonitoringPlan(highTgPatient);
      const ldlTest = plan.labTests.find(t => t.test === 'LDL');
      expect(ldlTest!.target).toBe('< 100 mg/dL');
    });
  });

  describe('createTitrationPlan', () => {
    it('should create titration plan when LDL > 130', () => {
      const plan = HyperlipidemiaProtocol.createTitrationPlan(highLdlPatient);
      expect(plan).not.toBeNull();
      expect(plan!.decreaseSaturatedFat).toBe(2);
    });

    it('should create titration plan when TG > 200', () => {
      const plan = HyperlipidemiaProtocol.createTitrationPlan(highTgPatient);
      expect(plan).not.toBeNull();
    });

    it('should return null when lipids are well-controlled', () => {
      const plan = HyperlipidemiaProtocol.createTitrationPlan({
        ...highLdlPatient,
        lipids: { ldl: 100, hdl: 50, tg: 120, total: 180 },
      });
      expect(plan).toBeNull();
    });
  });

  describe('generatePrescription', () => {
    it('should generate complete prescription', () => {
      const presc = HyperlipidemiaProtocol.generatePrescription(highLdlPatient);
      expect(presc.calories).toBeGreaterThan(0);
      expect(presc.protein).toBeGreaterThan(0);
      expect(presc.meals.mainMeals.length).toBe(3);
      expect(presc.restrictions.length).toBeGreaterThan(0);
      expect(presc.recommendations.length).toBeGreaterThan(0);
      expect(presc.alerts.length).toBeGreaterThan(0);
    });

    it('should include titration plan when lipids are high', () => {
      const presc = HyperlipidemiaProtocol.generatePrescription(highLdlPatient);
      expect(presc.titration).toBeDefined();
    });

    it('should not include titration plan for well-controlled lipids', () => {
      const presc = HyperlipidemiaProtocol.generatePrescription({
        ...highLdlPatient,
        lipids: { ldl: 100, hdl: 50, tg: 120, total: 180 },
      });
      expect(presc.titration).toBeUndefined();
    });

    it('should return fallback for invalid inputs', () => {
      const presc = HyperlipidemiaProtocol.generatePrescription({
        ...highLdlPatient,
        weight: -1,
      });
      expect(presc.calories).toBe(0);
      expect(presc.protein).toBe(0);
    });
  });
});
