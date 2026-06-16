import type { IPregnancyInput, IPregnancyOutput } from '../../data/types/surgical_life';

export class PregnancyIncrementEngine {
  public static calculatePregnancyIncrements(input: IPregnancyInput): IPregnancyOutput {
    const { baselineCalories: baseCal, baselineProteinGrams: baseProt, gestationalAgeWeeks: weeks, prePregnancyBmi: bmi } = input;

    if (weeks <= 0 || weeks > 42 || baseCal <= 0 || baseProt <= 0 || bmi <= 0 || isNaN(weeks) || isNaN(baseCal) || isNaN(baseProt) || isNaN(bmi)) {
      return {
        trimester: 1,
        energyIncrement: 0,
        proteinIncrement: 0,
        totalCaloriesTarget: 0,
        totalProteinGramsTarget: 0,
        recommendedWeightGainMinKg: 0,
        recommendedWeightGainMaxKg: 0,
        isSafe: false,
        arabicClinicalAlerts: ['الرجاء إدخال قيم صحيحة لعمر الحمل ومؤشر كتلة الجسم والسعرات الأساسية'],
      };
    }

    let trimester: number;
    let energyIncrement: number;
    let proteinIncrement: number;

    if (weeks >= 1 && weeks <= 13) {
      trimester = 1;
      energyIncrement = 0;
      proteinIncrement = 1.00;
    } else if (weeks >= 14 && weeks <= 26) {
      trimester = 2;
      energyIncrement = 340.00;
      proteinIncrement = 21.00;
    } else {
      trimester = 3;
      energyIncrement = 452.00;
      proteinIncrement = 28.00;
    }

    const totalCaloriesTarget = PregnancyIncrementEngine.round2(baseCal + energyIncrement);
    const totalProteinGramsTarget = PregnancyIncrementEngine.round2(baseProt + proteinIncrement);

    let recommendedWeightGainMinKg: number;
    let recommendedWeightGainMaxKg: number;

    if (bmi < 18.5) {
      recommendedWeightGainMinKg = 12.50;
      recommendedWeightGainMaxKg = 18.00;
    } else if (bmi >= 18.5 && bmi <= 24.9) {
      recommendedWeightGainMinKg = 11.50;
      recommendedWeightGainMaxKg = 16.00;
    } else if (bmi >= 25.0 && bmi <= 29.9) {
      recommendedWeightGainMinKg = 7.00;
      recommendedWeightGainMaxKg = 11.50;
    } else {
      recommendedWeightGainMinKg = 5.00;
      recommendedWeightGainMaxKg = 9.00;
    }

    const alerts: string[] = [];

    if (trimester === 3) {
      alerts.push('🤰 إرشادات الثلث الأخير: تزداد الاحتياجات الطاقية بمقدار 452 سعرة والبروتين بـ 28 غراماً لدعم النمو السريع للكتلة العضلية والعظمية للجنين. يوصى بمراقبة ضغط الدم والزلال لتفادي بوادر تسمم الحمل');
    }

    return {
      trimester,
      energyIncrement: PregnancyIncrementEngine.round2(energyIncrement),
      proteinIncrement: PregnancyIncrementEngine.round2(proteinIncrement),
      totalCaloriesTarget,
      totalProteinGramsTarget,
      recommendedWeightGainMinKg,
      recommendedWeightGainMaxKg,
      isSafe: true,
      arabicClinicalAlerts: alerts,
    };
  }

  private static round2(value: number): number {
    return parseFloat(value.toFixed(2));
  }
}
