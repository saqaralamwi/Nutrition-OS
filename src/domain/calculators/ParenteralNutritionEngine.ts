export interface IParenteralInput {
  targetCalories: number;
  targetProteinGrams: number;
  totalFluidLimitMl: number;
  routeType: 'central' | 'peripheral';
}

export interface IParenteralOutput {
  dextroseGrams: number;
  lipidGrams: number;
  proteinCalories: number;
  nonProteinCalories: number;
  predictedOsmolarity: number;
  isOsmolarityViolation: boolean;
  isSafe: boolean;
  arabicClinicalAlerts: string[];
}

export class ParenteralNutritionEngine {
  private static readonly KCAL_PER_GRAM_PROTEIN = 4.0;
  private static readonly KCAL_PER_GRAM_DEXTROSE = 3.4;
  private static readonly KCAL_PER_GRAM_LIPID = 9.0;
  private static readonly NON_PROTEIN_DEXTROSE_FRAC = 0.70;
  private static readonly NON_PROTEIN_LIPID_FRAC = 0.30;
  private static readonly PERIPHERAL_OSMOLARITY_LIMIT = 900;
  private static readonly OSMOLARITY_BASELINE = 300;

  public static calculateParenteralFeed(input: IParenteralInput): IParenteralOutput {
    const { targetCalories, targetProteinGrams, totalFluidLimitMl, routeType } = input;

    if (targetCalories <= 0 || targetProteinGrams <= 0 || totalFluidLimitMl <= 0) {
      return ParenteralNutritionEngine.safeFallback(['الرجاء التحقق من المدخلات؛ القيم يجب أن تكون أكبر من الصفر']);
    }

    const proteinCalories = targetProteinGrams * ParenteralNutritionEngine.KCAL_PER_GRAM_PROTEIN;

    if (proteinCalories >= targetCalories) {
      return ParenteralNutritionEngine.safeFallback([
        'الرجاء تقليل كمية البروتين؛ السعرات الحرارية من البروتين تتجاوز السعرات المستهدفة',
      ]);
    }

    const nonProteinCalories = targetCalories - proteinCalories;

    const dextroseCalories = nonProteinCalories * ParenteralNutritionEngine.NON_PROTEIN_DEXTROSE_FRAC;
    const lipidCalories = nonProteinCalories * ParenteralNutritionEngine.NON_PROTEIN_LIPID_FRAC;

    const rawDextroseGrams = dextroseCalories / ParenteralNutritionEngine.KCAL_PER_GRAM_DEXTROSE;
    const rawLipidGrams = lipidCalories / ParenteralNutritionEngine.KCAL_PER_GRAM_LIPID;

    const totalVolumeLiters = totalFluidLimitMl / 1000;
    const rawPredictedOsmolarity =
      ((rawDextroseGrams * 5) + (targetProteinGrams * 10)) / totalVolumeLiters
      + ParenteralNutritionEngine.OSMOLARITY_BASELINE;

    const dextroseGrams = ParenteralNutritionEngine.round2(rawDextroseGrams);
    const lipidGrams = ParenteralNutritionEngine.round2(rawLipidGrams);
    const predictedOsmolarity = ParenteralNutritionEngine.round2(rawPredictedOsmolarity);

    const isOsmolarityViolation =
      routeType === 'peripheral' && predictedOsmolarity > ParenteralNutritionEngine.PERIPHERAL_OSMOLARITY_LIMIT;

    const alerts: string[] = [
      `سعرات البروتين: ${ParenteralNutritionEngine.round2(proteinCalories)} سعرة`,
      `سعرات غير بروتينية: ${ParenteralNutritionEngine.round2(nonProteinCalories)} سعرة`,
      `الجلوكوز: ${dextroseGrams} غ (${ParenteralNutritionEngine.round2(dextroseCalories)} سعرة)`,
      `الدهون: ${lipidGrams} غ (${ParenteralNutritionEngine.round2(lipidCalories)} سعرة)`,
      `الأسمولية المتوقعة: ${predictedOsmolarity} mOsm/L`,
    ];

    if (isOsmolarityViolation) {
      alerts.push(
        `تحذير خطير: الأسمولية (${predictedOsmolarity}) تتجاوز حد 900 للوريد المحيطي - خطر حدوث التهاب وريدي`,
      );
    }

    return {
      dextroseGrams,
      lipidGrams,
      proteinCalories: ParenteralNutritionEngine.round2(proteinCalories),
      nonProteinCalories: ParenteralNutritionEngine.round2(nonProteinCalories),
      predictedOsmolarity,
      isOsmolarityViolation,
      isSafe: !isOsmolarityViolation,
      arabicClinicalAlerts: alerts,
    };
  }

  private static safeFallback(alerts: string[]): IParenteralOutput {
    return {
      dextroseGrams: 0,
      lipidGrams: 0,
      proteinCalories: 0,
      nonProteinCalories: 0,
      predictedOsmolarity: 0,
      isOsmolarityViolation: false,
      isSafe: false,
      arabicClinicalAlerts: alerts,
    };
  }

  private static round2(value: number): number {
    return parseFloat(value.toFixed(2));
  }
}
