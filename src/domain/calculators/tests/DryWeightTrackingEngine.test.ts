import { describe, it, expect } from 'vitest';
import { DryWeightTrackingEngine } from '../DryWeightTrackingEngine';

describe('DryWeightTrackingEngine', () => {
  it('acute fluid shift: critical risk with edema 1+', () => {
    const result = DryWeightTrackingEngine.evaluateFluidRetention({
      measuredDryWeightKg: 70.00,
      currentMorningWeightKg: 71.30,
      previousWeight24hAgoKg: 70.20,
      edemaGrading: '1+',
    });

    expect(result.weightDelta24hKg).toBe(1.10);
    expect(result.netFluidGainKg).toBe(1.30);
    expect(result.estimatedRetainedFluidMl).toBe(1300.00);
    expect(result.congestionRiskTier).toBe('critical');
    expect(result.isSafe).toBe(true);
    expect(result.arabicClinicalAlerts.length).toBeGreaterThan(0);
  });

  it('stable profile: low risk, no edema', () => {
    const result = DryWeightTrackingEngine.evaluateFluidRetention({
      measuredDryWeightKg: 65.00,
      currentMorningWeightKg: 65.20,
      previousWeight24hAgoKg: 65.20,
      edemaGrading: 'none',
    });

    expect(result.congestionRiskTier).toBe('low');
    expect(result.estimatedRetainedFluidMl).toBe(200.00);
    expect(result.netFluidGainKg).toBe(0.20);
    expect(result.weightDelta24hKg).toBe(0.00);
    expect(result.isSafe).toBe(true);
  });

  it('invalid negative dry weight returns safe fallback', () => {
    const result = DryWeightTrackingEngine.evaluateFluidRetention({
      measuredDryWeightKg: -5,
      currentMorningWeightKg: 65.00,
      previousWeight24hAgoKg: 65.00,
      edemaGrading: 'none',
    });

    expect(result.isSafe).toBe(false);
    expect(result.netFluidGainKg).toBe(0);
    expect(result.estimatedRetainedFluidMl).toBe(0);
    expect(result.weightDelta24hKg).toBe(0);
    expect(result.congestionRiskTier).toBe('low');
    expect(result.arabicClinicalAlerts).toContain('الرجاء إدخال قيم وزن صحيحة للمريض');
  });

  it('moderate risk: weightDelta 0.7kg with edema 2+', () => {
    const result = DryWeightTrackingEngine.evaluateFluidRetention({
      measuredDryWeightKg: 80.00,
      currentMorningWeightKg: 82.50,
      previousWeight24hAgoKg: 81.80,
      edemaGrading: '2+',
    });

    expect(result.congestionRiskTier).toBe('moderate');
    expect(result.weightDelta24hKg).toBe(0.70);
    expect(result.isSafe).toBe(true);
  });

  it('critical from edema 4+ alone regardless of delta', () => {
    const result = DryWeightTrackingEngine.evaluateFluidRetention({
      measuredDryWeightKg: 75.00,
      currentMorningWeightKg: 75.50,
      previousWeight24hAgoKg: 75.40,
      edemaGrading: '4+',
    });

    expect(result.congestionRiskTier).toBe('critical');
    expect(result.isSafe).toBe(true);
  });
});
