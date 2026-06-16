import { Database } from '@nozbe/watermelondb';

interface FoodSeed {
  nameAr: string;
  nameEn: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  potassiumMg?: number;
  phosphorusMg?: number;
  sodiumMg?: number;
  calciumMg?: number;
  glycemicIndex?: number;
  purineLevel?: string;
  allergenTags?: string;
  therapeuticBenefits?: string;
}

interface DniSeed {
  activeIngredient: string;
  clinicalSeverity: string;
  mechanismDescription: string;
  dietaryActionRequired: string;
}

const THERAPEUTIC_FOODS: FoodSeed[] = [
  {
    nameAr: 'عسل نحل طبيعي',
    nameEn: 'Natural Honey',
    caloriesPer100g: 304, proteinPer100g: 0.3, carbsPer100g: 82.4, fatPer100g: 0,
    potassiumMg: 52, phosphorusMg: 4, sodiumMg: 4, calciumMg: 6,
    glycemicIndex: 55, purineLevel: 'low',
    allergenTags: '["bee_products"]',
    therapeuticBenefits: '{"wound_healing":true,"antibacterial":true,"cough_soother":true,"energy_source":true}',
  },
  {
    nameAr: 'تمر (خلاص/سكري)',
    nameEn: 'Dates (Khalas/Sukkari)',
    caloriesPer100g: 282, proteinPer100g: 2.5, carbsPer100g: 75, fatPer100g: 0.4,
    potassiumMg: 656, phosphorusMg: 62, sodiumMg: 2, calciumMg: 39,
    glycemicIndex: 42, purineLevel: 'low',
    therapeuticBenefits: '{"natural_laxative":true,"energy_boost":true,"iron_source":true,"labor_facilitation":true}',
  },
  {
    nameAr: 'زنجبيل طازج',
    nameEn: 'Fresh Ginger',
    caloriesPer100g: 80, proteinPer100g: 1.8, carbsPer100g: 18, fatPer100g: 0.8,
    potassiumMg: 415, phosphorusMg: 34, sodiumMg: 13, calciumMg: 16,
    glycemicIndex: 15, purineLevel: 'low',
    therapeuticBenefits: '{"anti_nausea":true,"anti_inflammatory":true,"digestive_aid":true,"immune_support":true}',
  },
  {
    nameAr: 'كركم مطحون',
    nameEn: 'Turmeric Powder',
    caloriesPer100g: 354, proteinPer100g: 7.8, carbsPer100g: 65, fatPer100g: 10,
    potassiumMg: 2080, phosphorusMg: 268, sodiumMg: 38, calciumMg: 183,
    glycemicIndex: 10, purineLevel: 'moderate',
    therapeuticBenefits: '{"anti_inflammatory":true,"antioxidant":true,"liver_protection":true,"joint_health":true}',
  },
  {
    nameAr: 'حبة البركة (الحبة السوداء)',
    nameEn: 'Black Seed (Nigella Sativa)',
    caloriesPer100g: 375, proteinPer100g: 17, carbsPer100g: 45, fatPer100g: 22,
    calciumMg: 185,
    purineLevel: 'moderate',
    allergenTags: '["seeds"]',
    therapeuticBenefits: '{"immunomodulator":true,"anti_asthmatic":true,"antihistamine":true,"digestive_aid":true,"antimicrobial":true}',
  },
  {
    nameAr: 'شوفان كامل',
    nameEn: 'Whole Oats',
    caloriesPer100g: 389, proteinPer100g: 16.9, carbsPer100g: 66.3, fatPer100g: 6.9,
    potassiumMg: 429, phosphorusMg: 523, sodiumMg: 2, calciumMg: 54,
    glycemicIndex: 55, purineLevel: 'moderate',
    allergenTags: '["gluten"]',
    therapeuticBenefits: '{"beta_glucan":true,"cholesterol_lowering":true,"blood_sugar_control":true,"satiety":true}',
  },
  {
    nameAr: 'بذور الكتان',
    nameEn: 'Flax Seeds',
    caloriesPer100g: 534, proteinPer100g: 18.3, carbsPer100g: 28.9, fatPer100g: 42.2,
    potassiumMg: 813, phosphorusMg: 642, sodiumMg: 30, calciumMg: 255,
    glycemicIndex: 5, purineLevel: 'moderate',
    allergenTags: '["seeds"]',
    therapeuticBenefits: '{"omega_3_source":true,"fiber_rich":true,"laxative":true,"cholesterol_lowering":true,"lignans":true}',
  },
  {
    nameAr: 'بذور الشيا',
    nameEn: 'Chia Seeds',
    caloriesPer100g: 486, proteinPer100g: 16.5, carbsPer100g: 42.1, fatPer100g: 30.7,
    potassiumMg: 407, phosphorusMg: 860, sodiumMg: 16, calciumMg: 631,
    glycemicIndex: 5, purineLevel: 'low',
    allergenTags: '["seeds"]',
    therapeuticBenefits: '{"omega_3_source":true,"fiber_rich":true,"hydration":true,"calcium_source":true,"blood_sugar_control":true}',
  },
  {
    nameAr: 'حلبة مطحونة',
    nameEn: 'Fenugreek Powder',
    caloriesPer100g: 323, proteinPer100g: 23, carbsPer100g: 58, fatPer100g: 6.4,
    potassiumMg: 770, phosphorusMg: 296, sodiumMg: 67, calciumMg: 176,
    glycemicIndex: 30, purineLevel: 'moderate',
    therapeuticBenefits: '{"lactation_aid":true,"blood_sugar_control":true,"appetite_stimulant":true,"cholesterol_lowering":true}',
  },
  {
    nameAr: 'زبادي يوناني',
    nameEn: 'Greek Yogurt',
    caloriesPer100g: 97, proteinPer100g: 9, carbsPer100g: 3.6, fatPer100g: 5,
    potassiumMg: 141, phosphorusMg: 135, sodiumMg: 47, calciumMg: 110,
    glycemicIndex: 15, purineLevel: 'low',
    allergenTags: '["dairy"]',
    therapeuticBenefits: '{"probiotic":true,"high_protein":true,"calcium_source":true,"digestive_health":true}',
  },
  {
    nameAr: 'ثوم طازج',
    nameEn: 'Fresh Garlic',
    caloriesPer100g: 149, proteinPer100g: 6.4, carbsPer100g: 33, fatPer100g: 0.5,
    potassiumMg: 401, phosphorusMg: 153, sodiumMg: 17, calciumMg: 181,
    glycemicIndex: 10, purineLevel: 'low',
    therapeuticBenefits: '{"antimicrobial":true,"blood_pressure_lowering":true,"cholesterol_lowering":true,"immune_booster":true}',
  },
  {
    nameAr: 'زيت زيتون بكر ممتاز',
    nameEn: 'Extra Virgin Olive Oil',
    caloriesPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100,
    sodiumMg: 2, calciumMg: 1,
    glycemicIndex: 0, purineLevel: 'very_low',
    therapeuticBenefits: '{"heart_healthy":true,"anti_inflammatory":true,"antioxidant":true,"monounsaturated_fat":true}',
  },
  {
    nameAr: 'شعير مقشور',
    nameEn: 'Pearled Barley',
    caloriesPer100g: 352, proteinPer100g: 9.9, carbsPer100g: 77.7, fatPer100g: 1.2,
    potassiumMg: 280, phosphorusMg: 221, sodiumMg: 9, calciumMg: 29,
    glycemicIndex: 28, purineLevel: 'moderate',
    allergenTags: '["gluten"]',
    therapeuticBenefits: '{"beta_glucan":true,"cholesterol_lowering":true,"blood_sugar_control":true,"satiety":true,"fiber_rich":true}',
  },
  {
    nameAr: 'قرفة مطحونة',
    nameEn: 'Cinnamon Powder',
    caloriesPer100g: 247, proteinPer100g: 3.9, carbsPer100g: 81, fatPer100g: 1.4,
    potassiumMg: 431, phosphorusMg: 64, sodiumMg: 10, calciumMg: 1002,
    glycemicIndex: 10, purineLevel: 'low',
    therapeuticBenefits: '{"blood_sugar_lowering":true,"anti_inflammatory":true,"antioxidant":true,"antimicrobial":true}',
  },
  {
    nameAr: 'بابونج مجفف',
    nameEn: 'Dried Chamomile',
    caloriesPer100g: 0, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 0,
    calciumMg: 0,
    glycemicIndex: 0, purineLevel: 'very_low',
    therapeuticBenefits: '{"calming":true,"digestive_soother":true,"anti_inflammatory":true,"sleep_aid":true}',
  },
];

const DNI: DniSeed[] = [
  {
    activeIngredient: 'Warfarin',
    clinicalSeverity: 'high',
    mechanismDescription: 'Vitamin K antagonist — vitamin K-rich foods counteract anticoagulant effect, leading to reduced INR',
    dietaryActionRequired: 'Maintain consistent daily vitamin K intake (avoid large fluctuations in leafy greens, broccoli, and green vegetables). Monitor INR weekly when changing diet.',
  },
  {
    activeIngredient: 'Metformin',
    clinicalSeverity: 'moderate',
    mechanismDescription: 'Chronic use impairs vitamin B12 absorption via altered calcium-dependent ileal uptake',
    dietaryActionRequired: 'Ensure adequate B12 intake from animal sources (meat, eggs, dairy) or supplements. Monitor B12 levels annually; consider 1000µg B12 supplementation if deficient.',
  },
  {
    activeIngredient: 'Captopril (ACE Inhibitor)',
    clinicalSeverity: 'moderate',
    mechanismDescription: 'ACE inhibitors reduce aldosterone secretion, leading to potassium retention',
    dietaryActionRequired: 'Limit high-potassium foods (bananas, oranges, potatoes, tomatoes, dates, salt substitutes). Monitor serum potassium regularly, especially with renal impairment.',
  },
  {
    activeIngredient: 'Furosemide (Loop Diuretic)',
    clinicalSeverity: 'moderate',
    mechanismDescription: 'Increases urinary excretion of potassium, magnesium, sodium, and calcium',
    dietaryActionRequired: 'Instruct patient to consume potassium-rich foods (bananas, potatoes, spinach, dates). Consider magnesium-rich foods (nuts, seeds, green leafy vegetables). Monitor electrolytes monthly.',
  },
  {
    activeIngredient: 'Omeprazole (Proton Pump Inhibitor)',
    clinicalSeverity: 'moderate',
    mechanismDescription: 'Reduced gastric acidity impairs B12 release from food proteins and reduces calcium and magnesium absorption',
    dietaryActionRequired: 'Recommend B12-rich foods (meat, fish, eggs, fortified cereals). Ensure adequate calcium intake (dairy, fortified plant milks). For long-term use, consider B12 and magnesium supplementation.',
  },
  {
    activeIngredient: 'Levothyroxine',
    clinicalSeverity: 'high',
    mechanismDescription: 'Calcium, iron, and high-fiber foods bind to levothyroxine in the gut, significantly reducing absorption',
    dietaryActionRequired: 'Take levothyroxine on empty stomach with water only, at least 30-60 minutes before breakfast. Separate from calcium supplements, iron supplements, and high-fiber meals by at least 4 hours.',
  },
  {
    activeIngredient: 'Prednisolone (Corticosteroids)',
    clinicalSeverity: 'high',
    mechanismDescription: 'Increases calcium excretion and bone resorption; promotes sodium retention and potassium loss',
    dietaryActionRequired: 'Increase calcium and vitamin D intake (dairy, fortified foods, supplements). Limit high-sodium foods. Monitor serum potassium. Long-term use requires bone density monitoring and calcium+vitamin D supplementation.',
  },
  {
    activeIngredient: 'Ferrous Sulfate (Iron Supplement)',
    clinicalSeverity: 'moderate',
    mechanismDescription: 'Calcium, tannins (tea, coffee), and phytates (whole grains, legumes) inhibit non-heme iron absorption',
    dietaryActionRequired: 'Take iron supplements with vitamin C source (orange juice) to enhance absorption. Avoid taking with tea, coffee, milk, or calcium supplements. Separate from high-calcium meals by 2 hours.',
  },
  {
    activeIngredient: 'Atorvastatin (Statin)',
    clinicalSeverity: 'moderate',
    mechanismDescription: 'Grapefruit/grapefruit juice inhibits CYP3A4 metabolism of statins, increasing risk of myopathy; statins may reduce CoQ10 levels',
    dietaryActionRequired: 'Avoid grapefruit and grapefruit juice entirely while on statins. Consider CoQ10 supplementation (100-200mg/day) for statin-associated muscle symptoms.',
  },
  {
    activeIngredient: 'Alendronate (Bisphosphonate)',
    clinicalSeverity: 'high',
    mechanismDescription: 'Food, calcium, and other minerals bind to bisphosphonates, reducing absorption by up to 90%',
    dietaryActionRequired: 'Take on empty stomach with plain water first thing in morning. Wait at least 30-60 minutes before eating or drinking anything else. Do not take with calcium supplements, antacids, or mineral water.',
  },
  {
    activeIngredient: 'Spironolactone (K-sparing Diuretic)',
    clinicalSeverity: 'high',
    mechanismDescription: 'Aldosterone antagonist leads to significant potassium retention and risk of hyperkalemia',
    dietaryActionRequired: 'Strictly limit high-potassium foods (bananas, dates, potatoes, oranges, tomatoes, salt substitutes, legumes). Avoid potassium-containing salt substitutes. Monitor serum potassium closely, especially with renal impairment.',
  },
  {
    activeIngredient: 'Lithium',
    clinicalSeverity: 'high',
    mechanismDescription: 'Sodium restriction reduces renal lithium clearance, increasing lithium levels; caffeine may reduce lithium levels',
    dietaryActionRequired: 'Maintain consistent sodium intake (do not drastically reduce or increase salt). Maintain consistent caffeine intake. Avoid crash diets. Monitor lithium levels with any dietary change.',
  },
];

export async function seedClinicalReferenceData(database: Database): Promise<void> {
  const foodCollection = database.get('therapeutic_foods');
  const dniCollection = database.get('drug_nutrient_interactions');

  const existingFoods = await foodCollection.query().fetchCount();
  const existingDni = await dniCollection.query().fetchCount();

  if (existingFoods > 0 && existingDni > 0) {
    return;
  }

  await database.write(async () => {
    const foodRecords = THERAPEUTIC_FOODS.map((f) =>
      foodCollection.prepareCreate((record: any) => {
        record.nameAr = f.nameAr;
        record.nameEn = f.nameEn;
        record.caloriesPer100g = f.caloriesPer100g;
        record.proteinPer100g = f.proteinPer100g;
        record.carbsPer100g = f.carbsPer100g;
        record.fatPer100g = f.fatPer100g;
        record._raw.potassium_mg = f.potassiumMg ?? null;
        record._raw.phosphorus_mg = f.phosphorusMg ?? null;
        record._raw.sodium_mg = f.sodiumMg ?? null;
        record._raw.calcium_mg = f.calciumMg ?? null;
        record._raw.glycemic_index = f.glycemicIndex ?? null;
        record._raw.purine_level = f.purineLevel ?? null;
        record._raw.allergen_tags = f.allergenTags ?? null;
        record._raw.therapeutic_benefits = f.therapeuticBenefits ?? null;
      }),
    );

    const dniRecords = DNI.map((d) =>
      dniCollection.prepareCreate((record: any) => {
        record.activeIngredient = d.activeIngredient;
        record.clinicalSeverity = d.clinicalSeverity;
        record._raw.mechanism_description = d.mechanismDescription;
        record._raw.dietary_action_required = d.dietaryActionRequired;
      }),
    );

    await database.batch([...foodRecords, ...dniRecords]);
  });
}
