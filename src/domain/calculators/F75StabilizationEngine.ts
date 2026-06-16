export interface IF75FeedingInput {
  weightKg: number;
  hasSevereEdema: boolean;
  feedFrequency: 8 | 12;
}

export interface IF75FeedingOutput {
  totalDailyVolumeMl: number;
  volumePerFeedMl: number;
  totalDailyCalories: number;
  feedIntervalHours: number;
  isSafe: boolean;
  clinicalInstructions: string[];
}

export class F75StabilizationEngine {
  private static readonly F75_CALORIES_PER_100ML = 75;

  public static calculateStabilizationFeeds(input: IF75FeedingInput): IF75FeedingOutput {
    if (input.weightKg <= 0) {
      return {
        totalDailyVolumeMl: 0,
        volumePerFeedMl: 0,
        totalDailyCalories: 0,
        feedIntervalHours: input.feedFrequency === 8 ? 3 : 2,
        isSafe: false,
        clinicalInstructions: [
          'الوزن المدخل غير صالح (صفر أو أقل) - يجب إدخال وزن صحيح لإجراء الحسابات',
        ],
      };
    }

    const dailyMlPerKg = input.hasSevereEdema ? 100 : 130;
    const totalDailyVolumeMl = Math.round(input.weightKg * dailyMlPerKg * 10) / 10;
    const volumePerFeedMl = Math.round((totalDailyVolumeMl / input.feedFrequency) * 10) / 10;
    const totalDailyCalories = Math.round((totalDailyVolumeMl * this.F75_CALORIES_PER_100ML) / 100 * 10) / 10;
    const feedIntervalHours = input.feedFrequency === 8 ? 3 : 2;

    const instructions: string[] = [
      'استخدام حليب F-75 العلاجي بتركيز 75 سعرة حرارية لكل 100 مل',
      `الحجم الكلي اليومي: ${totalDailyVolumeMl} مل (${dailyMlPerKg} مل/كغ/يوم)`,
      `حجم الرضعة الواحدة: ${volumePerFeedMl} مل كل ${feedIntervalHours} ساعات (${input.feedFrequency} رضعات/يوم)`,
      'مراقبة درجة الحرارة ومعدل التنفس قبل كل رضعة لمنع الاختناق',
      'تقديم الرضعات ببطء عبر فنجان أو أنبوب أنفي معدي حسب حالة الطفل',
    ];

    if (input.hasSevereEdema) {
      instructions.push('تقييد السوائل بسبب الوذمة الشديدة - مراقبة علامات فرط الحمل الدوري');
    }

    return {
      totalDailyVolumeMl,
      volumePerFeedMl,
      totalDailyCalories,
      feedIntervalHours,
      isSafe: true,
      clinicalInstructions: instructions,
    };
  }
}
