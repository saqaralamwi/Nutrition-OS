import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../../data/database';
import WhoGrowthStandard from '../../data/models/WhoGrowthStandard';

export interface IZScores {
  wfa: number | null; // Weight-for-Age
  hfa: number | null; // Height-for-Age
  bfa: number | null; // BMI-for-Age
}

export class PediatricCalculator {
  /**
   * Internal helper for adjusted WHO Z-score calculation
   */
  private static calculateWHOZScore(y: number, L: number, M: number, S: number, isWeightBased: boolean): number {
    if (M <= 0 || S === 0) return 0;

    let z: number;
    if (L !== 0) {
      z = (Math.pow(y / M, L) - 1) / (L * S);
    } else {
      z = Math.log(y / M) / S;
    }

    // WHO Adjustment for extreme Z-scores (|Z| > 3) for weight-based indicators
    if (isWeightBased) {
      if (z > 3) {
        const sd2pos = L !== 0 ? M * Math.pow(1 + L * S * 2, 1 / L) : M * Math.exp(S * 2);
        const sd3pos = L !== 0 ? M * Math.pow(1 + L * S * 3, 1 / L) : M * Math.exp(S * 3);
        const diff = sd3pos - sd2pos;
        return diff !== 0 ? 3 + (y - sd3pos) / diff : z;
      }
      if (z < -3) {
        const sd2neg = L !== 0 ? M * Math.pow(1 + L * S * (-2), 1 / L) : M * Math.exp(S * (-2));
        const sd3neg = L !== 0 ? M * Math.pow(1 + L * S * (-3), 1 / L) : M * Math.exp(S * (-3));
        const diff = sd2neg - sd3neg;
        return diff !== 0 ? -3 + (y - sd3neg) / diff : z;
      }
    }

    return z;
  }

  /**
   * Calculates Z-scores for a pediatric patient based on WHO LMS standards.
   */
  static async calculateZScores(
    patientId: string,
    weight: number,
    height: number,
    ageInMonths: number,
    gender: 'male' | 'female'
  ): Promise<IZScores> {
    const result: IZScores = { wfa: null, hfa: null, bfa: null };

    // Validation Guards
    if (!weight || weight <= 0 || !height || height <= 0 || ageInMonths < 0) {
      return result;
    }

    const db = await getDatabase();
    const bmi = weight / ((height / 100) ** 2);
    const targetAge = Math.round(ageInMonths);

    const standards = await db.get<WhoGrowthStandard>('who_growth_standards')
      .query(
        Q.where('gender', gender),
        Q.where('age_months', targetAge)
      )
      .fetch();

    for (const std of standards) {
      let y = 0;
      let isWeightBased = false;

      if (std.indicatorType === 'wfa') {
        y = weight;
        isWeightBased = true;
      } else if (std.indicatorType === 'hfa') {
        y = height;
        isWeightBased = false;
      } else if (std.indicatorType === 'bfa') {
        y = bmi;
        isWeightBased = true;
      } else continue;

      const z = this.calculateWHOZScore(y, std.lValue, std.mValue, std.sValue, isWeightBased);
      
      if (std.indicatorType === 'wfa') result.wfa = parseFloat(z.toFixed(2));
      else if (std.indicatorType === 'hfa') result.hfa = parseFloat(z.toFixed(2));
      else if (std.indicatorType === 'bfa') result.bfa = parseFloat(z.toFixed(2));
    }

    return result;
  }

  /**
   * Determines the STAMP risk level based on scores.
   */
  static getSTAMPRiskLevel(totalScore: number): { level: 'low' | 'medium' | 'high'; labelAr: string } {
    if (totalScore >= 4) return { level: 'high', labelAr: 'خطر مرتفع' };
    if (totalScore >= 2) return { level: 'medium', labelAr: 'خطر متوسط' };
    return { level: 'low', labelAr: 'خطر منخفض' };
  }
}
