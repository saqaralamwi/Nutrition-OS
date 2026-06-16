import { describe, test, expect } from 'vitest';
import { MalnutritionClassifier } from '../MalnutritionClassifier';

describe('MalnutritionClassifier', () => {
  test('classifies as SAM when bilateralPittingEdema is true despite normal Z-score', () => {
    const result = MalnutritionClassifier.classifyAcuteMalnutrition({
      ageMonths: 18,
      wfhZScore: -0.5,
      muacCm: 14,
      bilateralPittingEdema: true,
    });

    expect(result.status).toBe('SAM');
    expect(result.riskTier).toBe('critical');
    expect(result.recommendedRoute).toBe('stabilization_or_ot_program');
    expect(result.diagnosticReasons).toHaveLength(1);
    expect(result.diagnosticReasons[0]).toContain('وذمة غذائية ثنائية الجانب');
  });

  test('classifies as SAM when muacCm is 11.0 at age 8 months', () => {
    const result = MalnutritionClassifier.classifyAcuteMalnutrition({
      ageMonths: 8,
      wfhZScore: -1.0,
      muacCm: 11.0,
      bilateralPittingEdema: false,
    });

    expect(result.status).toBe('SAM');
    expect(result.riskTier).toBe('critical');
    expect(result.recommendedRoute).toBe('stabilization_or_ot_program');
    expect(result.diagnosticReasons).toHaveLength(1);
    expect(result.diagnosticReasons[0]).toContain('MUAC');
  });

  test('classifies as MAM when wfhZScore is -2.5 without edema', () => {
    const result = MalnutritionClassifier.classifyAcuteMalnutrition({
      ageMonths: 24,
      wfhZScore: -2.5,
      muacCm: 13,
      bilateralPittingEdema: false,
    });

    expect(result.status).toBe('MAM');
    expect(result.riskTier).toBe('moderate');
    expect(result.recommendedRoute).toBe('supplementary_feeding_program');
    expect(result.diagnosticReasons).toHaveLength(1);
    expect(result.diagnosticReasons[0]).toContain('سوء تغذية معتدل');
  });
});
