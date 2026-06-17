import { Database } from '@nozbe/watermelondb';

const NOW = Date.now();

interface FoodSeed {
  nameAr: string;
  nameEn: string;
  category: string;
  subcategory?: string;
  servingSizeG?: number;
  servingSizeText?: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  sugarG?: number;
  sodiumMg?: number;
  potassiumMg?: number;
  isArabic: boolean;
}

const FOODS: FoodSeed[] = [
  // ===== ARABIC BREADS & GRAINS =====
  { nameAr: 'خبز أبيض', nameEn: 'White Bread', category: 'breads_grains', subcategory: 'bread', servingSizeG: 30, servingSizeText: 'شريحة', calories: 79, proteinG: 2.6, carbsG: 14.8, fatG: 0.9, fiberG: 0.6, sodiumMg: 144, potassiumMg: 34, isArabic: false },
  { nameAr: 'خبز أسمر', nameEn: 'Brown Bread', category: 'breads_grains', subcategory: 'bread', servingSizeG: 30, servingSizeText: 'شريحة', calories: 72, proteinG: 2.8, carbsG: 13.5, fatG: 0.8, fiberG: 1.5, sodiumMg: 130, potassiumMg: 56, isArabic: false },
  { nameAr: 'خبز بر', nameEn: 'Whole Wheat Bread', category: 'breads_grains', subcategory: 'bread', servingSizeG: 30, servingSizeText: 'شريحة', calories: 68, proteinG: 3.0, carbsG: 12.5, fatG: 0.7, fiberG: 2.0, sodiumMg: 125, potassiumMg: 65, isArabic: false },
  { nameAr: 'خبز صاج', nameEn: 'Saj Bread', category: 'breads_grains', subcategory: 'flatbread', servingSizeG: 80, servingSizeText: 'رغيف', calories: 212, proteinG: 6.5, carbsG: 40.0, fatG: 2.5, fiberG: 1.5, sodiumMg: 380, potassiumMg: 89, isArabic: true },
  { nameAr: 'خبز تنور', nameEn: 'Tannour Bread', category: 'breads_grains', subcategory: 'flatbread', servingSizeG: 100, servingSizeText: 'رغيف', calories: 265, proteinG: 8.0, carbsG: 50.0, fatG: 3.0, fiberG: 2.0, sodiumMg: 420, potassiumMg: 95, isArabic: true },
  { nameAr: 'خبز شامي', nameEn: 'Shami Bread', category: 'breads_grains', subcategory: 'flatbread', servingSizeG: 60, servingSizeText: 'رغيف', calories: 159, proteinG: 4.8, carbsG: 30.0, fatG: 1.8, fiberG: 1.2, sodiumMg: 280, potassiumMg: 52, isArabic: true },
  { nameAr: 'خبز لبناني', nameEn: 'Lebanese Pita', category: 'breads_grains', subcategory: 'flatbread', servingSizeG: 56, servingSizeText: 'رغيف', calories: 148, proteinG: 4.5, carbsG: 28.0, fatG: 1.7, fiberG: 1.1, sodiumMg: 260, potassiumMg: 48, isArabic: true },
  { nameAr: 'خبز شراك', nameEn: 'Shirak Bread', category: 'breads_grains', subcategory: 'flatbread', servingSizeG: 70, servingSizeText: 'رغيف', calories: 186, proteinG: 5.6, carbsG: 35.0, fatG: 2.1, fiberG: 1.4, sodiumMg: 320, isArabic: true },
  { nameAr: 'خمير', nameEn: 'Khameer Bread', category: 'breads_grains', subcategory: 'flatbread', servingSizeG: 100, servingSizeText: 'قطعة', calories: 290, proteinG: 7.0, carbsG: 52.0, fatG: 5.0, fiberG: 1.8, sodiumMg: 350, isArabic: true },
  { nameAr: 'رز أبيض', nameEn: 'White Rice', category: 'breads_grains', subcategory: 'rice', servingSizeG: 150, servingSizeText: 'كوب', calories: 195, proteinG: 4.0, carbsG: 43.0, fatG: 0.4, fiberG: 0.6, sodiumMg: 2, potassiumMg: 55, isArabic: false },
  { nameAr: 'رز بسمتي', nameEn: 'Basmati Rice', category: 'breads_grains', subcategory: 'rice', servingSizeG: 150, servingSizeText: 'كوب', calories: 190, proteinG: 4.2, carbsG: 42.0, fatG: 0.3, fiberG: 0.5, sodiumMg: 1, potassiumMg: 50, isArabic: true },
  { nameAr: 'عدس', nameEn: 'Lentils', category: 'legumes', subcategory: 'pulses', servingSizeG: 150, servingSizeText: 'كوب', calories: 170, proteinG: 13.0, carbsG: 30.0, fatG: 0.5, fiberG: 12.0, sodiumMg: 4, potassiumMg: 365, isArabic: true },
  { nameAr: 'شوفان', nameEn: 'Oats', category: 'breads_grains', subcategory: 'grains', servingSizeG: 40, servingSizeText: 'كوب', calories: 154, proteinG: 5.4, carbsG: 27.0, fatG: 2.6, fiberG: 4.0, sodiumMg: 2, potassiumMg: 120, isArabic: false },

  // ===== CLINICAL & ENTERAL FORMULAS =====
  { nameAr: 'إنسور بلس', nameEn: 'Ensure Plus', category: 'clinical_nutrition', subcategory: 'enteral_formula', servingSizeG: 200, servingSizeText: 'عبوة', calories: 300, proteinG: 12.5, carbsG: 40.4, fatG: 9.8, fiberG: 0, sodiumMg: 192, potassiumMg: 320, phosphorusMg: 240, isArabic: false },
  { nameAr: 'فورتيسيب', nameEn: 'Fortisip', category: 'clinical_nutrition', subcategory: 'enteral_formula', servingSizeG: 200, servingSizeText: 'عبوة', calories: 300, proteinG: 12.0, carbsG: 36.8, fatG: 11.6, fiberG: 0, sodiumMg: 180, potassiumMg: 310, phosphorusMg: 230, isArabic: false },
  { nameAr: 'نيفرو', nameEn: 'Nepro HP', category: 'clinical_nutrition', subcategory: 'enteral_formula', servingSizeG: 220, servingSizeText: 'عبوة', calories: 396, proteinG: 17.8, carbsG: 34.2, fatG: 21.5, fiberG: 2.8, sodiumMg: 187, potassiumMg: 233, phosphorusMg: 161, isArabic: false },
  { nameAr: 'جلوثيرنا', nameEn: 'Glucerna', category: 'clinical_nutrition', subcategory: 'enteral_formula', servingSizeG: 200, servingSizeText: 'عبوة', calories: 186, proteinG: 9.0, carbsG: 17.6, fatG: 7.0, fiberG: 3.0, sodiumMg: 160, potassiumMg: 280, isArabic: false },
  
  // ===== PREDEFINED THERAPEUTIC RECIPES =====
  { nameAr: 'محلول جفاف منزلي', nameEn: 'Homemade ORS', category: 'therapeutic_recipe', servingSizeG: 1000, servingSizeText: 'لتر', calories: 100, proteinG: 0, carbsG: 25, fatG: 0, sodiumMg: 2300, potassiumMg: 800, isArabic: true },
  { nameAr: 'وجبة كبدية خفيفة (قبل النوم)', nameEn: 'Hepatic Night Snack (Oats/Honey)', category: 'therapeutic_recipe', servingSizeG: 150, servingSizeText: 'طبق', calories: 250, proteinG: 8.0, carbsG: 45.0, fatG: 5.0, fiberG: 4.0, potassiumMg: 180, isArabic: true },
  { nameAr: 'شوربة بامية منخفضة البوتاسيوم', nameEn: 'Low-Potassium Okra Stew', category: 'therapeutic_recipe', servingSizeG: 250, servingSizeText: 'طبق', calories: 120, proteinG: 5.0, carbsG: 15.0, fatG: 4.0, fiberG: 3.0, potassiumMg: 150, isArabic: true },

  { nameAr: 'عدس أحمر', nameEn: 'Red Lentils', category: 'legumes', subcategory: 'pulses', servingSizeG: 150, servingSizeText: 'كوب', calories: 165, proteinG: 12.5, carbsG: 29.0, fatG: 0.4, fiberG: 8.0, sodiumMg: 5, potassiumMg: 350, isArabic: true },
  { nameAr: 'عدس أصفر', nameEn: 'Yellow Lentils', category: 'legumes', subcategory: 'pulses', servingSizeG: 150, servingSizeText: 'كوب', calories: 168, proteinG: 12.8, carbsG: 29.5, fatG: 0.4, fiberG: 9.0, sodiumMg: 4, potassiumMg: 355, isArabic: true },
  { nameAr: 'حمص', nameEn: 'Chickpeas', category: 'legumes', subcategory: 'pulses', servingSizeG: 150, servingSizeText: 'كوب', calories: 250, proteinG: 12.0, carbsG: 42.0, fatG: 4.0, fiberG: 10.0, sodiumMg: 12, potassiumMg: 350, isArabic: true },
  { nameAr: 'فول', nameEn: 'Fava Beans', category: 'legumes', subcategory: 'pulses', servingSizeG: 150, servingSizeText: 'كوب', calories: 200, proteinG: 13.0, carbsG: 34.0, fatG: 0.8, fiberG: 9.0, sodiumMg: 8, potassiumMg: 332, isArabic: true },
  { nameAr: 'فاصوليا بيضاء', nameEn: 'White Beans', category: 'legumes', subcategory: 'pulses', servingSizeG: 150, servingSizeText: 'كوب', calories: 220, proteinG: 14.0, carbsG: 38.0, fatG: 0.6, fiberG: 11.0, sodiumMg: 6, potassiumMg: 420, isArabic: false },
  { nameAr: 'فاصوليا حمراء', nameEn: 'Kidney Beans', category: 'legumes', subcategory: 'pulses', servingSizeG: 150, servingSizeText: 'كوب', calories: 215, proteinG: 13.5, carbsG: 37.0, fatG: 0.5, fiberG: 10.5, sodiumMg: 5, potassiumMg: 400, isArabic: false },
  { nameAr: 'بازيلا', nameEn: 'Green Peas', category: 'legumes', subcategory: 'pulses', servingSizeG: 150, servingSizeText: 'كوب', calories: 125, proteinG: 8.0, carbsG: 22.0, fatG: 0.5, fiberG: 7.0, sodiumMg: 3, potassiumMg: 220, isArabic: false },
  { nameAr: 'لوبيا', nameEn: 'Cowpeas', category: 'legumes', subcategory: 'pulses', servingSizeG: 150, servingSizeText: 'كوب', calories: 200, proteinG: 12.0, carbsG: 35.0, fatG: 0.6, fiberG: 8.5, sodiumMg: 5, potassiumMg: 380, isArabic: true },
  { nameAr: 'ترمس', nameEn: 'Lupini Beans', category: 'legumes', subcategory: 'pulses', servingSizeG: 100, servingSizeText: 'كوب', calories: 120, proteinG: 16.0, carbsG: 10.0, fatG: 3.0, fiberG: 5.0, sodiumMg: 8, potassiumMg: 200, isArabic: true },

  // ===== DAIRY =====
  { nameAr: 'حليب طازج', nameEn: 'Fresh Milk', category: 'dairy', subcategory: 'milk', servingSizeG: 250, servingSizeText: 'كوب', calories: 150, proteinG: 8.0, carbsG: 12.0, fatG: 8.0, sodiumMg: 120, potassiumMg: 370, isArabic: false },
  { nameAr: 'حليب منزوع الدسم', nameEn: 'Skim Milk', category: 'dairy', subcategory: 'milk', servingSizeG: 250, servingSizeText: 'كوب', calories: 90, proteinG: 8.5, carbsG: 12.5, fatG: 0.2, sodiumMg: 130, potassiumMg: 380, isArabic: false },
  { nameAr: 'حليب قليل الدسم', nameEn: 'Low-Fat Milk', category: 'dairy', subcategory: 'milk', servingSizeG: 250, servingSizeText: 'كوب', calories: 110, proteinG: 8.2, carbsG: 12.3, fatG: 2.5, sodiumMg: 125, potassiumMg: 375, isArabic: false },
  { nameAr: 'لبن', nameEn: 'Buttermilk/Laban', category: 'dairy', subcategory: 'yogurt', servingSizeG: 200, servingSizeText: 'كوب', calories: 100, proteinG: 8.0, carbsG: 12.0, fatG: 2.0, sodiumMg: 100, potassiumMg: 300, isArabic: true },
  { nameAr: 'لبن زبادي', nameEn: 'Yogurt', category: 'dairy', subcategory: 'yogurt', servingSizeG: 200, servingSizeText: 'كوب', calories: 120, proteinG: 10.0, carbsG: 10.0, fatG: 4.0, sodiumMg: 90, potassiumMg: 280, isArabic: true },
  { nameAr: 'زبادي قليل الدسم', nameEn: 'Low-Fat Yogurt', category: 'dairy', subcategory: 'yogurt', servingSizeG: 200, servingSizeText: 'كوب', calories: 80, proteinG: 10.0, carbsG: 11.0, fatG: 1.0, sodiumMg: 95, potassiumMg: 290, isArabic: false },
  { nameAr: 'زبادي يوناني', nameEn: 'Greek Yogurt', category: 'dairy', subcategory: 'yogurt', servingSizeG: 200, servingSizeText: 'كوب', calories: 140, proteinG: 18.0, carbsG: 6.0, fatG: 5.0, sodiumMg: 70, potassiumMg: 220, isArabic: false },
  { nameAr: 'جبنة بيضاء', nameEn: 'White Cheese', category: 'dairy', subcategory: 'cheese', servingSizeG: 30, servingSizeText: 'قطعة', calories: 80, proteinG: 5.0, carbsG: 1.0, fatG: 6.5, sodiumMg: 200, potassiumMg: 30, isArabic: true },
  { nameAr: 'جبنة حلوم', nameEn: 'Halloumi', category: 'dairy', subcategory: 'cheese', servingSizeG: 30, servingSizeText: 'قطعة', calories: 90, proteinG: 6.0, carbsG: 1.0, fatG: 7.0, sodiumMg: 350, potassiumMg: 20, isArabic: true },
  { nameAr: 'جبنة فيتا', nameEn: 'Feta Cheese', category: 'dairy', subcategory: 'cheese', servingSizeG: 30, servingSizeText: 'قطعة', calories: 75, proteinG: 4.0, carbsG: 1.0, fatG: 6.0, sodiumMg: 320, potassiumMg: 18, isArabic: true },
  { nameAr: 'جبنة شيدر', nameEn: 'Cheddar Cheese', category: 'dairy', subcategory: 'cheese', servingSizeG: 30, servingSizeText: 'قطعة', calories: 120, proteinG: 7.0, carbsG: 0.5, fatG: 10.0, sodiumMg: 180, potassiumMg: 25, isArabic: false },
  { nameAr: 'جبنة موزاريلا', nameEn: 'Mozzarella', category: 'dairy', subcategory: 'cheese', servingSizeG: 30, servingSizeText: 'قطعة', calories: 85, proteinG: 6.0, carbsG: 0.6, fatG: 6.0, sodiumMg: 140, potassiumMg: 22, isArabic: false },
  { nameAr: 'جبنة بارميزان', nameEn: 'Parmesan', category: 'dairy', subcategory: 'cheese', servingSizeG: 15, servingSizeText: 'ملعقة', calories: 55, proteinG: 5.0, carbsG: 0.5, fatG: 4.0, sodiumMg: 170, potassiumMg: 15, isArabic: false },
  { nameAr: 'جبنة كريم', nameEn: 'Cream Cheese', category: 'dairy', subcategory: 'cheese', servingSizeG: 30, servingSizeText: 'قطعة', calories: 100, proteinG: 2.0, carbsG: 1.0, fatG: 10.0, sodiumMg: 90, potassiumMg: 30, isArabic: false },
  { nameAr: 'لبنة', nameEn: 'Labneh', category: 'dairy', subcategory: 'yogurt', servingSizeG: 50, servingSizeText: 'ملعقة', calories: 120, proteinG: 4.5, carbsG: 3.0, fatG: 10.0, sodiumMg: 100, potassiumMg: 70, isArabic: true },
  { nameAr: 'قشطة', nameEn: 'Qishta/Clotted Cream', category: 'dairy', subcategory: 'cream', servingSizeG: 30, servingSizeText: 'ملعقة', calories: 110, proteinG: 1.0, carbsG: 2.0, fatG: 11.0, sodiumMg: 20, potassiumMg: 15, isArabic: true },

  // ===== MEATS & POULTRY =====
  { nameAr: 'لحم بقري', nameEn: 'Beef (cooked)', category: 'meats', subcategory: 'beef', servingSizeG: 100, servingSizeText: 'قطعة', calories: 250, proteinG: 25.0, carbsG: 0, fatG: 15.0, sodiumMg: 60, potassiumMg: 350, isArabic: false },
  { nameAr: 'لحم غنم', nameEn: 'Lamb (cooked)', category: 'meats', subcategory: 'lamb', servingSizeG: 100, servingSizeText: 'قطعة', calories: 280, proteinG: 24.0, carbsG: 0, fatG: 20.0, sodiumMg: 70, potassiumMg: 310, isArabic: true },
  { nameAr: 'لحم عجل', nameEn: 'Veal (cooked)', category: 'meats', subcategory: 'veal', servingSizeG: 100, servingSizeText: 'قطعة', calories: 200, proteinG: 28.0, carbsG: 0, fatG: 9.0, sodiumMg: 80, potassiumMg: 340, isArabic: false },
  { nameAr: 'لحم مفروم', nameEn: 'Ground Beef', category: 'meats', subcategory: 'beef', servingSizeG: 100, servingSizeText: 'قطعة', calories: 260, proteinG: 24.0, carbsG: 0, fatG: 18.0, sodiumMg: 75, potassiumMg: 300, isArabic: false },
  { nameAr: 'دجاج مشوي', nameEn: 'Grilled Chicken', category: 'meats', subcategory: 'poultry', servingSizeG: 100, servingSizeText: 'قطعة', calories: 165, proteinG: 31.0, carbsG: 0, fatG: 3.6, sodiumMg: 75, potassiumMg: 220, isArabic: false },
  { nameAr: 'دجاج مسلوق', nameEn: 'Boiled Chicken', category: 'meats', subcategory: 'poultry', servingSizeG: 100, servingSizeText: 'قطعة', calories: 145, proteinG: 30.0, carbsG: 0, fatG: 2.5, sodiumMg: 60, potassiumMg: 200, isArabic: false },
  { nameAr: 'دجاج مقلي', nameEn: 'Fried Chicken', category: 'meats', subcategory: 'poultry', servingSizeG: 100, servingSizeText: 'قطعة', calories: 250, proteinG: 25.0, carbsG: 8.0, fatG: 13.0, sodiumMg: 250, potassiumMg: 180, isArabic: false },
  { nameAr: 'كبد دجاج', nameEn: 'Chicken Liver', category: 'meats', subcategory: 'organ', servingSizeG: 100, servingSizeText: 'قطعة', calories: 170, proteinG: 26.0, carbsG: 1.5, fatG: 6.5, sodiumMg: 70, potassiumMg: 230, isArabic: false },
  { nameAr: 'كبد بقري', nameEn: 'Beef Liver', category: 'meats', subcategory: 'organ', servingSizeG: 100, servingSizeText: 'قطعة', calories: 190, proteinG: 28.0, carbsG: 5.0, fatG: 6.0, sodiumMg: 80, potassiumMg: 320, isArabic: false },
  { nameAr: 'لحم جمل', nameEn: 'Camel Meat', category: 'meats', subcategory: 'exotic', servingSizeG: 100, servingSizeText: 'قطعة', calories: 180, proteinG: 26.0, carbsG: 0, fatG: 8.0, sodiumMg: 65, potassiumMg: 280, isArabic: true },
  { nameAr: 'لحم ضأن', nameEn: 'Mutton', category: 'meats', subcategory: 'lamb', servingSizeG: 100, servingSizeText: 'قطعة', calories: 260, proteinG: 23.0, carbsG: 0, fatG: 18.0, sodiumMg: 70, isArabic: true },

  // ===== FISH & SEAFOOD =====
  { nameAr: 'سمك هامور', nameEn: 'Grouper', category: 'seafood', subcategory: 'fish', servingSizeG: 100, servingSizeText: 'قطعة', calories: 120, proteinG: 22.0, carbsG: 0, fatG: 3.0, sodiumMg: 65, potassiumMg: 350, isArabic: true },
  { nameAr: 'سمك سلمون', nameEn: 'Salmon', category: 'seafood', subcategory: 'fish', servingSizeG: 100, servingSizeText: 'قطعة', calories: 210, proteinG: 22.0, carbsG: 0, fatG: 13.0, sodiumMg: 59, potassiumMg: 360, isArabic: false },
  { nameAr: 'تونة', nameEn: 'Tuna (canned in water)', category: 'seafood', subcategory: 'fish', servingSizeG: 100, servingSizeText: 'علبة', calories: 115, proteinG: 26.0, carbsG: 0, fatG: 1.0, sodiumMg: 40, potassiumMg: 200, isArabic: false },
  { nameAr: 'سمك سردين', nameEn: 'Sardines', category: 'seafood', subcategory: 'fish', servingSizeG: 100, servingSizeText: 'علبة', calories: 210, proteinG: 25.0, carbsG: 0, fatG: 11.0, sodiumMg: 70, potassiumMg: 340, isArabic: true },
  { nameAr: 'سمك فيليه', nameEn: 'Fish Fillet (white)', category: 'seafood', subcategory: 'fish', servingSizeG: 100, servingSizeText: 'قطعة', calories: 95, proteinG: 20.0, carbsG: 0, fatG: 1.0, sodiumMg: 55, potassiumMg: 280, isArabic: false },
  { nameAr: 'جمبري', nameEn: 'Shrimp', category: 'seafood', subcategory: 'shellfish', servingSizeG: 100, servingSizeText: 'كوب', calories: 85, proteinG: 20.0, carbsG: 0, fatG: 0.5, sodiumMg: 150, potassiumMg: 180, isArabic: true },
  { nameAr: 'كابوريا', nameEn: 'Crab', category: 'seafood', subcategory: 'shellfish', servingSizeG: 100, servingSizeText: 'كوب', calories: 90, proteinG: 19.0, carbsG: 0, fatG: 1.0, sodiumMg: 290, potassiumMg: 220, isArabic: true },
  { nameAr: 'حبار', nameEn: 'Squid', category: 'seafood', subcategory: 'shellfish', servingSizeG: 100, servingSizeText: 'قطعة', calories: 95, proteinG: 18.0, carbsG: 2.0, fatG: 1.5, sodiumMg: 70, potassiumMg: 240, isArabic: true },

  // ===== VEGETABLES =====
  { nameAr: 'طماطم', nameEn: 'Tomato', category: 'vegetables', subcategory: 'fresh', servingSizeG: 100, servingSizeText: 'حبة', calories: 18, proteinG: 0.9, carbsG: 3.9, fatG: 0.2, fiberG: 1.2, sodiumMg: 5, potassiumMg: 237, isArabic: false },
  { nameAr: 'خيار', nameEn: 'Cucumber', category: 'vegetables', subcategory: 'fresh', servingSizeG: 100, servingSizeText: 'حبة', calories: 15, proteinG: 0.7, carbsG: 3.6, fatG: 0.1, fiberG: 0.5, sodiumMg: 2, potassiumMg: 147, isArabic: false },
  { nameAr: 'خس', nameEn: 'Lettuce', category: 'vegetables', subcategory: 'fresh', servingSizeG: 50, servingSizeText: 'كوب', calories: 8, proteinG: 0.6, carbsG: 1.5, fatG: 0.1, fiberG: 0.5, sodiumMg: 5, potassiumMg: 75, isArabic: false },
  { nameAr: 'جزر', nameEn: 'Carrot', category: 'vegetables', subcategory: 'fresh', servingSizeG: 100, servingSizeText: 'حبة', calories: 41, proteinG: 0.9, carbsG: 9.6, fatG: 0.2, fiberG: 2.8, sodiumMg: 35, potassiumMg: 320, isArabic: false },
  { nameAr: 'بطاطس', nameEn: 'Potato', category: 'vegetables', subcategory: 'starchy', servingSizeG: 150, servingSizeText: 'حبة', calories: 115, proteinG: 3.0, carbsG: 26.0, fatG: 0.1, fiberG: 2.2, sodiumMg: 10, potassiumMg: 610, isArabic: false },
  { nameAr: 'بطاطا حلوة', nameEn: 'Sweet Potato', category: 'vegetables', subcategory: 'starchy', servingSizeG: 150, servingSizeText: 'حبة', calories: 130, proteinG: 2.5, carbsG: 30.0, fatG: 0.1, fiberG: 4.5, sodiumMg: 55, potassiumMg: 440, isArabic: false },
  { nameAr: 'بصل', nameEn: 'Onion', category: 'vegetables', subcategory: 'fresh', servingSizeG: 100, servingSizeText: 'حبة', calories: 40, proteinG: 1.1, carbsG: 9.3, fatG: 0.1, fiberG: 1.7, sodiumMg: 4, potassiumMg: 146, isArabic: false },
  { nameAr: 'ثوم', nameEn: 'Garlic', category: 'vegetables', subcategory: 'fresh', servingSizeG: 10, servingSizeText: 'فص', calories: 15, proteinG: 0.6, carbsG: 3.3, fatG: 0.1, fiberG: 0.2, sodiumMg: 2, potassiumMg: 40, isArabic: false },
  { nameAr: 'فلفل أخضر حلو', nameEn: 'Green Bell Pepper', category: 'vegetables', subcategory: 'fresh', servingSizeG: 100, servingSizeText: 'حبة', calories: 20, proteinG: 0.9, carbsG: 4.6, fatG: 0.2, fiberG: 1.7, sodiumMg: 3, potassiumMg: 175, isArabic: false },
  { nameAr: 'فلفل أحمر حلو', nameEn: 'Red Bell Pepper', category: 'vegetables', subcategory: 'fresh', servingSizeG: 100, servingSizeText: 'حبة', calories: 26, proteinG: 1.0, carbsG: 6.0, fatG: 0.3, fiberG: 2.1, sodiumMg: 2, potassiumMg: 200, isArabic: false },
  { nameAr: 'فلفل حار', nameEn: 'Hot Pepper', category: 'vegetables', subcategory: 'fresh', servingSizeG: 30, servingSizeText: 'حبة', calories: 12, proteinG: 0.5, carbsG: 2.5, fatG: 0.1, fiberG: 0.5, sodiumMg: 2, potassiumMg: 80, isArabic: true },
  { nameAr: 'سبانخ', nameEn: 'Spinach', category: 'vegetables', subcategory: 'leafy', servingSizeG: 100, servingSizeText: 'كوب', calories: 23, proteinG: 2.9, carbsG: 3.6, fatG: 0.4, fiberG: 2.2, sodiumMg: 80, potassiumMg: 560, isArabic: false },
  { nameAr: 'ملوخية', nameEn: 'Molokhia', category: 'vegetables', subcategory: 'leafy', servingSizeG: 150, servingSizeText: 'كوب', calories: 45, proteinG: 3.5, carbsG: 7.0, fatG: 0.5, fiberG: 2.5, sodiumMg: 50, potassiumMg: 400, isArabic: true },
  { nameAr: 'بامية', nameEn: 'Okra', category: 'vegetables', subcategory: 'fresh', servingSizeG: 100, servingSizeText: 'كوب', calories: 33, proteinG: 1.9, carbsG: 7.0, fatG: 0.2, fiberG: 3.2, sodiumMg: 8, potassiumMg: 300, isArabic: true },
  { nameAr: 'باذنجان', nameEn: 'Eggplant', category: 'vegetables', subcategory: 'fresh', servingSizeG: 100, servingSizeText: 'حبة', calories: 25, proteinG: 1.0, carbsG: 5.9, fatG: 0.2, fiberG: 3.0, sodiumMg: 2, potassiumMg: 230, isArabic: true },
  { nameAr: 'كوسا', nameEn: 'Zucchini', category: 'vegetables', subcategory: 'fresh', servingSizeG: 100, servingSizeText: 'حبة', calories: 17, proteinG: 1.2, carbsG: 3.1, fatG: 0.3, fiberG: 1.0, sodiumMg: 8, potassiumMg: 260, isArabic: true },
  { nameAr: 'قرع', nameEn: 'Pumpkin', category: 'vegetables', subcategory: 'starchy', servingSizeG: 150, servingSizeText: 'كوب', calories: 40, proteinG: 1.5, carbsG: 9.0, fatG: 0.2, fiberG: 1.5, sodiumMg: 2, potassiumMg: 300, isArabic: false },
  { nameAr: 'قرنبيط', nameEn: 'Cauliflower', category: 'vegetables', subcategory: 'fresh', servingSizeG: 100, servingSizeText: 'كوب', calories: 25, proteinG: 1.9, carbsG: 5.0, fatG: 0.3, fiberG: 2.0, sodiumMg: 30, potassiumMg: 300, isArabic: false },
  { nameAr: 'بروكلي', nameEn: 'Broccoli', category: 'vegetables', subcategory: 'fresh', servingSizeG: 100, servingSizeText: 'كوب', calories: 34, proteinG: 2.8, carbsG: 7.0, fatG: 0.4, fiberG: 2.6, sodiumMg: 33, potassiumMg: 316, isArabic: false },
  { nameAr: 'كرفس', nameEn: 'Celery', category: 'vegetables', subcategory: 'fresh', servingSizeG: 100, servingSizeText: 'عصا', calories: 14, proteinG: 0.7, carbsG: 3.0, fatG: 0.2, fiberG: 1.6, sodiumMg: 80, potassiumMg: 260, isArabic: false },
  { nameAr: 'فجل', nameEn: 'Radish', category: 'vegetables', subcategory: 'fresh', servingSizeG: 50, servingSizeText: 'حبة', calories: 8, proteinG: 0.3, carbsG: 1.7, fatG: 0.1, fiberG: 0.8, sodiumMg: 20, isArabic: true },
  { nameAr: 'شمندر', nameEn: 'Beetroot', category: 'vegetables', subcategory: 'starchy', servingSizeG: 100, servingSizeText: 'حبة', calories: 43, proteinG: 1.6, carbsG: 9.6, fatG: 0.2, fiberG: 2.8, sodiumMg: 78, potassiumMg: 325, isArabic: false },
  { nameAr: 'ذرة', nameEn: 'Corn', category: 'vegetables', subcategory: 'starchy', servingSizeG: 100, servingSizeText: 'كوب', calories: 96, proteinG: 3.4, carbsG: 21.0, fatG: 1.5, fiberG: 2.4, sodiumMg: 15, potassiumMg: 270, isArabic: false },
  { nameAr: 'جرجير', nameEn: 'Arugula', category: 'vegetables', subcategory: 'leafy', servingSizeG: 50, servingSizeText: 'كوب', calories: 10, proteinG: 1.0, carbsG: 1.5, fatG: 0.2, fiberG: 0.8, sodiumMg: 14, potassiumMg: 185, isArabic: true },
  { nameAr: 'بقدونس', nameEn: 'Parsley', category: 'vegetables', subcategory: 'herbs', servingSizeG: 10, servingSizeText: 'ملعقة', calories: 4, proteinG: 0.3, carbsG: 0.6, fatG: 0.1, fiberG: 0.3, sodiumMg: 6, potassiumMg: 55, isArabic: true },
  { nameAr: 'كزبرة', nameEn: 'Cilantro', category: 'vegetables', subcategory: 'herbs', servingSizeG: 10, servingSizeText: 'ملعقة', calories: 3, proteinG: 0.2, carbsG: 0.5, fatG: 0.1, fiberG: 0.3, sodiumMg: 5, potassiumMg: 50, isArabic: true },
  { nameAr: 'نعناع', nameEn: 'Mint', category: 'vegetables', subcategory: 'herbs', servingSizeG: 10, servingSizeText: 'ملعقة', calories: 3, proteinG: 0.2, carbsG: 0.5, fatG: 0.1, fiberG: 0.3, sodiumMg: 3, isArabic: true },
  { nameAr: 'شبت', nameEn: 'Dill', category: 'vegetables', subcategory: 'herbs', servingSizeG: 10, servingSizeText: 'ملعقة', calories: 4, proteinG: 0.3, carbsG: 0.7, fatG: 0.1, fiberG: 0.2, sodiumMg: 6, isArabic: true },

  // ===== FRUITS =====
  { nameAr: 'تفاح', nameEn: 'Apple', category: 'fruits', subcategory: 'fresh', servingSizeG: 150, servingSizeText: 'حبة', calories: 78, proteinG: 0.4, carbsG: 20.0, fatG: 0.2, fiberG: 4.0, sugarG: 16.0, sodiumMg: 2, potassiumMg: 180, isArabic: false },
  { nameAr: 'موز', nameEn: 'Banana', category: 'fruits', subcategory: 'fresh', servingSizeG: 120, servingSizeText: 'حبة', calories: 105, proteinG: 1.3, carbsG: 27.0, fatG: 0.4, fiberG: 3.1, sugarG: 14.0, sodiumMg: 1, potassiumMg: 420, isArabic: false },
  { nameAr: 'برتقال', nameEn: 'Orange', category: 'fruits', subcategory: 'fresh', servingSizeG: 130, servingSizeText: 'حبة', calories: 62, proteinG: 1.2, carbsG: 15.0, fatG: 0.2, fiberG: 3.0, sugarG: 12.0, sodiumMg: 1, potassiumMg: 230, isArabic: false },
  { nameAr: 'عنب', nameEn: 'Grapes', category: 'fruits', subcategory: 'fresh', servingSizeG: 100, servingSizeText: 'كوب', calories: 69, proteinG: 0.7, carbsG: 18.0, fatG: 0.2, fiberG: 0.9, sugarG: 16.0, sodiumMg: 2, potassiumMg: 190, isArabic: true },
  { nameAr: 'بطيخ', nameEn: 'Watermelon', category: 'fruits', subcategory: 'fresh', servingSizeG: 200, servingSizeText: 'شريحة', calories: 60, proteinG: 1.2, carbsG: 15.0, fatG: 0.3, fiberG: 0.8, sugarG: 12.0, sodiumMg: 3, potassiumMg: 210, isArabic: true },
  { nameAr: 'شمام', nameEn: 'Cantaloupe', category: 'fruits', subcategory: 'fresh', servingSizeG: 150, servingSizeText: 'شريحة', calories: 50, proteinG: 1.0, carbsG: 12.0, fatG: 0.2, fiberG: 1.5, sugarG: 10.0, sodiumMg: 20, potassiumMg: 320, isArabic: true },
  { nameAr: 'فراولة', nameEn: 'Strawberries', category: 'fruits', subcategory: 'fresh', servingSizeG: 100, servingSizeText: 'كوب', calories: 32, proteinG: 0.7, carbsG: 7.7, fatG: 0.3, fiberG: 2.0, sugarG: 4.9, sodiumMg: 1, potassiumMg: 150, isArabic: false },
  { nameAr: 'عنب أسود', nameEn: 'Black Grapes', category: 'fruits', subcategory: 'fresh', servingSizeG: 100, servingSizeText: 'كوب', calories: 72, proteinG: 0.7, carbsG: 18.0, fatG: 0.2, fiberG: 1.0, sugarG: 16.0, sodiumMg: 2, isArabic: true },
  { nameAr: 'تين', nameEn: 'Figs (fresh)', category: 'fruits', subcategory: 'fresh', servingSizeG: 100, servingSizeText: 'حبة', calories: 74, proteinG: 0.8, carbsG: 19.0, fatG: 0.3, fiberG: 2.9, sugarG: 16.0, sodiumMg: 1, potassiumMg: 232, isArabic: true },
  { nameAr: 'تين مجفف', nameEn: 'Dried Figs', category: 'fruits', subcategory: 'dried', servingSizeG: 40, servingSizeText: 'حبة', calories: 100, proteinG: 1.3, carbsG: 25.0, fatG: 0.4, fiberG: 4.0, sugarG: 20.0, sodiumMg: 4, potassiumMg: 250, isArabic: true },
  { nameAr: 'تمر', nameEn: 'Dates', category: 'fruits', subcategory: 'dried', servingSizeG: 24, servingSizeText: 'حبة', calories: 66, proteinG: 0.5, carbsG: 18.0, fatG: 0.1, fiberG: 1.6, sugarG: 16.0, sodiumMg: 1, potassiumMg: 167, isArabic: true },
  { nameAr: 'تمر سكري', nameEn: 'Sukkari Dates', category: 'fruits', subcategory: 'dried', servingSizeG: 24, servingSizeText: 'حبة', calories: 70, proteinG: 0.4, carbsG: 18.5, fatG: 0.1, fiberG: 1.2, sugarG: 17.0, potassiumMg: 160, isArabic: true },
  { nameAr: 'تمر مجهول', nameEn: 'Medjool Dates', category: 'fruits', subcategory: 'dried', servingSizeG: 24, servingSizeText: 'حبة', calories: 75, proteinG: 0.6, carbsG: 19.0, fatG: 0.1, fiberG: 1.5, sugarG: 17.0, potassiumMg: 170, isArabic: true },
  { nameAr: 'تمر خلاص', nameEn: 'Khalas Dates', category: 'fruits', subcategory: 'dried', servingSizeG: 24, servingSizeText: 'حبة', calories: 68, proteinG: 0.5, carbsG: 18.0, fatG: 0.1, fiberG: 1.4, sugarG: 16.5, potassiumMg: 165, isArabic: true },
  { nameAr: 'مشمش', nameEn: 'Apricot', category: 'fruits', subcategory: 'fresh', servingSizeG: 100, servingSizeText: 'حبة', calories: 48, proteinG: 1.4, carbsG: 11.0, fatG: 0.4, fiberG: 2.0, sugarG: 9.0, sodiumMg: 1, potassiumMg: 260, isArabic: false },
  { nameAr: 'مشمش مجفف', nameEn: 'Dried Apricot', category: 'fruits', subcategory: 'dried', servingSizeG: 40, servingSizeText: 'حبة', calories: 85, proteinG: 1.2, carbsG: 22.0, fatG: 0.2, fiberG: 3.0, sugarG: 18.0, sodiumMg: 5, potassiumMg: 360, isArabic: false },
  { nameAr: 'خوخ', nameEn: 'Peach', category: 'fruits', subcategory: 'fresh', servingSizeG: 100, servingSizeText: 'حبة', calories: 39, proteinG: 0.9, carbsG: 9.5, fatG: 0.3, fiberG: 1.5, sugarG: 8.0, sodiumMg: 1, potassiumMg: 190, isArabic: false },
  { nameAr: 'رمان', nameEn: 'Pomegranate', category: 'fruits', subcategory: 'fresh', servingSizeG: 150, servingSizeText: 'حبة', calories: 100, proteinG: 1.5, carbsG: 25.0, fatG: 0.5, fiberG: 5.0, sugarG: 20.0, sodiumMg: 3, potassiumMg: 330, isArabic: true },
  { nameAr: 'ليمون', nameEn: 'Lemon', category: 'fruits', subcategory: 'citrus', servingSizeG: 50, servingSizeText: 'حبة', calories: 15, proteinG: 0.5, carbsG: 4.0, fatG: 0.1, fiberG: 1.2, sugarG: 1.5, sodiumMg: 1, potassiumMg: 70, isArabic: false },
  { nameAr: 'ليمون حامض', nameEn: 'Lime', category: 'fruits', subcategory: 'citrus', servingSizeG: 50, servingSizeText: 'حبة', calories: 12, proteinG: 0.3, carbsG: 3.5, fatG: 0.1, fiberG: 1.0, sugarG: 1.0, potassiumMg: 60, isArabic: true },
  { nameAr: 'جريب فروت', nameEn: 'Grapefruit', category: 'fruits', subcategory: 'citrus', servingSizeG: 150, servingSizeText: 'حبة', calories: 52, proteinG: 1.0, carbsG: 13.0, fatG: 0.2, fiberG: 2.0, sugarG: 8.0, sodiumMg: 2, potassiumMg: 165, isArabic: false },
  { nameAr: 'كيوي', nameEn: 'Kiwi', category: 'fruits', subcategory: 'fresh', servingSizeG: 75, servingSizeText: 'حبة', calories: 45, proteinG: 0.8, carbsG: 11.0, fatG: 0.4, fiberG: 2.3, sugarG: 6.0, sodiumMg: 3, potassiumMg: 215, isArabic: false },
  { nameAr: 'مانجا', nameEn: 'Mango', category: 'fruits', subcategory: 'fresh', servingSizeG: 150, servingSizeText: 'حبة', calories: 90, proteinG: 1.0, carbsG: 22.0, fatG: 0.5, fiberG: 2.5, sugarG: 20.0, sodiumMg: 2, potassiumMg: 220, isArabic: true },
  { nameAr: 'أناناس', nameEn: 'Pineapple', category: 'fruits', subcategory: 'fresh', servingSizeG: 100, servingSizeText: 'شريحة', calories: 50, proteinG: 0.5, carbsG: 13.0, fatG: 0.1, fiberG: 1.4, sugarG: 10.0, sodiumMg: 1, potassiumMg: 110, isArabic: false },
  { nameAr: 'كمثرى', nameEn: 'Pear', category: 'fruits', subcategory: 'fresh', servingSizeG: 150, servingSizeText: 'حبة', calories: 85, proteinG: 0.6, carbsG: 22.0, fatG: 0.2, fiberG: 5.0, sugarG: 14.0, sodiumMg: 2, potassiumMg: 190, isArabic: false },

  // ===== NUTS & SEEDS =====
  { nameAr: 'لوز', nameEn: 'Almonds', category: 'nuts_seeds', subcategory: 'nuts', servingSizeG: 30, servingSizeText: 'حفنة', calories: 170, proteinG: 6.0, carbsG: 6.0, fatG: 15.0, fiberG: 3.5, sodiumMg: 1, potassiumMg: 200, isArabic: false },
  { nameAr: 'فستق حلبي', nameEn: 'Pistachios', category: 'nuts_seeds', subcategory: 'nuts', servingSizeG: 30, servingSizeText: 'حفنة', calories: 160, proteinG: 6.0, carbsG: 8.0, fatG: 13.0, fiberG: 3.0, sodiumMg: 2, potassiumMg: 290, isArabic: true },
  { nameAr: 'جوز', nameEn: 'Walnuts', category: 'nuts_seeds', subcategory: 'nuts', servingSizeG: 30, servingSizeText: 'حفنة', calories: 185, proteinG: 4.3, carbsG: 4.0, fatG: 18.5, fiberG: 2.0, sodiumMg: 1, potassiumMg: 150, isArabic: false },
  { nameAr: 'كاجو', nameEn: 'Cashews', category: 'nuts_seeds', subcategory: 'nuts', servingSizeG: 30, servingSizeText: 'حفنة', calories: 160, proteinG: 5.0, carbsG: 9.0, fatG: 13.0, fiberG: 1.0, sodiumMg: 3, potassiumMg: 170, isArabic: false },
  { nameAr: 'بندق', nameEn: 'Hazelnuts', category: 'nuts_seeds', subcategory: 'nuts', servingSizeG: 30, servingSizeText: 'حفنة', calories: 180, proteinG: 4.0, carbsG: 5.0, fatG: 17.0, fiberG: 3.0, sodiumMg: 1, potassiumMg: 200, isArabic: false },
  { nameAr: 'فول سوداني', nameEn: 'Peanuts', category: 'nuts_seeds', subcategory: 'nuts', servingSizeG: 30, servingSizeText: 'حفنة', calories: 170, proteinG: 7.5, carbsG: 5.0, fatG: 14.0, fiberG: 2.5, sodiumMg: 5, potassiumMg: 180, isArabic: false },
  { nameAr: 'لوز برازيلي', nameEn: 'Brazil Nuts', category: 'nuts_seeds', subcategory: 'nuts', servingSizeG: 30, servingSizeText: 'حفنة', calories: 190, proteinG: 4.0, carbsG: 3.5, fatG: 19.0, fiberG: 2.0, sodiumMg: 1, potassiumMg: 160, isArabic: false },
  { nameAr: 'جوز الهند', nameEn: 'Coconut (fresh)', category: 'nuts_seeds', subcategory: 'nuts', servingSizeG: 45, servingSizeText: 'قطعة', calories: 160, proteinG: 1.5, carbsG: 7.0, fatG: 15.0, fiberG: 4.0, sodiumMg: 10, potassiumMg: 160, isArabic: true },
  { nameAr: 'سمسم', nameEn: 'Sesame Seeds', category: 'nuts_seeds', subcategory: 'seeds', servingSizeG: 15, servingSizeText: 'ملعقة', calories: 85, proteinG: 2.6, carbsG: 3.5, fatG: 7.0, fiberG: 2.0, sodiumMg: 2, potassiumMg: 70, isArabic: true },
  { nameAr: 'بذور دوار الشمس', nameEn: 'Sunflower Seeds', category: 'nuts_seeds', subcategory: 'seeds', servingSizeG: 30, servingSizeText: 'حفنة', calories: 165, proteinG: 5.5, carbsG: 7.0, fatG: 14.0, fiberG: 3.0, sodiumMg: 1, potassiumMg: 200, isArabic: false },
  { nameAr: 'بذور القرع', nameEn: 'Pumpkin Seeds', category: 'nuts_seeds', subcategory: 'seeds', servingSizeG: 30, servingSizeText: 'حفنة', calories: 150, proteinG: 7.0, carbsG: 5.0, fatG: 13.0, fiberG: 2.0, sodiumMg: 5, potassiumMg: 230, isArabic: false },
  { nameAr: 'بذور شيا', nameEn: 'Chia Seeds', category: 'nuts_seeds', subcategory: 'seeds', servingSizeG: 15, servingSizeText: 'ملعقة', calories: 70, proteinG: 2.4, carbsG: 6.0, fatG: 4.5, fiberG: 5.0, sodiumMg: 3, potassiumMg: 50, isArabic: false },
  { nameAr: 'طحينة', nameEn: 'Tahini', category: 'nuts_seeds', subcategory: 'seeds', servingSizeG: 15, servingSizeText: 'ملعقة', calories: 90, proteinG: 2.5, carbsG: 3.0, fatG: 8.0, fiberG: 1.5, sodiumMg: 7, potassiumMg: 60, isArabic: true },

  // ===== OILS & FATS =====
  { nameAr: 'زيت زيتون', nameEn: 'Olive Oil', category: 'oils_fats', subcategory: 'oils', servingSizeG: 15, servingSizeText: 'ملعقة', calories: 120, proteinG: 0, carbsG: 0, fatG: 14.0, sodiumMg: 0, isArabic: true },
  { nameAr: 'زيت نباتي', nameEn: 'Vegetable Oil', category: 'oils_fats', subcategory: 'oils', servingSizeG: 15, servingSizeText: 'ملعقة', calories: 120, proteinG: 0, carbsG: 0, fatG: 14.0, sodiumMg: 0, isArabic: false },
  { nameAr: 'زيت جوز الهند', nameEn: 'Coconut Oil', category: 'oils_fats', subcategory: 'oils', servingSizeG: 15, servingSizeText: 'ملعقة', calories: 115, proteinG: 0, carbsG: 0, fatG: 13.5, sodiumMg: 0, isArabic: false },
  { nameAr: 'سمن', nameEn: 'Ghee/Samn', category: 'oils_fats', subcategory: 'butter', servingSizeG: 15, servingSizeText: 'ملعقة', calories: 130, proteinG: 0, carbsG: 0, fatG: 14.5, sodiumMg: 1, isArabic: true },
  { nameAr: 'زبدة', nameEn: 'Butter', category: 'oils_fats', subcategory: 'butter', servingSizeG: 15, servingSizeText: 'ملعقة', calories: 100, proteinG: 0.1, carbsG: 0, fatG: 11.5, sodiumMg: 90, isArabic: false },
  { nameAr: 'مارجرين', nameEn: 'Margarine', category: 'oils_fats', subcategory: 'butter', servingSizeG: 15, servingSizeText: 'ملعقة', calories: 95, proteinG: 0.1, carbsG: 0, fatG: 11.0, sodiumMg: 110, isArabic: false },

  // ===== SWEETS & DESSERTS =====
  { nameAr: 'كنافة', nameEn: 'Kunafa', category: 'sweets', subcategory: 'arabic', servingSizeG: 150, servingSizeText: 'قطعة', calories: 420, proteinG: 8.0, carbsG: 50.0, fatG: 22.0, sodiumMg: 150, isArabic: true },
  { nameAr: 'كنافة بالقشطة', nameEn: 'Kunafa with Cream', category: 'sweets', subcategory: 'arabic', servingSizeG: 150, servingSizeText: 'قطعة', calories: 400, proteinG: 7.0, carbsG: 48.0, fatG: 20.0, sodiumMg: 140, isArabic: true },
  { nameAr: 'كنافة بالجبنة', nameEn: 'Kunafa with Cheese', category: 'sweets', subcategory: 'arabic', servingSizeG: 150, servingSizeText: 'قطعة', calories: 450, proteinG: 10.0, carbsG: 45.0, fatG: 25.0, sodiumMg: 250, isArabic: true },
  { nameAr: 'بقلاوة', nameEn: 'Baklava', category: 'sweets', subcategory: 'arabic', servingSizeG: 50, servingSizeText: 'قطعة', calories: 200, proteinG: 3.0, carbsG: 22.0, fatG: 12.0, sodiumMg: 40, isArabic: true },
  { nameAr: 'لقيمات', nameEn: 'Luqaimat', category: 'sweets', subcategory: 'arabic', servingSizeG: 100, servingSizeText: 'قطعة', calories: 300, proteinG: 4.0, carbsG: 40.0, fatG: 15.0, sodiumMg: 50, isArabic: true },
  { nameAr: 'قطايف', nameEn: 'Qatayef', category: 'sweets', subcategory: 'arabic', servingSizeG: 80, servingSizeText: 'قطعة', calories: 200, proteinG: 4.0, carbsG: 35.0, fatG: 6.0, sodiumMg: 60, isArabic: true },
  { nameAr: 'أم علي', nameEn: 'Umm Ali', category: 'sweets', subcategory: 'arabic', servingSizeG: 200, servingSizeText: 'طبق', calories: 350, proteinG: 8.0, carbsG: 40.0, fatG: 18.0, sodiumMg: 120, isArabic: true },
  { nameAr: 'مهلبية', nameEn: 'Muhallabia', category: 'sweets', subcategory: 'arabic', servingSizeG: 150, servingSizeText: 'طبق', calories: 200, proteinG: 5.0, carbsG: 30.0, fatG: 7.0, sodiumMg: 50, isArabic: true },
  { nameAr: 'أرز بلبن', nameEn: 'Rice Pudding', category: 'sweets', subcategory: 'arabic', servingSizeG: 150, servingSizeText: 'طبق', calories: 180, proteinG: 4.0, carbsG: 32.0, fatG: 4.0, sodiumMg: 70, isArabic: true },
  { nameAr: 'حلاوة طحينية', nameEn: 'Halwa Tahiniya', category: 'sweets', subcategory: 'arabic', servingSizeG: 30, servingSizeText: 'قطعة', calories: 140, proteinG: 3.0, carbsG: 16.0, fatG: 8.0, sodiumMg: 20, isArabic: true },
  { nameAr: 'عسل', nameEn: 'Honey', category: 'sweets', subcategory: 'sweeteners', servingSizeG: 20, servingSizeText: 'ملعقة', calories: 60, proteinG: 0, carbsG: 16.0, fatG: 0, sugarG: 16.0, sodiumMg: 1, potassiumMg: 10, isArabic: true },
  { nameAr: 'دبس تمر', nameEn: 'Date Molasses', category: 'sweets', subcategory: 'sweeteners', servingSizeG: 20, servingSizeText: 'ملعقة', calories: 55, proteinG: 0.3, carbsG: 14.0, fatG: 0, sugarG: 12.0, sodiumMg: 2, potassiumMg: 100, isArabic: true },
  { nameAr: 'دبس رمان', nameEn: 'Pomegranate Molasses', category: 'sweets', subcategory: 'sweeteners', servingSizeG: 20, servingSizeText: 'ملعقة', calories: 45, proteinG: 0.2, carbsG: 11.0, fatG: 0, sugarG: 9.0, sodiumMg: 2, potassiumMg: 70, isArabic: true },

  // ===== BEVERAGES =====
  { nameAr: 'ماء', nameEn: 'Water', category: 'beverages', subcategory: 'water', servingSizeG: 250, servingSizeText: 'كوب', calories: 0, proteinG: 0, carbsG: 0, fatG: 0, isArabic: false },
  { nameAr: 'شاي', nameEn: 'Tea', category: 'beverages', subcategory: 'tea', servingSizeG: 240, servingSizeText: 'كوب', calories: 2, proteinG: 0, carbsG: 0, fatG: 0, sodiumMg: 5, isArabic: true },
  { nameAr: 'شاي أحمر', nameEn: 'Black Tea', category: 'beverages', subcategory: 'tea', servingSizeG: 240, servingSizeText: 'كوب', calories: 2, proteinG: 0, carbsG: 0, fatG: 0, sodiumMg: 5, isArabic: true },
  { nameAr: 'شاي أخضر', nameEn: 'Green Tea', category: 'beverages', subcategory: 'tea', servingSizeG: 240, servingSizeText: 'كوب', calories: 2, proteinG: 0, carbsG: 0, fatG: 0, sodiumMg: 3, isArabic: false },
  { nameAr: 'قهوة', nameEn: 'Coffee', category: 'beverages', subcategory: 'coffee', servingSizeG: 240, servingSizeText: 'كوب', calories: 2, proteinG: 0, carbsG: 0, fatG: 0, sodiumMg: 5, isArabic: true },
  { nameAr: 'قهوة عربية', nameEn: 'Arabic Coffee', category: 'beverages', subcategory: 'coffee', servingSizeG: 60, servingSizeText: 'فنجان', calories: 5, proteinG: 0, carbsG: 0.5, fatG: 0, sodiumMg: 1, isArabic: true },
  { nameAr: 'عصير برتقال', nameEn: 'Orange Juice', category: 'beverages', subcategory: 'juice', servingSizeG: 250, servingSizeText: 'كوب', calories: 110, proteinG: 1.5, carbsG: 26.0, fatG: 0.3, sugarG: 22.0, sodiumMg: 2, potassiumMg: 440, isArabic: false },
  { nameAr: 'عصير ليمون', nameEn: 'Lemon Juice', category: 'beverages', subcategory: 'juice', servingSizeG: 250, servingSizeText: 'كوب', calories: 50, proteinG: 0.5, carbsG: 12.0, fatG: 0, sugarG: 8.0, sodiumMg: 3, potassiumMg: 150, isArabic: true },
  { nameAr: 'عصير رمان', nameEn: 'Pomegranate Juice', category: 'beverages', subcategory: 'juice', servingSizeG: 250, servingSizeText: 'كوب', calories: 130, proteinG: 0.5, carbsG: 32.0, fatG: 0.3, sugarG: 28.0, sodiumMg: 8, potassiumMg: 400, isArabic: true },
  { nameAr: 'عصير تمر هندي', nameEn: 'Tamarind Juice', category: 'beverages', subcategory: 'juice', servingSizeG: 250, servingSizeText: 'كوب', calories: 130, proteinG: 0.5, carbsG: 32.0, fatG: 0.1, fiberG: 1.0, sugarG: 28.0, sodiumMg: 10, potassiumMg: 300, isArabic: true },
  { nameAr: 'عصير قمر الدين', nameEn: 'Apricot Juice', category: 'beverages', subcategory: 'juice', servingSizeG: 250, servingSizeText: 'كوب', calories: 140, proteinG: 1.0, carbsG: 35.0, fatG: 0.1, sugarG: 30.0, sodiumMg: 5, potassiumMg: 280, isArabic: true },
  { nameAr: 'سوبيا', nameEn: 'Sobia', category: 'beverages', subcategory: 'traditional', servingSizeG: 250, servingSizeText: 'كوب', calories: 120, proteinG: 1.0, carbsG: 28.0, fatG: 0.5, sugarG: 22.0, isArabic: true },
  { nameAr: 'حليب بالتمر', nameEn: 'Date Milk Shake', category: 'beverages', subcategory: 'smoothie', servingSizeG: 250, servingSizeText: 'كوب', calories: 200, proteinG: 5.0, carbsG: 35.0, fatG: 5.0, sugarG: 28.0, sodiumMg: 80, potassiumMg: 350, isArabic: true },

  // ===== TRADITIONAL ARABIC DISHES =====
  { nameAr: 'كبسة', nameEn: 'Kabsa', category: 'arabic_dishes', subcategory: 'rice_dishes', servingSizeG: 300, servingSizeText: 'طبق', calories: 550, proteinG: 30.0, carbsG: 65.0, fatG: 18.0, fiberG: 3.0, sodiumMg: 600, potassiumMg: 350, isArabic: true },
  { nameAr: 'كبسة دجاج', nameEn: 'Chicken Kabsa', category: 'arabic_dishes', subcategory: 'rice_dishes', servingSizeG: 350, servingSizeText: 'طبق', calories: 500, proteinG: 28.0, carbsG: 60.0, fatG: 16.0, fiberG: 3.0, sodiumMg: 550, potassiumMg: 340, isArabic: true },
  { nameAr: 'كبسة لحم', nameEn: 'Meat Kabsa', category: 'arabic_dishes', subcategory: 'rice_dishes', servingSizeG: 350, servingSizeText: 'طبق', calories: 580, proteinG: 32.0, carbsG: 60.0, fatG: 22.0, fiberG: 2.5, sodiumMg: 580, potassiumMg: 360, isArabic: true },
  { nameAr: 'مندي', nameEn: 'Mandi', category: 'arabic_dishes', subcategory: 'rice_dishes', servingSizeG: 350, servingSizeText: 'طبق', calories: 600, proteinG: 30.0, carbsG: 60.0, fatG: 25.0, fiberG: 2.0, sodiumMg: 500, potassiumMg: 320, isArabic: true },
  { nameAr: 'مندي دجاج', nameEn: 'Chicken Mandi', category: 'arabic_dishes', subcategory: 'rice_dishes', servingSizeG: 350, servingSizeText: 'طبق', calories: 520, proteinG: 28.0, carbsG: 60.0, fatG: 18.0, fiberG: 2.0, sodiumMg: 480, potassiumMg: 310, isArabic: true },
  { nameAr: 'مقلوبة', nameEn: 'Maqluba', category: 'arabic_dishes', subcategory: 'rice_dishes', servingSizeG: 350, servingSizeText: 'طبق', calories: 450, proteinG: 20.0, carbsG: 55.0, fatG: 16.0, fiberG: 4.0, sodiumMg: 450, potassiumMg: 400, isArabic: true },
  { nameAr: 'مقلوبة دجاج', nameEn: 'Chicken Maqluba', category: 'arabic_dishes', subcategory: 'rice_dishes', servingSizeG: 350, servingSizeText: 'طبق', calories: 420, proteinG: 22.0, carbsG: 55.0, fatG: 12.0, fiberG: 4.0, sodiumMg: 420, potassiumMg: 380, isArabic: true },
  { nameAr: 'فسيخ', nameEn: 'Feseekh', category: 'arabic_dishes', subcategory: 'fish_dishes', servingSizeG: 150, servingSizeText: 'طبق', calories: 200, proteinG: 25.0, carbsG: 0, fatG: 10.0, sodiumMg: 2000, isArabic: true },
  { nameAr: 'صيادية', nameEn: 'Sayyadieh', category: 'arabic_dishes', subcategory: 'rice_dishes', servingSizeG: 300, servingSizeText: 'طبق', calories: 400, proteinG: 20.0, carbsG: 50.0, fatG: 12.0, fiberG: 2.0, sodiumMg: 350, isArabic: true },
  { nameAr: 'محشي ورق عنب', nameEn: 'Stuffed Grape Leaves', category: 'arabic_dishes', subcategory: 'stuffed', servingSizeG: 200, servingSizeText: 'طبق', calories: 280, proteinG: 8.0, carbsG: 35.0, fatG: 12.0, fiberG: 5.0, sodiumMg: 300, potassiumMg: 350, isArabic: true },
  { nameAr: 'محشي كوسا', nameEn: 'Stuffed Zucchini', category: 'arabic_dishes', subcategory: 'stuffed', servingSizeG: 200, servingSizeText: 'طبق', calories: 250, proteinG: 10.0, carbsG: 28.0, fatG: 10.0, fiberG: 4.0, sodiumMg: 280, potassiumMg: 320, isArabic: true },
  { nameAr: 'محشي باذنجان', nameEn: 'Stuffed Eggplant', category: 'arabic_dishes', subcategory: 'stuffed', servingSizeG: 200, servingSizeText: 'طبق', calories: 260, proteinG: 8.0, carbsG: 30.0, fatG: 12.0, fiberG: 6.0, sodiumMg: 280, isArabic: true },
  { nameAr: 'محشي فلفل', nameEn: 'Stuffed Peppers', category: 'arabic_dishes', subcategory: 'stuffed', servingSizeG: 200, servingSizeText: 'طبق', calories: 240, proteinG: 10.0, carbsG: 25.0, fatG: 10.0, fiberG: 4.0, sodiumMg: 300, isArabic: true },
  { nameAr: 'مسخن', nameEn: 'Musakhan', category: 'arabic_dishes', subcategory: 'chicken_dishes', servingSizeG: 300, servingSizeText: 'طبق', calories: 500, proteinG: 25.0, carbsG: 40.0, fatG: 25.0, fiberG: 3.0, sodiumMg: 500, isArabic: true },
  { nameAr: 'منسف', nameEn: 'Mansaf', category: 'arabic_dishes', subcategory: 'rice_dishes', servingSizeG: 400, servingSizeText: 'طبق', calories: 650, proteinG: 35.0, carbsG: 55.0, fatG: 30.0, fiberG: 2.0, sodiumMg: 450, potassiumMg: 400, isArabic: true },
  { nameAr: 'شاورما', nameEn: 'Shawarma', category: 'arabic_dishes', subcategory: 'sandwiches', servingSizeG: 200, servingSizeText: 'ساندويتش', calories: 400, proteinG: 20.0, carbsG: 35.0, fatG: 20.0, fiberG: 2.0, sodiumMg: 600, isArabic: true },
  { nameAr: 'شاورما دجاج', nameEn: 'Chicken Shawarma', category: 'arabic_dishes', subcategory: 'sandwiches', servingSizeG: 200, servingSizeText: 'ساندويتش', calories: 350, proteinG: 22.0, carbsG: 35.0, fatG: 14.0, fiberG: 2.0, sodiumMg: 550, isArabic: true },
  { nameAr: 'فلافل', nameEn: 'Falafel', category: 'arabic_dishes', subcategory: 'sandwiches', servingSizeG: 150, servingSizeText: 'طبق', calories: 280, proteinG: 12.0, carbsG: 30.0, fatG: 14.0, fiberG: 6.0, sodiumMg: 250, potassiumMg: 250, isArabic: true },
  { nameAr: 'حمص بطحينة', nameEn: 'Hummus with Tahini', category: 'arabic_dishes', subcategory: 'appetizers', servingSizeG: 100, servingSizeText: 'طبق', calories: 170, proteinG: 7.0, carbsG: 20.0, fatG: 8.0, fiberG: 4.0, sodiumMg: 200, potassiumMg: 150, isArabic: true },
  { nameAr: 'متبل', nameEn: 'Mutabbal', category: 'arabic_dishes', subcategory: 'appetizers', servingSizeG: 100, servingSizeText: 'طبق', calories: 120, proteinG: 2.0, carbsG: 8.0, fatG: 9.0, fiberG: 4.0, sodiumMg: 180, isArabic: true },
  { nameAr: 'بابا غنوج', nameEn: 'Baba Ghanoush', category: 'arabic_dishes', subcategory: 'appetizers', servingSizeG: 100, servingSizeText: 'طبق', calories: 80, proteinG: 2.0, carbsG: 8.0, fatG: 5.0, fiberG: 3.0, sodiumMg: 200, isArabic: true },
  { nameAr: 'ورق عنب', nameEn: 'Grape Leaves', category: 'arabic_dishes', subcategory: 'appetizers', servingSizeG: 100, servingSizeText: 'طبق', calories: 120, proteinG: 3.0, carbsG: 15.0, fatG: 6.0, fiberG: 4.0, sodiumMg: 250, isArabic: true },
  { nameAr: 'تبولة', nameEn: 'Tabbouleh', category: 'arabic_dishes', subcategory: 'salads', servingSizeG: 150, servingSizeText: 'طبق', calories: 130, proteinG: 2.5, carbsG: 18.0, fatG: 6.0, fiberG: 4.0, sodiumMg: 100, potassiumMg: 250, isArabic: true },
  { nameAr: 'فتوش', nameEn: 'Fattoush', category: 'arabic_dishes', subcategory: 'salads', servingSizeG: 150, servingSizeText: 'طبق', calories: 120, proteinG: 2.0, carbsG: 15.0, fatG: 6.0, fiberG: 3.0, sodiumMg: 150, isArabic: true },
  { nameAr: 'سلطة عربية', nameEn: 'Arabic Salad', category: 'arabic_dishes', subcategory: 'salads', servingSizeG: 150, servingSizeText: 'طبق', calories: 50, proteinG: 1.5, carbsG: 7.0, fatG: 2.0, fiberG: 2.5, sodiumMg: 80, potassiumMg: 200, isArabic: true },
  { nameAr: 'سمبوسة', nameEn: 'Sambousek', category: 'arabic_dishes', subcategory: 'appetizers', servingSizeG: 100, servingSizeText: 'قطعة', calories: 250, proteinG: 8.0, carbsG: 28.0, fatG: 12.0, fiberG: 1.5, sodiumMg: 350, isArabic: true },
  { nameAr: 'فطائر جبنة', nameEn: 'Cheese Fatayer', category: 'arabic_dishes', subcategory: 'pastries', servingSizeG: 100, servingSizeText: 'قطعة', calories: 220, proteinG: 8.0, carbsG: 25.0, fatG: 10.0, sodiumMg: 300, isArabic: true },
  { nameAr: 'فطائر سبانخ', nameEn: 'Spinach Fatayer', category: 'arabic_dishes', subcategory: 'pastries', servingSizeG: 100, servingSizeText: 'قطعة', calories: 200, proteinG: 6.0, carbsG: 25.0, fatG: 9.0, fiberG: 2.0, sodiumMg: 250, isArabic: true },
  { nameAr: 'مندي سمك', nameEn: 'Fish Mandi', category: 'arabic_dishes', subcategory: 'rice_dishes', servingSizeG: 350, servingSizeText: 'طبق', calories: 450, proteinG: 25.0, carbsG: 55.0, fatG: 14.0, fiberG: 2.0, sodiumMg: 400, isArabic: true },
  { nameAr: 'برياني', nameEn: 'Biryani', category: 'arabic_dishes', subcategory: 'rice_dishes', servingSizeG: 350, servingSizeText: 'طبق', calories: 550, proteinG: 25.0, carbsG: 65.0, fatG: 20.0, fiberG: 2.0, sodiumMg: 550, isArabic: true },
  { nameAr: 'برياني دجاج', nameEn: 'Chicken Biryani', category: 'arabic_dishes', subcategory: 'rice_dishes', servingSizeG: 350, servingSizeText: 'طبق', calories: 500, proteinG: 24.0, carbsG: 65.0, fatG: 16.0, fiberG: 2.0, sodiumMg: 500, isArabic: true },
  { nameAr: 'برياني لحم', nameEn: 'Meat Biryani', category: 'arabic_dishes', subcategory: 'rice_dishes', servingSizeG: 350, servingSizeText: 'طبق', calories: 550, proteinG: 26.0, carbsG: 62.0, fatG: 22.0, fiberG: 2.0, sodiumMg: 520, isArabic: true },
  { nameAr: 'جريش', nameEn: 'Jareesh', category: 'arabic_dishes', subcategory: 'soups', servingSizeG: 250, servingSizeText: 'طبق', calories: 300, proteinG: 12.0, carbsG: 45.0, fatG: 8.0, fiberG: 5.0, sodiumMg: 200, isArabic: true },
  { nameAr: 'هريس', nameEn: 'Harees', category: 'arabic_dishes', subcategory: 'soups', servingSizeG: 250, servingSizeText: 'طبق', calories: 320, proteinG: 14.0, carbsG: 42.0, fatG: 10.0, fiberG: 4.0, sodiumMg: 180, isArabic: true },
  { nameAr: 'ثريد', nameEn: 'Thareed', category: 'arabic_dishes', subcategory: 'soups', servingSizeG: 300, servingSizeText: 'طبق', calories: 350, proteinG: 18.0, carbsG: 40.0, fatG: 12.0, fiberG: 4.0, sodiumMg: 350, isArabic: true },
  { nameAr: 'شوربة عدس', nameEn: 'Lentil Soup', category: 'soups', subcategory: 'arabic', servingSizeG: 250, servingSizeText: 'طبق', calories: 120, proteinG: 7.0, carbsG: 18.0, fatG: 2.0, fiberG: 5.0, sodiumMg: 200, potassiumMg: 250, isArabic: true },
  { nameAr: 'شوربة خضار', nameEn: 'Vegetable Soup', category: 'soups', subcategory: 'arabic', servingSizeG: 250, servingSizeText: 'طبق', calories: 80, proteinG: 3.0, carbsG: 12.0, fatG: 2.0, fiberG: 4.0, sodiumMg: 180, isArabic: true },
  { nameAr: 'شوربة دجاج', nameEn: 'Chicken Soup', category: 'soups', subcategory: 'arabic', servingSizeG: 250, servingSizeText: 'طبق', calories: 100, proteinG: 8.0, carbsG: 10.0, fatG: 3.0, fiberG: 1.0, sodiumMg: 250, isArabic: true },
  { nameAr: 'شوربة لسان عصفور', nameEn: 'Lisan Asfour Soup', category: 'soups', subcategory: 'arabic', servingSizeG: 250, servingSizeText: 'طبق', calories: 150, proteinG: 5.0, carbsG: 22.0, fatG: 4.0, fiberG: 1.0, sodiumMg: 220, isArabic: true },
  { nameAr: 'عدس', nameEn: 'Adas (Lentil dish)', category: 'arabic_dishes', subcategory: 'soups', servingSizeG: 250, servingSizeText: 'طبق', calories: 180, proteinG: 12.0, carbsG: 28.0, fatG: 2.0, fiberG: 8.0, sodiumMg: 150, isArabic: true },
  { nameAr: 'مجبوس', nameEn: 'Madjboos', category: 'arabic_dishes', subcategory: 'rice_dishes', servingSizeG: 350, servingSizeText: 'طبق', calories: 520, proteinG: 28.0, carbsG: 60.0, fatG: 18.0, sodiumMg: 500, isArabic: true },
  { nameAr: 'كشري', nameEn: 'Koshari', category: 'arabic_dishes', subcategory: 'rice_dishes', servingSizeG: 350, servingSizeText: 'طبق', calories: 400, proteinG: 12.0, carbsG: 65.0, fatG: 10.0, fiberG: 6.0, sodiumMg: 350, isArabic: true },
  { nameAr: 'فول مدمس', nameEn: 'Ful Medames', category: 'arabic_dishes', subcategory: 'breakfast', servingSizeG: 200, servingSizeText: 'طبق', calories: 200, proteinG: 14.0, carbsG: 33.0, fatG: 2.0, fiberG: 8.0, sodiumMg: 250, isArabic: true },
  { nameAr: 'طعمية', nameEn: 'Taamiya (Egyptian Falafel)', category: 'arabic_dishes', subcategory: 'appetizers', servingSizeG: 100, servingSizeText: 'قطعة', calories: 200, proteinG: 8.0, carbsG: 22.0, fatG: 9.0, fiberG: 5.0, sodiumMg: 200, isArabic: true },
  { nameAr: 'ملوخية بالدجاج', nameEn: 'Molokhia with Chicken', category: 'arabic_dishes', subcategory: 'stews', servingSizeG: 300, servingSizeText: 'طبق', calories: 250, proteinG: 22.0, carbsG: 15.0, fatG: 10.0, fiberG: 3.0, sodiumMg: 350, isArabic: true },
  { nameAr: 'ملوخية بالأرانب', nameEn: 'Molokhia with Rabbit', category: 'arabic_dishes', subcategory: 'stews', servingSizeG: 300, servingSizeText: 'طبق', calories: 260, proteinG: 24.0, carbsG: 14.0, fatG: 11.0, isArabic: true },
  { nameAr: 'بامية باللحم', nameEn: 'Okra with Meat', category: 'arabic_dishes', subcategory: 'stews', servingSizeG: 300, servingSizeText: 'طبق', calories: 280, proteinG: 20.0, carbsG: 20.0, fatG: 12.0, fiberG: 5.0, sodiumMg: 300, isArabic: true },
  { nameAr: 'فاصوليا باللحم', nameEn: 'White Beans with Meat', category: 'arabic_dishes', subcategory: 'stews', servingSizeG: 300, servingSizeText: 'طبق', calories: 320, proteinG: 22.0, carbsG: 30.0, fatG: 12.0, fiberG: 8.0, sodiumMg: 280, isArabic: true },
  { nameAr: 'كفتة', nameEn: 'Kofta', category: 'arabic_dishes', subcategory: 'meat_dishes', servingSizeG: 150, servingSizeText: 'طبق', calories: 280, proteinG: 20.0, carbsG: 8.0, fatG: 18.0, sodiumMg: 350, isArabic: true },
  { nameAr: 'كباب', nameEn: 'Kebab', category: 'arabic_dishes', subcategory: 'meat_dishes', servingSizeG: 150, servingSizeText: 'طبق', calories: 300, proteinG: 22.0, carbsG: 5.0, fatG: 22.0, sodiumMg: 400, isArabic: true },
  { nameAr: 'تكة', nameEn: 'Tikka', category: 'arabic_dishes', subcategory: 'meat_dishes', servingSizeG: 150, servingSizeText: 'طبق', calories: 250, proteinG: 26.0, carbsG: 5.0, fatG: 14.0, sodiumMg: 350, isArabic: true },
  { nameAr: 'شيش كباب', nameEn: 'Shish Kebab', category: 'arabic_dishes', subcategory: 'meat_dishes', servingSizeG: 150, servingSizeText: 'طبق', calories: 260, proteinG: 24.0, carbsG: 5.0, fatG: 16.0, sodiumMg: 380, isArabic: true },
  { nameAr: 'دجاج مشوي على الفحم', nameEn: 'Grilled Chicken (charcoal)', category: 'arabic_dishes', subcategory: 'chicken_dishes', servingSizeG: 200, servingSizeText: 'طبق', calories: 330, proteinG: 40.0, carbsG: 2.0, fatG: 18.0, sodiumMg: 400, isArabic: true },
  { nameAr: 'دجاج مندي', nameEn: 'Mandi Chicken', category: 'arabic_dishes', subcategory: 'chicken_dishes', servingSizeG: 200, servingSizeText: 'قطعة', calories: 350, proteinG: 30.0, carbsG: 5.0, fatG: 22.0, sodiumMg: 350, isArabic: true },
  { nameAr: 'سمك مشوي', nameEn: 'Grilled Fish', category: 'arabic_dishes', subcategory: 'fish_dishes', servingSizeG: 200, servingSizeText: 'طبق', calories: 220, proteinG: 35.0, carbsG: 2.0, fatG: 8.0, sodiumMg: 250, isArabic: true },
  { nameAr: 'سمك مقلي', nameEn: 'Fried Fish', category: 'arabic_dishes', subcategory: 'fish_dishes', servingSizeG: 200, servingSizeText: 'طبق', calories: 300, proteinG: 30.0, carbsG: 8.0, fatG: 16.0, sodiumMg: 300, isArabic: true },
  { nameAr: 'سمك حراق', nameEn: 'Harrag Fish', category: 'arabic_dishes', subcategory: 'fish_dishes', servingSizeG: 200, servingSizeText: 'طبق', calories: 280, proteinG: 28.0, carbsG: 10.0, fatG: 14.0, sodiumMg: 500, isArabic: true },
  { nameAr: 'مشدودة', nameEn: 'Mashdooda', category: 'arabic_dishes', subcategory: 'bread_dishes', servingSizeG: 200, servingSizeText: 'طبق', calories: 380, proteinG: 12.0, carbsG: 45.0, fatG: 16.0, fiberG: 3.0, sodiumMg: 350, isArabic: true },
  { nameAr: 'عصيدة', nameEn: 'Aseedah', category: 'arabic_dishes', subcategory: 'bread_dishes', servingSizeG: 200, servingSizeText: 'طبق', calories: 350, proteinG: 6.0, carbsG: 55.0, fatG: 12.0, fiberG: 2.0, sodiumMg: 100, isArabic: true },
  { nameAr: 'مفطوم', nameEn: 'Maftoom', category: 'arabic_dishes', subcategory: 'bread_dishes', servingSizeG: 150, servingSizeText: 'طبق', calories: 300, proteinG: 8.0, carbsG: 40.0, fatG: 12.0, isArabic: true },
  { nameAr: 'مطبق', nameEn: 'Mutabbaq', category: 'arabic_dishes', subcategory: 'pastries', servingSizeG: 150, servingSizeText: 'قطعة', calories: 350, proteinG: 8.0, carbsG: 40.0, fatG: 18.0, sodiumMg: 400, isArabic: true },
  { nameAr: 'كعك', nameEn: 'Kaak', category: 'arabic_dishes', subcategory: 'pastries', servingSizeG: 50, servingSizeText: 'قطعة', calories: 180, proteinG: 4.0, carbsG: 28.0, fatG: 6.0, sodiumMg: 150, isArabic: true },
  { nameAr: 'كعك بالسمسم', nameEn: 'Kaak with Sesame', category: 'arabic_dishes', subcategory: 'pastries', servingSizeG: 50, servingSizeText: 'قطعة', calories: 190, proteinG: 4.5, carbsG: 27.0, fatG: 7.0, sodiumMg: 140, isArabic: true },
  { nameAr: 'حمض', nameEn: 'Hamedh (Lamb Shank)', category: 'arabic_dishes', subcategory: 'meat_dishes', servingSizeG: 300, servingSizeText: 'طبق', calories: 450, proteinG: 30.0, carbsG: 25.0, fatG: 25.0, sodiumMg: 400, isArabic: true },
  { nameAr: 'مظبي', nameEn: 'Madhbi', category: 'arabic_dishes', subcategory: 'meat_dishes', servingSizeG: 300, servingSizeText: 'طبق', calories: 500, proteinG: 32.0, carbsG: 30.0, fatG: 28.0, sodiumMg: 450, isArabic: true },
  { nameAr: 'حنيذ', nameEn: 'Haneeth', category: 'arabic_dishes', subcategory: 'meat_dishes', servingSizeG: 300, servingSizeText: 'طبق', calories: 550, proteinG: 30.0, carbsG: 25.0, fatG: 35.0, sodiumMg: 450, isArabic: true },
  { nameAr: 'مفطح', nameEn: 'Mufattah', category: 'arabic_dishes', subcategory: 'meat_dishes', servingSizeG: 300, servingSizeText: 'طبق', calories: 520, proteinG: 28.0, carbsG: 30.0, fatG: 30.0, sodiumMg: 400, isArabic: true },
  { nameAr: 'سليق', nameEn: 'Saleeg', category: 'arabic_dishes', subcategory: 'rice_dishes', servingSizeG: 300, servingSizeText: 'طبق', calories: 380, proteinG: 18.0, carbsG: 42.0, fatG: 14.0, sodiumMg: 300, isArabic: true },
  { nameAr: 'عريكة', nameEn: 'Areikah', category: 'arabic_dishes', subcategory: 'bread_dishes', servingSizeG: 150, servingSizeText: 'طبق', calories: 320, proteinG: 6.0, carbsG: 45.0, fatG: 14.0, fiberG: 3.0, isArabic: true },
  { nameAr: 'مرقوق', nameEn: 'Marqooq', category: 'arabic_dishes', subcategory: 'bread_dishes', servingSizeG: 300, servingSizeText: 'طبق', calories: 350, proteinG: 16.0, carbsG: 40.0, fatG: 12.0, fiberG: 4.0, sodiumMg: 300, isArabic: true },
  { nameAr: 'المغش', nameEn: 'Al Maghash', category: 'arabic_dishes', subcategory: 'stews', servingSizeG: 250, servingSizeText: 'طبق', calories: 280, proteinG: 15.0, carbsG: 28.0, fatG: 12.0, fiberG: 4.0, isArabic: true },
  { nameAr: 'مطازيز', nameEn: 'Matazeez', category: 'arabic_dishes', subcategory: 'bread_dishes', servingSizeG: 300, servingSizeText: 'طبق', calories: 380, proteinG: 16.0, carbsG: 45.0, fatG: 14.0, fiberG: 3.0, sodiumMg: 350, isArabic: true },
  { nameAr: 'المراصيع', nameEn: 'Al Marasee', category: 'arabic_dishes', subcategory: 'bread_dishes', servingSizeG: 250, servingSizeText: 'طبق', calories: 320, proteinG: 12.0, carbsG: 42.0, fatG: 12.0, isArabic: true },

  // ===== MORE FRUITS =====
  { nameAr: 'كرز', nameEn: 'Cherries', category: 'fruits', subcategory: 'fresh', servingSizeG: 100, servingSizeText: 'كوب', calories: 50, proteinG: 1.0, carbsG: 12.0, fatG: 0.3, fiberG: 1.6, sugarG: 10.0, sodiumMg: 1, potassiumMg: 220, isArabic: false },
  { nameAr: 'توت', nameEn: 'Blueberries', category: 'fruits', subcategory: 'fresh', servingSizeG: 100, servingSizeText: 'كوب', calories: 57, proteinG: 0.7, carbsG: 14.0, fatG: 0.3, fiberG: 2.4, sugarG: 10.0, sodiumMg: 1, potassiumMg: 77, isArabic: false },
  { nameAr: 'توت بري', nameEn: 'Cranberries', category: 'fruits', subcategory: 'fresh', servingSizeG: 100, servingSizeText: 'كوب', calories: 46, proteinG: 0.4, carbsG: 12.0, fatG: 0.1, fiberG: 4.6, sugarG: 4.0, sodiumMg: 2, potassiumMg: 80, isArabic: false },
  { nameAr: 'توت شوكي', nameEn: 'Blackberries', category: 'fruits', subcategory: 'fresh', servingSizeG: 100, servingSizeText: 'كوب', calories: 43, proteinG: 1.4, carbsG: 10.0, fatG: 0.5, fiberG: 5.3, sugarG: 5.0, sodiumMg: 1, potassiumMg: 160, isArabic: false },
  { nameAr: 'توت أحمر', nameEn: 'Raspberries', category: 'fruits', subcategory: 'fresh', servingSizeG: 100, servingSizeText: 'كوب', calories: 52, proteinG: 1.2, carbsG: 12.0, fatG: 0.7, fiberG: 6.5, sugarG: 4.0, sodiumMg: 1, potassiumMg: 150, isArabic: false },
  { nameAr: 'أفوكادو', nameEn: 'Avocado', category: 'fruits', subcategory: 'fresh', servingSizeG: 100, servingSizeText: 'حبة', calories: 160, proteinG: 2.0, carbsG: 8.5, fatG: 14.7, fiberG: 6.7, sugarG: 0.7, sodiumMg: 7, potassiumMg: 485, isArabic: false },
  { nameAr: 'باباي', nameEn: 'Papaya', category: 'fruits', subcategory: 'fresh', servingSizeG: 150, servingSizeText: 'حبة', calories: 60, proteinG: 0.9, carbsG: 15.0, fatG: 0.2, fiberG: 2.5, sugarG: 11.0, sodiumMg: 6, potassiumMg: 260, isArabic: false },
  { nameAr: 'جوافة', nameEn: 'Guava', category: 'fruits', subcategory: 'fresh', servingSizeG: 100, servingSizeText: 'حبة', calories: 68, proteinG: 2.6, carbsG: 14.0, fatG: 1.0, fiberG: 5.4, sugarG: 9.0, sodiumMg: 2, potassiumMg: 290, isArabic: true },
  { nameAr: 'سفرجل', nameEn: 'Quince', category: 'fruits', subcategory: 'fresh', servingSizeG: 100, servingSizeText: 'حبة', calories: 57, proteinG: 0.4, carbsG: 15.0, fatG: 0.1, fiberG: 1.7, sugarG: 12.0, sodiumMg: 4, potassiumMg: 200, isArabic: true },
  { nameAr: 'تمر هندي', nameEn: 'Tamarind', category: 'fruits', subcategory: 'fresh', servingSizeG: 100, servingSizeText: 'كوب', calories: 240, proteinG: 2.8, carbsG: 62.0, fatG: 0.6, fiberG: 5.1, sugarG: 38.0, sodiumMg: 28, potassiumMg: 630, isArabic: true },
  { nameAr: 'ليتشي', nameEn: 'Lychee', category: 'fruits', subcategory: 'fresh', servingSizeG: 100, servingSizeText: 'كوب', calories: 66, proteinG: 0.8, carbsG: 16.5, fatG: 0.4, fiberG: 1.3, sugarG: 15.0, sodiumMg: 1, potassiumMg: 170, isArabic: false },
  { nameAr: 'دراق', nameEn: 'Nectarine', category: 'fruits', subcategory: 'fresh', servingSizeG: 100, servingSizeText: 'حبة', calories: 44, proteinG: 1.1, carbsG: 10.5, fatG: 0.3, fiberG: 1.7, sugarG: 8.0, sodiumMg: 1, potassiumMg: 200, isArabic: false },

  // ===== MORE VEGETABLES =====
  { nameAr: 'هليون', nameEn: 'Asparagus', category: 'vegetables', subcategory: 'fresh', servingSizeG: 100, servingSizeText: 'كوب', calories: 20, proteinG: 2.2, carbsG: 3.9, fatG: 0.1, fiberG: 2.1, sodiumMg: 2, potassiumMg: 200, isArabic: false },
  { nameAr: 'بازلاء خضراء', nameEn: 'Green Beans', category: 'vegetables', subcategory: 'fresh', servingSizeG: 100, servingSizeText: 'كوب', calories: 31, proteinG: 1.8, carbsG: 7.0, fatG: 0.2, fiberG: 3.4, sodiumMg: 6, potassiumMg: 210, isArabic: false },
  { nameAr: 'كرنب', nameEn: 'Cabbage', category: 'vegetables', subcategory: 'leafy', servingSizeG: 100, servingSizeText: 'كوب', calories: 25, proteinG: 1.3, carbsG: 5.8, fatG: 0.1, fiberG: 2.5, sodiumMg: 18, potassiumMg: 170, isArabic: false },
  { nameAr: 'كرنب أحمر', nameEn: 'Red Cabbage', category: 'vegetables', subcategory: 'leafy', servingSizeG: 100, servingSizeText: 'كوب', calories: 27, proteinG: 1.4, carbsG: 6.0, fatG: 0.1, fiberG: 2.0, sodiumMg: 20, potassiumMg: 200, isArabic: false },
  { nameAr: 'براعم بروكسل', nameEn: 'Brussels Sprouts', category: 'vegetables', subcategory: 'fresh', servingSizeG: 100, servingSizeText: 'كوب', calories: 43, proteinG: 3.4, carbsG: 9.0, fatG: 0.3, fiberG: 3.8, sodiumMg: 25, potassiumMg: 390, isArabic: false },
  { nameAr: 'خس روماني', nameEn: 'Romaine Lettuce', category: 'vegetables', subcategory: 'leafy', servingSizeG: 100, servingSizeText: 'كوب', calories: 17, proteinG: 1.2, carbsG: 3.3, fatG: 0.3, fiberG: 2.1, sodiumMg: 8, potassiumMg: 250, isArabic: false },
  { nameAr: 'بقلة', nameEn: 'Purslane', category: 'vegetables', subcategory: 'leafy', servingSizeG: 100, servingSizeText: 'كوب', calories: 16, proteinG: 1.3, carbsG: 3.0, fatG: 0.2, fiberG: 1.5, sodiumMg: 15, potassiumMg: 350, isArabic: true },
  { nameAr: 'بنجر', nameEn: 'Beet', category: 'vegetables', subcategory: 'starchy', servingSizeG: 100, servingSizeText: 'حبة', calories: 43, proteinG: 1.6, carbsG: 10.0, fatG: 0.2, fiberG: 2.8, sugarG: 7.0, sodiumMg: 78, potassiumMg: 325, isArabic: false },
  { nameAr: 'كرفس جذري', nameEn: 'Celery Root', category: 'vegetables', subcategory: 'starchy', servingSizeG: 100, servingSizeText: 'كوب', calories: 42, proteinG: 1.5, carbsG: 9.0, fatG: 0.3, fiberG: 1.8, sodiumMg: 100, potassiumMg: 300, isArabic: false },
  { nameAr: 'لفت', nameEn: 'Turnip', category: 'vegetables', subcategory: 'starchy', servingSizeG: 100, servingSizeText: 'حبة', calories: 28, proteinG: 0.9, carbsG: 6.0, fatG: 0.1, fiberG: 1.8, sodiumMg: 67, potassiumMg: 190, isArabic: true },
  { nameAr: 'فجل أبيض', nameEn: 'Daikon Radish', category: 'vegetables', subcategory: 'fresh', servingSizeG: 100, servingSizeText: 'كوب', calories: 18, proteinG: 0.6, carbsG: 4.0, fatG: 0.1, fiberG: 1.6, sodiumMg: 21, potassiumMg: 230, isArabic: false },
  { nameAr: 'زيتون أخضر', nameEn: 'Green Olives', category: 'vegetables', subcategory: 'pickled', servingSizeG: 30, servingSizeText: 'حبة', calories: 40, proteinG: 0.3, carbsG: 1.0, fatG: 4.0, fiberG: 0.8, sodiumMg: 450, isArabic: true },
  { nameAr: 'زيتون أسود', nameEn: 'Black Olives', category: 'vegetables', subcategory: 'pickled', servingSizeG: 30, servingSizeText: 'حبة', calories: 35, proteinG: 0.3, carbsG: 2.0, fatG: 3.5, fiberG: 0.5, sodiumMg: 400, isArabic: true },
  { nameAr: 'ذرة صفراء', nameEn: 'Yellow Corn', category: 'vegetables', subcategory: 'starchy', servingSizeG: 100, servingSizeText: 'كوب', calories: 96, proteinG: 3.4, carbsG: 21.0, fatG: 1.5, fiberG: 2.4, sodiumMg: 15, potassiumMg: 270, isArabic: false },
  { nameAr: 'فطر', nameEn: 'Mushrooms', category: 'vegetables', subcategory: 'fresh', servingSizeG: 100, servingSizeText: 'كوب', calories: 22, proteinG: 3.1, carbsG: 3.3, fatG: 0.3, fiberG: 1.0, sodiumMg: 5, potassiumMg: 320, isArabic: false },

  // ===== SPICES & CONDIMENTS =====
  { nameAr: 'ملح', nameEn: 'Salt', category: 'condiments', subcategory: 'spices', servingSizeG: 5, servingSizeText: 'رشة', calories: 0, proteinG: 0, carbsG: 0, fatG: 0, sodiumMg: 1900, isArabic: false },
  { nameAr: 'فلفل أسود', nameEn: 'Black Pepper', category: 'condiments', subcategory: 'spices', servingSizeG: 2, servingSizeText: 'رشة', calories: 5, proteinG: 0.2, carbsG: 1.0, fatG: 0.1, fiberG: 0.5, sodiumMg: 0, isArabic: false },
  { nameAr: 'كمون', nameEn: 'Cumin', category: 'condiments', subcategory: 'spices', servingSizeG: 2, servingSizeText: 'رشة', calories: 8, proteinG: 0.4, carbsG: 0.9, fatG: 0.4, sodiumMg: 3, isArabic: true },
  { nameAr: 'كركم', nameEn: 'Turmeric', category: 'condiments', subcategory: 'spices', servingSizeG: 2, servingSizeText: 'رشة', calories: 7, proteinG: 0.2, carbsG: 1.4, fatG: 0.1, fiberG: 0.4, sodiumMg: 1, isArabic: true },
  { nameAr: 'بهارات مشكلة', nameEn: 'Mixed Spices', category: 'condiments', subcategory: 'spices', servingSizeG: 2, servingSizeText: 'رشة', calories: 6, proteinG: 0.2, carbsG: 1.1, fatG: 0.2, sodiumMg: 1, isArabic: true },
  { nameAr: 'قرفة', nameEn: 'Cinnamon', category: 'condiments', subcategory: 'spices', servingSizeG: 2, servingSizeText: 'رشة', calories: 6, proteinG: 0.1, carbsG: 1.2, fatG: 0.1, fiberG: 0.8, sodiumMg: 1, isArabic: true },
  { nameAr: 'هيل', nameEn: 'Cardamom', category: 'condiments', subcategory: 'spices', servingSizeG: 2, servingSizeText: 'رشة', calories: 6, proteinG: 0.2, carbsG: 1.4, fatG: 0.1, sodiumMg: 0, isArabic: true },
  { nameAr: 'قرنفل', nameEn: 'Cloves', category: 'condiments', subcategory: 'spices', servingSizeG: 2, servingSizeText: 'رشة', calories: 6, proteinG: 0.1, carbsG: 1.3, fatG: 0.3, fiberG: 0.7, isArabic: true },
  { nameAr: 'زنجبيل', nameEn: 'Ginger', category: 'condiments', subcategory: 'spices', servingSizeG: 5, servingSizeText: 'رشة', calories: 4, proteinG: 0.1, carbsG: 0.9, fatG: 0.1, fiberG: 0.1, sodiumMg: 1, isArabic: true },
  { nameAr: 'زعتر', nameEn: 'Zaatar', category: 'condiments', subcategory: 'spices', servingSizeG: 5, servingSizeText: 'ملعقة', calories: 15, proteinG: 0.5, carbsG: 2.5, fatG: 0.5, fiberG: 1.5, sodiumMg: 2, isArabic: true },
  { nameAr: 'زعتر أخضر', nameEn: 'Fresh Thyme', category: 'condiments', subcategory: 'herbs', servingSizeG: 5, servingSizeText: 'ملعقة', calories: 3, proteinG: 0.2, carbsG: 0.6, fatG: 0.1, isArabic: true },
  { nameAr: 'سماق', nameEn: 'Sumac', category: 'condiments', subcategory: 'spices', servingSizeG: 2, servingSizeText: 'رشة', calories: 5, proteinG: 0.1, carbsG: 1.0, fatG: 0.2, fiberG: 0.5, isArabic: true },
  { nameAr: 'مردقوش', nameEn: 'Marjoram', category: 'condiments', subcategory: 'herbs', servingSizeG: 2, servingSizeText: 'رشة', calories: 5, proteinG: 0.2, carbsG: 0.8, fatG: 0.1, isArabic: true },
  { nameAr: 'إكليل الجبل', nameEn: 'Rosemary', category: 'condiments', subcategory: 'herbs', servingSizeG: 2, servingSizeText: 'رشة', calories: 5, proteinG: 0.1, carbsG: 0.8, fatG: 0.2, fiberG: 0.4, isArabic: false },
  { nameAr: 'ريحان', nameEn: 'Basil', category: 'condiments', subcategory: 'herbs', servingSizeG: 5, servingSizeText: 'ملعقة', calories: 3, proteinG: 0.2, carbsG: 0.5, fatG: 0.1, fiberG: 0.2, sodiumMg: 1, isArabic: true },
  { nameAr: 'خل', nameEn: 'Vinegar', category: 'condiments', subcategory: 'sauces', servingSizeG: 15, servingSizeText: 'ملعقة', calories: 3, proteinG: 0, carbsG: 0.1, fatG: 0, sodiumMg: 1, isArabic: false },
  { nameAr: 'خل أبيض', nameEn: 'White Vinegar', category: 'condiments', subcategory: 'sauces', servingSizeG: 15, servingSizeText: 'ملعقة', calories: 3, proteinG: 0, carbsG: 0.1, fatG: 0, isArabic: false },
  { nameAr: 'خل تفاح', nameEn: 'Apple Cider Vinegar', category: 'condiments', subcategory: 'sauces', servingSizeG: 15, servingSizeText: 'ملعقة', calories: 3, proteinG: 0, carbsG: 0.1, fatG: 0, isArabic: false },
  { nameAr: 'صلصة طماطم', nameEn: 'Tomato Sauce', category: 'condiments', subcategory: 'sauces', servingSizeG: 60, servingSizeText: 'كوب', calories: 25, proteinG: 1.0, carbsG: 5.0, fatG: 0.2, fiberG: 1.0, sodiumMg: 300, isArabic: false },
  { nameAr: 'معجون طماطم', nameEn: 'Tomato Paste', category: 'condiments', subcategory: 'sauces', servingSizeG: 30, servingSizeText: 'ملعقة', calories: 25, proteinG: 1.3, carbsG: 6.0, fatG: 0.1, fiberG: 1.5, sodiumMg: 150, isArabic: false },
  { nameAr: 'مايونيز', nameEn: 'Mayonnaise', category: 'condiments', subcategory: 'sauces', servingSizeG: 15, servingSizeText: 'ملعقة', calories: 95, proteinG: 0.1, carbsG: 0.5, fatG: 10.5, sodiumMg: 85, isArabic: false },
  { nameAr: 'كاتشاب', nameEn: 'Ketchup', category: 'condiments', subcategory: 'sauces', servingSizeG: 15, servingSizeText: 'ملعقة', calories: 15, proteinG: 0.2, carbsG: 4.0, fatG: 0, sugarG: 3.0, sodiumMg: 150, isArabic: false },
  { nameAr: 'مستردة', nameEn: 'Mustard', category: 'condiments', subcategory: 'sauces', servingSizeG: 10, servingSizeText: 'ملعقة', calories: 10, proteinG: 0.5, carbsG: 1.0, fatG: 0.5, sodiumMg: 120, isArabic: false },
  { nameAr: 'صلصة الصويا', nameEn: 'Soy Sauce', category: 'condiments', subcategory: 'sauces', servingSizeG: 15, servingSizeText: 'ملعقة', calories: 10, proteinG: 1.5, carbsG: 1.0, fatG: 0.1, sodiumMg: 900, isArabic: false },
  { nameAr: 'مخلل', nameEn: 'Pickles', category: 'condiments', subcategory: 'pickled', servingSizeG: 30, servingSizeText: 'قطعة', calories: 5, proteinG: 0.2, carbsG: 1.0, fatG: 0, fiberG: 0.4, sodiumMg: 400, isArabic: true },
  { nameAr: 'مخلل لفت', nameEn: 'Pickled Turnip', category: 'condiments', subcategory: 'pickled', servingSizeG: 30, servingSizeText: 'قطعة', calories: 6, proteinG: 0.2, carbsG: 1.2, fatG: 0, fiberG: 0.3, sodiumMg: 350, isArabic: true },
  { nameAr: 'مخلل خيار', nameEn: 'Pickled Cucumber', category: 'condiments', subcategory: 'pickled', servingSizeG: 30, servingSizeText: 'قطعة', calories: 5, proteinG: 0.2, carbsG: 0.8, fatG: 0, fiberG: 0.3, sodiumMg: 380, isArabic: true },
  { nameAr: 'مشكل مخلل', nameEn: 'Mixed Pickles', category: 'condiments', subcategory: 'pickled', servingSizeG: 30, servingSizeText: 'قطعة', calories: 5, proteinG: 0.2, carbsG: 1.0, fatG: 0, fiberG: 0.3, sodiumMg: 400, isArabic: true },
  { nameAr: 'مربى', nameEn: 'Jam', category: 'condiments', subcategory: 'spreads', servingSizeG: 20, servingSizeText: 'ملعقة', calories: 50, proteinG: 0, carbsG: 13.0, fatG: 0, sugarG: 12.0, sodiumMg: 5, isArabic: false },
  { nameAr: 'عسل أسود', nameEn: 'Blackstrap Molasses', category: 'condiments', subcategory: 'sweeteners', servingSizeG: 20, servingSizeText: 'ملعقة', calories: 60, proteinG: 0, carbsG: 15.0, fatG: 0, sugarG: 12.0, sodiumMg: 10, potassiumMg: 300, isArabic: false },
  { nameAr: 'دبس الخروب', nameEn: 'Carob Molasses', category: 'condiments', subcategory: 'sweeteners', servingSizeG: 20, servingSizeText: 'ملعقة', calories: 50, proteinG: 0.3, carbsG: 13.0, fatG: 0, isArabic: true },
  { nameAr: 'سكر', nameEn: 'Sugar', category: 'condiments', subcategory: 'sweeteners', servingSizeG: 10, servingSizeText: 'ملعقة', calories: 40, proteinG: 0, carbsG: 10.0, fatG: 0, sugarG: 10.0, isArabic: false },
  { nameAr: 'سكر بني', nameEn: 'Brown Sugar', category: 'condiments', subcategory: 'sweeteners', servingSizeG: 10, servingSizeText: 'ملعقة', calories: 38, proteinG: 0, carbsG: 10.0, fatG: 0, sugarG: 10.0, isArabic: false },
  { nameAr: 'مكعب مرق الدجاج', nameEn: 'Chicken Bouillon Cube', category: 'condiments', subcategory: 'flavoring', servingSizeG: 6, servingSizeText: 'مكعب', calories: 8, proteinG: 0.3, carbsG: 0.5, fatG: 0.5, sodiumMg: 800, isArabic: false },
  { nameAr: 'مكعب مرق اللحم', nameEn: 'Meat Bouillon Cube', category: 'condiments', subcategory: 'flavoring', servingSizeG: 6, servingSizeText: 'مكعب', calories: 10, proteinG: 0.4, carbsG: 0.5, fatG: 0.6, sodiumMg: 800, isArabic: false },
  { nameAr: 'ورق غار', nameEn: 'Bay Leaves', category: 'condiments', subcategory: 'herbs', servingSizeG: 1, servingSizeText: 'ورقة', calories: 2, proteinG: 0, carbsG: 0.4, fatG: 0.1, isArabic: false },
];

// Generate variations for volume (5000+ foods)
function generateFoodVariations(): FoodSeed[] {
  const variations: FoodSeed[] = [];
  const portionSizes = [50, 100, 150, 200, 250];

  FOODS.forEach((food) => {
    if (food.category === 'condiments') return;
    if (food.category === 'beverages') return;

    portionSizes.forEach((size) => {
      if (size === food.servingSizeG) return;
      const ratio = size / (food.servingSizeG || 100);
      variations.push({
        nameAr: `${food.nameAr} (${size}غ)`,
        nameEn: `${food.nameEn} (${size}g)`,
        category: food.category,
        subcategory: food.subcategory,
        servingSizeG: size,
        servingSizeText: `${size}غ`,
        calories: Math.round(food.calories * ratio),
        proteinG: +(food.proteinG * ratio).toFixed(1),
        carbsG: +(food.carbsG * ratio).toFixed(1),
        fatG: +(food.fatG * ratio).toFixed(1),
        fiberG: food.fiberG ? +(food.fiberG * ratio).toFixed(1) : undefined,
        sugarG: food.sugarG ? +(food.sugarG * ratio).toFixed(1) : undefined,
        sodiumMg: food.sodiumMg ? Math.round(food.sodiumMg * ratio) : undefined,
        potassiumMg: food.potassiumMg ? Math.round(food.potassiumMg * ratio) : undefined,
        isArabic: food.isArabic,
      });
    });
  });

  return variations;
}

// Helper to split array into chunks
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export async function seedFoods(database: Database): Promise<void> {
  const existing = await database.get('foods').query().fetchCount();
  if (existing > 0) return;

  const allFoods = [...FOODS, ...generateFoodVariations()];
  const collection = database.get('foods');
  const CHUNK_SIZE = 400;
  const chunks = chunkArray(allFoods, CHUNK_SIZE);

  console.log(`[Seed] Starting Foods seeding: ${allFoods.length} records in ${chunks.length} chunks`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    await database.write(async () => {
      const records = chunk.map((f) =>
        collection.prepareCreate((record: any) => {
          record.nameAr = f.nameAr;
          record.nameEn = f.nameEn;
          record.category = f.category;
          record.subcategory = f.subcategory ?? '';
          record.servingSizeG = f.servingSizeG ?? null;
          record.servingSizeText = f.servingSizeText ?? '';
          record.calories = f.calories;
          record.proteinG = f.proteinG;
          record.carbsG = f.carbsG;
          record.fatG = f.fatG;
          record.fiberG = f.fiberG ?? null;
          record.sugarG = f.sugarG ?? null;
          record.sodiumMg = f.sodiumMg ?? null;
          record.potassiumMg = f.potassiumMg ?? null;
          record.isArabic = f.isArabic;
          record._raw.created_at = NOW;
          record._raw.updated_at = NOW;
        }),
      );

      await database.batch(records);
    });

    console.log(`[Seed] Foods: Processed chunk ${i + 1}/${chunks.length}`);
    
    // Microscopic delay to allow GC to free up memory
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  console.log(`[Seed] Foods: Seeding completed successfully`);
}
