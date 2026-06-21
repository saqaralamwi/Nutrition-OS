import { describe, it, expect } from 'vitest';
import { PediatricProteinRequirement } from '../PediatricProteinRequirement';

describe('PediatricProteinRequirement', () => {
  it('should calculate protein for neonate under 1 month', () => {
    const result = PediatricProteinRequirement.calculate({
      ageInMonths: 0.5, weightKg: 3.5,
      isCriticallyIll: false, hasRenalImpairment: false,
      hasLiverImpairment: false, onCRRT: false,
    });
    expect(result.gPerKg).toBe(2.0);
    expect(result.proteinGramsPerDay).toBeCloseTo(7.0, 1);
    expect(result.isSafe).toBe(true);
  });

  it('should calculate protein for infant 6 months', () => {
    const result = PediatricProteinRequirement.calculate({
      ageInMonths: 6, weightKg: 7,
      isCriticallyIll: false, hasRenalImpairment: false,
      hasLiverImpairment: false, onCRRT: false,
    });
    expect(result.gPerKg).toBe(1.5);
    expect(result.isSafe).toBe(true);
  });

  it('should calculate protein for child 5 years', () => {
    const result = PediatricProteinRequirement.calculate({
      ageInMonths: 60, weightKg: 18,
      isCriticallyIll: false, hasRenalImpairment: false,
      hasLiverImpairment: false, onCRRT: false,
    });
    expect(result.gPerKg).toBe(0.95);
    expect(result.isSafe).toBe(true);
  });

  it('should increase protein for critical illness', () => {
    const result = PediatricProteinRequirement.calculate({
      ageInMonths: 60, weightKg: 18,
      isCriticallyIll: true, hasRenalImpairment: false,
      hasLiverImpairment: false, onCRRT: false,
    });
    expect(result.gPerKg).toBeCloseTo(1.43, 1);
    expect(result.isSafe).toBe(true);
  });

  it('should return safe=false for invalid weight', () => {
    const result = PediatricProteinRequirement.calculate({
      ageInMonths: 12, weightKg: 0,
      isCriticallyIll: false, hasRenalImpairment: false,
      hasLiverImpairment: false, onCRRT: false,
    });
    expect(result.isSafe).toBe(false);
    expect(result.proteinGramsPerDay).toBe(0);
  });

  it('should return safe=false for NaN weight', () => {
    const result = PediatricProteinRequirement.calculate({
      ageInMonths: 12, weightKg: NaN,
      isCriticallyIll: false, hasRenalImpairment: false,
      hasLiverImpairment: false, onCRRT: false,
    });
    expect(result.isSafe).toBe(false);
  });

  it('should return safe=false for combined renal and liver impairment', () => {
    const result = PediatricProteinRequirement.calculate({
      ageInMonths: 60, weightKg: 18,
      isCriticallyIll: false, hasRenalImpairment: true,
      hasLiverImpairment: true, onCRRT: false,
    });
    expect(result.isSafe).toBe(false);
    expect(result.guidelineSource).toContain('القصور الكلوي والكبدي');
  });
});
