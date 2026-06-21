import { describe, it, expect } from 'vitest';
import { PediatricGrowthEngine } from '../PediatricGrowthEngine';

describe('PediatricGrowthEngine - Core Math', () => {
  it('should calculate LMS Z-scores correctly', () => {
    // Normal case: X = 10, L = 0.5, M = 9, S = 0.1
    // Formula: Z = (((10/9)^0.5 - 1) / (0.5 * 0.1))
    const z = PediatricGrowthEngine.calculateLmsZScore(10, 0.5, 9, 0.1);
    const expected = ((Math.pow(10 / 9, 0.5) - 1) / (0.5 * 0.1));
    expect(z).toBeCloseTo(expected, 2);
  });

  it('should fallback to natural log when L is zero', () => {
    // L = 0 case: X = 12, L = 0, M = 10, S = 0.2
    // Formula: Z = ln(12/10) / 0.2
    const z = PediatricGrowthEngine.calculateLmsZScore(12, 0, 10, 0.2);
    const expected = Math.log(12 / 10) / 0.2;
    expect(z).toBeCloseTo(expected, 2);
  });

  it('should accurately convert Z-score to percentile using erf approximation', () => {
    // Z = 0 -> 50%
    expect(PediatricGrowthEngine.zScoreToPercentile(0)).toBeCloseTo(50.0, 1);
    // Z = 1.64485 -> 95%
    expect(PediatricGrowthEngine.zScoreToPercentile(1.64485)).toBeCloseTo(95.0, 1);
    // Z = -1.95996 -> 2.5%
    expect(PediatricGrowthEngine.zScoreToPercentile(-1.95996)).toBeCloseTo(2.5, 1);
  });

  it('should reverse LMS formula to get value at Z', () => {
    // L = 0.5, M = 9, S = 0.1, Z = 1
    // X = 9 * (1 + 1 * 0.5 * 0.1)^2 = 9 * (1.05)^2 = 9.9225
    const val = PediatricGrowthEngine.calculateValueFromLms(1, 0.5, 9, 0.1);
    expect(val).toBeCloseTo(9.9225, 4);
    
    // L = 0, M = 10, S = 0.2, Z = 1
    // X = 10 * exp(0.2) = 12.214
    const valZero = PediatricGrowthEngine.calculateValueFromLms(1, 0, 10, 0.2);
    expect(valZero).toBeCloseTo(10 * Math.exp(0.2), 4);
  });
});

describe('PediatricGrowthEngine - Clinical Routing and Classifications', () => {
  it('should route infants (0-60 months) to WHO standards', () => {
    const result = PediatricGrowthEngine.calculate(
      12, // 12 months
      'male',
      10, // weight
      75, // height
      46  // head circ
    );

    expect(result.standardUsed).toBe('WHO');
    expect(result.weightForAge).toBeDefined();
    expect(result.heightForAge).toBeDefined();
    expect(result.bmiForAge).toBeDefined();
    expect(result.headCircumferenceForAge).toBeDefined();
    expect(result.weightForLengthOrHeight).toBeDefined();
  });

  it('should route older children (> 60 months) to CDC standards', () => {
    const result = PediatricGrowthEngine.calculate(
      120, // 10 years / 120 months
      'female',
      30,  // weight
      138  // height
    );

    expect(result.standardUsed).toBe('CDC');
    expect(result.weightForAge).toBeDefined();
    expect(result.heightForAge).toBeDefined(); // CDC SFA
    expect(result.bmiForAge).toBeDefined();
    expect(result.headCircumferenceForAge).toBeUndefined();
    expect(result.weightForLengthOrHeight).toBeUndefined();
  });

  it('should trigger CDC 2022 Extended BMI Class II for severe obesity', () => {
    // CDC 2000 BMIFA Boys at 120 months: l = -1.7, m = 16.6, s = 0.098
    // bmi95 (Z = 1.64485) = 19.98
    // We input BMI = 25 (approx 125% of 95th) to trigger Class II Severe Obesity
    // weight = 47.6kg, height = 138cm -> BMI = 47.6 / 1.38^2 = 24.99
    const result = PediatricGrowthEngine.calculate(
      120,
      'male',
      47.6,
      138
    );

    expect(result.standardUsed).toBe('CDC_EXTENDED');
    expect(result.extendedBmiObesityClass).toBe('class_ii');
    expect(result.clinicalFlags).toContain('Severe Obesity Class II');
  });

  it('should trigger CDC 2022 Extended BMI Class III for extreme obesity', () => {
    // BMI = 30 (approx 150% of 95th) to trigger Class III Severe Obesity
    // weight = 57.2kg, height = 138cm -> BMI = 57.2 / 1.38^2 = 30.03
    const result = PediatricGrowthEngine.calculate(
      120,
      'male',
      57.2,
      138
    );

    expect(result.standardUsed).toBe('CDC_EXTENDED');
    expect(result.extendedBmiObesityClass).toBe('class_iii');
    expect(result.clinicalFlags).toContain('Severe Obesity Class III');
  });

  it('should flag clinical stunting, wasting, and severe underweight', () => {
    // 1. Stunting: HFA Z-score < -2
    // 12 months WHO LHFA male: m = 75.37, s = 0.028, l = 1
    // let's pass height = 69cm (z-score = -3.02)
    const resultStunting = PediatricGrowthEngine.calculate(
      12,
      'male',
      undefined,
      69
    );
    expect(resultStunting.clinicalFlags).toContain('Stunting');

    // 2. Severe Underweight: WFA Z-score < -3
    // 12 months WHO WFA male: m = 9.44, s = 0.107, l = -0.1925
    // let's pass weight = 6.0kg
    const resultUnderweight = PediatricGrowthEngine.calculate(
      12,
      'male',
      6.0
    );
    expect(resultUnderweight.clinicalFlags).toContain('Severe Underweight');
  });
});
