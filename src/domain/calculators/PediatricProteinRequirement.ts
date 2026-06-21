export interface PediatricProteinInput {
  ageInMonths: number;
  weightKg: number;
  isCriticallyIll: boolean;
  hasRenalImpairment: boolean;
  hasLiverImpairment: boolean;
  onCRRT: boolean;
}

export interface PediatricProteinOutput {
  proteinGramsPerDay: number;
  gPerKg: number;
  isSafe: boolean;
  guidelineSource: string;
}

export class PediatricProteinRequirement {
  private static AGE_BANDS = [
    { maxMonths: 1, gPerKg: 2.0 },
    { maxMonths: 12, gPerKg: 1.5 },
    { maxMonths: 36, gPerKg: 1.1 },
    { maxMonths: 216, gPerKg: 0.95 },
    { maxMonths: Infinity, gPerKg: 0.85 },
  ];

  public static calculate(input: PediatricProteinInput): PediatricProteinOutput {
    const { ageInMonths, weightKg, isCriticallyIll, hasRenalImpairment, hasLiverImpairment, onCRRT } = input;

    if (isNaN(weightKg) || weightKg <= 0) {
      return { proteinGramsPerDay: 0, gPerKg: 0, isSafe: false, guidelineSource: 'الوزن غير صالح' };
    }

    if (isNaN(ageInMonths) || ageInMonths < 0) {
      return { proteinGramsPerDay: 0, gPerKg: 0, isSafe: false, guidelineSource: 'العمر غير صالح' };
    }

    if (hasRenalImpairment && hasLiverImpairment) {
      return { proteinGramsPerDay: 0, gPerKg: 0, isSafe: false, guidelineSource: 'لا يمكن حساب البروتين مع القصور الكلوي والكبدي معاً - استشر أخصائي التغذية' };
    }

    let gPerKg = 0;

    for (const band of PediatricProteinRequirement.AGE_BANDS) {
      if (ageInMonths <= band.maxMonths) {
        gPerKg = band.gPerKg;
        break;
      }
    }

    if (gPerKg === 0) {
      gPerKg = 0.85;
    }

    let source = 'إرشادات ESPGHAN/ESPEN لتغذية الأطفال';

    if (isCriticallyIll) {
      gPerKg *= 1.5;
      source += ' - مضاعفة لحالة حرجة (×1.5)';
    }

    if (onCRRT) {
      gPerKg += 0.2;
      source += ' - إضافة 0.2 غ/كغ لاستمرار غسيل الكلى';
    }

    if (hasRenalImpairment && !onCRRT) {
      gPerKg = Math.min(gPerKg, 1.0);
      source += ' - حد أقصى 1.0 غ/كغ للقصور الكلوي';
    }

    if (hasLiverImpairment) {
      gPerKg = Math.min(gPerKg, 1.2);
      source += ' - حد أقصى 1.2 غ/كغ للقصور الكبدي';
    }

    const proteinGrams = parseFloat((gPerKg * weightKg).toFixed(2));

    return {
      proteinGramsPerDay: proteinGrams,
      gPerKg: parseFloat(gPerKg.toFixed(2)),
      isSafe: true,
      guidelineSource: source,
    };
  }
}
