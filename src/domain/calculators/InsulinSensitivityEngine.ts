export interface IISFInput {
  totalDailyDose: number;
  currentBloodGlucose: number;
  targetBloodGlucose: number;
}

export interface IISFCalculationResult {
  isfValue: number;
  correctionDose: number;
  isSafe: boolean;
  clinicalDirective: string[];
}

export class InsulinSensitivityEngine {
  private static readonly RULE_OF_1800 = 1800;

  public static calculateCorrection(input: IISFInput): IISFCalculationResult {
    if (isNaN(input.totalDailyDose) || input.totalDailyDose <= 0 || !isFinite(input.totalDailyDose)) {
      return {
        isfValue: 0,
        correctionDose: 0,
        isSafe: false,
        clinicalDirective: [
          'إجمالي جرعة الإنسولين اليومية يجب أن تكون أكبر من الصفر لحساب معامل الحساسية',
        ],
      };
    }

    const isfValue = Math.round((this.RULE_OF_1800 / input.totalDailyDose) * 100) / 100;

    if (input.currentBloodGlucose <= input.targetBloodGlucose) {
      return {
        isfValue,
        correctionDose: 0,
        isSafe: true,
        clinicalDirective: [
          `مستوى السكر الحالي (${input.currentBloodGlucose} ملغم/دل) ضمن أو أقل من المستوى المستهدف (${input.targetBloodGlucose} ملغم/دل)`,
          'لا حاجة لجرعة تصحيحية في هذا الوقت',
        ],
      };
    }

    const glucoseDiff = input.currentBloodGlucose - input.targetBloodGlucose;
    const correctionDose = Math.round((glucoseDiff / isfValue) * 100) / 100;

    return {
      isfValue,
      correctionDose,
      isSafe: true,
      clinicalDirective: [
        `معامل الحساسية للأنسولين (ISF): وحدة واحدة تخفض السكر بمقدار ${isfValue} ملغم/دل`,
        `الجرعة التصحيحية المطلوبة: ${correctionDose} وحدة من الإنسولين السريع`,
        `نسبة السكر الحالية ${input.currentBloodGlucose} ملغم/دل - الهدف ${input.targetBloodGlucose} ملغم/دل`,
      ],
    };
  }
}
