import { describe, it, expect } from 'vitest';
import { RefeedingSyndromeMonitor } from '../RefeedingSyndromeMonitor';

describe('RefeedingSyndromeMonitor', () => {
  it('phosphorus 2.1, 60kg, planned 1200 -> critical, cap to 600', () => {
    const result = RefeedingSyndromeMonitor.evaluateRefeedingRisk({
      serumPhosphorus: 2.1,
      serumPotassium: 4.0,
      serumMagnesium: 1.9,
      daysOfStarvationOrSevereMalnutrition: 3,
      plannedInitialCalories: 1200,
      weightKg: 60,
    });

    expect(result.riskTier).toBe('critical');
    expect(result.isCalorieCapTriggered).toBe(true);
    expect(result.maxSafeCaloriesCeiling).toBe(600.00);
    expect(result.adjustedCalories).toBe(600.00);
    expect(result.isSafe).toBe(true);
  });

  it('starvation 12 days, normal electrolytes -> critical risk, cap enforced', () => {
    const result = RefeedingSyndromeMonitor.evaluateRefeedingRisk({
      serumPhosphorus: 3.5,
      serumPotassium: 4.2,
      serumMagnesium: 2.0,
      daysOfStarvationOrSevereMalnutrition: 12,
      plannedInitialCalories: 1500,
      weightKg: 70,
    });

    expect(result.riskTier).toBe('critical');
    expect(result.isCalorieCapTriggered).toBe(true);
    expect(result.maxSafeCaloriesCeiling).toBe(700.00);
    expect(result.adjustedCalories).toBe(700.00);
  });

  it('stable low-risk patient -> planned calories unchanged', () => {
    const result = RefeedingSyndromeMonitor.evaluateRefeedingRisk({
      serumPhosphorus: 3.8,
      serumPotassium: 4.5,
      serumMagnesium: 2.1,
      daysOfStarvationOrSevereMalnutrition: 2,
      plannedInitialCalories: 2000,
      weightKg: 70,
    });

    expect(result.riskTier).toBe('low');
    expect(result.isCalorieCapTriggered).toBe(false);
    expect(result.adjustedCalories).toBe(2000);
    expect(result.isSafe).toBe(true);
  });
});
