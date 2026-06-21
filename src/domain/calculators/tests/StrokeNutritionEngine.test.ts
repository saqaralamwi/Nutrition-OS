import { describe, test, expect } from 'vitest';
import { StrokeNutritionEngine } from '../StrokeNutritionEngine';

describe('StrokeNutritionEngine Calculations', () => {
  test('returns unsafe for invalid age, weight or height', () => {
    const output = StrokeNutritionEngine.calculate({
      age: -5,
      weightKg: 70,
      heightCm: 170,
      gender: 'male',
      strokeType: 'ischemic',
      strokeLocation: 'left_hemisphere',
      severity: 'moderate',
      hoursSinceStroke: 12,
      gcs: 14,
      nse: 8,
      hasDysphagia: false,
      dysphagiaSeverity: 'none',
      waterSwallowTestResult: 'pass',
      coughReflex: 'normal',
    });

    expect(output.isSafe).toBe(false);
    expect(output.errorCode).toBe('INVALID_VITALS');
  });

  test('returns unsafe for invalid GCS', () => {
    const output = StrokeNutritionEngine.calculate({
      age: 45,
      weightKg: 70,
      heightCm: 170,
      gender: 'male',
      strokeType: 'ischemic',
      strokeLocation: 'left_hemisphere',
      severity: 'moderate',
      hoursSinceStroke: 12,
      gcs: 2, // invalid GCS (< 3)
      nse: 8,
      hasDysphagia: false,
      dysphagiaSeverity: 'none',
      waterSwallowTestResult: 'pass',
      coughReflex: 'normal',
    });

    expect(output.isSafe).toBe(false);
    expect(output.errorCode).toBe('INVALID_GCS');
  });

  test('returns unsafe for invalid NIHSS score', () => {
    const output = StrokeNutritionEngine.calculate({
      age: 45,
      weightKg: 70,
      heightCm: 170,
      gender: 'male',
      strokeType: 'ischemic',
      strokeLocation: 'left_hemisphere',
      severity: 'moderate',
      hoursSinceStroke: 12,
      gcs: 15,
      nse: 60, // invalid NIHSS (> 56)
      hasDysphagia: false,
      dysphagiaSeverity: 'none',
      waterSwallowTestResult: 'pass',
      coughReflex: 'normal',
    });

    expect(output.isSafe).toBe(false);
    expect(output.errorCode).toBe('INVALID_NIHSS');
  });

  test('calculates correct targets for mild stroke without dysphagia', () => {
    const output = StrokeNutritionEngine.calculate({
      age: 40,
      weightKg: 70,
      heightCm: 170,
      gender: 'male',
      strokeType: 'ischemic',
      strokeLocation: 'left_hemisphere',
      severity: 'mild',
      hoursSinceStroke: 6,
      gcs: 15,
      nse: 2,
      hasDysphagia: false,
      dysphagiaSeverity: 'none',
      waterSwallowTestResult: 'pass',
      coughReflex: 'normal',
    });

    expect(output.isSafe).toBe(true);
    expect(output.nutritionPlan.aspirationRisk).toBe('low');
    expect(output.assessment.feedingRoute).toBe('oral');
    expect(output.assessment.foodConsistency).toBe('regular');
    
    // stressFactor (1.05) * activityFactor (1.1) * 25 * 70 = 2021.25 -> rounded to 2021
    expect(output.nutritionPlan.targetCalories).toBe(2021);
    
    // baselineProteinFactor (1.1) * 70 = 77
    expect(output.nutritionPlan.targetProtein).toBe(77);
    
    // 30 mL/kg * 70 = 2100 mL
    expect(output.nutritionPlan.targetFluid).toBe(2100);
  });

  test('calculates correct targets for moderate stroke with dysphagia', () => {
    const output = StrokeNutritionEngine.calculate({
      age: 50,
      weightKg: 65,
      heightCm: 165,
      gender: 'female',
      strokeType: 'hemorrhagic',
      strokeLocation: 'right_hemisphere',
      severity: 'moderate',
      hoursSinceStroke: 24,
      gcs: 13,
      nse: 10,
      hasDysphagia: true,
      dysphagiaSeverity: 'moderate',
      waterSwallowTestResult: 'inconclusive',
      coughReflex: 'diminished',
      oralIntakePercentage: 40,
    });

    expect(output.isSafe).toBe(true);
    expect(output.nutritionPlan.aspirationRisk).toBe('moderate');
    expect(output.assessment.feedingRoute).toBe('mixed');
    expect(output.assessment.foodConsistency).toBe('pureed');
    expect(output.nutritionPlan.thickenLiquids).toBe(true);
    expect(output.nutritionPlan.liquidThickness).toBe('honey');
    expect(output.intervention.swallowTherapyType).toBe('rehabilitative');
    expect(output.intervention.headRotation).toBe(true);
  });

  test('enforces strict safety boundaries and NPO/enteral route for severe stroke with high aspiration risk', () => {
    const output = StrokeNutritionEngine.calculate({
      age: 72, // elderly (>65)
      weightKg: 80,
      heightCm: 175,
      gender: 'male',
      strokeType: 'ischemic',
      strokeLocation: 'brainstem',
      severity: 'severe',
      hoursSinceStroke: 12,
      gcs: 7, // coma (<8)
      nse: 22,
      hasDysphagia: true,
      dysphagiaSeverity: 'severe',
      waterSwallowTestResult: 'fail',
      coughReflex: 'absent',
    });

    expect(output.isSafe).toBe(true);
    expect(output.nutritionPlan.aspirationRisk).toBe('high');
    expect(output.assessment.feedingRoute).toBe('enteral_nasogastric');
    expect(output.assessment.foodConsistency).toBe('npo');
    expect(output.assessment.needsEnteralNutrition).toBe(true);
    
    // Elderly fluid safety cap: 25 mL/kg * 80 = 2000
    expect(output.nutritionPlan.targetFluid).toBe(2000);
    
    // GCS < 8 and High Aspiration Risk alerts should be present
    expect(output.arabicClinicalAlerts.some(a => a.includes('GCS < 8'))).toBe(true);
    expect(output.arabicClinicalAlerts.some(a => a.includes('خطر الاختناق الرئوي'))).toBe(true);
  });
});
