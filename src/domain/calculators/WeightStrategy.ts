import { calculateIbw } from './IbwCalculator';
import { calculateAbw } from './AbwCalculator';

export type BodyWeightCategory = 'underweight' | 'normal' | 'overweight' | 'obese';
export type NutritionCondition = 'standard' | 'chronic_disease' | 'icu_critical' | 'renal_dialysis' | 'burn';

function classifyBmi(weightKg: number, heightCm: number): BodyWeightCategory {
  if (heightCm <= 0 || weightKg <= 0) return 'normal';
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

export interface IWeightStrategyInput {
  actualWeightKg: number;
  heightCm: number;
  gender: 'male' | 'female';
  condition: NutritionCondition;
}

export interface IWeightStrategyResult {
  selectedWeightKg: number;
  weightCategory: BodyWeightCategory;
  strategyUsed: 'actual' | 'adjusted' | 'ideal' | 'dry_estimate';
  description: string;
}

export class WeightStrategy {
  public static select(input: IWeightStrategyInput): IWeightStrategyResult {
    const { actualWeightKg, heightCm, gender, condition } = input;

    if (isNaN(actualWeightKg) || isNaN(heightCm) || actualWeightKg <= 0 || heightCm <= 0) {
      return {
        selectedWeightKg: 0,
        weightCategory: 'normal',
        strategyUsed: 'actual',
        description: 'الرجاء إدخال قيم صحيحة للوزن والطول',
      };
    }

    const category = classifyBmi(actualWeightKg, heightCm);

    switch (condition) {
      case 'burn':
      case 'icu_critical': {
        if (category === 'obese') {
          const ibw = calculateIbw(heightCm, gender === 'male');
          const abw = calculateAbw(actualWeightKg, ibw.value);
          const adjusted = abw ? abw.value : actualWeightKg;
          return {
            selectedWeightKg: parseFloat(adjusted.toFixed(1)),
            weightCategory: category,
            strategyUsed: 'adjusted',
            description: `وزن مصحح للعناية الحرجة: ${parseFloat(adjusted.toFixed(1))} كجم`,
          };
        }
        return {
          selectedWeightKg: actualWeightKg,
          weightCategory: category,
          strategyUsed: 'actual',
          description: `الوزن الفعلي: ${actualWeightKg} كجم`,
        };
      }

      case 'renal_dialysis': {
        return {
          selectedWeightKg: actualWeightKg,
          weightCategory: category,
          strategyUsed: 'dry_estimate',
          description: `الوزن الجاف المقدر: ${actualWeightKg} كجم (وزن فعلي يُستخدم كأساس)`,
        };
      }

      case 'chronic_disease': {
        if (category === 'obese') {
          const ibw = calculateIbw(heightCm, gender === 'male');
          const abw = calculateAbw(actualWeightKg, ibw.value);
          const adjusted = abw ? abw.value : actualWeightKg;
          return {
            selectedWeightKg: parseFloat(adjusted.toFixed(1)),
            weightCategory: category,
            strategyUsed: 'adjusted',
            description: `وزن مصحح للأمراض المزمنة: ${parseFloat(adjusted.toFixed(1))} كجم`,
          };
        }
        return {
          selectedWeightKg: actualWeightKg,
          weightCategory: category,
          strategyUsed: 'actual',
          description: `الوزن الفعلي: ${actualWeightKg} كجم`,
        };
      }

      default: {
        return {
          selectedWeightKg: actualWeightKg,
          weightCategory: category,
          strategyUsed: 'actual',
          description: `الوزن الفعلي: ${actualWeightKg} كجم`,
        };
      }
    }
  }
}
