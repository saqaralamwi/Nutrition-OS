import { TdeeResult } from '../entities/PatientMetrics';
import { ActivityLevel, ACTIVITY_LEVELS } from '../entities/NutritionPlan';

export function calculateTdee(
  bmr: number,
  activityLevel: ActivityLevel = 'sedentary'
): TdeeResult {
  if (bmr <= 0) {
    throw new Error('معدل الأيض الأساسي يجب أن يكون أكبر من صفر');
  }

  const level = ACTIVITY_LEVELS[activityLevel];
  const value = Math.round(bmr * level.multiplier);

  return {
    value,
    activityMultiplier: level.multiplier,
    activityLabel: level.label,
  };
}
