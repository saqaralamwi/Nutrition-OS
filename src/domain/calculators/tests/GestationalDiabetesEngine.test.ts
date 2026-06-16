import { describe, test, expect } from 'vitest';
import { GestationalDiabetesEngine } from '../GestationalDiabetesEngine';

describe('GestationalDiabetesEngine', () => {
  test('IOM weight gain range for normal BMI 22.0 is 11.5 to 16.0 kg', () => {
    const result = GestationalDiabetesEngine.calculateGDMDynamics({
      prePregnancyBMI: 22.0,
      currentWeightKg: 65,
      prePregnancyWeightKg: 60,
      gestationalWeeks: 16,
      baseCaloriesREE: 1400,
      activityFactor: 1.2,
    });

    expect(result.targetWeightGainMinKg).toBe(11.5);
    expect(result.targetWeightGainMaxKg).toBe(16.0);
    expect(result.isSafe).toBe(true);
  });

  test('trimester 3 (week 32) adds 452 kcal to baseline TEE', () => {
    const result = GestationalDiabetesEngine.calculateGDMDynamics({
      prePregnancyBMI: 24.0,
      currentWeightKg: 68,
      prePregnancyWeightKg: 60,
      gestationalWeeks: 32,
      baseCaloriesREE: 2000,
      activityFactor: 1.0,
    });

    expect(result.totalRecommendedCalories).toBe(2452);
    expect(result.targetCarbGrams).toBeCloseTo((2452 * 0.40) / 4, 2);
    expect(result.minimumSafeCarbGrams).toBe(175);
    expect(result.isSafe).toBe(true);
  });

  test('returns safe fallback when gestationalWeeks exceeds 42', () => {
    const result = GestationalDiabetesEngine.calculateGDMDynamics({
      prePregnancyBMI: 22.0,
      currentWeightKg: 65,
      prePregnancyWeightKg: 60,
      gestationalWeeks: 50,
      baseCaloriesREE: 1400,
      activityFactor: 1.2,
    });

    expect(result.totalRecommendedCalories).toBe(0);
    expect(result.targetCarbGrams).toBe(0);
    expect(result.isSafe).toBe(false);
    expect(result.clinicalAlerts).toHaveLength(1);
    expect(result.clinicalAlerts[0]).toContain('غير صالحة');
  });
});
