import { describe, test, expect } from 'vitest';
import { F75StabilizationEngine } from '../F75StabilizationEngine';

describe('F75StabilizationEngine', () => {
  test('calculates correct volumes for 5.0 kg child without edema on 8-feed schedule', () => {
    const result = F75StabilizationEngine.calculateStabilizationFeeds({
      weightKg: 5.0,
      hasSevereEdema: false,
      feedFrequency: 8,
    });

    expect(result.totalDailyVolumeMl).toBe(650.0);
    expect(result.volumePerFeedMl).toBe(81.3);
    expect(result.totalDailyCalories).toBe(487.5);
    expect(result.feedIntervalHours).toBe(3);
    expect(result.isSafe).toBe(true);
    expect(result.clinicalInstructions.length).toBeGreaterThanOrEqual(5);
  });

  test('restricts fluid volume for 5.0 kg child with severe edema', () => {
    const result = F75StabilizationEngine.calculateStabilizationFeeds({
      weightKg: 5.0,
      hasSevereEdema: true,
      feedFrequency: 8,
    });

    expect(result.totalDailyVolumeMl).toBe(500.0);
    expect(result.volumePerFeedMl).toBe(62.5);
    expect(result.totalDailyCalories).toBe(375.0);
    expect(result.feedIntervalHours).toBe(3);
    expect(result.isSafe).toBe(true);
  });

  test('returns safe fallback when weightKg is zero', () => {
    const result = F75StabilizationEngine.calculateStabilizationFeeds({
      weightKg: 0,
      hasSevereEdema: false,
      feedFrequency: 12,
    });

    expect(result.totalDailyVolumeMl).toBe(0);
    expect(result.volumePerFeedMl).toBe(0);
    expect(result.totalDailyCalories).toBe(0);
    expect(result.feedIntervalHours).toBe(2);
    expect(result.isSafe).toBe(false);
    expect(result.clinicalInstructions).toHaveLength(1);
    expect(result.clinicalInstructions[0]).toContain('غير صالح');
  });
});
