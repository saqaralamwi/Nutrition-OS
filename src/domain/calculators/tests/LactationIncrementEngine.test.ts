import { describe, it, expect } from 'vitest';
import { LactationIncrementEngine } from '../LactationIncrementEngine';

describe('LactationIncrementEngine', () => {
  it('peak lactation month 3: exclusive → 500 kcal, 25g protein, 1000mL fluid', () => {
    const result = LactationIncrementEngine.calculateLactationIncrements({
      baselineCalories: 2000,
      baselineProteinGrams: 60,
      baselineFluidsMl: 2000,
      monthsPostpartum: 3,
      isExclusivelyBreastfeeding: true,
    });

    expect(result.energyIncrement).toBe(500.00);
    expect(result.proteinIncrement).toBe(25.00);
    expect(result.fluidIncrement).toBe(1000.00);
    expect(result.totalCaloriesTarget).toBe(2500.00);
    expect(result.totalProteinGramsTarget).toBe(85.00);
    expect(result.totalFluidsMlTarget).toBe(3000.00);
    expect(result.isSafe).toBe(true);
    expect(result.arabicClinicalAlerts.some(a => a.includes('الرضاعة الحصرية'))).toBe(true);
  });

  it('late lactation month 9: exclusive → 400 kcal, 19g protein, 800mL fluid', () => {
    const result = LactationIncrementEngine.calculateLactationIncrements({
      baselineCalories: 2000,
      baselineProteinGrams: 60,
      baselineFluidsMl: 2000,
      monthsPostpartum: 9,
      isExclusivelyBreastfeeding: true,
    });

    expect(result.energyIncrement).toBe(400.00);
    expect(result.proteinIncrement).toBe(19.00);
    expect(result.fluidIncrement).toBe(800.00);
    expect(result.totalCaloriesTarget).toBe(2400.00);
    expect(result.totalProteinGramsTarget).toBe(79.00);
    expect(result.totalFluidsMlTarget).toBe(2800.00);
    expect(result.isSafe).toBe(true);
  });

  it('non-exclusive breastfeeding: all increments zero', () => {
    const result = LactationIncrementEngine.calculateLactationIncrements({
      baselineCalories: 1800,
      baselineProteinGrams: 55,
      baselineFluidsMl: 1500,
      monthsPostpartum: 4,
      isExclusivelyBreastfeeding: false,
    });

    expect(result.energyIncrement).toBe(0);
    expect(result.proteinIncrement).toBe(0);
    expect(result.fluidIncrement).toBe(0);
    expect(result.totalCaloriesTarget).toBe(1800.00);
    expect(result.totalProteinGramsTarget).toBe(55.00);
    expect(result.totalFluidsMlTarget).toBe(1500.00);
    expect(result.isSafe).toBe(true);
  });

  it('invalid monthsPostpartum (>12) returns safe fallback', () => {
    const result = LactationIncrementEngine.calculateLactationIncrements({
      baselineCalories: 2000,
      baselineProteinGrams: 60,
      baselineFluidsMl: 2000,
      monthsPostpartum: 15,
      isExclusivelyBreastfeeding: true,
    });

    expect(result.isSafe).toBe(false);
    expect(result.energyIncrement).toBe(0);
    expect(result.totalCaloriesTarget).toBe(0);
    expect(result.totalFluidsMlTarget).toBe(0);
    expect(result.arabicClinicalAlerts).toContain('الرجاء إدخال قيم صحيحة: أشهر ما بعد الولادة (0-12)، السعرات الأساسية، البروتين الأساسي، والسوائل الأساسية');
  });

  it('negative months returns safe fallback', () => {
    const result = LactationIncrementEngine.calculateLactationIncrements({
      baselineCalories: 2000,
      baselineProteinGrams: 60,
      baselineFluidsMl: 2000,
      monthsPostpartum: -1,
      isExclusivelyBreastfeeding: true,
    });

    expect(result.isSafe).toBe(false);
    expect(result.totalFluidsMlTarget).toBe(0);
  });
});
