export interface IRehabFeedingInput {
  weightKg: number;
  feedingType: 'F100' | 'RUTF';
  targetCaloricDensity: number;
  feedFrequency: number;
}

export interface IRehabFeedingOutput {
  totalDailyCaloriesRequired: number;
  totalDailyVolumeMl: number;
  volumePerFeedMl: number;
  rutfPacketsPerDay: number;
  isSafe: boolean;
  clinicalInstructions: string[];
}

export class F100RehabilitationEngine {
  private static readonly F100_CALORIES_PER_100ML = 100;
  private static readonly RUTF_KCAL_PER_PACKET = 500;
  private static readonly MIN_CALORIC_DENSITY = 150;
  private static readonly MAX_CALORIC_DENSITY = 200;

  public static calculateRehabilitationFeeds(input: IRehabFeedingInput): IRehabFeedingOutput {
    if (input.weightKg <= 0) {
      return {
        totalDailyCaloriesRequired: 0,
        totalDailyVolumeMl: 0,
        volumePerFeedMl: 0,
        rutfPacketsPerDay: 0,
        isSafe: false,
        clinicalInstructions: [
          'الوزن المدخل غير صالح (صفر أو أقل) - يجب إدخال وزن صحيح لإجراء الحسابات',
        ],
      };
    }

    if (input.targetCaloricDensity < this.MIN_CALORIC_DENSITY || input.targetCaloricDensity > this.MAX_CALORIC_DENSITY) {
      return {
        totalDailyCaloriesRequired: 0,
        totalDailyVolumeMl: 0,
        volumePerFeedMl: 0,
        rutfPacketsPerDay: 0,
        isSafe: false,
        clinicalInstructions: [
          `الكثافة السعرية المستهدفة (${input.targetCaloricDensity} سعرة/كغ/يوم) خارج النطاق المسموح (${this.MIN_CALORIC_DENSITY}-${this.MAX_CALORIC_DENSITY})`,
        ],
      };
    }

    const totalDailyCaloriesRequired = Math.round(input.weightKg * input.targetCaloricDensity * 100) / 100;

    if (input.feedingType === 'F100') {
      const totalDailyVolumeMl = Math.round(totalDailyCaloriesRequired * 100 / this.F100_CALORIES_PER_100ML * 100) / 100;
      const volumePerFeedMl = input.feedFrequency > 0
        ? Math.round(totalDailyVolumeMl / input.feedFrequency * 100) / 100
        : 0;

      return {
        totalDailyCaloriesRequired,
        totalDailyVolumeMl,
        volumePerFeedMl,
        rutfPacketsPerDay: 0,
        isSafe: true,
        clinicalInstructions: [
          `استخدام حليب F-100 العلاجي بتركيز ${this.F100_CALORIES_PER_100ML} سعرة حرارية لكل 100 مل`,
          `السعرات الحرارية الكلية اليومية: ${totalDailyCaloriesRequired} سعرة`,
          `الحجم الكلي اليومي: ${totalDailyVolumeMl} مل`,
          `حجم الرضعة الواحدة: ${volumePerFeedMl} مل (${input.feedFrequency} رضعات/يوم)`,
          'مراقبة علامات تحمل التغذية وإعادة التغذية بحذر لتجنب متلازمة إعادة التغذية',
        ],
      };
    }

    const rutfPacketsPerDay = Math.round(totalDailyCaloriesRequired / this.RUTF_KCAL_PER_PACKET * 100) / 100;

    return {
      totalDailyCaloriesRequired,
      totalDailyVolumeMl: 0,
      volumePerFeedMl: 0,
      rutfPacketsPerDay,
      isSafe: true,
      clinicalInstructions: [
        'استخدام معجون RUTF العلاجي الجاهز للإستخدام',
        `السعرات الحرارية الكلية اليومية: ${totalDailyCaloriesRequired} سعرة`,
        `عدد عبوات RUTF اليومي: ${rutfPacketsPerDay} عبوة (كل عبوة 92 غم تعطي ${this.RUTF_KCAL_PER_PACKET} سعرة)`,
        'يجب تشجيع الطفل على شرب الماء النقي بكميات كافية عند تناول الـ RUTF لتجنب الجفاف بسبب كثافة البروتين والسكر',
        'تقديم RUTF على وجبات صغيرة متعددة خلال اليوم لضمان الامتصاص الجيد',
      ],
    };
  }
}
