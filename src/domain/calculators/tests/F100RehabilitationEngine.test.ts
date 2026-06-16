import { describe, test, expect } from 'vitest';
import { F100RehabilitationEngine } from '../F100RehabilitationEngine';

describe('F100RehabilitationEngine', () => {
  test('calculates F100 feeds for 6.0 kg child at 180 kcal/kg/day with 6 feeds', () => {
    const result = F100RehabilitationEngine.calculateRehabilitationFeeds({
      weightKg: 6.0,
      feedingType: 'F100',
      targetCaloricDensity: 180,
      feedFrequency: 6,
    });

    expect(result.totalDailyCaloriesRequired).toBe(1080);
    expect(result.totalDailyVolumeMl).toBe(1080);
    expect(result.volumePerFeedMl).toBe(180);
    expect(result.rutfPacketsPerDay).toBe(0);
    expect(result.isSafe).toBe(true);
    expect(result.clinicalInstructions.length).toBeGreaterThanOrEqual(5);
  });

  test('calculates RUTF packets for 8.5 kg child at 150 kcal/kg/day', () => {
    const result = F100RehabilitationEngine.calculateRehabilitationFeeds({
      weightKg: 8.5,
      feedingType: 'RUTF',
      targetCaloricDensity: 150,
      feedFrequency: 0,
    });

    expect(result.totalDailyCaloriesRequired).toBe(1275);
    expect(result.totalDailyVolumeMl).toBe(0);
    expect(result.volumePerFeedMl).toBe(0);
    expect(result.rutfPacketsPerDay).toBeCloseTo(2.55, 2);
    expect(result.isSafe).toBe(true);
  });

  test('returns safe fallback when targetCaloricDensity is out of bounds (120)', () => {
    const result = F100RehabilitationEngine.calculateRehabilitationFeeds({
      weightKg: 6.0,
      feedingType: 'F100',
      targetCaloricDensity: 120,
      feedFrequency: 6,
    });

    expect(result.totalDailyCaloriesRequired).toBe(0);
    expect(result.totalDailyVolumeMl).toBe(0);
    expect(result.volumePerFeedMl).toBe(0);
    expect(result.rutfPacketsPerDay).toBe(0);
    expect(result.isSafe).toBe(false);
    expect(result.clinicalInstructions).toHaveLength(1);
    expect(result.clinicalInstructions[0]).toContain('خارج النطاق المسموح');
  });
});
