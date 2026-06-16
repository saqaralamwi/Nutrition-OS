import { describe, it, expect } from 'vitest';
import { TpnCompoundingEngine } from '../TpnCompoundingEngine';

describe('TpnCompoundingEngine', () => {
  it('hypertonic mixture -> 1373.33 mOsm/L, central line', () => {
    const result = TpnCompoundingEngine.calculateTpnRequirements({
      aminoAcidGrams: 80,
      dextroseGrams: 200,
      lipidGrams: 40,
      sodiumMeq: 60,
      potassiumMeq: 40,
      totalFluidVolumeMl: 1500,
    });

    expect(result.calculatedOsmolarityMosmL).toBe(1373.33);
    expect(result.recommendedRoute).toBe('central_line');
    expect(result.isSafe).toBe(true);
    expect(result.arabicClinicalAlerts.length).toBeGreaterThan(0);
    expect(result.arabicClinicalAlerts[0]).toContain('قسطرة وريدية مركزية');
  });

  it('isotonic mixture -> 640.00 mOsm/L, peripheral line', () => {
    const result = TpnCompoundingEngine.calculateTpnRequirements({
      aminoAcidGrams: 30,
      dextroseGrams: 50,
      lipidGrams: 20,
      sodiumMeq: 20,
      potassiumMeq: 10,
      totalFluidVolumeMl: 1000,
    });

    expect(result.calculatedOsmolarityMosmL).toBe(640.00);
    expect(result.recommendedRoute).toBe('peripheral_line');
    expect(result.isSafe).toBe(true);
    expect(result.arabicClinicalAlerts[0]).toContain('طرفي آمن');
  });

  it('zero fluid volume -> defensive fallback', () => {
    const result = TpnCompoundingEngine.calculateTpnRequirements({
      aminoAcidGrams: 80,
      dextroseGrams: 200,
      lipidGrams: 40,
      sodiumMeq: 60,
      potassiumMeq: 40,
      totalFluidVolumeMl: 0,
    });

    expect(result.isSafe).toBe(false);
    expect(result.calculatedOsmolarityMosmL).toBe(0);
    expect(result.recommendedRoute).toBe('peripheral_line');
  });
});
