import { describe, it, expect } from 'vitest';
import { IcuCriticalCareEngine } from '../IcuCriticalCareEngine';

describe('IcuCriticalCareEngine', () => {
  it('ventilated + high refeeding risk -> Penn State equation + 25% ceiling', () => {
    const result = IcuCriticalCareEngine.evaluateIcuNutrition({
      mifflinRmr: 1500,
      isMechanicallyVentilated: true,
      maxTemperatureCelsius: 38.5,
      minuteVentilationLmin: 8.2,
      refeedingRiskLevel: 'high',
    });

    expect(result.icuEnergyTarget).toBe(2132.50);
    expect(result.initialCaloricCeiling).toBe(533.13);
    expect(result.isRefeedingRestrictionEnforced).toBe(true);
    expect(result.isSafe).toBe(true);
    expect(result.arabicClinicalAlerts.length).toBeGreaterThan(0);
    expect(result.arabicClinicalAlerts[0]).toContain('Refeeding Syndrome');
  });

  it('non-ventilated febrile + moderate risk -> fever factor + 50% ceiling', () => {
    const result = IcuCriticalCareEngine.evaluateIcuNutrition({
      mifflinRmr: 1600,
      isMechanicallyVentilated: false,
      maxTemperatureCelsius: 39.0,
      minuteVentilationLmin: 0,
      refeedingRiskLevel: 'moderate',
    });

    expect(result.icuEnergyTarget).toBe(2016.00);
    expect(result.initialCaloricCeiling).toBe(1008.00);
    expect(result.isRefeedingRestrictionEnforced).toBe(true);
    expect(result.isSafe).toBe(true);
  });

  it('non-ventilated normal temp + low risk -> no restriction', () => {
    const result = IcuCriticalCareEngine.evaluateIcuNutrition({
      mifflinRmr: 1800,
      isMechanicallyVentilated: false,
      maxTemperatureCelsius: 37.0,
      minuteVentilationLmin: 0,
      refeedingRiskLevel: 'low',
    });

    expect(result.icuEnergyTarget).toBe(1800.00);
    expect(result.initialCaloricCeiling).toBe(1800.00);
    expect(result.isRefeedingRestrictionEnforced).toBe(false);
    expect(result.isSafe).toBe(true);
    expect(result.arabicClinicalAlerts).toHaveLength(0);
  });

  it('extreme temperature out of range -> defensive fallback', () => {
    const result = IcuCriticalCareEngine.evaluateIcuNutrition({
      mifflinRmr: 1500,
      isMechanicallyVentilated: true,
      maxTemperatureCelsius: 50,
      minuteVentilationLmin: 8.2,
      refeedingRiskLevel: 'low',
    });

    expect(result.isSafe).toBe(false);
    expect(result.icuEnergyTarget).toBe(0);
    expect(result.initialCaloricCeiling).toBe(0);
  });
});
