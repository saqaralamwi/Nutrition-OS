import type { ILactationInput, ILactationOutput } from '../../data/types/surgical_life';

export class LactationIncrementEngine {
  public static calculateLactationIncrements(input: ILactationInput): ILactationOutput {
    const { baselineCalories: baseCal, baselineProteinGrams: baseProt, baselineFluidsMl: baseFluid, monthsPostpartum: months, isExclusivelyBreastfeeding: isEbf } = input;

    if (months < 0 || months > 12 || baseCal <= 0 || baseProt <= 0 || baseFluid <= 0 || isNaN(months) || isNaN(baseCal) || isNaN(baseProt) || isNaN(baseFluid)) {
      return {
        energyIncrement: 0,
        proteinIncrement: 0,
        fluidIncrement: 0,
        totalCaloriesTarget: 0,
        totalProteinGramsTarget: 0,
        totalFluidsMlTarget: 0,
        isSafe: false,
        arabicClinicalAlerts: ['الرجاء إدخال قيم صحيحة: أشهر ما بعد الولادة (0-12)، السعرات الأساسية، البروتين الأساسي، والسوائل الأساسية'],
      };
    }

    let energyIncrement: number;
    let proteinIncrement: number;
    let fluidIncrement: number;
    const alerts: string[] = [];

    if (!isEbf) {
      energyIncrement = 0;
      proteinIncrement = 0;
      fluidIncrement = 0;
    } else if (months <= 6) {
      energyIncrement = 500.00;
      proteinIncrement = 25.00;
      fluidIncrement = 1000.00;
      alerts.push('🤱 إرشادات الرضاعة الحصرية (0-6 أشهر): تفرض المنظومة زيادة طاقة بـ 500 سعرة، وبروتين بـ 25 غراماً، ودعم مائي إجباري بمقدار 1000 مل لتعويض الإفراز الفسيولوجي اليومي للحليب وحماية المجرى البولي للأم من الترسبات الكلوية');
    } else {
      energyIncrement = 400.00;
      proteinIncrement = 19.00;
      fluidIncrement = 800.00;
    }

    const totalCaloriesTarget = LactationIncrementEngine.round2(baseCal + energyIncrement);
    const totalProteinGramsTarget = LactationIncrementEngine.round2(baseProt + proteinIncrement);
    const totalFluidsMlTarget = LactationIncrementEngine.round2(baseFluid + fluidIncrement);

    return {
      energyIncrement: LactationIncrementEngine.round2(energyIncrement),
      proteinIncrement: LactationIncrementEngine.round2(proteinIncrement),
      fluidIncrement: LactationIncrementEngine.round2(fluidIncrement),
      totalCaloriesTarget,
      totalProteinGramsTarget,
      totalFluidsMlTarget,
      isSafe: true,
      arabicClinicalAlerts: alerts,
    };
  }

  private static round2(value: number): number {
    return parseFloat(value.toFixed(2));
  }
}
