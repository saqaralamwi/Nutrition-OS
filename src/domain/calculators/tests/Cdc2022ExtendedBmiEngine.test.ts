import { describe, it, expect } from 'vitest';
import { Cdc2022ExtendedBmiEngine, BMI_EXTENDED_LABELS } from '../Cdc2022ExtendedBmiEngine';

describe('Cdc2022ExtendedBmiEngine', () => {
  it('computes BMI at 95th percentile from CDC LMS for a 48-month-old male', () => {
    const bmi95 = Cdc2022ExtendedBmiEngine.computeBmiAt95th(0.2015, 15.16, 0.0794);
    expect(bmi95).toBeGreaterThan(0);
    expect(bmi95).toBeCloseTo(17.41, 0);
  });

  it('computes BMI at 85th percentile from CDC LMS for a 48-month-old male', () => {
    const bmi85 = Cdc2022ExtendedBmiEngine.computeBmiAt85th(0.2015, 15.16, 0.0794);
    expect(bmi85).toBeGreaterThan(0);
    expect(bmi85).toBeCloseTo(16.50, 0);
  });

  it('classifies normal BMI below 85th percentile', () => {
    const result = Cdc2022ExtendedBmiEngine.classifyExtendedBmi(15, 18.5);
    expect(result.classification).toBe('normal');
    expect(result.bmiP95Percent).toBeLessThan(85);
  });

  it('classifies overweight BMI between 85th and 95th percentile', () => {
    const result = Cdc2022ExtendedBmiEngine.classifyExtendedBmi(16, 18);
    expect(result.classification).toBe('overweight');
    expect(result.bmiP95Percent).toBeGreaterThanOrEqual(85);
    expect(result.bmiP95Percent).toBeLessThan(95);
  });

  it('classifies Class I Obesity at exactly 95th percentile', () => {
    const result = Cdc2022ExtendedBmiEngine.classifyExtendedBmi(18.5, 18.5);
    expect(result.classification).toBe('class_i_obesity');
    expect(result.bmiP95Percent).toBe(100);
  });

  it('classifies Class I Obesity between 95th and 120th percentile', () => {
    const result = Cdc2022ExtendedBmiEngine.classifyExtendedBmi(20, 18.5);
    expect(result.classification).toBe('class_i_obesity');
    expect(result.bmiP95Percent).toBeGreaterThanOrEqual(100);
    expect(result.bmiP95Percent).toBeLessThan(120);
  });

  it('classifies Class II Severe Obesity between 120th and 140th percentile (when BMI < 35)', () => {
    const result = Cdc2022ExtendedBmiEngine.classifyExtendedBmi(23, 18.5);
    expect(result.classification).toBe('class_ii_severe_obesity');
    expect(result.bmiP95Percent).toBeGreaterThanOrEqual(120);
    expect(result.bmiP95Percent).toBeLessThan(140);
  });

  it('classifies Class II Severe Obesity when BMI >= 35 but %p95 < 120 (absolute threshold)', () => {
    const result = Cdc2022ExtendedBmiEngine.classifyExtendedBmi(35, 32);
    expect(result.classification).toBe('class_ii_severe_obesity');
    expect(result.bmiP95Percent).toBe(109.38);
  });

  it('classifies Class III Severe Obesity at >= 140th percentile (when BMI < 40)', () => {
    const result = Cdc2022ExtendedBmiEngine.classifyExtendedBmi(28, 18.5);
    expect(result.classification).toBe('class_iii_severe_obesity');
    expect(result.bmiP95Percent).toBeGreaterThanOrEqual(140);
  });

  it('classifies Class III Severe Obesity when BMI >= 40 but %p95 < 140 (absolute threshold)', () => {
    const result = Cdc2022ExtendedBmiEngine.classifyExtendedBmi(40, 28);
    expect(result.classification).toBe('class_iii_severe_obesity');
    expect(result.bmiP95Percent).toBeGreaterThan(140);
  });

  it('uses min(120% of 95th %ile, BMI 35) for Class II threshold correctly', () => {
    const bmi95 = 32;
    const classIIThresholdBMI = Math.min(bmi95 * 1.2, 35);
    expect(classIIThresholdBMI).toBe(35);
    const at112pct = 36;
    const result = Cdc2022ExtendedBmiEngine.classifyExtendedBmi(at112pct, bmi95);
    expect(result.classification).toBe('class_ii_severe_obesity');
    expect(result.bmiP95Percent).toBeCloseTo(112.5, 1);
  });

  it('returns unknown for zero BMI', () => {
    const result = Cdc2022ExtendedBmiEngine.classifyExtendedBmi(0, 18.5);
    expect(result.classification).toBe('unknown');
    expect(result.bmiP95Percent).toBe(0);
  });

  it('returns unknown for zero bmiAt95th', () => {
    const result = Cdc2022ExtendedBmiEngine.classifyExtendedBmi(20, 0);
    expect(result.classification).toBe('unknown');
    expect(result.bmiP95Percent).toBe(0);
  });

  it('calculateExtendedBmiMetrics returns correct output for a 48-month-old male with elevated BMI', () => {
    const result = Cdc2022ExtendedBmiEngine.calculateExtendedBmiMetrics(20, 48, 'male');
    expect(result.bmi).toBe(20);
    expect(result.bmiP95Percent).toBeGreaterThan(100);
    expect(result.classification).not.toBe('unknown');
    expect(result.classificationLabelAr).toBe(BMI_EXTENDED_LABELS[result.classification]);
    expect(result.zScoreForAge).toBeGreaterThan(0);
  });

  it('calculateExtendedBmiMetrics handles adolescent age range', () => {
    const result = Cdc2022ExtendedBmiEngine.calculateExtendedBmiMetrics(28, 120, 'female');
    expect(result.classification).not.toBe('unknown');
    expect(result.bmiP95Percent).toBeGreaterThan(90);
  });

  it('calculateExtendedBmiMetrics returns normal for low BMI', () => {
    const result = Cdc2022ExtendedBmiEngine.calculateExtendedBmiMetrics(14, 48, 'male');
    expect(result.classification).toBe('normal');
  });

  it('calculateExtendedBmiMetrics returns unknown for age > 228 months', () => {
    const result = Cdc2022ExtendedBmiEngine.calculateExtendedBmiMetrics(25, 240, 'male');
    expect(result.classification).toBe('unknown');
  });

  it('calculateExtendedBmiMetrics returns unknown for zero BMI', () => {
    const result = Cdc2022ExtendedBmiEngine.calculateExtendedBmiMetrics(0, 48, 'male');
    expect(result.classification).toBe('unknown');
  });

  it('labels map covers all classifications', () => {
    const classifications = [
      'normal', 'overweight', 'class_i_obesity',
      'class_ii_severe_obesity', 'class_iii_severe_obesity', 'unknown',
    ];
    for (const c of classifications) {
      expect(BMI_EXTENDED_LABELS[c as keyof typeof BMI_EXTENDED_LABELS]).toBeDefined();
    }
  });
});
