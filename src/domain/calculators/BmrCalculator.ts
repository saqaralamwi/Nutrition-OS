import { BmrResult } from '../entities/PatientMetrics';

export function calculateBmr(
  weightKg: number,
  heightCm: number,
  age: number,
  isMale: boolean
): BmrResult {
  if (weightKg <= 0 || heightCm <= 0 || age <= 0) {
    throw new Error('الوزن والطول والعمر يجب أن يكونوا أكبر من صفر');
  }
  if (age > 150) {
    throw new Error('العمر غير منطقي');
  }

  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const value = isMale ? base + 5 : base - 161;

  return {
    value: Math.round(value * 100) / 100,
    formulaName: 'Mifflin-St Jeor',
    description: isMale
      ? '10W + 6.25H - 5A + 5'
      : '10W + 6.25H - 5A - 161',
  };
}
