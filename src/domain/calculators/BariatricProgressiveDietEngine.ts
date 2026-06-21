export interface IBariatricInput {
  surgeryType: 'gastric_sleeve' | 'roux_en_y_bypass' | 'mini_bypass' | 'none';
  postOpDayMilestone: number;
  weightKg: number;
  hasDumpingSyndromeSymptoms: boolean;
}

export interface IBariatricOutput {
  currentPhaseCode: string;
  phaseArabicLabel: string;
  targetCalories: number;
  targetProteinGrams: number;
  minimumFluidMl: number;
  requiresAntiDumpingProtocols: boolean;
  isSafe: boolean;
  clinicalDirectives: string[];
}

export class BariatricProgressiveDietEngine {
  public static calculateBariatricDiet(input: IBariatricInput): IBariatricOutput {
    const { surgeryType, postOpDayMilestone, weightKg, hasDumpingSyndromeSymptoms } = input;

    if (surgeryType === 'none' || isNaN(postOpDayMilestone) || isNaN(weightKg) || postOpDayMilestone < 0 || weightKg <= 0) {
      return {
        currentPhaseCode: 'none',
        phaseArabicLabel: '',
        targetCalories: 0,
        targetProteinGrams: 0,
        minimumFluidMl: 0,
        requiresAntiDumpingProtocols: false,
        isSafe: false,
        clinicalDirectives: ['الرجاء التحقق من المدخلات؛ نوع الجراحة وعدد الأيام والوزن غير صالحة'],
      };
    }

    const phase = BariatricProgressiveDietEngine.resolvePhase(postOpDayMilestone);
    const intrinsicDumpingRisk = surgeryType === 'roux_en_y_bypass' || surgeryType === 'mini_bypass';
    const requiresAntiDumpingProtocols = hasDumpingSyndromeSymptoms || intrinsicDumpingRisk;

    const directives: string[] = [
      `المرحلة الحالية: ${phase.arabicLabel}`,
      `السعرات المستهدفة: ${phase.targetCalories} سعرة/يوم`,
      `البروتين المستهدف: ${phase.targetProteinGrams} غ/يوم`,
      `الحد الأدنى للسوائل: ${phase.minimumFluidMl} مل/يوم`,
    ];

    if (requiresAntiDumpingProtocols) {
      directives.push(
        'بروتوكول منع الإفراغ السريع نشط: يمنع منعاً باتاً تناول السوائل مع الوجبات الصلبة؛ يجب فصل السوائل بفارق 30 دقيقة قبل أو بعد الأكل',
      );
      directives.push(
        'تقييد صارم للسكريات البسيطة والكربوهيدرات المكررة عالية الأسمولية لتفادي الهبوط المفاجئ وسحب السوائل للأمعاء',
      );
    }

    return {
      currentPhaseCode: phase.code,
      phaseArabicLabel: phase.arabicLabel,
      targetCalories: phase.targetCalories,
      targetProteinGrams: phase.targetProteinGrams,
      minimumFluidMl: phase.minimumFluidMl,
      requiresAntiDumpingProtocols,
      isSafe: true,
      clinicalDirectives: directives,
    };
  }

  private static resolvePhase(postOpDay: number): {
    code: string;
    arabicLabel: string;
    targetCalories: number;
    targetProteinGrams: number;
    minimumFluidMl: number;
  } {
    if (postOpDay <= 2) {
      return {
        code: 'stage_1_clear_liquids',
        arabicLabel: 'المرحلة الأولى: السوائل الشفافة الزلالية',
        targetCalories: 0,
        targetProteinGrams: 0,
        minimumFluidMl: 1500,
      };
    }
    if (postOpDay <= 14) {
      return {
        code: 'stage_2_full_liquids',
        arabicLabel: 'المرحلة الثانية: السوائل الكاملة والمخفوقات المدعمة',
        targetCalories: 0,
        targetProteinGrams: 60.00,
        minimumFluidMl: 1500,
      };
    }
    if (postOpDay <= 30) {
      return {
        code: 'stage_3_pureed_diet',
        arabicLabel: 'المرحلة الثالثة: الأطعمة المهروسة والمطحونة كلياً',
        targetCalories: 500.00,
        targetProteinGrams: 65.00,
        minimumFluidMl: 1500,
      };
    }
    if (postOpDay <= 60) {
      return {
        code: 'stage_4_soft_diet',
        arabicLabel: 'المرحلة الرابعة: الأطعمة اللينة سهلة المضغ',
        targetCalories: 750.00,
        targetProteinGrams: 70.00,
        minimumFluidMl: 1500,
      };
    }
    return {
      code: 'stage_5_regular_bariatric',
      arabicLabel: 'المرحلة الخامسة: النمط الغذائي المستدام لجراحات السمنة',
      targetCalories: 1100.00,
      targetProteinGrams: 80.00,
      minimumFluidMl: 1500,
    };
  }
}
