import { describe, it, expect } from 'vitest';
import { PediatricRefeedingMonitor } from '../PediatricRefeedingMonitor';

describe('PediatricRefeedingMonitor', () => {
  it('should classify critical tier with low phosphorus', () => {
    const result = PediatricRefeedingMonitor.evaluate({
      serumPhosphorus: 1.8,
      serumPotassium: 4.0,
      serumMagnesium: 1.6,
      weightKg: 10,
      daysOfMalnutrition: 3,
      plannedKcal: 500,
    });
    expect(result.riskTier).toBe('critical');
    expect(result.isSafe).toBe(true);
  });

  it('should classify moderate tier with borderline values', () => {
    const result = PediatricRefeedingMonitor.evaluate({
      serumPhosphorus: 2.8,
      serumPotassium: 4.0,
      serumMagnesium: 1.6,
      weightKg: 10,
      daysOfMalnutrition: 3,
      plannedKcal: 500,
    });
    expect(result.riskTier).toBe('moderate');
  });

  it('should classify low tier with normal values', () => {
    const result = PediatricRefeedingMonitor.evaluate({
      serumPhosphorus: 4.0,
      serumPotassium: 4.5,
      serumMagnesium: 2.0,
      weightKg: 10,
      daysOfMalnutrition: 2,
      plannedKcal: 500,
    });
    expect(result.riskTier).toBe('low');
  });

  it('should cap calories for moderate risk above ceiling', () => {
    const result = PediatricRefeedingMonitor.evaluate({
      serumPhosphorus: 2.8,
      serumPotassium: 4.0,
      serumMagnesium: 2.0,
      weightKg: 10,
      daysOfMalnutrition: 3,
      plannedKcal: 500,
    });
    expect(result.isCapApplied).toBe(true);
    expect(result.adjustedKcal).toBe(100);
  });

  it('should not cap calories when at or below ceiling', () => {
    const result = PediatricRefeedingMonitor.evaluate({
      serumPhosphorus: 2.8,
      serumPotassium: 4.0,
      serumMagnesium: 2.0,
      weightKg: 10,
      daysOfMalnutrition: 3,
      plannedKcal: 80,
    });
    expect(result.isCapApplied).toBe(false);
    expect(result.adjustedKcal).toBe(80);
  });

  it('should return safe=false for invalid input', () => {
    const result = PediatricRefeedingMonitor.evaluate({
      serumPhosphorus: 4.0, serumPotassium: 4.5,
      serumMagnesium: 2.0, weightKg: 0,
      daysOfMalnutrition: 2, plannedKcal: 500,
    });
    expect(result.isSafe).toBe(false);
    expect(result.adjustedKcal).toBe(0);
  });

  it('should return safe=false for NaN weight', () => {
    const result = PediatricRefeedingMonitor.evaluate({
      serumPhosphorus: 4.0, serumPotassium: 4.5,
      serumMagnesium: 2.0, weightKg: NaN,
      daysOfMalnutrition: 2, plannedKcal: 500,
    });
    expect(result.isSafe).toBe(false);
  });
});
