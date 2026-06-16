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
  test('classifies median input as normal', async () => {
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
    });

    expect(result.isSafe).toBe(true);
    expect(result.zScore).toBeCloseTo(0, 5);
    expect(result.classification).toBe('normal');
  });

  test('returns severely_low for measurement far below -3 SD', async () => {
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
    });

    expect(result.isSafe).toBe(true);
    expect(result.zScore).toBeLessThan(-3);
    expect(result.classification).toBe('severely_low');
  });

  test('returns safe fallback when measurement is zero', async () => {
    const result = await PediatricZScoreEngine.calculateZScore({
      gender: 'male',
      indicatorType: 'wfa',
      measurementValue: 0,
      ageMonths: 60,
    });

    expect(result.isSafe).toBe(false);
    expect(result.zScore).toBeCloseTo(0, 5);
    expect(result.classification).toBe('normal');
    expect(result.errorMessage).toBeDefined();
  });

  test('returns safe fallback when no matching records found', async () => {
    mockFetch.mockResolvedValueOnce([]);

    const result = await PediatricZScoreEngine.calculateZScore({
      gender: 'male',
      indicatorType: 'bmifa',
      measurementValue: 15,
      ageMonths: 24,
    });

    expect(result.isSafe).toBe(false);
    expect(result.zScore).toBe(0);
    expect(result.errorMessage).toBeDefined();
  });
});
