import { BmrSelectorEngine } from './BmrSelectorEngine';
import { WeightStrategy } from './WeightStrategy';
import { DrugNutrientEngine } from '../services/DrugNutrientEngine';

export interface GERDPatient {
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female';
  bmi: number;
  severity: 'mild' | 'moderate' | 'severe';
  frequency: 'occasional' | 'weekly' | 'daily';
  symptoms: string[];
  hiatalAnemia: boolean;
  complications: string[];
  meals: {
    size: 'small' | 'medium' | 'large';
    frequency: number;
    timing: 'regular' | 'irregular';
  };
  diet: {
    fat: 'low' | 'moderate' | 'high';
    spice: 'low' | 'moderate' | 'high';
    caffeine: 'low' | 'moderate' | 'high';
  };
  lifestyle: {
    smoking: boolean;
    alcohol: boolean;
    bedtime: string;
    postMeal: 'rest' | 'walk' | 'exercise';
  };
  medications: string[];
  nutrients: {
    hgb: number;
    iron: number;
    b12: number;
  } | null;
}

export interface GERDMealItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timing: string;
  foods: string[];
}

export interface GERDMealPlan {
  mainMeals: GERDMealItem[];
  mealSize: 'small';
  noLateMeals: boolean;
  bedtime: string;
}

export interface GERDMonitoringPlan {
  labTests: { test: string; frequency: string; target: string }[];
  clinical: { parameter: string; frequency: string; target: string }[];
}

export interface GERDPrescription {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: GERDMealPlan;
  restrictions: string[];
  recommendations: string[];
  lifestyle: string[];
  alerts: string[];
  monitoring: GERDMonitoringPlan;
}

const r2 = (v: number): number => parseFloat(v.toFixed(2));

const KNOWN_DNI_MEDICATIONS: Record<string, string[]> = {
  omeprazole: ['⚠️ أوميبرازول: تناوله قبل الوجبة بـ 30-60 دقيقة — قد يقلل امتصاص B12'],
  pantoprazole: ['⚠️ بانتوبرازول: تناوله قبل الوجبة بـ 30-60 دقيقة — قد يقلل امتصاص B12'],
  esomeprazole: ['⚠️ إيزوميبرازول: تناوله قبل الوجبة بـ 30-60 دقيقة — قد يقلل امتصاص B12'],
  lansoprazole: ['⚠️ لانسوبرازول: تناوله قبل الوجبة بـ 30-60 دقيقة — قد يقلل امتصاص B12'],
  rabeprazole: ['⚠️ رابيبرازول: تناوله قبل الوجبة بـ 30-60 دقيقة — قد يقلل امتصاص B12'],
  ranitidine: ['⚠️ رانيتيدين: لا توجد تفاعلات غذائية كبيرة — تناوله مع الطعام أو بدونه'],
  famotidine: ['⚠️ فاموتيدين: لا توجد تفاعلات غذائية كبيرة — تناوله مع الطعام أو بدونه'],
  cimetidine: ['⚠️ سيميتيدين: تجنب الكحول — قد يزيد تأثير الكحول'],
  metoclopramide: ['⚠️ ميتوكلوبراميد: تناوله قبل الوجبة بـ 30 دقيقة — يحسن إفراغ المعدة'],
  domperidone: ['⚠️ دومبيريدون: تناوله قبل الوجبة بـ 15-30 دقيقة — يحسن إفراغ المعدة'],
  sucralfate: ['⚠️ سوكرالفات: تناوله على معدة فارغة — ساعتين قبل أو بعد الوجبة'],
  aluminum: ['⚠️ مضادات الحموضة: تجنب تناولها مع الوجبة — ساعتين بينهما'],
  magnesium: ['⚠️ مضادات الحموضة (مغنيسيوم): قد تسبب إسهال — مراقبة'],
  calcium: ['⚠️ مضادات الحموضة (كالسيوم): قد تسبب إمساك — مراقبة'],
};

export class GERDProtocol {
  public static calculateCalories(patient: GERDPatient): number {
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

    const activityFactor = 1.2;

    let calories = Math.round(ree.ree * activityFactor);

    if (patient.bmi >= 30) {
      calories -= 300;
    } else if (patient.bmi >= 25) {
      calories -= 150;
    }

    if (calories < 1500) calories = 1500;
    if (calories > 3000) calories = 3000;

    return calories;
  }

  public static calculateProtein(patient: GERDPatient): number {
    if (isNaN(patient.weight) || patient.weight <= 0) return 50;

    const weightResult = WeightStrategy.select({
      actualWeightKg: patient.weight,
      heightCm: patient.height,
      gender: patient.gender,
      condition: 'standard',
    });

    const effectiveWeight = weightResult.selectedWeightKg > 0 ? weightResult.selectedWeightKg : patient.weight;

    const proteinPerKg = 1.0;

    let protein = Math.round(effectiveWeight * proteinPerKg);

    if (protein < 50) protein = 50;
    if (protein > 120) protein = 120;

    return protein;
  }

  public static calculateMacros(calories: number, protein: number, patient: GERDPatient): { carbs: number; fat: number } {
    if (isNaN(calories) || isNaN(protein) || calories <= 0 || protein <= 0) {
      return { carbs: 0, fat: 0 };
    }

    const proteinCalories = protein * 4;

    if (proteinCalories >= calories) {
      return {
        carbs: Math.round((calories * 0.55) / 4),
        fat: Math.round((calories * 0.20) / 9),
      };
    }

    const nonProteinCalories = calories - proteinCalories;

    const carbsPercent = 0.55;
    const fatPercent = patient.diet.fat === 'high' ? 0.25 : 0.20;

    const carbsCalories = nonProteinCalories * carbsPercent / (carbsPercent + fatPercent);
    const fatCalories = nonProteinCalories * fatPercent / (carbsPercent + fatPercent);

    const carbs = Math.round(carbsCalories / 4);
    const fat = Math.round(fatCalories / 9);

    return { carbs, fat };
  }

  public static createMealPlan(calories: number, protein: number, carbs: number, fat: number, patient: GERDPatient): GERDMealPlan {
    if (isNaN(calories) || isNaN(protein) || calories <= 0 || protein <= 0) {
      return { mainMeals: [], mealSize: 'small', noLateMeals: true, bedtime: '2-3 hours قبل النوم' };
    }

    const safeCarbs = isNaN(carbs) || carbs <= 0 ? Math.round((calories * 0.55) / 4) : carbs;
    const safeFat = isNaN(fat) || fat <= 0 ? Math.round((calories * 0.20) / 9) : fat;
    const mealCount = 5;
    const calsPerMeal = Math.round(calories / mealCount);
    const proPerMeal = Math.round(protein / mealCount);
    const carbsPerMeal = Math.round(safeCarbs / mealCount);
    const fatPerMeal = Math.round(safeFat / mealCount);

    return {
      mainMeals: [
        {
          name: 'وجبة الإفطار',
          calories: calsPerMeal,
          protein: proPerMeal,
          carbs: carbsPerMeal,
          fat: fatPerMeal,
          timing: '7:00-8:00',
          foods: ['بيض مسلوق (ليس مقلي)', 'خبز كامل صغير', 'فواكه غير حمضية (تفاح، موز)', 'زبادي'],
        },
        {
          name: 'وجبة منتصف الصباح',
          calories: calsPerMeal,
          protein: proPerMeal,
          carbs: carbsPerMeal,
          fat: fatPerMeal,
          timing: '10:00-11:00',
          foods: ['فواكه غير حمضية', 'زبادي', 'حبوب كاملة صغيرة'],
        },
        {
          name: 'وجبة الظهيرة',
          calories: calsPerMeal,
          protein: proPerMeal,
          carbs: carbsPerMeal,
          fat: fatPerMeal,
          timing: '13:00-14:00',
          foods: ['دجاج مشوي (ليس مقلي)', 'أرز أبيض', 'خضار مسلوقة (ليس طازجة)', 'فواكه'],
        },
        {
          name: 'وجبة العصر',
          calories: calsPerMeal,
          protein: proPerMeal,
          carbs: carbsPerMeal,
          fat: fatPerMeal,
          timing: '16:00-17:00',
          foods: ['سمك مشوي', 'بطاطس مسلوقة', 'خضار', 'زبادي'],
        },
        {
          name: 'وجبة مسائية (خفيفة)',
          calories: calsPerMeal,
          protein: proPerMeal,
          carbs: carbsPerMeal,
          fat: fatPerMeal,
          timing: '19:00-20:00',
          foods: ['زبادي', 'فواكه غير حمضية', 'خبز كامل صغير'],
        },
      ],
      mealSize: 'small',
      noLateMeals: true,
      bedtime: '2-3 hours قبل النوم',
    };
  }

  public static createRestrictions(patient: GERDPatient): string[] {
    const restrictions: string[] = [];

    restrictions.push('⚠️ تجنب الأطعمة الدهنية: الوجبات السريعة، اللحوم الدهنية، الزبدة');
    restrictions.push('⚠️ تجنب الأطعمة المقلية: المقلات تزيد الارتجاع');
    restrictions.push('⚠️ تجنب الأطعمة الحارة: الفلفل، الشطة، التوابل الحارة');
    restrictions.push('⚠️ تجنب الفواكه الحمضية: البرتقال، الليمون، الطماطم، التفاح الحمضي');

    if (patient.diet.caffeine !== 'low') {
      restrictions.push('⚠️ تقليل الكافيين: القهوة، الشاي، الكولا — تزيد الارتجاع');
    }

    restrictions.push('⚠️ تجنب المشروبات الغازية: تزيد pressure في المعدة');
    restrictions.push('⚠️ تجنب الشوكولاتة: تزيد الارتجاع');
    restrictions.push('⚠️ تجنب النعناع: يزيد الارتجاع');

    if (patient.lifestyle.alcohol) {
      restrictions.push('⚠️ تجنب الكحول: يزيد الارتجاع — ممنوع تمامًا');
    }

    if (patient.meals.size === 'large') {
      restrictions.push('⚠️ تجنب الوجبات الكبيرة: وجبات صغيرة (5-6/يوم)');
    }

    if (patient.meals.timing === 'irregular') {
      restrictions.push('⚠️ تجنب الوجبات المتأخرة: آخر وجبة 2-3 ساعات قبل النوم');
    }

    return restrictions;
  }

  public static createRecommendations(patient: GERDPatient): string[] {
    const recommendations: string[] = [];

    recommendations.push('✅ الأطعمة Low fat: دجاج مشوي، سمك مشوي، زبادي');
    recommendations.push('✅ زيت قليل: تجنب الزبدة، استخدم زيت قليل');
    recommendations.push('✅ الفواكه غير الحمضية: تفاح، موز، بابايا');
    recommendations.push('✅ الخضار المسلوقة: أسهل في الهضم (ليس طازجة)');

    if (patient.severity !== 'severe') {
      recommendations.push('✅ الحبوب الكاملة: خبز كامل، أرز كامل (إذا لا severe)');
    }

    recommendations.push('✅ بروتين خفيف: دجاج، سمك، بيض مسلوق');
    recommendations.push('✅ وجبات صغيرة: 5-6 وجبات/يوم (ليس 3 كبيرة)');
    recommendations.push('✅ توقيت الوجبات: آخر وجبة 2-3 ساعات قبل النوم');
    recommendations.push('✅ زبادي: يساعد في الهضم');

    return recommendations;
  }

  public static createLifestyleRecommendations(patient: GERDPatient): string[] {
    const lifestyle: string[] = [];

    if (patient.lifestyle.smoking) {
      lifestyle.push('🚫 الإقلاع عن التدخين: التدخين يزيد الارتجاع — إقلاع ضروري');
    }

    if (patient.lifestyle.alcohol) {
      lifestyle.push('🚫 الإقلاع عن الكحول: الكحول يزيد الارتجاع — إقلاع ضروري');
    }

    if (patient.bmi >= 25) {
      lifestyle.push(`✅ تقليل الوزن: BMI ${patient.bmi} — weight loss يحسن GERD بنسبة 50%+`);
    }

    if (patient.lifestyle.postMeal === 'rest') {
      lifestyle.push('✅ تحريك الجسم بعد الوجبة: walk خفيف 10-15 دقيقة (ليس rest)');
    }

    lifestyle.push('✅ ارتفاع الرأس: النوم على ظهر مرتفع 15-20 سم');
    lifestyle.push('✅ ملابس غير ضيقة: تجنب الملابس الضيقة على المعدة');

    return lifestyle;
  }

  public static createAlerts(patient: GERDPatient): string[] {
    const alerts: string[] = [];

    alerts.push('⚠️ متابعة منتظمة مطلوبة لمرضى الارتجاع المعدي');

    if (patient.hiatalAnemia) {
      alerts.push('⚠️ Hiatal anemia: Iron supplementation required');
    }

    if (patient.complications.length > 0) {
      alerts.push(`⚠️ Complications: ${patient.complications.join(', ')} — متخصص ضروري`);
    }

    if (patient.complications.includes('Barrett')) {
      alerts.push('⚠️ Barrett esophagus: Specialist follow-up + Endoscopy ضروري');
    }

    if (patient.severity === 'severe') {
      alerts.push('⚠️ GERD severe: Specialist + PPI ضروري');
    }

    if (patient.nutrients && patient.nutrients.hgb < 12) {
      alerts.push(`⚠️ Anemia: Hgb ${patient.nutrients.hgb} g/dL — Iron required`);
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

  public static createMonitoringPlan(patient: GERDPatient): GERDMonitoringPlan {
    return {
      labTests: [
        { test: 'Hgb (CBC)', frequency: 'كل 6 أشهر', target: '> 12 g/dL' },
        { test: 'Iron', frequency: 'كل 6 أشهر', target: '70-150 µg/dL' },
        { test: 'B12', frequency: 'كل سنة', target: '> 300 pg/mL' },
      ],
      clinical: [
        { parameter: 'Weight', frequency: 'كل أسبوع', target: patient.bmi >= 25 ? 'decrease 0.5kg/week' : 'stable' },
        { parameter: 'Heartburn frequency', frequency: 'كل يوم', target: patient.frequency === 'occasional' ? 'occasional' : 'decrease → occasional' },
        { parameter: 'Regurgitation', frequency: 'كل يوم', target: 'none أو occasional' },
        { parameter: 'Meal size', frequency: 'كل يوم', target: 'small meals (5-6/يوم)' },
        { parameter: 'Lifestyle', frequency: 'كل أسبوع', target: 'smoking/alcohol stopped + walk بعد الوجبة' },
      ],
    };
  }

  public static generatePrescription(patient: GERDPatient): GERDPrescription {
    if (
      isNaN(patient.weight) || isNaN(patient.height) || isNaN(patient.age) ||
      patient.weight <= 0 || patient.height <= 0 || patient.age <= 0
    ) {
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        meals: { mainMeals: [], mealSize: 'small', noLateMeals: true, bedtime: '2-3 hours قبل النوم' },
        restrictions: [],
        recommendations: [],
        lifestyle: [],
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
    const lifestyle = this.createLifestyleRecommendations(patient);
    const alerts = this.createAlerts(patient);
    const monitoring = this.createMonitoringPlan(patient);

    return {
      calories,
      protein,
      carbs: macros.carbs,
      fat: macros.fat,
      meals,
      restrictions,
      recommendations,
      lifestyle,
      alerts,
      monitoring,
    };
  }
}
