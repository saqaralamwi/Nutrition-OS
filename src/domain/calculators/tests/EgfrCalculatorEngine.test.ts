import { describe, it, expect } from 'vitest';
import { EgfrCalculatorEngine } from '../EgfrCalculatorEngine';

describe('EgfrCalculatorEngine', () => {
  it('calculates eGFR for a 45-year-old female with creatinine 0.6 mg/dL (stage 1)', () => {
    const result = EgfrCalculatorEngine.calculateEgfr({
      serumCreatinine: 0.6,
      age: 45,
      gender: 'female',
    });

    expect(result.egfrValue).toBeGreaterThanOrEqual(90);
    expect(result.stage).toBe('stage_1');
    expect(result.classification).toBe('المرحلة 1: أداء كلوي طبيعي');
    expect(result.isSafe).toBe(true);
  });

  it('calculates eGFR for a 60-year-old male with creatinine 2.5 mg/dL (stage 4)', () => {
    const result = EgfrCalculatorEngine.calculateEgfr({
      serumCreatinine: 2.5,
      age: 60,
      gender: 'male',
    });

    expect(result.egfrValue).toBeGreaterThanOrEqual(15);
    expect(result.egfrValue).toBeLessThan(30);
    expect(result.stage).toBe('stage_4');
    expect(result.classification).toBe('المرحلة 4: قصور كلوي شديد');
    expect(result.isSafe).toBe(true);
  });

  it('returns safe fallback when serumCreatinine is 0', () => {
    const result = EgfrCalculatorEngine.calculateEgfr({
      serumCreatinine: 0,
      age: 45,
      gender: 'female',
    });

    expect(result.egfrValue).toBe(0);
    expect(result.stage).toBe('unknown');
    expect(result.isSafe).toBe(false);
    expect(result.classification).toContain('الرجاء إدخال قيم صحيحة');
  });
});
