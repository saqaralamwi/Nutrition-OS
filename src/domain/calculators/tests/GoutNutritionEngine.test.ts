import { describe, test, expect } from 'vitest';
import { GoutNutritionEngine } from '../GoutNutritionEngine';

describe('GoutNutritionEngine', () => {
  test('classifyUricAcidStatus returns normal for 5.0 mg/dL', () => {
    expect(GoutNutritionEngine.classifyUricAcidStatus(5.0, 'mg/dL')).toBe('normal');
  });

  test('classifyUricAcidStatus returns very_high for 9.5 mg/dL', () => {
    expect(GoutNutritionEngine.classifyUricAcidStatus(9.5, 'mg/dL')).toBe('very_high');
  });

  test('classifyUricAcidStatus converts µmol/L correctly (595 µmol/L → very_high)', () => {
    const status = GoutNutritionEngine.classifyUricAcidStatus(595, 'µmol/L');
    expect(status).toBe('very_high');
  });

  test('calculateMaxPurineIntake returns correct values for all severities', () => {
    expect(GoutNutritionEngine.calculateMaxPurineIntake('none')).toBe(600);
    expect(GoutNutritionEngine.calculateMaxPurineIntake('mild')).toBe(400);
    expect(GoutNutritionEngine.calculateMaxPurineIntake('moderate')).toBe(200);
    expect(GoutNutritionEngine.calculateMaxPurineIntake('severe')).toBe(150);
    expect(GoutNutritionEngine.calculateMaxPurineIntake('chronic_tophaceous')).toBe(100);
  });

  test('calculateRequirements returns valid positive numbers for all fields', () => {
    const req = GoutNutritionEngine.calculateRequirements({
      patientId: 'p1',
      serumUricAcid: 8.5,
      uricAcidUnit: 'mg/dL',
      uricAcidStatus: 'high',
      urinaryUricAcid: 600,
      severity: 'moderate',
      stage: 'chronic_tophaceous',
      flareFrequency: 3,
      lastFlareDate: '2026-01-15',
      averageFlareDuration: 7,
      hasChronicPain: false,
      affectedJoints: ['knee'],
      hasTophi: false,
      tophiLocation: [],
      age: 55,
      gender: 'male',
      weight: 90,
      height: 175,
      bmi: 29.4,
      hasObesity: false,
      hasMetabolicSyndrome: false,
      hasDiabetes: false,
      hasCKD: false,
      hasHTN: true,
      hasDyslipidemia: true,
      hasSmoking: false,
      hasAlcoholUse: false,
      alcoholType: 'beer',
      alcoholUnitsPerWeek: 0,
      hasDiuretics: false,
      hasAspirin: false,
      hasNiacin: false,
      hasCyclosporine: false,
      hasLevodopa: false,
      dietaryPattern: 'regular',
      avgPurineIntake: 350,
      purineIntakeLevel: 'moderate',
      meatConsumption: 3,
      seafoodConsumption: 1,
      dairyConsumption: 2,
      vegetableConsumption: 3,
      fruitConsumption: 2,
      hasHighPurineFoods: false,
      highPurineFoodsConsumed: [],
      hasAcutePain: false,
      painSeverity: 'mild',
      hasSwelling: false,
      hasRedness: false,
      hasWarmth: false,
      hasLimitedMobility: false,
      hasKidneyStones: false,
      hasJointDamage: false,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    });

    expect(req.maxPurineIntake).toBe(200);
    expect(req.targetCalories).toBeGreaterThan(0);
    expect(req.targetProtein).toBeGreaterThan(0);
    expect(req.targetCarbs).toBeGreaterThan(0);
    expect(req.targetFat).toBeGreaterThan(0);
    expect(req.targetFluid).toBeGreaterThan(0);
    expect(req.targetVitaminC).toBe(500);
  });

  test('calculateExpectedUricAcidReduction with diet + medication', () => {
    const reduction = GoutNutritionEngine.calculateExpectedUricAcidReduction(10, true, true);
    expect(reduction).toBe(5);
  });

  test('calculateCalories for obese patient shows deficit', () => {
    const normalCal = GoutNutritionEngine.calculateCalories(90, 55, 'male', false);
    const obeseCal = GoutNutritionEngine.calculateCalories(90, 55, 'male', true);
    expect(obeseCal).toBe(normalCal - 500);
  });
});
