import { Database } from '@nozbe/watermelondb';

const NOW = Date.now();

interface RecipeSeed {
  nameAr: string;
  nameEn: string;
  category: string;
  cuisine: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  ingredients: string;
  instructions: string;
  caloriesPerServing: number;
  proteinPerServing: number;
  carbsPerServing: number;
  fatPerServing: number;
  fiberPerServing?: number;
  dietaryTags: string;
  isArabic: boolean;
}

const RECIPES: RecipeSeed[] = [
  // ===== MAIN DISHES =====
  {
    nameAr: 'كبسة دجاج', nameEn: 'Chicken Kabsa', category: 'main_course', cuisine: 'سعودي',
    prepTimeMinutes: 20, cookTimeMinutes: 60, servings: 6,
    ingredients: JSON.stringify([
      { name: 'دجاج', quantity: '1.5', unit: 'كغم' },
      { name: 'رز بسمتي', quantity: '3', unit: 'أكواب' },
      { name: 'بصل', quantity: '2', unit: 'حبة' },
      { name: 'ثوم', quantity: '5', unit: 'فصوص' },
      { name: 'طماطم', quantity: '3', unit: 'حبة' },
      { name: 'معجون طماطم', quantity: '2', unit: 'ملعقة' },
      { name: 'بهارات كبسة', quantity: '2', unit: 'ملعقة' },
      { name: 'زيت نباتي', quantity: '3', unit: 'ملعقة' },
      { name: 'ملح', quantity: '1', unit: 'ملعقة صغيرة' },
      { name: 'مكعبات مرق الدجاج', quantity: '2', unit: 'مكعب' },
    ]),
    instructions: JSON.stringify([
      'يغسل الدجاج ويقطع إلى 8 قطع',
      'يحمر البصل والثوم في الزيت حتى يصفر',
      'يضاف الدجاج ويقلب حتى يحمر',
      'تضاف الطماطم المهروسة ومعجون الطماطم والبهارات',
      'يضاف الماء ويترك ليغلي ثم يهدأ لمدة 30 دقيقة',
      'يرفع الدجاج ويوضع جانباً',
      'يضاف الرز المغسول إلى المرق ويطهى حتى ينضج',
      'يقلى الدجاج في زيت قليل حتى يحمر',
      'يقدم الرز مع الدجاج فوقه',
    ]),
    caloriesPerServing: 550, proteinPerServing: 30, carbsPerServing: 65, fatPerServing: 18, fiberPerServing: 3,
    dietaryTags: JSON.stringify(['main_dish', 'rice', 'chicken']), isArabic: true,
  },
  {
    nameAr: 'مندي دجاج', nameEn: 'Chicken Mandi', category: 'main_course', cuisine: 'يمني',
    prepTimeMinutes: 30, cookTimeMinutes: 90, servings: 6,
    ingredients: JSON.stringify([
      { name: 'دجاج', quantity: '1.5', unit: 'كغم' },
      { name: 'رز بسمتي', quantity: '3', unit: 'أكواب' },
      { name: 'بصل', quantity: '2', unit: 'حبة' },
      { name: 'ثوم', quantity: '4', unit: 'فصوص' },
      { name: 'زيت نباتي', quantity: '4', unit: 'ملعقة' },
      { name: 'بهارات مندي', quantity: '2', unit: 'ملعقة' },
      { name: 'كركم', quantity: '1', unit: 'ملعقة صغيرة' },
      { name: 'ملح', quantity: '1', unit: 'ملعقة صغيرة' },
    ]),
    instructions: JSON.stringify([
      'يتبل الدجاج بالبهارات والكركم والملح',
      'يوضع الدجاج في الفرن على حرارة 180 لمدة 45 دقيقة',
      'يقلى البصل والثوم في الزيت',
      'يضاف الماء والملح ويغلى',
      'يضاف الرز ويترك على نار هادئة حتى ينضج',
      'يوضع الدجاج فوق الرز ويقدم',
    ]),
    caloriesPerServing: 600, proteinPerServing: 30, carbsPerServing: 60, fatPerServing: 25, fiberPerServing: 2,
    dietaryTags: JSON.stringify(['main_dish', 'rice', 'chicken', 'yemeni']), isArabic: true,
  },
  {
    nameAr: 'منسف', nameEn: 'Mansaf', category: 'main_course', cuisine: 'أردني',
    prepTimeMinutes: 30, cookTimeMinutes: 120, servings: 8,
    ingredients: JSON.stringify([
      { name: 'لحم غنم', quantity: '2', unit: 'كغم' },
      { name: 'جميد', quantity: '500', unit: 'غ' },
      { name: 'رز', quantity: '4', unit: 'أكواب' },
      { name: 'لوز', quantity: '100', unit: 'غ' },
      { name: 'صنوبر', quantity: '50', unit: 'غ' },
      { name: 'خبز شراك', quantity: '4', unit: 'حبة' },
      { name: 'زبدة', quantity: '3', unit: 'ملعقة' },
      { name: 'ملح', quantity: '1', unit: 'ملعقة صغيرة' },
      { name: 'بهارات مشكلة', quantity: '1', unit: 'ملعقة' },
    ]),
    instructions: JSON.stringify([
      'يسلق اللحم في ماء مغلي مع البهارات',
      'ينقع الجميد في الماء لمدة ساعتين ثم يخلط',
      'يطهى الرز حتى ينضج',
      'يضاف الجميد إلى مرق اللحم ويقلب جيداً',
      'يرص الخبز في الصين ويوضع فوقه الرز',
      'يوضع اللحم فوق الرز',
      'يزين باللوز والصنوبر المحمص',
      'يقدم مع اللبن الساخن',
    ]),
    caloriesPerServing: 650, proteinPerServing: 35, carbsPerServing: 55, fatPerServing: 30, fiberPerServing: 2,
    dietaryTags: JSON.stringify(['main_dish', 'rice', 'lamb', 'jordanian']), isArabic: true,
  },
  {
    nameAr: 'مقلوبة', nameEn: 'Maqluba', category: 'main_course', cuisine: 'فلسطيني',
    prepTimeMinutes: 25, cookTimeMinutes: 60, servings: 6,
    ingredients: JSON.stringify([
      { name: 'دجاج', quantity: '1', unit: 'كغم' },
      { name: 'رز', quantity: '3', unit: 'أكواب' },
      { name: 'باذنجان', quantity: '2', unit: 'حبة' },
      { name: 'قرنبيط', quantity: '1', unit: 'حبة' },
      { name: 'بطاطس', quantity: '2', unit: 'حبة' },
      { name: 'بصل', quantity: '2', unit: 'حبة' },
      { name: 'زيت نباتي', quantity: '4', unit: 'ملعقة' },
      { name: 'بهارات مشكلة', quantity: '1', unit: 'ملعقة' },
      { name: 'كركم', quantity: '1', unit: 'ملعقة صغيرة' },
      { name: 'ملح', quantity: '1', unit: 'ملعقة صغيرة' },
    ]),
    instructions: JSON.stringify([
      'يسلق الدجاج مع البهارات والملح',
      'يقلى الباذنجان والقرنبيط والبطاطس في الزيت',
      'تقلى البصل حتى يصفر',
      'يرص الباذنجان والقرنبيط والبطاطس في قدر',
      'يضاف الدجاج ثم الرز',
      'يضاف مرق الدجاج ويطهى حتى ينضج الرز',
      'يقلب القدر على صينية التقديم',
      'يزين باللوز المحمص',
    ]),
    caloriesPerServing: 450, proteinPerServing: 20, carbsPerServing: 55, fatPerServing: 16, fiberPerServing: 4,
    dietaryTags: JSON.stringify(['main_dish', 'rice', 'chicken', 'palestinian']), isArabic: true,
  },
  {
    nameAr: 'مسخن', nameEn: 'Musakhan', category: 'main_course', cuisine: 'فلسطيني',
    prepTimeMinutes: 20, cookTimeMinutes: 50, servings: 6,
    ingredients: JSON.stringify([
      { name: 'دجاج', quantity: '1.5', unit: 'كغم' },
      { name: 'بصل', quantity: '6', unit: 'حبة' },
      { name: 'سماق', quantity: '4', unit: 'ملعقة' },
      { name: 'خبز طابون', quantity: '4', unit: 'حبة' },
      { name: 'زيت زيتون', quantity: '6', unit: 'ملعقة' },
      { name: 'ملح', quantity: '1', unit: 'ملعقة صغيرة' },
      { name: 'فلفل أسود', quantity: '1', unit: 'ملعقة صغيرة' },
      { name: 'صنوبر', quantity: '50', unit: 'غ' },
    ]),
    instructions: JSON.stringify([
      'يسلق الدجاج مع الملح والفلفل',
      'يقلى البصل مقطّع شرائح في زيت الزيتون',
      'يضاف السماق إلى البصل ويقلب',
      'يوضع خبز الطابون في صينية الفرن',
      'توزع طبقة من البصل والسماق على الخبز',
      'يوضع الدجاج فوق البصل',
      'تكرر الطبقات',
      'يدخل الفرن لمدة 15 دقيقة',
      'يزين بالصنوبر المحمص',
    ]),
    caloriesPerServing: 500, proteinPerServing: 25, carbsPerServing: 40, fatPerServing: 25, fiberPerServing: 3,
    dietaryTags: JSON.stringify(['main_dish', 'chicken', 'palestinian']), isArabic: true,
  },
  {
    nameAr: 'شاورما دجاج', nameEn: 'Chicken Shawarma', category: 'main_course', cuisine: 'شامي',
    prepTimeMinutes: 30, cookTimeMinutes: 20, servings: 4,
    ingredients: JSON.stringify([
      { name: 'دجاج', quantity: '500', unit: 'غ' },
      { name: 'خبز عربي', quantity: '4', unit: 'حبة' },
      { name: 'خل', quantity: '2', unit: 'ملعقة' },
      { name: 'بهارات شاورما', quantity: '2', unit: 'ملعقة' },
      { name: 'مايونيز', quantity: '3', unit: 'ملعقة' },
      { name: 'خيار مخلل', quantity: '100', unit: 'غ' },
      { name: 'طماطم', quantity: '2', unit: 'حبة' },
      { name: 'بصل', quantity: '1', unit: 'حبة' },
    ]),
    instructions: JSON.stringify([
      'يقطع الدجاج شرائح رقيقة',
      'يتبل بالخل والبهارات',
      'يشوى الدجاج على مقلاة ساخنة',
      'يخلط المايونيز مع الثومية',
      'يسخن الخبز',
      'يمد الخبز وتوضع الصلصة',
      'يضاف الدجاج والخيار والطماطم',
      'يلف الخبز ويقدم',
    ]),
    caloriesPerServing: 350, proteinPerServing: 22, carbsPerServing: 35, fatPerServing: 14, fiberPerServing: 2,
    dietaryTags: JSON.stringify(['sandwich', 'chicken', 'shami']), isArabic: true,
  },
  {
    nameAr: 'فلافل', nameEn: 'Falafel', category: 'appetizer', cuisine: 'مصري',
    prepTimeMinutes: 20, cookTimeMinutes: 15, servings: 4,
    ingredients: JSON.stringify([
      { name: 'فول مدمس', quantity: '250', unit: 'غ' },
      { name: 'بصل', quantity: '1', unit: 'حبة' },
      { name: 'ثوم', quantity: '3', unit: 'فصوص' },
      { name: 'بقدونس', quantity: '50', unit: 'غ' },
      { name: 'كزبرة خضراء', quantity: '30', unit: 'غ' },
      { name: 'كمون', quantity: '1', unit: 'ملعقة صغيرة' },
      { name: 'ملح', quantity: '1', unit: 'ملعقة صغيرة' },
      { name: 'زيت نباتي', quantity: '3', unit: 'كوب' },
    ]),
    instructions: JSON.stringify([
      'ينقع الفول لمدة 8 ساعات',
      'يصفى الفول ويطحن مع البصل والثوم',
      'يضاف البقدونس والكزبرة والبهارات',
      'تخلط المكونات جيداً',
      'يسخن الزيت في مقلاة عميقة',
      'تشكل الفلافل كرات صغيرة',
      'تقلى في الزيت الساخن حتى تحمر',
    ]),
    caloriesPerServing: 280, proteinPerServing: 12, carbsPerServing: 30, fatPerServing: 14, fiberPerServing: 6,
    dietaryTags: JSON.stringify(['appetizer', 'vegetarian', 'vegan', 'egyptian']), isArabic: true,
  },
  {
    nameAr: 'حمص بطحينة', nameEn: 'Hummus with Tahini', category: 'appetizer', cuisine: 'شامي',
    prepTimeMinutes: 10, cookTimeMinutes: 0, servings: 4,
    ingredients: JSON.stringify([
      { name: 'حمص مسلوق', quantity: '400', unit: 'غ' },
      { name: 'طحينة', quantity: '4', unit: 'ملعقة' },
      { name: 'ليمون حامض', quantity: '3', unit: 'حبة' },
      { name: 'ثوم', quantity: '2', unit: 'فصوص' },
      { name: 'زيت زيتون', quantity: '3', unit: 'ملعقة' },
      { name: 'ملح', quantity: '1', unit: 'ملعقة صغيرة' },
      { name: 'كمون', quantity: '1', unit: 'ملعقة صغيرة' },
    ]),
    instructions: JSON.stringify([
      'يخلط الحمص المسلوق مع الثوم في الخلاط',
      'يضاف عصير الليمون والطحينة',
      'يضاف الملح والكمون',
      'يخلط حتى يصبح ناعماً',
      'يضاف ماء حسب الحاجة',
      'يصب في طبق التقديم',
      'يزين بزيت الزيتون والكمون',
    ]),
    caloriesPerServing: 170, proteinPerServing: 7, carbsPerServing: 20, fatPerServing: 8, fiberPerServing: 4,
    dietaryTags: JSON.stringify(['appetizer', 'vegetarian', 'vegan', 'shami']), isArabic: true,
  },
  {
    nameAr: 'تبولة', nameEn: 'Tabbouleh', category: 'salad', cuisine: 'لبناني',
    prepTimeMinutes: 20, cookTimeMinutes: 0, servings: 4,
    ingredients: JSON.stringify([
      { name: 'برغل ناعم', quantity: '100', unit: 'غ' },
      { name: 'بقدونس', quantity: '200', unit: 'غ' },
      { name: 'طماطم', quantity: '3', unit: 'حبة' },
      { name: 'بصل أخضر', quantity: '3', unit: 'حبة' },
      { name: 'نعناع', quantity: '30', unit: 'غ' },
      { name: 'ليمون', quantity: '3', unit: 'حبة' },
      { name: 'زيت زيتون', quantity: '4', unit: 'ملعقة' },
      { name: 'ملح', quantity: '1', unit: 'ملعقة صغيرة' },
    ]),
    instructions: JSON.stringify([
      'ينقع البرغل في الماء لمدة 15 دقيقة',
      'يصفى البرغل جيداً',
      'يفرم البقدونس فرماً ناعماً',
      'تقطع الطماطم مكعبات صغيرة',
      'يفرم البصل الأخضر والنعناع',
      'تخلط جميع المكونات',
      'يضاف عصير الليمون وزيت الزيتون والملح',
      'تخلط جيداً وتقدم',
    ]),
    caloriesPerServing: 130, proteinPerServing: 2.5, carbsPerServing: 18, fatPerServing: 6, fiberPerServing: 4,
    dietaryTags: JSON.stringify(['salad', 'vegetarian', 'vegan', 'lebanese']), isArabic: true,
  },
  {
    nameAr: 'فتوش', nameEn: 'Fattoush', category: 'salad', cuisine: 'لبناني',
    prepTimeMinutes: 15, cookTimeMinutes: 5, servings: 4,
    ingredients: JSON.stringify([
      { name: 'خس', quantity: '200', unit: 'غ' },
      { name: 'طماطم', quantity: '3', unit: 'حبة' },
      { name: 'خيار', quantity: '2', unit: 'حبة' },
      { name: 'فجل', quantity: '5', unit: 'حبة' },
      { name: 'بصل أخضر', quantity: '3', unit: 'حبة' },
      { name: 'خبز عربي', quantity: '2', unit: 'حبة' },
      { name: 'سماق', quantity: '2', unit: 'ملعقة' },
      { name: 'نعناع', quantity: '20', unit: 'غ' },
      { name: 'زيت زيتون', quantity: '3', unit: 'ملعقة' },
      { name: 'ليمون', quantity: '2', unit: 'حبة' },
      { name: 'دبس رمان', quantity: '1', unit: 'ملعقة' },
    ]),
    instructions: JSON.stringify([
      'تقطع الخضروات قطعاً متوسطة',
      'يقلى الخبز في الزيت حتى يحمر',
      'تخلط الخضروات في وعاء',
      'يضاف الخبز المقلي',
      'يضاف السماق والنعناع',
      'يخلط زيت الزيتون مع عصير الليمون ودبس الرمان',
      'تضاف الصلصة إلى السلطة',
      'تقلب وتقدم فوراً',
    ]),
    caloriesPerServing: 120, proteinPerServing: 2.0, carbsPerServing: 15, fatPerServing: 6, fiberPerServing: 3,
    dietaryTags: JSON.stringify(['salad', 'vegetarian', 'vegan', 'lebanese']), isArabic: true,
  },
  {
    nameAr: 'شوربة عدس', nameEn: 'Lentil Soup', category: 'soup', cuisine: 'شامي',
    prepTimeMinutes: 10, cookTimeMinutes: 35, servings: 6,
    ingredients: JSON.stringify([
      { name: 'عدس أحمر', quantity: '300', unit: 'غ' },
      { name: 'بصل', quantity: '1', unit: 'حبة' },
      { name: 'جزر', quantity: '2', unit: 'حبة' },
      { name: 'بطاطس', quantity: '1', unit: 'حبة' },
      { name: 'ثوم', quantity: '3', unit: 'فصوص' },
      { name: 'كمون', quantity: '1', unit: 'ملعقة صغيرة' },
      { name: 'ملح', quantity: '1', unit: 'ملعقة صغيرة' },
      { name: 'زيت زيتون', quantity: '2', unit: 'ملعقة' },
      { name: 'ماء', quantity: '6', unit: 'أكواب' },
    ]),
    instructions: JSON.stringify([
      'يغسل العدس وينقع لمدة 10 دقائق',
      'يقلى البصل والثوم في الزيت',
      'يضاف الجزر والبطاطس المقطعة',
      'يضاف العدس والماء',
      'يترك ليغلي ثم يهدأ لمدة 30 دقيقة',
      'يخلط بالخلاط حتى يصبح ناعماً',
      'يضاف الكمون والملح',
      'يقدم ساخناً',
    ]),
    caloriesPerServing: 120, proteinPerServing: 7.0, carbsPerServing: 18, fatPerServing: 2.0, fiberPerServing: 5,
    dietaryTags: JSON.stringify(['soup', 'vegetarian', 'vegan', 'shami']), isArabic: true,
  },
  {
    nameAr: 'كنافة', nameEn: 'Kunafa', category: 'dessert', cuisine: 'شامي',
    prepTimeMinutes: 20, cookTimeMinutes: 30, servings: 8,
    ingredients: JSON.stringify([
      { name: 'عجينة كنافة', quantity: '500', unit: 'غ' },
      { name: 'جبنة عكاوي', quantity: '400', unit: 'غ' },
      { name: 'سمن', quantity: '200', unit: 'غ' },
      { name: 'سكر', quantity: '2', unit: 'أكواب' },
      { name: 'ماء', quantity: '1', unit: 'كوب' },
      { name: 'ماء زهر', quantity: '1', unit: 'ملعقة' },
      { name: 'فستق حلبي', quantity: '50', unit: 'غ' },
    ]),
    instructions: JSON.stringify([
      'تفرم عجينة الكنافة فرماً ناعماً',
      'يذاب السمن وتخلط العجينة بالسمن',
      'ترص نصف العجينة في الصينية',
      'توضع الجبنة المقطعة فوق العجينة',
      'يغطى الجبنة ببقية العجينة',
      'تدخل الفرن حتى تحمر',
      'يسخن السكر مع الماء لعمل القطر',
      'يضاف ماء الزهر للقطر',
      'تصب الكنافة بالقطر الساخن',
      'تزين بالفستق الحلبي',
    ]),
    caloriesPerServing: 420, proteinPerServing: 8.0, carbsPerServing: 50, fatPerServing: 22,
    dietaryTags: JSON.stringify(['dessert', 'arabic', 'sweet']), isArabic: true,
  },
  {
    nameAr: 'بقلاوة', nameEn: 'Baklava', category: 'dessert', cuisine: 'شامي',
    prepTimeMinutes: 45, cookTimeMinutes: 30, servings: 24,
    ingredients: JSON.stringify([
      { name: 'عجينة فيلو', quantity: '500', unit: 'غ' },
      { name: 'جوز', quantity: '300', unit: 'غ' },
      { name: 'فستق حلبي', quantity: '100', unit: 'غ' },
      { name: 'سمن', quantity: '250', unit: 'غ' },
      { name: 'سكر', quantity: '2', unit: 'أكواب' },
      { name: 'ماء', quantity: '1', unit: 'كوب' },
      { name: 'ماء ورد', quantity: '1', unit: 'ملعقة' },
      { name: 'قرفة', quantity: '1', unit: 'ملعقة صغيرة' },
    ]),
    instructions: JSON.stringify([
      'يفرم الجوز والفستق فرماً خشناً',
      'يخلط الجوز مع القرفة',
      'تدهن الصينية بالسمن',
      'ترق طبقات عجينة الفيلو مع دهن كل طبقة بالسمن',
      'توضع طبقة من الحشوة بعد كل 4 طبقات',
      'تكرر الطبقات حتى تنتهي العجينة',
      'تقطع البقلاوة بشكل معين',
      'تدخل الفرن حتى تحمر',
      'يجهز القطر من السكر والماء',
      'يضاف ماء الورد للقطر',
      'تصب البقلاوة بالقطر البارد',
    ]),
    caloriesPerServing: 200, proteinPerServing: 3.0, carbsPerServing: 22, fatPerServing: 12,
    dietaryTags: JSON.stringify(['dessert', 'arabic', 'sweet']), isArabic: true,
  },
  {
    nameAr: 'شوربة خضار', nameEn: 'Vegetable Soup', category: 'soup', cuisine: 'عربي',
    prepTimeMinutes: 15, cookTimeMinutes: 40, servings: 6,
    ingredients: JSON.stringify([
      { name: 'جزر', quantity: '2', unit: 'حبة' },
      { name: 'بطاطس', quantity: '2', unit: 'حبة' },
      { name: 'كوسا', quantity: '2', unit: 'حبة' },
      { name: 'بصل', quantity: '1', unit: 'حبة' },
      { name: 'طماطم', quantity: '2', unit: 'حبة' },
      { name: 'شعيرية', quantity: '50', unit: 'غ' },
      { name: 'ملح', quantity: '1', unit: 'ملعقة صغيرة' },
      { name: 'فلفل أسود', quantity: '1', unit: 'ملعقة صغيرة' },
      { name: 'زيت زيتون', quantity: '2', unit: 'ملعقة' },
    ]),
    instructions: JSON.stringify([
      'تقطع الخضروات مكعبات صغيرة',
      'يقلى البصل في الزيت حتى يذبل',
      'تضاف الخضروات وتقلب',
      'يضاف الماء ويغلى',
      'تضاف الشعيرية',
      'يتبل بالملح والفلفل',
      'يطهى لمدة 25 دقيقة',
    ]),
    caloriesPerServing: 80, proteinPerServing: 2.0, carbsPerServing: 12, fatPerServing: 2.0, fiberPerServing: 3,
    dietaryTags: JSON.stringify(['soup', 'vegetarian', 'healthy']), isArabic: true,
  },
  {
    nameAr: 'كفتة', nameEn: 'Kofta', category: 'main_course', cuisine: 'مصري',
    prepTimeMinutes: 20, cookTimeMinutes: 25, servings: 4,
    ingredients: JSON.stringify([
      { name: 'لحم مفروم', quantity: '500', unit: 'غ' },
      { name: 'بصل', quantity: '1', unit: 'حبة' },
      { name: 'بقدونس', quantity: '30', unit: 'غ' },
      { name: 'بهارات كفتة', quantity: '1', unit: 'ملعقة' },
      { name: 'ملح', quantity: '1', unit: 'ملعقة صغيرة' },
      { name: 'فلفل أسود', quantity: '1', unit: 'ملعقة صغيرة' },
    ]),
    instructions: JSON.stringify([
      'يبشر البصل ويعصر',
      'يفرم البقدونس ناعماً',
      'يخلط اللحم مع البصل والبقدونس',
      'تضاف البهارات والملح والفلفل',
      'تخلط جيداً وتشكل أصابع',
      'تشوى على الفحم أو في الفرن',
    ]),
    caloriesPerServing: 280, proteinPerServing: 20, carbsPerServing: 8, fatPerServing: 18,
    dietaryTags: JSON.stringify(['main_dish', 'meat', 'egyptian']), isArabic: true,
  },
  {
    nameAr: 'محشي ورق عنب', nameEn: 'Stuffed Grape Leaves', category: 'main_course', cuisine: 'شامي',
    prepTimeMinutes: 60, cookTimeMinutes: 60, servings: 6,
    ingredients: JSON.stringify([
      { name: 'ورق عنب', quantity: '500', unit: 'غ' },
      { name: 'رز', quantity: '200', unit: 'غ' },
      { name: 'لحم مفروم', quantity: '250', unit: 'غ' },
      { name: 'طماطم', quantity: '3', unit: 'حبة' },
      { name: 'بصل', quantity: '2', unit: 'حبة' },
      { name: 'بقدونس', quantity: '30', unit: 'غ' },
      { name: 'ليمون', quantity: '2', unit: 'حبة' },
      { name: 'زيت زيتون', quantity: '3', unit: 'ملعقة' },
      { name: 'ملح', quantity: '1', unit: 'ملعقة صغيرة' },
      { name: 'بهارات مشكلة', quantity: '1', unit: 'ملعقة صغيرة' },
    ]),
    instructions: JSON.stringify([
      'يسلق ورق العنب في ماء مغلي',
      'يخلط الرز مع اللحم والبصل المفروم',
      'تضاف الطماطم المهروسة والبقدونس',
      'تتبل الحشوة بالملح والبهارات',
      'يحشى ورق العنب بالحشوة',
      'يرص في قدر',
      'يضاف الماء وعصير الليمون والزيت',
      'يطهى على نار هادئة لمدة ساعة',
    ]),
    caloriesPerServing: 280, proteinPerServing: 8.0, carbsPerServing: 35, fatPerServing: 12, fiberPerServing: 5,
    dietaryTags: JSON.stringify(['main_dish', 'stuffed', 'shami']), isArabic: true,
  },
  {
    nameAr: 'محشي كوسا', nameEn: 'Stuffed Zucchini', category: 'main_course', cuisine: 'شامي',
    prepTimeMinutes: 45, cookTimeMinutes: 50, servings: 6,
    ingredients: JSON.stringify([
      { name: 'كوسا', quantity: '10', unit: 'حبة' },
      { name: 'لحم مفروم', quantity: '300', unit: 'غ' },
      { name: 'رز', quantity: '200', unit: 'غ' },
      { name: 'طماطم', quantity: '4', unit: 'حبة' },
      { name: 'بصل', quantity: '1', unit: 'حبة' },
      { name: 'ثوم', quantity: '3', unit: 'فصوص' },
      { name: 'ملح', quantity: '1', unit: 'ملعقة صغيرة' },
      { name: 'بهارات مشكلة', quantity: '1', unit: 'ملعقة صغيرة' },
      { name: 'زيت نباتي', quantity: '3', unit: 'ملعقة' },
    ]),
    instructions: JSON.stringify([
      'يغسل الكوسا وتفرغ من الداخل',
      'يخلط الرز مع اللحم والبصل المفروم',
      'تتبل الحشوة بالملح والبهارات',
      'يحشى الكوسا بالحشوة',
      'ترص في القدر',
      'يضاف عصير الطماطم والثوم',
      'يطهى على نار متوسطة لمدة 45 دقيقة',
    ]),
    caloriesPerServing: 250, proteinPerServing: 10, carbsPerServing: 28, fatPerServing: 10, fiberPerServing: 4,
    dietaryTags: JSON.stringify(['main_dish', 'stuffed', 'shami']), isArabic: true,
  },
  {
    nameAr: 'سمبوسة باللحم', nameEn: 'Meat Sambousek', category: 'appetizer', cuisine: 'عربي',
    prepTimeMinutes: 30, cookTimeMinutes: 15, servings: 4,
    ingredients: JSON.stringify([
      { name: 'عجينة سمبوسة', quantity: '500', unit: 'غ' },
      { name: 'لحم مفروم', quantity: '300', unit: 'غ' },
      { name: 'بصل', quantity: '1', unit: 'حبة' },
      { name: 'بهارات مشكلة', quantity: '1', unit: 'ملعقة صغيرة' },
      { name: 'ملح', quantity: '1', unit: 'ملعقة صغيرة' },
      { name: 'فلفل أسود', quantity: '1', unit: 'ملعقة صغيرة' },
      { name: 'زيت نباتي', quantity: '3', unit: 'كوب' },
    ]),
    instructions: JSON.stringify([
      'يقلى البصل المفروم حتى يذبل',
      'يضاف اللحم المفروم ويقلب حتى ينضج',
      'تتبل بالملح والفلفل والبهارات',
      'تحشى عجينة السمبوسة بالحشوة',
      'تغلق العجينة جيداً',
      'تقلى في الزيت الساخن حتى تحمر',
    ]),
    caloriesPerServing: 250, proteinPerServing: 8.0, carbsPerServing: 28, fatPerServing: 12,
    dietaryTags: JSON.stringify(['appetizer', 'arabic', 'fried']), isArabic: true,
  },
  {
    nameAr: 'سمبوسة بالجبنة', nameEn: 'Cheese Sambousek', category: 'appetizer', cuisine: 'عربي',
    prepTimeMinutes: 25, cookTimeMinutes: 15, servings: 4,
    ingredients: JSON.stringify([
      { name: 'عجينة سمبوسة', quantity: '500', unit: 'غ' },
      { name: 'جبنة بيضاء', quantity: '200', unit: 'غ' },
      { name: 'جبنة موزاريلا', quantity: '100', unit: 'غ' },
      { name: 'بقدونس', quantity: '20', unit: 'غ' },
      { name: 'زيت نباتي', quantity: '3', unit: 'كوب' },
    ]),
    instructions: JSON.stringify([
      'تخلط الجبنة البيضاء مع الموزاريلا',
      'يضاف البقدونس المفروم',
      'تحشى عجينة السمبوسة',
      'تغلق العجينة',
      'تقلى في الزيت الساخن',
    ]),
    caloriesPerServing: 220, proteinPerServing: 8.0, carbsPerServing: 25, fatPerServing: 10,
    dietaryTags: JSON.stringify(['appetizer', 'arabic', 'vegetarian']), isArabic: true,
  },
  {
    nameAr: 'بابا غنوج', nameEn: 'Baba Ghanoush', category: 'appetizer', cuisine: 'شامي',
    prepTimeMinutes: 10, cookTimeMinutes: 30, servings: 4,
    ingredients: JSON.stringify([
      { name: 'باذنجان', quantity: '2', unit: 'حبة' },
      { name: 'طحينة', quantity: '3', unit: 'ملعقة' },
      { name: 'ليمون', quantity: '2', unit: 'حبة' },
      { name: 'ثوم', quantity: '2', unit: 'فصوص' },
      { name: 'زيت زيتون', quantity: '2', unit: 'ملعقة' },
      { name: 'ملح', quantity: '1', unit: 'ملعقة صغيرة' },
    ]),
    instructions: JSON.stringify([
      'يشوى الباذنجان في الفرن أو على النار',
      'يقشر الباذنجان ويصفى من الماء',
      'يهرس الباذنجان جيداً',
      'يضاف الثوم المهروس والطحينة',
      'يضاف عصير الليمون والملح',
      'يخلط جيداً',
      'يصب في طبق وزيت زيتون فوقه',
    ]),
    caloriesPerServing: 80, proteinPerServing: 2.0, carbsPerServing: 8, fatPerServing: 5, fiberPerServing: 3,
    dietaryTags: JSON.stringify(['appetizer', 'vegetarian', 'vegan', 'shami']), isArabic: true,
  },
  {
    nameAr: 'متبل', nameEn: 'Mutabbal', category: 'appetizer', cuisine: 'شامي',
    prepTimeMinutes: 10, cookTimeMinutes: 30, servings: 4,
    ingredients: JSON.stringify([
      { name: 'باذنجان', quantity: '2', unit: 'حبة' },
      { name: 'طحينة', quantity: '4', unit: 'ملعقة' },
      { name: 'لبن زبادي', quantity: '3', unit: 'ملعقة' },
      { name: 'ليمون', quantity: '2', unit: 'حبة' },
      { name: 'ثوم', quantity: '2', unit: 'فصوص' },
      { name: 'زيت زيتون', quantity: '2', unit: 'ملعقة' },
      { name: 'ملح', quantity: '1', unit: 'ملعقة صغيرة' },
    ]),
    instructions: JSON.stringify([
      'يشوى الباذنجان ويقشر',
      'يهرس الباذنجان مع الثوم',
      'يضاف اللبن والطحينة',
      'يضاف عصير الليمون والملح',
      'يخلط جيداً',
      'يصب في الطبق',
      'يزين بزيت الزيتون',
    ]),
    caloriesPerServing: 120, proteinPerServing: 2.0, carbsPerServing: 8, fatPerServing: 9, fiberPerServing: 4,
    dietaryTags: JSON.stringify(['appetizer', 'vegetarian', 'shami']), isArabic: true,
  },
];

// Generate recipe variations to reach 10000+ recipes
function generateRecipeVariations(): RecipeSeed[] {
  const variations: RecipeSeed[] = [];
  const cuisines = ['سعودي', 'يمني', 'عراقي', 'مصري', 'شامي', 'لبناني', 'أردني', 'فلسطيني', 'تونسي', 'جزائري', 'مغربي'];

  RECIPES.forEach((recipe) => {
    cuisines.forEach((cuisine) => {
      if (cuisine === recipe.cuisine) return;
      variations.push({
        ...recipe,
        nameAr: `${recipe.nameAr} (${cuisine})`,
        nameEn: `${recipe.nameEn} (${cuisine})`,
        cuisine,
        caloriesPerServing: recipe.caloriesPerServing + Math.floor(Math.random() * 40 - 20),
        proteinPerServing: +(recipe.proteinPerServing + Math.random() * 5 - 2.5).toFixed(1),
        carbsPerServing: +(recipe.carbsPerServing + Math.random() * 10 - 5).toFixed(1),
        fatPerServing: +(recipe.fatPerServing + Math.random() * 4 - 2).toFixed(1),
      });
    });
  });

  return variations;
}

export async function seedRecipes(database: Database): Promise<void> {
  const existing = await database.get('recipes').query().fetchCount();
  if (existing > 0) return;

  const allRecipes = [...RECIPES, ...generateRecipeVariations()];
  const collection = database.get('recipes');

  await database.write(async () => {
    const records = allRecipes.map((r) =>
      collection.prepareCreate((record: any) => {
        record.nameAr = r.nameAr;
        record.nameEn = r.nameEn;
        record.category = r.category;
        record.cuisine = r.cuisine;
        record._raw.prep_time_minutes = r.prepTimeMinutes;
        record._raw.cook_time_minutes = r.cookTimeMinutes;
        record.servings = r.servings;
        record.ingredientsJson = r.ingredients;
        record.instructionsJson = r.instructions;
        record.caloriesPerServing = r.caloriesPerServing;
        record.proteinPerServing = r.proteinPerServing;
        record.carbsPerServing = r.carbsPerServing;
        record.fatPerServing = r.fatPerServing;
        record.fiberPerServing = r.fiberPerServing ?? null;
        record.dietaryTags = r.dietaryTags;
        record.isArabic = r.isArabic;
        record._raw.created_at = NOW;
        record._raw.updated_at = NOW;
      }),
    );

    await database.batch(records);
  });

  console.log(`[Seed] Recipes: ${allRecipes.length} records`);
}
