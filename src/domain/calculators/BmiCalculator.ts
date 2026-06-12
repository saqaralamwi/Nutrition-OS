import { BmiResult, BmiCategory, BMI_CATEGORIES } from '../entities/PatientMetrics';

function classifyBmi(bmi: number): BmiCategory {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

export function calculateBmi(weightKg: number, heightCm: number): BmiResult {
  if (weightKg <= 0 || heightCm <= 0) {
    throw new Error('الوزن والطول يجب أن يكونا أكبر من صفر');
  }
  if (weightKg > 500) {
    throw new Error('الوزن غير منطقي (أكبر من 500 كجم)');
  }
  if (heightCm > 250) {
    throw new Error('الطول غير منطقي (أكبر من 250 سم)');
  }

  const heightM = heightCm / 100;
  const bmi = Math.round((weightKg / (heightM * heightM)) * 100) / 100;
  const category = classifyBmi(bmi);
  const info = BMI_CATEGORIES[category];

  return {
    value: bmi,
    category,
    categoryLabel: info.label,
    clinicalNote: info.note,
  };
}
