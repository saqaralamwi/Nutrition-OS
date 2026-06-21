export type BmiCategory =
  | 'نقص حاد في الوزن'
  | 'نقص متوسط في الوزن'
  | 'نقص خفيف في الوزن'
  | 'الوزن الطبيعي (المثالي)'
  | 'زيادة الوزن (مرحلة ما قبل السمنة)'
  | 'سمنة (الدرجة الأولى)'
  | 'سمنة (الدرجة الثانية)'
  | 'سمنة (الدرجة الثالثة - مفرطة)';

export const getBmiCategory = (bmi: number): BmiCategory => {
  if (bmi < 16.0) return 'نقص حاد في الوزن';
  if (bmi < 17.0) return 'نقص متوسط في الوزن';
  if (bmi < 18.5) return 'نقص خفيف في الوزن';
  if (bmi < 25.0) return 'الوزن الطبيعي (المثالي)';
  if (bmi < 30.0) return 'زيادة الوزن (مرحلة ما قبل السمنة)';
  if (bmi < 35.0) return 'سمنة (الدرجة الأولى)';
  if (bmi < 40.0) return 'سمنة (الدرجة الثانية)';
  return 'سمنة (الدرجة الثالثة - مفرطة)';
};

export const getBmiColor = (bmi: number): string => {
  if (bmi >= 18.5 && bmi < 25.0) return '#4ade80';
  if (bmi < 18.5 || bmi >= 30.0) return '#f43f5e';
  return '#fbbf24';
};

export type BmiSeverity = 'severe' | 'moderate' | 'warning' | 'normal';

export const getBmiSeverity = (bmi: number): BmiSeverity => {
  if (bmi >= 18.5 && bmi < 25.0) return 'normal';
  if (bmi >= 25.0 && bmi < 30.0) return 'warning';
  if (bmi >= 30.0 && bmi < 35.0) return 'moderate';
  if (bmi >= 35.0) return 'severe';
  return 'severe';
};
