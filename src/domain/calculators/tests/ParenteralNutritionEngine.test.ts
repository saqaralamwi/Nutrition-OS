import { describe, it, expect } from 'vitest';
import { ParenteralNutritionEngine } from '../ParenteralNutritionEngine';

describe('ParenteralNutritionEngine', () => {
  it('central line: 1800 kcal, 80g protein, 2000 mL fluid -> no violation', () => {
    const result = ParenteralNutritionEngine.calculateParenteralFeed({
      targetCalories: 1800,
      targetProteinGrams: 80,
      totalFluidLimitMl: 2000,
      routeType: 'central',
    });

    expect(result.proteinCalories).toBe(320.00);
    expect(result.nonProteinCalories).toBe(1480.00);
    expect(result.dextroseGrams).toBe(304.71);
    expect(result.lipidGrams).toBe(49.33);
    expect(result.predictedOsmolarity).toBeGreaterThan(0);
    expect(result.isOsmolarityViolation).toBe(false);
    expect(result.isSafe).toBe(true);
  });

  it('peripheral line: 1800 kcal, 80g protein, 1000 mL fluid -> osmolarity violation', () => {
    const result = ParenteralNutritionEngine.calculateParenteralFeed({
      targetCalories: 1800,
      targetProteinGrams: 80,
      totalFluidLimitMl: 1000,
      routeType: 'peripheral',
    });

    expect(result.isOsmolarityViolation).toBe(true);
    expect(result.isSafe).toBe(false);
    expect(result.predictedOsmolarity).toBeGreaterThan(900);
  });

  it('protein exceeds target calories triggers safe fallback', () => {
    const result = ParenteralNutritionEngine.calculateParenteralFeed({
      targetCalories: 1000,
      targetProteinGrams: 300,
      totalFluidLimitMl: 2000,
      routeType: 'central',
    });

    expect(result.isSafe).toBe(false);
    expect(result.dextroseGrams).toBe(0);
    expect(result.proteinCalories).toBe(0);
    expect(result.arabicClinicalAlerts[0]).toContain('تجاوز السعرات المستهدفة');
  });
});
