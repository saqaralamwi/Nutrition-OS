export interface IGDMDietInput {
  prePregnancyBMI: number;
  currentWeightKg: number;
  prePregnancyWeightKg: number;
  gestationalWeeks: number;
  baseCaloriesREE: number;
  activityFactor: number;
}

export interface IGDMCalculationResult {
  targetWeightGainMinKg: number;
  targetWeightGainMaxKg: number;
  actualWeightGainSoFarKg: number;
  totalRecommendedCalories: number;
  minimumSafeCarbGrams: number;
  targetCarbGrams: number;
  isSafe: boolean;
  clinicalAlerts: string[];
}

const MIN_SAFE_CARB_FLOOR = 175;
const GDM_CARB_PCT = 40;
const CARB_KCAL_PER_G = 4;

function getIOMRange(bmi: number): { min: number; max: number } {
  if (bmi < 18.5) return { min: 12.5, max: 18.0 };
  if (bmi < 25.0) return { min: 11.5, max: 16.0 };
  if (bmi < 30.0) return { min: 7.0, max: 11.5 };
  return { min: 5.0, max: 9.0 };
}

function getTrimesterAddition(weeks: number): number {
  if (weeks >= 29) return 452;
  if (weeks >= 13) return 340;
  return 0;
}

function getTrimesterLabel(weeks: number): string {
  if (weeks >= 29) return 'الثالث';
  if (weeks >= 13) return 'الثاني';
  return 'الأول';
}

export class GestationalDiabetesEngine {
  public static calculateGDMDynamics(input: IGDMDietInput): IGDMCalculationResult {
    if (
      isNaN(input.prePregnancyBMI) || isNaN(input.gestationalWeeks) || isNaN(input.baseCaloriesREE) ||
      input.prePregnancyBMI <= 0 ||
      input.gestationalWeeks < 1 ||
      input.gestationalWeeks > 42 ||
      input.baseCaloriesREE <= 0
    ) {
      return {
        targetWeightGainMinKg: 0,
        targetWeightGainMaxKg: 0,
        actualWeightGainSoFarKg: 0,
        totalRecommendedCalories: 0,
        minimumSafeCarbGrams: 0,
        targetCarbGrams: 0,
        isSafe: false,
        clinicalAlerts: [
          'بيانات الإدخال غير صالحة - تأكد من أن مؤشر كتلة الجسم قبل الحمل ومعدل الأيض الأساسي أكبر من صفر وأن أسابيع الحمل بين 1 و 42',
        ],
      };
    }

    const iom = getIOMRange(input.prePregnancyBMI);
    const actualWeightGainSoFarKg = Math.round(
      (input.currentWeightKg - input.prePregnancyWeightKg) * 100,
    ) / 100;

    const trimesterAddition = getTrimesterAddition(input.gestationalWeeks);
    const tee = Math.round(
      (input.baseCaloriesREE * input.activityFactor + trimesterAddition) * 100,
    ) / 100;

    const targetCarbGrams = Math.round((tee * (GDM_CARB_PCT / 100) / CARB_KCAL_PER_G) * 100) / 100;

    const alerts: string[] = [
      `وزنك قبل الحمل: ${input.prePregnancyWeightKg} كغم - الوزن الحالي: ${input.currentWeightKg} كغم`,
      `الزيادة الوزنية المستهدفة حسب معايير IOM: ${iom.min} - ${iom.max} كغم`,
      `الزيادة الوزنية الفعلية حتى الآن: ${actualWeightGainSoFarKg} كغم`,
      `السعرات الحرارية الموصى بها في الثلث ${getTrimesterLabel(input.gestationalWeeks)} من الحمل: ${tee} سعرة/يوم`,
      `الحد الأدنى الآمن للكربوهيدرات: ${MIN_SAFE_CARB_FLOOR} غم/يوم لتجنب الحماض الكيتوني. الكمية المستهدفة: ${targetCarbGrams} غم/يوم`,
    ];

    const currentTrim = getTrimesterLabel(input.gestationalWeeks);
    if (currentTrim === 'الثاني' || currentTrim === 'الثالث') {
      alerts.push(
        'مراقبة مستوى الكيتونات في البول صباحاً للكشف المبكر عن الحماض الكيتوني',
      );
    }

    return {
      targetWeightGainMinKg: iom.min,
      targetWeightGainMaxKg: iom.max,
      actualWeightGainSoFarKg,
      totalRecommendedCalories: tee,
      minimumSafeCarbGrams: MIN_SAFE_CARB_FLOOR,
      targetCarbGrams,
      isSafe: true,
      clinicalAlerts: alerts,
    };
  }
}
