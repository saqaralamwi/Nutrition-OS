import { describe, test, expect } from 'vitest';
import { InsulinCarbRatioEngine } from '../InsulinCarbRatioEngine';

describe('InsulinCarbRatioEngine', () => {
  test('calculates ICR of 12.50 for TDD of 40 units', () => {
    const result = InsulinCarbRatioEngine.calculateICR(40);

    expect(result.icrValue).toBe(12.5);
    expect(result.isSafe).toBe(true);
    expect(result.clinicalNote).toContain('12.5');
  });

  test('calculates ICR of 5.00 for TDD of 100 units', () => {
    const result = InsulinCarbRatioEngine.calculateICR(100);

    expect(result.icrValue).toBe(5);
    expect(result.isSafe).toBe(true);
    expect(result.clinicalNote).toContain('5');
  });

  test('returns safe fallback when TDD is zero', () => {
    const result = InsulinCarbRatioEngine.calculateICR(0);

    expect(result.icrValue).toBe(0);
    expect(result.isSafe).toBe(false);
    expect(result.clinicalNote).toContain('أكبر من الصفر');
  });
});
