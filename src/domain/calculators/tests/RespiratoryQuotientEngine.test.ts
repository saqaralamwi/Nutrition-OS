import { describe, it, expect } from 'vitest';
import { RespiratoryQuotientEngine } from '../RespiratoryQuotientEngine';

describe('RespiratoryQuotientEngine', () => {
  it('hypercapnic COPD mechanical ventilation -> RQ 0.80, 40% carb ceiling, 800 kcal', () => {
    const result = RespiratoryQuotientEngine.evaluateRespiratoryConstraints({
      fev1Percentage: 42,
      hasCo2Retention: true,
      oxygenDeliveryMode: 'mechanical_ventilation',
      totalEnergyTargetKcal: 2000,
    });

    expect(result.targetRq).toBe(0.80);
    expect(result.maxCarbohydrateEnergyRatio).toBe(0.40);
    expect(result.maxCarbKcal).toBe(800.00);
    expect(result.minLipidEnergyRatio).toBe(0.45);
    expect(result.isSafe).toBe(true);
    expect(result.arabicClinicalAlerts.length).toBeGreaterThan(0);
    expect(result.arabicClinicalAlerts[0]).toContain('احتباس CO2 حاد');
  });

  it('stable asthma -> RQ 0.85, 55% carb ceiling, 990 kcal', () => {
    const result = RespiratoryQuotientEngine.evaluateRespiratoryConstraints({
      fev1Percentage: 85,
      hasCo2Retention: false,
      oxygenDeliveryMode: 'none',
      totalEnergyTargetKcal: 1800,
    });

    expect(result.targetRq).toBe(0.85);
    expect(result.maxCarbohydrateEnergyRatio).toBe(0.55);
    expect(result.maxCarbKcal).toBe(990.00);
    expect(result.minLipidEnergyRatio).toBe(0.25);
    expect(result.isSafe).toBe(true);
    expect(result.arabicClinicalAlerts).toHaveLength(0);
  });

  it('zero energy target -> defensive fallback', () => {
    const result = RespiratoryQuotientEngine.evaluateRespiratoryConstraints({
      fev1Percentage: 85,
      hasCo2Retention: false,
      oxygenDeliveryMode: 'none',
      totalEnergyTargetKcal: 0,
    });

    expect(result.isSafe).toBe(false);
    expect(result.maxCarbKcal).toBe(0);
    expect(result.maxCarbohydrateEnergyRatio).toBe(0);
  });
});
