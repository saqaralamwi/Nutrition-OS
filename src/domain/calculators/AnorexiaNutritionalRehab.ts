export type MedicalStability = 'stable' | 'unstable';
export type RiskLevel = 'low' | 'moderate' | 'high';
export type SupervisionLevel = 'outpatient' | 'dayPatient' | 'inpatient';

export interface AnorexiaRehabInput {
  age: number;
  weight: number;
  targetWeight: number;
  bmi: number;
  medicalStability: MedicalStability;
  riskLevel: RiskLevel;
}

export interface AnorexiaRehabResult {
  startCalories: number;
  increasePerDay: number;
  weeklyIncrease: number;
  supervisionLevel: SupervisionLevel;
  isSafe: boolean;
  errorCode?: string;
  message?: string;
}

export class AnorexiaNutritionalRehab {
  static calculate(input: AnorexiaRehabInput): AnorexiaRehabResult {
    const { age, weight, targetWeight, bmi, medicalStability, riskLevel } = input;

    if (
      isNaN(age) || isNaN(weight) || isNaN(targetWeight) || isNaN(bmi) ||
      age <= 0 || weight <= 0 || targetWeight <= 0 || bmi <= 0
    ) {
      return {
        startCalories: 0,
        increasePerDay: 0,
        weeklyIncrease: 0,
        supervisionLevel: 'outpatient',
        isSafe: false,
        errorCode: 'INVALID_INPUT',
        message: 'جميع القيم يجب أن تكون أرقاماً موجبة',
      };
    }

    let startCalories: number;
    if (bmi < 15) {
      startCalories = 1000;
    } else if (bmi < 16) {
      startCalories = 1200;
    } else if (bmi < 17) {
      startCalories = 1400;
    } else {
      startCalories = 1600;
    }

    const increasePerDay = riskLevel === 'low' ? 100
      : riskLevel === 'moderate' ? 50
      : 25;

    const weeklyIncrease = riskLevel === 'low' ? 0.5
      : riskLevel === 'moderate' ? 0.3
      : 0.1;

    const supervisionLevel: SupervisionLevel = medicalStability === 'unstable' || bmi < 15
      ? 'inpatient'
      : bmi < 17
      ? 'dayPatient'
      : 'outpatient';

    return {
      startCalories,
      increasePerDay,
      weeklyIncrease,
      supervisionLevel,
      isSafe: true,
    };
  }
}
