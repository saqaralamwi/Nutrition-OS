import { describe, it, expect } from 'vitest';
import { OncologyCachexiaEngine } from '../OncologyCachexiaEngine';

describe('OncologyCachexiaEngine', () => {
  it('active cachexia: 60kg, 7% loss, head/neck cancer -> 2100 kcal, 90g protein', () => {
    const result = OncologyCachexiaEngine.evaluateOncologyProfile({
      weightKg: 60,
      bmi: 22,
      unintentionalWeightLossPercent: 7,
      cancerSiteType: 'head_neck',
      hasSarcopeniaOrMuscleWasting: false,
      isRefractoryOncologyStatus: false,
    });

    expect(result.cachexiaStage).toBe('cachexia');
    expect(result.recommendedCaloriesDaily).toBe(2100.00);
    expect(result.recommendedProteinGramsDaily).toBe(90.00);
    expect(result.isSafe).toBe(true);
  });

  it('refractory: 50kg -> 1000 kcal restriction', () => {
    const result = OncologyCachexiaEngine.evaluateOncologyProfile({
      weightKg: 50,
      bmi: 18,
      unintentionalWeightLossPercent: 10,
      cancerSiteType: 'git',
      hasSarcopeniaOrMuscleWasting: true,
      isRefractoryOncologyStatus: true,
    });

    expect(result.cachexiaStage).toBe('refractory_cachexia');
    expect(result.recommendedCaloriesDaily).toBe(1000.00);
    expect(result.recommendedProteinGramsDaily).toBe(50.00);
    expect(result.isSafe).toBe(true);
  });

  it('negative weight input returns safe fallback', () => {
    const result = OncologyCachexiaEngine.evaluateOncologyProfile({
      weightKg: -5,
      bmi: 22,
      unintentionalWeightLossPercent: 0,
      cancerSiteType: 'none',
      hasSarcopeniaOrMuscleWasting: false,
      isRefractoryOncologyStatus: false,
    });

    expect(result.isSafe).toBe(false);
    expect(result.recommendedCaloriesDaily).toBe(0);
    expect(result.recommendedProteinGramsDaily).toBe(0);
    expect(result.recommendedCaloriesDaily).toBe(0);
  });
});
