/**
 * PediatricEerEngine.ts
 * 
 * Implements standard DRI EER equations for healthy pediatric patients
 * Reference: Krause and Mahan's Food & the Nutrition Care Process
 */

export interface PediatricEerInput {
  ageInMonths: number;
  weightKg: number;
  heightM: number;
  gender: 'MALE' | 'FEMALE';
  physicalActivityLevel: number;
}

export interface PediatricEerOutput {
  eerKcal: number;
  isSafe: boolean;
  errorCode: string;
}

export class PediatricEerEngine {
  /**
   * Calculates Estimated Energy Requirement (EER) for pediatric patients.
   * strictly follows the DRI equations for healthy children.
   */
  static calculateEER(input: PediatricEerInput): PediatricEerOutput {
    const { ageInMonths, weightKg, heightM, gender, physicalActivityLevel: PA } = input;

    // 1. CRITICAL SECURITY & SAFETY GUARDS
    if (isNaN(weightKg) || weightKg <= 0) {
      return { eerKcal: 0, isSafe: false, errorCode: 'INVALID_WEIGHT' };
    }

    if (isNaN(ageInMonths) || ageInMonths < 0) {
      return { eerKcal: 0, isSafe: false, errorCode: 'INVALID_AGE' };
    }

    // INFANTS & TODDLERS (0 to 35 months)
    // ignores gender, height, and PA as per DRI standard for this age group
    if (ageInMonths < 36) {
      let base = (89 * weightKg - 100);
      let eer = 0;

      if (ageInMonths >= 0 && ageInMonths <= 3) {
        eer = base + 175;
      } else if (ageInMonths >= 4 && ageInMonths <= 6) {
        eer = base + 56;
      } else if (ageInMonths >= 7 && ageInMonths <= 12) {
        eer = base + 22;
      } else {
        // 13-35 months
        eer = base + 20;
      }

      return {
        eerKcal: Math.round(eer),
        isSafe: true,
        errorCode: 'NONE'
      };
    }

    // OLDER CHILDREN (36 months to 18 years)
    // Validate required parameters for older children
    if (isNaN(heightM) || heightM <= 0 || !gender || isNaN(PA)) {
      return { eerKcal: 0, isSafe: false, errorCode: 'MISSING_OLDER_CHILD_PARAMETERS' };
    }

    const ageInYears = ageInMonths / 12;
    let eer = 0;

    if (gender === 'MALE') {
      // BOYS
      if (ageInYears < 9) {
        // 3-8 years
        eer = 88.5 - (61.9 * ageInYears) + PA * (26.7 * weightKg + 903 * heightM) + 20;
      } else {
        // 9-18 years
        eer = 88.5 - (61.9 * ageInYears) + PA * (26.7 * weightKg + 903 * heightM) + 25;
      }
    } else {
      // GIRLS
      if (ageInYears < 9) {
        // 3-8 years
        eer = 135.3 - (30.8 * ageInYears) + PA * (10.0 * weightKg + 934 * heightM) + 20;
      } else {
        // 9-18 years
        eer = 135.3 - (30.8 * ageInYears) + PA * (10.0 * weightKg + 934 * heightM) + 25;
      }
    }

    return {
      eerKcal: Math.round(eer),
      isSafe: true,
      errorCode: 'NONE'
    };
  }
}
