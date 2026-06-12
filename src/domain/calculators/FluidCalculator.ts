export type FluidMethod = 'simplified' | 'holliday_segar';

export function calculateFluidRequirement(
  weightKg: number,
  method: FluidMethod = 'simplified'
): { value: number; formulaName: string; steps: Array<{ label: string; value: string }> } {
  if (method === 'holliday_segar') {
    let value: number;
    const steps: Array<{ label: string; value: string }> = [];

    if (weightKg <= 10) {
      value = weightKg * 100;
      steps.push({ label: 'الوزن', value: `${weightKg} كجم` });
      steps.push({ label: '100 مل/كجم', value: `${weightKg} × 100` });
      steps.push({ label: 'الاحتياج', value: `${Math.round(value)} مل` });
    } else if (weightKg <= 20) {
      const first10 = 1000;
      const rest = (weightKg - 10) * 50;
      value = first10 + rest;
      steps.push({ label: 'أول 10 كجم', value: '10 × 100 = 1000 مل' });
      steps.push({ label: `${weightKg - 10} كجم التالية`, value: `${weightKg - 10} × 50 = ${rest} مل` });
      steps.push({ label: 'المجموع', value: `${Math.round(value)} مل` });
    } else {
      const first10 = 1000;
      const second10 = 500;
      const rest = (weightKg - 20) * 20;
      value = first10 + second10 + rest;
      steps.push({ label: 'أول 10 كجم', value: '10 × 100 = 1000 مل' });
      steps.push({ label: 'ثاني 10 كجم', value: '10 × 50 = 500 مل' });
      steps.push({ label: `لباقي (${weightKg - 20} كجم)`, value: `${weightKg - 20} × 20 = ${rest} مل` });
      steps.push({ label: 'المجموع', value: `${Math.round(value)} مل` });
    }
    return { value: Math.round(value), formulaName: 'هوليداي-سيغار', steps };
  }

  const low = Math.round(weightKg * 30);
  const high = Math.round(weightKg * 35);
  const mid = Math.round(weightKg * 33);
  return {
    value: mid,
    formulaName: 'مبسط (30-35 مل/كجم)',
    steps: [
      { label: 'الوزن', value: `${weightKg} كجم` },
      { label: 'المدى (30-35 مل/كجم)', value: `${low} - ${high} مل` },
      { label: 'القيمة المحسوبة (33 مل/كجم)', value: `${mid} مل` },
    ],
  };
}
