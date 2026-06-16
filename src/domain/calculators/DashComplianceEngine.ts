import type { IDashInput, IDashOutput } from '../../data/types/cardiovascular';

export class DashComplianceEngine {
  public static evaluateCardiovascularDiet(input: IDashInput): IDashOutput {
    const { systolicBloodPressure: sbp, diastolicBloodPressure: dbp, totalCholesterol: tc, ldlCholesterol: ldl, triglycerides: tg, targetCalories: cal } = input;

    if (!cal || cal <= 0 || !sbp || sbp <= 0 || !dbp || dbp <= 0 || isNaN(cal) || isNaN(sbp) || isNaN(dbp)) {
      return {
        bpStage: 'normal',
        maxSodiumMg: 0,
        isDyslipidemiaTriggered: false,
        maxSaturatedFatGrams: 0,
        maxDietaryCholesterolMg: 0,
        isSafe: false,
        arabicDirectives: ['الرجاء إدخال قيم صحيحة للضغط والسعرات الحرارية'],
      };
    }

    const { bpStage, maxSodiumMg } = DashComplianceEngine.determineBpStage(sbp, dbp);
    const isDyslipidemiaTriggered = ldl > 100 || tc > 200 || tg > 150;

    let maxSaturatedFatGrams: number;
    let maxDietaryCholesterolMg: number;

    if (isDyslipidemiaTriggered) {
      maxSaturatedFatGrams = (cal * 0.07) / 9;
      maxDietaryCholesterolMg = 200;
    } else {
      maxSaturatedFatGrams = (cal * 0.10) / 9;
      maxDietaryCholesterolMg = 300;
    }

    maxSaturatedFatGrams = DashComplianceEngine.round2(maxSaturatedFatGrams);

    const directives: string[] = [
      `مرحلة ضغط الدم: ${DashComplianceEngine.translateBpStage(bpStage)}`,
      `الحد الأقصى للصوديوم: ${parseFloat(maxSodiumMg.toFixed(2))} ملغ/يوم`,
      ...(isDyslipidemiaTriggered
        ? [`تقليل الدهون المشبعة: ${maxSaturatedFatGrams} غ/يوم (أقل من 7% من الطاقة)`, 'الحد الأقصى للكوليسترول: 200 ملغ/يوم']
        : [`تقليل الدهون المشبعة: ${maxSaturatedFatGrams} غ/يوم (أقل من 10% من الطاقة)`, 'الحد الأقصى للكوليسترول: 300 ملغ/يوم']),
    ];

    return {
      bpStage,
      maxSodiumMg,
      isDyslipidemiaTriggered,
      maxSaturatedFatGrams,
      maxDietaryCholesterolMg,
      isSafe: true,
      arabicDirectives: directives,
    };
  }

  private static determineBpStage(sbp: number, dbp: number): { bpStage: IDashOutput['bpStage']; maxSodiumMg: number } {
    if (sbp < 120 && dbp < 80) {
      return { bpStage: 'normal', maxSodiumMg: 2300 };
    }
    if (sbp >= 120 && sbp <= 129 && dbp < 80) {
      return { bpStage: 'elevated', maxSodiumMg: 2000 };
    }
    if ((sbp >= 130 && sbp <= 139) || (dbp >= 80 && dbp <= 89)) {
      return { bpStage: 'stage_1_hypertension', maxSodiumMg: 1500 };
    }
    return { bpStage: 'stage_2_hypertension', maxSodiumMg: 1500 };
  }

  private static translateBpStage(stage: IDashOutput['bpStage']): string {
    const map: Record<IDashOutput['bpStage'], string> = {
      normal: 'طبيعي',
      elevated: 'مرتفع',
      stage_1_hypertension: 'ارتفاع ضغط الدم من الدرجة الأولى',
      stage_2_hypertension: 'ارتفاع ضغط الدم من الدرجة الثانية',
    };
    return map[stage];
  }

  private static round2(value: number): number {
    return parseFloat(value.toFixed(2));
  }
}
