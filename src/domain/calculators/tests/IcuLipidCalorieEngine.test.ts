import { describe, it, expect } from 'vitest';
import { IcuLipidCalorieEngine } from '../IcuLipidCalorieEngine';

describe('IcuLipidCalorieEngine', () => {
  it('Propofol 15 mL/hr, target=2000 -> net 1604 kcal, no overfeeding risk', () => {
    const result = IcuLipidCalorieEngine.calculateNetRequirements({
      targetCalories: 2000,
      propofolInfusionRateMlHr: 15.0,
    });

    expect(result.propofolDailyVolumeMl).toBe(360.0);
    expect(result.totalHiddenLipidCalories).toBe(396.0);
    expect(result.netCaloricRequirement).toBe(1604.0);
    expect(result.isOverfeedingRisk).toBe(false);
    expect(result.isSafe).toBe(true);
  });

  it('Propofol 35 mL/hr, target=1800 -> triggers overfeeding risk', () => {
    const result = IcuLipidCalorieEngine.calculateNetRequirements({
      targetCalories: 1800,
      propofolInfusionRateMlHr: 35.0,
    });

    expect(result.totalHiddenLipidCalories).toBe(924.0);
    expect(result.netCaloricRequirement).toBe(876.0);
    expect(result.isOverfeedingRisk).toBe(true);
    expect(result.isSafe).toBe(true);
  });

  it('Propofol 0 mL/hr -> net matches target exactly', () => {
    const result = IcuLipidCalorieEngine.calculateNetRequirements({
      targetCalories: 2000,
      propofolInfusionRateMlHr: 0,
    });

    expect(result.propofolDailyVolumeMl).toBe(0);
    expect(result.totalHiddenLipidCalories).toBe(0);
    expect(result.netCaloricRequirement).toBe(2000);
    expect(result.isOverfeedingRisk).toBe(false);
    expect(result.isSafe).toBe(true);
  });
});
