import { describe, it, expect } from 'vitest';
import { AnorexiaNutritionalRehab } from '../AnorexiaNutritionalRehab';

describe('AnorexiaNutritionalRehab', () => {
  it('should set startCalories 1000 for BMI < 15', () => {
    const result = AnorexiaNutritionalRehab.calculate({
      age: 18, weight: 40, targetWeight: 55,
      bmi: 14, medicalStability: 'stable', riskLevel: 'high',
    });
    expect(result.startCalories).toBe(1000);
    expect(result.supervisionLevel).toBe('inpatient');
    expect(result.isSafe).toBe(true);
  });

  it('should set startCalories 1200 for BMI 15-16', () => {
    const result = AnorexiaNutritionalRehab.calculate({
      age: 20, weight: 45, targetWeight: 55,
      bmi: 15.5, medicalStability: 'stable', riskLevel: 'moderate',
    });
    expect(result.startCalories).toBe(1200);
    expect(result.isSafe).toBe(true);
  });

  it('should set startCalories 1400 for BMI 16-17', () => {
    const result = AnorexiaNutritionalRehab.calculate({
      age: 22, weight: 50, targetWeight: 60,
      bmi: 16.5, medicalStability: 'stable', riskLevel: 'low',
    });
    expect(result.startCalories).toBe(1400);
    expect(result.increasePerDay).toBe(100);
    expect(result.weeklyIncrease).toBe(0.5);
  });

  it('should set startCalories 1600 for BMI >= 17', () => {
    const result = AnorexiaNutritionalRehab.calculate({
      age: 22, weight: 50, targetWeight: 55,
      bmi: 17.5, medicalStability: 'stable', riskLevel: 'low',
    });
    expect(result.startCalories).toBe(1600);
    expect(result.supervisionLevel).toBe('outpatient');
  });

  it('should set inpatient for unstable or BMI < 15', () => {
    const result = AnorexiaNutritionalRehab.calculate({
      age: 19, weight: 38, targetWeight: 55,
      bmi: 13.5, medicalStability: 'unstable', riskLevel: 'high',
    });
    expect(result.supervisionLevel).toBe('inpatient');
  });

  it('should set dayPatient for BMI 15-17', () => {
    const result = AnorexiaNutritionalRehab.calculate({
      age: 21, weight: 48, targetWeight: 58,
      bmi: 16, medicalStability: 'stable', riskLevel: 'moderate',
    });
    expect(result.supervisionLevel).toBe('dayPatient');
  });

  it('should return safe=false for NaN input', () => {
    const result = AnorexiaNutritionalRehab.calculate({
      age: NaN, weight: 50, targetWeight: 55,
      bmi: 18, medicalStability: 'stable', riskLevel: 'low',
    });
    expect(result.isSafe).toBe(false);
    expect(result.errorCode).toBe('INVALID_INPUT');
  });
});
