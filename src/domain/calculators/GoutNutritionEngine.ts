import type { GoutAssessment, UricAcidStatus } from '../types/gout';
import type { GoutSeverity } from '../types/gout';

export interface GoutNutritionRequirements {
  maxPurineIntake: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  targetFluid: number;
  targetVitaminC: number;
}

export class GoutNutritionEngine {
  static classifyUricAcidStatus(serumUricAcid: number, unit: 'mg/dL' | 'µmol/L'): UricAcidStatus {
    let uricAcid = serumUricAcid;
    if (unit === 'µmol/L') {
      uricAcid = serumUricAcid / 59.48;
    }
    if (uricAcid < 6.0) return 'normal';
    if (uricAcid < 7.0) return 'elevated';
    if (uricAcid < 9.0) return 'high';
    return 'very_high';
  }

  static calculateMaxPurineIntake(severity: GoutSeverity): number {
    const map: Record<GoutSeverity, number> = {
      none: 600,
      mild: 400,
      moderate: 200,
      severe: 150,
      chronic_tophaceous: 100,
    };
    return map[severity];
  }

  static calculateCalories(weight: number, age: number, gender: 'male' | 'female', hasObesity: boolean): number {
    const bmr = 10 * weight + 6.25 * 170 - 5 * age + (gender === 'male' ? 5 : -161);
    let calories = bmr * 1.2;
    if (hasObesity) calories -= 500;
    return Math.round(calories);
  }

  static calculateRequirements(assessment: GoutAssessment): GoutNutritionRequirements {
    const { weight, age, gender, hasObesity, severity } = assessment;
    const targetCalories = GoutNutritionEngine.calculateCalories(weight, age, gender, hasObesity);
    return {
      maxPurineIntake: GoutNutritionEngine.calculateMaxPurineIntake(severity),
      targetCalories,
      targetProtein: Math.round(weight * 0.8),
      targetCarbs: Math.round((targetCalories * 0.55) / 4),
      targetFat: Math.round((targetCalories * 0.25) / 9),
      targetFluid: Math.round(weight * 35),
      targetVitaminC: 500,
    };
  }

  static generateLowPurineFoods(): { allowed: string[]; limited: string[]; avoid: string[] } {
    return {
      allowed: [
        'fruits', 'low-fat dairy', 'eggs', 'nuts', 'whole grains',
        'rice', 'pasta', 'bread', 'coffee', 'tea', 'water', 'cherry', 'citrus fruits',
      ],
      limited: [
        'chicken (moderate)', 'turkey (moderate)', 'pork (moderate)',
        'tuna (moderate)', 'shrimp (moderate)', 'legumes (moderate)',
        'spinach (moderate)', 'asparagus (moderate)', 'mushrooms (moderate)',
      ],
      avoid: [
        'red meat', 'organ meats', 'game meats', 'sardines', 'anchovies',
        'mackerel', 'trout', 'haddock', 'codfish', 'shellfish',
        'yeast extracts', 'gravy', 'meat extracts', 'beer', 'liquor',
      ],
    };
  }

  static calculateExpectedUricAcidReduction(
    currentUricAcid: number,
    adherenceToDiet: boolean,
    onUrateLoweringTherapy: boolean,
  ): number {
    let reduction = 0;
    if (adherenceToDiet) reduction += currentUricAcid * 0.15;
    if (onUrateLoweringTherapy) reduction += currentUricAcid * 0.30;
    return Math.round(reduction);
  }
}
