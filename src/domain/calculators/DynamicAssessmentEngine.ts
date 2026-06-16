import type { PatientProfile } from '../../data/types/meal_planner';
import type { EdemaGrade, AscitesSeverity, RawAssessmentInput } from '../../data/types/assessment';

export class DynamicAssessmentEngine {
  private static readonly EDEMA_DEDUCTION: Record<EdemaGrade, number> = {
    NONE: 0,
    GRADE_1: 0.02,
    GRADE_2: 0.05,
    GRADE_3: 0.10,
    GRADE_4: 0.15,
  };

  private static readonly ASCITES_DEDUCTION: Record<AscitesSeverity, number> = {
    NONE: 0,
    MILD: 0.05,
    MODERATE: 0.10,
    SEVERE: 0.15,
  };

  private static readonly MAX_TOTAL_DEDUCTION = 0.30;
  private static readonly CAL_PER_KG = 30;
  private static readonly PROTEIN_FACTOR_STRICT = 0.8;
  private static readonly PROTEIN_FACTOR_FREE = 1.2;
  private static readonly FAT_SHARE = 0.30;
  private static readonly CARB_SHARE = 0.70;
  private static readonly CAL_PER_G_PROTEIN = 4;
  private static readonly CAL_PER_G_FAT = 9;
  private static readonly CAL_PER_G_CARB = 4;

  private static readonly GCS_STRICT_THRESHOLD = 12;
  private static readonly AMMONIA_THRESHOLD = 100;
  private static readonly POTASSIUM_THRESHOLD = 5.2;
  private static readonly SODIUM_CRITICAL = 130;

  public static calculateDryWeight(
    actualWeight: number,
    edema: EdemaGrade,
    ascites: AscitesSeverity,
  ): number {
    if (!actualWeight || actualWeight <= 0 || isNaN(actualWeight)) return 0;

    const edemaDed = DynamicAssessmentEngine.EDEMA_DEDUCTION[edema] ?? 0;
    const ascitesDed = DynamicAssessmentEngine.ASCITES_DEDUCTION[ascites] ?? 0;

    let totalDed = edemaDed + ascitesDed;
    if (totalDed > DynamicAssessmentEngine.MAX_TOTAL_DEDUCTION) {
      totalDed = DynamicAssessmentEngine.MAX_TOTAL_DEDUCTION;
    }

    const dryWeight = actualWeight * (1 - totalDed);
    return DynamicAssessmentEngine.r2(dryWeight);
  }

  public static processAssessment(input: RawAssessmentInput): PatientProfile {
    if (!input?.clinical) {
      throw new Error('Missing clinical assessment data');
    }
    if (!input?.labs) {
      throw new Error('Missing lab assessment data');
    }

    const dryWeight = DynamicAssessmentEngine.calculateDryWeight(
      input.actualWeight,
      input.edema,
      input.ascites,
    );

    let isStrictProteinRestriction = false;
    const activeContraindicatedNutrients: string[] = [];

    if (
      input.clinical.gcsScore <= DynamicAssessmentEngine.GCS_STRICT_THRESHOLD ||
      input.clinical.westHaven === 'GRADE_3' ||
      input.clinical.westHaven === 'GRADE_4'
    ) {
      isStrictProteinRestriction = true;
    }

    if (
      input.labs.serumAmmonia != null &&
      input.labs.serumAmmonia > DynamicAssessmentEngine.AMMONIA_THRESHOLD
    ) {
      isStrictProteinRestriction = true;
      activeContraindicatedNutrients.push('high_ammonia_triggers');
    }

    if (
      input.labs.potassium != null &&
      input.labs.potassium >= DynamicAssessmentEngine.POTASSIUM_THRESHOLD
    ) {
      activeContraindicatedNutrients.push('potassium');
    }

    if (
      input.labs.sodium != null &&
      input.labs.sodium < DynamicAssessmentEngine.SODIUM_CRITICAL
    ) {
      activeContraindicatedNutrients.push('sodium');
    }

    const targetCalories = Math.round(dryWeight * DynamicAssessmentEngine.CAL_PER_KG);

    const proteinFactor = isStrictProteinRestriction
      ? DynamicAssessmentEngine.PROTEIN_FACTOR_STRICT
      : DynamicAssessmentEngine.PROTEIN_FACTOR_FREE;
    const targetProtein = Math.round(dryWeight * proteinFactor);

    const proteinCalories = targetProtein * DynamicAssessmentEngine.CAL_PER_G_PROTEIN;
    let remainingCalories = targetCalories - proteinCalories;
    if (remainingCalories < 0) remainingCalories = 0;

    const targetFats = Math.round(
      (remainingCalories * DynamicAssessmentEngine.FAT_SHARE) /
        DynamicAssessmentEngine.CAL_PER_G_FAT,
    );

    const targetCarbs = (
      remainingCalories - targetFats * DynamicAssessmentEngine.CAL_PER_G_FAT
    ) / DynamicAssessmentEngine.CAL_PER_G_CARB;

    return {
      id: input.patientId,
      dryWeight,
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFats,
      isStrictProteinRestriction,
      activeContraindicatedNutrients,
    };
  }

  private static r2(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
