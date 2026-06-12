import { Database } from '@nozbe/watermelondb';

export interface FoodSeedItem {
  nameAr: string;
  nameEn?: string;
  category: string;
  servingSize: string;
  calories: number;
  carbohydrates: number;
  protein: number;
  fat: number;
  potassium?: number;
  sodium?: number;
}

export const ARABIC_FOOD_EXCHANGES: FoodSeedItem[] = [
  // --- Yemeni / Arabic Traditional Foods ---
  {
    nameAr: 'خبز ملوج يمني',
    nameEn: 'Malooj Bread',
    category: 'النشويات',
    servingSize: 'ربع قرص (50 غرام)',
    calories: 150,
    carbohydrates: 30,
    protein: 4,
    fat: 1.5,
    potassium: 70,
    sodium: 250,
  },
  {
    nameAr: 'روتي يمني',
    nameEn: 'Yemeni Roti',
    category: 'النشويات',
    servingSize: 'حبة متوسطة (50 غرام)',
    calories: 140,
    carbohydrates: 28,
    protein: 4,
    fat: 1,
    potassium: 60,
    sodium: 220,
  },
  {
    nameAr: 'حقين يمني شعبي',
    nameEn: 'Haqeen (Traditional Buttermilk)',
    category: 'الحليب ومنتجاته',
    servingSize: 'كوب (240 مل)',
    calories: 90,
    carbohydrates: 12,
    protein: 8,
    fat: 1,
    potassium: 350,
    sodium: 120,
  },
  {
    nameAr: 'سلتة يمنية بالحلية',
    nameEn: 'Yemeni Saltah with Hulbah',
    category: 'أطباق تقليدية',
    servingSize: 'طبق متوسط (200 غرام)',
    calories: 220,
    carbohydrates: 15,
    protein: 10,
    fat: 12,
    potassium: 420,
    sodium: 580,
  },
  {
    nameAr: 'فحسة لحم يمنية',
    nameEn: 'Yemeni Fahsah (Meat Stew)',
    category: 'أطباق تقليدية',
    servingSize: 'طبق متوسط (200 غرام)',
    calories: 310,
    carbohydrates: 5,
    protein: 22,
    fat: 20,
    potassium: 380,
    sodium: 620,
  },
  {
    nameAr: 'شفوت يمني باللحوح',
    nameEn: 'Yemeni Shafoot with Lahooh',
    category: 'أطباق تقليدية',
    servingSize: 'طبق متوسط (200 غرام)',
    calories: 180,
    carbohydrates: 24,
    protein: 6,
    fat: 6,
    potassium: 290,
    sodium: 340,
  },
  {
    nameAr: 'تمر رطب الكبسة',
    nameEn: 'Rutarb Dates',
    category: 'الفواكه',
    servingSize: '3 حبات (30 غرام)',
    calories: 80,
    carbohydrates: 20,
    protein: 1,
    fat: 0,
    potassium: 220,
    sodium: 2,
  },
  {
    nameAr: 'كبسة لحم',
    nameEn: 'Meat Kabsa',
    category: 'أطباق تقليدية',
    servingSize: 'طبق متوسط (250 غرام)',
    calories: 450,
    carbohydrates: 55,
    protein: 20,
    fat: 16,
    potassium: 320,
    sodium: 480,
  },
  {
    nameAr: 'كبسة دجاج',
    nameEn: 'Chicken Kabsa',
    category: 'أطباق تقليدية',
    servingSize: 'طبق متوسط (250 غرام)',
    calories: 400,
    carbohydrates: 55,
    protein: 22,
    fat: 10,
    potassium: 310,
    sodium: 450,
  },
  {
    nameAr: 'تمر سكري',
    nameEn: 'Sukkari Dates',
    category: 'الفواكه',
    servingSize: '3 حبات (30 غرام)',
    calories: 90,
    carbohydrates: 22,
    protein: 1,
    fat: 0,
    potassium: 240,
    sodium: 2,
  },

  // --- Starches (النشويات) ---
  {
    nameAr: 'خبز بر (كامل القمح)',
    nameEn: 'Whole Wheat Bread',
    category: 'النشويات',
    servingSize: 'شريحة واحدة (30 غرام)',
    calories: 80,
    carbohydrates: 15,
    protein: 3,
    fat: 1,
    potassium: 90,
    sodium: 150,
  },
  {
    nameAr: 'أرز مطبوخ',
    nameEn: 'Cooked Rice',
    category: 'النشويات',
    servingSize: 'ثلث كوب (50 غرام)',
    calories: 80,
    carbohydrates: 15,
    protein: 2,
    fat: 0,
    potassium: 30,
    sodium: 5,
  },
  {
    nameAr: 'معكرونة مطبوخة',
    nameEn: 'Cooked Pasta',
    category: 'النشويات',
    servingSize: 'ثلث كوب (50 غرام)',
    calories: 80,
    carbohydrates: 15,
    protein: 2,
    fat: 0,
    potassium: 30,
    sodium: 5,
  },
  {
    nameAr: 'بطاطس مسلوقة',
    nameEn: 'Boiled Potato',
    category: 'النشويات',
    servingSize: 'حبة صغيرة (75 غرام)',
    calories: 80,
    carbohydrates: 15,
    protein: 2,
    fat: 0,
    potassium: 350,
    sodium: 5,
  },
  {
    nameAr: 'عدس مطبوخ',
    nameEn: 'Cooked Lentils',
    category: 'النشويات',
    servingSize: 'نصف كوب (90 غرام)',
    calories: 104,
    carbohydrates: 18,
    protein: 8,
    fat: 0.5,
    potassium: 360,
    sodium: 2,
  },

  // --- Vegetables (الخضار) ---
  {
    nameAr: 'سلطة خضراء مشكلة',
    nameEn: 'Mixed Green Salad',
    category: 'الخضار',
    servingSize: 'كوب واحد (150 غرام)',
    calories: 25,
    carbohydrates: 5,
    protein: 2,
    fat: 0,
    potassium: 250,
    sodium: 10,
  },
  {
    nameAr: 'خضار مشكلة مطبوخة',
    nameEn: 'Cooked Mixed Vegetables',
    category: 'الخضار',
    servingSize: 'نصف كوب (100 غرام)',
    calories: 25,
    carbohydrates: 5,
    protein: 2,
    fat: 0,
    potassium: 220,
    sodium: 50,
  },
  {
    nameAr: 'خيار طازج',
    nameEn: 'Cucumber',
    category: 'الخضار',
    servingSize: 'حبة واحدة متوسطة (100 غرام)',
    calories: 15,
    carbohydrates: 3,
    protein: 1,
    fat: 0,
    potassium: 140,
    sodium: 2,
  },
  {
    nameAr: 'طماطم طازجة',
    nameEn: 'Tomato',
    category: 'الخضار',
    servingSize: 'حبة واحدة متوسطة (100 غرام)',
    calories: 20,
    carbohydrates: 4,
    protein: 1,
    fat: 0,
    potassium: 230,
    sodium: 5,
  },

  // --- Fruits (الفواكه) ---
  {
    nameAr: 'تفاح طازج',
    nameEn: 'Fresh Apple',
    category: 'الفواكه',
    servingSize: 'حبة متوسطة (120 غرام)',
    calories: 60,
    carbohydrates: 15,
    protein: 0,
    fat: 0,
    potassium: 120,
    sodium: 2,
  },
  {
    nameAr: 'موز طازج',
    nameEn: 'Fresh Banana',
    category: 'الفواكه',
    servingSize: 'حبة صغيرة (90 غرام)',
    calories: 60,
    carbohydrates: 15,
    protein: 1,
    fat: 0,
    potassium: 360,
    sodium: 1,
  },
  {
    nameAr: 'برتقال طازج',
    nameEn: 'Fresh Orange',
    category: 'الفواكه',
    servingSize: 'حبة متوسطة (120 غرام)',
    calories: 60,
    carbohydrates: 15,
    protein: 1,
    fat: 0,
    potassium: 200,
    sodium: 1,
  },

  // --- Milk & Dairy (الحليب ومنتجاته) ---
  {
    nameAr: 'حليب كامل الدسم',
    nameEn: 'Whole Milk',
    category: 'الحليب ومنتجاته',
    servingSize: 'كوب (240 مل)',
    calories: 150,
    carbohydrates: 12,
    protein: 8,
    fat: 8,
    potassium: 380,
    sodium: 120,
  },
  {
    nameAr: 'حليب قليل الدسم',
    nameEn: 'Low Fat Milk',
    category: 'الحليب ومنتجاته',
    servingSize: 'كوب (240 مل)',
    calories: 120,
    carbohydrates: 12,
    protein: 8,
    fat: 5,
    potassium: 380,
    sodium: 120,
  },
  {
    nameAr: 'لبن زبادي كامل الدسم',
    nameEn: 'Whole Yogurt',
    category: 'الحليب ومنتجاته',
    servingSize: 'كوب (200 غرام)',
    calories: 150,
    carbohydrates: 12,
    protein: 8,
    fat: 8,
    potassium: 350,
    sodium: 110,
  },

  // --- Meats & Alternatives (اللحوم وبدائلها) ---
  {
    nameAr: 'لحم غنم مطبوخ',
    nameEn: 'Cooked Lamb',
    category: 'اللحوم وبدائلها',
    servingSize: '30 غرام',
    calories: 75,
    carbohydrates: 0,
    protein: 7,
    fat: 5,
    potassium: 100,
    sodium: 60,
  },
  {
    nameAr: 'صدر دجاج مطبوخ',
    nameEn: 'Cooked Chicken Breast',
    category: 'اللحوم وبدائلها',
    servingSize: '30 غرام',
    calories: 45,
    carbohydrates: 0,
    protein: 7,
    fat: 1.5,
    potassium: 110,
    sodium: 50,
  },
  {
    nameAr: 'سمك طازج مطبوخ',
    nameEn: 'Cooked Fish',
    category: 'اللحوم وبدائلها',
    servingSize: '30 غرام',
    calories: 45,
    carbohydrates: 0,
    protein: 7,
    fat: 1.5,
    potassium: 130,
    sodium: 50,
  },
  {
    nameAr: 'بيض مسلوق كامل',
    nameEn: 'Whole Boiled Egg',
    category: 'اللحوم وبدائلها',
    servingSize: 'حبة واحدة (50 غرام)',
    calories: 75,
    carbohydrates: 0,
    protein: 7,
    fat: 5,
    potassium: 65,
    sodium: 70,
  },
  {
    nameAr: 'جبنة بيضاء بلدية',
    nameEn: 'White Cheese',
    category: 'اللحوم وبدائلها',
    servingSize: '30 غرام',
    calories: 75,
    carbohydrates: 1,
    protein: 7,
    fat: 5,
    potassium: 40,
    sodium: 320,
  },

  // --- Fats (الدهون) ---
  {
    nameAr: 'زيت زيتون',
    nameEn: 'Olive Oil',
    category: 'الدهون',
    servingSize: 'ملعقة صغيرة (5 مل)',
    calories: 45,
    carbohydrates: 0,
    protein: 0,
    fat: 5,
    potassium: 0,
    sodium: 0,
  },
  {
    nameAr: 'سمن بلدي يمني',
    nameEn: 'Traditional Yemeni Ghee',
    category: 'الدهون',
    servingSize: 'ملعقة صغيرة (5 مل)',
    calories: 45,
    carbohydrates: 0,
    protein: 0,
    fat: 5,
    potassium: 0,
    sodium: 1,
  },
];

export async function seedArabicFoods(database: Database): Promise<void> {
  const foodCollection = database.get('food_items');
  const count = await foodCollection.query().fetchCount();
  if (count > 0) {
    console.log(`[arabicFoodSeed] Skipping seeding, ${count} foods already exist.`);
    return;
  }

  console.log(`[arabicFoodSeed] Seeding ${ARABIC_FOOD_EXCHANGES.length} food items...`);

  const NOW = Date.now();
  await database.write(async () => {
    const records = ARABIC_FOOD_EXCHANGES.map((food) =>
      foodCollection.prepareCreate((record: any) => {
        record.nameAr = food.nameAr;
        record.nameEn = food.nameEn;
        record.category = food.category;
        record.servingSize = food.servingSize;
        record.calories = food.calories;
        record.carbohydrates = food.carbohydrates;
        record.protein = food.protein;
        record.fat = food.fat;
        record.potassium = food.potassium ?? null;
        record.sodium = food.sodium ?? null;
        record._raw.created_at = NOW;
        record._raw.updated_at = NOW;
      })
    );

    await database.batch(records);
  });

  console.log('[arabicFoodSeed] Seeding completed.');
}
