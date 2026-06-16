import TherapeuticFood from '../../data/models/TherapeuticFood';

export interface IMatchConstraintsInput {
  foods: TherapeuticFood[];
  clinicalTags: string[];
  allergies: string[];
  activeMedications: string[];
}

export interface IFilteredFoodResult {
  foodId: string;
  isAllowed: boolean;
  status: 'allowed' | 'avoid' | 'precaution';
  reasons: string[];
}

export class FoodConstraintMatcher {
  public static matchConstraints(input: IMatchConstraintsInput): IFilteredFoodResult[] {
    const { foods, clinicalTags, allergies } = input;
    const hasRenal = clinicalTags.includes('Renal_PreDialysis');
    const hasHtn = clinicalTags.includes('HTN');
    const hasHeartFailure = clinicalTags.includes('Heart_Failure');

    return foods.map(food => {
      const reasons: string[] = [];

      if (hasRenal) {
        if (food.isHighPotassium) {
          reasons.push('الطعام عالي البوتاسيوم ومتعارض مع الفشل الكلوي');
        }
        if (food.isHighPhosphorus) {
          reasons.push('الطعام عالي الفوسفور ومتعارض مع الفشل الكلوي');
        }
      }

      if (hasHtn || hasHeartFailure) {
        if (food.isHighSodium) {
          reasons.push('الطعام عالي الصوديوم ومتعارض مع أمراض القلب وارتفاع الضغط');
        }
      }

      for (const allergen of food.allergenTags) {
        if (allergies.includes(allergen)) {
          reasons.push(`يحتوي الطعام على مادة مسببة للحساسية: ${allergen}`);
        }
      }

      const isAllowed = reasons.length === 0;

      return {
        foodId: food.id,
        isAllowed,
        status: isAllowed ? 'allowed' : 'avoid',
        reasons,
      };
    });
  }
}
