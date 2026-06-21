import { describe, it, expect, vi } from 'vitest';
import { PediatricCalculator } from '../PediatricCalculator';

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

describe('PediatricCalculator.calculateWHOZScore', () => {
  it('returns 0 when M <= 0', () => {
    const z = (PediatricCalculator as any).calculateWHOZScore(10, 1, 0, 0.1, false);
    expect(z).toBe(0);
  });

  it('returns 0 when S === 0', () => {
    const z = (PediatricCalculator as any).calculateWHOZScore(10, 1, 10, 0, false);
    expect(z).toBe(0);
  });

  it('calculates positive Z-score with L=0 (log method)', () => {
    const z = (PediatricCalculator as any).calculateWHOZScore(12, 0, 10, 0.1, false);
    expect(z).toBeCloseTo(1.823, 2);
  });

  it('calculates negative Z-score with L!=0', () => {
    const z = (PediatricCalculator as any).calculateWHOZScore(8, -0.2, 10, 0.15, false);
    expect(z).toBeLessThan(0);
  });

  it('applies WHO adjustment for Z > 3 (weight-based)', () => {
    // y much larger than M → extreme Z
    const z = (PediatricCalculator as any).calculateWHOZScore(50, -0.2, 18.5, 0.12, true);
    expect(z).toBeGreaterThan(3);
  });

  it('applies WHO adjustment for Z < -3 (weight-based)', () => {
    const z = (PediatricCalculator as any).calculateWHOZScore(5, -0.2, 18.5, 0.12, true);
    expect(z).toBeLessThan(-3);
  });
});

describe('PediatricCalculator.calculateZScores', () => {
  it('returns null scores for invalid weight <= 0', async () => {
    const result = await PediatricCalculator.calculateZScores('p1', 0, 100, 60, 'male');
    expect(result.wfa).toBeNull();
    expect(result.hfa).toBeNull();
    expect(result.bfa).toBeNull();
  });

  it('returns null scores for invalid height <= 0', async () => {
    const result = await PediatricCalculator.calculateZScores('p1', 20, 0, 60, 'male');
    expect(result.wfa).toBeNull();
    expect(result.hfa).toBeNull();
    expect(result.bfa).toBeNull();
  });

  it('returns null scores for negative age', async () => {
    const result = await PediatricCalculator.calculateZScores('p1', 20, 100, -1, 'male');
    expect(result.wfa).toBeNull();
    expect(result.hfa).toBeNull();
    expect(result.bfa).toBeNull();
  });

  it('calculates WFA Z-score when standard exists', async () => {
    mockFetch.mockResolvedValueOnce([
      {
        indicatorType: 'wfa',
        lValue: -0.2,
        mValue: 18.5,
        sValue: 0.12,
      },
    ]);

    const result = await PediatricCalculator.calculateZScores('p1', 18.5, 100, 60, 'male');
    expect(result.wfa).not.toBeNull();
    expect(result.wfa).toBeCloseTo(0, 1);
  });

  it('calculates HFA Z-score when standard exists', async () => {
    mockFetch.mockResolvedValueOnce([
      {
        indicatorType: 'hfa',
        lValue: 0,
        mValue: 110,
        sValue: 0.04,
      },
    ]);

    const result = await PediatricCalculator.calculateZScores('p1', 20, 110, 60, 'male');
    expect(result.hfa).not.toBeNull();
  });

  it('calculates BFA Z-score when standard exists', async () => {
    mockFetch.mockResolvedValueOnce([
      {
        indicatorType: 'bfa',
        lValue: -0.2,
        mValue: 15.5,
        sValue: 0.1,
      },
    ]);

    const result = await PediatricCalculator.calculateZScores('p1', 20, 100, 60, 'male');
    const bmi = 20 / ((100 / 100) ** 2);
    expect(bmi).toBe(20);
    expect(result.bfa).not.toBeNull();
  });
});

describe('PediatricCalculator.getSTAMPRiskLevel', () => {
  it('score 0-1 => low', () => {
    expect(PediatricCalculator.getSTAMPRiskLevel(0).level).toBe('low');
    expect(PediatricCalculator.getSTAMPRiskLevel(1).level).toBe('low');
    expect(PediatricCalculator.getSTAMPRiskLevel(0).labelAr).toBe('خطر منخفض');
  });

  it('score 2-3 => medium', () => {
    expect(PediatricCalculator.getSTAMPRiskLevel(2).level).toBe('medium');
    expect(PediatricCalculator.getSTAMPRiskLevel(3).level).toBe('medium');
    expect(PediatricCalculator.getSTAMPRiskLevel(2).labelAr).toBe('خطر متوسط');
  });

  it('score 4+ => high', () => {
    expect(PediatricCalculator.getSTAMPRiskLevel(4).level).toBe('high');
    expect(PediatricCalculator.getSTAMPRiskLevel(6).level).toBe('high');
    expect(PediatricCalculator.getSTAMPRiskLevel(10).level).toBe('high');
    expect(PediatricCalculator.getSTAMPRiskLevel(4).labelAr).toBe('خطر مرتفع');
  });
});
