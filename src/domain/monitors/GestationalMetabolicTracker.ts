export interface IGDMTrackerInput {
  fastingBloodGlucose: number;
  twoHourPostPrandial: number;
  hba1c: number;
  morningUrineKetonesPresent: boolean;
}

export interface IGDMTrackerOutput {
  ketosisStatus: 'safe' | 'danger';
  isFastingTargetAchieved: boolean;
  isPostPrandialTargetAchieved: boolean;
  glycemicControlRating: 'excellent' | 'suboptimal' | 'critical';
  requiresImmediateCarbAdjustment: boolean;
  clinicalAlerts: string[];
}

const FASTING_TARGET = 95;
const POSTPRANDIAL_TARGET = 120;
const HBA1C_TARGET = 6.0;

export class GestationalMetabolicTracker {
  public static evaluatePregnancyMetabolism(input: IGDMTrackerInput): IGDMTrackerOutput {
    if (
      input.fastingBloodGlucose <= 0 ||
      input.twoHourPostPrandial <= 0 ||
      input.hba1c <= 0 ||
      !isFinite(input.fastingBloodGlucose) ||
      !isFinite(input.twoHourPostPrandial) ||
      !isFinite(input.hba1c)
    ) {
      return {
        ketosisStatus: 'safe',
        isFastingTargetAchieved: false,
        isPostPrandialTargetAchieved: false,
        glycemicControlRating: 'critical',
        requiresImmediateCarbAdjustment: false,
        clinicalAlerts: [
          'بيانات الإدخال غير صالحة - تأكد من أن قياسات الجلوكوز ومستوى HbA1c أكبر من صفر',
        ],
      };
    }

    const alerts: string[] = [];
    let requiresImmediateCarbAdjustment = false;
    let ketosisStatus: 'safe' | 'danger' = 'safe';

    if (input.morningUrineKetonesPresent) {
      ketosisStatus = 'danger';
      requiresImmediateCarbAdjustment = true;
      alerts.push(
        '🚨 تحذير حرج: وجود أجسام كيتونية في البول الصباحي يشير إلى كيتوزية المجاعة نتيجة التقييد المفرط للكربوهيدرات! يجب رفع حصص الكربوهيدرات المعقدة فوراً لحماية الجهاز العصبي للجنين',
      );
    }

    const isFastingTargetAchieved = input.fastingBloodGlucose < FASTING_TARGET;
    if (!isFastingTargetAchieved) {
      alerts.push(
        `سكر الصيام مرتفع (${input.fastingBloodGlucose} ملغم/دل) - الهدف أقل من ${FASTING_TARGET} ملغم/دل`,
      );
    }

    const isPostPrandialTargetAchieved = input.twoHourPostPrandial < POSTPRANDIAL_TARGET;
    if (!isPostPrandialTargetAchieved) {
      alerts.push(
        `سكر ما بعد الأكل مرتفع (${input.twoHourPostPrandial} ملغم/دل) - الهدف أقل من ${POSTPRANDIAL_TARGET} ملغم/دل`,
      );
    }

    const hba1cTargetAchieved = input.hba1c < HBA1C_TARGET;
    let glycemicControlRating: 'excellent' | 'suboptimal' | 'critical' = 'excellent';

    if (input.morningUrineKetonesPresent) {
      glycemicControlRating = 'critical';
    } else if (!isFastingTargetAchieved || !isPostPrandialTargetAchieved || !hba1cTargetAchieved) {
      if (input.hba1c >= HBA1C_TARGET) {
        alerts.push(
          `مستوى HbA1c مرتفع (${input.hba1c}%) - الهدف أقل من ${HBA1C_TARGET}% للتخفيف من مخاطر الجنين`,
        );
      }
      glycemicControlRating = input.hba1c >= HBA1C_TARGET ? 'critical' : 'suboptimal';
    }

    return {
      ketosisStatus,
      isFastingTargetAchieved,
      isPostPrandialTargetAchieved,
      glycemicControlRating,
      requiresImmediateCarbAdjustment,
      clinicalAlerts: alerts,
    };
  }
}
