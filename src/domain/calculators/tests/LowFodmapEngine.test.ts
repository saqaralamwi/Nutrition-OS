import { describe, it, expect } from 'vitest';
import { LowFodmapEngine } from '../LowFodmapEngine';

describe('LowFodmapEngine', () => {
  it('IBS strict elimination + garlic extract -> high FODMAP detected, strict elimination', () => {
    const result = LowFodmapEngine.evaluateFodmapCompliance({
      diagnosis: 'IBS',
      chemicalTags: ['high_fructan'],
      ingredientsListEn: ['garlic extract', 'rice flour'],
      isReintroductionPhase: false,
    });

    expect(result.isHighFodmapDetected).toBe(true);
    expect(result.limitationLevel).toBe('strict_elimination');
    expect(result.isSafe).toBe(false);
    expect(result.arabicClinicalAlerts.length).toBeGreaterThan(0);
    expect(result.arabicClinicalAlerts[0]).toContain('FODMAPs');
  });

  it('IBD_active reintroduction + honey -> high FODMAP, moderate restriction', () => {
    const result = LowFodmapEngine.evaluateFodmapCompliance({
      diagnosis: 'IBD_active',
      chemicalTags: [],
      ingredientsListEn: ['honey', 'oats'],
      isReintroductionPhase: true,
    });

    expect(result.isHighFodmapDetected).toBe(true);
    expect(result.limitationLevel).toBe('moderate_restriction');
    expect(result.isSafe).toBe(false);
    expect(result.arabicClinicalAlerts.length).toBeGreaterThan(0);
    expect(result.arabicClinicalAlerts[0]).toContain('إعادة الإدخال');
  });

  it('healthy (none) bypasses even high-FODMAP ingredients cleanly', () => {
    const result = LowFodmapEngine.evaluateFodmapCompliance({
      diagnosis: 'none',
      chemicalTags: ['high_fructose', 'contains_lactose'],
      ingredientsListEn: ['onion', 'garlic', 'sorbitol'],
      isReintroductionPhase: false,
    });

    expect(result.isHighFodmapDetected).toBe(false);
    expect(result.limitationLevel).toBe('none');
    expect(result.isSafe).toBe(true);
    expect(result.arabicClinicalAlerts).toHaveLength(0);
  });

  it('IBS with null ingredients -> defensive fallback blocks', () => {
    const result = LowFodmapEngine.evaluateFodmapCompliance({
      diagnosis: 'IBS',
      chemicalTags: [],
      ingredientsListEn: null as unknown as string[],
      isReintroductionPhase: false,
    });

    expect(result.isHighFodmapDetected).toBe(true);
    expect(result.limitationLevel).toBe('strict_elimination');
    expect(result.isSafe).toBe(false);
  });
});
