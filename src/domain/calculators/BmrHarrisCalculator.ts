export function calculateBmrHarris(
  weightKg: number,
  heightCm: number,
  age: number,
  isMale: boolean
): { value: number; formulaName: string; steps: Array<{ label: string; value: string }> } {
  let value: number;
  let formulaStr: string;

  if (isMale) {
    value = 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * age;
    formulaStr = '88.362 + 13.397W + 4.799H - 5.677A';
  } else {
    value = 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * age;
    formulaStr = '447.593 + 9.247W + 3.098H - 4.33A';
  }

  const rounded = Math.round(value * 100) / 100;
  return {
    value: rounded,
    formulaName: 'Harris-Benedict',
    steps: [
      { label: 'المعادلة', value: formulaStr },
      { label: '13.397 × الوزن' + (isMale ? '' : ' / 9.247 × الوزن'), value: String(isMale ? 13.397 * weightKg : 9.247 * weightKg) },
      { label: '4.799 × الطول' + (isMale ? '' : ' / 3.098 × الطول'), value: String(isMale ? 4.799 * heightCm : 3.098 * heightCm) },
      { label: '5.677 × العمر' + (isMale ? '' : ' / 4.33 × العمر'), value: String(isMale ? 5.677 * age : 4.33 * age) },
      { label: 'الناتج', value: `${rounded} سعرة/يوم` },
    ],
  };
}
