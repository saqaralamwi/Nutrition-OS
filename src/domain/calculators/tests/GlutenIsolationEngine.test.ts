import { describe, it, expect } from 'vitest';
import { GlutenIsolationEngine } from '../GlutenIsolationEngine';

describe('GlutenIsolationEngine', () => {
  it('celiac + white bread with wheat flour -> blocked with celiac alert', () => {
    const result = GlutenIsolationEngine.evaluateGlutenSafety({
      diagnosis: 'celiac_disease',
      foodNameAr: 'خبز أبيض',
      foodNameEn: 'White Bread',
      chemicalTags: ['contains_gluten'],
      ingredientsListEn: ['wheat flour'],
    });

    expect(result.isAllowed).toBe(false);
    expect(result.severityLevel).toBe('critical');
    expect(result.crossContaminationRisk).toBe(false);
    expect(result.arabicClinicalAlerts.length).toBeGreaterThan(0);
    expect(result.arabicClinicalAlerts[0]).toContain('داء السيلياك');
  });

  it('wheat allergy + processed_with_wheat tag -> blocked with cross-contamination risk', () => {
    const result = GlutenIsolationEngine.evaluateGlutenSafety({
      diagnosis: 'wheat_allergy',
      foodNameAr: 'صلصة',
      foodNameEn: 'Sauce',
      chemicalTags: ['processed_with_wheat'],
      ingredientsListEn: ['sugar', 'corn syrup'],
    });

    expect(result.isAllowed).toBe(false);
    expect(result.severityLevel).toBe('critical');
    expect(result.crossContaminationRisk).toBe(true);
    expect(result.arabicClinicalAlerts.length).toBeGreaterThan(0);
    expect(result.arabicClinicalAlerts[0]).toContain('حساسية القمح');
  });

  it('celiac + certified gluten-free oats -> allowed (oat bypass)', () => {
    const result = GlutenIsolationEngine.evaluateGlutenSafety({
      diagnosis: 'celiac_disease',
      foodNameAr: 'شوفان',
      foodNameEn: 'Oats',
      chemicalTags: ['certified_gluten_free'],
      ingredientsListEn: ['oats', 'salt'],
    });

    expect(result.isAllowed).toBe(true);
    expect(result.severityLevel).toBe('none');
    expect(result.crossContaminationRisk).toBe(false);
    expect(result.arabicClinicalAlerts).toHaveLength(0);
  });

  it('healthy profile (none) bypasses all filters cleanly', () => {
    const result = GlutenIsolationEngine.evaluateGlutenSafety({
      diagnosis: 'none',
      foodNameAr: 'خبز',
      foodNameEn: 'Bread',
      chemicalTags: ['contains_gluten', 'processed_with_wheat'],
      ingredientsListEn: ['wheat flour', 'barley'],
    });

    expect(result.isAllowed).toBe(true);
    expect(result.severityLevel).toBe('none');
    expect(result.crossContaminationRisk).toBe(false);
    expect(result.arabicClinicalAlerts).toHaveLength(0);
  });

  it('celiac with empty ingredients -> defensive fallback blocks', () => {
    const result = GlutenIsolationEngine.evaluateGlutenSafety({
      diagnosis: 'celiac_disease',
      foodNameAr: 'غير معروف',
      foodNameEn: 'Unknown',
      chemicalTags: [],
      ingredientsListEn: [],
    });

    expect(result.isAllowed).toBe(false);
    expect(result.severityLevel).toBe('critical');
  });
});
