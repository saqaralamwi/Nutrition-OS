import { describe, it, expect } from 'vitest';
import { PregnancyIncrementEngine } from '../PregnancyIncrementEngine';

describe('PregnancyIncrementEngine', () => {
  it('trimester 2: normal BMI, 20 weeks, baseline 1800 kcal / 60g protein', () => {
    const result = PregnancyIncrementEngine.calculatePregnancyIncrements({
      baselineCalories: 1800,
      baselineProteinGrams: 60,
      gestationalAgeWeeks: 20,
      prePregnancyBmi: 22.00,
    });

    expect(result.trimester).toBe(2);
    expect(result.energyIncrement).toBe(340.00);
    expect(result.proteinIncrement).toBe(21.00);
    expect(result.totalCaloriesTarget).toBe(2140.00);
    expect(result.totalProteinGramsTarget).toBe(81.00);
    expect(result.recommendedWeightGainMinKg).toBe(11.50);
    expect(result.recommendedWeightGainMaxKg).toBe(16.00);
    expect(result.isSafe).toBe(true);
  });

  it('trimester 3: obese BMI, 32 weeks, baseline 2000 kcal / 65g protein', () => {
    const result = PregnancyIncrementEngine.calculatePregnancyIncrements({
      baselineCalories: 2000,
      baselineProteinGrams: 65,
      gestationalAgeWeeks: 32,
      prePregnancyBmi: 32.00,
    });

    expect(result.trimester).toBe(3);
    expect(result.energyIncrement).toBe(452.00);
    expect(result.proteinIncrement).toBe(28.00);
    expect(result.totalCaloriesTarget).toBe(2452.00);
    expect(result.totalProteinGramsTarget).toBe(93.00);
    expect(result.recommendedWeightGainMinKg).toBe(5.00);
    expect(result.recommendedWeightGainMaxKg).toBe(9.00);
    expect(result.arabicClinicalAlerts.some(a => a.includes('الثلث الأخير'))).toBe(true);
    expect(result.isSafe).toBe(true);
  });

  it('trimester 1: underweight BMI, 8 weeks', () => {
    const result = PregnancyIncrementEngine.calculatePregnancyIncrements({
      baselineCalories: 1700,
      baselineProteinGrams: 55,
      gestationalAgeWeeks: 8,
      prePregnancyBmi: 17.00,
    });

    expect(result.trimester).toBe(1);
    expect(result.energyIncrement).toBe(0);
    expect(result.proteinIncrement).toBe(1.00);
    expect(result.totalCaloriesTarget).toBe(1700.00);
    expect(result.totalProteinGramsTarget).toBe(56.00);
    expect(result.recommendedWeightGainMinKg).toBe(12.50);
    expect(result.recommendedWeightGainMaxKg).toBe(18.00);
    expect(result.isSafe).toBe(true);
  });

  it('invalid gestational age (0) returns safe fallback', () => {
    const result = PregnancyIncrementEngine.calculatePregnancyIncrements({
      baselineCalories: 1800,
      baselineProteinGrams: 60,
      gestationalAgeWeeks: 0,
      prePregnancyBmi: 22.00,
    });

    expect(result.isSafe).toBe(false);
    expect(result.energyIncrement).toBe(0);
    expect(result.totalCaloriesTarget).toBe(0);
    expect(result.arabicClinicalAlerts).toContain('الرجاء إدخال قيم صحيحة لعمر الحمل ومؤشر كتلة الجسم والسعرات الأساسية');
  });

  it('overweight BMI range (27) applies correct weight gain targets', () => {
    const result = PregnancyIncrementEngine.calculatePregnancyIncrements({
      baselineCalories: 1900,
      baselineProteinGrams: 62,
      gestationalAgeWeeks: 25,
      prePregnancyBmi: 27.50,
    });

    expect(result.trimester).toBe(2);
    expect(result.recommendedWeightGainMinKg).toBe(7.00);
    expect(result.recommendedWeightGainMaxKg).toBe(11.50);
    expect(result.isSafe).toBe(true);
  });
});
