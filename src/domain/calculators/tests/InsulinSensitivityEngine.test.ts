import { describe, test, expect } from 'vitest';
import { InsulinSensitivityEngine } from '../InsulinSensitivityEngine';

describe('InsulinSensitivityEngine', () => {
  test('calculates ISF and correction dose for TDD 50, BG 220, target 120', () => {
    const result = InsulinSensitivityEngine.calculateCorrection({
      totalDailyDose: 50,
      currentBloodGlucose: 220,
      targetBloodGlucose: 120,
    });

    expect(result.isfValue).toBe(36);
    expect(result.correctionDose).toBeCloseTo(2.78, 2);
    expect(result.isSafe).toBe(true);
    expect(result.clinicalDirective).toHaveLength(3);
  });

  test('returns correction dose of 0 when current BG is below target', () => {
    const result = InsulinSensitivityEngine.calculateCorrection({
      totalDailyDose: 50,
      currentBloodGlucose: 110,
      targetBloodGlucose: 120,
    });

    expect(result.isfValue).toBe(36);
    expect(result.correctionDose).toBe(0);
    expect(result.isSafe).toBe(true);
    expect(result.clinicalDirective).toHaveLength(2);
  });

  test('returns safe fallback when TDD is zero', () => {
    const result = InsulinSensitivityEngine.calculateCorrection({
      totalDailyDose: 0,
      currentBloodGlucose: 220,
      targetBloodGlucose: 120,
    });

    expect(result.isfValue).toBe(0);
    expect(result.correctionDose).toBe(0);
    expect(result.isSafe).toBe(false);
    expect(result.clinicalDirective).toHaveLength(1);
    expect(result.clinicalDirective[0]).toContain('أكبر من الصفر');
  });
});
