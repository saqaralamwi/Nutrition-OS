import type {
  IFoodExchange,
  IPatientAversionRecord,
  IPatientMealPlan,
  DietaryPatternTag,
  MealSlotType,
  ExchangeGroup,
} from '../../data/types/meal_planner';
import type { ICalculatedMetabolicTargets } from './DietaryIntakeAnalyzerEngine';

export type MenuGeneratorTargets = ICalculatedMetabolicTargets;

export interface IMealAllocationItem {
  foodExchangeGroup: ExchangeGroup;
  foodNameAr: string;
  servings: number;
  portionDescriptor: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface IMealSlotAllocation {
  slot: MealSlotType;
  items: IMealAllocationItem[];
  slotCalories: number;
  slotProtein: number;
  slotCarbs: number;
  slotFat: number;
}

export interface IMealDistributionPlan {
  slots: IMealSlotAllocation[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

interface ISolvedExchanges {
  vegetableServings: number;
  fruitServings: number;
  starchServings: number;
  meatLeanServings: number;
  meatMediumServings: number;
  meatHighServings: number;
  fatServings: number;
}

interface IEducationalCard {
  title: string;
  body: string;
  type: 'dietary' | 'medical' | 'lifestyle';
}

const r2 = (v: number): number => {
  if (typeof v !== 'number' || isNaN(v) || !isFinite(v) || v < 0) return 0;
  return parseFloat(v.toFixed(2));
};

const MEAL_SLOTS: MealSlotType[] = ['breakfast', 'snack_1', 'lunch', 'snack_2', 'dinner', 'late_snack'];

const SLOT_CALORIE_FRACTION: Record<DietaryPatternTag, Record<MealSlotType, number>> = {
  standard: {
    breakfast: 0.2,
    snack_1: 0.1,
    lunch: 0.3,
    snack_2: 0.1,
    dinner: 0.25,
    late_snack: 0.05,
  },
  diabetic_spaced: {
    breakfast: 0.2,
    snack_1: 0.1,
    lunch: 0.3,
    snack_2: 0.1,
    dinner: 0.25,
    late_snack: 0.05,
  },
  hepatic_night_snack: {
    breakfast: 0.18,
    snack_1: 0.1,
    lunch: 0.28,
    snack_2: 0.1,
    dinner: 0.22,
    late_snack: 0.12,
  },
  hypermetabolic_built: {
    breakfast: 0.25,
    snack_1: 0.08,
    lunch: 0.3,
    snack_2: 0.1,
    dinner: 0.22,
    late_snack: 0.05,
  },
};

const DIABETIC_SPACED_CARB_PCT: Record<MealSlotType, number> = {
  breakfast: 0.25,
  snack_1: 0.1,
  lunch: 0.3,
  snack_2: 0.1,
  dinner: 0.25,
  late_snack: 0,
};

export class AutomatedMenuGeneratorEngine {
  static generatePrescriptiveMenu(
    patientId: string,
    targets: MenuGeneratorTargets,
    masterFoods: IFoodExchange[],
    aversions: IPatientAversionRecord[],
  ): IPatientMealPlan {
    const now = Date.now();
    const patternTag: DietaryPatternTag = targets.dietaryPatternTag ?? 'standard';

    const safePool = this.filterSafeFoodPool(masterFoods, aversions, targets);
    const exchanges = this.solveExchangeEquation(targets);
    const distribution = this.buildMealDistribution(safePool, exchanges, patternTag);
    const insights = this.buildEducationalInsights(patternTag, distribution);

    return {
      patientId,
      planDate: now,
      targetCalories: r2(targets.calories),
      targetProtein: r2(targets.protein),
      targetCarbs: r2(targets.carbs),
      targetFat: r2(targets.fat),
      averageGlycemicLoad: r2(this.computeAverageGlycemicLoad(distribution)),
      dietaryPatternTag: patternTag,
      mealDistributionJson: JSON.stringify(distribution),
      educationalInsightsJson: JSON.stringify(insights),
      createdAt: now,
      updatedAt: now,
    };
  }

  private static filterSafeFoodPool(
    foods: IFoodExchange[],
    aversions: IPatientAversionRecord[],
    targets: MenuGeneratorTargets,
  ): IFoodExchange[] {
    const avertedIds = new Set(aversions.map((a) => a.foodExchangeId));

    let pool = foods.filter((f) => !avertedIds.has((f as unknown as Record<string, string>).id));

    if (targets.isCeliac) {
      pool = pool.filter((f) => f.isGlutenFree === true);
    }

    if (targets.hasLactoseIntolerance) {
      pool = pool.filter((f) => f.isLactoseFree === true);
    }

    if (targets.renalStage === 'severe_aki_ckd') {
      pool = pool.filter((f) => f.potassiumLevel !== 'high' && f.phosphorusLevel !== 'high');
    }

    return pool;
  }

  private static solveExchangeEquation(targets: MenuGeneratorTargets): ISolvedExchanges {
    const { calories, protein, carbs, fat, hasCo2Retention, dietaryPatternTag } = targets;

    const vegetableServings = 3;

    const fruitRaw = (carbs * 0.15) / 15;
    const fruitServingsBounded = dietaryPatternTag === 'diabetic_spaced' ? Math.min(fruitRaw, 2) : fruitRaw;
    const fruitServingsVal = Math.max(1, Math.round(fruitServingsBounded));

    const vegCarbs = vegetableServings * 5;
    const fruitCarbs = fruitServingsVal * 15;
    const remainingCarbs = Math.max(0, carbs - vegCarbs - fruitCarbs);
    const starchServingsVal = Math.max(0, Math.round(remainingCarbs / 15));

    const vegProtein = vegetableServings * 2;
    const starchProtein = starchServingsVal * 3;
    const remainingProtein = Math.max(0, protein - vegProtein - starchProtein);
    const totalMeatServings = Math.max(0, Math.round(remainingProtein / 7));

    let meatLeanServingsVal = 0;
    let meatMediumServingsVal = 0;
    let meatHighServingsVal = 0;

    if (hasCo2Retention) {
      meatLeanServingsVal = totalMeatServings;
    } else {
      meatLeanServingsVal = Math.max(0, Math.round(totalMeatServings / 3));
      meatMediumServingsVal = Math.max(0, totalMeatServings - meatLeanServingsVal);
    }

    const vegFat = 0;
    const fruitFat = 0;
    const starchFat = 0;
    const meatFatGrams = meatLeanServingsVal * 2 + meatMediumServingsVal * 5 + meatHighServingsVal * 8;
    const remainingFatG = Math.max(0, fat - vegFat - fruitFat - starchFat - meatFatGrams);
    const fatServingsVal = Math.max(0, Math.round(remainingFatG / 5));

    const vegCal = vegetableServings * 25;
    const fruitCal = fruitServingsVal * 60;
    const starchCal = starchServingsVal * 80;
    const meatCal = meatLeanServingsVal * 45 + meatMediumServingsVal * 75 + meatHighServingsVal * 100;
    const fatCal = fatServingsVal * 45;

    return {
      vegetableServings,
      fruitServings: fruitServingsVal,
      starchServings: starchServingsVal,
      meatLeanServings: meatLeanServingsVal,
      meatMediumServings: meatMediumServingsVal,
      meatHighServings: meatHighServingsVal,
      fatServings: fatServingsVal,
    };
  }

  private static buildMealDistribution(
    safePool: IFoodExchange[],
    exchanges: ISolvedExchanges,
    patternTag: DietaryPatternTag,
  ): IMealDistributionPlan {
    const calFrac = SLOT_CALORIE_FRACTION[patternTag];

    const slotAllocations: IMealSlotAllocation[] = MEAL_SLOTS.map((slot) => {
      return this.buildSlotAllocation(safePool, exchanges, slot, calFrac[slot], patternTag);
    });

    const totals = slotAllocations.reduce(
      (acc, s) => ({
        totalCalories: r2(acc.totalCalories + s.slotCalories),
        totalProtein: r2(acc.totalProtein + s.slotProtein),
        totalCarbs: r2(acc.totalCarbs + s.slotCarbs),
        totalFat: r2(acc.totalFat + s.slotFat),
      }),
      { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 },
    );

    return {
      slots: slotAllocations,
      ...totals,
    };
  }

  private static buildSlotAllocation(
    safePool: IFoodExchange[],
    exchanges: ISolvedExchanges,
    slot: MealSlotType,
    calFraction: number,
    patternTag: DietaryPatternTag,
  ): IMealSlotAllocation {
    let allItems: IMealAllocationItem[] = [];
    let slotCal = 0;
    let slotProt = 0;
    let slotCarb = 0;
    let slotFat = 0;

    const addItem = (group: ExchangeGroup, totalServings: number) => {
      if (totalServings < 0.01) return;
      const food = this.pickFoodForGroup(safePool, group);
      if (!food) return;

      const carbPct = patternTag === 'diabetic_spaced' ? DIABETIC_SPACED_CARB_PCT[slot] : calFraction;
      const groupPct = group === 'fruit' || group === 'starch' ? carbPct : calFraction;
      const slotSrv = r2(totalServings * groupPct);
      if (slotSrv < 0.01) return;

      const grams = r2(this.estimateGrams(food, slotSrv));
      const cals = r2(food.caloriesKcal * slotSrv);
      const prot = r2(food.proteinG * slotSrv);
      const car = r2(food.carbsG * slotSrv);
      const ft = r2(food.fatG * slotSrv);

      allItems.push({
        foodExchangeGroup: group,
        foodNameAr: food.foodNameAr,
        servings: slotSrv,
        portionDescriptor: this.buildPortionDescriptor(food, slotSrv),
        grams,
        calories: cals,
        protein: prot,
        carbs: car,
        fat: ft,
      });
      slotCal = r2(slotCal + cals);
      slotProt = r2(slotProt + prot);
      slotCarb = r2(slotCarb + car);
      slotFat = r2(slotFat + ft);
    };

    if (patternTag === 'hepatic_night_snack' && slot === 'late_snack') {
      this.addHepaticNightSnackItems(safePool, allItems);
      for (const item of allItems) {
        slotCal = r2(slotCal + item.calories);
        slotProt = r2(slotProt + item.protein);
        slotCarb = r2(slotCarb + item.carbs);
        slotFat = r2(slotFat + item.fat);
      }
      return { slot, items: allItems, slotCalories: slotCal, slotProtein: slotProt, slotCarbs: slotCarb, slotFat: slotFat };
    }

    addItem('vegetable', exchanges.vegetableServings);
    addItem('fruit', exchanges.fruitServings);
    addItem('starch', exchanges.starchServings);
    addItem('meat_lean', exchanges.meatLeanServings);
    addItem('meat_medium', exchanges.meatMediumServings);
    addItem('meat_high', exchanges.meatHighServings);
    addItem('fat', exchanges.fatServings);

    return {
      slot,
      items: allItems,
      slotCalories: slotCal,
      slotProtein: slotProt,
      slotCarbs: slotCarb,
      slotFat: slotFat,
    };
  }

  private static addHepaticNightSnackItems(
    safePool: IFoodExchange[],
    items: IMealAllocationItem[],
  ): void {
    const starchFood = this.pickFoodForGroup(safePool, 'starch');
    if (starchFood) {
      const grams = r2(this.estimateGrams(starchFood, 1.5));
      items.push({
        foodExchangeGroup: 'starch',
        foodNameAr: starchFood.foodNameAr,
        servings: 1.5,
        portionDescriptor: this.buildPortionDescriptor(starchFood, 1.5),
        grams,
        calories: r2(starchFood.caloriesKcal * 1.5),
        protein: r2(starchFood.proteinG * 1.5),
        carbs: r2(starchFood.carbsG * 1.5),
        fat: r2(starchFood.fatG * 1.5),
      });
    }

    const meatFood = this.pickFoodForGroup(safePool, 'meat_medium');
    if (meatFood) {
      const grams = r2(this.estimateGrams(meatFood, 1));
      items.push({
        foodExchangeGroup: 'meat_medium',
        foodNameAr: meatFood.foodNameAr,
        servings: 1,
        portionDescriptor: this.buildPortionDescriptor(meatFood, 1),
        grams,
        calories: r2(meatFood.caloriesKcal * 1),
        protein: r2(meatFood.proteinG * 1),
        carbs: r2(meatFood.carbsG * 1),
        fat: r2(meatFood.fatG * 1),
      });
    }
  }

  private static pickFoodForGroup(pool: IFoodExchange[], group: ExchangeGroup): IFoodExchange | null {
    return pool.find((f) => f.exchangeGroup === group) ?? null;
  }

  private static estimateGrams(food: IFoodExchange, servings: number): number {
    const match = food.servingSizeDesc.match(/([\d.]+)\s*غرام/);
    if (match) {
      return parseFloat(match[1]) * servings;
    }
    return r2(100 * servings);
  }

  private static buildPortionDescriptor(food: IFoodExchange, servings: number): string {
    const unitMap: Record<string, string> = {
      كوب: 'أكواب',
      ملعقة: 'ملاعق',
      شريحة: 'شرائح',
      حبة: 'حبات',
      قطعة: 'قطع',
      بيضة: 'بيضات',
    };

    for (const [singular, plural] of Object.entries(unitMap)) {
      if (food.servingSizeDesc.includes(singular)) {
        if (servings <= 1) {
          return `${servings} ${singular} واحد بوزن ${this.estimateGrams(food, servings)} غرام`;
        }
        return `${servings} ${plural} بوزن ${this.estimateGrams(food, servings)} غرام`;
      }
    }

    return `${servings} حصة بوزن ${this.estimateGrams(food, servings)} غرام`;
  }

  private static computeAverageGlycemicLoad(distribution: IMealDistributionPlan): number {
    let totalGL = 0;
    let totalCarbs = 0;

    for (const slot of distribution.slots) {
      for (const item of slot.items) {
        const gl = (item.carbs * (this.getGlycemicIndexForItem(item))) / 100;
        totalGL = r2(totalGL + gl);
        totalCarbs = r2(totalCarbs + item.carbs);
      }
    }

    if (totalCarbs < 0.01) return 0;
    return r2(totalGL / totalCarbs * 100);
  }

  private static getGlycemicIndexForItem(item: IMealAllocationItem): number {
    const giMap: Record<string, number> = {
      starch: 72,
      fruit: 50,
      vegetable: 15,
      meat_lean: 0,
      meat_medium: 0,
      meat_high: 0,
      fat: 0,
      milk: 35,
    };
    return giMap[item.foodExchangeGroup] ?? 0;
  }

  private static buildEducationalInsights(
    patternTag: DietaryPatternTag,
    distribution: IMealDistributionPlan,
  ): IEducationalCard[] {
    const cards: IEducationalCard[] = [];

    const totalCal = distribution.totalCalories;
    const totalProt = distribution.totalProtein;
    const totalCarb = distribution.totalCarbs;
    const totalFat = distribution.totalFat;

    cards.push({
      title: 'ملخص السعرات الحرارية',
      body: `الخطة تحتوي على ${totalCal} سعرة حرارية موزعة كـ ${totalCarb} غرام كربوهيدرات و ${totalProt} غرام بروتين و ${totalFat} غرام دهون يومياً.`,
      type: 'dietary',
    });

    if (patternTag === 'hepatic_night_snack') {
      cards.push({
        title: 'وجبة ما قبل النوم للكبد الدهني',
        body: 'وجبة ما قبل النوم المتأخرة مخصصة لحماية عضلاتك من الهدم الليلي وتخفيف عبء معالجة الأمونيا عن الكبد المتعب.',
        type: 'medical',
      });
    }

    if (patternTag === 'diabetic_spaced') {
      cards.push({
        title: 'توزيع النشويات لمرضى السكري',
        body: 'تم توزيع النشويات بدقة متساوية عبر وجباتك طوال اليوم لضمان ثبات مستويات سكر الدم ومنع القفزات المفاجئة للإنسولين.',
        type: 'medical',
      });
    }

    if (patternTag === 'hypermetabolic_built') {
      cards.push({
        title: 'دعم التمثيل الغذائي المتسارع',
        body: 'تم زيادة السعرات والبروتين في هذه الخطة لتعويض الاحتياجات العالية الناتجة عن حالة فرط التمثيل الغذائي.',
        type: 'medical',
      });
    }

    if (patternTag === 'standard' && totalCal > 0) {
      cards.push({
        title: 'التوازن الغذائي العام',
        body: 'هذه الخطة تتبع التوزيع القياسي للوجبات لضمان تغذية متوازنة طوال اليوم.',
        type: 'lifestyle',
      });
    }

    return cards;
  }
}
