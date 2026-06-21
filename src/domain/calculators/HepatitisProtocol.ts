import { BmrSelectorEngine } from './BmrSelectorEngine';
import { WeightStrategy } from './WeightStrategy';
import { DrugNutrientEngine } from '../services/DrugNutrientEngine';
import { RefeedingSyndromeMonitor } from '../monitors/RefeedingSyndromeMonitor';

export type HepatitisStage = 'acute' | 'chronic' | 'cirrhosis';

export interface HepatitisPatient {
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female';
  stage: HepatitisStage;
  albumin: number;
  bilirubin: number;
  INR: number;
  childPughScore?: number;
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
  foods: string[];
}

export interface MealPlan {
  mainMeals: MealItem[];
  snacks: MealItem[];
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
  frequency: string;
  target: string;
  monitor: string;
}

export interface HepatitisPrescription {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: MealPlan;
  alerts: string[];
  monitoring: MonitoringPlan;
  titration: TitrationPlan | null;
}

const r2 = (v: number): number => parseFloat(v.toFixed(2));

const KNOWN_DNI_MEDICATIONS: Record<string, string[]> = {
  warfarin: ['⚠️ وارفارين: تجنب التقلبات في فيتامين ك — حافظ على ثبات تناول الخضروات الورقية'],
  methotrexate: ['⚠️ ميثوتريكسيت: حمض الفوليك قد يتأثر — مراقبة مستويات الفولات وتعويض إذا لزم'],
  interferon: ['⚠️ إنترفيرون: دعم غذائي مكثف — بروتين إضافي لمكافحة الإرهاق والهزال'],
  ribavirin: ['⚠️ ريبافيرين: قد يسبب فقر الدم الانحلالي — مراقبة الحديد والهيموغلوبين'],
  tenofovir: ['⚠️ تينوفوفير: مراقبة وظائف الكلى والفسفور — خطر اعتلال أنبوبي كلوي'],
  entecavir: ['⚠️ إنتيكافير: آمن غذائياً — لا توجد تفاعلات دوائية غذائية معروفة'],
  sofosbuvir: ['⚠️ سوفوسبوفير: آمن غذائياً — استمرار التغذية المتوازنة'],
  lactulose: ['⚠️ لاكتولوز: مراقبة الشوارد والسوائل — قد يسبب إسهالاً وفقدان بوتاسيوم'],
  rifaximin: ['⚠️ ريفاكسيمين: لا توجد تفاعلات غذائية كبيرة — استمرار التغذية الطبيعية'],
  spironolactone: ['⚠️ سبيرونولاكتون: مراقبة البوتاسيوم — تجنب الإفراط في الأطعمة الغنية بالبوتاسيوم'],
  furosemide: ['⚠️ فوروسيميد: مراقبة البوتاسيوم والمغنيسيوم — تعويض الشوارد عند الحاجة'],
  propranolol: ['⚠️ بروبرانولول: تناوله مع الطعام لتقليل الآثار الجانبية المعدية'],
  octreotide: ['⚠️ أوكتريوتيد: مراقبة سكر الدم — قد يؤثر على إفراز الإنسولين'],
};

export class HepatitisProtocol {
  public static calculateCalories(patient: HepatitisPatient): number {
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

    const activityFactor = patient.stage === 'acute' ? 1.2 : 1.3;

    let stressFactor = 1.0;
    if (patient.stage === 'cirrhosis' && patient.childPughScore !== undefined && patient.childPughScore >= 7) {
      stressFactor = 1.5;
    }

    let calories = Math.round(ree.ree * activityFactor * stressFactor);

    if (calories < 1500) calories = 1500;
    if (calories > 3500) calories = 3500;

    return calories;
  }

  public static calculateProtein(patient: HepatitisPatient): number {
    if (isNaN(patient.weight) || patient.weight <= 0) return 60;

    const weightResult = WeightStrategy.select({
      actualWeightKg: patient.weight,
      heightCm: patient.height,
      gender: patient.gender,
      condition: 'chronic_disease',
    });

    const effectiveWeight = weightResult.selectedWeightKg > 0 ? weightResult.selectedWeightKg : patient.weight;

    let proteinPerKg: number;

    if (patient.stage === 'acute') {
      proteinPerKg = 1.2;
    } else if (patient.stage === 'chronic') {
      proteinPerKg = 1.2;
    } else {
      if (patient.childPughScore !== undefined && patient.childPughScore >= 7) {
        proteinPerKg = 1.2;
      } else {
        proteinPerKg = 1.5;
      }
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

  public static createMealPlan(calories: number, protein: number, carbs: number, fat: number): MealPlan {
    if (isNaN(calories) || isNaN(protein) || calories <= 0 || protein <= 0) {
      return {
        mainMeals: [],
        snacks: [],
      };
    }

    const safeCarbs = isNaN(carbs) || carbs <= 0 ? Math.round((calories * 0.55) / 4) : carbs;
    const safeFat = isNaN(fat) || fat <= 0 ? Math.round((calories * 0.30) / 9) : fat;

    return {
      mainMeals: [
        {
          name: 'وجبة صباحية',
          calories: Math.round(calories * 0.25),
          protein: Math.round(protein * 0.25),
          carbs: Math.round(safeCarbs * 0.25),
          fat: Math.round(safeFat * 0.25),
          foods: ['بيض مسلوق', 'خبز كامل', 'فواكه', 'خضار'],
        },
        {
          name: 'وجبة منتصف النهار',
          calories: Math.round(calories * 0.30),
          protein: Math.round(protein * 0.30),
          carbs: Math.round(safeCarbs * 0.30),
          fat: Math.round(safeFat * 0.30),
          foods: ['سمك أبيض', 'أرز كامل', 'خضار مسلوقة', 'زبادي'],
        },
        {
          name: 'وجبة مسائية',
          calories: Math.round(calories * 0.25),
          protein: Math.round(protein * 0.25),
          carbs: Math.round(safeCarbs * 0.25),
          fat: Math.round(safeFat * 0.25),
          foods: ['دجاج', 'بطاطس', 'خضار', 'فواكه'],
        },
      ],
      snacks: [
        {
          name: 'وجبة خفيفة الصباح',
          calories: Math.round(calories * 0.10),
          protein: Math.round(protein * 0.10),
          foods: ['فواكه', 'زبادي'],
        },
        {
          name: 'وجبة خفيفة مسائية',
          calories: Math.round(calories * 0.10),
          protein: Math.round(protein * 0.10),
          foods: ['خضار', 'حبوب كاملة'],
        },
      ],
    };
  }

  public static createAlerts(patient: HepatitisPatient): string[] {
    const alerts: string[] = [];

    if (isNaN(patient.albumin) || isNaN(patient.bilirubin) || isNaN(patient.INR)) {
      alerts.push('⚠️ بعض القيم المخبرية غير صالحة — يرجى التحقق من الألبومين، البيليروبين، و INR');
    }

    alerts.push('⚠️ فيتامين D: مراقبة المستوى وتعويض إذا منخفض (مرضى التهاب الكبد غالباً لديهم نقص فيتامين D)');

    if (patient.stage === 'cirrhosis' && patient.INR > 1.5) {
      alerts.push('⚠️ فيتامين K: INR مرتفع — تعويض فيتامين K مطلوب');
    }

    if (patient.stage === 'cirrhosis') {
      alerts.push('⚠️ Zinc: مرضى التليف الكبدي غالباً لديهم نقص زنك — تعويض موصى به');
    }

    alerts.push('🚫 كحول: ممنوع تماماً — يزيد تلف الكبد');

    if (patient.stage === 'cirrhosis' && patient.childPughScore !== undefined && patient.childPughScore >= 7) {
      alerts.push('⚠️ بروتين: استخدام 1.2 غ/كغ بحذر (تليف كبدي شديد — خطر الاعتلال الدماغي الكبدي)');
    }

    if (patient.albumin < 3.0) {
      alerts.push('⚠️ ألبومين منخفض: خطر سوء التغذية — دعم بروتيني مكثف ومراقبة الوذمة');
    }

    if (patient.bilirubin > 5.0) {
      alerts.push('⚠️ بيليروبين مرتفع جداً: تقييم الحاجة للتدخل الطبي العاجل — خطر اليرقان الانسدادي');
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

  public static createMonitoringPlan(patient: HepatitisPatient): MonitoringPlan {
    const bilirubinTarget = patient.stage === 'acute' ? '< 1.2 mg/dL' : '< 3 mg/dL';

    return {
      labTests: [
        { test: 'Albumin', frequency: 'كل شهر', target: '> 3.5 g/dL' },
        { test: 'Bilirubin', frequency: 'كل شهر', target: bilirubinTarget },
        { test: 'INR', frequency: 'كل شهر', target: '< 1.5' },
        { test: 'Vitamin D', frequency: 'كل 3 أشهر', target: '30-50 ng/mL' },
        { test: 'Zinc', frequency: 'كل 6 أشهر', target: '70-150 µg/dL' },
        { test: 'Liver enzymes (ALT/AST)', frequency: 'كل شهر', target: 'تحسن تدريجي' },
        { test: 'Ammonia', frequency: 'كل شهر (إذا cirrhosis)', target: '< 100 µmol/L' },
      ],
      clinical: [
        { parameter: 'Weight', frequency: 'كل أسبوع', target: 'ثابت أو زيادة 0.5 كغ/أسبوع إذا كان سوء تغذية' },
        { parameter: 'Muscle mass', frequency: 'كل شهر', target: 'ثابت' },
        { parameter: 'Ascites', frequency: 'كل أسبوع', target: 'لا زيادة' },
        { parameter: 'Encephalopathy', frequency: 'كل أسبوع', target: 'لا يوجد' },
      ],
    };
  }

  public static createTitrationPlan(patient: HepatitisPatient): TitrationPlan | null {
    if (
      patient.stage === 'cirrhosis' &&
      patient.childPughScore !== undefined &&
      patient.childPughScore >= 7
    ) {
      return {
        increaseCalories: 100,
        frequency: 'كل 5-7 أيام',
        target: 'زيادة وزن 0.3-0.5 كغ/أسبوع',
        monitor: 'الاعتلال الدماغي + الاستسقاء',
      };
    }

    if (patient.albumin < 3.0) {
      return {
        increaseCalories: 150,
        frequency: 'كل 5-7 أيام',
        target: 'زيادة وزن 0.3-0.5 كغ/أسبوع',
        monitor: 'الوذمة + الاستسقاء + وظائف الكبد',
      };
    }

    return null;
  }

  public static checkRefeedingRisk(patient: HepatitisPatient): { isHighRisk: boolean; message: string } {
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

    if (patient.weight < 50 && (patient.albumin < 3.0 || patient.stage === 'cirrhosis')) {
      return {
        isHighRisk: true,
        message: '⚠️ خطر متلازمة إعادة التغذية — وزن منخفض وألبومين منخفض. مطلوب فحص الشوارد قبل البدء',
      };
    }

    return { isHighRisk: false, message: '' };
  }

  public static generatePrescription(patient: HepatitisPatient): HepatitisPrescription {
    if (
      isNaN(patient.weight) || isNaN(patient.height) || isNaN(patient.age) ||
      patient.weight <= 0 || patient.height <= 0 || patient.age <= 0
    ) {
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        meals: { mainMeals: [], snacks: [] },
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
    const meals = this.createMealPlan(calories, protein, macros.carbs, macros.fat);
    const alerts = [...alertsFromNutrition, ...this.createAlerts(patient)];
    const monitoring = this.createMonitoringPlan(patient);
    const titration = this.createTitrationPlan(patient);

    return {
      calories,
      protein,
      carbs: macros.carbs,
      fat: macros.fat,
      meals,
      alerts,
      monitoring,
      titration,
    };
  }
}
