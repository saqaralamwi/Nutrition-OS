import { describe, test, expect, vi } from 'vitest';
import { PediatricZScoreEngine } from '../PediatricZScoreEngine';

const mockFetch = vi.hoisted(() => vi.fn());

vi.mock('../../../data/database', () => ({
  getDatabase: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue({
      query: vi.fn().mockReturnValue({ fetch: mockFetch }),
    }),
  }),
}));

vi.mock('@nozbe/watermelondb', () => ({
  Q: {
    where: vi.fn(),
  },
}));

describe('PediatricZScoreEngine', () => {
  test('classifies median input as normal with WHO standard', async () => {
    mockFetch.mockResolvedValueOnce([
      {
        _raw: {
          gender: 'male',
          age_months: 60,
          indicator_type: 'wfa',
          l_value: -0.2,
          m_value: 18.5,
          s_value: 0.12,
        },
      },
    ]);

    const result = await PediatricZScoreEngine.calculateZScore({
      gender: 'male',
      indicatorType: 'wfa',
      measurementValue: 18.5,
      ageMonths: 60,
      standard: 'WHO',
    });

    expect(result.isSafe).toBe(true);
    expect(result.zScore).toBeCloseTo(0, 5);
    expect(result.classification).toBe('normal');
    expect(result.standard).toBe('WHO');
  });

  test('returns severely_low with WHO standard', async () => {
    mockFetch.mockResolvedValueOnce([
      {
        _raw: {
          gender: 'female',
          age_months: 12,
          indicator_type: 'wfa',
          l_value: 0,
          m_value: 9.5,
          s_value: 0.1,
        },
      },
    ]);

    const result = await PediatricZScoreEngine.calculateZScore({
      gender: 'female',
      indicatorType: 'wfa',
      measurementValue: 6.5,
      ageMonths: 12,
      standard: 'WHO',
    });

    expect(result.isSafe).toBe(true);
    expect(result.zScore).toBeLessThan(-3);
    expect(result.classification).toBe('severely_low');
    expect(result.standard).toBe('WHO');
  });

  test('returns error state with action when measurement is zero', async () => {
    const result = await PediatricZScoreEngine.calculateZScore({
      gender: 'male',
      indicatorType: 'wfa',
      measurementValue: 0,
      ageMonths: 60,
    });

    expect(result.isSafe).toBe(false);
    expect(result.zScore).toBe(0);
    expect(result.classification).toBe('unknown');
    expect(result.errorMessage).toBeDefined();
    expect(result.action).toBe('إدخال يدوي');
  });

  test('returns error with action when no WHO records found', async () => {
    mockFetch.mockResolvedValueOnce([]);

    const result = await PediatricZScoreEngine.calculateZScore({
      gender: 'male',
      indicatorType: 'bmifa',
      measurementValue: 15,
      ageMonths: 24,
      standard: 'WHO',
    });

    expect(result.isSafe).toBe(false);
    expect(result.zScore).toBe(0);
    expect(result.classification).toBe('unknown');
    expect(result.errorMessage).toBeDefined();
    expect(result.action).toBe('إدخال يدوي');
  });

  test('CDC standard returns valid Z-score for median weight', async () => {
    const result = await PediatricZScoreEngine.calculateZScore({
      gender: 'male',
      indicatorType: 'wfa',
      measurementValue: 13.68,
      ageMonths: 36,
      standard: 'CDC',
    });

    expect(result.isSafe).toBe(true);
    expect(Math.abs(result.zScore)).toBeLessThan(2);
    expect(result.classification).toBe('normal');
    expect(result.standard).toBe('CDC');
  });

  test('CDC standard returns severely_low for very low weight', async () => {
    const result = await PediatricZScoreEngine.calculateZScore({
      gender: 'female',
      indicatorType: 'wfa',
      measurementValue: 4.0,
      ageMonths: 12,
      standard: 'CDC',
    });

    expect(result.isSafe).toBe(true);
    expect(result.zScore).toBeLessThan(-3);
    expect(result.classification).toBe('severely_low');
  });

  test('CDC standard returns severely_high for severely elevated BMI', async () => {
    const result = await PediatricZScoreEngine.calculateZScore({
      gender: 'male',
      indicatorType: 'bmifa',
      measurementValue: 20,
      ageMonths: 48,
      standard: 'CDC',
    });

    expect(result.isSafe).toBe(true);
    expect(result.zScore).toBeGreaterThan(3);
    expect(result.classification).toBe('severely_high');
  });

  test('uses WHO standard for age <= 24 months by default', async () => {
    mockFetch.mockResolvedValueOnce([
      {
        _raw: {
          gender: 'male',
          age_months: 12,
          indicator_type: 'wfa',
          l_value: -0.2,
          m_value: 10.0,
          s_value: 0.1,
        },
      },
    ]);

    const result = await PediatricZScoreEngine.calculateZScore({
      gender: 'male',
      indicatorType: 'wfa',
      measurementValue: 10.0,
      ageMonths: 12,
    });

    expect(result.standard).toBe('WHO');
  });

  test('uses CDC standard for age > 24 months by default', async () => {
    const result = await PediatricZScoreEngine.calculateZScore({
      gender: 'female',
      indicatorType: 'wfa',
      measurementValue: 15.0,
      ageMonths: 36,
    });

    expect(result.standard).toBe('CDC');
  });

  test('returns action "إدخال يدوي" when measurement is invalid', async () => {
    const result = await PediatricZScoreEngine.calculateZScore({
      gender: 'male',
      indicatorType: 'wfa',
      measurementValue: 0,
      ageMonths: 12,
    });

    expect(result.action).toBe('إدخال يدوي');
    expect(result.isSafe).toBe(false);
  });

  test('returns action "إدخال يدوي" when age exceeds WHO maximum', async () => {
    const result = await PediatricZScoreEngine.calculateZScore({
      gender: 'male',
      indicatorType: 'wfa',
      measurementValue: 50,
      ageMonths: 240,
      standard: 'WHO',
    });

    expect(result.isSafe).toBe(false);
    expect(result.action).toBe('إدخال يدوي');
    expect(result.errorMessage).toContain('228');
    expect(result.standard).toBe('WHO');
  });
});
