import { describe, it, expect } from 'vitest';
import { OrthopedicBoneHealingEngine } from '../OrthopedicBoneHealingEngine';

describe('OrthopedicBoneHealingEngine', () => {
  it('healthy adult 40y male with fracture: eGFR 95 → high therapeutic targets', () => {
    const result = OrthopedicBoneHealingEngine.calculateBoneMineralTargets({
      hasActiveFracture: true,
      ageYears: 40,
      egfrValue: 95,
      gender: 'male',
    });

    expect(result.targetCalciumMg).toBe(1500.00);
    expect(result.targetPhosphorusMg).toBe(1000.00);
    expect(result.targetVitaminD3Iu).toBe(2000.00);
    expect(result.isRenalConstrained).toBe(false);
    expect(result.isSafe).toBe(true);
  });

  it('elderly 68y female with fracture: eGFR 42 → KDOQI crash ceiling, renal constrained', () => {
    const result = OrthopedicBoneHealingEngine.calculateBoneMineralTargets({
      hasActiveFracture: true,
      ageYears: 68,
      egfrValue: 42,
      gender: 'female',
    });

    expect(result.targetCalciumMg).toBe(800.00);
    expect(result.targetPhosphorusMg).toBe(700.00);
    expect(result.targetVitaminD3Iu).toBe(800.00);
    expect(result.isRenalConstrained).toBe(true);
    expect(result.arabicClinicalAlerts.some(a => a.includes('كابح أمان كلوى'))).toBe(true);
    expect(result.isSafe).toBe(true);
  });

  it('female 55y no fracture: standard DRI with elevated calcium (age > 50)', () => {
    const result = OrthopedicBoneHealingEngine.calculateBoneMineralTargets({
      hasActiveFracture: false,
      ageYears: 55,
      egfrValue: 90,
      gender: 'female',
    });

    expect(result.targetCalciumMg).toBe(1200.00);
    expect(result.targetPhosphorusMg).toBe(700.00);
    expect(result.targetVitaminD3Iu).toBe(600.00);
    expect(result.isRenalConstrained).toBe(false);
    expect(result.isSafe).toBe(true);
  });

  it('male 35y no fracture: standard DRI 1000 Ca, 600 D3', () => {
    const result = OrthopedicBoneHealingEngine.calculateBoneMineralTargets({
      hasActiveFracture: false,
      ageYears: 35,
      egfrValue: 100,
      gender: 'male',
    });

    expect(result.targetCalciumMg).toBe(1000.00);
    expect(result.targetPhosphorusMg).toBe(700.00);
    expect(result.targetVitaminD3Iu).toBe(600.00);
    expect(result.isSafe).toBe(true);
  });

  it('zero age validation: returns safe fallback', () => {
    const result = OrthopedicBoneHealingEngine.calculateBoneMineralTargets({
      hasActiveFracture: true,
      ageYears: 0,
      egfrValue: 80,
      gender: 'male',
    });

    expect(result.isSafe).toBe(false);
    expect(result.targetCalciumMg).toBe(0);
    expect(result.arabicClinicalAlerts).toContain('الرجاء إدخال عمر صحيح وقيمة eGFR موجبة');
  });
});
