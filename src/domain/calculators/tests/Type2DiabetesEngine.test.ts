import { describe, test, expect } from 'vitest';
import { Type2DiabetesEngine } from '../Type2DiabetesEngine';

describe('Type2DiabetesEngine', () => {
  test('triggers female floor guard for REE 1400, AF 1.2, targetCalories = 1200', () => {
    const result = Type2DiabetesEngine.calculateType2Requirements({
      baselineREE: 1400,
      activityFactor: 1.2,
      gender: 'female',
      weightKg: 70,
      targetWeightLossPercent: 7,
      hasInsulinResistance: false,
    });

    expect(result.totalEnergyExpenditure).toBe(1680);
    expect(result.targetCalories).toBe(1200);
    expect(result.isFloorGuardTriggered).toBe(true);
    expect(result.isSafe).toBe(true);
  });

  test('calculates insulin resistance macronutrient distribution (45/20/35)', () => {
    const result = Type2DiabetesEngine.calculateType2Requirements({
      baselineREE: 2000,
      activityFactor: 1.2,
      gender: 'male',
      weightKg: 90,
      targetWeightLossPercent: 7,
      hasInsulinResistance: true,
    });

    const tee = 2000 * 1.2;
    expect(result.totalEnergyExpenditure).toBe(tee);
    expect(result.targetCalories).toBe(tee - 500);
    expect(result.carbGrams).toBeCloseTo((result.targetCalories * 0.45) / 4, 2);
    expect(result.proteinGrams).toBeCloseTo((result.targetCalories * 0.20) / 4, 2);
    expect(result.fatGrams).toBeCloseTo((result.targetCalories * 0.35) / 9, 2);
    expect(result.isSafe).toBe(true);
  });

  test('returns safe fallback when REE is zero', () => {
    const result = Type2DiabetesEngine.calculateType2Requirements({
      baselineREE: 0,
      activityFactor: 1.2,
      gender: 'female',
      weightKg: 70,
      targetWeightLossPercent: 7,
      hasInsulinResistance: false,
    });

    expect(result.targetCalories).toBe(0);
    expect(result.carbGrams).toBe(0);
    expect(result.proteinGrams).toBe(0);
    expect(result.fatGrams).toBe(0);
    expect(result.isSafe).toBe(false);
    expect(result.clinicalRecommendations).toHaveLength(1);
    expect(result.clinicalRecommendations[0]).toContain('غير صالحة');
  });
});
