import { describe, it, expect } from 'vitest';
import { RenalMineralRestrictionEngine } from '../RenalMineralRestrictionEngine';

describe('RenalMineralRestrictionEngine', () => {
  it('hemodialysis patient 70kg with 500mL urine output', () => {
    const result = RenalMineralRestrictionEngine.calculateRestrictions({
      ckdStage: 'stage_5',
      dialysisStatus: 'hemodialysis',
      weightKg: 70,
      measuredUrineOutputMl: 500,
    });

    expect(result.proteinTargetGramsPerKg).toBe(1.2);
    expect(result.totalProteinGrams).toBe(84.0);
    expect(result.sodiumMaxMg).toBe(2000);
    expect(result.potassiumMaxMg).toBe(2000);
    expect(result.phosphorusMaxMg).toBe(900);
    expect(result.fluidMaxMl).toBe(1500.0);
    expect(result.isFluidRestricted).toBe(true);
    expect(result.isSafe).toBe(true);
  });

  it('pre-dialysis CKD stage 4 patient 60kg', () => {
    const result = RenalMineralRestrictionEngine.calculateRestrictions({
      ckdStage: 'stage_4',
      dialysisStatus: 'none',
      weightKg: 60,
      measuredUrineOutputMl: null,
    });

    expect(result.proteinTargetGramsPerKg).toBe(0.6);
    expect(result.totalProteinGrams).toBe(36.0);
    expect(result.sodiumMaxMg).toBe(2000);
    expect(result.potassiumMaxMg).toBe(2000);
    expect(result.phosphorusMaxMg).toBe(800);
    expect(result.fluidMaxMl).toBe(0);
    expect(result.isFluidRestricted).toBe(false);
    expect(result.isSafe).toBe(true);
  });

  it('weightKg = 0 returns safe fallback', () => {
    const result = RenalMineralRestrictionEngine.calculateRestrictions({
      ckdStage: 'stage_3a',
      dialysisStatus: 'none',
      weightKg: 0,
      measuredUrineOutputMl: null,
    });

    expect(result.isSafe).toBe(false);
    expect(result.totalProteinGrams).toBe(0);
    expect(result.sodiumMaxMg).toBe(0);
    expect(result.fluidMaxMl).toBe(0);
    expect(result.clinicalDirectives).toContain('الرجاء إدخال وزن صحيح للمريض');
  });
});
