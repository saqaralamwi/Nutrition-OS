import { Database, Collection } from '@nozbe/watermelondb';

const NOW = Date.now();

interface FoodExchangeSeed {
  exchangeGroup: string;
  foodNameAr: string;
  servingSizeDesc: string;
  carbsG: number;
  proteinG: number;
  fatG: number;
  caloriesKcal: number;
  glycemicIndex: number;
  potassiumLevel: string;
  phosphorusLevel: string;
  isGlutenFree: boolean;
  isLowFodmap: boolean;
  isLactoseFree: boolean;
  isUserDefined: boolean;
  associatedPatientId: string | null;
  isCompositeRecipe: boolean;
  recipeDecompositionJson: string;
  householdUnitsJson: string;
  micronutrientTagsJson: string;
}

function r2(v: number): number {
  return parseFloat(v.toFixed(2));
}

const STARCH_GROUP: FoodExchangeSeed[] = [
  {
    exchangeGroup: 'starch',
    foodNameAr: 'أرز أبيض مطبوخ',
    servingSizeDesc: 'نصف كوب - 100 غرام',
    carbsG: r2(15), proteinG: 3, fatG: 0, caloriesKcal: r2(80),
    glycemicIndex: 72, potassiumLevel: 'low', phosphorusLevel: 'medium',
    isGlutenFree: true, isLowFodmap: true, isLactoseFree: true,
    isUserDefined: false, associatedPatientId: null,
    isCompositeRecipe: false, recipeDecompositionJson: '[]',
    householdUnitsJson: JSON.stringify({ cup: 0.33, tablespoon: 1.0 }),
    micronutrientTagsJson: '[]',
  },
  {
    exchangeGroup: 'starch',
    foodNameAr: 'خبز بر قمح كامل محلي',
    servingSizeDesc: 'شريحة - 30 غرام',
    carbsG: r2(15), proteinG: 3, fatG: 1, caloriesKcal: r2(80),
    glycemicIndex: 55, potassiumLevel: 'medium', phosphorusLevel: 'high',
    isGlutenFree: false, isLowFodmap: false, isLactoseFree: true,
    isUserDefined: false, associatedPatientId: null,
    isCompositeRecipe: false, recipeDecompositionJson: '[]',
    householdUnitsJson: JSON.stringify({ slice: 1.0, piece: 0.25 }),
    micronutrientTagsJson: '[]',
  },
  {
    exchangeGroup: 'starch',
    foodNameAr: 'شوفان خام',
    servingSizeDesc: 'ثلاث ملاعق - 45 غرام',
    carbsG: r2(15), proteinG: 3, fatG: 2, caloriesKcal: r2(90),
    glycemicIndex: 55, potassiumLevel: 'medium', phosphorusLevel: 'high',
    isGlutenFree: true, isLowFodmap: true, isLactoseFree: true,
    isUserDefined: false, associatedPatientId: null,
    isCompositeRecipe: false, recipeDecompositionJson: '[]',
    householdUnitsJson: JSON.stringify({ tablespoon: 2.0 }),
    micronutrientTagsJson: '[]',
  },
];

const MEAT_GROUP: FoodExchangeSeed[] = [
  {
    exchangeGroup: 'meat_lean',
    foodNameAr: 'صدر دجاج مشوي بدون جلد',
    servingSizeDesc: 'قطعة - 30 غرام',
    carbsG: 0, proteinG: 7, fatG: 2, caloriesKcal: r2(45),
    glycemicIndex: 0, potassiumLevel: 'medium', phosphorusLevel: 'high',
    isGlutenFree: true, isLowFodmap: true, isLactoseFree: true,
    isUserDefined: false, associatedPatientId: null,
    isCompositeRecipe: false, recipeDecompositionJson: '[]',
    householdUnitsJson: JSON.stringify({ grams: 30.0, piece: 1.0 }),
    micronutrientTagsJson: '["zinc","heme_iron"]',
  },
  {
    exchangeGroup: 'meat_medium',
    foodNameAr: 'بيض مسلوق كامل',
    servingSizeDesc: 'بيضة واحدة - 50 غرام',
    carbsG: 0, proteinG: 7, fatG: 5, caloriesKcal: r2(75),
    glycemicIndex: 0, potassiumLevel: 'low', phosphorusLevel: 'high',
    isGlutenFree: true, isLowFodmap: true, isLactoseFree: true,
    isUserDefined: false, associatedPatientId: null,
    isCompositeRecipe: false, recipeDecompositionJson: '[]',
    householdUnitsJson: JSON.stringify({ piece: 1.0 }),
    micronutrientTagsJson: '[]',
  },
  {
    exchangeGroup: 'meat_lean',
    foodNameAr: 'عدس مطبوخ',
    servingSizeDesc: 'نصف كوب - 100 غرام',
    carbsG: r2(15), proteinG: 7, fatG: 0, caloriesKcal: r2(90),
    glycemicIndex: 32, potassiumLevel: 'high', phosphorusLevel: 'high',
    isGlutenFree: true, isLowFodmap: false, isLactoseFree: true,
    isUserDefined: false, associatedPatientId: null,
    isCompositeRecipe: false, recipeDecompositionJson: '[]',
    householdUnitsJson: JSON.stringify({ cup: 0.5 }),
    micronutrientTagsJson: '[]',
  },
];

const VEGETABLE_GROUP: FoodExchangeSeed[] = [
  {
    exchangeGroup: 'vegetable',
    foodNameAr: 'سبانخ مطبوخة',
    servingSizeDesc: 'نصف كوب - 100 غرام',
    carbsG: r2(5), proteinG: 2, fatG: 0, caloriesKcal: r2(25),
    glycemicIndex: 15, potassiumLevel: 'high', phosphorusLevel: 'low',
    isGlutenFree: true, isLowFodmap: true, isLactoseFree: true,
    isUserDefined: false, associatedPatientId: null,
    isCompositeRecipe: false, recipeDecompositionJson: '[]',
    householdUnitsJson: JSON.stringify({ cup: 0.5 }),
    micronutrientTagsJson: '["vitamin_c"]',
  },
  {
    exchangeGroup: 'vegetable',
    foodNameAr: 'كوسة مطبوخة سادة',
    servingSizeDesc: 'نصف كوب - 100 غرام',
    carbsG: r2(5), proteinG: 2, fatG: 0, caloriesKcal: r2(25),
    glycemicIndex: 15, potassiumLevel: 'medium', phosphorusLevel: 'low',
    isGlutenFree: true, isLowFodmap: true, isLactoseFree: true,
    isUserDefined: false, associatedPatientId: null,
    isCompositeRecipe: false, recipeDecompositionJson: '[]',
    householdUnitsJson: JSON.stringify({ cup: 0.5 }),
    micronutrientTagsJson: '[]',
  },
  {
    exchangeGroup: 'vegetable',
    foodNameAr: 'طماطم طازجة',
    servingSizeDesc: 'حبة متوسطة - 100 غرام',
    carbsG: r2(5), proteinG: 2, fatG: 0, caloriesKcal: r2(25),
    glycemicIndex: 15, potassiumLevel: 'high', phosphorusLevel: 'low',
    isGlutenFree: true, isLowFodmap: false, isLactoseFree: true,
    isUserDefined: false, associatedPatientId: null,
    isCompositeRecipe: false, recipeDecompositionJson: '[]',
    householdUnitsJson: JSON.stringify({ piece: 1.0 }),
    micronutrientTagsJson: '[]',
  },
];

const FRUIT_GROUP: FoodExchangeSeed[] = [
  {
    exchangeGroup: 'fruit',
    foodNameAr: 'موز طازج',
    servingSizeDesc: 'حبة صغيرة - 60 غرام',
    carbsG: r2(15), proteinG: 0, fatG: 0, caloriesKcal: r2(60),
    glycemicIndex: 51, potassiumLevel: 'high', phosphorusLevel: 'low',
    isGlutenFree: true, isLowFodmap: false, isLactoseFree: true,
    isUserDefined: false, associatedPatientId: null,
    isCompositeRecipe: false, recipeDecompositionJson: '[]',
    householdUnitsJson: JSON.stringify({ piece: 1.0 }),
    micronutrientTagsJson: '[]',
  },
  {
    exchangeGroup: 'fruit',
    foodNameAr: 'تفاح أحمر طازج',
    servingSizeDesc: 'حبة متوسطة - 100 غرام',
    carbsG: r2(15), proteinG: 0, fatG: 0, caloriesKcal: r2(60),
    glycemicIndex: 36, potassiumLevel: 'low', phosphorusLevel: 'low',
    isGlutenFree: true, isLowFodmap: true, isLactoseFree: true,
    isUserDefined: false, associatedPatientId: null,
    isCompositeRecipe: false, recipeDecompositionJson: '[]',
    householdUnitsJson: JSON.stringify({ piece: 1.0 }),
    micronutrientTagsJson: '[]',
  },
  {
    exchangeGroup: 'fruit',
    foodNameAr: 'تمر مجفف (خلاص/سكري)',
    servingSizeDesc: '3 حبات - 45 غرام',
    carbsG: r2(15), proteinG: 0, fatG: 0, caloriesKcal: r2(60),
    glycemicIndex: 62, potassiumLevel: 'high', phosphorusLevel: 'low',
    isGlutenFree: true, isLowFodmap: false, isLactoseFree: true,
    isUserDefined: false, associatedPatientId: null,
    isCompositeRecipe: false, recipeDecompositionJson: '[]',
    householdUnitsJson: JSON.stringify({ piece: 3.0 }),
    micronutrientTagsJson: '[]',
  },
];

const MILK_GROUP: FoodExchangeSeed[] = [
  {
    exchangeGroup: 'milk',
    foodNameAr: 'زبادي طبيعي كامل الدسم',
    servingSizeDesc: 'كوب وسط - 150 غرام',
    carbsG: r2(12), proteinG: 8, fatG: 8, caloriesKcal: r2(150),
    glycemicIndex: 35, potassiumLevel: 'medium', phosphorusLevel: 'high',
    isGlutenFree: true, isLowFodmap: true, isLactoseFree: false,
    isUserDefined: false, associatedPatientId: null,
    isCompositeRecipe: false, recipeDecompositionJson: '[]',
    householdUnitsJson: JSON.stringify({ cup: 1.0 }),
    micronutrientTagsJson: '[]',
  },
  {
    exchangeGroup: 'milk',
    foodNameAr: 'حليب بقري خالي من اللاكتوز',
    servingSizeDesc: 'كوب وسط - 150 غرام',
    carbsG: r2(12), proteinG: 8, fatG: 0, caloriesKcal: r2(90),
    glycemicIndex: 30, potassiumLevel: 'medium', phosphorusLevel: 'high',
    isGlutenFree: true, isLowFodmap: true, isLactoseFree: true,
    isUserDefined: false, associatedPatientId: null,
    isCompositeRecipe: false, recipeDecompositionJson: '[]',
    householdUnitsJson: JSON.stringify({ cup: 1.0 }),
    micronutrientTagsJson: '[]',
  },
];

const COMPOSITE_DISHES: FoodExchangeSeed[] = [
  {
    exchangeGroup: 'starch',
    foodNameAr: 'صحن كبسة دجاج تقليدية قياسية',
    servingSizeDesc: 'طبق كبير - 400 غرام',
    carbsG: r2(45), proteinG: r2(21), fatG: r2(12), caloriesKcal: r2(372),
    glycemicIndex: 68, potassiumLevel: 'high', phosphorusLevel: 'high',
    isGlutenFree: false, isLowFodmap: false, isLactoseFree: true,
    isUserDefined: false, associatedPatientId: null,
    isCompositeRecipe: true,
    recipeDecompositionJson: JSON.stringify([
      { exchangeGroup: 'starch', carbsG: 45, proteinG: 4, fatG: 0.5, caloriesKcal: 200, servingMultiplier: 1.5 },
      { exchangeGroup: 'meat_lean', carbsG: 0, proteinG: 21, fatG: 3, caloriesKcal: 120, servingMultiplier: 1 },
      { exchangeGroup: 'vegetable', carbsG: 5, proteinG: 1, fatG: 0.5, caloriesKcal: 30, servingMultiplier: 0.5 },
    ]),
    householdUnitsJson: JSON.stringify({ cup: 1.0 }),
    micronutrientTagsJson: '["zinc"]',
  },
];

const ALL_FOODS: FoodExchangeSeed[] = [
  ...STARCH_GROUP,
  ...MEAT_GROUP,
  ...VEGETABLE_GROUP,
  ...FRUIT_GROUP,
  ...MILK_GROUP,
  ...COMPOSITE_DISHES,
];

function prepareFoodRecord(collection: Collection<any>, food: FoodExchangeSeed): any {
  return collection.prepareCreate((record: any) => {
    record._raw.exchange_group = food.exchangeGroup;
    record._raw.food_name_ar = food.foodNameAr;
    record._raw.serving_size_desc = food.servingSizeDesc;
    record._raw.carbs_g = food.carbsG;
    record._raw.protein_g = food.proteinG;
    record._raw.fat_g = food.fatG;
    record._raw.calories_kcal = food.caloriesKcal;
    record._raw.glycemic_index = food.glycemicIndex;
    record._raw.potassium_level = food.potassiumLevel;
    record._raw.phosphorus_level = food.phosphorusLevel;
    record._raw.is_gluten_free = food.isGlutenFree;
    record._raw.is_low_fodmap = food.isLowFodmap;
    record._raw.is_lactose_free = food.isLactoseFree;
    record._raw.is_user_defined = food.isUserDefined;
    record._raw.associated_patient_id = food.associatedPatientId;
    record._raw.is_composite_recipe = food.isCompositeRecipe;
    record._raw.recipe_decomposition_json = food.recipeDecompositionJson;
    record._raw.household_units_json = food.householdUnitsJson;
    record._raw.micronutrient_tags_json = food.micronutrientTagsJson;
    record._raw.created_at = NOW;
    record._raw.updated_at = NOW;
  });
}

export async function seedFoodExchanges(database: Database): Promise<void> {
  const collection = database.get('food_exchanges');

  const count = await collection.query().fetchCount();
  if (count > 0) {
    console.log(`[seedFoodExchanges] Skipping - ${count} records already exist.`);
    return;
  }

  console.log(`[seedFoodExchanges] Seeding ${ALL_FOODS.length} food exchange records...`);

  await database.write(async () => {
    const records = ALL_FOODS.map((food) => prepareFoodRecord(collection, food));
    await database.batch(records);
  });

  console.log('[seedFoodExchanges] Seeding completed successfully.');
}
