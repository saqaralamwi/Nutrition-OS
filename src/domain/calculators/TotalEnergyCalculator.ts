export function calculateTotalEnergy(
  bmr: number,
  activityLevel: string,
  stressFactor: number = 1.0
): { value: number; formulaName: string; steps: Array<{ label: string; value: string }> } {
  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
  };

  const activityMult = multipliers[activityLevel] || 1.2;
  const tdee = Math.round(bmr * activityMult);
  const total = Math.round(tdee * stressFactor);

  return {
    value: total,
    formulaName: 'TDEE + عامل الإجهاد',
    steps: [
      { label: 'BMR', value: `${bmr} سعرة` },
      { label: `عامل النشاط (${activityMult})`, value: `${bmr} × ${activityMult} = ${tdee}` },
      { label: `عامل الإجهاد (${stressFactor})`, value: `${tdee} × ${stressFactor} = ${total}` },
      { label: 'الطاقة الكلية', value: `${total} سعرة/يوم` },
    ],
  };
}
