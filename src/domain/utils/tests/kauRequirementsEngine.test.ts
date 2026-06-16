import { describe, test, expect } from 'vitest';
import {
  calculatePropofolCalories,
  calculateDextroseCalories,
  calculateTotalHiddenCalories,
} from '../kauRequirementsEngine';

describe('Hidden Calories Engine', () => {
  test('calculatePropofolCalories - 30 ml/hr', () => {
    const calories = calculatePropofolCalories(30);
    expect(calories).toBe(792); // 30 × 24 × 1.1 = 792
  });

  test('calculatePropofolCalories - 50 ml/hr', () => {
    const calories = calculatePropofolCalories(50);
    expect(calories).toBe(1320); // 50 × 24 × 1.1 = 1320
  });

  test('calculateDextroseCalories - 100 ml, 5%', () => {
    const calories = calculateDextroseCalories(100, 5);
    expect(calories).toBe(17); // 100 × 0.05 × 3.4 = 17
  });

  test('calculateDextroseCalories - 500 ml, 10%', () => {
    const calories = calculateDextroseCalories(500, 10);
    expect(calories).toBe(170); // 500 × 0.10 × 3.4 = 170
  });

  test('calculateTotalHiddenCalories - Multiple medications', () => {
    const medications = [
      { name: 'Propofol', ml_per_hour: 30, total_ml_per_day: 0, percent: 0 },
      { name: 'Dextrose', ml_per_hour: 0, total_ml_per_day: 100, percent: 5 },
    ];

    const result = calculateTotalHiddenCalories(medications);

    expect(result.total).toBe(809); // 792 + 17 = 809
    expect(result.propofol).toBe(792);
    expect(result.dextrose).toBe(17);
  });
});
