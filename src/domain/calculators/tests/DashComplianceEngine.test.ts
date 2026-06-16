import { describe, it, expect } from 'vitest';
import { DashComplianceEngine } from '../DashComplianceEngine';

describe('DashComplianceEngine', () => {
  it('high-risk profile: stage_2_hypertension + dyslipidemia', () => {
    const result = DashComplianceEngine.evaluateCardiovascularDiet({
      systolicBloodPressure: 145,
      diastolicBloodPressure: 92,
      totalCholesterol: 220,
      ldlCholesterol: 130,
      triglycerides: 180,
      targetCalories: 2000,
    });

    expect(result.bpStage).toBe('stage_2_hypertension');
    expect(result.maxSodiumMg).toBe(1500);
    expect(result.isDyslipidemiaTriggered).toBe(true);
    expect(result.maxSaturatedFatGrams).toBeCloseTo(15.56, 1);
    expect(result.maxDietaryCholesterolMg).toBe(200);
    expect(result.isSafe).toBe(true);
    expect(result.arabicDirectives.length).toBeGreaterThan(0);
  });

  it('optimal profile: normal bp, no dyslipidemia', () => {
    const result = DashComplianceEngine.evaluateCardiovascularDiet({
      systolicBloodPressure: 115,
      diastolicBloodPressure: 75,
      totalCholesterol: 170,
      ldlCholesterol: 80,
      triglycerides: 130,
      targetCalories: 1800,
    });

    expect(result.bpStage).toBe('normal');
    expect(result.maxSodiumMg).toBe(2300);
    expect(result.isDyslipidemiaTriggered).toBe(false);
    expect(result.maxSaturatedFatGrams).toBeCloseTo(20.00, 1);
    expect(result.maxDietaryCholesterolMg).toBe(300);
    expect(result.isSafe).toBe(true);
  });

  it('zero calories returns safe fallback', () => {
    const result = DashComplianceEngine.evaluateCardiovascularDiet({
      systolicBloodPressure: 120,
      diastolicBloodPressure: 80,
      totalCholesterol: 180,
      ldlCholesterol: 90,
      triglycerides: 140,
      targetCalories: 0,
    });

    expect(result.isSafe).toBe(false);
    expect(result.maxSodiumMg).toBe(0);
    expect(result.maxSaturatedFatGrams).toBe(0);
    expect(result.maxDietaryCholesterolMg).toBe(0);
    expect(result.arabicDirectives).toContain('الرجاء إدخال قيم صحيحة للضغط والسعرات الحرارية');
  });

  it('stage_1_hypertension from diastolic alone (SBP=125, DBP=85)', () => {
    const result = DashComplianceEngine.evaluateCardiovascularDiet({
      systolicBloodPressure: 125,
      diastolicBloodPressure: 85,
      totalCholesterol: 190,
      ldlCholesterol: 95,
      triglycerides: 140,
      targetCalories: 2000,
    });

    expect(result.bpStage).toBe('stage_1_hypertension');
    expect(result.maxSodiumMg).toBe(1500);
    expect(result.isSafe).toBe(true);
  });

  it('elevated bp (SBP=125, DBP<80) applies 2000mg sodium', () => {
    const result = DashComplianceEngine.evaluateCardiovascularDiet({
      systolicBloodPressure: 125,
      diastolicBloodPressure: 75,
      totalCholesterol: 170,
      ldlCholesterol: 90,
      triglycerides: 120,
      targetCalories: 2000,
    });

    expect(result.bpStage).toBe('elevated');
    expect(result.maxSodiumMg).toBe(2000);
    expect(result.isSafe).toBe(true);
  });
});
