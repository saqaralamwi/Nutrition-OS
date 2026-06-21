export interface IEnteralInput {
  netCaloricRequirement: number;
  formulaCaloricDensity: number;
  formulaProteinDensityGrams: number;
  feedingMethod: 'continuous' | 'bolus';
  gastricResidualVolumeMl: number;
  formulaOsmolality: number;
}

export type ClinicalAction = 'advance_protocol' | 'reduce_rate_50' | 'hold_feed';

export interface IEnteralOutput {
  totalDailyVolumeMl: number;
  flowRateMlHr: number;
  volumePerBolus: number;
  bolusesPerDay: number;
  totalProteinGrams: number;
  isToleranceIssue: boolean;
  clinicalActionRecommendation: ClinicalAction;
  isHyperosmolarRisk: boolean;
  isSafe: boolean;
  arabicDirectives: string[];
}

export class EnteralNutritionEngine {
  public static calculateEnteralFeed(input: IEnteralInput): IEnteralOutput {
    const {
      netCaloricRequirement,
      formulaCaloricDensity,
      formulaProteinDensityGrams,
      feedingMethod,
      gastricResidualVolumeMl,
      formulaOsmolality,
    } = input;

    if (isNaN(netCaloricRequirement) || isNaN(formulaCaloricDensity) || isNaN(formulaProteinDensityGrams) || isNaN(gastricResidualVolumeMl) || isNaN(formulaOsmolality) || netCaloricRequirement <= 0 || formulaCaloricDensity <= 0 || gastricResidualVolumeMl < 0) {
      return {
        totalDailyVolumeMl: 0,
        flowRateMlHr: 0,
        volumePerBolus: 0,
        bolusesPerDay: 0,
        totalProteinGrams: 0,
        isToleranceIssue: false,
        clinicalActionRecommendation: 'advance_protocol',
        isHyperosmolarRisk: false,
        isSafe: false,
        arabicDirectives: ['الرجاء التحقق من المدخلات؛ السعرات الحرارية أو كثافة التركيبة غير صالحة'],
      };
    }

    const totalDailyVolumeMl = EnteralNutritionEngine.round2(
      netCaloricRequirement / formulaCaloricDensity,
    );
    const totalProteinGrams = EnteralNutritionEngine.round2(
      (totalDailyVolumeMl * formulaProteinDensityGrams) / 100,
    );

    let flowRateMlHr = 0;
    let volumePerBolus = 0;
    let bolusesPerDay = 0;

    if (feedingMethod === 'continuous') {
      flowRateMlHr = EnteralNutritionEngine.round2(totalDailyVolumeMl / 24);
    } else {
      bolusesPerDay = 4;
      volumePerBolus = EnteralNutritionEngine.round2(totalDailyVolumeMl / 4);
    }

    let clinicalActionRecommendation: ClinicalAction = 'advance_protocol';
    let isToleranceIssue = false;
    const arabicDirectives: string[] = [];

    if (gastricResidualVolumeMl > 500) {
      clinicalActionRecommendation = 'hold_feed';
      isToleranceIssue = true;
      arabicDirectives.push(
        `توقف فوري للتغذية - حجم البقايا المعدية: ${gastricResidualVolumeMl} مل (أكبر من 500 مل)`,
      );
    } else if (gastricResidualVolumeMl > 250) {
      clinicalActionRecommendation = 'reduce_rate_50';
      isToleranceIssue = true;
      arabicDirectives.push(
        `تقليل معدل التغذية بنسبة 50% - حجم البقايا المعدية: ${gastricResidualVolumeMl} مل`,
      );
    } else {
      arabicDirectives.push('معدل التغذية ضمن الحدود الآمنة - يمكن متابعة البروتوكول');
    }

    const isHyperosmolarRisk = formulaOsmolality > 400;
    if (isHyperosmolarRisk) {
      arabicDirectives.push(
        `تحذير: الأسمولالية (${formulaOsmolality} mOsm/kg) تتجاوز 400 - خطر الإسهال التناضحي`,
      );
    }

    arabicDirectives.push(`الحجم اليومي الكلي: ${totalDailyVolumeMl} مل`);
    if (feedingMethod === 'continuous') {
      arabicDirectives.push(`معدل التدفق المستمر: ${flowRateMlHr} مل/ساعة`);
    } else {
      arabicDirectives.push(`حجم الوجبة الواحدة: ${volumePerBolus} مل (${bolusesPerDay} وجبات/يوم)`);
    }
    arabicDirectives.push(`البروتين الكلي: ${totalProteinGrams} غ/يوم`);

    return {
      totalDailyVolumeMl,
      flowRateMlHr,
      volumePerBolus,
      bolusesPerDay,
      totalProteinGrams,
      isToleranceIssue,
      clinicalActionRecommendation,
      isHyperosmolarRisk,
      isSafe: true,
      arabicDirectives,
    };
  }

  private static round2(value: number): number {
    return parseFloat(value.toFixed(2));
  }
}
