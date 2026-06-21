import { describe, it, expect } from 'vitest';
import { PediatricEERCalculator } from '../PediatricEERCalculator';

describe('PediatricEERCalculator', () => {
  it('should calculate energy for neonate under 1 month', () => {
    const result = PediatricEERCalculator.calculate({
      ageInMonths: 0.5,
      weightKg: 3.5,
      heightCm: 50,
      gender: 'MALE',
      isCriticallyIll: false,
      hasFever: false,
    });
    expect(result.eerKcal).toBe(420);
    expect(result.isSafe).toBe(true);
  });

  it('should calculate energy for infant 6 months', () => {
    const result = PediatricEERCalculator.calculate({
      ageInMonths: 6,
      weightKg: 7,
      heightCm: 65,
      gender: 'FEMALE',
      isCriticallyIll: false,
      hasFever: false,
    });
    expect(result.eerKcal).toBe(700);
    expect(result.isSafe).toBe(true);
  });

  it('should calculate energy for toddler 24 months', () => {
    const result = PediatricEERCalculator.calculate({
      ageInMonths: 24,
      weightKg: 12,
      heightCm: 85,
      gender: 'MALE',
      isCriticallyIll: false,
      hasFever: false,
    });
    expect(result.eerKcal).toBe(1140);
    expect(result.isSafe).toBe(true);
  });

  it('should apply critical illness factor', () => {
    const without = PediatricEERCalculator.calculate({
      ageInMonths: 60, weightKg: 18, heightCm: 110,
      gender: 'MALE', isCriticallyIll: false, hasFever: false,
    });
    const withCrit = PediatricEERCalculator.calculate({
      ageInMonths: 60, weightKg: 18, heightCm: 110,
      gender: 'MALE', isCriticallyIll: true, hasFever: false,
    });
    expect(withCrit.eerKcal).toBeGreaterThan(without.eerKcal);
    expect(withCrit.appliedAdjustment).toContain('×1.3');
  });

  it('should return safe=false for invalid weight', () => {
    const result = PediatricEERCalculator.calculate({
      ageInMonths: 12, weightKg: 0, heightCm: 70,
      gender: 'MALE', isCriticallyIll: false, hasFever: false,
    });
    expect(result.isSafe).toBe(false);
    expect(result.eerKcal).toBe(0);
  });

  it('should return safe=false for NaN weight', () => {
    const result = PediatricEERCalculator.calculate({
      ageInMonths: 12, weightKg: NaN, heightCm: 70,
      gender: 'MALE', isCriticallyIll: false, hasFever: false,
    });
    expect(result.isSafe).toBe(false);
    expect(result.eerKcal).toBe(0);
  });

  it('should return safe=false for NaN height', () => {
    const result = PediatricEERCalculator.calculate({
      ageInMonths: 60, weightKg: 18, heightCm: NaN,
      gender: 'MALE', isCriticallyIll: false, hasFever: false,
    });
    expect(result.isSafe).toBe(false);
  });
});
