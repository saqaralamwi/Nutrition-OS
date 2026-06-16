export interface IICRCalculationResult {
  icrValue: number;
  isSafe: boolean;
  clinicalNote: string;
}

export class InsulinCarbRatioEngine {
  private static readonly RULE_OF_500 = 500;

  public static calculateICR(totalDailyDose: number): IICRCalculationResult {
    if (totalDailyDose <= 0 || !isFinite(totalDailyDose)) {
      return {
        icrValue: 0,
        isSafe: false,
        clinicalNote: 'إجمالي جرعة الإنسولين اليومية يجب أن تكون أكبر من الصفر لحساب معامل الكربوهيدرات',
      };
    }

    const icrValue = Math.round((this.RULE_OF_500 / totalDailyDose) * 100) / 100;

    return {
      icrValue,
      isSafe: true,
      clinicalNote: `وحدة واحدة من الإنسولين السريع تغطي ${icrValue} غرام من الكربوهيدرات`,
    };
  }
}
