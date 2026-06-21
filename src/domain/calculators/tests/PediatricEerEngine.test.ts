import { describe, it, expect } from 'vitest';
import { PediatricEerEngine } from '../PediatricEerEngine';

describe('PediatricEerEngine', () => {
  it('should calculate EER for infants 0-3 months correctly', () => {
    const result = PediatricEerEngine.calculateEER({
      ageInMonths: 2,
      weightKg: 5,
      heightM: 0.55,
      gender: 'MALE',
      physicalActivityLevel: 1.0
    });
    // (89 * 5 - 100) + 175 = 345 + 175 = 520
    expect(result.eerKcal).toBe(520);
    expect(result.isSafe).toBe(true);
  });

  it('should calculate EER for infants 4-6 months correctly', () => {
    const result = PediatricEerEngine.calculateEER({
      ageInMonths: 5,
      weightKg: 7,
      heightM: 0.65,
      gender: 'FEMALE',
      physicalActivityLevel: 1.0
    });
    // (89 * 7 - 100) + 56 = 523 + 56 = 579
    expect(result.eerKcal).toBe(579);
  });

  it('should calculate EER for infants 7-12 months correctly', () => {
    const result = PediatricEerEngine.calculateEER({
      ageInMonths: 10,
      weightKg: 9,
      heightM: 0.72,
      gender: 'MALE',
      physicalActivityLevel: 1.0
    });
    // (89 * 9 - 100) + 22 = 701 + 22 = 723
    expect(result.eerKcal).toBe(723);
  });

  it('should calculate EER for toddlers 13-35 months correctly', () => {
    const result = PediatricEerEngine.calculateEER({
      ageInMonths: 24,
      weightKg: 12,
      heightM: 0.85,
      gender: 'FEMALE',
      physicalActivityLevel: 1.0
    });
    // (89 * 12 - 100) + 20 = 968 + 20 = 988
    expect(result.eerKcal).toBe(988);
  });

  it('should calculate EER for boys 3-8 years correctly', () => {
    const result = PediatricEerEngine.calculateEER({
      ageInMonths: 60, // 5 years
      weightKg: 18,
      heightM: 1.1,
      gender: 'MALE',
      physicalActivityLevel: 1.13
    });
    // 88.5 - (61.9 * 5) + 1.13 * (26.7 * 18 + 903 * 1.1) + 20 = 1465
    expect(result.eerKcal).toBe(1465);
  });

  it('should calculate EER for boys 9-18 years correctly', () => {
    const result = PediatricEerEngine.calculateEER({
      ageInMonths: 144, // 12 years
      weightKg: 45,
      heightM: 1.55,
      gender: 'MALE',
      physicalActivityLevel: 1.26
    });
    // 88.5 - (61.9 * 12) + 1.26 * (26.7 * 45 + 903 * 1.55) + 25 = 2648
    expect(result.eerKcal).toBe(2648);
  });

  it('should calculate EER for girls 3-8 years correctly', () => {
    const result = PediatricEerEngine.calculateEER({
      ageInMonths: 60, // 5 years
      weightKg: 18,
      heightM: 1.1,
      gender: 'FEMALE',
      physicalActivityLevel: 1.16
    });
    // 135.3 - (30.8 * 5) + 1.16 * (10.0 * 18 + 934 * 1.1) + 20 = 1395
    // 135.3 - 154 + 1.16 * (180 + 1027.4) + 20 = -18.7 + 1.16 * 1207.4 + 20 = -18.7 + 1400.584 + 20 = 1401.884 -> 1402
    expect(result.eerKcal).toBe(1402);
  });

  it('should calculate EER for girls 9-18 years correctly', () => {
    const result = PediatricEerEngine.calculateEER({
      ageInMonths: 120, // 10 years
      weightKg: 30,
      heightM: 1.4,
      gender: 'FEMALE',
      physicalActivityLevel: 1.16
    });
    // 135.3 - (30.8 * 10) + 1.16 * (10.0 * 30 + 934 * 1.4) + 25 = 1717
    expect(result.eerKcal).toBe(1717);
  });

  it('should return INVALID_WEIGHT for NaN weight', () => {
    const result = PediatricEerEngine.calculateEER({
      ageInMonths: 10,
      weightKg: NaN,
      heightM: 0.72,
      gender: 'MALE',
      physicalActivityLevel: 1.0
    });
    expect(result.isSafe).toBe(false);
    expect(result.errorCode).toBe('INVALID_WEIGHT');
  });

  it('should return MISSING_OLDER_CHILD_PARAMETERS for missing height in older child', () => {
    const result = PediatricEerEngine.calculateEER({
      ageInMonths: 60,
      weightKg: 18,
      heightM: NaN,
      gender: 'MALE',
      physicalActivityLevel: 1.13
    });
    expect(result.isSafe).toBe(false);
    expect(result.errorCode).toBe('MISSING_OLDER_CHILD_PARAMETERS');
  });
});
