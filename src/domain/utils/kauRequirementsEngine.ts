export interface VentilatedREEInput {
  weightKg: number;
  heightCm: number;
  age: number;
  isMale: boolean;
  mechanicallyVentilated: boolean;
  trauma: boolean;
  burn: boolean;
  ve?: number; // Minute Ventilation (L/min)
  tmax?: number; // Maximum daily body temperature (°C)
}

// 1.2 Harris-Benedict Baseline Metabolic Rate (RMR) Module
export function calculateHarrisBenedictBMR(weightKg: number, heightCm: number, age: number, isMale: boolean): number {
  if (isMale) {
    return 66.5 + (13.8 * weightKg) + (5 * heightCm) - (6.8 * age);
  } else {
    return 655.1 + (9.6 * weightKg) + (1.7 * heightCm) - (4.7 * age);
  }
}

// 1.3 Mifflin-St Jeor Baseline Module
export function calculateMifflinStJeorBMR(weightKg: number, heightCm: number, age: number, isMale: boolean): number {
  if (isMale) {
    return (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
  } else {
    return (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
  }
}

// Ireton-Jones 1992 Equation
export function calculateIretonJones1992(weightKg: number, age: number, isMale: boolean, trauma: boolean, burn: boolean): number {
  const sexVal = isMale ? 1 : 0;
  const traumaVal = trauma ? 1 : 0;
  const burnVal = burn ? 1 : 0;
  return 1925 - (10 * age) + (5 * weightKg) + (281 * sexVal) + (292 * traumaVal) + (851 * burnVal);
}

// Penn State 2003b Equation
export function calculatePennState2003b(mifflinVal: number, ve: number, tmax: number): number {
  return (mifflinVal * 0.96) + (ve * 31) + (tmax * 167) - 6212;
}

// Penn State 2010 Equation (Modified PSU)
export function calculatePennState2010(mifflinVal: number, ve: number, tmax: number): number {
  return (mifflinVal * 0.71) + (ve * 64) + (tmax * 85) - 3085;
}

// 1.1 Mechanically Ventilated Predictive Energy Flowchart Logic
export function calculateVentilatedREE(input: VentilatedREEInput): { value: number; formulaName: string; steps: { label: string; value: string }[] } {
  const { weightKg, heightCm, age, isMale, mechanicallyVentilated, trauma, burn, ve = 0, tmax = 37.0 } = input;
  const steps: { label: string; value: string }[] = [];

  const mifflinBMR = calculateMifflinStJeorBMR(weightKg, heightCm, age, isMale);
  const bmi = weightKg / Math.pow(heightCm / 100, 2);

  if (!mechanicallyVentilated) {
    steps.push({ label: 'الحالة', value: 'تنفس طبيعي (غير موصول بجهاز تنفس)' });
    steps.push({ label: 'معادلة الأساس', value: 'Mifflin-St Jeor' });
    steps.push({ label: 'معدل الأيض الأساسي المقدر', value: `${mifflinBMR.toFixed(0)} سعرة/يوم` });
    return {
      value: mifflinBMR,
      formulaName: 'Mifflin-St Jeor',
      steps,
    };
  }

  steps.push({ label: 'الحالة', value: 'موصول بجهاز تنفس اصطناعي (Mechanical Ventilation)' });
  steps.push({ label: 'معدل التهوية (VE)', value: `${ve} لتر/دقيقة` });
  steps.push({ label: 'أقصى درجة حرارة (Tmax)', value: `${tmax} °م` });

  if (trauma) {
    steps.push({ label: 'الحالة السريرية', value: 'وجود صدمة/إصابة (Trauma)' });
    if (burn) {
      steps.push({ label: 'الحالة السريرية', value: 'وجود حروق (Burn)' });
      // Ireton-Jones 1992
      const ree = calculateIretonJones1992(weightKg, age, isMale, trauma, burn);
      steps.push({ label: 'معادلة الحساب المطبقة', value: 'Ireton-Jones (1992)' });
      steps.push({ label: 'النتيجة المحسوبة (REE)', value: `${ree.toFixed(0)} سعرة/يوم` });
      return { value: ree, formulaName: 'Ireton-Jones 1992', steps };
    } else {
      steps.push({ label: 'الحالة السريرية', value: 'لا توجد حروق' });
      // PSU 2003b
      const ree = calculatePennState2003b(mifflinBMR, ve, tmax);
      steps.push({ label: 'معادلة الحساب المطبقة', value: 'Penn State (PSU 2003b)' });
      steps.push({ label: 'Mifflin BMR المستخدم', value: `${mifflinBMR.toFixed(0)} سعرة` });
      steps.push({ label: 'النتيجة المحسوبة (RMR)', value: `${ree.toFixed(0)} سعرة/يوم` });
      return { value: ree, formulaName: 'Penn State 2003b', steps };
    }
  } else {
    steps.push({ label: 'الحالة السريرية', value: 'عدم وجود صدمة/إصابة (No Trauma)' });
    steps.push({ label: 'مؤشر كتلة الجسم (BMI)', value: bmi.toFixed(1) });
    steps.push({ label: 'العمر', value: `${age} سنة` });

    if (bmi > 30 && age > 60) {
      // PSU 2010
      const ree = calculatePennState2010(mifflinBMR, ve, tmax);
      steps.push({ label: 'معادلة الحساب المطبقة', value: 'Modified Penn State (PSU 2010)' });
      steps.push({ label: 'Mifflin BMR المستخدم', value: `${mifflinBMR.toFixed(0)} سعرة` });
      steps.push({ label: 'النتيجة المحسوبة (RMR)', value: `${ree.toFixed(0)} سعرة/يوم` });
      return { value: ree, formulaName: 'Penn State 2010', steps };
    } else {
      // PSU 2003b
      const ree = calculatePennState2003b(mifflinBMR, ve, tmax);
      steps.push({ label: 'معادلة الحساب المطبقة', value: 'Penn State (PSU 2003b)' });
      steps.push({ label: 'Mifflin BMR المستخدم', value: `${mifflinBMR.toFixed(0)} سعرة` });
      steps.push({ label: 'النتيجة المحسوبة (RMR)', value: `${ree.toFixed(0)} سعرة/يوم` });
      return { value: ree, formulaName: 'Penn State 2003b', steps };
    }
  }
}

// 2. CLINICAL QUICK METHODS COMPENDIUM
export interface IllnessRequirement {
  nameAr: string;
  minKcal: number;
  maxKcal: number;
  minProtein: number;
  maxProtein: number;
}

export const KAU_ILLNESS_MATRIX: Record<string, IllnessRequirement> = {
  minor_surgery: { nameAr: 'جراحة بسيطة (Minor surgery)', minKcal: 30, maxKcal: 30, minProtein: 1.0, maxProtein: 1.2 },
  major_surgery: { nameAr: 'جراحة كبرى (Major surgery)', minKcal: 35, maxKcal: 35, minProtein: 1.5, maxProtein: 2.0 },
  major_sepsis: { nameAr: 'تسمم دم حاد / التهاب البيريتون (Major sepsis / Peritonitis)', minKcal: 35, maxKcal: 40, minProtein: 1.5, maxProtein: 2.0 },
  burns_trauma: { nameAr: 'حروق شديدة / صدمة حادة (Severe Burns / Trauma)', minKcal: 40, maxKcal: 45, minProtein: 1.5, maxProtein: 2.0 },
  malnutrition: { nameAr: 'سوء تغذية مع مجاعة / فقدان وزن كبير', minKcal: 30, maxKcal: 35, minProtein: 1.1, maxProtein: 1.5 },
  crohns: { nameAr: 'مرض كرون (Crohn\'s disease)', minKcal: 30, maxKcal: 35, minProtein: 1.2, maxProtein: 1.5 },
  acute_renal: { nameAr: 'قصور كلوي حاد (Acute renal insufficiency)', minKcal: 30, maxKcal: 35, minProtein: 1.0, maxProtein: 1.2 },
  ckd_no_dialysis: { nameAr: 'مرض الكلى المزمن بدون غسيل (CKD Stages 1-5)', minKcal: 30, maxKcal: 35, minProtein: 0.6, maxProtein: 0.8 },
  ckd_hd: { nameAr: 'مرض الكلى مع غسيل دموي (Hemodialysis)', minKcal: 35, maxKcal: 35, minProtein: 1.2, maxProtein: 1.2 },
  ckd_pd: { nameAr: 'مرض الكلى مع غسيل بريتوني (Peritoneal Dialysis)', minKcal: 30, maxKcal: 35, minProtein: 1.2, maxProtein: 1.3 },
  diabetes: { nameAr: 'مرض السكري النوع 1 و 2 (Diabetes)', minKcal: 25, maxKcal: 30, minProtein: 0.8, maxProtein: 1.0 },
  paraplegia: { nameAr: 'شلل سفلي (Paraplegia)', minKcal: 28, maxKcal: 28, minProtein: 0.8, maxProtein: 1.0 },
  quadriplegia: { nameAr: 'شلل رباعي (Quadriplegia)', minKcal: 23, maxKcal: 23, minProtein: 0.8, maxProtein: 1.0 },
  aids_wasting: { nameAr: 'متلازمة الهزال المصاحبة للإيدز (AIDS wasting)', minKcal: 40, maxKcal: 50, minProtein: 1.5, maxProtein: 2.0 },
  cirrhosis: { nameAr: 'تليف الكبد (Cirrhosis)', minKcal: 30, maxKcal: 35, minProtein: 1.2, maxProtein: 1.5 },
  encephalopathy: { nameAr: 'مرض الكبد مع اعتلال دماغي', minKcal: 30, maxKcal: 35, minProtein: 0.8, maxProtein: 1.0 },
  pancreatitis: { nameAr: 'التهاب البنكرياس الحاد (Acute pancreatitis)', minKcal: 35, maxKcal: 40, minProtein: 1.2, maxProtein: 1.5 },
  icu_ventilator: { nameAr: 'مرضى العناية المركزة على جهاز التنفس', minKcal: 25, maxKcal: 25, minProtein: 1.0, maxProtein: 1.2 },
  geriatrics: { nameAr: 'كبار السن (Geriatrics)', minKcal: 25, maxKcal: 30, minProtein: 1.0, maxProtein: 1.2 },
  pregnancy: { nameAr: 'الحمل (Pregnancy)', minKcal: 36, maxKcal: 36, minProtein: 1.1, maxProtein: 1.1 },
};

// 3. DAILY WATER REQUIREMENT ENGINE
export function calculateHollidaySegarFluid(weightKg: number): number {
  if (weightKg <= 10) {
    return weightKg * 100;
  } else if (weightKg <= 20) {
    return 1000 + (weightKg - 10) * 50;
  } else {
    return 1500 + (weightKg - 20) * 20;
  }
}

// 4.3 Glucose Utilization Rate (GUR) Safety Verifier
export function calculateGUR(volumeMl: number, dextroseStrengthPercent: number, weightKg: number): number {
  if (weightKg <= 0) return 0;
  const gramDextrose = volumeMl * (dextroseStrengthPercent / 100);
  const mgDextrose = gramDextrose * 1000;
  return mgDextrose / (weightKg * 1440);
}
