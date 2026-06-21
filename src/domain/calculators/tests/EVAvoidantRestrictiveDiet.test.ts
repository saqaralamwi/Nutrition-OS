import { describe, it, expect } from 'vitest';
import { EVAvoidantRestrictiveDiet } from '../EVAvoidantRestrictiveDiet';

describe('EVAvoidantRestrictiveDiet', () => {
  it('should calculate for child age 5-10', () => {
    const result = EVAvoidantRestrictiveDiet.calculate({
      age: 7, weight: 25,
      foodRestriction: 'moderate', anxietyLevel: 'moderate',
      nutritionalDeficiency: ['iron'],
    });
    expect(result.targetCalories).toBe(1400);
    expect(result.proteinGrams).toBe(28);
    expect(result.exposureFoods).toBe(2);
    expect(result.isSafe).toBe(true);
  });

  it('should calculate for toddler under 5', () => {
    const result = EVAvoidantRestrictiveDiet.calculate({
      age: 3, weight: 14,
      foodRestriction: 'low', anxietyLevel: 'low',
      nutritionalDeficiency: [],
    });
    expect(result.targetCalories).toBe(1000);
    expect(result.exposureFoods).toBe(3);
  });

  it('should calculate for adolescent 10-15', () => {
    const result = EVAvoidantRestrictiveDiet.calculate({
      age: 13, weight: 45,
      foodRestriction: 'low', anxietyLevel: 'low',
      nutritionalDeficiency: ['vitamin_d'],
    });
    expect(result.targetCalories).toBe(1800);
  });

  it('should calculate for adult 15+', () => {
    const result = EVAvoidantRestrictiveDiet.calculate({
      age: 17, weight: 55,
      foodRestriction: 'moderate', anxietyLevel: 'moderate',
      nutritionalDeficiency: ['iron', 'vitamin_d'],
    });
    expect(result.targetCalories).toBe(2000);
  });

  it('should recommend CBT-AR for high anxiety', () => {
    const result = EVAvoidantRestrictiveDiet.calculate({
      age: 16, weight: 50,
      foodRestriction: 'high', anxietyLevel: 'high',
      nutritionalDeficiency: ['iron', 'vitamin_d'],
    });
    expect(result.therapyType).toContain('CBT-AR');
  });

  it('should recommend desensitization for moderate', () => {
    const result = EVAvoidantRestrictiveDiet.calculate({
      age: 10, weight: 30,
      foodRestriction: 'moderate', anxietyLevel: 'moderate',
      nutritionalDeficiency: ['iron'],
    });
    expect(result.therapyType).toContain('إزالة التحسس');
  });

  it('should return safe=false for NaN input', () => {
    const result = EVAvoidantRestrictiveDiet.calculate({
      age: NaN, weight: 50,
      foodRestriction: 'low', anxietyLevel: 'low',
      nutritionalDeficiency: [],
    });
    expect(result.isSafe).toBe(false);
    expect(result.errorCode).toBe('INVALID_INPUT');
  });
});
