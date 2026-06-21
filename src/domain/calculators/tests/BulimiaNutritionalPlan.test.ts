import { describe, it, expect } from 'vitest';
import { BulimiaNutritionalPlan } from '../BulimiaNutritionalPlan';

describe('BulimiaNutritionalPlan', () => {
  const normalElectrolytes = { potassium: 4.0, phosphorus: 3.0, magnesium: 2.0 };

  it('should use REE × 1.2, not 18 kcal/kg', () => {
    const result = BulimiaNutritionalPlan.calculate({
      age: 20, weight: 55, height: 165, gender: 'female',
      mealFrequency: 2, bingeFrequency: 5, purgingFrequency: 3,
      electrolytes: normalElectrolytes,
    });
    // Mifflin (female 55kg/165cm/20y): (10*55)+(6.25*165)-(5*20)-161 = 1320.25
    // 1320.25 * 1.2 = 1584.3 → 1584
    expect(result.targetCalories).toBe(1584);
    expect(result.mealFrequency).toBe(3);
    expect(result.snackFrequency).toBe(3);
    expect(result.isSafe).toBe(true);
  });

  it('should set regularity schedule', () => {
    const result = BulimiaNutritionalPlan.calculate({
      age: 25, weight: 60, height: 170, gender: 'female',
      mealFrequency: 3, bingeFrequency: 2, purgingFrequency: 1,
      electrolytes: normalElectrolytes,
    });
    expect(result.regularitySchedule).toBe('وجبة كل 2-3 ساعات: 3 وجبات رئيسية + 3 وجبات خفيفة، بدون تخطي');
  });

  it('should round targetCalories', () => {
    const result = BulimiaNutritionalPlan.calculate({
      age: 22, weight: 63.5, height: 170, gender: 'female',
      mealFrequency: 2, bingeFrequency: 4, purgingFrequency: 2,
      electrolytes: normalElectrolytes,
    });
    // Mifflin female: (10*63.5)+(6.25*170)-(5*22)-161 = 1426.5
    // 1426.5 * 1.2 = 1711.8 → 1712
    expect(result.targetCalories).toBe(1712);
  });

  it('should handle low weight', () => {
    const result = BulimiaNutritionalPlan.calculate({
      age: 18, weight: 35, height: 160, gender: 'female',
      mealFrequency: 3, bingeFrequency: 7, purgingFrequency: 5,
      electrolytes: normalElectrolytes,
    });
    // Mifflin female: (10*35)+(6.25*160)-(5*18)-161 = 1099
    // 1099 * 1.2 = 1318.8 → 1319
    expect(result.targetCalories).toBe(1319);
    expect(result.isSafe).toBe(true);
  });

  it('should handle zero binge and purge', () => {
    const result = BulimiaNutritionalPlan.calculate({
      age: 24, weight: 58, height: 165, gender: 'female',
      mealFrequency: 3, bingeFrequency: 0, purgingFrequency: 0,
      electrolytes: normalElectrolytes,
    });
    // Mifflin female: (10*58)+(6.25*165)-(5*24)-161 = 1330.25
    // 1330.25 * 1.2 = 1596.3 → 1596
    expect(result.targetCalories).toBe(1596);
    expect(result.isSafe).toBe(true);
  });

  it('should return safe=false if electrolytes missing', () => {
    const result = BulimiaNutritionalPlan.calculate({
      age: 20, weight: 55, height: 165, gender: 'female',
      mealFrequency: 2, bingeFrequency: 5, purgingFrequency: 3,
      electrolytes: null,
    });
    expect(result.isSafe).toBe(false);
    expect(result.errorCode).toBe('MISSING_ELECTROLYTES');
    expect(result.message).toContain('Electrolytes');
  });

  it('should return safe=false if refeeding risk critical', () => {
    const lowElectrolytes = { potassium: 3.0, phosphorus: 2.0, magnesium: 1.2 };
    const result = BulimiaNutritionalPlan.calculate({
      age: 18, weight: 35, height: 160, gender: 'female',
      mealFrequency: 1, bingeFrequency: 7, purgingFrequency: 5,
      electrolytes: lowElectrolytes,
    });
    expect(result.isSafe).toBe(false);
    expect(result.errorCode).toBe('HIGH_REFEEDING_RISK');
  });

  it('should include electrolyte schedule when safe', () => {
    const result = BulimiaNutritionalPlan.calculate({
      age: 20, weight: 55, height: 165, gender: 'female',
      mealFrequency: 2, bingeFrequency: 5, purgingFrequency: 3,
      electrolytes: normalElectrolytes,
    });
    expect(result.electrolyteSchedule).toBeDefined();
    expect(result.electrolyteSchedule!.potassium.target).toBe('3.5-5.0 mmol/L');
    expect(result.electrolyteSchedule!.phosphorus.target).toBe('0.8-1.5 mmol/L');
    expect(result.electrolyteSchedule!.magnesium.target).toBe('1.7-2.2 mg/dL');
  });

  it('should include ECG monitoring when safe', () => {
    const result = BulimiaNutritionalPlan.calculate({
      age: 20, weight: 55, height: 165, gender: 'female',
      mealFrequency: 2, bingeFrequency: 5, purgingFrequency: 3,
      electrolytes: normalElectrolytes,
    });
    expect(result.ecgMonitoring).toBeDefined();
    expect(result.ecgMonitoring!.mandatory).toBe(true);
    expect(result.ecgMonitoring!.timing).toBe('قبل البدء + يوم 7');
  });

  it('should include titration plan when safe', () => {
    const result = BulimiaNutritionalPlan.calculate({
      age: 20, weight: 55, height: 165, gender: 'female',
      mealFrequency: 2, bingeFrequency: 5, purgingFrequency: 3,
      electrolytes: normalElectrolytes,
    });
    expect(result.titration).toBeDefined();
    expect(result.titration!.increase).toBe(200);
    expect(result.titration!.initial).toBe(1584);
  });

  it('should include ree field when safe', () => {
    const result = BulimiaNutritionalPlan.calculate({
      age: 20, weight: 55, height: 165, gender: 'female',
      mealFrequency: 2, bingeFrequency: 5, purgingFrequency: 3,
      electrolytes: normalElectrolytes,
    });
    expect(result.ree).toBeCloseTo(1320.25, 0);
  });

  it('should return safe=false for NaN age', () => {
    const result = BulimiaNutritionalPlan.calculate({
      age: NaN, weight: 55, height: 165, gender: 'female',
      mealFrequency: 2, bingeFrequency: 3, purgingFrequency: 1,
      electrolytes: normalElectrolytes,
    });
    expect(result.isSafe).toBe(false);
    expect(result.errorCode).toBe('INVALID_INPUT');
  });

  it('should return safe=false for zero weight', () => {
    const result = BulimiaNutritionalPlan.calculate({
      age: 20, weight: 0, height: 165, gender: 'female',
      mealFrequency: 2, bingeFrequency: 3, purgingFrequency: 1,
      electrolytes: normalElectrolytes,
    });
    expect(result.isSafe).toBe(false);
    expect(result.errorCode).toBe('INVALID_INPUT');
  });

  it('should include electrolyte schedule in high-risk fallback', () => {
    const lowElectrolytes = { potassium: 3.0, phosphorus: 2.0, magnesium: 1.2 };
    const result = BulimiaNutritionalPlan.calculate({
      age: 18, weight: 35, height: 160, gender: 'female',
      mealFrequency: 1, bingeFrequency: 7, purgingFrequency: 5,
      electrolytes: lowElectrolytes,
    });
    expect(result.electrolyteSchedule).toBeDefined();
    expect(result.errorCode).toBe('HIGH_REFEEDING_RISK');
  });
});
