import { RecipeSeed } from './seedData';

interface RecipeTemplate {
  nameEn: string;
  nameAr: string;
  category: string;
  baseCalories: number;
  baseProtein: number;
  baseCarbs: number;
  baseFat: number;
  baseFiber: number;
  servings: number;
  prepTime: number;
  cookTime: number;
  ingredientSlots: Array<{ foodId: string; amount: number; unit: string; variance: number }>;
  steps: Array<{ instructionEn: string; instructionAr: string }>;
}

const FOOD_REF = {
  chicken: 'food-0037', rice: 'food-0001', onion: 'food-0017', garlic: 'food-0018',
  tomato: 'food-0014', oil: 'food-0051', salt: 'food-0054', pepper: 'food-0021',
  potato: 'food-0019', carrot: 'food-0013', spinach: 'food-0012', yogurt: 'food-0048',
  lemon: 'food-0029', egg: 'food-0040', bread: 'food-0003', beef: 'food-0039',
  pasta: 'food-0010', cheese: 'food-0049', milk: 'food-0046', honey: 'food-0054',
  oats: 'food-0006', banana: 'food-0028', apple: 'food-0027', orange: 'food-0029',
  olive: 'food-0051', cumin: 'food-0051', turmeric: 'food-0051', cinnamon: 'food-0051',
};

const BASE_TEMPLATES: RecipeTemplate[] = [
  {
    nameEn: 'Classic Oatmeal', nameAr: 'شوفان كلاسيكي', category: 'breakfast',
    baseCalories: 280, baseProtein: 10, baseCarbs: 45, baseFat: 7, baseFiber: 6,
    servings: 1, prepTime: 2, cookTime: 8,
    ingredientSlots: [
      { foodId: FOOD_REF.oats, amount: 50, unit: 'g', variance: 10 },
      { foodId: FOOD_REF.milk, amount: 200, unit: 'ml', variance: 50 },
      { foodId: FOOD_REF.honey, amount: 15, unit: 'g', variance: 5 },
    ],
    steps: [
      { instructionEn: 'Bring milk to a boil in a saucepan', instructionAr: 'يغلي الحليب في قدر' },
      { instructionEn: 'Add oats and reduce heat, cook for 5 minutes stirring occasionally', instructionAr: 'يضاف الشوفان وتخفف النار ويطهى لمدة 5 دقائق مع التحريك' },
      { instructionEn: 'Sweeten with honey and serve warm', instructionAr: 'يحلى بالعسل ويقدم دافئاً' },
    ],
  },
  {
    nameEn: 'Vegetable Omelette', nameAr: 'عجة خضار', category: 'breakfast',
    baseCalories: 310, baseProtein: 20, baseCarbs: 8, baseFat: 22, baseFiber: 3,
    servings: 1, prepTime: 5, cookTime: 10,
    ingredientSlots: [
      { foodId: FOOD_REF.egg, amount: 3, unit: 'pcs', variance: 1 },
      { foodId: FOOD_REF.onion, amount: 30, unit: 'g', variance: 10 },
      { foodId: FOOD_REF.tomato, amount: 50, unit: 'g', variance: 20 },
      { foodId: FOOD_REF.spinach, amount: 30, unit: 'g', variance: 15 },
      { foodId: FOOD_REF.oil, amount: 15, unit: 'ml', variance: 5 },
    ],
    steps: [
      { instructionEn: 'Beat eggs in a bowl with salt and pepper', instructionAr: 'يخفق البيض في وعاء مع الملح والفلفل' },
      { instructionEn: 'Dice onion, tomato and spinach finely', instructionAr: 'يفرم البصل والطماطم والسبانخ ناعماً' },
      { instructionEn: 'Heat oil in a non-stick pan and sauté vegetables', instructionAr: 'يسخن الزيت في مقلاة وتقلب الخضار' },
      { instructionEn: 'Pour eggs over vegetables and cook until set', instructionAr: 'يصب البيض فوق الخضار ويطهى حتى يتماسك' },
      { instructionEn: 'Fold and serve with toast', instructionAr: 'يطوى ويقدم مع التوست' },
    ],
  },
  {
    nameEn: 'Tuna Sandwich', nameAr: 'ساندويتش تونة', category: 'lunch',
    baseCalories: 380, baseProtein: 25, baseCarbs: 35, baseFat: 14, baseFiber: 3,
    servings: 1, prepTime: 10, cookTime: 0,
    ingredientSlots: [
      { foodId: 'food-0043', amount: 100, unit: 'g', variance: 25 },
      { foodId: FOOD_REF.bread, amount: 100, unit: 'g', variance: 25 },
      { foodId: FOOD_REF.onion, amount: 20, unit: 'g', variance: 10 },
      { foodId: FOOD_REF.tomato, amount: 40, unit: 'g', variance: 15 },
      { foodId: FOOD_REF.yogurt, amount: 30, unit: 'g', variance: 10 },
    ],
    steps: [
      { instructionEn: 'Drain tuna and flake with a fork', instructionAr: 'تصفى التونة وتفتت بالشوكة' },
      { instructionEn: 'Mix tuna with diced onion and yogurt', instructionAr: 'تخلط التونة مع البصل المفروم والزبادي' },
      { instructionEn: 'Toast bread lightly', instructionAr: 'يحمر الخبز قليلاً' },
      { instructionEn: 'Assemble sandwich with tomato slices', instructionAr: 'يحضر الساندويتش مع شرائح الطماطم' },
    ],
  },
  {
    nameEn: 'Grilled Chicken Salad', nameAr: 'سلطة دجاج مشوي', category: 'lunch',
    baseCalories: 320, baseProtein: 30, baseCarbs: 12, baseFat: 16, baseFiber: 5,
    servings: 1, prepTime: 15, cookTime: 15,
    ingredientSlots: [
      { foodId: FOOD_REF.chicken, amount: 150, unit: 'g', variance: 50 },
      { foodId: FOOD_REF.spinach, amount: 60, unit: 'g', variance: 20 },
      { foodId: FOOD_REF.tomato, amount: 80, unit: 'g', variance: 20 },
      { foodId: FOOD_REF.onion, amount: 30, unit: 'g', variance: 10 },
      { foodId: FOOD_REF.lemon, amount: 15, unit: 'ml', variance: 5 },
      { foodId: FOOD_REF.oil, amount: 15, unit: 'ml', variance: 5 },
    ],
    steps: [
      { instructionEn: 'Season chicken with salt, pepper and lemon juice', instructionAr: 'يتبل الدجاج بالملح والفلفل وعصير الليمون' },
      { instructionEn: 'Grill chicken on a hot pan for 6-7 minutes each side', instructionAr: 'يشوى الدجاج على مقلاة ساخنة لمدة 6-7 دقائق لكل جانب' },
      { instructionEn: 'Let chicken rest then slice', instructionAr: 'يترك الدجاج ليرتاح ثم يقطع' },
      { instructionEn: 'Toss mixed greens with tomato, onion and dressing', instructionAr: 'تخلط الخضروات مع الطماطم والبصل والصلصة' },
      { instructionEn: 'Top salad with sliced chicken', instructionAr: 'توضع شرائح الدجاج فوق السلطة' },
    ],
  },
  {
    nameEn: 'Chicken Stir Fry', nameAr: 'دجاج مقلى سريع', category: 'dinner',
    baseCalories: 380, baseProtein: 32, baseCarbs: 20, baseFat: 18, baseFiber: 4,
    servings: 2, prepTime: 10, cookTime: 12,
    ingredientSlots: [
      { foodId: FOOD_REF.chicken, amount: 200, unit: 'g', variance: 50 },
      { foodId: FOOD_REF.rice, amount: 100, unit: 'g', variance: 25 },
      { foodId: FOOD_REF.onion, amount: 50, unit: 'g', variance: 20 },
      { foodId: FOOD_REF.carrot, amount: 50, unit: 'g', variance: 20 },
      { foodId: FOOD_REF.garlic, amount: 10, unit: 'g', variance: 5 },
      { foodId: FOOD_REF.oil, amount: 15, unit: 'ml', variance: 5 },
    ],
    steps: [
      { instructionEn: 'Cook rice according to package directions', instructionAr: 'يطبخ الرز حسب تعليمات العبوة' },
      { instructionEn: 'Cut chicken into bite-sized pieces', instructionAr: 'يقطع الدجاج إلى قطع صغيرة' },
      { instructionEn: 'Heat oil in a wok and stir-fry garlic and onion', instructionAr: 'يسخن الزيت في مقلاة ويقلب الثوم والبصل' },
      { instructionEn: 'Add chicken and cook until golden', instructionAr: 'يضاف الدجاج ويطهى حتى يصبح ذهبياً' },
      { instructionEn: 'Add carrots and cook for 3 minutes', instructionAr: 'تضاف الجزر وتطهى لمدة 3 دقائق' },
      { instructionEn: 'Serve over rice', instructionAr: 'يقدم فوق الرز' },
    ],
  },
  {
    nameEn: 'Pasta with Tomato Sauce', nameAr: 'معكرونة بصلصة الطماطم', category: 'dinner',
    baseCalories: 400, baseProtein: 14, baseCarbs: 55, baseFat: 12, baseFiber: 5,
    servings: 2, prepTime: 5, cookTime: 20,
    ingredientSlots: [
      { foodId: FOOD_REF.pasta, amount: 150, unit: 'g', variance: 25 },
      { foodId: FOOD_REF.tomato, amount: 150, unit: 'g', variance: 50 },
      { foodId: FOOD_REF.garlic, amount: 10, unit: 'g', variance: 5 },
      { foodId: FOOD_REF.onion, amount: 40, unit: 'g', variance: 10 },
      { foodId: FOOD_REF.oil, amount: 15, unit: 'ml', variance: 5 },
      { foodId: FOOD_REF.cheese, amount: 20, unit: 'g', variance: 10 },
    ],
    steps: [
      { instructionEn: 'Boil pasta in salted water until al dente', instructionAr: 'تسلق المعكرونة في ماء مملح حتى تصبح طرية' },
      { instructionEn: 'Sauté garlic and onion in olive oil', instructionAr: 'يقلب الثوم والبصل في زيت الزيتون' },
      { instructionEn: 'Add diced tomatoes and simmer for 15 minutes', instructionAr: 'تضاف الطماطم المقطعة وتترك على نار هادئة لمدة 15 دقيقة' },
      { instructionEn: 'Toss pasta with sauce and top with cheese', instructionAr: 'تخلط المعكرونة مع الصلصة وتزين بالجبن' },
    ],
  },
  {
    nameEn: 'Greek Yogurt Bowl', nameAr: 'وعاء زبادي يوناني', category: 'breakfast',
    baseCalories: 250, baseProtein: 18, baseCarbs: 30, baseFat: 6, baseFiber: 4,
    servings: 1, prepTime: 5, cookTime: 0,
    ingredientSlots: [
      { foodId: FOOD_REF.yogurt, amount: 200, unit: 'g', variance: 50 },
      { foodId: FOOD_REF.banana, amount: 100, unit: 'g', variance: 25 },
      { foodId: FOOD_REF.honey, amount: 15, unit: 'g', variance: 5 },
    ],
    steps: [
      { instructionEn: 'Pour yogurt into a bowl', instructionAr: 'يصب الزبادي في وعاء' },
      { instructionEn: 'Slice banana on top', instructionAr: 'تقطع شرائح الموز فوقه' },
      { instructionEn: 'Drizzle with honey and serve', instructionAr: 'يصب العسل فوقه ويقدم' },
    ],
  },
  {
    nameEn: 'Lentil Soup', nameAr: 'شوربة عدس', category: 'lunch',
    baseCalories: 180, baseProtein: 12, baseCarbs: 28, baseFat: 3, baseFiber: 8,
    servings: 4, prepTime: 10, cookTime: 35,
    ingredientSlots: [
      { foodId: 'food-0041', amount: 200, unit: 'g', variance: 50 },
      { foodId: FOOD_REF.onion, amount: 80, unit: 'g', variance: 20 },
      { foodId: FOOD_REF.carrot, amount: 60, unit: 'g', variance: 20 },
      { foodId: FOOD_REF.garlic, amount: 10, unit: 'g', variance: 5 },
      { foodId: FOOD_REF.oil, amount: 10, unit: 'ml', variance: 5 },
    ],
    steps: [
      { instructionEn: 'Rinse lentils and soak for 10 minutes', instructionAr: 'يغسل العدس وينقع لمدة 10 دقائق' },
      { instructionEn: 'Sauté onion, garlic and carrot in oil', instructionAr: 'يقلى البصل والثوم والجزر في الزيت' },
      { instructionEn: 'Add lentils, water and bring to a boil', instructionAr: 'يضاف العدس والماء ويغلى' },
      { instructionEn: 'Simmer for 30 minutes until lentils are tender', instructionAr: 'يترك على نار هادئة لمدة 30 دقيقة حتى ينضج العدس' },
      { instructionEn: 'Blend until smooth and season', instructionAr: 'يخلط حتى يصبح ناعماً ويتبل' },
    ],
  },
  {
    nameEn: 'Baked Salmon', nameAr: 'سلمون مشوي بالفرن', category: 'dinner',
    baseCalories: 420, baseProtein: 35, baseCarbs: 10, baseFat: 26, baseFiber: 2,
    servings: 2, prepTime: 10, cookTime: 20,
    ingredientSlots: [
      { foodId: 'food-0038', amount: 200, unit: 'g', variance: 50 },
      { foodId: FOOD_REF.lemon, amount: 15, unit: 'ml', variance: 5 },
      { foodId: FOOD_REF.garlic, amount: 5, unit: 'g', variance: 3 },
      { foodId: FOOD_REF.oil, amount: 10, unit: 'ml', variance: 5 },
    ],
    steps: [
      { instructionEn: 'Preheat oven to 200°C', instructionAr: 'يسخن الفرن إلى 200 درجة مئوية' },
      { instructionEn: 'Season salmon with garlic, lemon juice, salt and pepper', instructionAr: 'يتبل السلمون بالثوم وعصير الليمون والملح والفلفل' },
      { instructionEn: 'Place on baking tray and drizzle with oil', instructionAr: 'يوضع في صينية الخبز ويسكب فوقه الزيت' },
      { instructionEn: 'Bake for 18-20 minutes until flaky', instructionAr: 'يخبز لمدة 18-20 دقيقة حتى يتفتت' },
    ],
  },
  {
    nameEn: 'Chicken Kabsa', nameAr: 'كبسة دجاج', category: 'oriental',
    baseCalories: 520, baseProtein: 28, baseCarbs: 55, baseFat: 18, baseFiber: 3,
    servings: 4, prepTime: 20, cookTime: 50,
    ingredientSlots: [
      { foodId: FOOD_REF.chicken, amount: 500, unit: 'g', variance: 100 },
      { foodId: FOOD_REF.rice, amount: 300, unit: 'g', variance: 50 },
      { foodId: FOOD_REF.onion, amount: 100, unit: 'g', variance: 25 },
      { foodId: FOOD_REF.tomato, amount: 150, unit: 'g', variance: 50 },
      { foodId: FOOD_REF.garlic, amount: 15, unit: 'g', variance: 5 },
      { foodId: FOOD_REF.oil, amount: 30, unit: 'ml', variance: 10 },
    ],
    steps: [
      { instructionEn: 'Wash chicken and cut into 8 pieces', instructionAr: 'يغسل الدجاج ويقطع إلى 8 قطع' },
      { instructionEn: 'Sauté onion and garlic in oil until golden', instructionAr: 'يحمر البصل والثوم في الزيت' },
      { instructionEn: 'Add chicken and brown on all sides', instructionAr: 'يضاف الدجاج ويقلب حتى يحمر' },
      { instructionEn: 'Add tomatoes, spices and water, simmer for 30 minutes', instructionAr: 'تضاف الطماطم والبهارات والماء ويترك لمدة 30 دقيقة' },
      { instructionEn: 'Remove chicken, add rice to broth and cook', instructionAr: 'يرفع الدجاج ويضاف الرز للمرق ويطهى' },
      { instructionEn: 'Fry chicken briefly and serve over rice', instructionAr: 'يقلى الدجاج قليلاً ويقدم فوق الرز' },
    ],
  },
  {
    nameEn: 'Mansaf', nameAr: 'منسف', category: 'oriental',
    baseCalories: 620, baseProtein: 32, baseCarbs: 50, baseFat: 28, baseFiber: 2,
    servings: 6, prepTime: 30, cookTime: 120,
    ingredientSlots: [
      { foodId: 'food-0039', amount: 500, unit: 'g', variance: 100 },
      { foodId: FOOD_REF.rice, amount: 300, unit: 'g', variance: 50 },
      { foodId: FOOD_REF.yogurt, amount: 400, unit: 'g', variance: 100 },
      { foodId: FOOD_REF.onion, amount: 100, unit: 'g', variance: 25 },
      { foodId: FOOD_REF.oil, amount: 20, unit: 'ml', variance: 10 },
    ],
    steps: [
      { instructionEn: 'Boil lamb with spices until tender', instructionAr: 'يسلق اللحم مع البهارات حتى ينضج' },
      { instructionEn: 'Cook rice until fluffy', instructionAr: 'يطبخ الرز حتى يصبح هشاً' },
      { instructionEn: 'Prepare yogurt sauce from fermented dried yogurt', instructionAr: 'يحضر صلصة اللبن من الجميد' },
      { instructionEn: 'Layer bread, rice, meat and pour yogurt sauce on top', instructionAr: 'ترص طبقات من الخبز والرز واللحم ويصب اللبن فوقها' },
      { instructionEn: 'Garnish with almonds and pine nuts', instructionAr: 'يزين باللوز والصنوبر' },
    ],
  },
  {
    nameEn: 'Shakshuka', nameAr: 'شكشوكة', category: 'oriental',
    baseCalories: 260, baseProtein: 14, baseCarbs: 15, baseFat: 16, baseFiber: 4,
    servings: 2, prepTime: 5, cookTime: 20,
    ingredientSlots: [
      { foodId: FOOD_REF.egg, amount: 4, unit: 'pcs', variance: 1 },
      { foodId: FOOD_REF.tomato, amount: 200, unit: 'g', variance: 50 },
      { foodId: FOOD_REF.onion, amount: 60, unit: 'g', variance: 20 },
      { foodId: FOOD_REF.garlic, amount: 10, unit: 'g', variance: 5 },
      { foodId: FOOD_REF.oil, amount: 15, unit: 'ml', variance: 5 },
    ],
    steps: [
      { instructionEn: 'Sauté onion and garlic in olive oil', instructionAr: 'يقلب البصل والثوم في زيت الزيتون' },
      { instructionEn: 'Add diced tomatoes and cook until thickened', instructionAr: 'تضاف الطماطم المقطعة وتطهى حتى تثخن' },
      { instructionEn: 'Make wells in the sauce and crack eggs into them', instructionAr: 'تعمل حفر في الصلصة وتكسر البيض فيها' },
      { instructionEn: 'Cover and cook until eggs are set', instructionAr: 'يغطى ويطهى حتى يتماسك البيض' },
    ],
  },
  {
    nameEn: 'Grilled Chicken Wrap', nameAr: 'لفة دجاج مشوي', category: 'healthy',
    baseCalories: 310, baseProtein: 28, baseCarbs: 25, baseFat: 10, baseFiber: 4,
    servings: 1, prepTime: 10, cookTime: 12,
    ingredientSlots: [
      { foodId: FOOD_REF.chicken, amount: 120, unit: 'g', variance: 30 },
      { foodId: FOOD_REF.bread, amount: 60, unit: 'g', variance: 15 },
      { foodId: FOOD_REF.yogurt, amount: 30, unit: 'g', variance: 10 },
      { foodId: FOOD_REF.spinach, amount: 20, unit: 'g', variance: 10 },
      { foodId: FOOD_REF.tomato, amount: 40, unit: 'g', variance: 15 },
    ],
    steps: [
      { instructionEn: 'Season and grill chicken breast', instructionAr: 'يتبل صدر الدجاج ويشوى' },
      { instructionEn: 'Let rest and slice into strips', instructionAr: 'يترك ليرتاح ويقطع شرائح' },
      { instructionEn: 'Spread yogurt on tortilla', instructionAr: 'يفرد الزبادي على الخبز' },
      { instructionEn: 'Add chicken, spinach and tomato, roll tightly', instructionAr: 'يضاف الدجاج والسبانخ والطماطم ويلف بإحكام' },
    ],
  },
  {
    nameEn: 'Quinoa Buddha Bowl', nameAr: 'وعاء كينوا', category: 'healthy',
    baseCalories: 340, baseProtein: 16, baseCarbs: 40, baseFat: 12, baseFiber: 8,
    servings: 1, prepTime: 10, cookTime: 20,
    ingredientSlots: [
      { foodId: FOOD_REF.rice, amount: 80, unit: 'g', variance: 20 },
      { foodId: FOOD_REF.spinach, amount: 40, unit: 'g', variance: 15 },
      { foodId: FOOD_REF.carrot, amount: 40, unit: 'g', variance: 15 },
      { foodId: FOOD_REF.chicken, amount: 80, unit: 'g', variance: 20 },
      { foodId: FOOD_REF.lemon, amount: 10, unit: 'ml', variance: 5 },
      { foodId: FOOD_REF.oil, amount: 10, unit: 'ml', variance: 5 },
    ],
    steps: [
      { instructionEn: 'Cook quinoa according to package directions', instructionAr: 'تطبخ الكينوا حسب تعليمات العبوة' },
      { instructionEn: 'Grill chicken with spices', instructionAr: 'يشوى الدجاج بالبهارات' },
      { instructionEn: 'Steam carrots until tender', instructionAr: 'تطهى الجزر على البخار حتى تنضج' },
      { instructionEn: 'Assemble bowl with quinoa base, toppings and dressing', instructionAr: 'يرتب الوعاء بالكينوا والإضافات والصلصة' },
    ],
  },
  {
    nameEn: 'Chocolate Banana Smoothie', nameAr: 'ميلك شيك موز بالشوكولاتة', category: 'dessert',
    baseCalories: 350, baseProtein: 12, baseCarbs: 50, baseFat: 12, baseFiber: 4,
    servings: 1, prepTime: 5, cookTime: 0,
    ingredientSlots: [
      { foodId: FOOD_REF.banana, amount: 120, unit: 'g', variance: 30 },
      { foodId: FOOD_REF.milk, amount: 250, unit: 'ml', variance: 50 },
      { foodId: FOOD_REF.yogurt, amount: 60, unit: 'g', variance: 20 },
      { foodId: FOOD_REF.honey, amount: 15, unit: 'g', variance: 5 },
    ],
    steps: [
      { instructionEn: 'Slice banana and freeze briefly', instructionAr: 'تقطع شرائح الموز وتجمد قليلاً' },
      { instructionEn: 'Blend all ingredients until smooth', instructionAr: 'تخلط جميع المكونات حتى تصبح ناعمة' },
      { instructionEn: 'Pour into glass and serve immediately', instructionAr: 'يصب في كأس ويقدم فوراً' },
    ],
  },
  {
    nameEn: 'Rice Pudding', nameAr: 'أرز بلبن', category: 'dessert',
    baseCalories: 280, baseProtein: 8, baseCarbs: 45, baseFat: 8, baseFiber: 1,
    servings: 4, prepTime: 5, cookTime: 35,
    ingredientSlots: [
      { foodId: FOOD_REF.rice, amount: 100, unit: 'g', variance: 25 },
      { foodId: FOOD_REF.milk, amount: 500, unit: 'ml', variance: 100 },
      { foodId: FOOD_REF.honey, amount: 40, unit: 'g', variance: 10 },
    ],
    steps: [
      { instructionEn: 'Wash rice and drain', instructionAr: 'يغسل الرز ويصفى' },
      { instructionEn: 'Bring milk to a boil, add rice and simmer', instructionAr: 'يغلي الحليب ويضاف الرز ويترك على نار هادئة' },
      { instructionEn: 'Stir frequently for 25-30 minutes until thick', instructionAr: 'يقلب باستمرار لمدة 25-30 دقيقة حتى يثخن' },
      { instructionEn: 'Sweeten with honey and serve warm or cold', instructionAr: 'يحلى بالعسل ويقدم دافئاً أو بارداً' },
    ],
  },
];

const CUISINE_STYLES = ['Classic', 'Spicy', 'Herb', 'Garlic', 'Cheesy', 'Light', 'Protein', 'Mediterranean', 'Asian', 'Mexican', 'Indian', 'Italian', 'French', 'Turkish', 'Moroccan', 'Lebanese', 'Egyptian', 'Thai', 'Japanese', 'Chinese'];
const CUISINE_STYLES_AR = ['كلاسيكي', 'حار', 'بالأعشاب', 'بالثوم', 'بالجبن', 'خفيف', 'بروتين', 'متوسطي', 'آسيوي', 'مكسيكي', 'هندي', 'إيطالي', 'فرنسي', 'تركي', 'مغربي', 'لبناني', 'مصري', 'تايلندي', 'ياباني', 'صيني'];

const FLAVOUR_PROFILES = ['Herb', 'Smoky', 'Sweet', 'Tangy', 'Savory', 'Rich', 'Mild', 'Bold', 'Citrus', 'Earthy'];
const FLAVOUR_PROFILES_AR = ['أعشاب', 'مدخن', 'حلو', 'حامض', 'لذيذ', 'غني', 'معتدل', 'قوي', 'حمضيات', 'ترابي'];

const COOKING_METHODS = ['Grilled', 'Baked', 'Pan-Seared', 'Steamed', 'Roasted', 'Sauteed', 'Braised', 'Poached', 'Fried', 'Slow-Cooked'];
const COOKING_METHODS_AR = ['مشوي', 'مخبوز', 'مقلي سريع', 'مطهو بالبخار', 'محمر', 'مقلب', 'مطبوخ ببطء', 'مسلوق', 'مقلي', 'مطبوخ ببطء'];

const INGREDIENT_FOCUS = ['Cheese', 'Mushroom', 'Tomato', 'Spinach', 'Pepper', 'Onion', 'Lemon', 'Herb', 'Garlic', 'Nut'];
const INGREDIENT_FOCUS_AR = ['جبن', 'فطر', 'طماطم', 'سبانخ', 'فلفل', 'بصل', 'ليمون', 'أعشاب', 'ثوم', 'مكسرات'];

function generateRecipes(): RecipeSeed[] {
  const recipes: RecipeSeed[] = [];
  let idCounter = 0;

  for (const template of BASE_TEMPLATES) {
    const id = `recipe-${String(++idCounter).padStart(4, '0')}`;
    recipes.push({
      id,
      nameEn: template.nameEn,
      nameAr: template.nameAr,
      category: template.category,
      calories: template.baseCalories,
      protein: template.baseProtein,
      carbs: template.baseCarbs,
      fat: template.baseFat,
      fiber: template.baseFiber,
      servings: template.servings,
      prepTime: template.prepTime,
      cookTime: template.cookTime,
      ingredients: template.ingredientSlots.map(s => ({
        food_id: s.foodId,
        amount: s.amount,
        unit: s.unit,
      })),
      instructions: template.steps.map((s, i) => ({
        step: i + 1,
        instructionEn: s.instructionEn,
        instructionAr: s.instructionAr,
      })),
      image_url: '',
      thumbnail_url: '',
      thumbnail_small_url: '',
    });

    for (let s = 0; s < CUISINE_STYLES.length; s++) {
      for (let f = 0; f < FLAVOUR_PROFILES.length; f++) {
        for (let m = 0; m < COOKING_METHODS.length; m++) {
          const calVariance = Math.round((Math.random() - 0.5) * 80);
          const protVariance = Math.round((Math.random() - 0.5) * 8 * 10) / 10;
          const carbVariance = Math.round((Math.random() - 0.5) * 14 * 10) / 10;
          const fatVariance = Math.round((Math.random() - 0.5) * 7 * 10) / 10;
          const fiberVariance = Math.round((Math.random() - 0.5) * 3 * 10) / 10;

          recipes.push({
            id: `recipe-${String(++idCounter).padStart(4, '0')}`,
            nameEn: `${COOKING_METHODS[m]} ${CUISINE_STYLES[s]} ${template.nameEn}`,
            nameAr: `${template.nameAr} ${CUISINE_STYLES_AR[s]} ${COOKING_METHODS_AR[m]}`,
            category: template.category,
            calories: Math.max(50, template.baseCalories + calVariance),
            protein: Math.max(2, +(template.baseProtein + protVariance).toFixed(1)),
            carbs: Math.max(5, +(template.baseCarbs + carbVariance).toFixed(1)),
            fat: Math.max(1, +(template.baseFat + fatVariance).toFixed(1)),
            fiber: Math.max(0, +(template.baseFiber + fiberVariance).toFixed(1)),
            servings: template.servings,
            prepTime: Math.max(2, template.prepTime + Math.round((Math.random() - 0.5) * 10)),
            cookTime: Math.max(3, template.cookTime + Math.round((Math.random() - 0.5) * 15)),
            ingredients: template.ingredientSlots.map(sl => ({
              food_id: sl.foodId,
              amount: Math.max(1, Math.round((sl.amount + (Math.random() - 0.5) * sl.variance) * 10) / 10),
              unit: sl.unit,
            })),
            instructions: template.steps.map((st, i) => ({
              step: i + 1,
              instructionEn: st.instructionEn,
              instructionAr: st.instructionAr,
            })),
            image_url: '',
            thumbnail_url: '',
            thumbnail_small_url: '',
          });
        }
      }
    }
  }

  return recipes;
}

export const recipes: RecipeSeed[] = generateRecipes();
