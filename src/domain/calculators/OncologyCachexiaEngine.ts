export interface IOncologyInput {
  weightKg: number;
  bmi: number;
  unintentionalWeightLossPercent: number;
  cancerSiteType: 'git' | 'head_neck' | 'hematologic' | 'solid_other' | 'none';
  hasSarcopeniaOrMuscleWasting: boolean;
  isRefractoryOncologyStatus: boolean;
}

export type CachexiaStage = 'stable' | 'pre_cachexia' | 'cachexia' | 'refractory_cachexia';

export interface IOncologyResult {
  cachexiaStage: CachexiaStage;
  recommendedCaloriesDaily: number;
  recommendedProteinGramsDaily: number;
  isSafe: boolean;
  arabicClinicalNotes: string[];
}

export class OncologyCachexiaEngine {
  public static evaluateOncologyProfile(input: IOncologyInput): IOncologyResult {
    const {
      weightKg,
      bmi,
      unintentionalWeightLossPercent,
      cancerSiteType,
      hasSarcopeniaOrMuscleWasting,
      isRefractoryOncologyStatus,
    } = input;

    if (isNaN(weightKg) || isNaN(bmi) || isNaN(unintentionalWeightLossPercent) || weightKg <= 0 || bmi <= 0 || unintentionalWeightLossPercent < 0) {
      return {
        cachexiaStage: 'stable',
        recommendedCaloriesDaily: 0,
        recommendedProteinGramsDaily: 0,
        isSafe: false,
        arabicClinicalNotes: ['الرجاء التحقق من المدخلات؛ الوزن ومؤشر كتلة الجسم ونسبة فقدان الوزن يجب أن تكون قيماً صحيحة'],
      };
    }

    const cachexiaStage = OncologyCachexiaEngine.resolveCachexiaStage(input);

    let energyFactor: number;
    let proteinFactor: number;

    switch (cachexiaStage) {
      case 'refractory_cachexia':
        energyFactor = 20;
        proteinFactor = 1.0;
        break;
      case 'cachexia':
        if (cancerSiteType === 'git' || cancerSiteType === 'head_neck') {
          energyFactor = 35;
        } else {
          energyFactor = 32;
        }
        proteinFactor = 1.5;
        break;
      case 'pre_cachexia':
        energyFactor = 30;
        proteinFactor = 1.5;
        break;
      default:
        energyFactor = 25;
        proteinFactor = 1.2;
    }

    const recommendedCaloriesDaily = OncologyCachexiaEngine.round2(weightKg * energyFactor);
    const recommendedProteinGramsDaily = OncologyCachexiaEngine.round2(weightKg * proteinFactor);

    const notes: string[] = [];

    switch (cachexiaStage) {
      case 'refractory_cachexia':
        notes.push('الدنف المقاوم: تقييد السعرات الحرارية لتجنب الضغط الأيضي - رعاية تلطيفية');
        break;
      case 'cachexia':
        notes.push('الدنف النشط: زيادة السعرات والبروتين لمكافحة الالتهاب الجهازي وهزال العضلات');
        if (cancerSiteType === 'git' || cancerSiteType === 'head_neck') {
          notes.push('رفع السعرات إلى 35 سعرة/كغ بسبب موقع الورم (GIT/Head & Neck)');
        }
        break;
      case 'pre_cachexia':
        notes.push('ما قبل الدنف: مراقبة الوزن والبدء المبكر بالدعم الغذائي');
        break;
      default:
        notes.push('مستقر: استمرار التغذية الوقائية');
    }

    notes.push(
      `السعرات الحرارية الموصى بها: ${recommendedCaloriesDaily} سعرة/يوم`,
      `البروتين الموصى به: ${recommendedProteinGramsDaily} غ/يوم`,
    );

    return {
      cachexiaStage,
      recommendedCaloriesDaily,
      recommendedProteinGramsDaily,
      isSafe: true,
      arabicClinicalNotes: notes,
    };
  }

  private static resolveCachexiaStage(input: IOncologyInput): CachexiaStage {
    const { unintentionalWeightLossPercent, bmi, hasSarcopeniaOrMuscleWasting, isRefractoryOncologyStatus } = input;

    if (isRefractoryOncologyStatus) {
      return 'refractory_cachexia';
    }

    if (
      unintentionalWeightLossPercent > 5 ||
      (bmi < 20 && unintentionalWeightLossPercent > 2) ||
      (hasSarcopeniaOrMuscleWasting && unintentionalWeightLossPercent > 2)
    ) {
      return 'cachexia';
    }

    if (unintentionalWeightLossPercent > 0 && unintentionalWeightLossPercent <= 5) {
      return 'pre_cachexia';
    }

    return 'stable';
  }

  private static round2(value: number): number {
    return parseFloat(value.toFixed(2));
  }
}
