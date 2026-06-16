import { describe, it, expect } from 'vitest';
import { BariatricProgressiveDietEngine } from '../BariatricProgressiveDietEngine';

describe('BariatricProgressiveDietEngine', () => {
  it('post-op day 5 -> Phase 2, protein = 60g, fluid = 1500 mL', () => {
    const result = BariatricProgressiveDietEngine.calculateBariatricDiet({
      surgeryType: 'gastric_sleeve',
      postOpDayMilestone: 5,
      weightKg: 100,
      hasDumpingSyndromeSymptoms: false,
    });

    expect(result.currentPhaseCode).toBe('stage_2_full_liquids');
    expect(result.targetProteinGrams).toBe(60.00);
    expect(result.minimumFluidMl).toBe(1500);
    expect(result.targetCalories).toBe(0);
    expect(result.requiresAntiDumpingProtocols).toBe(false);
    expect(result.isSafe).toBe(true);
  });

  it('Roux-en-Y, post-op day 20 -> Phase 3 pureed, anti-dumping active', () => {
    const result = BariatricProgressiveDietEngine.calculateBariatricDiet({
      surgeryType: 'roux_en_y_bypass',
      postOpDayMilestone: 20,
      weightKg: 90,
      hasDumpingSyndromeSymptoms: false,
    });

    expect(result.currentPhaseCode).toBe('stage_3_pureed_diet');
    expect(result.targetCalories).toBe(500.00);
    expect(result.targetProteinGrams).toBe(65.00);
    expect(result.requiresAntiDumpingProtocols).toBe(true);
    expect(result.clinicalDirectives.some(d => d.includes('الإفراغ السريع'))).toBe(true);
    expect(result.isSafe).toBe(true);
  });

  it('negative day milestone returns safe fallback', () => {
    const result = BariatricProgressiveDietEngine.calculateBariatricDiet({
      surgeryType: 'gastric_sleeve',
      postOpDayMilestone: -1,
      weightKg: 100,
      hasDumpingSyndromeSymptoms: false,
    });

    expect(result.isSafe).toBe(false);
    expect(result.currentPhaseCode).toBe('none');
    expect(result.targetCalories).toBe(0);
  });
});
