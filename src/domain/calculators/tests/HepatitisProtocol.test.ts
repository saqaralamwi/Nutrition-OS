import { describe, it, expect } from 'vitest';
import { HepatitisProtocol, HepatitisPatient } from '../HepatitisProtocol';

describe('HepatitisProtocol', () => {
  const chronicPatient: HepatitisPatient = {
    weight: 70,
    height: 170,
    age: 45,
    gender: 'male',
    stage: 'chronic',
    albumin: 3.8,
    bilirubin: 1.5,
    INR: 1.2,
    medications: [],
    electrolytes: null,
  };

  const cirrhosisPatient: HepatitisPatient = {
    weight: 65,
    height: 165,
    age: 55,
    gender: 'female',
    stage: 'cirrhosis',
    albumin: 3.2,
    bilirubin: 3.5,
    INR: 1.6,
    childPughScore: 8,
    medications: [],
    electrolytes: null,
  };

  const acutePatient: HepatitisPatient = {
    weight: 70,
    height: 170,
    age: 45,
    gender: 'male',
    stage: 'acute',
    albumin: 4.0,
    bilirubin: 2.8,
    INR: 1.1,
    medications: [],
    electrolytes: null,
  };

  describe('calculateCalories', () => {
    it('should calculate calories for chronic hepatitis', () => {
      const calories = HepatitisProtocol.calculateCalories(chronicPatient);
      expect(calories).toBeGreaterThanOrEqual(1500);
      expect(calories).toBeLessThanOrEqual(3500);
    });

    it('should calculate calories for acute hepatitis (lower activity factor)', () => {
      const calories = HepatitisProtocol.calculateCalories(acutePatient);
      expect(calories).toBeGreaterThanOrEqual(1500);
      expect(calories).toBeLessThanOrEqual(3500);

      const chronicCalories = HepatitisProtocol.calculateCalories(chronicPatient);
      expect(calories).toBeLessThan(chronicCalories);
    });

    it('should increase calories for severe cirrhosis (stress factor 1.5)', () => {
      const calories = HepatitisProtocol.calculateCalories(cirrhosisPatient);
      expect(calories).toBeGreaterThanOrEqual(1500);
      expect(calories).toBeLessThanOrEqual(3500);
    });

    it('should floor calories at 1500 for invalid inputs', () => {
      const invalid = HepatitisProtocol.calculateCalories({
        ...chronicPatient,
        weight: 0,
      });
      expect(invalid).toBe(1500);
    });
  });

  describe('calculateProtein', () => {
    it('should calculate 1.2 g/kg for chronic hepatitis', () => {
      const protein = HepatitisProtocol.calculateProtein(chronicPatient);
      expect(protein).toBe(Math.round(70 * 1.2));
    });

    it('should calculate 1.2 g/kg for cirrhosis with Child-Pugh >= 7 (cautious)', () => {
      const protein = HepatitisProtocol.calculateProtein(cirrhosisPatient);
      expect(protein).toBe(Math.round(65 * 1.2));
    });

    it('should calculate 1.5 g/kg for cirrhosis with Child-Pugh < 7', () => {
      const mildCirrhosis: HepatitisPatient = {
        ...chronicPatient,
        stage: 'cirrhosis',
        childPughScore: 5,
      };
      const protein = HepatitisProtocol.calculateProtein(mildCirrhosis);
      expect(protein).toBe(Math.round(70 * 1.5));
    });

    it('should calculate 1.2 g/kg for acute hepatitis', () => {
      const protein = HepatitisProtocol.calculateProtein(acutePatient);
      expect(protein).toBe(Math.round(70 * 1.2));
    });

    it('should floor protein at 60g for invalid inputs', () => {
      const protein = HepatitisProtocol.calculateProtein({
        ...chronicPatient,
        weight: 0,
      });
      expect(protein).toBe(60);
    });

    it('should cap protein at 150g', () => {
      const heavyPatient: HepatitisPatient = {
        ...chronicPatient,
        weight: 120,
        stage: 'chronic',
      };
      const protein = HepatitisProtocol.calculateProtein(heavyPatient);
      expect(protein).toBeLessThanOrEqual(150);
    });
  });

  describe('calculateMacros', () => {
    it('should distribute remaining calories as 55% carbs and 30% fat', () => {
      const { carbs, fat } = HepatitisProtocol.calculateMacros(2000, 84);
      const proteinCalories = 84 * 4;
      const nonProteinCalories = 2000 - proteinCalories;
      const expectedCarbs = Math.round((nonProteinCalories * 0.55 / 0.85) / 4);
      const expectedFat = Math.round((nonProteinCalories * 0.30 / 0.85) / 9);
      expect(carbs).toBe(expectedCarbs);
      expect(fat).toBe(expectedFat);
    });

    it('should return zeros for invalid inputs', () => {
      const { carbs, fat } = HepatitisProtocol.calculateMacros(0, 0);
      expect(carbs).toBe(0);
      expect(fat).toBe(0);
    });
  });

  describe('createMealPlan', () => {
    it('should create 3 main meals and 2 snacks', () => {
      const plan = HepatitisProtocol.createMealPlan(2000, 84, 250, 65);
      expect(plan.mainMeals).toHaveLength(3);
      expect(plan.snacks).toHaveLength(2);
    });

    it('should distribute calories correctly across meals', () => {
      const plan = HepatitisProtocol.createMealPlan(2000, 84, 250, 65);
      const totalMealCalories = plan.mainMeals.reduce((sum, m) => sum + m.calories, 0);
      const totalSnackCalories = plan.snacks.reduce((sum, m) => sum + m.calories, 0);
      expect(totalMealCalories + totalSnackCalories).toBe(2000);
    });

    it('should return empty arrays for invalid inputs', () => {
      const plan = HepatitisProtocol.createMealPlan(0, 0, 0, 0);
      expect(plan.mainMeals).toHaveLength(0);
      expect(plan.snacks).toHaveLength(0);
    });
  });

  describe('createAlerts', () => {
    it('should include Vitamin D alert for all patients', () => {
      const alerts = HepatitisProtocol.createAlerts(chronicPatient);
      expect(alerts).toEqual(expect.arrayContaining([
        expect.stringContaining('فيتامين D'),
      ]));
    });

    it('should include Vitamin K alert for cirrhosis with high INR', () => {
      const alerts = HepatitisProtocol.createAlerts(cirrhosisPatient);
      expect(alerts).toEqual(expect.arrayContaining([
        expect.stringContaining('فيتامين K'),
      ]));
    });

    it('should not include Vitamin K alert for normal INR', () => {
      const alerts = HepatitisProtocol.createAlerts(chronicPatient);
      expect(alerts).not.toEqual(expect.arrayContaining([
        expect.stringContaining('فيتامين K'),
      ]));
    });

    it('should include Zinc alert for cirrhosis', () => {
      const alerts = HepatitisProtocol.createAlerts(cirrhosisPatient);
      expect(alerts).toEqual(expect.arrayContaining([
        expect.stringContaining('Zinc'),
      ]));
    });

    it('should prohibit alcohol', () => {
      const alerts = HepatitisProtocol.createAlerts(chronicPatient);
      expect(alerts).toEqual(expect.arrayContaining([
        expect.stringContaining('كحول: ممنوع تماماً'),
      ]));
    });

    it('should include protein caution for severe cirrhosis', () => {
      const alerts = HepatitisProtocol.createAlerts(cirrhosisPatient);
      expect(alerts).toEqual(expect.arrayContaining([
        expect.stringContaining('بروتين'),
      ]));
    });

    it('should detect DNI interactions for spironolactone', () => {
      const patientOnSpiro: HepatitisPatient = {
        ...cirrhosisPatient,
        medications: ['spironolactone 100mg'],
      };
      const alerts = HepatitisProtocol.createAlerts(patientOnSpiro);
      expect(alerts).toEqual(expect.arrayContaining([
        expect.stringContaining('سبيرونولاكتون'),
      ]));
    });

    it('should detect DNI interactions for furosemide', () => {
      const patientOnFuro: HepatitisPatient = {
        ...cirrhosisPatient,
        medications: ['furosemide 40mg'],
      };
      const alerts = HepatitisProtocol.createAlerts(patientOnFuro);
      expect(alerts).toEqual(expect.arrayContaining([
        expect.stringContaining('فوروسيميد'),
      ]));
    });

    it('should include hypoalbuminemia alert when albumin < 3.0', () => {
      const lowAlbumin: HepatitisPatient = {
        ...chronicPatient,
        albumin: 2.5,
      };
      const alerts = HepatitisProtocol.createAlerts(lowAlbumin);
      expect(alerts).toEqual(expect.arrayContaining([
        expect.stringContaining('ألبومين منخفض'),
      ]));
    });

    it('should handle multiple medications with DNI', () => {
      const patientOnMultiple: HepatitisPatient = {
        ...cirrhosisPatient,
        medications: ['spironolactone 100mg', 'furosemide 40mg', 'warfarin 5mg'],
      };
      const alerts = HepatitisProtocol.createAlerts(patientOnMultiple);
      expect(alerts).toEqual(expect.arrayContaining([
        expect.stringContaining('سبيرونولاكتون'),
        expect.stringContaining('فوروسيميد'),
        expect.stringContaining('وارفارين'),
      ]));
    });
  });

  describe('generatePrescription', () => {
    it('should generate a complete prescription for chronic hepatitis', () => {
      const rx = HepatitisProtocol.generatePrescription(chronicPatient);
      expect(rx.calories).toBeGreaterThanOrEqual(1500);
      expect(rx.calories).toBeLessThanOrEqual(3500);
      expect(rx.protein).toBe(Math.round(70 * 1.2));
      expect(rx.meals.mainMeals).toHaveLength(3);
      expect(rx.meals.snacks).toHaveLength(2);
      expect(rx.alerts.length).toBeGreaterThan(0);
      expect(rx.monitoring.labTests.length).toBeGreaterThan(0);
      expect(rx.monitoring.clinical.length).toBeGreaterThan(0);
    });

    it('should include titration plan for severe cirrhosis', () => {
      const rx = HepatitisProtocol.generatePrescription(cirrhosisPatient);
      expect(rx.titration).not.toBeNull();
      expect(rx.titration!.increaseCalories).toBe(100);
      expect(rx.titration!.frequency).toBe('كل 5-7 أيام');
    });

    it('should not include titration plan for stable chronic', () => {
      const rx = HepatitisProtocol.generatePrescription(chronicPatient);
      expect(rx.titration).toBeNull();
    });

    it('should include refeeding risk alert for low weight low albumin', () => {
      const atRisk: HepatitisPatient = {
        ...chronicPatient,
        weight: 45,
        albumin: 2.5,
      };
      const rx = HepatitisProtocol.generatePrescription(atRisk);
      const hasRefeedAlert = rx.alerts.some(a => a.includes('إعادة التغذية') || a.includes('Refeeding'));
      expect(hasRefeedAlert).toBe(true);
    });

    it('should return safe fallback for invalid inputs', () => {
      const invalid: HepatitisPatient = {
        ...chronicPatient,
        weight: -1,
      };
      const rx = HepatitisProtocol.generatePrescription(invalid);
      expect(rx.calories).toBe(0);
      expect(rx.protein).toBe(0);
      expect(rx.meals.mainMeals).toHaveLength(0);
      expect(rx.alerts[0]).toContain('الرجاء إدخال بيانات صحيحة');
    });
  });

  describe('checkRefeedingRisk', () => {
    it('should detect high risk for low weight with low albumin', () => {
      const result = HepatitisProtocol.checkRefeedingRisk({
        ...chronicPatient,
        weight: 45,
        albumin: 2.5,
      });
      expect(result.isHighRisk).toBe(true);
    });

    it('should not flag risk for stable patient', () => {
      const result = HepatitisProtocol.checkRefeedingRisk(chronicPatient);
      expect(result.isHighRisk).toBe(false);
    });

    it('should detect risk from electrolyte abnormalities', () => {
      const result = HepatitisProtocol.checkRefeedingRisk({
        ...chronicPatient,
        electrolytes: {
          potassium: 3.0,
          phosphorus: 2.0,
          magnesium: 1.2,
        },
      });
      expect(result.isHighRisk).toBe(true);
    });
  });

  describe('createTitrationPlan', () => {
    it('should return plan for severe cirrhosis (Child-Pugh >= 7)', () => {
      const plan = HepatitisProtocol.createTitrationPlan(cirrhosisPatient);
      expect(plan).not.toBeNull();
      expect(plan!.increaseCalories).toBe(100);
    });

    it('should return null for chronic hepatitis', () => {
      const plan = HepatitisProtocol.createTitrationPlan(chronicPatient);
      expect(plan).toBeNull();
    });

    it('should return plan for low albumin < 3.0', () => {
      const lowAlb: HepatitisPatient = {
        ...chronicPatient,
        albumin: 2.7,
      };
      const plan = HepatitisProtocol.createTitrationPlan(lowAlb);
      expect(plan).not.toBeNull();
      expect(plan!.increaseCalories).toBe(150);
    });
  });

  describe('createMonitoringPlan', () => {
    it('should include basic lab tests for all stages', () => {
      const plan = HepatitisProtocol.createMonitoringPlan(chronicPatient);
      expect(plan.labTests.length).toBeGreaterThanOrEqual(6);
      expect(plan.labTests.map(t => t.test)).toContain('Albumin');
      expect(plan.labTests.map(t => t.test)).toContain('Bilirubin');
      expect(plan.labTests.map(t => t.test)).toContain('INR');
    });

    it('should include ammonia monitoring for cirrhosis', () => {
      const plan = HepatitisProtocol.createMonitoringPlan(cirrhosisPatient);
      expect(plan.labTests.map(t => t.test)).toContain('Ammonia');
    });

    it('should include clinical monitoring parameters', () => {
      const plan = HepatitisProtocol.createMonitoringPlan(chronicPatient);
      expect(plan.clinical.length).toBeGreaterThanOrEqual(4);
      expect(plan.clinical.map(c => c.parameter)).toContain('Weight');
      expect(plan.clinical.map(c => c.parameter)).toContain('Ascites');
      expect(plan.clinical.map(c => c.parameter)).toContain('Encephalopathy');
    });
  });
});
