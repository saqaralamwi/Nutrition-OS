import { describe, it, expect } from 'vitest';
import { PediatricFluidRequirement } from '../PediatricFluidRequirement';

describe('PediatricFluidRequirement', () => {
  it('should calculate Holliday-Segar for 5 kg infant', () => {
    const result = PediatricFluidRequirement.calculate({
      weightKg: 5,
      ageInMonths: 4,
      hasDehydration: false,
      isOnIVFluids: true,
    });
    expect(result.dailyFluidMl).toBe(500);
    expect(result.isSafe).toBe(true);
  });

  it('should calculate Holliday-Segar for 15 kg child', () => {
    const result = PediatricFluidRequirement.calculate({
      weightKg: 15,
      ageInMonths: 48,
      hasDehydration: false,
      isOnIVFluids: true,
    });
    expect(result.dailyFluidMl).toBe(1250);
    expect(result.isSafe).toBe(true);
  });

  it('should calculate Holliday-Segar for 25 kg child', () => {
    const result = PediatricFluidRequirement.calculate({
      weightKg: 25,
      ageInMonths: 96,
      hasDehydration: false,
      isOnIVFluids: true,
    });
    expect(result.dailyFluidMl).toBe(1600);
    expect(result.isSafe).toBe(true);
  });

  it('should increase fluid for dehydration', () => {
    const normal = PediatricFluidRequirement.calculate({
      weightKg: 10, ageInMonths: 12,
      hasDehydration: false, isOnIVFluids: false,
    });
    const dehydrated = PediatricFluidRequirement.calculate({
      weightKg: 10, ageInMonths: 12,
      hasDehydration: true, isOnIVFluids: false,
    });
    expect(dehydrated.dailyFluidMl).toBeGreaterThan(normal.dailyFluidMl);
  });

  it('should return safe=false for invalid weight', () => {
    const result = PediatricFluidRequirement.calculate({
      weightKg: -5, ageInMonths: 12,
      hasDehydration: false, isOnIVFluids: false,
    });
    expect(result.isSafe).toBe(false);
    expect(result.dailyFluidMl).toBe(0);
  });

  it('should return safe=false for NaN weight', () => {
    const result = PediatricFluidRequirement.calculate({
      weightKg: NaN, ageInMonths: 12,
      hasDehydration: false, isOnIVFluids: false,
    });
    expect(result.isSafe).toBe(false);
  });

  it('should return safe=false for NaN age', () => {
    const result = PediatricFluidRequirement.calculate({
      weightKg: 10, ageInMonths: NaN,
      hasDehydration: false, isOnIVFluids: false,
    });
    expect(result.isSafe).toBe(false);
  });
});
