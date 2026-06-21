import { describe, it, expect } from 'vitest';
import { PancreatitisProtocol, PancreatitisPatient } from '../PancreatitisProtocol';

describe('PancreatitisProtocol', () => {
  const acutePatient: PancreatitisPatient = {
    weight: 75,
    height: 175,
    age: 45,
    gender: 'male',
    type: 'acute',
    severity: 'mild',
    phase: 'acute_phase',
    pain: 'moderate',
    nausea: true,
    vomiting: false,
    diarrhea: false,
    steatorrhea: false,
    weightLoss: 3,
    glucose: 110,
    hgbA1c: 5.8,
    enzymes: { amylase: 350, lipase: 800 },
    nutrition: { route: 'oral', tolerance: 'good' },
    medications: ['pancrelipase'],
    nutrients: null,
  };

  const acuteSeverePatient: PancreatitisPatient = {
    ...acutePatient,
    severity: 'severe',
    phase: 'acute_phase',
    nutrition: { route: 'oral', tolerance: 'poor' },
  };

  const chronicPatient: PancreatitisPatient = {
    weight: 65,
    height: 165,
    age: 50,
    gender: 'female',
    type: 'chronic',
    severity: 'moderate',
    phase: 'maintenance',
    pain: 'mild',
    nausea: false,
    vomiting: false,
    diarrhea: true,
    steatorrhea: true,
    weightLoss: 6,
    glucose: 140,
    hgbA1c: 7.0,
    enzymes: { amylase: 180, lipase: 400 },
    nutrition: { route: 'oral', tolerance: 'moderate' },
    medications: ['insulin', 'metformin'],
    nutrients: {
      trypsin: 15,
      vitaminA: 25,
      vitaminD: 22,
      vitaminE: 3,
      vitaminK: 2,
      zinc: 55,
      albumin: 3.2,
    },
  };

  describe('calculateCalories', () => {
    it('should calculate calories for acute mild patient', () => {
      const calories = PancreatitisProtocol.calculateCalories(acutePatient);
      expect(calories).toBeGreaterThanOrEqual(1500);
      expect(calories).toBeLessThanOrEqual(3500);
    });

    it('should calculate higher calories for severe patient', () => {
      const mildCal = PancreatitisProtocol.calculateCalories(acutePatient);
      const severeCal = PancreatitisProtocol.calculateCalories(acuteSeverePatient);
      expect(severeCal).toBeGreaterThanOrEqual(mildCal);
    });

    it('should add 200 kcal for weight loss > 5%', () => {
      const normalLoss = PancreatitisProtocol.calculateCalories(acutePatient);
      const highLoss = PancreatitisProtocol.calculateCalories({
        ...acutePatient,
        weightLoss: 10,
      });
      expect(highLoss).toBeGreaterThanOrEqual(normalLoss + 150);
    });

    it('should return fallback 1500 for invalid inputs', () => {
      const calories = PancreatitisProtocol.calculateCalories({
        ...acutePatient,
        weight: -1,
      });
      expect(calories).toBe(1500);
    });
  });

  describe('calculateProtein', () => {
    it('should calculate 1.2 g/kg for acute mild', () => {
      const protein = PancreatitisProtocol.calculateProtein(acutePatient);
      expect(protein).toBeGreaterThanOrEqual(60);
    });

    it('should calculate 1.5 g/kg for acute severe', () => {
      const protein = PancreatitisProtocol.calculateProtein(acuteSeverePatient);
      expect(protein).toBeGreaterThanOrEqual(90);
    });

    it('should calculate higher protein for severe vs mild', () => {
      const mildPro = PancreatitisProtocol.calculateProtein(acutePatient);
      const severePro = PancreatitisProtocol.calculateProtein(acuteSeverePatient);
      expect(severePro).toBeGreaterThan(mildPro);
    });

    it('should cap protein at 150g', () => {
      const protein = PancreatitisProtocol.calculateProtein({
        ...acutePatient,
        weight: 120,
      });
      expect(protein).toBeLessThanOrEqual(150);
    });

    it('should return fallback 60 for invalid weight', () => {
      const protein = PancreatitisProtocol.calculateProtein({
        ...acutePatient,
        weight: -1,
      });
      expect(protein).toBe(60);
    });
  });

  describe('calculateMacros', () => {
    it('should calculate macros for acute patient (60% carbs, 15% fat)', () => {
      const { carbs, fat } = PancreatitisProtocol.calculateMacros(2000, 80, acutePatient);
      expect(carbs).toBeGreaterThan(0);
      expect(fat).toBeGreaterThan(0);
    });

    it('should return zero fallback for invalid inputs', () => {
      const result = PancreatitisProtocol.calculateMacros(-1, 80, acutePatient);
      expect(result.carbs).toBe(0);
      expect(result.fat).toBe(0);
    });
  });

  describe('determineNutritionRoute', () => {
    it('should recommend parenteral for acute severe', () => {
      const route = PancreatitisProtocol.determineNutritionRoute(acuteSeverePatient);
      expect(route.route).toBe('parenteral');
    });

    it('should recommend oral for good tolerance', () => {
      const route = PancreatitisProtocol.determineNutritionRoute(acutePatient);
      expect(route.route).toBe('oral');
    });

    it('should recommend enteral for moderate severity', () => {
      const moderatePatient: PancreatitisPatient = {
        ...acutePatient,
        severity: 'moderate',
      };
      const route = PancreatitisProtocol.determineNutritionRoute(moderatePatient);
      expect(route.route).toBe('enteral');
    });
  });

  describe('createMealPlan', () => {
    it('should create 5 meals for patient', () => {
      const plan = PancreatitisProtocol.createMealPlan(2000, 80, 250, 40, acutePatient);
      expect(plan.mainMeals.length).toBeGreaterThanOrEqual(5);
      expect(plan.mealSize).toBe('small');
      expect(plan.lowFat).toBe(true);
      expect(plan.noLateMeals).toBe(true);
    });

    it('should return empty fallback for invalid inputs', () => {
      const plan = PancreatitisProtocol.createMealPlan(-1, 80, 250, 40, acutePatient);
      expect(plan.mainMeals).toEqual([]);
    });
  });

  describe('createEnzymePlan', () => {
    it('should recommend enzymes for chronic with steatorrhea', () => {
      const plan = PancreatitisProtocol.createEnzymePlan(chronicPatient);
      expect(plan).not.toBeNull();
      expect(plan!.type).toBe('pancrelipase');
    });

    it('should not recommend enzymes if no steatorrhea', () => {
      const plan = PancreatitisProtocol.createEnzymePlan(acutePatient);
      expect(plan).toBeNull();
    });
  });

  describe('createRestrictions', () => {
    it('should include alcohol prohibition', () => {
      const restrictions = PancreatitisProtocol.createRestrictions(acutePatient);
      expect(restrictions.some(r => r.includes('كحول'))).toBe(true);
    });

    it('should include fatty food restriction', () => {
      const restrictions = PancreatitisProtocol.createRestrictions(acutePatient);
      expect(restrictions.some(r => r.includes('دهنية'))).toBe(true);
    });

    it('should include extra restrictions for acute type', () => {
      const acuteRestrictions = PancreatitisProtocol.createRestrictions(acutePatient);
      const chronicRestrictions = PancreatitisProtocol.createRestrictions(chronicPatient);
      expect(acuteRestrictions.length).toBeGreaterThan(chronicRestrictions.length);
    });
  });

  describe('createAlerts', () => {
    it('should generate diabetes alert for high glucose', () => {
      const alerts = PancreatitisProtocol.createAlerts(chronicPatient);
      expect(alerts.some(a => a.includes('Diabetes'))).toBe(true);
    });

    it('should generate steatorrhea alert', () => {
      const alerts = PancreatitisProtocol.createAlerts(chronicPatient);
      expect(alerts.some(a => a.includes('Steatorrhea'))).toBe(true);
    });

    it('should generate weight loss alert', () => {
      const alerts = PancreatitisProtocol.createAlerts(chronicPatient);
      expect(alerts.some(a => a.includes('Weight loss'))).toBe(true);
    });

    it('should generate DNI alerts for medications', () => {
      const alerts = PancreatitisProtocol.createAlerts(acutePatient);
      expect(alerts.some(a => a.includes('بانكريليباز'))).toBe(true);
    });

    it('should generate vitamin deficiency alerts', () => {
      const alerts = PancreatitisProtocol.createAlerts(chronicPatient);
      expect(alerts.some(a => a.includes('Vitamin D'))).toBe(true);
      expect(alerts.some(a => a.includes('Zinc'))).toBe(true);
    });
  });

  describe('createMonitoringPlan', () => {
    it('should include all required lab tests', () => {
      const plan = PancreatitisProtocol.createMonitoringPlan(acutePatient);
      expect(plan.labTests.length).toBe(10);
      expect(plan.clinical.length).toBe(5);
    });

    it('should include amylase and lipase monitoring', () => {
      const plan = PancreatitisProtocol.createMonitoringPlan(acutePatient);
      expect(plan.labTests.some(t => t.test.includes('Amylase'))).toBe(true);
    });
  });

  describe('createTitrationPlan', () => {
    it('should create titration plan for weight loss > 5%', () => {
      const plan = PancreatitisProtocol.createTitrationPlan(chronicPatient);
      expect(plan).not.toBeNull();
      expect(plan!.increaseCalories).toBe(100);
    });

    it('should not create titration plan for stable patient', () => {
      const plan = PancreatitisProtocol.createTitrationPlan({
        ...acutePatient,
        weightLoss: 2,
        nutrients: null,
      });
      expect(plan).toBeNull();
    });
  });

  describe('generatePrescription', () => {
    it('should generate complete prescription for acute patient', () => {
      const presc = PancreatitisProtocol.generatePrescription(acutePatient);
      expect(presc.calories).toBeGreaterThan(0);
      expect(presc.protein).toBeGreaterThan(0);
      expect(presc.meals.mainMeals.length).toBeGreaterThan(0);
      expect(presc.restrictions.length).toBeGreaterThan(0);
      expect(presc.alerts.length).toBeGreaterThan(0);
    });

    it('should generate complete prescription for chronic patient', () => {
      const presc = PancreatitisProtocol.generatePrescription(chronicPatient);
      expect(presc.enzymes).not.toBeNull();
      expect(presc.titration).not.toBeNull();
    });

    it('should return fallback prescription for invalid patient data', () => {
      const presc = PancreatitisProtocol.generatePrescription({
        ...acutePatient,
        weight: -1,
      });
      expect(presc.calories).toBe(0);
      expect(presc.protein).toBe(0);
      expect(presc.alerts.length).toBeGreaterThan(0);
    });

    it('should include monitoring plan', () => {
      const presc = PancreatitisProtocol.generatePrescription(acutePatient);
      expect(presc.monitoring.labTests.length).toBeGreaterThan(0);
      expect(presc.monitoring.clinical.length).toBeGreaterThan(0);
    });

    it('should set enteral route for moderate patient with poor tolerance', () => {
      const presc = PancreatitisProtocol.generatePrescription({
        ...acutePatient,
        severity: 'moderate',
        phase: 'acute_phase',
      });
      expect(presc.enteral).not.toBeNull();
    });
  });
});
