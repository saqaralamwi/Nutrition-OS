import { BmrSelectorEngine } from './BmrSelectorEngine';
import { WeightStrategy } from './WeightStrategy';
import { DrugNutrientEngine } from '../services/DrugNutrientEngine';
import { EnteralNutritionEngine } from './EnteralNutritionEngine';
import { ParenteralNutritionEngine } from './ParenteralNutritionEngine';

export interface PancreatitisPatient {
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female';
  type: 'acute' | 'chronic';
  severity: 'mild' | 'moderate' | 'severe';
  phase: 'acute_phase' | 'recovery' | 'maintenance';
  pain: 'none' | 'mild' | 'moderate' | 'severe';
  nausea: boolean;
  vomiting: boolean;
  diarrhea: boolean;
  steatorrhea: boolean;
  weightLoss: number;
  glucose: number;
  hgbA1c: number;
  enzymes: { amylase: number; lipase: number } | null;
  nutrition: { route: 'oral' | 'enteral' | 'parenteral'; tolerance: 'good' | 'moderate' | 'poor' };
  medications: string[];
  nutrients: {
    trypsin: number;
    vitaminA: number;
    vitaminD: number;
    vitaminE: number;
    vitaminK: number;
    zinc: number;
    albumin: number;
  } | null;
}

export interface PancreatitisMealItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  foods: string[];
}

export interface PancreatitisMealPlan {
  mainMeals: PancreatitisMealItem[];
  mealSize: 'small';
  lowFat: boolean;
  noLateMeals: boolean;
}

export interface EnteralPlan {
  route: 'enteral';
  formula: string;
  calories: number;
  protein: number;
  fat: number;
}

export interface ParenteralPlan {
  route: 'parenteral';
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface EnzymePlan {
  dose: number;
  frequency: string;
  type: string;
  target: string;
}

export interface PancreatitisMonitoringPlan {
  labTests: { test: string; frequency: string; target: string }[];
  clinical: { parameter: string; frequency: string; target: string }[];
}

export interface PancreatitisTitrationPlan {
  increaseCalories: number;
  increaseFat: number;
  frequency: string;
  target: string;
  monitor: string;
}

export interface PancreatitisPrescription {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  enteral: EnteralPlan | null;
  parenteral: ParenteralPlan | null;
  enzymes: EnzymePlan | null;
  meals: PancreatitisMealPlan;
  restrictions: string[];
  alerts: string[];
  monitoring: PancreatitisMonitoringPlan;
  titration: PancreatitisTitrationPlan | null;
}

const KNOWN_DNI_MEDICATIONS: Record<string, string[]> = {
  pancrelipase: ['⚠️ بانكريليباز: تناوله مع كل وجبة — يحسن هضم الدهون'],
  insulin: ['⚠️ إنسولين: مراقبة سكر الدم — تعديل الجرعة حسب التغذية'],
  metformin: ['⚠️ ميتفورمين: تناوله مع الطعام لتقليل الآثار الجانبية المعدية'],
  octreotide: ['⚠️ أوكتريوتيد: مراقبة سكر الدم — قد يؤثر على إفراز الإنسولين'],
  morphine: ['⚠️ مورفين: قد يسبب إمساك — زيادة الألياف والسوائل'],
  fentanyl: ['⚠️ فينتانيل: قد يسبب إمساك — زيادة الألياف والسوائل'],
  antibiotics: ['⚠️ مضادات حيوية: قد تسبب إسهال — مراقبة الشوارد'],
  metronidazole: ['⚠️ ميترونيدازول: تجنب الكحول — قد يسبب غثيان'],
  thiamine: ['⚠️ ثيامين: مهم لمرضى التهاب البنكرياس الكحولي — تعويض'],
};

export class PancreatitisProtocol {
  public static calculateCalories(patient: PancreatitisPatient): number {
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
      population: 'chronic_disease',
    });

    if (!ree.isSafe) return 1500;

    const activityFactor = 1.2;

    let stressFactor: number;
    if (patient.type === 'acute') {
      if (patient.severity === 'severe') {
        stressFactor = 1.5;
      } else if (patient.severity === 'moderate') {
        stressFactor = 1.3;
      } else {
        stressFactor = 1.2;
      }
    } else {
      stressFactor = patient.steatorrhea ? 1.3 : 1.2;
    }

    let calories = Math.round(ree.ree * activityFactor * stressFactor);

    if (patient.weightLoss > 5) {
      calories += 200;
    }

    if (calories < 1500) calories = 1500;
    if (calories > 3500) calories = 3500;

    return calories;
  }

  public static calculateProtein(patient: PancreatitisPatient): number {
    if (isNaN(patient.weight) || patient.weight <= 0) return 60;

    const weightResult = WeightStrategy.select({
      actualWeightKg: patient.weight,
      heightCm: patient.height,
      gender: patient.gender,
      condition: 'chronic_disease',
    });

    const effectiveWeight = weightResult.selectedWeightKg > 0 ? weightResult.selectedWeightKg : patient.weight;

    let proteinPerKg: number;

    if (patient.type === 'acute') {
      if (patient.severity === 'severe') {
        proteinPerKg = 1.5;
      } else if (patient.severity === 'moderate') {
        proteinPerKg = 1.3;
      } else {
        proteinPerKg = 1.2;
      }
    } else {
      proteinPerKg = patient.steatorrhea ? 1.3 : 1.2;
    }

    let protein = Math.round(effectiveWeight * proteinPerKg);

    if (protein < 60) protein = 60;
    if (protein > 150) protein = 150;

    return protein;
  }

  public static calculateMacros(calories: number, protein: number, patient: PancreatitisPatient): { carbs: number; fat: number } {
    if (isNaN(calories) || isNaN(protein) || calories <= 0 || protein <= 0) {
      return { carbs: 0, fat: 0 };
    }

    const proteinCalories = protein * 4;

    if (proteinCalories >= calories) {
      return {
        carbs: Math.round((calories * 0.60) / 4),
        fat: Math.round((calories * 0.15) / 9),
      };
    }

    const nonProteinCalories = calories - proteinCalories;

    const carbsPercent = patient.type === 'acute' ? 0.60 : 0.55;
    const fatPercent = patient.type === 'acute' ? 0.15 : 0.20;

    const carbsCalories = nonProteinCalories * carbsPercent / (carbsPercent + fatPercent);
    const fatCalories = nonProteinCalories * fatPercent / (carbsPercent + fatPercent);

    const carbs = Math.round(carbsCalories / 4);
    const fat = Math.round(fatCalories / 9);

    return { carbs, fat };
  }

  public static determineNutritionRoute(patient: PancreatitisPatient): { route: 'oral' | 'enteral' | 'parenteral'; enteral?: EnteralPlan; parenteral?: ParenteralPlan } {
    if (patient.type === 'acute' && patient.severity === 'severe' && patient.phase === 'acute_phase') {
      return {
        route: 'parenteral',
        parenteral: {
          route: 'parenteral',
          calories: this.calculateCalories(patient),
          protein: this.calculateProtein(patient),
          fat: 0,
          carbs: Math.round(this.calculateCalories(patient) * 0.60 / 4),
        },
      };
    }

    if (patient.type === 'acute' && patient.severity === 'moderate' && patient.phase === 'acute_phase') {
      return {
        route: 'enteral',
        enteral: {
          route: 'enteral',
          formula: 'peptic',
          calories: this.calculateCalories(patient),
          protein: this.calculateProtein(patient),
          fat: 10,
        },
      };
    }

    if (patient.nutrition.tolerance === 'good') {
      return { route: 'oral' };
    }

    return {
      route: 'enteral',
      enteral: {
        route: 'enteral',
        formula: 'peptic',
        calories: this.calculateCalories(patient),
        protein: this.calculateProtein(patient),
        fat: 20,
      },
    };
  }

  public static createMealPlan(calories: number, protein: number, carbs: number, fat: number, patient: PancreatitisPatient): PancreatitisMealPlan {
    if (isNaN(calories) || isNaN(protein) || calories <= 0 || protein <= 0) {
      return { mainMeals: [], mealSize: 'small', lowFat: true, noLateMeals: true };
    }

    const safeCarbs = isNaN(carbs) || carbs <= 0 ? Math.round((calories * 0.60) / 4) : carbs;
    const safeFat = isNaN(fat) || fat <= 0 ? Math.round((calories * 0.15) / 9) : fat;
    const mealCount = patient.type === 'acute' ? 6 : 5;
    const calsPerMeal = Math.round(calories / mealCount);
    const proPerMeal = Math.round(protein / mealCount);
    const carbsPerMeal = Math.round(safeCarbs / mealCount);
    const fatPerMeal = Math.round(safeFat / mealCount);

    const meals: PancreatitisMealItem[] = [
      {
        name: 'وجبة الإفطار',
        calories: calsPerMeal,
        protein: proPerMeal,
        carbs: carbsPerMeal,
        fat: fatPerMeal,
        foods: ['بيض مسلوق (ليس مقلي)', 'أرز أبيض صغير', 'فواكه (ليس حمضية)', 'زبادي قليل الدسم'],
      },
      {
        name: 'وجبة منتصف الصباح',
        calories: calsPerMeal,
        protein: proPerMeal,
        carbs: carbsPerMeal,
        fat: fatPerMeal,
        foods: ['فواكه', 'زبادي قليل الدسم'],
      },
      {
        name: 'وجبة الظهيرة',
        calories: calsPerMeal,
        protein: proPerMeal,
        carbs: carbsPerMeal,
        fat: fatPerMeal,
        foods: ['دجاج مشوي (ليس مقلي)', 'أرز أبيض', 'خضار مسلوقة', 'فواكه'],
      },
      {
        name: 'وجبة العصر',
        calories: calsPerMeal,
        protein: proPerMeal,
        carbs: carbsPerMeal,
        fat: fatPerMeal,
        foods: ['سمك مشوي (ليس مقلي)', 'بطاطس مسلوقة', 'خضار', 'زبادي'],
      },
      {
        name: 'وجبة مسائية',
        calories: calsPerMeal,
        protein: proPerMeal,
        carbs: carbsPerMeal,
        fat: fatPerMeal,
        foods: ['زبادي قليل الدسم', 'فواكه', 'أرز صغير'],
      },
    ];

    return { mainMeals: meals, mealSize: 'small', lowFat: true, noLateMeals: true };
  }

  public static createEnzymePlan(patient: PancreatitisPatient): EnzymePlan | null {
    if (patient.type === 'chronic' && patient.steatorrhea) {
      return {
        dose: 25000,
        frequency: 'مع كل وجبة + وجبة خفيفة',
        type: 'pancrelipase',
        target: 'steatorrhea resolution + fat absorption',
      };
    }

    return null;
  }

  public static createRestrictions(patient: PancreatitisPatient): string[] {
    const restrictions: string[] = [];

    restrictions.push('🚫 تجنب الأطعمة الدهنية STRICT: الوجبات السريعة، اللحوم الدهنية، الزبدة، الزيوت');
    restrictions.push('🚫 تجنب الأطعمة المقلية STRICT: المقلات تزيد الأعراض');
    restrictions.push('🚫 تجنب الكحول STRICT: الكحول يسبب Pancreatitis — ممنوع تمامًا');
    restrictions.push('🚫 تجنب الألبان عالية الدهون: الجبن الدهني، الزبدة');
    restrictions.push('🚫 تجنب اللحوم المصنعة: الكبدة، السجق، النقانق — عالية الدهون');

    if (patient.type === 'acute') {
      restrictions.push('🚫 تجنب الألبان كاملة الدسم: استخدم قليل الدسم فقط');
      restrictions.push('🚫 تجنب الوجبات الكبيرة: وجبات صغيرة (6/يوم)');
      restrictions.push('⚠️ تقليل الكافيين: الكافيين يزيد الأعراض');
    }

    return restrictions;
  }

  public static createAlerts(patient: PancreatitisPatient): string[] {
    const alerts: string[] = [];

    alerts.push('⚠️ متابعة منتظمة مطلوبة لمرضى التهاب البنكرياس');

    if (patient.glucose > 126 || patient.hgbA1c > 6.5) {
      alerts.push(`⚠️ Diabetes: Glucose ${patient.glucose} mg/dL, HgbA1c ${patient.hgbA1c}% — insulin monitoring`);
    }

    if (patient.steatorrhea) {
      alerts.push('⚠️ Steatorrhea: Fat malabsorption — enzyme supplements ضروري');
    }

    if (patient.weightLoss > 5) {
      alerts.push(`⚠️ Weight loss: ${patient.weightLoss}kg خلال 3 أشهر — زيادة السعرات مطلوبة`);
    }

    if (patient.nutrition.route === 'parenteral') {
      alerts.push('⚠️ Parenteral nutrition: ICU monitoring + glucose monitoring ضروري');
    }

    if (patient.nutrition.route === 'enteral') {
      alerts.push('⚠️ Enteral nutrition: NJ tube preferred (لا OG/Tube)');
    }

    if (patient.nutrients) {
      if (patient.nutrients.vitaminD < 30) {
        alerts.push('⚠️ Vitamin D deficient: supplementation required');
      }
      if (patient.nutrients.zinc < 70) {
        alerts.push('⚠️ Zinc deficient: supplementation required');
      }
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

  public static createMonitoringPlan(patient: PancreatitisPatient): PancreatitisMonitoringPlan {
    return {
      labTests: [
        { test: 'Amylase/Lipase', frequency: 'كل أسبوع (acute)', target: 'تقليل → normal' },
        { test: 'Glucose', frequency: 'كل يوم (acute)', target: '< 126 mg/dL' },
        { test: 'HgbA1c', frequency: 'كل 3 أشهر', target: '< 6.5%' },
        { test: 'Vitamin A', frequency: 'كل 6 أشهر', target: '30-70 µg/dL' },
        { test: 'Vitamin D', frequency: 'كل 3 أشهر', target: '30-50 ng/mL' },
        { test: 'Vitamin E', frequency: 'كل 6 أشهر', target: '5-18 µg/mL' },
        { test: 'Vitamin K', frequency: 'كل 6 أشهر', target: '3-6 µg/L' },
        { test: 'Zinc', frequency: 'كل 6 أشهر', target: '70-150 µg/dL' },
        { test: 'Albumin', frequency: 'كل شهر', target: '> 3.5 g/dL' },
        { test: 'Triglycerides', frequency: 'كل 3 أشهر', target: '< 150 mg/dL' },
      ],
      clinical: [
        { parameter: 'Weight', frequency: 'كل أسبوع', target: 'stable أو زيادة 0.5kg/week إذا malnourished' },
        { parameter: 'Pain', frequency: 'كل يوم', target: patient.pain === 'none' ? 'none' : 'decrease' },
        { parameter: 'Steatorrhea', frequency: 'كل أسبوع', target: patient.steatorrhea ? 'decrease → none' : 'none' },
        { parameter: 'Nutrition tolerance', frequency: 'كل يوم', target: patient.nutrition.tolerance === 'good' ? 'good' : 'improve' },
        { parameter: 'Muscle mass', frequency: 'كل شهر', target: 'stable أو زيادة' },
      ],
    };
  }

  public static createTitrationPlan(patient: PancreatitisPatient): PancreatitisTitrationPlan | null {
    if (patient.weightLoss > 5 || (patient.nutrients && patient.nutrients.albumin < 3.5)) {
      return {
        increaseCalories: 100,
        increaseFat: 2,
        frequency: 'every 5-7 days',
        target: '0.3-0.5kg/week weight gain',
        monitor: 'Pain + Steatorrhea + Triglycerides',
      };
    }

    return null;
  }

  public static generatePrescription(patient: PancreatitisPatient): PancreatitisPrescription {
    if (
      isNaN(patient.weight) || isNaN(patient.height) || isNaN(patient.age) ||
      patient.weight <= 0 || patient.height <= 0 || patient.age <= 0
    ) {
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        enteral: null,
        parenteral: null,
        enzymes: null,
        meals: { mainMeals: [], mealSize: 'small', lowFat: true, noLateMeals: true },
        restrictions: [],
        alerts: ['الرجاء إدخال بيانات صحيحة للمريض (الوزن، الطول، العمر)'],
        monitoring: { labTests: [], clinical: [] },
        titration: null,
      };
    }

    const calories = this.calculateCalories(patient);
    const protein = this.calculateProtein(patient);
    const macros = this.calculateMacros(calories, protein, patient);
    const nutritionRoute = this.determineNutritionRoute(patient);
    const meals = this.createMealPlan(calories, protein, macros.carbs, macros.fat, patient);
    const enzymes = this.createEnzymePlan(patient);
    const restrictions = this.createRestrictions(patient);
    const alerts = this.createAlerts(patient);
    const monitoring = this.createMonitoringPlan(patient);
    const titration = this.createTitrationPlan(patient);

    return {
      calories,
      protein,
      carbs: macros.carbs,
      fat: macros.fat,
      enteral: nutritionRoute.enteral || null,
      parenteral: nutritionRoute.parenteral || null,
      enzymes,
      meals,
      restrictions,
      alerts,
      monitoring,
      titration,
    };
  }
}
