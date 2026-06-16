import { describe, it, expect } from 'vitest';
import { BurnMetabolicEngine } from '../BurnMetabolicEngine';

describe('BurnMetabolicEngine', () => {
  it('30% TBSA third-degree -> Parkland 8400 mL, Curreri 2950 kcal, protein 140g', () => {
    const result = BurnMetabolicEngine.calculateBurnRequirements({
      patientWeightKg: 70,
      tbsaPercentage: 30,
      burnDegree: 'third',
      isIntubated: false,
    });

    expect(result.parklandFluidMl24h).toBe(8400.00);
    expect(result.first8hFluidMl).toBe(4200.00);
    expect(result.remaining16hFluidMl).toBe(4200.00);
    expect(result.curreriEnergyKcal24h).toBe(2950.00);
    expect(result.targetProteinGrams).toBe(140.00);
    expect(result.isSafe).toBe(true);
    expect(result.arabicClinicalAlerts.length).toBeGreaterThan(0);
    expect(result.arabicClinicalAlerts[0]).toContain('Parkland');
  });

  it('65% TBSA fourth-degree -> TBSA capped at 50%, Curreri 4000 kcal, Parkland 20800 mL', () => {
    const result = BurnMetabolicEngine.calculateBurnRequirements({
      patientWeightKg: 80,
      tbsaPercentage: 65,
      burnDegree: 'fourth',
      isIntubated: true,
    });

    expect(result.parklandFluidMl24h).toBe(20800.00);
    expect(result.first8hFluidMl).toBe(10400.00);
    expect(result.remaining16hFluidMl).toBe(10400.00);
    expect(result.curreriEnergyKcal24h).toBe(4000.00);
    expect(result.targetProteinGrams).toBe(160.00);
    expect(result.isSafe).toBe(true);
  });

  it('negative TBSA -> defensive fallback with isSafe false', () => {
    const result = BurnMetabolicEngine.calculateBurnRequirements({
      patientWeightKg: 70,
      tbsaPercentage: -10,
      burnDegree: 'second',
      isIntubated: false,
    });

    expect(result.isSafe).toBe(false);
    expect(result.parklandFluidMl24h).toBe(0);
    expect(result.curreriEnergyKcal24h).toBe(0);
    expect(result.targetProteinGrams).toBe(0);
  });
});
