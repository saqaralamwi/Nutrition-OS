export function calculateAbw(
  actualWeightKg: number,
  ibwKg: number
): { value: number; formulaName: string; steps: Array<{ label: string; value: string }> } | null {
  if (actualWeightKg <= ibwKg) return null;
  const diff = actualWeightKg - ibwKg;
  const value = ibwKg + 0.25 * diff;
  const rounded = Math.round(value * 100) / 100;
  return {
    value: rounded,
    formulaName: 'ABW',
    steps: [
      { label: 'الوزن المثالي (IBW)', value: `${ibwKg.toFixed(1)} كجم` },
      { label: 'الوزن الفعلي', value: `${actualWeightKg.toFixed(1)} كجم` },
      { label: 'الفرق', value: `${diff.toFixed(1)} كجم` },
      { label: '0.25 × الفرق', value: `${(0.25 * diff).toFixed(2)} كجم` },
      { label: 'الوزن المصحح', value: `${rounded} كجم` },
    ],
  };
}
