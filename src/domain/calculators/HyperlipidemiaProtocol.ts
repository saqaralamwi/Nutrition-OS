import { BmrSelectorEngine } from './BmrSelectorEngine';
import { WeightStrategy } from './WeightStrategy';
import { DrugNutrientEngine } from '../services/DrugNutrientEngine';

export interface HyperlipidemiaPatient {
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female';
  bmi: number;
  type: 'cholesterol' | 'triglycerides' | 'mixed';
  lipids: {
    ldl: number;
    hdl: number;
    tg: number;
    total: number;
  };
  riskFactors: string[];
  familyHistory: boolean;
  diabetes: boolean;
  hypertension: boolean;
  smoking: boolean;
  alcohol: boolean;
  diet: {
    saturatedFat: 'low' | 'moderate' | 'high';
    transFat: 'low' | 'moderate' | 'high';
    fiber: 'low' | 'moderate' | 'high';
    carbs: 'low' | 'moderate' | 'high';
  };
  weightLoss: number;
  medications: string[];
}

export interface HyperlipidemiaMealItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  foods: string[];
}

export interface HyperlipidemiaMealPlan {
  mainMeals: HyperlipidemiaMealItem[];
  snacks: { name: string; calories: number; protein: number; foods: string[] }[];
  fatType: string;
  fiber: string;
}

export interface MonitoringPlan {
  labTests: { test: string; frequency: string; target: string }[];
  clinical: { parameter: string; frequency: string; target: string }[];
}

export interface TitrationPlan {
  decreaseSaturatedFat: number;
  increaseFiber: number;
  frequency: string;
  target: string;
  monitor: string;
}

export interface HyperlipidemiaPrescription {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturatedFat: number;
  meals: HyperlipidemiaMealPlan;
  restrictions: string[];
  recommendations: string[];
  alerts: string[];
  monitoring: MonitoringPlan;
  titration?: TitrationPlan;
}

const KNOWN_DNI_MEDICATIONS: Record<string, string[]> = {
  statin: ['⚠️ ستاتين: مراقبة إنزيمات الكبد (ALT/AST) — تناول مع العشاء لتقليل الآثار'],
  atorvastatin: ['⚠️ أتورفاستاتين: تجنب عصير الجريب فروت (يزيد تركيز الدواء)'],
  rosuvastatin: ['⚠️ روزوفاستاتين: مراقبة وظائف الكلى — جرعة منخفضة للفشل الكلوي'],
  simvastatin: ['⚠️ سيمفاستاتين: تجنب عصير الجريب فروت (يزيد تركيز الدواء)'],
  fibrate: ['⚠️ فيبرات: مراقبة وظائف الكبد — قد يسبب حصوات المرارة'],
  gemfibrozil: ['⚠️ جيمفيبروزيل: تناوله مع الوجبات — تجنب مع ستاتين (يزيد خطر تسمم عضلي)'],
  fenofibrate: ['⚠️ فينوفايبرات: مراقبة الكبد والكلى — تناول مع الطعام'],
  ezetimibe: ['⚠️ إزيتيميب: آمن مع معظم الأدوية — حبة مسائية'],
  niacin: ['⚠️ نياسين: قد يسبب احمرار الوجه — تناوله مع الأسبرين قبل الجرعة'],
  cholestyramine: ['⚠️ كوليستيرامين: تناوله قبل الوجبات بساعة — يقلل امتصاص الفيتامينات A, D, E, K'],
};

export class HyperlipidemiaProtocol {
  public static calculateCalories(patient: HyperlipidemiaPatient): number {
    if (
      isNaN(patient.weight) || isNaN(patient.height) || isNaN(patient.age) ||
      patient.weight <= 0 || patient.height <= 0 || patient.age <= 0
    ) {
      return 1500;
    }

    const ree = BmrSelectorEngine.calculate({
      weightKg: patient.weight,
      heightCm: patient.height,
      age: patient.age,
      gender: patient.gender,
      population: 'standard',
    });

    if (!ree.isSafe) return 1500;

    const activityFactor = 1.3;

    let calories = Math.round(ree.ree * activityFactor);

    if (patient.bmi >= 30) {
      calories -= 300;
    } else if (patient.bmi >= 25) {
      calories -= 150;
    }

    if (patient.weightLoss > 5) {
      calories += 100;
    }

    if (calories < 1500) calories = 1500;
    if (calories > 3000) calories = 3000;

    return calories;
  }

  public static calculateProtein(patient: HyperlipidemiaPatient): number {
    if (isNaN(patient.weight) || patient.weight <= 0) return 50;

    const weightResult = WeightStrategy.select({
      actualWeightKg: patient.weight,
      heightCm: patient.height,
      gender: patient.gender,
      condition: 'standard',
    });

    const effectiveWeight = weightResult.selectedWeightKg > 0 ? weightResult.selectedWeightKg : patient.weight;

    let proteinPerKg = 1.0;

    if (patient.diabetes) {
      proteinPerKg = 1.1;
    }

    let protein = Math.round(effectiveWeight * proteinPerKg);

    if (protein < 50) protein = 50;
    if (protein > 120) protein = 120;

    return protein;
  }

  public static calculateMacros(calories: number, protein: number, patient: HyperlipidemiaPatient): { carbs: number; fat: number; saturatedFat: number } {
    if (isNaN(calories) || isNaN(protein) || calories <= 0 || protein <= 0) {
      return { carbs: 0, fat: 0, saturatedFat: 0 };
    }

    const proteinCalories = protein * 4;

    const carbsPercent = patient.type === 'triglycerides' ? 0.45 : 0.50;
    const fatPercent = 0.30;

    const remainingCalories = calories - proteinCalories;
    const carbsCalories = remainingCalories * carbsPercent / (carbsPercent + fatPercent);
    const fatCalories = remainingCalories * fatPercent / (carbsPercent + fatPercent);

    const carbs = Math.round(carbsCalories / 4);
    const fat = Math.round(fatCalories / 9);

    const saturatedFatPercent = 0.07;
    const saturatedFatCalories = calories * saturatedFatPercent;
    const saturatedFat = Math.round(saturatedFatCalories / 9);

    return { carbs, fat, saturatedFat };
  }

  public static createMealPlan(calories: number, protein: number, carbs: number, fat: number, patient: HyperlipidemiaPatient): HyperlipidemiaMealPlan {
    if (isNaN(calories) || isNaN(protein) || calories <= 0 || protein <= 0) {
      return {
        mainMeals: [],
        snacks: [],
        fatType: 'unsaturated',
        fiber: 'high',
      };
    }

    const safeCarbs = isNaN(carbs) || carbs <= 0 ? Math.round((calories * 0.50) / 4) : carbs;
    const safeFat = isNaN(fat) || fat <= 0 ? Math.round((calories * 0.30) / 9) : fat;

    return {
      mainMeals: [
        {
          name: 'وجبة الإفطار',
          calories: Math.round(calories * 0.25),
          protein: Math.round(protein * 0.25),
          carbs: Math.round(safeCarbs * 0.25),
          fat: Math.round(safeFat * 0.25),
          foods: ['بيض مسلوق (ليس مقلي)', 'خبز كامل', 'فواكه', 'زبادي قليل الدسم', 'حبوب كاملة'],
        },
        {
          name: 'وجبة منتصف النهار',
          calories: Math.round(calories * 0.30),
          protein: Math.round(protein * 0.30),
          carbs: Math.round(safeCarbs * 0.30),
          fat: Math.round(safeFat * 0.30),
          foods: ['سمك (ليس مقلي)', 'أرز كامل', 'خضار', 'زبادي قليل الدسم'],
        },
        {
          name: 'وجبة المساء',
          calories: Math.round(calories * 0.25),
          protein: Math.round(protein * 0.25),
          carbs: Math.round(safeCarbs * 0.25),
          fat: Math.round(safeFat * 0.25),
          foods: ['دجاج (ليس مقلي)', 'بطاطس', 'خضار', 'فواكه'],
        },
      ],
      snacks: [
        {
          name: 'وجبة خفيفة الصباح',
          calories: Math.round(calories * 0.10),
          protein: Math.round(protein * 0.10),
          foods: ['فواكه', 'حبوب كاملة', 'زبادي قليل الدسم'],
        },
        {
          name: 'وجبة خفيفة المساء',
          calories: Math.round(calories * 0.10),
          protein: Math.round(protein * 0.10),
          foods: ['خضار', 'حبوب', 'زبادي'],
        },
      ],
      fatType: 'unsaturated',
      fiber: 'high',
    };
  }

  public static createRestrictions(patient: HyperlipidemiaPatient): string[] {
    const restrictions: string[] = [];

    restrictions.push('🚫 تجنب الدهون المشبعة STRICT: لحوم دهنية، زبدة، جبن دهني');
    restrictions.push('🚫 تجنب اللحوم الدهنية: الكبدة، السجق، النقانق، لحوم خروف');
    restrictions.push('🚫 تجنب الدهون المتحولة STRICT: أطعمة مصنعة، مقلات، بسكويت');
    restrictions.push('🚫 تجنب الألبان عالية الدسم: الجبن الدهني، الزبدة');

    if (patient.lipids.ldl > 130) {
      restrictions.push('⚠️ تقليل البيض: maximum 1 yolk/week (LDL high)');
      restrictions.push('⚠️ تقليل المأكولات البحرية: shrimp, lobster (LDL high)');
    }

    if (patient.type === 'triglycerides' && patient.lipids.tg > 200) {
      restrictions.push('🚫 تجنب الكحول STRICT: TG high — alcohol يزيد TG');
      restrictions.push('⚠️ تقليل الكربوهيدرات البسيطة: sugar, candies, sweets (TG high)');
    }

    restrictions.push('⚠️ تجنب الأطعمة المصنعة: high trans fat');
    restrictions.push('⚠️ تجنب الأطعمة المقلية: high fat');

    return restrictions;
  }

  public static createRecommendations(patient: HyperlipidemiaPatient): string[] {
    const recommendations: string[] = [];

    recommendations.push('✅ Omega-3: سمك (سالمون، ماكريل) 2-3 مرات/أسبوع — يقلل TG');
    recommendations.push('✅ High fiber: حبوب كاملة، خضار، فواكه — يقلل LDL');
    recommendations.push('✅ زيت غير مشبع: زيت زيتون، زيت كانولا — أفضل من saturated');
    recommendations.push('✅ Plant stanols/sterols: 2g/day — يقلل LDL 10-15%');
    recommendations.push('✅ مكسرات: walnuts, almonds (30g/day) — يقلل LDL');
    recommendations.push('✅ سمك: 2-3 مرات/أسبوع — Omega-3 يحسن lipids');

    if (patient.bmi >= 25) {
      recommendations.push(`✅ تقليل الوزن: BMI ${patient.bmi} — weight loss 5-10% يحسن lipids بنسبة 20%+`);
    }

    recommendations.push('✅ تمرين: 150 دقيقة/أسبوع moderate — يحسن HDL');

    return recommendations;
  }

  public static createAlerts(patient: HyperlipidemiaPatient): string[] {
    const alerts: string[] = [];

    if (patient.lipids.ldl > 190) {
      alerts.push(`⚠️ LDL severe high: ${patient.lipids.ldl} mg/dL — specialist + statin ضروري`);
    } else if (patient.lipids.ldl > 130) {
      alerts.push(`⚠️ LDL high: ${patient.lipids.ldl} mg/dL — lifestyle + medication`);
    }

    if (patient.lipids.hdl < 40) {
      alerts.push(`⚠️ HDL low: ${patient.lipids.hdl} mg/dL — exercise ضروري`);
    }

    if (patient.lipids.tg > 500) {
      alerts.push(`⚠️ TG severe high: ${patient.lipids.tg} mg/dL — pancreatitis risk — strict low fat + alcohol prohibition`);
    } else if (patient.lipids.tg > 200) {
      alerts.push(`⚠️ TG high: ${patient.lipids.tg} mg/dL — lifestyle + medication`);
    }

    if (patient.riskFactors.length >= 3) {
      alerts.push(`⚠️ Risk factors high: ${patient.riskFactors.join(', ')} — coronary risk عالي`);
    }

    if (patient.diabetes) {
      alerts.push('⚠️ Diabetes: lipid control ضروري (coronary risk عالي)');
    }

    if (patient.hypertension) {
      alerts.push('⚠️ Hypertension: lipid control ضروري (coronary risk عالي)');
    }

    if (patient.smoking) {
      alerts.push('🚫 Smoking: الإقلاع ضروري (coronary risk عالي)');
    }

    for (const med of patient.medications) {
      const medLower = med.toLowerCase().trim();
      for (const [key, msgs] of Object.entries(KNOWN_DNI_MEDICATIONS)) {
        if (medLower.includes(key)) {
          alerts.push(...msgs);
        }
      }
    }

    return alerts;
  }

  public static createMonitoringPlan(patient: HyperlipidemiaPatient): MonitoringPlan {
    const targetLdl = patient.diabetes || patient.hypertension ? '< 70 mg/dL' : '< 100 mg/dL';
    const targetNonHdl = patient.diabetes || patient.hypertension ? '< 100 mg/dL' : '< 130 mg/dL';

    return {
      labTests: [
        { test: 'LDL', frequency: 'كل 3-6 أشهر', target: targetLdl },
        { test: 'HDL', frequency: 'كل 3-6 أشهر', target: '> 40 mg/dL (male), > 50 mg/dL (female)' },
        { test: 'Triglycerides', frequency: 'كل 3-6 أشهر', target: '< 150 mg/dL' },
        { test: 'Total cholesterol', frequency: 'كل 3-6 أشهر', target: '< 200 mg/dL' },
        { test: 'Non-HDL', frequency: 'كل 3-6 أشهر', target: targetNonHdl },
      ],
      clinical: [
        { parameter: 'Weight', frequency: 'كل أسبوع', target: patient.bmi >= 25 ? 'decrease 0.5kg/week' : 'stable' },
        { parameter: 'BMI', frequency: 'كل شهر', target: patient.bmi >= 25 ? 'decrease → 18.5-24.9' : '18.5-24.9' },
        { parameter: 'Exercise', frequency: 'كل أسبوع', target: '150 min/week moderate' },
        { parameter: 'Diet adherence', frequency: 'كل أسبوع', target: 'low saturated fat + high fiber' },
        { parameter: 'Smoking', frequency: 'كل أسبوع', target: patient.smoking ? 'stopped' : 'none' },
      ],
    };
  }

  public static createTitrationPlan(patient: HyperlipidemiaPatient): TitrationPlan | null {
    if (patient.lipids.ldl > 130 || patient.lipids.tg > 200) {
      return {
        decreaseSaturatedFat: 2,
        increaseFiber: 5,
        frequency: 'every 3 months',
        target: 'LDL < 100 mg/dL, TG < 150 mg/dL',
        monitor: 'Lipids + Weight',
      };
    }

    return null;
  }

  public static generatePrescription(patient: HyperlipidemiaPatient): HyperlipidemiaPrescription {
    if (
      isNaN(patient.weight) || isNaN(patient.height) || isNaN(patient.age) ||
      patient.weight <= 0 || patient.height <= 0 || patient.age <= 0
    ) {
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        saturatedFat: 0,
        meals: { mainMeals: [], snacks: [], fatType: 'unsaturated', fiber: 'high' },
        restrictions: [],
        recommendations: [],
        alerts: ['الرجاء إدخال بيانات صحيحة للمريض (الوزن، الطول، العمر)'],
        monitoring: { labTests: [], clinical: [] },
      };
    }

    const calories = this.calculateCalories(patient);
    const protein = this.calculateProtein(patient);
    const macros = this.calculateMacros(calories, protein, patient);
    const meals = this.createMealPlan(calories, protein, macros.carbs, macros.fat, patient);
    const restrictions = this.createRestrictions(patient);
    const recommendations = this.createRecommendations(patient);
    const alerts = this.createAlerts(patient);
    const monitoring = this.createMonitoringPlan(patient);
    const titration = this.createTitrationPlan(patient);

    return {
      calories,
      protein,
      carbs: macros.carbs,
      fat: macros.fat,
      saturatedFat: macros.saturatedFat,
      meals,
      restrictions,
      recommendations,
      alerts,
      monitoring,
      ...(titration ? { titration } : {}),
    };
  }
}
