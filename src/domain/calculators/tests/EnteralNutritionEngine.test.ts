import { describe, it, expect } from 'vitest';
import { EnteralNutritionEngine } from '../EnteralNutritionEngine';

describe('EnteralNutritionEngine', () => {
  it('continuous feed: net 1500, density 1.5, protein 4g/100mL, GRV 100', () => {
    const result = EnteralNutritionEngine.calculateEnteralFeed({
      netCaloricRequirement: 1500,
      formulaCaloricDensity: 1.5,
      formulaProteinDensityGrams: 4,
      feedingMethod: 'continuous',
      gastricResidualVolumeMl: 100,
      formulaOsmolality: 300,
    });

    expect(result.totalDailyVolumeMl).toBe(1000.00);
    expect(result.flowRateMlHr).toBe(41.67);
    expect(result.totalProteinGrams).toBe(40.00);
    expect(result.clinicalActionRecommendation).toBe('advance_protocol');
    expect(result.isToleranceIssue).toBe(false);
    expect(result.isHyperosmolarRisk).toBe(false);
    expect(result.isSafe).toBe(true);
  });

  it('GRV = 550 mL triggers hold_feed', () => {
    const result = EnteralNutritionEngine.calculateEnteralFeed({
      netCaloricRequirement: 1500,
      formulaCaloricDensity: 1.5,
      formulaProteinDensityGrams: 4,
      feedingMethod: 'continuous',
      gastricResidualVolumeMl: 550,
      formulaOsmolality: 300,
    });

    expect(result.clinicalActionRecommendation).toBe('hold_feed');
    expect(result.isToleranceIssue).toBe(true);
    expect(result.isSafe).toBe(true);
  });

  it('osmolality 450 mOsm/kg flags hyperosmolar risk', () => {
    const result = EnteralNutritionEngine.calculateEnteralFeed({
      netCaloricRequirement: 1500,
      formulaCaloricDensity: 1.5,
      formulaProteinDensityGrams: 4,
      feedingMethod: 'continuous',
      gastricResidualVolumeMl: 100,
      formulaOsmolality: 450,
    });

    expect(result.isHyperosmolarRisk).toBe(true);
    expect(result.arabicDirectives.some(d => d.includes('الأسمولالية'))).toBe(true);
    expect(result.isSafe).toBe(true);
  });
});
