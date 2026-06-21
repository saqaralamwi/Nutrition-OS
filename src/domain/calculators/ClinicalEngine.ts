import { getBmiCategory } from '../utils/bmiClassification';
import { PediatricZScoreEngine, IZScoreResult } from './PediatricZScoreEngine';

export type AssessmentEngine = 'zscore' | 'bmi';

export interface PediatricAssessment {
  engine: 'zscore';
  zScore: number;
  classification: IZScoreResult['classification'];
  label: string;
  indicatorLabel: string;
  isStunted: boolean;
}

export interface AdultAssessment {
  engine: 'bmi';
  bmi: number;
  category: string;
  color: string;
  severity: string;
}

export type ClinicalAssessment = PediatricAssessment | AdultAssessment;

export interface AssessmentInput {
  age: number;
  gender: 'male' | 'female';
  weightKg: number;
  heightCm: number;
}

function getZScoreColor(z: number): string {
  if (z >= -1 && z <= 1) return '#4ade80';
  if (z >= -2 && z <= 2) return '#fbbf24';
  return '#f43f5e';
}

export async function calculateAssessment(input: AssessmentInput): Promise<ClinicalAssessment> {
  const { age, gender, weightKg, heightCm } = input;

  if (age < 19) {
    const engine = new PediatricZScoreEngine();
    let zScore = 0;
    let classification: IZScoreResult['classification'] = 'normal';

    try {
      const result = await PediatricZScoreEngine.calculateZScore({
        gender,
        indicatorType: 'lhfa',
        measurementValue: heightCm,
        ageMonths: age * 12,
      });
      zScore = result.zScore;
      classification = result.classification;
    } catch {
      zScore = 0;
      classification = 'normal';
    }

    return {
      engine: 'zscore',
      zScore,
      classification,
      label: `Z-Score: ${zScore.toFixed(2)}`,
      indicatorLabel: 'مؤشر النمو (Z-Score)',
      isStunted: zScore < -2,
    };
  }

  const heightM = heightCm / 100;
  const bmi = Math.round((weightKg / (heightM * heightM)) * 100) / 100;
  const { getBmiColor, getBmiSeverity } = await import('../utils/bmiClassification');

  return {
    engine: 'bmi',
    bmi,
    category: getBmiCategory(bmi),
    color: getBmiColor(bmi),
    severity: getBmiSeverity(bmi),
  };
}

export { getZScoreColor };
