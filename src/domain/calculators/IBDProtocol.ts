import { BmrSelectorEngine } from './BmrSelectorEngine';
import { WeightStrategy } from './WeightStrategy';
import { DrugNutrientEngine } from '../services/DrugNutrientEngine';
import { RefeedingSyndromeMonitor } from '../monitors/RefeedingSyndromeMonitor';

export interface IBDPatient {
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female';
  diseaseType: 'crohn' | 'uc';
  phase: 'active' | 'maintenance';
  location?: 'small_bowel' | 'large_bowel' | 'both';
  severity: 'mild' | 'moderate' | 'severe';
  malabsorption: boolean;
  weightLoss: number;
  diarrhea: 'none' | 'mild' | 'moderate' | 'severe';
  bloodInStool: boolean;
  fistula: boolean;
  surgicalHistory: string[];
  medications: string[];
  nutrients: {
    iron: number;
    b12: number;
    folate: number;
    vitaminD: number;
    albumin: number;
    hgb: number;
  } | null;
}

export interface MealItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  foods: string[];
}

export interface MealPlan {
  mainMeals: MealItem[];
  snacks: MealItem[];
  mealFrequency: number;
}

export interface SupplementItem {
  dose: number;
  frequency: string;
  target: string;
}

export interface SupplementPlan {
  iron: SupplementItem | null;
  b12: SupplementItem | null;
  folate: SupplementItem | null;
  vitaminD: SupplementItem;
  calcium: SupplementItem | null;
  multivitamin: { dose: string; frequency: string };
  probiotics: { dose: string; frequency: string } | null;
}

export interface MonitoringPlan {
  labTests: { test: string; frequency: string; target: string }[];
  clinical: { parameter: string; frequency: string; target: string }[];
}

export interface TitrationPlan {
  increaseCalories: number;
  increaseProtein: number;
  frequency: string;
  target: string;
  monitor: string;
}

export interface IBDPrescription {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: MealPlan;
  restrictions: string[];
  supplements: SupplementPlan;
  alerts: string[];
  monitoring: MonitoringPlan;
  titration: TitrationPlan | null;
}

const r2 = (v: number): number => parseFloat(v.toFixed(2));

const KNOWN_DNI_MEDICATIONS: Record<string, string[]> = {
  prednisone: ['⚠️ بريدنيزون: يزيد هدم البروتين — زيادة البروتين + كالسيوم + حمض الفوليك مطلوبة'],
  steroids: ['⚠️ كورتيكوستيرويد: يزيد هدم البروتين — زيادة البروتين + كالسيوم + حمض الفوليك مطلوبة'],
  budesonide: ['⚠️ بوديزونيد: يزيد هدم البروتين — مراقبة كثافة العظام'],
  azathioprine: ['⚠️ أزاثيوبرين: تجنب الكحول — مراقبة وظائف الكبد'],
  mercaptopurine: ['⚠️ ميركابتوبيورين: تجنب الكحول — مراقبة وظائف الكبد'],
  methotrexate: ['⚠️ ميثوتريكسات: حمض الفوليك مطلوب — تجنب الكحول'],
  infliximab: ['⚠️ إنفليكسيماب: لا توجد تفاعلات غذائية كبيرة — استمرار التغذية الطبيعية'],
  adalimumab: ['⚠️ أداليموماب: لا توجد تفاعلات غذائية كبيرة — استمرار التغذية الطبيعية'],
  vedolizumab: ['⚠️ فيدوليزوماب: لا توجد تفاعلات غذائية كبيرة — استمرار التغذية الطبيعية'],
  mesalamine: ['⚠️ ميسالامين: تناوله مع الطعام لتقليل الآثار الجانبية المعدية'],
  sulfasalazine: ['⚠️ سلفاسالازين: حمض الفوليك مطلوب — قد يسبب نقص حمض الفوليك'],
  ciprofloxacin: ['⚠️ سيبروفلوكساسين: تجنب منتجات الألبان في نفس الوقت — تناوله على معدة فارغة'],
  metronidazole: ['⚠️ ميترونيدازول: تجنب الكحول — قد يسبب غثيان'],
};

export class IBDProtocol {
  public static calculateCalories(patient: IBDPatient): number {
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
      population: patient.phase === 'active' ? 'chronic_disease' : 'standard',
    });

    if (!ree.isSafe) return 1500;

    const activityFactor = 1.2;

    let stressFactor: number;
    if (patient.phase === 'active') {
      if (patient.severity === 'severe') {
        stressFactor = 1.5;
      } else if (patient.severity === 'moderate') {
        stressFactor = 1.3;
      } else {
        stressFactor = 1.2;
      }
    } else {
      stressFactor = 1.0;
    }

    if (patient.malabsorption) {
      stressFactor *= 1.1;
    }

    let calories = Math.round(ree.ree * activityFactor * stressFactor);

    if (patient.weightLoss > 5) {
      calories += 200;
    }

    if (calories < 1500) calories = 1500;
    if (calories > 3500) calories = 3500;

    return calories;
  }

  public static calculateProtein(patient: IBDPatient): number {
    if (isNaN(patient.weight) || patient.weight <= 0) return 60;

    const weightResult = WeightStrategy.select({
      actualWeightKg: patient.weight,
      heightCm: patient.height,
      gender: patient.gender,
      condition: 'chronic_disease',
    });

    const effectiveWeight = weightResult.selectedWeightKg > 0 ? weightResult.selectedWeightKg : patient.weight;

    let proteinPerKg: number;

    if (patient.phase === 'active') {
      if (patient.severity === 'severe') {
        proteinPerKg = 1.5;
      } else if (patient.severity === 'moderate') {
        proteinPerKg = 1.3;
      } else {
        proteinPerKg = 1.2;
      }
    } else {
      proteinPerKg = 1.0;
    }

    const medsLower = patient.medications.map((m) => m.toLowerCase());
    if (medsLower.some((m) => m.includes('steroids') || m.includes('prednisone'))) {
      proteinPerKg += 0.2;
    }

    if (patient.malabsorption) {
      proteinPerKg += 0.2;
    }

    let protein = Math.round(effectiveWeight * proteinPerKg);

    if (protein < 60) protein = 60;
    if (protein > 150) protein = 150;

    return protein;
  }

  public static calculateMacros(calories: number, protein: number, patient: IBDPatient): { carbs: number; fat: number } {
    if (isNaN(calories) || isNaN(protein) || calories <= 0 || protein <= 0) {
      return { carbs: 0, fat: 0 };
    }

    const proteinCalories = protein * 4;

    if (proteinCalories >= calories) {
      return {
        carbs: Math.round((calories * 0.55) / 4),
        fat: Math.round((calories * 0.30) / 9),
      };
    }

    const nonProteinCalories = calories - proteinCalories;

    const carbsPercent = patient.diarrhea === 'severe' ? 0.45 : 0.50;
    const fatPercent = patient.malabsorption ? 0.35 : 0.30;

    const carbsCalories = nonProteinCalories * carbsPercent / (carbsPercent + fatPercent);
    const fatCalories = nonProteinCalories * fatPercent / (carbsPercent + fatPercent);

    const carbs = Math.round(carbsCalories / 4);
    const fat = Math.round(fatCalories / 9);

    return { carbs, fat };
  }

  public static createMealPlan(calories: number, protein: number, carbs: number, fat: number, patient: IBDPatient): MealPlan {
    if (isNaN(calories) || isNaN(protein) || calories <= 0 || protein <= 0) {
      return { mainMeals: [], snacks: [], mealFrequency: 5 };
    }

    const safeCarbs = isNaN(carbs) || carbs <= 0 ? Math.round((calories * 0.50) / 4) : carbs;
    const safeFat = isNaN(fat) || fat <= 0 ? Math.round((calories * 0.30) / 9) : fat;
    const isLowResidue = patient.phase === 'active';

    const mealFrequency = patient.diarrhea === 'severe' ? 6 : 5;

    return {
      mainMeals: [
        {
          name: 'وجبة صباحية',
          calories: Math.round(calories * 0.25),
          protein: Math.round(protein * 0.25),
          carbs: Math.round(safeCarbs * 0.25),
          fat: Math.round(safeFat * 0.25),
          foods: isLowResidue
            ? ['بيض مسلوق', 'أرز أبيض', 'زبادي', 'خضار مسلوقة (غير ورقية)']
            : ['بيض مسلوق', 'خبز كامل', 'فواكه', 'خضار'],
        },
        {
          name: 'وجبة منتصف النهار',
          calories: Math.round(calories * 0.30),
          protein: Math.round(protein * 0.30),
          carbs: Math.round(safeCarbs * 0.30),
          fat: Math.round(safeFat * 0.30),
          foods: isLowResidue
            ? ['سمك أبيض', 'أرز', 'خضار مسلوقة', 'زبادي']
            : ['سمك', 'أرز كامل', 'خضار طازجة', 'فواكه'],
        },
        {
          name: 'وجبة مسائية',
          calories: Math.round(calories * 0.25),
          protein: Math.round(protein * 0.25),
          carbs: Math.round(safeCarbs * 0.25),
          fat: Math.round(safeFat * 0.25),
          foods: isLowResidue
            ? ['دجاج', 'بطاطس مسلوقة', 'خضار مسلوقة', 'فواكه']
            : ['دجاج', 'بطاطس', 'خضار', 'فواكه'],
        },
      ],
      snacks: [
        {
          name: 'وجبة خفيفة الصباح',
          calories: Math.round(calories * 0.10),
          protein: Math.round(protein * 0.10),
          carbs: Math.round(safeCarbs * 0.10),
          fat: Math.round(safeFat * 0.10),
          foods: isLowResidue ? ['زبادي', 'فواكه'] : ['فواكه', 'حبوب كاملة'],
        },
        {
          name: 'وجبة خفيفة مسائية',
          calories: Math.round(calories * 0.10),
          protein: Math.round(protein * 0.10),
          carbs: Math.round(safeCarbs * 0.10),
          fat: Math.round(safeFat * 0.10),
          foods: isLowResidue ? ['زبادي', 'خضار مسلوقة'] : ['خضار', 'حبوب'],
        },
      ],
      mealFrequency,
    };
  }

  public static createRestrictions(patient: IBDPatient): string[] {
    const restrictions: string[] = [];

    if (patient.phase === 'active') {
      restrictions.push('⚠️ Low residue: تجنب الحبوب الكاملة، البقول، الخضار الورقية');
      restrictions.push('⚠️ تجنب الفواكه بقشرها — استهلاك الفواكه بدون قشر');
    }

    if (patient.diarrhea !== 'none') {
      restrictions.push('⚠️ Low fat: تجنب الأطعمة الدهنية، الوجبات السريعة');
    }

    if (patient.malabsorption) {
      restrictions.push('⚠️ Low fat: تجنب الدهون — malabsorption fat');
    }

    restrictions.push('⚠️ تجنب الكحول — يزيد التهاب الأمعاء');
    restrictions.push('⚠️ تجنب الكافيين العالي — يزيد diarrhea');
    restrictions.push('⚠️ تجنب الأطعمة المقلية — irritate الأمعاء');

    if (patient.diseaseType === 'crohn' && patient.location === 'small_bowel') {
      restrictions.push('⚠️ Low fiber: تجنب الحبوب الكاملة، البقول — خطر obstruction');
    }

    if (patient.diseaseType === 'uc' && patient.bloodInStool) {
      restrictions.push('⚠️ تجنب الأطعمة الحارة — irritate الأمعاء');
    }

    return restrictions;
  }

  public static createSupplementPlan(patient: IBDPatient): SupplementPlan {
    const iron = patient.nutrients && patient.nutrients.hgb < 12
      ? { dose: 50, frequency: 'كل يوم', target: 'Hgb > 12 g/dL' }
      : null;

    const b12 = patient.diseaseType === 'crohn' && patient.malabsorption && patient.nutrients && patient.nutrients.b12 < 300
      ? { dose: 1000, frequency: 'كل يوم', target: 'B12 > 300 pg/mL' }
      : null;

    const medsLower = patient.medications.map((m) => m.toLowerCase());
    const onSteroids = medsLower.some((m) => m.includes('steroids') || m.includes('prednisone'));

    const folate = onSteroids
      ? { dose: 1, frequency: 'كل يوم', target: 'Folate > 3 ng/mL' }
      : null;

    const vitaminD = patient.nutrients && patient.nutrients.vitaminD < 30
      ? { dose: 1000, frequency: 'كل يوم', target: '30-50 ng/mL' }
      : { dose: 600, frequency: 'كل يوم', target: '30-50 ng/mL' };

    const calcium = onSteroids
      ? { dose: 1000, frequency: 'كل يوم', target: 'adequate bone health' }
      : null;

    const multivitamin = { dose: '1 tablet', frequency: 'كل يوم' };

    const probiotics = patient.diseaseType === 'uc'
      ? { dose: '1-2 capsules', frequency: 'كل يوم' }
      : null;

    return { iron, b12, folate, vitaminD, calcium, multivitamin, probiotics };
  }

  public static createAlerts(patient: IBDPatient): string[] {
    const alerts: string[] = [];

    alerts.push('⚠️ متابعة تغذوية منتظمة مطلوبة لمرضى التهاب الأمعاء');

    if (isNaN(patient.weightLoss) || (patient.nutrients && (isNaN(patient.nutrients.hgb) || isNaN(patient.nutrients.albumin)))) {
      alerts.push('⚠️ بعض القيم المخبرية غير صالحة — يرجى التحقق من المدخلات');
    }

    if (patient.weightLoss > 5) {
      alerts.push(`⚠️ Weight loss: ${patient.weightLoss}kg خلال 3 أشهر — زيادة السعرات مطلوبة`);
    }

    if (patient.nutrients && patient.nutrients.hgb < 12) {
      alerts.push(`⚠️ Anemia: Hgb ${patient.nutrients.hgb} g/dL — Iron supplementation required`);
    }

    if (patient.malabsorption) {
      alerts.push('⚠️ Malabsorption: Nutrient supplements مطلوبة (B12, Iron, Vitamin D)');
    }

    if (patient.fistula) {
      alerts.push('⚠️ Fistula: Low residue + High protein required');
    }

    const medsLower = patient.medications.map((m) => m.toLowerCase());
    if (medsLower.some((m) => m.includes('steroids') || m.includes('prednisone'))) {
      alerts.push('⚠️ Steroids: Protein + Calcium + Folate مطلوبة');
    }

    if (patient.diarrhea === 'severe') {
      alerts.push('⚠️ Diarrhea severe: وجبات صغيرة (6/يوم) + Low fat');
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

  public static createMonitoringPlan(patient: IBDPatient): MonitoringPlan {
    return {
      labTests: [
        { test: 'Hgb (CBC)', frequency: 'كل شهر', target: '> 12 g/dL' },
        { test: 'Iron', frequency: 'كل 3 أشهر', target: '70-150 µg/dL' },
        { test: 'B12', frequency: 'كل 6 أشهر', target: '> 300 pg/mL' },
        { test: 'Folate', frequency: 'كل 6 أشهر', target: '> 3 ng/mL' },
        { test: 'Vitamin D', frequency: 'كل 3 أشهر', target: '30-50 ng/mL' },
        { test: 'Albumin', frequency: 'كل شهر', target: '> 3.5 g/dL' },
        { test: 'CRP/ESR', frequency: 'كل شهر', target: 'تقليل (active → maintenance)' },
      ],
      clinical: [
        { parameter: 'Weight', frequency: 'كل أسبوع', target: 'stable أو زيادة 0.5kg/week إذا malnourished' },
        { parameter: 'Diarrhea frequency', frequency: 'كل يوم', target: patient.diarrhea === 'none' ? '0-2/يوم' : 'decrease' },
        { parameter: 'Blood in stool', frequency: 'كل أسبوع', target: patient.bloodInStool ? 'decrease → none' : 'none' },
        { parameter: 'Muscle mass', frequency: 'كل شهر', target: 'stable أو زيادة' },
        { parameter: 'Phase', frequency: 'كل شهر', target: patient.phase === 'maintenance' ? 'maintenance' : 'active → maintenance' },
      ],
    };
  }

  public static createTitrationPlan(patient: IBDPatient): TitrationPlan | null {
    if (patient.weightLoss > 5 || (patient.nutrients && patient.nutrients.albumin < 3.5)) {
      return {
        increaseCalories: 150,
        increaseProtein: 10,
        frequency: 'every 3-5 days',
        target: '0.5kg/week weight gain',
        monitor: 'Diarrhea + Nutrient levels',
      };
    }

    return null;
  }

  public static generatePrescription(patient: IBDPatient): IBDPrescription {
    if (
      isNaN(patient.weight) || isNaN(patient.height) || isNaN(patient.age) ||
      patient.weight <= 0 || patient.height <= 0 || patient.age <= 0
    ) {
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        meals: { mainMeals: [], snacks: [], mealFrequency: 5 },
        restrictions: [],
        supplements: {
          iron: null, b12: null, folate: null,
          vitaminD: { dose: 600, frequency: 'كل يوم', target: '30-50 ng/mL' },
          calcium: null,
          multivitamin: { dose: '1 tablet', frequency: 'كل يوم' },
          probiotics: null,
        },
        alerts: ['الرجاء إدخال بيانات صحيحة للمريض (الوزن، الطول، العمر)'],
        monitoring: { labTests: [], clinical: [] },
        titration: null,
      };
    }

    if (patient.weight < 50 || (patient.nutrients && patient.nutrients.albumin < 3.5)) {
      const refeedResult = RefeedingSyndromeMonitor.evaluateRefeedingRisk({
        serumPhosphorus: 3.5,
        serumPotassium: 4.0,
        serumMagnesium: 2.0,
        daysOfStarvationOrSevereMalnutrition: patient.nutrients && patient.nutrients.albumin < 3.5 ? 5 : 0,
        plannedInitialCalories: 1500,
        weightKg: patient.weight,
      });

      if (refeedResult.riskTier === 'critical') {
        throw new Error('⚠️ خطر Refeeding Syndrome — Electrolytes مطلوبة قبل البدء');
      }
    }

    const calories = this.calculateCalories(patient);
    const protein = this.calculateProtein(patient);
    const macros = this.calculateMacros(calories, protein, patient);
    const meals = this.createMealPlan(calories, protein, macros.carbs, macros.fat, patient);
    const restrictions = this.createRestrictions(patient);
    const supplements = this.createSupplementPlan(patient);
    const alerts = this.createAlerts(patient);
    const monitoring = this.createMonitoringPlan(patient);
    const titration = this.createTitrationPlan(patient);

    return {
      calories,
      protein,
      carbs: macros.carbs,
      fat: macros.fat,
      meals,
      restrictions,
      supplements,
      alerts,
      monitoring,
      titration,
    };
  }
}
