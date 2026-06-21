import { describe, it, expect } from 'vitest';
import { PsychotropicNutrientInteractions } from '../PsychotropicNutrientInteractions';

describe('PsychotropicNutrientInteractions', () => {
  it('should return none for unknown pair', () => {
    const result = PsychotropicNutrientInteractions.calculate({
      medication: 'unknown', nutrient: 'unknown', dose: 100,
    });
    expect(result.interactionLevel).toBe('none');
    expect(result.isSafe).toBe(true);
  });

  it('should detect lithium-sodium severe interaction', () => {
    const result = PsychotropicNutrientInteractions.calculate({
      medication: 'lithium', nutrient: 'sodium', dose: 900,
    });
    expect(result.interactionLevel).toBe('severe');
    expect(result.restriction).toContain('صوديوم');
    expect(result.alternative).toContain('فالبروات');
  });

  it('should detect mocobamine-tyramine severe interaction', () => {
    const result = PsychotropicNutrientInteractions.calculate({
      medication: 'mocobamine', nutrient: 'tyramine', dose: 600,
    });
    expect(result.interactionLevel).toBe('severe');
    expect(result.restriction).toContain('تجنب');
    expect(result.isSafe).toBe(false);
  });

  it('should detect olanzapine-sugar moderate interaction', () => {
    const result = PsychotropicNutrientInteractions.calculate({
      medication: 'olanzapine', nutrient: 'sugar', dose: 10,
    });
    expect(result.interactionLevel).toBe('moderate');
    expect(result.restriction).toContain('السكر');
    expect(result.isSafe).toBe(true);
  });

  it('should detect fluoxetine-serotonin mild interaction', () => {
    const result = PsychotropicNutrientInteractions.calculate({
      medication: 'fluoxetine', nutrient: 'serotonin', dose: 40,
    });
    expect(result.interactionLevel).toBe('mild');
    expect(result.isSafe).toBe(true);
  });

  it('should detect case-insensitive medication names', () => {
    const result = PsychotropicNutrientInteractions.calculate({
      medication: 'Lithium', nutrient: 'Sodium', dose: 600,
    });
    expect(result.interactionLevel).toBe('severe');
  });

  it('should return safe=false for zero dose', () => {
    const result = PsychotropicNutrientInteractions.calculate({
      medication: 'lithium', nutrient: 'sodium', dose: 0,
    });
    expect(result.isSafe).toBe(false);
    expect(result.errorCode).toBe('INVALID_INPUT');
  });
});
