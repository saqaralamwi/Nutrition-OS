import type { IFoodExchange, IDietaryHistorySession, IDietaryHistoryItem, ServingUnit, DietaryPatternTag } from '../../data/types/meal_planner';

export interface IClinicalAlertTag {
  type: 'metabolic' | 'renal' | 'respiratory' | 'educational';
  severity: 'critical' | 'warning' | 'info';
  arabicMessage: string;
}

export interface ICalculatedMetabolicTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fluidMl: number;
  hasCo2Retention?: boolean;
  renalStage?: 'severe_aki_ckd';
  isHypermetabolic?: boolean;
  isCeliac?: boolean;
  hasLactoseIntolerance?: boolean;
  dietaryPatternTag?: DietaryPatternTag;
}

export interface IActualTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fluidMl: number;
}

export interface ICoveragePercentages {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fluid: number;
}

export interface IDietaryAnalysisResult {
  actualTotals: IActualTotals;
  coveragePercentages: ICoveragePercentages;
  clinicalAlerts: IClinicalAlertTag[];
  educationalCards: string[];
  isSafe: boolean;
}

interface IRecipeComponent {
  exchangeGroup: string;
  carbsG: number;
  proteinG: number;
  fatG: number;
  caloriesKcal: number;
  servingMultiplier: number;
}

export class DietaryIntakeAnalyzerEngine {
  private static readonly HOUSEHOLD_COEFFICIENTS: Record<string, number> = {
    grams: 1,
    tablespoon: 0.25,
    cup: 2,
    slice: 0.5,
    piece: 1,
  };

  public static analyzeSessionIntake(
    session: IDietaryHistorySession,
    items: IDietaryHistoryItem[],
    masterFoods: IFoodExchange[],
    targets: ICalculatedMetabolicTargets,
  ): IDietaryAnalysisResult {
    const foodMap = new Map<string, IFoodExchange>();
    for (const food of masterFoods) {
      foodMap.set(food.foodNameAr, food);
    }

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFluid = 0;
    const consumedMicronutrients = new Set<string>();
    const highPotassiumFoods: string[] = [];
    const highPhosphorusFoods: string[] = [];

    for (const item of items) {
      const food = foodMap.get(item.customReportedName);
      if (!food) {
        continue;
      }

      const coefficient = DietaryIntakeAnalyzerEngine.getCoefficient(item.servingUnitUsed);
      const baseMultiplier = item.servingsConsumed * coefficient;

      if (food.isCompositeRecipe) {
        const components = DietaryIntakeAnalyzerEngine.parseRecipeComponents(
          food.recipeDecompositionJson,
        );
        for (const comp of components) {
          const compMultiplier = baseMultiplier * comp.servingMultiplier;
          totalCalories += comp.caloriesKcal * compMultiplier;
          totalProtein += comp.proteinG * compMultiplier;
          totalCarbs += comp.carbsG * compMultiplier;
          totalFat += comp.fatG * compMultiplier;
        }
      } else {
        totalCalories += food.caloriesKcal * baseMultiplier;
        totalProtein += food.proteinG * baseMultiplier;
        totalCarbs += food.carbsG * baseMultiplier;
        totalFat += food.fatG * baseMultiplier;
      }

      const itemFluid = item.derivedFluidMl;
      totalFluid += itemFluid;

      if (food.potassiumLevel === 'high') {
        highPotassiumFoods.push(food.foodNameAr);
      }
      if (food.phosphorusLevel === 'high') {
        highPhosphorusFoods.push(food.foodNameAr);
      }

      const tags = DietaryIntakeAnalyzerEngine.parseMicronutrientTags(
        food.micronutrientTagsJson,
      );
      for (const tag of tags) {
        consumedMicronutrients.add(tag);
      }
    }

    const actualTotals: IActualTotals = {
      calories: DietaryIntakeAnalyzerEngine.round2(totalCalories),
      protein: DietaryIntakeAnalyzerEngine.round2(totalProtein),
      carbs: DietaryIntakeAnalyzerEngine.round2(totalCarbs),
      fat: DietaryIntakeAnalyzerEngine.round2(totalFat),
      fluidMl: DietaryIntakeAnalyzerEngine.round2(totalFluid),
    };

    const coveragePercentages = DietaryIntakeAnalyzerEngine.computeCoverage(actualTotals, targets);

    const clinicalAlerts = DietaryIntakeAnalyzerEngine.generateAlerts(
      actualTotals,
      coveragePercentages,
      targets,
      highPotassiumFoods,
      highPhosphorusFoods,
    );

    const educationalCards = DietaryIntakeAnalyzerEngine.generateEducationalCards(
      coveragePercentages,
      targets,
      consumedMicronutrients,
    );

    const isSafe = clinicalAlerts.every((a) => a.severity !== 'critical');

    return {
      actualTotals,
      coveragePercentages,
      clinicalAlerts,
      educationalCards,
      isSafe,
    };
  }

  private static getCoefficient(unit: ServingUnit): number {
    return DietaryIntakeAnalyzerEngine.HOUSEHOLD_COEFFICIENTS[unit] ?? 1;
  }

  private static parseRecipeComponents(json: string): IRecipeComponent[] {
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed)) {
        return parsed as IRecipeComponent[];
      }
      return [];
    } catch {
      return [];
    }
  }

  private static parseMicronutrientTags(json: string): string[] {
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed)) {
        return parsed as string[];
      }
      return [];
    } catch {
      return [];
    }
  }

  private static computeCoverage(
    actual: IActualTotals,
    targets: ICalculatedMetabolicTargets,
  ): ICoveragePercentages {
    const safeDiv = (a: number, b: number): number => {
      if (b <= 0 || a < 0) {
        return 0;
      }
      return DietaryIntakeAnalyzerEngine.round2((a / b) * 100);
    };

    return {
      calories: safeDiv(actual.calories, targets.calories),
      protein: safeDiv(actual.protein, targets.protein),
      carbs: safeDiv(actual.carbs, targets.carbs),
      fat: safeDiv(actual.fat, targets.fat),
      fluid: safeDiv(actual.fluidMl, targets.fluidMl),
    };
  }

  private static generateAlerts(
    actual: IActualTotals,
    coverage: ICoveragePercentages,
    targets: ICalculatedMetabolicTargets,
    highPotassiumFoods: string[],
    highPhosphorusFoods: string[],
  ): IClinicalAlertTag[] {
    const alerts: IClinicalAlertTag[] = [];

    if (targets.hasCo2Retention === true && actual.carbs > 0) {
      const totalNonCarbEnergy = actual.calories - actual.carbs * 4;
      const carbEnergy = actual.carbs * 4;
      const carbRatio = totalNonCarbEnergy > 0
        ? carbEnergy / (carbEnergy + totalNonCarbEnergy)
        : 1;
      if (carbRatio > 0.5) {
        alerts.push({
          type: 'respiratory',
          severity: 'critical',
          arabicMessage:
            '⚠️ خطر أيضي: المدخول الحالي عالي الكربوهيدرات ويرفع المعامل التنفسي (RQ)، مما يهدد باحتباس غاز CO2 وفشل الفطام التنفسي.',
        });
      }
    }

    if (targets.renalStage === 'severe_aki_ckd') {
      for (const foodName of highPotassiumFoods) {
        alerts.push({
          type: 'renal',
          severity: 'critical',
          arabicMessage: `🚨 انتهاك فسيولوجي: تم رصد تناول أطعمة عالية البوتاسيوم/الفوسفور (مثل: ${foodName})، مما يشكل خطراً مباشراً على ثبات القنوات الأيونية لمرضى الكلى.`,
        });
      }
      for (const foodName of highPhosphorusFoods) {
        alerts.push({
          type: 'renal',
          severity: 'critical',
          arabicMessage: `🚨 انتهاك فسيولوجي: تم رصد تناول أطعمة عالية البوتاسيوم/الفوسفور (مثل: ${foodName})، مما يشكل خطراً مباشراً على ثبات القنوات الأيونية لمرضى الكلى.`,
        });
      }
    }

    return alerts;
  }

  private static generateEducationalCards(
    coverage: ICoveragePercentages,
    targets: ICalculatedMetabolicTargets,
    consumedMicronutrients: Set<string>,
  ): string[] {
    const cards: string[] = [];

    if (coverage.calories < 50 && targets.isHypermetabolic === true) {
      cards.push(
        'هذا المدخول يعاني من عجز طاقي حاد خطير. مريض الحروق يحتاج لجرعات وقود مكثفة لوقف الهدم العضلي الذاتي وتسريع التئام الجلد.',
      );
    }

    if (consumedMicronutrients.has('zinc') && consumedMicronutrients.has('vitamin_c')) {
      cards.push(
        'تميز ملحوظ: هذه الوجبة غنية بالزنك وفيتامين C، وهي توليفة مثالية لتحفيز بناء الكولاجين وإعادة ترميم الأنسجة الخلوية المتضررة.',
      );
    }

    return cards;
  }

  private static round2(value: number): number {
    return parseFloat(value.toFixed(2));
  }
}
