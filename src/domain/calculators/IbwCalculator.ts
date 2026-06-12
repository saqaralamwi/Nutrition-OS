export function calculateIbw(
  heightCm: number,
  isMale: boolean
): { value: number; formulaName: string; steps: Array<{ label: string; value: string }> } {
  const base = isMale ? 50 : 45.5;
  const value = base + 0.91 * (heightCm - 152.4);
  const rounded = Math.round(value * 100) / 100;
  return {
    value: rounded,
    formulaName: isMale ? 'ديفاين (ذكر)' : 'ديفاين (أنثى)',
    steps: [
      { label: 'القاعدة', value: `${base} كجم` },
      { label: 'الطول - 152.4', value: `${(heightCm - 152.4).toFixed(1)} سم` },
      { label: '0.91 × الفرق', value: `${(0.91 * (heightCm - 152.4)).toFixed(2)}` },
      { label: 'الوزن المثالي', value: `${rounded} كجم` },
    ],
  };
}
