export type RestrictionLevel = 'low' | 'moderate' | 'high';
export type AnxietyLevel = 'low' | 'moderate' | 'high';

export interface EVAvoidantRestrictiveInput {
  age: number;
  weight: number;
  foodRestriction: RestrictionLevel;
  anxietyLevel: AnxietyLevel;
  nutritionalDeficiency: string[];
}

export interface EVAvoidantRestrictiveResult {
  targetCalories: number;
  proteinGrams: number;
  exposureFoods: number;
  therapyType: string;
  isSafe: boolean;
  errorCode?: string;
  message?: string;
}

export class EVAvoidantRestrictiveDiet {
  static calculate(input: EVAvoidantRestrictiveInput): EVAvoidantRestrictiveResult {
    const { age, weight, foodRestriction, anxietyLevel } = input;

    if (isNaN(age) || isNaN(weight) || age <= 0 || weight <= 0) {
      return {
        targetCalories: 0,
        proteinGrams: 0,
        exposureFoods: 0,
        therapyType: '',
        isSafe: false,
        errorCode: 'INVALID_INPUT',
        message: 'العمر والوزن يجب أن يكونا موجبين',
      };
    }

    let targetCalories: number;
    if (age < 5) targetCalories = 1000;
    else if (age < 10) targetCalories = 1400;
    else if (age < 15) targetCalories = 1800;
    else targetCalories = 2000;

    const proteinGrams = Math.round(weight * 1.1);

    const exposureFoods = anxietyLevel === 'low' ? 3
      : anxietyLevel === 'moderate' ? 2
      : 1;

    const therapyType = foodRestriction === 'high' || anxietyLevel === 'high'
      ? 'CBT-AR (العلاج السلوكي المعرفي لاضطراب تجنب الطعام)'
      : 'إزالة التحسس المنتظم + استشارة تغذوية';

    return {
      targetCalories,
      proteinGrams,
      exposureFoods,
      therapyType,
      isSafe: true,
    };
  }
}
