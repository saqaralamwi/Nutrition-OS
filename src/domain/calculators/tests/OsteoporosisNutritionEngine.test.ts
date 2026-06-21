import { describe, test, expect } from 'vitest';
import { OsteoporosisNutritionEngine } from '../OsteoporosisNutritionEngine';
import type { OsteoporosisAssessment } from '../../types/osteoporosis';

describe('OsteoporosisNutritionEngine', () => {
  test('classifyBoneDensity returns normal for T-score >= -1.0', () => {
    expect(OsteoporosisNutritionEngine.classifyBoneDensity(0)).toBe('normal');
    expect(OsteoporosisNutritionEngine.classifyBoneDensity(-0.5)).toBe('normal');
  });

  test('classifyBoneDensity returns osteoporosis for T-score -2.5', () => {
    expect(OsteoporosisNutritionEngine.classifyBoneDensity(-2.5)).toBe('osteoporosis');
  });

  test('classifyBoneDensity returns severe_osteoporosis for T-score < -2.5', () => {
    expect(OsteoporosisNutritionEngine.classifyBoneDensity(-3.0)).toBe('severe_osteoporosis');
  });

  test('calculateCalciumRequirement returns 1200 for postmenopausal woman', () => {
    expect(OsteoporosisNutritionEngine.calculateCalciumRequirement(55, 'female', 'adequate')).toBe(1200);
  });

  test('calculateCalciumRequirement returns 1400 for deficient postmenopausal woman', () => {
    expect(OsteoporosisNutritionEngine.calculateCalciumRequirement(55, 'female', 'deficient')).toBe(1400);
  });

  test('calculateFractureRisk returns very_high for high-risk patient', () => {
    const assessment: OsteoporosisAssessment = {
      patientId: 'test',
      femoralNeckTScore: -3.5,
      lumbarSpineTScore: -4.0,
      overallTScore: -3.8,
      femoralNeckZScore: -2.0,
      lumbarZScore: -2.5,
      overallZScore: -2.3,
      boneDensityUnit: 'g/cm²',
      classification: 'severe_osteoporosis',
      fractureRisk: 'very_high',
      serumCalcium: 9.2,
      calciumIntake: 600,
      calciumStatus: 'deficient',
      vitaminD25OH: 12,
      vitaminDStatus: 'deficient',
      serumPhosphorus: 3.5,
      serumMagnesium: 2.0,
      serumPTH: 65,
      urinaryCalcium: 120,
      p1NP: 45,
      dPyrid: 6,
      age: 78,
      gender: 'female',
      weight: 55,
      height: 160,
      bmi: 21.5,
      hasFamilyHistory: true,
      hasEarlyMenopause: true,
      isPostmenopausal: true,
      yearsPostMenopause: 28,
      hasSmoking: true,
      smokingCigarettesPerDay: 15,
      hasAlcoholUse: true,
      alcoholUnitsPerWeek: 4,
      hasLowPhysicalActivity: true,
      hasFallHistory: true,
      hasHipFracture: true,
      hasVertebralFracture: false,
      hasOtherFracture: false,
      hasGlucocorticoids: true,
      glucocorticoidDose: 10,
      glucocorticoidDuration: 24,
      hasThyroidMedication: false,
      hasAnticoagulants: false,
      hasAromataseInhibitors: false,
      hasProtonInhibitors: false,
      hasHyperthyroidism: false,
      hasHyperparathyroidism: false,
      hasCKD: false,
      hasGIDisease: false,
      hasRheumatoidArthritis: false,
      hasDiabetes: false,
      dietaryPattern: 'regular',
      dairyConsumption: 1,
      isVegetarian: false,
      isVegan: false,
      hasBackPain: true,
      hasLostHeight: true,
      heightLost: 3,
      hasKyphosis: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    expect(OsteoporosisNutritionEngine.calculateFractureRisk(assessment)).toBe('very_high');
  });

  test('calculateFractureRisk returns low for low-risk patient', () => {
    const assessment: OsteoporosisAssessment = {
      patientId: 'test',
      femoralNeckTScore: -0.5,
      lumbarSpineTScore: -0.3,
      overallTScore: -0.4,
      femoralNeckZScore: 0.0,
      lumbarZScore: 0.2,
      overallZScore: 0.1,
      boneDensityUnit: 'g/cm²',
      classification: 'normal',
      fractureRisk: 'low',
      serumCalcium: 9.5,
      calciumIntake: 1200,
      calciumStatus: 'adequate',
      vitaminD25OH: 35,
      vitaminDStatus: 'normal',
      serumPhosphorus: 4.0,
      serumMagnesium: 2.1,
      serumPTH: 40,
      urinaryCalcium: 100,
      p1NP: 30,
      dPyrid: 4,
      age: 45,
      gender: 'female',
      weight: 65,
      height: 165,
      bmi: 23.9,
      hasFamilyHistory: false,
      hasEarlyMenopause: false,
      isPostmenopausal: false,
      yearsPostMenopause: 0,
      hasSmoking: false,
      smokingCigarettesPerDay: 0,
      hasAlcoholUse: false,
      alcoholUnitsPerWeek: 0,
      hasLowPhysicalActivity: false,
      hasFallHistory: false,
      hasHipFracture: false,
      hasVertebralFracture: false,
      hasOtherFracture: false,
      hasGlucocorticoids: false,
      glucocorticoidDose: 0,
      glucocorticoidDuration: 0,
      hasThyroidMedication: false,
      hasAnticoagulants: false,
      hasAromataseInhibitors: false,
      hasProtonInhibitors: false,
      hasHyperthyroidism: false,
      hasHyperparathyroidism: false,
      hasCKD: false,
      hasGIDisease: false,
      hasRheumatoidArthritis: false,
      hasDiabetes: false,
      dietaryPattern: 'regular',
      dairyConsumption: 2,
      isVegetarian: false,
      isVegan: false,
      hasBackPain: false,
      hasLostHeight: false,
      heightLost: 0,
      hasKyphosis: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    expect(OsteoporosisNutritionEngine.calculateFractureRisk(assessment)).toBe('low');
  });

  test('calculateRequirements returns correct values for female patient', () => {
    const assessment: OsteoporosisAssessment = {
      patientId: 'test',
      femoralNeckTScore: -2.0,
      lumbarSpineTScore: -2.2,
      overallTScore: -2.1,
      femoralNeckZScore: -1.0,
      lumbarZScore: -1.2,
      overallZScore: -1.1,
      boneDensityUnit: 'g/cm²',
      classification: 'osteoporosis',
      fractureRisk: 'moderate',
      serumCalcium: 9.0,
      calciumIntake: 800,
      calciumStatus: 'insufficient',
      vitaminD25OH: 20,
      vitaminDStatus: 'insufficient',
      serumPhosphorus: 3.8,
      serumMagnesium: 2.0,
      serumPTH: 55,
      urinaryCalcium: 110,
      p1NP: 40,
      dPyrid: 5,
      age: 68,
      gender: 'female',
      weight: 60,
      height: 162,
      bmi: 22.9,
      hasFamilyHistory: true,
      hasEarlyMenopause: true,
      isPostmenopausal: true,
      yearsPostMenopause: 18,
      hasSmoking: false,
      smokingCigarettesPerDay: 0,
      hasAlcoholUse: false,
      alcoholUnitsPerWeek: 0,
      hasLowPhysicalActivity: true,
      hasFallHistory: false,
      hasHipFracture: false,
      hasVertebralFracture: false,
      hasOtherFracture: false,
      hasGlucocorticoids: false,
      glucocorticoidDose: 0,
      glucocorticoidDuration: 0,
      hasThyroidMedication: false,
      hasAnticoagulants: false,
      hasAromataseInhibitors: false,
      hasProtonInhibitors: false,
      hasHyperthyroidism: false,
      hasHyperparathyroidism: false,
      hasCKD: false,
      hasGIDisease: false,
      hasRheumatoidArthritis: false,
      hasDiabetes: false,
      dietaryPattern: 'regular',
      dairyConsumption: 1,
      isVegetarian: false,
      isVegan: false,
      hasBackPain: false,
      hasLostHeight: false,
      heightLost: 0,
      hasKyphosis: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    const reqs = OsteoporosisNutritionEngine.calculateRequirements(assessment, 68, 'female');

    expect(reqs.targetCalcium).toBe(1200);
    expect(reqs.targetVitaminD).toBe(1000);
    expect(reqs.targetProtein).toBe(60);
    expect(reqs.targetVitaminK).toBe(90);
    expect(reqs.targetMagnesium).toBe(320);
    expect(reqs.targetZinc).toBe(8);
    expect(reqs.targetPhosphorus).toBe(700);
    expect(reqs.targetPotassium).toBe(4700);

    expect(reqs.targetCalcium).toBeGreaterThan(0);
    expect(reqs.targetVitaminD).toBeGreaterThan(0);
    expect(reqs.targetProtein).toBeGreaterThan(0);
    expect(reqs.targetVitaminK).toBeGreaterThan(0);
    expect(reqs.targetMagnesium).toBeGreaterThan(0);
    expect(reqs.targetZinc).toBeGreaterThan(0);
    expect(reqs.targetPhosphorus).toBeGreaterThan(0);
    expect(reqs.targetPotassium).toBeGreaterThan(0);
  });
});
