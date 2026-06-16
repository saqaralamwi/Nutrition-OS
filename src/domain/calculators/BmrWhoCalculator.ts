export function calculateBmrWho(
  weightKg: number,
  age: number,
  isMale: boolean
): { value: number; formulaName: string; steps: Array<{ label: string; value: string }> } {
  let value: number;
  let range: string;
  let coeff: number;
  let constant: number;

  if (isMale) {
    if (age >= 0 && age < 3) {
      coeff = 60.9; constant = -54; range = '0-3 سنوات (ذكر)';
    } else if (age >= 3 && age < 10) {
      coeff = 22.7; constant = 495; range = '3-10 سنوات (ذكر)';
    } else if (age >= 10 && age < 18) {
      coeff = 17.5; constant = 651; range = '10-18 سنة (ذكر)';
    } else if (age >= 18 && age < 30) {
      coeff = 15.3; constant = 679; range = '18-30 سنة (ذكر)';
    } else if (age >= 30 && age < 60) {
      coeff = 11.6; constant = 879; range = '30-60 سنة (ذكر)';
    } else {
      coeff = 13.5; constant = 487; range = 'أكثر من 60 سنة (ذكر)';
    }
  } else {
    if (age >= 0 && age < 3) {
      coeff = 61.0; constant = -51; range = '0-3 سنوات (أنثى)';
    } else if (age >= 3 && age < 10) {
      coeff = 22.5; constant = 499; range = '3-10 سنوات (أنثى)';
    } else if (age >= 10 && age < 18) {
      coeff = 12.2; constant = 746; range = '10-18 سنة (أنثى)';
    } else if (age >= 18 && age < 30) {
      coeff = 14.7; constant = 496; range = '18-30 سنة (أنثى)';
    } else if (age >= 30 && age < 60) {
      coeff = 8.7; constant = 829; range = '30-60 سنة (أنثى)';
    } else {
      coeff = 10.5; constant = 596; range = 'أكثر من 60 سنة (أنثى)';
    }
  }

  value = coeff * weightKg + constant;
  const rounded = Math.round(value * 100) / 100;
  return {
    value: rounded,
    formulaName: 'منظمة الصحة العالمية (WHO)',
    steps: [
      { label: 'الفئة', value: range },
      { label: 'المعادلة', value: `${coeff} × الوزن + ${constant}` },
      { label: `${coeff} × ${weightKg}`, value: String(coeff * weightKg) },
      { label: '+', value: String(constant) },
      { label: 'معدل الأيض الأساسي', value: `${rounded} سعرة/يوم` },
    ],
  };
}
