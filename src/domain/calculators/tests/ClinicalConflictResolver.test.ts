import { describe, it, expect } from 'vitest';
import { ClinicalConflictResolver } from '../ClinicalConflictResolver';

describe('ClinicalConflictResolver', () => {
  it('Burns (priority 95, high fluid/protein) vs CKD (priority 90, override false) -> multidisciplinary sign-off required', () => {
    const result = ClinicalConflictResolver.resolveComorbidConflicts({
      activeConditions: [
        {
          conditionCode: 'SEVERE_BURNS',
          priorityScore: 95,
          suggestedFluidMl: 4500,
          suggestedProteinGrams: 150,
          isOverrideAllowed: true,
        },
        {
          conditionCode: 'CKD_STAGE_5',
          priorityScore: 90,
          suggestedFluidMl: 1200,
          suggestedProteinGrams: 45,
          isOverrideAllowed: false,
        },
      ],
    });

    expect(result.governingConditionCode).toBe('SEVERE_BURNS');
    expect(result.resolvedFluidMl).toBe(4500.00);
    expect(result.resolvedProteinGrams).toBe(150.00);
    expect(result.requiresMultidisciplinarySignOff).toBe(true);
    expect(result.isSafe).toBe(true);
    expect(result.arabicResolutionDirectives.length).toBeGreaterThan(0);
    expect(result.arabicResolutionDirectives[0]).toContain('تعارض سريري حاد');
  });

  it('Hypertension (priority 50) vs Obesity (priority 40) -> stable, no sign-off', () => {
    const result = ClinicalConflictResolver.resolveComorbidConflicts({
      activeConditions: [
        {
          conditionCode: 'OBESITY',
          priorityScore: 40,
          suggestedFluidMl: 2500,
          suggestedProteinGrams: 80,
          isOverrideAllowed: true,
        },
        {
          conditionCode: 'MILD_HYPERTENSION',
          priorityScore: 50,
          suggestedFluidMl: 2000,
          suggestedProteinGrams: 75,
          isOverrideAllowed: true,
        },
      ],
    });

    expect(result.governingConditionCode).toBe('MILD_HYPERTENSION');
    expect(result.resolvedFluidMl).toBe(2000.00);
    expect(result.resolvedProteinGrams).toBe(75.00);
    expect(result.requiresMultidisciplinarySignOff).toBe(false);
    expect(result.isSafe).toBe(true);
    expect(result.arabicResolutionDirectives[0]).toContain('توافق سريري مستقر');
  });

  it('empty conditions -> defensive fallback with isSafe false', () => {
    const result = ClinicalConflictResolver.resolveComorbidConflicts({
      activeConditions: [],
    });

    expect(result.isSafe).toBe(false);
    expect(result.resolvedFluidMl).toBe(0);
    expect(result.resolvedProteinGrams).toBe(0);
    expect(result.governingConditionCode).toBe('');
  });

  it('negative priorityScore -> defensive fallback', () => {
    const result = ClinicalConflictResolver.resolveComorbidConflicts({
      activeConditions: [
        {
          conditionCode: 'INVALID',
          priorityScore: -1,
          suggestedFluidMl: 1000,
          suggestedProteinGrams: 50,
          isOverrideAllowed: true,
        },
      ],
    });

    expect(result.isSafe).toBe(false);
  });
});
