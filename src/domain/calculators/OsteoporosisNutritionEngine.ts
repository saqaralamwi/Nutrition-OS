import type {
  BoneDensityClassification,
  FractureRiskLevel,
  CalciumStatus,
  VitaminDStatus,
  OsteoporosisAssessment,
} from '../types/osteoporosis';

export interface OsteoporosisNutritionRequirements {
  targetCalcium: number;
  targetVitaminD: number;
  targetProtein: number;
  targetVitaminK: number;
  targetMagnesium: number;
  targetZinc: number;
  targetPhosphorus: number;
  targetPotassium: number;
}

export class OsteoporosisNutritionEngine {
  public static classifyBoneDensity(tScore: number): BoneDensityClassification {
    if (tScore >= -1.0) return 'normal';
    if (tScore >= -2.5) return 'osteoporosis';
    return 'severe_osteoporosis';
  }

  public static calculateFractureRisk(assessment: OsteoporosisAssessment): FractureRiskLevel {
    let score = 0;

    if (assessment.overallTScore < -2.5) score += 3;
    else if (assessment.overallTScore < -1.5) score += 2;
    else if (assessment.overallTScore < -1.0) score += 1;

    if (assessment.age >= 75) score += 2;
    else if (assessment.age >= 65) score += 1;

    if (assessment.hasHipFracture || assessment.hasVertebralFracture) score += 3;
    else if (assessment.hasOtherFracture) score += 2;
    else if (assessment.hasFallHistory) score += 1;

    if (assessment.hasGlucocorticoids) score += 2;
    if (assessment.hasSmoking) score += 1;
    if (assessment.hasAlcoholUse && assessment.alcoholUnitsPerWeek >= 3) score += 1;
    if (assessment.isPostmenopausal) score += 1;
    if (assessment.hasFamilyHistory) score += 1;
    if (assessment.hasLowPhysicalActivity) score += 1;

    if (score >= 8) return 'very_high';
    if (score >= 5) return 'high';
    if (score >= 3) return 'moderate';
    return 'low';
  }

  public static calculateCalciumRequirement(
    age: number,
    gender: 'male' | 'female',
    calciumStatus: CalciumStatus,
  ): number {
    let requirement = 1000;

    if (age >= 50 && gender === 'female') requirement = 1200;
    else if (age >= 70) requirement = 1200;

    if (calciumStatus === 'deficient') requirement += 200;

    return requirement;
  }

  public static calculateVitaminDRequirement(
    vitaminDStatus: VitaminDStatus,
    age: number,
  ): number {
    let requirement: number;

    switch (vitaminDStatus) {
      case 'severely_deficient':
        requirement = 5000;
        break;
      case 'deficient':
        requirement = 2000;
        break;
      case 'insufficient':
        requirement = 1000;
        break;
      default:
        requirement = 600;
    }

    if (age >= 70 && requirement < 800) requirement = 800;

    return requirement;
  }

  public static calculateProteinRequirement(weight: number): number {
    return Math.round(weight * 1.0);
  }

  public static calculateRequirements(
    assessment: OsteoporosisAssessment,
    age: number,
    gender: 'male' | 'female',
  ): OsteoporosisNutritionRequirements {
    const calciumStatus = assessment.calciumStatus;
    const vitaminDStatus = assessment.vitaminDStatus;
    const weight = assessment.weight;

    return {
      targetCalcium: Math.round(this.calculateCalciumRequirement(age, gender, calciumStatus)),
      targetVitaminD: Math.round(this.calculateVitaminDRequirement(vitaminDStatus, age)),
      targetProtein: Math.round(this.calculateProteinRequirement(weight)),
      targetVitaminK: Math.round(gender === 'male' ? 120 : 90),
      targetMagnesium: Math.round(gender === 'male' ? 420 : 320),
      targetZinc: Math.round(gender === 'male' ? 11 : 8),
      targetPhosphorus: Math.round(700),
      targetPotassium: Math.round(4700),
    };
  }
}
