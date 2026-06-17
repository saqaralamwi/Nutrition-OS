import { calculateBmr } from '../calculators/BmrCalculator';
import { calculateBmrHarris } from '../calculators/BmrHarrisCalculator';
import { PennStateEngine } from '../calculators/PennStateEngine';
import { calculateFluidRequirement } from '../calculators/FluidCalculator';

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
function safeNum(v: unknown, fallback: number = 0): number {
  if (typeof v === 'number' && isFinite(v)) return v;
  if (typeof v === 'string') { const p = parseFloat(v); return isFinite(p) ? p : fallback; }
  return fallback;
}

export function calculateHarrisBenedictBMR(weightKg: number, heightCm: number, age: number, isMale: boolean): number {
  const w = safeNum(weightKg, 70);
  const h = safeNum(heightCm, 170);
  const a = safeNum(age, 40);
  if (w <= 0 || h <= 0) return 0;
  const result = calculateBmrHarris(w, h, a, isMale);
  return Math.max(0, result.value);
}

export function calculateMifflinStJeorBMR(weightKg: number, heightCm: number, age: number, isMale: boolean): number {
  const w = safeNum(weightKg, 70);
  const h = safeNum(heightCm, 170);
  const a = safeNum(age, 40);
  if (w <= 0 || h <= 0) return 0;
  try {
    const result = calculateBmr(w, h, a, isMale);
    return Math.max(0, result.value);
  } catch {
    return 0;
  }
}

export function calculateIretonJones1992(weightKg: number, age: number, isMale: boolean, trauma: boolean, burn: boolean): number {
  const w = safeNum(weightKg, 70);
  const a = safeNum(age, 40);
  const sexVal = isMale ? 1 : 0;
  const traumaVal = trauma ? 1 : 0;
  const burnVal = burn ? 1 : 0;
  return Math.max(0, 1925 - (10 * a) + (5 * w) + (281 * sexVal) + (292 * traumaVal) + (851 * burnVal));
}

export function calculatePennState2003b(mifflinVal: number, ve: number, tmax: number): number {
  const m = safeNum(mifflinVal, 1500);
  const v = safeNum(ve, 0);
  const t = safeNum(tmax, 37);
  if (m <= 0 || v <= 0 || t < 35 || t > 43) return 0;
  const result = PennStateEngine.calculatePennState({ mifflinRee: m, minuteVentilationLMin: v, maxTemperatureCelsius: t, isObese: false });
  return Math.max(0, result.rmrValue);
}

export function calculatePennState2010(mifflinVal: number, ve: number, tmax: number): number {
  const m = safeNum(mifflinVal, 1500);
  const v = safeNum(ve, 0);
  const t = safeNum(tmax, 37);
  if (m <= 0 || v <= 0 || t < 35 || t > 43) return 0;
  const result = PennStateEngine.calculatePennState({ mifflinRee: m, minuteVentilationLMin: v, maxTemperatureCelsius: t, isObese: true });
  return Math.max(0, result.rmrValue);
}

// 1.1 Mechanically Ventilated Predictive Energy Flowchart Logic
export function calculateVentilatedREE(input: VentilatedREEInput): { value: number; formulaName: string; steps: { label: string; value: string }[] } {
  if (!input || typeof input !== 'object') {
    return { value: 0, formulaName: 'none', steps: [{ label: 'خطأ', value: 'مدخلات غير صالحة' }] };
  }
  const { weightKg, heightCm, age, isMale, mechanicallyVentilated, trauma, burn, ve = 0, tmax = 37.0 } = input;
  const steps: { label: string; value: string }[] = [];

  const mifflinBMR = calculateMifflinStJeorBMR(weightKg, heightCm, age, isMale);
  const safeHeightCm = safeNum(heightCm, 170);
  const bmi = safeHeightCm > 0 ? weightKg / Math.pow(safeHeightCm / 100, 2) : 0;

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
  const w = safeNum(weightKg, 70);
  if (w <= 0) return 1500;
  const result = calculateFluidRequirement(w, 'holliday_segar');
  return result.value;
}

// 4.3 Glucose Utilization Rate (GUR) Safety Verifier
export function calculateGUR(volumeMl: number, dextroseStrengthPercent: number, weightKg: number): number {
  const v = safeNum(volumeMl, 0);
  const d = safeNum(dextroseStrengthPercent, 0);
  const w = safeNum(weightKg, 70);
  if (w <= 0 || v <= 0) return 0;
  const gramDextrose = v * (d / 100);
  const mgDextrose = gramDextrose * 1000;
  return mgDextrose / (w * 1440);
}

/**
 * Hidden Calories from Medications
 * Calculates non-nutritional calories from IV medications
 */

/**
 * Calculate Propofol Calories
 * Propofol = 1.1 kcal/ml (lipid emulsion 10%)
 * @param mlPerHour Propofol rate (ml/hr)
 * @returns Calories per day
 */
export function calculatePropofolCalories(mlPerHour: number): number {
  const rate = safeNum(mlPerHour, 0);
  if (rate <= 0) return 0;
  const caloriesPerMl = 1.1;
  const hoursPerDay = 24;
  return Math.round(rate * hoursPerDay * caloriesPerMl);
}

/**
 * Calculate Dextrose IV Flush Calories
 * Dextrose = 3.4 kcal/g
 * @param ml Total volume (ml)
 * @param percent Dextrose concentration (e.g., 5 for 5%)
 * @returns Calories
 */
export function calculateDextroseCalories(ml: number, percent: number): number {
  const v = safeNum(ml, 0);
  const pct = safeNum(percent, 0);
  if (v <= 0) return 0;
  const caloriesPerG = 3.4;
  const gramsPerMl = pct / 100;
  return Math.round(v * gramsPerMl * caloriesPerG);
}

/**
 * Calculate Midol (Midazolam) Calories
 * Midol = 0.78 kcal/ml (propylene glycol vehicle)
 * @param mlPerHour Midol rate (ml/hr)
 * @returns Calories per day
 */
export function calculateMidolCalories(mlPerHour: number): number {
  const rate = safeNum(mlPerHour, 0);
  if (rate <= 0) return 0;
  const caloriesPerMl = 0.78;
  const hoursPerDay = 24;
  return Math.round(rate * hoursPerDay * caloriesPerMl);
}

/**
 * Calculate Lipid Emulsion Calories (Non-Propofol)
 * Lipid emulsion 10% = 1.1 kcal/ml
 * Lipid emulsion 20% = 2.0 kcal/ml
 * @param ml Total volume (ml)
 * @param percent Lipid concentration (10 or 20)
 * @returns Calories
 */
export function calculateLipidEmulsionCalories(ml: number, percent: number): number {
  const v = safeNum(ml, 0);
  if (v <= 0) return 0;
  const pct = safeNum(percent, 10);
  const caloriesPerMl = pct === 10 ? 1.1 : 2.0;
  return Math.round(v * caloriesPerMl);
}

/**
 * Calculate Total Hidden Calories
 * @param medications Patient medications
 * @returns Total hidden calories per day
 */
export function calculateTotalHiddenCalories(
  medications: any[]
): {
  total: number;
  propofol: number;
  dextrose: number;
  midol: number;
  lipids: number;
  breakdown: string;
} {
  let propofolCalories = 0;
  let dextroseCalories = 0;
  let midolCalories = 0;
  let lipidCalories = 0;

  let propofolRate = 0;
  let dextroseVol = 0;
  let dextrosePct = 5;
  let midolRate = 0;
  let lipidsVol = 0;
  let lipidsPct = 10;

  for (const med of medications) {
    const medName = (med.name || med.drugName || '').toLowerCase().trim();
    const mlPerHour = med.mlPerHour ?? med.ml_per_hour ?? 0;
    const totalMlPerDay = med.totalMlPerDay ?? med.total_ml_per_day ?? 0;
    const percent = med.percent ?? 0;

    // Propofol
    if (medName === 'propofol' || medName === 'diprivan' || medName === 'بروبوفول') {
      propofolRate = mlPerHour;
      propofolCalories += calculatePropofolCalories(mlPerHour);
    }

    // Dextrose IV Flush
    if (medName === 'dextrose' || medName === 'd5w' || medName === 'دكستروز') {
      dextroseVol = totalMlPerDay;
      dextrosePct = percent || 5;
      dextroseCalories += calculateDextroseCalories(totalMlPerDay, percent || 5);
    }

    // Midol (Midazolam)
    if (medName === 'midazolam' || medName === 'versed' || medName === 'midol' || medName === 'ميدازولام') {
      midolRate = mlPerHour;
      midolCalories += calculateMidolCalories(mlPerHour);
    }

    // Lipid Emulsion (non-Propofol)
    if (medName === 'lipid emulsion' || medName === 'smoflipid' || medName === 'دهون' || medName === 'ليبتيد') {
      lipidsVol = totalMlPerDay;
      lipidsPct = percent || 10;
      lipidCalories += calculateLipidEmulsionCalories(totalMlPerDay, percent || 10);
    }
  }

  const total = propofolCalories + dextroseCalories + midolCalories + lipidCalories;

  const breakdown = `البروفوفول: ${propofolCalories.toFixed(0)} سعرة/يوم (${propofolRate} مل/ساعة)
الدكستروز الوريدي: ${dextroseCalories.toFixed(0)} سعرة/يوم (${dextroseVol} مل/يوم بتركيز ${dextrosePct}%)
الميدازولام: ${midolCalories.toFixed(0)} سعرة/يوم (${midolRate} مل/ساعة)
مستحلب الدهون: ${lipidCalories.toFixed(0)} سعرة/يوم (${lipidsVol} مل/يوم بتركيز ${lipidsPct}%)
──────────────────────
إجمالي السعرات المخفية: ${total.toFixed(0)} سعرة/يوم`;

  return {
    total,
    propofol: propofolCalories,
    dextrose: dextroseCalories,
    midol: midolCalories,
    lipids: lipidCalories,
    breakdown,
  };
}
