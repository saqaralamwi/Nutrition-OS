import { BmrSelectorEngine } from './BmrSelectorEngine';
import { WeightStrategy } from './WeightStrategy';
import { RefeedingSyndromeMonitor } from '../monitors/RefeedingSyndromeMonitor';

export type AscitesGrade = 'none' | 'mild' | 'moderate' | 'severe';
export type EdemaGrade = 'none' | 'mild' | 'moderate' | 'severe';
export type EncephalopathyGrade = 'none' | 'grade1' | 'grade2' | 'grade3' | 'grade4';

export interface CirrhosisPatient {
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female';
  childPughScore: number;
  ascites: AscitesGrade;
  edema: EdemaGrade;
  encephalopathy: EncephalopathyGrade;
  albumin: number;
  bilirubin: number;
  INR: number;
  sodium: number;
  creatinine: number;
  medications: string[];
  electrolytes: {
    potassium: number;
    phosphorus: number;
    magnesium: number;
  } | null;
}

export interface MealItem {
  name: string;
  calories: number;
  protein: number;
  carbs?: number;
  fat?: number;
  sodium: number;
  foods: string[];
}

export interface MealPlan {
  mainMeals: MealItem[];
  snacks: MealItem[];
  fluidRestriction: number | null;
}

export interface SupplementItem {
  dose: number;
  frequency: string;
  target: string;
}

export interface SupplementPlan {
  zinc: SupplementItem | null;
  vitaminD: SupplementItem | null;
  vitaminK: SupplementItem | null;
  multivitamin: { dose: string; frequency: string } | null;
}

export interface MonitoringLab {
  test: string;
  frequency: string;
  target: string;
}

export interface MonitoringClinical {
  parameter: string;
  frequency: string;
  target: string;
}

export interface MonitoringPlan {
  labTests: MonitoringLab[];
  clinical: MonitoringClinical[];
}

export interface TitrationPlan {
  increaseCalories: number;
  increaseProtein: number;
  frequency: string;
  target: string;
  monitor: string;
}

export interface CirrhosisPrescription {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium: number;
  meals: MealPlan;
  supplements: SupplementPlan;
  alerts: string[];
  monitoring: MonitoringPlan;
  titration: TitrationPlan | null;
}

const r2 = (v: number): number => parseFloat(v.toFixed(2));

const KNOWN_DNI_MEDICATIONS: Record<string, string[]> = {
  spironolactone: ['⚠️ سبيرونولاكتون: مراقبة البوتاسيوم — تجنب الإفراط في الأطعمة الغنية بالبوتاسيوم'],
  furosemide: ['⚠️ فوروسيميد: مراقبة البوتاسيوم والمغنيسيوم — تعويض الشوارد عند الحاجة'],
  propranolol: ['⚠️ بروبرانولول: تناوله مع الطعام لتقليل الآثار الجانبية المعدية'],
  lactulose: ['⚠️ لاكتولوز: مراقبة الشوارد والسوائل — قد يسبب إسهالاً وفقدان بوتاسيوم'],
  rifaximin: ['⚠️ ريفاكسيمين: لا توجد تفاعلات غذائية كبيرة — استمرار التغذية الطبيعية'],
  octreotide: ['⚠️ أوكتريوتيد: مراقبة سكر الدم — قد يؤثر على إفراز الإنسولين'],
  terlipressin: ['⚠️ تيرليبريسين: مراقبة الشوارد — قد يسبب نقص صوديوم'],
  warfarin: ['⚠️ وارفارين: تجنب التقلبات في فيتامين ك — INR مرتفع، حافظ على ثبات تناول فيتامين ك'],
  norfloxacin: ['⚠️ نورفلوكساسين: تناوله على معدة فارغة — تجنب منتجات الألبان في نفس الوقت'],
};

export class CirrhosisProtocol {
  public static calculateCalories(patient: CirrhosisPatient): number {
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
    if (patient.childPughScore >= 10) {
      stressFactor = 1.5;
    } else if (patient.childPughScore >= 7) {
      stressFactor = 1.3;
    } else {
      stressFactor = 1.2;
    }

    let calories = Math.round(ree.ree * activityFactor * stressFactor);

    if (calories < 1500) calories = 1500;
    if (calories > 3500) calories = 3500;

    return calories;
  }

  public static calculateProtein(patient: CirrhosisPatient): number {
    if (isNaN(patient.weight) || patient.weight <= 0) return 60;

    const weightResult = WeightStrategy.select({
      actualWeightKg: patient.weight,
      heightCm: patient.height,
      gender: patient.gender,
      condition: 'chronic_disease',
    });

    const effectiveWeight = weightResult.selectedWeightKg > 0 ? weightResult.selectedWeightKg : patient.weight;

    let proteinPerKg: number;

    if (patient.encephalopathy === 'none') {
      proteinPerKg = patient.childPughScore >= 7 ? 1.5 : 1.2;
    } else if (patient.encephalopathy === 'grade1' || patient.encephalopathy === 'grade2') {
      proteinPerKg = 1.2;
    } else {
      proteinPerKg = 1.0;
    }

    let protein = Math.round(effectiveWeight * proteinPerKg);

    if (protein < 60) protein = 60;
    if (protein > 150) protein = 150;

    return protein;
  }

  public static calculateMacros(calories: number, protein: number): { carbs: number; fat: number } {
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

    const carbsPercent = 0.55;
    const fatPercent = 0.30;

    const carbsCalories = nonProteinCalories * carbsPercent / (carbsPercent + fatPercent);
    const fatCalories = nonProteinCalories * fatPercent / (carbsPercent + fatPercent);

    const carbs = Math.round(carbsCalories / 4);
    const fat = Math.round(fatCalories / 9);

    return { carbs, fat };
  }

  public static calculateSodium(patient: CirrhosisPatient): number {
    if (patient.ascites !== 'none' || patient.edema !== 'none') {
      return 2000;
    }
    return 2500;
  }

  public static createMealPlan(
    calories: number, protein: number, carbs: number, fat: number, sodium: number,
    ascites: AscitesGrade,
  ): MealPlan {
    if (isNaN(calories) || isNaN(protein) || calories <= 0 || protein <= 0) {
      return { mainMeals: [], snacks: [], fluidRestriction: null };
    }

    const safeCarbs = isNaN(carbs) || carbs <= 0 ? Math.round((calories * 0.55) / 4) : carbs;
    const safeFat = isNaN(fat) || fat <= 0 ? Math.round((calories * 0.30) / 9) : fat;

    const fluidRestriction = ascites === 'severe' ? 1500 : null;

    return {
      mainMeals: [
        {
          name: 'وجبة صباحية',
          calories: Math.round(calories * 0.25),
          protein: Math.round(protein * 0.25),
          carbs: Math.round(safeCarbs * 0.25),
          fat: Math.round(safeFat * 0.25),
          sodium: Math.round(sodium * 0.25),
          foods: ['بيض مسلوق', 'خبز غير مملح', 'فواكه', 'خضار طازجة'],
        },
        {
          name: 'وجبة منتصف النهار',
          calories: Math.round(calories * 0.30),
          protein: Math.round(protein * 0.30),
          carbs: Math.round(safeCarbs * 0.30),
          fat: Math.round(safeFat * 0.30),
          sodium: Math.round(sodium * 0.30),
          foods: ['سمك أبيض', 'أرز', 'خضار مسلوقة', 'زبادي غير مملح'],
        },
        {
          name: 'وجبة مسائية',
          calories: Math.round(calories * 0.25),
          protein: Math.round(protein * 0.25),
          carbs: Math.round(safeCarbs * 0.25),
          fat: Math.round(safeFat * 0.25),
          sodium: Math.round(sodium * 0.25),
          foods: ['دجاج', 'بطاطس', 'خضار', 'فواكه'],
        },
      ],
      snacks: [
        {
          name: 'وجبة خفيفة الصباح',
          calories: Math.round(calories * 0.10),
          protein: Math.round(protein * 0.10),
          sodium: Math.round(sodium * 0.10),
          foods: ['فواكه', 'زبادي'],
        },
        {
          name: 'وجبة خفيفة مسائية',
          calories: Math.round(calories * 0.10),
          protein: Math.round(protein * 0.10),
          sodium: Math.round(sodium * 0.10),
          foods: ['خضار', 'حبوب كاملة غير مملحة'],
        },
      ],
      fluidRestriction,
    };
  }

  public static createSupplementPlan(patient: CirrhosisPatient): SupplementPlan {
    const zinc: SupplementItem = {
      dose: 25,
      frequency: 'كل يوم',
      target: '70-150 µg/dL',
    };

    const vitaminD: SupplementItem = {
      dose: 1000,
      frequency: 'كل يوم',
      target: '30-50 ng/mL',
    };

    const vitaminK: SupplementItem | null = patient.INR > 1.5
      ? { dose: 5, frequency: 'كل يوم', target: 'INR < 1.5' }
      : null;

    const multivitamin: { dose: string; frequency: string } = {
      dose: '1 قرص',
      frequency: 'كل يوم',
    };

    return { zinc, vitaminD, vitaminK, multivitamin };
  }

  public static createAlerts(patient: CirrhosisPatient): string[] {
    const alerts: string[] = [];

    if (isNaN(patient.albumin) || isNaN(patient.bilirubin) || isNaN(patient.INR) || isNaN(patient.sodium) || isNaN(patient.creatinine)) {
      alerts.push('⚠️ بعض القيم المخبرية غير صالحة — يرجى التحقق من المدخلات');
    }

    if (patient.encephalopathy === 'grade3' || patient.encephalopathy === 'grade4') {
      alerts.push('⚠️ بروتين: استخدام 1.0 غ/كغ بحذر (اعتلال دماغي حاد — خطر زيادة)');
    }

    if (patient.ascites !== 'none') {
      alerts.push(`⚠️ صوديوم: محدود < 2 غ/يوم (استسقاء: ${patient.ascites})`);
    }

    if (patient.ascites === 'severe') {
      alerts.push('⚠️ سوائل: محدود < 1500 مل/يوم (استسقاء شديد)');
    }

    if (patient.INR > 1.5) {
      alerts.push('⚠️ فيتامين K: INR مرتفع — تعويض فيتامين K مطلوب');
    }

    alerts.push('🚫 كحول: ممنوع تماماً — يزيد تلف الكبد');

    alerts.push('⚠️ مسهلات: تجنب المسهلات القوية — خطر الاعتلال الدماغي الكبدي');

    if (patient.albumin < 3.0) {
      alerts.push('⚠️ ألبومين منخفض: خطر سوء التغذية — دعم بروتيني مكثف ومراقبة الوذمة');
    }

    if (patient.sodium < 130) {
      alerts.push('⚠️ صوديوم منخفض جداً (نقص صوديوم): مراقبة صارمة — خطر الاعتلال الدماغي');
    }

    if (patient.creatinine > 1.5) {
      alerts.push('⚠️ كرياتينين مرتفع: خطر متلازمة الكبد الكلوي — مراقبة وظائف الكلى');
    }

    if (patient.bilirubin > 5.0) {
      alerts.push('⚠️ بيليروبين مرتفع جداً: تقييم الحاجة للتدخل الطبي العاجل');
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

  public static createMonitoringPlan(patient: CirrhosisPatient): MonitoringPlan {
    const encephalopathyTarget = patient.encephalopathy === 'none' ? 'لا يوجد' : 'تقليل الدرجة';

    return {
      labTests: [
        { test: 'Albumin', frequency: 'كل شهر', target: '> 3.5 g/dL' },
        { test: 'Bilirubin', frequency: 'كل شهر', target: 'تقليل تدريجي' },
        { test: 'INR', frequency: 'كل شهر', target: '< 1.5' },
        { test: 'Sodium', frequency: 'كل شهر', target: '135-145 mmol/L' },
        { test: 'Creatinine', frequency: 'كل شهر', target: '< 1.2 mg/dL' },
        { test: 'Vitamin D', frequency: 'كل 3 أشهر', target: '30-50 ng/mL' },
        { test: 'Zinc', frequency: 'كل 6 أشهر', target: '70-150 µg/dL' },
        { test: 'CBC', frequency: 'كل شهر', target: 'مستقر' },
      ],
      clinical: [
        { parameter: 'Weight', frequency: 'كل أسبوع', target: 'ثابت أو زيادة 0.5 كغ/أسبوع إذا كان سوء تغذية' },
        { parameter: 'Muscle mass', frequency: 'كل شهر', target: 'ثابت أو زيادة' },
        { parameter: 'Ascites', frequency: 'كل أسبوع', target: 'لا زيادة أو نقصان' },
        { parameter: 'Edema', frequency: 'كل أسبوع', target: 'لا زيادة أو نقصان' },
        { parameter: 'Encephalopathy', frequency: 'كل أسبوع', target: encephalopathyTarget },
        { parameter: 'Fluid intake', frequency: 'كل يوم', target: patient.ascites === 'severe' ? '< 1500 مل/يوم' : 'كافٍ' },
      ],
    };
  }

  public static createTitrationPlan(patient: CirrhosisPatient): TitrationPlan | null {
    if (patient.childPughScore >= 10 || patient.albumin < 3.0) {
      return {
        increaseCalories: 100,
        increaseProtein: 5,
        frequency: 'كل 5-7 أيام',
        target: 'زيادة وزن 0.3-0.5 كغ/أسبوع',
        monitor: 'الاعتلال الدماغي + الاستسقاء + الوذمة',
      };
    }

    return null;
  }

  public static checkRefeedingRisk(patient: CirrhosisPatient): { isHighRisk: boolean; message: string } {
    if (patient.electrolytes) {
      const refeedResult = RefeedingSyndromeMonitor.evaluateRefeedingRisk({
        serumPhosphorus: patient.electrolytes.phosphorus,
        serumPotassium: patient.electrolytes.potassium,
        serumMagnesium: patient.electrolytes.magnesium,
        daysOfStarvationOrSevereMalnutrition: patient.albumin < 3.0 ? 5 : 0,
        plannedInitialCalories: 1500,
        weightKg: patient.weight,
      });

      if (refeedResult.riskTier === 'critical') {
        return {
          isHighRisk: true,
          message: '⚠️ خطر متلازمة إعادة التغذية — يجب تصحيح الشوارد قبل البدء بالتغذية',
        };
      }
    }

    if (patient.weight < 50 && (patient.albumin < 3.0 || patient.childPughScore >= 10)) {
      return {
        isHighRisk: true,
        message: '⚠️ خطر متلازمة إعادة التغذية — وزن منخفض وألبومين منخفض. مطلوب فحص الشوارد قبل البدء',
      };
    }

    return { isHighRisk: false, message: '' };
  }

  public static generatePrescription(patient: CirrhosisPatient): CirrhosisPrescription {
    if (
      isNaN(patient.weight) || isNaN(patient.height) || isNaN(patient.age) ||
      patient.weight <= 0 || patient.height <= 0 || patient.age <= 0
    ) {
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        sodium: 0,
        meals: { mainMeals: [], snacks: [], fluidRestriction: null },
        supplements: { zinc: null, vitaminD: null, vitaminK: null, multivitamin: null },
        alerts: ['الرجاء إدخال بيانات صحيحة للمريض (الوزن، الطول، العمر)'],
        monitoring: { labTests: [], clinical: [] },
        titration: null,
      };
    }

    const refeedCheck = this.checkRefeedingRisk(patient);
    const alertsFromNutrition: string[] = [];
    if (refeedCheck.isHighRisk) {
      alertsFromNutrition.push(refeedCheck.message);
    }

    const calories = this.calculateCalories(patient);
    const protein = this.calculateProtein(patient);
    const macros = this.calculateMacros(calories, protein);
    const sodium = this.calculateSodium(patient);
    const meals = this.createMealPlan(calories, protein, macros.carbs, macros.fat, sodium, patient.ascites);
    const supplements = this.createSupplementPlan(patient);
    const alerts = [...alertsFromNutrition, ...this.createAlerts(patient)];
    const monitoring = this.createMonitoringPlan(patient);
    const titration = this.createTitrationPlan(patient);

    return {
      calories,
      protein,
      carbs: macros.carbs,
      fat: macros.fat,
      sodium,
      meals,
      supplements,
      alerts,
      monitoring,
      titration,
    };
  }
}
