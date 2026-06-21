import { describe, it, expect } from 'vitest';
import { GERDProtocol, GERDPatient } from '../GERDProtocol';

describe('GERDProtocol', () => {
  const obesePatient: GERDPatient = {
    weight: 90,
    height: 165,
    age: 45,
    gender: 'female',
    bmi: 33,
    severity: 'moderate',
    frequency: 'weekly',
    symptoms: ['heartburn', 'regurgitation'],
    hiatalAnemia: false,
    complications: [],
    meals: { size: 'large', frequency: 3, timing: 'irregular' },
    diet: { fat: 'high', spice: 'moderate', caffeine: 'high' },
    lifestyle: { smoking: true, alcohol: false, bedtime: 'late', postMeal: 'rest' },
    medications: [],
    nutrients: null,
  };

  const normalPatient: GERDPatient = {
    weight: 70,
    height: 170,
    age: 40,
    gender: 'male',
    bmi: 24,
    severity: 'mild',
    frequency: 'occasional',
    symptoms: ['heartburn'],
    hiatalAnemia: false,
    complications: [],
    meals: { size: 'small', frequency: 5, timing: 'regular' },
    diet: { fat: 'low', spice: 'low', caffeine: 'low' },
    lifestyle: { smoking: false, alcohol: false, bedtime: 'early', postMeal: 'walk' },
    medications: [],
    nutrients: null,
  };

  const smokerPatient: GERDPatient = {
    ...normalPatient,
    lifestyle: { ...normalPatient.lifestyle, smoking: true, alcohol: false },
  };

  const drinkerPatient: GERDPatient = {
    ...normalPatient,
    lifestyle: { ...normalPatient.lifestyle, smoking: false, alcohol: true },
  };

  describe('calculateCalories', () => {
    it('should reduce calories for obese patient (BMI >= 30)', () => {
      const calories = GERDProtocol.calculateCalories(obesePatient);
      expect(calories).toBeGreaterThanOrEqual(1500);
      expect(calories).toBeLessThanOrEqual(3000);
    });

    it('should calculate normal calories for normal BMI patient', () => {
      const calories = GERDProtocol.calculateCalories(normalPatient);
      expect(calories).toBeGreaterThanOrEqual(1500);
      expect(calories).toBeLessThanOrEqual(3000);
    });

    it('should have lower calories for obese vs normal patient', () => {
      const obCal = GERDProtocol.calculateCalories(obesePatient);
      const normCal = GERDProtocol.calculateCalories(normalPatient);
      expect(obCal).toBeLessThan(normCal);
    });

    it('should floor calories at 1500 for invalid inputs', () => {
      const result = GERDProtocol.calculateCalories({
        ...normalPatient,
        weight: -1,
      });
      expect(result).toBe(1500);
    });
  });

  describe('calculateProtein', () => {
    it('should calculate 1.0 g/kg for normal patient', () => {
      const protein = GERDProtocol.calculateProtein(normalPatient);
      expect(protein).toBe(70);
    });

    it('should floor protein at 50g for low weight', () => {
      const protein = GERDProtocol.calculateProtein({
        ...normalPatient,
        weight: 30,
      });
      expect(protein).toBe(50);
    });

    it('should cap protein at 120g', () => {
      const protein = GERDProtocol.calculateProtein({
        ...normalPatient,
        weight: 150,
      });
      expect(protein).toBeLessThanOrEqual(120);
    });
  });

  describe('calculateMacros', () => {
    it('should use 55% carbs and 20% fat for low fat diet', () => {
      const { carbs, fat } = GERDProtocol.calculateMacros(2000, 70, normalPatient);
      const proteinCalories = 70 * 4;
      const nonProteinCalories = 2000 - proteinCalories;
      const expectedCarbs = Math.round((nonProteinCalories * 0.55 / 0.75) / 4);
      const expectedFat = Math.round((nonProteinCalories * 0.20 / 0.75) / 9);
      expect(carbs).toBe(expectedCarbs);
      expect(fat).toBe(expectedFat);
    });

    it('should use 25% fat for high fat diet', () => {
      const { fat } = GERDProtocol.calculateMacros(2000, 70, obesePatient);
      const proteinCalories = 70 * 4;
      const nonProteinCalories = 2000 - proteinCalories;
      const expectedFat = Math.round((nonProteinCalories * 0.25 / 0.80) / 9);
      expect(fat).toBe(expectedFat);
    });

    it('should return zeros for invalid inputs', () => {
      const { carbs, fat } = GERDProtocol.calculateMacros(0, 0, normalPatient);
      expect(carbs).toBe(0);
      expect(fat).toBe(0);
    });
  });

  describe('createMealPlan', () => {
    it('should create 5 small meals', () => {
      const plan = GERDProtocol.createMealPlan(2000, 70, 250, 45, normalPatient);
      expect(plan.mainMeals).toHaveLength(5);
      expect(plan.mealSize).toBe('small');
      expect(plan.noLateMeals).toBe(true);
    });

    it('should distribute calories evenly across meals', () => {
      const plan = GERDProtocol.createMealPlan(2000, 70, 250, 45, normalPatient);
      const total = plan.mainMeals.reduce((s, m) => s + m.calories, 0);
      expect(total).toBe(2000);
    });

    it('should include timing for each meal', () => {
      const plan = GERDProtocol.createMealPlan(2000, 70, 250, 45, normalPatient);
      plan.mainMeals.forEach((m) => {
        expect(m.timing).toBeDefined();
        expect(m.timing.length).toBeGreaterThan(0);
      });
    });

    it('should return empty array for invalid inputs', () => {
      const plan = GERDProtocol.createMealPlan(0, 0, 0, 0, normalPatient);
      expect(plan.mainMeals).toHaveLength(0);
    });
  });

  describe('createRestrictions', () => {
    it('should include fatty food restriction', () => {
      const restrictions = GERDProtocol.createRestrictions(normalPatient);
      expect(restrictions).toEqual(expect.arrayContaining([
        expect.stringContaining('الأطعمة الدهنية'),
      ]));
    });

    it('should include fried food restriction', () => {
      const restrictions = GERDProtocol.createRestrictions(normalPatient);
      expect(restrictions).toEqual(expect.arrayContaining([
        expect.stringContaining('الأطعمة المقلية'),
      ]));
    });

    it('should include caffeine restriction when diet caffeine is not low', () => {
      const restrictions = GERDProtocol.createRestrictions(obesePatient);
      expect(restrictions).toEqual(expect.arrayContaining([
        expect.stringContaining('الكافيين'),
      ]));
    });

    it('should not include caffeine restriction when diet caffeine is low', () => {
      const restrictions = GERDProtocol.createRestrictions(normalPatient);
      const caffeineRestrictions = restrictions.filter(r => r.includes('الكافيين'));
      expect(caffeineRestrictions.length).toBe(0);
    });

    it('should include alcohol restriction when lifestyle has alcohol', () => {
      const restrictions = GERDProtocol.createRestrictions(drinkerPatient);
      expect(restrictions).toEqual(expect.arrayContaining([
        expect.stringContaining('الكحول'),
      ]));
    });

    it('should include large meal warning when meals.size is large', () => {
      const restrictions = GERDProtocol.createRestrictions(obesePatient);
      expect(restrictions).toEqual(expect.arrayContaining([
        expect.stringContaining('الوجبات الكبيرة'),
      ]));
    });

    it('should include late meal warning when timing is irregular', () => {
      const restrictions = GERDProtocol.createRestrictions(obesePatient);
      expect(restrictions).toEqual(expect.arrayContaining([
        expect.stringContaining('الوجبات المتأخرة'),
      ]));
    });
  });

  describe('createRecommendations', () => {
    it('should include low fat food recommendations', () => {
      const recs = GERDProtocol.createRecommendations(normalPatient);
      expect(recs).toEqual(expect.arrayContaining([
        expect.stringContaining('Low fat'),
      ]));
    });

    it('should include whole grains for non-severe patients', () => {
      const recs = GERDProtocol.createRecommendations(normalPatient);
      expect(recs).toEqual(expect.arrayContaining([
        expect.stringContaining('الحبوب الكاملة'),
      ]));
    });

    it('should include small meals recommendation', () => {
      const recs = GERDProtocol.createRecommendations(normalPatient);
      expect(recs).toEqual(expect.arrayContaining([
        expect.stringContaining('وجبات صغيرة'),
      ]));
    });
  });

  describe('createLifestyleRecommendations', () => {
    it('should include smoking cessation for smokers', () => {
      const lifestyle = GERDProtocol.createLifestyleRecommendations(smokerPatient);
      expect(lifestyle).toEqual(expect.arrayContaining([
        expect.stringContaining('التدخين'),
      ]));
    });

    it('should not include smoking cessation for non-smokers', () => {
      const lifestyle = GERDProtocol.createLifestyleRecommendations(normalPatient);
      const smokingItems = lifestyle.filter(r => r.includes('التدخين'));
      expect(smokingItems.length).toBe(0);
    });

    it('should include alcohol cessation for drinkers', () => {
      const lifestyle = GERDProtocol.createLifestyleRecommendations(drinkerPatient);
      expect(lifestyle).toEqual(expect.arrayContaining([
        expect.stringContaining('الكحول'),
      ]));
    });

    it('should include weight loss recommendation for BMI >= 25', () => {
      const lifestyle = GERDProtocol.createLifestyleRecommendations(obesePatient);
      expect(lifestyle).toEqual(expect.arrayContaining([
        expect.stringContaining('تقليل الوزن'),
      ]));
    });

    it('should include post-meal walk advice when postMeal is rest', () => {
      const lifestyle = GERDProtocol.createLifestyleRecommendations(obesePatient);
      expect(lifestyle).toEqual(expect.arrayContaining([
        expect.stringContaining('walk'),
      ]));
    });

    it('should include head elevation advice', () => {
      const lifestyle = GERDProtocol.createLifestyleRecommendations(normalPatient);
      expect(lifestyle).toEqual(expect.arrayContaining([
        expect.stringContaining('ارتفاع الرأس'),
      ]));
    });
  });

  describe('createAlerts', () => {
    it('should include monitoring alert for all patients', () => {
      const alerts = GERDProtocol.createAlerts(normalPatient);
      expect(alerts).toEqual(expect.arrayContaining([
        expect.stringContaining('متابعة منتظمة'),
      ]));
    });

    it('should include hiatal anemia alert', () => {
      const alerts = GERDProtocol.createAlerts({
        ...normalPatient,
        hiatalAnemia: true,
      });
      expect(alerts).toEqual(expect.arrayContaining([
        expect.stringContaining('Hiatal anemia'),
      ]));
    });

    it('should include complications alert', () => {
      const alerts = GERDProtocol.createAlerts({
        ...normalPatient,
        complications: ['esophagitis'],
      });
      expect(alerts).toEqual(expect.arrayContaining([
        expect.stringContaining('Complications'),
      ]));
    });

    it('should include Barrett esophagus alert', () => {
      const alerts = GERDProtocol.createAlerts({
        ...normalPatient,
        complications: ['Barrett'],
      });
      expect(alerts).toEqual(expect.arrayContaining([
        expect.stringContaining('Barrett esophagus'),
      ]));
    });

    it('should include severe GERD alert', () => {
      const alerts = GERDProtocol.createAlerts({
        ...normalPatient,
        severity: 'severe',
      });
      expect(alerts).toEqual(expect.arrayContaining([
        expect.stringContaining('GERD severe'),
      ]));
    });

    it('should include anemia alert when Hgb < 12', () => {
      const alerts = GERDProtocol.createAlerts({
        ...normalPatient,
        nutrients: { hgb: 10, iron: 50, b12: 400 },
      });
      expect(alerts).toEqual(expect.arrayContaining([
        expect.stringContaining('Anemia'),
      ]));
    });

    it('should detect DNI interactions for omeprazole', () => {
      const alerts = GERDProtocol.createAlerts({
        ...normalPatient,
        medications: ['omeprazole 20mg'],
      });
      expect(alerts).toEqual(expect.arrayContaining([
        expect.stringContaining('أوميبرازول'),
      ]));
    });
  });

  describe('createMonitoringPlan', () => {
    it('should include basic lab tests', () => {
      const plan = GERDProtocol.createMonitoringPlan(normalPatient);
      expect(plan.labTests.map(t => t.test)).toContain('Hgb (CBC)');
      expect(plan.labTests.map(t => t.test)).toContain('Iron');
      expect(plan.labTests.map(t => t.test)).toContain('B12');
    });

    it('should include clinical monitoring parameters', () => {
      const plan = GERDProtocol.createMonitoringPlan(normalPatient);
      expect(plan.clinical.map(c => c.parameter)).toContain('Weight');
      expect(plan.clinical.map(c => c.parameter)).toContain('Heartburn frequency');
      expect(plan.clinical.map(c => c.parameter)).toContain('Regurgitation');
      expect(plan.clinical.map(c => c.parameter)).toContain('Meal size');
      expect(plan.clinical.map(c => c.parameter)).toContain('Lifestyle');
    });
  });

  describe('generatePrescription', () => {
    it('should generate complete prescription for obese GERD patient with low calories', () => {
      const rx = GERDProtocol.generatePrescription(obesePatient);
      expect(rx.calories).toBeLessThan(2000);
      expect(rx.fat).toBeLessThan(rx.carbs);
      expect(rx.meals.mainMeals).toHaveLength(5);
      expect(rx.meals.mealSize).toBe('small');
      expect(rx.restrictions.length).toBeGreaterThan(0);
      expect(rx.recommendations.length).toBeGreaterThan(0);
      expect(rx.lifestyle.length).toBeGreaterThan(0);
      expect(rx.monitoring.labTests.length).toBeGreaterThan(0);
      expect(rx.monitoring.clinical.length).toBeGreaterThan(0);
    });

    it('should generate complete prescription for normal GERD patient', () => {
      const rx = GERDProtocol.generatePrescription(normalPatient);
      expect(rx.calories).toBeGreaterThanOrEqual(1500);
      expect(rx.meals.mainMeals).toHaveLength(5);
      expect(rx.alerts.length).toBeGreaterThan(0);
    });

    it('should include lifestyle recommendations for smoker', () => {
      const rx = GERDProtocol.generatePrescription(smokerPatient);
      expect(rx.lifestyle).toEqual(expect.arrayContaining([
        expect.stringContaining('التدخين'),
      ]));
    });

    it('should include alcohol restriction for drinker', () => {
      const rx = GERDProtocol.generatePrescription(drinkerPatient);
      expect(rx.restrictions).toEqual(expect.arrayContaining([
        expect.stringContaining('الكحول'),
      ]));
    });

    it('should return safe fallback for invalid inputs', () => {
      const rx = GERDProtocol.generatePrescription({
        ...normalPatient,
        weight: -1,
      });
      expect(rx.calories).toBe(0);
      expect(rx.protein).toBe(0);
      expect(rx.meals.mainMeals).toHaveLength(0);
      expect(rx.alerts[0]).toContain('الرجاء إدخال بيانات صحيحة');
    });
  });
});
