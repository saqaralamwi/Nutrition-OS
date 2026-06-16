import { describe, it, expect } from 'vitest';
import { MilkAllergenEngine } from '../MilkAllergenEngine';

describe('MilkAllergenEngine', () => {
  it('CMPA + lactose-free milk with casein -> blocked absolute protein exclusion', () => {
    const result = MilkAllergenEngine.evaluateMilkSafety({
      allergyType: 'cow_milk_protein_allergy',
      chemicalTags: ['lactose_free'],
      ingredientsListEn: ['milk', 'casein'],
    });

    expect(result.isAllowed).toBe(false);
    expect(result.restrictionTier).toBe('absolute_dairy_protein_exclusion');
    expect(result.isSafe).toBe(false);
    expect(result.arabicClinicalAlerts.length).toBeGreaterThan(0);
    expect(result.arabicClinicalAlerts[0]).toContain('CMPA');
  });

  it('lactose intolerant + standard ice cream -> strict lactose exclusion', () => {
    const result = MilkAllergenEngine.evaluateMilkSafety({
      allergyType: 'lactose_intolerance',
      chemicalTags: [],
      ingredientsListEn: ['lactose', 'milk'],
    });

    expect(result.isAllowed).toBe(false);
    expect(result.restrictionTier).toBe('strict_lactose_exclusion');
    expect(result.isSafe).toBe(false);
    expect(result.arabicClinicalAlerts.length).toBeGreaterThan(0);
    expect(result.arabicClinicalAlerts[0]).toContain('اللاكتوز');
  });

  it('lactose intolerant + lactose_free tag -> lactose free permitted', () => {
    const result = MilkAllergenEngine.evaluateMilkSafety({
      allergyType: 'lactose_intolerance',
      chemicalTags: ['lactose_free'],
      ingredientsListEn: ['lactose'],
    });

    expect(result.isAllowed).toBe(true);
    expect(result.restrictionTier).toBe('lactose_free_permitted');
    expect(result.isSafe).toBe(true);
    expect(result.arabicClinicalAlerts).toHaveLength(0);
  });

  it('CMPA with null ingredients -> defensive fallback blocks', () => {
    const result = MilkAllergenEngine.evaluateMilkSafety({
      allergyType: 'cow_milk_protein_allergy',
      chemicalTags: [],
      ingredientsListEn: null as unknown as string[],
    });

    expect(result.isAllowed).toBe(false);
    expect(result.isSafe).toBe(false);
  });
});
