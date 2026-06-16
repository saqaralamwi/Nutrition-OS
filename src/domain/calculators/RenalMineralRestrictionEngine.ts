export type CkdStage = 'stage_1' | 'stage_2' | 'stage_3a' | 'stage_3b' | 'stage_4' | 'stage_5';
export type DialysisStatus = 'none' | 'hemodialysis' | 'peritoneal';

export interface IRenalRestrictionInput {
  ckdStage: CkdStage;
  dialysisStatus: DialysisStatus;
  weightKg: number;
  measuredUrineOutputMl: number | null;
}

export interface IRenalRestrictionOutput {
  proteinTargetGramsPerKg: number;
  totalProteinGrams: number;
  sodiumMaxMg: number;
  potassiumMaxMg: number;
  phosphorusMaxMg: number;
  fluidMaxMl: number;
  isFluidRestricted: boolean;
  isSafe: boolean;
  clinicalDirectives: string[];
}

export class RenalMineralRestrictionEngine {
  public static calculateRestrictions(input: IRenalRestrictionInput): IRenalRestrictionOutput {
    const { ckdStage, dialysisStatus, weightKg, measuredUrineOutputMl } = input;

    if (!weightKg || weightKg <= 0 || isNaN(weightKg)) {
      return {
        proteinTargetGramsPerKg: 0,
        totalProteinGrams: 0,
        sodiumMaxMg: 0,
        potassiumMaxMg: 0,
        phosphorusMaxMg: 0,
        fluidMaxMl: 0,
        isFluidRestricted: false,
        isSafe: false,
        clinicalDirectives: ['الرجاء إدخال وزن صحيح للمريض'],
      };
    }

    if (dialysisStatus === 'hemodialysis') {
      return RenalMineralRestrictionEngine.hemodialysisPathway(weightKg, measuredUrineOutputMl);
    }
    if (dialysisStatus === 'peritoneal') {
      return RenalMineralRestrictionEngine.peritonealPathway(weightKg, measuredUrineOutputMl);
    }
    return RenalMineralRestrictionEngine.preDialysisPathway(ckdStage, weightKg, measuredUrineOutputMl);
  }

  private static hemodialysisPathway(weightKg: number, urineOutput: number | null): IRenalRestrictionOutput {
    const proteinTarget = 1.2;
    const totalProtein = RenalMineralRestrictionEngine.round1(weightKg * proteinTarget);
    const fluidBase = urineOutput || 0;
    const fluidMax = RenalMineralRestrictionEngine.round1(fluidBase + 1000);

    return {
      proteinTargetGramsPerKg: proteinTarget,
      totalProteinGrams: totalProtein,
      sodiumMaxMg: 2000,
      potassiumMaxMg: 2000,
      phosphorusMaxMg: 900,
      fluidMaxMl: fluidMax,
      isFluidRestricted: true,
      isSafe: true,
      clinicalDirectives: [
        `البروتين المستهدف: ${proteinTarget} غ/كغ/يوم (إجمالي ${totalProtein} غ)`,
        `الحد الأقصى للصوديوم: 2000 ملغ/يوم`,
        `الحد الأقصى للبوتاسيوم: 2000 ملغ/يوم`,
        `الحد الأقصى للفسفور: 900 ملغ/يوم`,
        `الحد الأقصى للسوائل: ${fluidMax} مل/يوم`,
      ],
    };
  }

  private static peritonealPathway(weightKg: number, urineOutput: number | null): IRenalRestrictionOutput {
    const proteinTarget = 1.3;
    const totalProtein = RenalMineralRestrictionEngine.round1(weightKg * proteinTarget);
    const fluidBase = urineOutput || 0;
    const fluidMax = RenalMineralRestrictionEngine.round1(fluidBase + 1200);

    return {
      proteinTargetGramsPerKg: proteinTarget,
      totalProteinGrams: totalProtein,
      sodiumMaxMg: 2000,
      potassiumMaxMg: 3000,
      phosphorusMaxMg: 900,
      fluidMaxMl: fluidMax,
      isFluidRestricted: true,
      isSafe: true,
      clinicalDirectives: [
        `البروتين المستهدف: ${proteinTarget} غ/كغ/يوم (إجمالي ${totalProtein} غ)`,
        `الحد الأقصى للصوديوم: 2000 ملغ/يوم`,
        `الحد الأقصى للبوتاسيوم: 3000 ملغ/يوم`,
        `الحد الأقصى للفسفور: 900 ملغ/يوم`,
        `الحد الأقصى للسوائل: ${fluidMax} مل/يوم`,
      ],
    };
  }

  private static preDialysisPathway(
    ckdStage: CkdStage,
    weightKg: number,
    urineOutput: number | null,
  ): IRenalRestrictionOutput {
    if (ckdStage === 'stage_1' || ckdStage === 'stage_2') {
      const proteinTarget = 0.8;
      const totalProtein = RenalMineralRestrictionEngine.round1(weightKg * proteinTarget);

      return {
        proteinTargetGramsPerKg: proteinTarget,
        totalProteinGrams: totalProtein,
        sodiumMaxMg: 2300,
        potassiumMaxMg: 3500,
        phosphorusMaxMg: 1200,
        fluidMaxMl: 0,
        isFluidRestricted: false,
        isSafe: true,
        clinicalDirectives: [
          `البروتين المستهدف: ${proteinTarget} غ/كغ/يوم (إجمالي ${totalProtein} غ)`,
          `الحد الأقصى للصوديوم: 2300 ملغ/يوم`,
          `البوتاسيوم: غير مقيد (3500 ملغ/يوم)`,
          `الحد الأقصى للفسفور: 1200 ملغ/يوم`,
          `السوائل: غير مقيدة`,
        ],
      };
    }

    if (ckdStage === 'stage_3a' || ckdStage === 'stage_3b') {
      const proteinTarget = 0.6;
      const totalProtein = RenalMineralRestrictionEngine.round1(weightKg * proteinTarget);

      return {
        proteinTargetGramsPerKg: proteinTarget,
        totalProteinGrams: totalProtein,
        sodiumMaxMg: 2000,
        potassiumMaxMg: 2500,
        phosphorusMaxMg: 800,
        fluidMaxMl: 0,
        isFluidRestricted: false,
        isSafe: true,
        clinicalDirectives: [
          `البروتين المستهدف: ${proteinTarget} غ/كغ/يوم (إجمالي ${totalProtein} غ)`,
          `الحد الأقصى للصوديوم: 2000 ملغ/يوم`,
          `الحد الأقصى للبوتاسيوم: 2500 ملغ/يوم`,
          `الحد الأقصى للفسفور: 800 ملغ/يوم`,
          `السوائل: غير مقيدة`,
        ],
      };
    }

    const proteinTarget = 0.6;
    const totalProtein = RenalMineralRestrictionEngine.round1(weightKg * proteinTarget);
    const fluidMax = ckdStage === 'stage_5'
      ? RenalMineralRestrictionEngine.round1((urineOutput || 0) + 500)
      : 0;
    const isFluidRestricted = ckdStage === 'stage_5';

    return {
      proteinTargetGramsPerKg: proteinTarget,
      totalProteinGrams: totalProtein,
      sodiumMaxMg: 2000,
      potassiumMaxMg: 2000,
      phosphorusMaxMg: 800,
      fluidMaxMl: fluidMax,
      isFluidRestricted,
      isSafe: true,
      clinicalDirectives: [
        `البروتين المستهدف: ${proteinTarget} غ/كغ/يوم (إجمالي ${totalProtein} غ)`,
        `الحد الأقصى للصوديوم: 2000 ملغ/يوم`,
        `الحد الأقصى للبوتاسيوم: 2000 ملغ/يوم`,
        `الحد الأقصى للفسفور: 800 ملغ/يوم`,
        ...(isFluidRestricted
          ? [`الحد الأقصى للسوائل: ${fluidMax} مل/يوم`]
          : ['السوائل: غير مقيدة']),
      ],
    };
  }

  private static round1(value: number): number {
    return parseFloat(value.toFixed(1));
  }
}
