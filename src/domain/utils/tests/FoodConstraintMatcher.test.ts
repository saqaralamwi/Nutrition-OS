import { describe, test, expect } from 'vitest';
import { FoodConstraintMatcher, IMatchConstraintsInput } from '../FoodConstraintMatcher';
import TherapeuticFood from '../../../data/models/TherapeuticFood';

function mockFood(overrides: {
  id: string;
  isHighPotassium?: boolean;
  isHighPhosphorus?: boolean;
  isHighSodium?: boolean;
  allergenTags?: string[];
}): TherapeuticFood {
  return {
    id: overrides.id,
    _raw: {},
    isHighPotassium: overrides.isHighPotassium ?? false,
    isHighPhosphorus: overrides.isHighPhosphorus ?? false,
    isHighSodium: overrides.isHighSodium ?? false,
    allergenTags: overrides.allergenTags ?? [],
  } as unknown as TherapeuticFood;
}

describe('FoodConstraintMatcher', () => {
  test('bans high-potassium food for Renal_PreDialysis patient', () => {
    const input: IMatchConstraintsInput = {
      foods: [
        mockFood({ id: 'food-1', isHighPotassium: true, isHighPhosphorus: false }),
        mockFood({ id: 'food-2', isHighPotassium: false, isHighPhosphorus: false }),
      ],
      clinicalTags: ['Renal_PreDialysis'],
      allergies: [],
      activeMedications: [],
    };

    const results = FoodConstraintMatcher.matchConstraints(input);

    expect(results).toHaveLength(2);

    const banned = results.find(r => r.foodId === 'food-1')!;
    expect(banned.isAllowed).toBe(false);
    expect(banned.status).toBe('avoid');
    expect(banned.reasons).toContain('الطعام عالي البوتاسيوم ومتعارض مع الفشل الكلوي');

    const allowed = results.find(r => r.foodId === 'food-2')!;
    expect(allowed.isAllowed).toBe(true);
    expect(allowed.status).toBe('allowed');
    expect(allowed.reasons).toHaveLength(0);
  });

  test('blocks high-sodium food for HTN patient', () => {
    const input: IMatchConstraintsInput = {
      foods: [
        mockFood({ id: 'food-1', isHighSodium: true }),
        mockFood({ id: 'food-2', isHighSodium: false }),
      ],
      clinicalTags: ['HTN'],
      allergies: [],
      activeMedications: [],
    };

    const results = FoodConstraintMatcher.matchConstraints(input);

    const banned = results.find(r => r.foodId === 'food-1')!;
    expect(banned.isAllowed).toBe(false);
    expect(banned.status).toBe('avoid');
    expect(banned.reasons).toContain('الطعام عالي الصوديوم ومتعارض مع أمراض القلب وارتفاع الضغط');

    const allowed = results.find(r => r.foodId === 'food-2')!;
    expect(allowed.isAllowed).toBe(true);
    expect(allowed.status).toBe('allowed');
  });

  test('excludes food when allergen tags collide with patient allergies', () => {
    const input: IMatchConstraintsInput = {
      foods: [
        mockFood({ id: 'food-1', allergenTags: ['gluten', 'lactose'] }),
        mockFood({ id: 'food-2', allergenTags: ['soy'] }),
      ],
      clinicalTags: [],
      allergies: ['gluten', 'lactose'],
      activeMedications: [],
    };

    const results = FoodConstraintMatcher.matchConstraints(input);

    const banned = results.find(r => r.foodId === 'food-1')!;
    expect(banned.isAllowed).toBe(false);
    expect(banned.status).toBe('avoid');
    expect(banned.reasons).toContain('يحتوي الطعام على مادة مسببة للحساسية: gluten');
    expect(banned.reasons).toContain('يحتوي الطعام على مادة مسببة للحساسية: lactose');

    const allowed = results.find(r => r.foodId === 'food-2')!;
    expect(allowed.isAllowed).toBe(true);
    expect(allowed.status).toBe('allowed');
    expect(allowed.reasons).toHaveLength(0);
  });
});
