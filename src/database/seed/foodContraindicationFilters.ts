import { FoodContraindicationFilterSeed } from './seedData';

interface FilterRule {
  foodCategory: string;
  condition: string;
  conditionAr: string;
  contraindicationType: string;
  contraindicationTypeAr: string;
  severity: 'low' | 'medium' | 'high';
  severityAr: string;
  message: string;
  messageAr: string;
}

const FILTER_RULES: FilterRule[] = [
  { foodCategory: 'sugars', condition: 'diabetes_mellitus', conditionAr: 'داء السكري', contraindicationType: 'avoid', contraindicationTypeAr: 'تجنب', severity: 'high', severityAr: 'عالية', message: 'High sugar foods cause rapid blood glucose spikes', messageAr: 'الأطعمة عالية السكر تسبب ارتفاعات سريعة في سكر الدم' },
  { foodCategory: 'sugars', condition: 'prediabetes', conditionAr: 'مقدمات السكري', contraindicationType: 'limit', contraindicationTypeAr: 'حدد', severity: 'medium', severityAr: 'متوسطة', message: 'Limit sugar intake to prevent progression to diabetes', messageAr: 'حد من تناول السكر لمنع التقدم إلى السكري' },
  { foodCategory: 'sugars', condition: 'obesity', conditionAr: 'سمنة', contraindicationType: 'limit', contraindicationTypeAr: 'حدد', severity: 'high', severityAr: 'عالية', message: 'High calorie density contributes to weight gain', messageAr: 'الكثافة السعرية العالية تساهم في زيادة الوزن' },
  { foodCategory: 'sugars', condition: 'hypertriglyceridemia', conditionAr: 'فرط الدهون الثلاثية', contraindicationType: 'avoid', contraindicationTypeAr: 'تجنب', severity: 'high', severityAr: 'عالية', message: 'Sugar intake raises triglyceride levels significantly', messageAr: 'تناول السكر يرفع مستويات الدهون الثلاثية بشكل كبير' },
  { foodCategory: 'sugars', condition: 'metabolic_syndrome', conditionAr: 'متلازمة الأيض', contraindicationType: 'limit', contraindicationTypeAr: 'حدد', severity: 'high', severityAr: 'عالية', message: 'Sugar contributes to insulin resistance and metabolic dysfunction', messageAr: 'يساهم السكر في مقاومة الأنسولين والخلل الأيضي' },
  { foodCategory: 'sugars', condition: 'fatty_liver', conditionAr: 'دهون الكبد', contraindicationType: 'avoid', contraindicationTypeAr: 'تجنب', severity: 'high', severityAr: 'عالية', message: 'Fructose directly contributes to hepatic steatosis', messageAr: 'الفركتوز يساهم مباشرة في تدهن الكبد' },
  { foodCategory: 'sugars', condition: 'cancer', conditionAr: 'سرطان', contraindicationType: 'limit', contraindicationTypeAr: 'حدد', severity: 'medium', severityAr: 'متوسطة', message: 'Limit added sugars; focus on nutrient-dense foods', messageAr: 'حد من السكريات المضافة وركز على الأطعمة الغنية بالمغذيات' },
  { foodCategory: 'sugars', condition: 'geriatric_malnutrition', conditionAr: 'سوء تغذية مسنين', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'low', severityAr: 'منخفضة', message: 'Small amounts may help with energy intake if underweight', messageAr: 'كميات صغيرة قد تساعد في تناول الطاقة إذا كان الوزن منخفضاً' },
  { foodCategory: 'sugars', condition: 'dental_caries', conditionAr: 'تسوس الأسنان', contraindicationType: 'avoid', contraindicationTypeAr: 'تجنب', severity: 'medium', severityAr: 'متوسطة', message: 'Sugar promotes tooth decay', messageAr: 'السكر يعزز تسوس الأسنان' },
  { foodCategory: 'grains', condition: 'diabetes_mellitus', conditionAr: 'داء السكري', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'medium', severityAr: 'متوسطة', message: 'Choose whole grains over refined; monitor portion sizes', messageAr: 'اختر الحبوب الكاملة بدلاً من المكررة وراقب أحجام الحصص' },
  { foodCategory: 'grains', condition: 'gluten_allergy', conditionAr: 'حساسية الغلوتين', contraindicationType: 'avoid', contraindicationTypeAr: 'تجنب', severity: 'high', severityAr: 'عالية', message: 'Wheat, barley and rye contain gluten', messageAr: 'القمح والشعير والجاودار يحتوي على الغلوتين' },
  { foodCategory: 'grains', condition: 'irritable_bowel_syndrome', conditionAr: 'متلازمة القولون العصبي', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'medium', severityAr: 'متوسطة', message: 'Some grains are high FODMAP; individual tolerance varies', messageAr: 'بعض الحبوب عالية FODMAP تختلف التحمل الفردي' },
  { foodCategory: 'grains', condition: 'obesity', conditionAr: 'سمنة', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'medium', severityAr: 'متوسطة', message: 'Watch portion sizes; choose whole grains for satiety', messageAr: 'راقب أحجام الحصص واختر الحبوب الكاملة للشبع' },
  { foodCategory: 'grains', condition: 'chronic_kidney_disease', conditionAr: 'مرض الكلى المزمن', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'low', severityAr: 'منخفضة', message: 'Some whole grains are high in potassium and phosphorus', messageAr: 'بعض الحبوب الكاملة عالية في البوتاسيوم والفوسفور' },
  { foodCategory: 'grains', condition: 'geriatric_malnutrition', conditionAr: 'سوء تغذية مسنين', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'low', severityAr: 'منخفضة', message: 'Fortified grains can provide B vitamins and iron', messageAr: 'الحبوب المدعمة يمكن أن توفر فيتامينات ب والحديد' },
  { foodCategory: 'vegetables', condition: 'chronic_kidney_disease', conditionAr: 'مرض الكلى المزمن', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'medium', severityAr: 'متوسطة', message: 'Limit high-potassium vegetables (potatoes, tomatoes, spinach)', messageAr: 'حد من الخضروات عالية البوتاسيوم (البطاطس والطماطم والسبانخ)' },
  { foodCategory: 'vegetables', condition: 'diabetes_mellitus', conditionAr: 'داء السكري', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'low', severityAr: 'منخفضة', message: 'Non-starchy vegetables are generally recommended', messageAr: 'الخضروات غير النشوية موصى بها عموماً' },
  { foodCategory: 'vegetables', condition: 'irritable_bowel_syndrome', conditionAr: 'متلازمة القولون العصبي', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'medium', severityAr: 'متوسطة', message: 'Some vegetables are high FODMAP; individual tolerance varies', messageAr: 'بعض الخضروات عالية FODMAP تختلف التحمل الفردي' },
  { foodCategory: 'vegetables', condition: 'diverticulitis', conditionAr: 'التهاب الرتوج', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'medium', severityAr: 'متوسطة', message: 'Avoid high-fibre vegetables during acute flare', messageAr: 'تجنب الخضروات عالية الألياف أثناء النوبة الحادة' },
  { foodCategory: 'vegetables', condition: 'warfarin_therapy', conditionAr: 'علاج الوارفارين', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'medium', severityAr: 'متوسطة', message: 'Vitamin K-rich vegetables affect INR; maintain consistent intake', messageAr: 'الخضروات الغنية بفيتامين ك تؤثر على INR' },
  { foodCategory: 'vegetables', condition: 'hypothyroidism', conditionAr: 'قصور الغدة الدرقية', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'low', severityAr: 'منخفضة', message: 'Cruciferous vegetables may affect thyroid function when raw in large amounts', messageAr: 'الخضروات الصليبية قد تؤثر على وظيفة الغدة الدرقية' },
  { foodCategory: 'vegetables', condition: 'gout', conditionAr: 'النقرس', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'low', severityAr: 'منخفضة', message: 'Most vegetables are low in purines and recommended', messageAr: 'معظم الخضروات منخفضة في البيورين وموصى بها' },
  { foodCategory: 'fruits', condition: 'diabetes_mellitus', conditionAr: 'داء السكري', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'medium', severityAr: 'متوسطة', message: 'Monitor portions; choose whole fruits over juices', messageAr: 'راقب الكميات واختر الفواكه الكاملة بدلاً من العصائر' },
  { foodCategory: 'fruits', condition: 'chronic_kidney_disease', conditionAr: 'مرض الكلى المزمن', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'high', severityAr: 'عالية', message: 'High-potassium fruits (banana, orange, dates) should be limited', messageAr: 'الفواكه عالية البوتاسيوم (الموز والبرتقال والتمر) يجب الحد منها' },
  { foodCategory: 'fruits', condition: 'obesity', conditionAr: 'سمنة', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'low', severityAr: 'منخفضة', message: 'Fruits are nutrient-dense but watch portions for calorie control', messageAr: 'الفواكه غنية بالمغذيات ولكن راقب الكميات للتحكم في السعرات' },
  { foodCategory: 'fruits', condition: 'hypertriglyceridemia', conditionAr: 'فرط الدهون الثلاثية', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'medium', severityAr: 'متوسطة', message: 'Limit high-sugar fruits; choose berries and citrus', messageAr: 'حد من الفواكه عالية السكر واختر التوت والحمضيات' },
  { foodCategory: 'fruits', condition: 'gout', conditionAr: 'النقرس', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'medium', severityAr: 'متوسطة', message: 'Limit high-fructose fruits which may increase uric acid', messageAr: 'حد من الفواكه عالية الفركتوز التي قد تزيد حمض البول' },
  { foodCategory: 'fruits', condition: 'irritable_bowel_syndrome', conditionAr: 'متلازمة القولون العصبي', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'medium', severityAr: 'متوسطة', message: 'Some fruits are high FODMAP; individual tolerance varies', messageAr: 'بعض الفواكه عالية FODMAP تختلف التحمل الفردي' },
  { foodCategory: 'fruits', condition: 'geriatric_malnutrition', conditionAr: 'سوء تغذية مسنين', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'low', severityAr: 'منخفضة', message: 'Fruits provide vitamins and fibre; encourage varied intake', messageAr: 'الفواكه توفر الفيتامينات والألياف' },
  { foodCategory: 'proteins', condition: 'chronic_kidney_disease', conditionAr: 'مرض الكلى المزمن', contraindicationType: 'limit', contraindicationTypeAr: 'حدد', severity: 'high', severityAr: 'عالية', message: 'Protein restriction 0.6-0.8 g/kg/day for non-dialysis CKD', messageAr: 'تقييد البروتين 0.6-0.8 غرام/كغم/يوم لمرضى الكلى غير الخاضعين للغسيل' },
  { foodCategory: 'proteins', condition: 'gout', conditionAr: 'النقرس', contraindicationType: 'limit', contraindicationTypeAr: 'حدد', severity: 'high', severityAr: 'عالية', message: 'Limit purine-rich proteins: organ meats, shellfish, red meat', messageAr: 'حد من البروتينات الغنية بالبيورين: اللحوم العضوية والمحار واللحوم الحمراء' },
  { foodCategory: 'proteins', condition: 'hypercalcemia', conditionAr: 'فرط كالسيوم الدم', contraindicationType: 'limit', contraindicationTypeAr: 'حدد', severity: 'medium', severityAr: 'متوسطة', message: 'Some protein sources are high in calcium', messageAr: 'بعض مصادر البروتين عالية في الكالسيوم' },
  { foodCategory: 'proteins', condition: 'obesity', conditionAr: 'سمنة', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'low', severityAr: 'منخفضة', message: 'Choose lean proteins; avoid fried and processed meats', messageAr: 'اختر البروتينات الخالية من الدهون وتجنب اللحوم المقلية والمصنعة' },
  { foodCategory: 'proteins', condition: 'iron_deficiency', conditionAr: 'نقص الحديد', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'low', severityAr: 'منخفضة', message: 'Include heme iron sources: red meat, poultry, fish', messageAr: 'تضمن مصادر الحديد الهيمي: اللحوم الحمراء والدواجن والأسماك' },
  { foodCategory: 'proteins', condition: 'liver_cirrhosis', conditionAr: 'تليف الكبد', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'low', severityAr: 'منخفضة', message: 'Protein 1.2-1.5 g/kg/day even in encephalopathy', messageAr: 'بروتين 1.2-1.5 غرام/كغم/يوم حتى في الاعتلال الدماغي' },
  { foodCategory: 'proteins', condition: 'post_surgery', conditionAr: 'بعد الجراحة', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'low', severityAr: 'منخفضة', message: 'High protein needed for wound healing and recovery', messageAr: 'بروتين عالٍ مطلوب لالتئام الجروح والتعافي' },
  { foodCategory: 'dairy', condition: 'lactose_intolerance', conditionAr: 'عدم تحمل اللاكتوز', contraindicationType: 'avoid', contraindicationTypeAr: 'تجنب', severity: 'high', severityAr: 'عالية', message: 'Contains lactose; use lactose-free alternatives', messageAr: 'يحتوي على اللاكتوز استخدم بدائل خالية من اللاكتوز' },
  { foodCategory: 'dairy', condition: 'hypercalcemia', conditionAr: 'فرط كالسيوم الدم', contraindicationType: 'limit', contraindicationTypeAr: 'حدد', severity: 'high', severityAr: 'عالية', message: 'Dairy products are high in calcium', messageAr: 'منتجات الألبان عالية في الكالسيوم' },
  { foodCategory: 'dairy', condition: 'hyperlipidemia', conditionAr: 'فرط شحميات الدم', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'medium', severityAr: 'متوسطة', message: 'Choose low-fat or fat-free dairy options', messageAr: 'اختر خيارات الألبان قليلة الدسم أو الخالية من الدسم' },
  { foodCategory: 'dairy', condition: 'chronic_kidney_disease', conditionAr: 'مرض الكلى المزمن', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'high', severityAr: 'عالية', message: 'Dairy is high in potassium and phosphorus', messageAr: 'الألبان عالية في البوتاسيوم والفوسفور' },
  { foodCategory: 'dairy', condition: 'milk_allergy', conditionAr: 'حساسية الحليب', contraindicationType: 'avoid', contraindicationTypeAr: 'تجنب', severity: 'high', severityAr: 'عالية', message: 'Cow milk protein allergy requires strict avoidance', messageAr: 'حساسية بروتين حليب البقر تتطلب تجنباً صارماً' },
  { foodCategory: 'dairy', condition: 'obesity', conditionAr: 'سمنة', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'low', severityAr: 'منخفضة', message: 'Choose low-fat dairy for weight management', messageAr: 'اختر الألبان قليلة الدسم لإدارة الوزن' },
  { foodCategory: 'dairy', condition: 'geriatric_malnutrition', conditionAr: 'سوء تغذية مسنين', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'low', severityAr: 'منخفضة', message: 'Dairy provides calcium, protein and vitamin D', messageAr: 'الألبان توفر الكالسيوم والبروتين وفيتامين د' },
  { foodCategory: 'fats', condition: 'hyperlipidemia', conditionAr: 'فرط شحميات الدم', contraindicationType: 'limit', contraindicationTypeAr: 'حدد', severity: 'high', severityAr: 'عالية', message: 'Limit saturated and trans fats; choose unsaturated oils', messageAr: 'حد من الدهون المشبعة والمتحولة واختر الزيوت غير المشبعة' },
  { foodCategory: 'fats', condition: 'obesity', conditionAr: 'سمنة', contraindicationType: 'limit', contraindicationTypeAr: 'حدد', severity: 'high', severityAr: 'عالية', message: 'Fats are calorie-dense; watch portion sizes', messageAr: 'الدهون كثيفة السعرات راقب أحجام الحصص' },
  { foodCategory: 'fats', condition: 'pancreatic_insufficiency', conditionAr: 'قصور البنكرياس', contraindicationType: 'limit', contraindicationTypeAr: 'حدد', severity: 'high', severityAr: 'عالية', message: 'Fat malabsorption requires MCT oil and enzyme replacement', messageAr: 'سوء امتصاص الدهون يتطلب زيت MCT وتعويض الإنزيمات' },
  { foodCategory: 'fats', condition: 'gallbladder_disease', conditionAr: 'مرض المرارة', contraindicationType: 'limit', contraindicationTypeAr: 'حدد', severity: 'high', severityAr: 'عالية', message: 'High-fat meals may trigger gallbladder symptoms', messageAr: 'الوجبات عالية الدهون قد تسبب أعراض المرارة' },
  { foodCategory: 'fats', condition: 'metabolic_syndrome', conditionAr: 'متلازمة الأيض', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'medium', severityAr: 'متوسطة', message: 'Choose unsaturated fats; limit saturated fats', messageAr: 'اختر الدهون غير المشبعة وحد من الدهون المشبعة' },
  { foodCategory: 'fats', condition: 'geriatric_malnutrition', conditionAr: 'سوء تغذية مسنين', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'low', severityAr: 'منخفضة', message: 'Healthy fats provide essential fatty acids and energy', messageAr: 'الدهون الصحية توفر الأحماض الدهنية الأساسية والطاقة' },
  { foodCategory: 'oriental', condition: 'hypertension', conditionAr: 'ارتفاع ضغط الدم', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'high', severityAr: 'عالية', message: 'Many traditional dishes are high in sodium; request low-salt preparation', messageAr: 'العديد من الأطباق التقليدية عالية الصوديوم اطلب تحضيراً قليل الملح' },
  { foodCategory: 'oriental', condition: 'chronic_kidney_disease', conditionAr: 'مرض الكلى المزمن', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'high', severityAr: 'عالية', message: 'High potassium and phosphorus in many oriental dishes', messageAr: 'بوتاسيوم وفوسفور عاليان في العديد من الأطباق الشرقية' },
  { foodCategory: 'oriental', condition: 'diabetes_mellitus', conditionAr: 'داء السكري', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'medium', severityAr: 'متوسطة', message: 'Rice-based dishes affect blood glucose; control portions', messageAr: 'الأطباق القائمة على الرز تؤثر على سكر الدم تحكم في الكميات' },
  { foodCategory: 'oriental', condition: 'obesity', conditionAr: 'سمنة', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'medium', severityAr: 'متوسطة', message: 'Traditional dishes can be calorie-dense; watch portions', messageAr: 'الأطباق التقليدية يمكن أن تكون كثيفة السعرات راقب الكميات' },
  { foodCategory: 'oriental', condition: 'gout', conditionAr: 'النقرس', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'medium', severityAr: 'متوسطة', message: 'Limit meat-based dishes high in purines', messageAr: 'حد من أطباق اللحوم عالية البيورين' },
  { foodCategory: 'oriental', condition: 'heart_failure', conditionAr: 'فشل القلب', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'high', severityAr: 'عالية', message: 'High sodium content may worsen fluid retention', messageAr: 'محتوى الصوديوم العالي قد يزيد احتباس السوائل' },
  { foodCategory: 'snacks', condition: 'obesity', conditionAr: 'سمنة', contraindicationType: 'limit', contraindicationTypeAr: 'حدد', severity: 'high', severityAr: 'عالية', message: 'Snack foods are calorie-dense and nutrient-poor', messageAr: 'الوجبات الخفيفة كثيفة السعرات وفقيرة بالمغذيات' },
  { foodCategory: 'snacks', condition: 'diabetes_mellitus', conditionAr: 'داء السكري', contraindicationType: 'limit', contraindicationTypeAr: 'حدد', severity: 'high', severityAr: 'عالية', message: 'Processed snacks cause blood glucose spikes', messageAr: 'الوجبات الخفيفة المصنعة تسبب ارتفاعات في سكر الدم' },
  { foodCategory: 'snacks', condition: 'hypertension', conditionAr: 'ارتفاع ضغط الدم', contraindicationType: 'avoid', contraindicationTypeAr: 'تجنب', severity: 'high', severityAr: 'عالية', message: 'Chips and salty snacks are very high in sodium', messageAr: 'رقائق البطاطس والوجبات الخفيفة المالحة عالية جداً في الصوديوم' },
  { foodCategory: 'snacks', condition: 'hypertriglyceridemia', conditionAr: 'فرط الدهون الثلاثية', contraindicationType: 'avoid', contraindicationTypeAr: 'تجنب', severity: 'high', severityAr: 'عالية', message: 'Snack foods raise triglyceride levels', messageAr: 'الوجبات الخفيفة ترفع مستويات الدهون الثلاثية' },
  { foodCategory: 'snacks', condition: 'chronic_kidney_disease', conditionAr: 'مرض الكلى المزمن', contraindicationType: 'avoid', contraindicationTypeAr: 'تجنب', severity: 'high', severityAr: 'عالية', message: 'High sodium and phosphorus in processed snacks', messageAr: 'صوديوم وفوسفور عاليان في الوجبات الخفيفة المصنعة' },
  { foodCategory: 'snacks', condition: 'geriatric_malnutrition', conditionAr: 'سوء تغذية مسنين', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'low', severityAr: 'منخفضة', message: 'Nutrient-fortified snacks may provide additional calories', messageAr: 'الوجبات الخفيفة المدعمة قد توفر سعرات إضافية' },
  { foodCategory: 'beverages', condition: 'diabetes_mellitus', conditionAr: 'داء السكري', contraindicationType: 'avoid', contraindicationTypeAr: 'تجنب', severity: 'high', severityAr: 'عالية', message: 'Sugar-sweetened beverages cause rapid hyperglycaemia', messageAr: 'المشروبات المحلاة بالسكر تسبب ارتفاع سكر الدم السريع' },
  { foodCategory: 'beverages', condition: 'obesity', conditionAr: 'سمنة', contraindicationType: 'avoid', contraindicationTypeAr: 'تجنب', severity: 'high', severityAr: 'عالية', message: 'Liquid calories do not promote satiety', messageAr: 'السعرات السائلة لا تعزز الشبع' },
  { foodCategory: 'beverages', condition: 'chronic_kidney_disease', conditionAr: 'مرض الكلى المزمن', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'high', severityAr: 'عالية', message: 'Fluid restriction may apply; monitor potassium in juices', messageAr: 'تقييد السوائل قد ينطبق راقب البوتاسيوم في العصائر' },
  { foodCategory: 'beverages', condition: 'gout', conditionAr: 'النقرس', contraindicationType: 'avoid', contraindicationTypeAr: 'تجنب', severity: 'high', severityAr: 'عالية', message: 'Sugar-sweetened beverages raise uric acid levels', messageAr: 'المشروبات المحلاة بالسكر ترفع مستويات حمض البول' },
  { foodCategory: 'beverages', condition: 'hypertension', conditionAr: 'ارتفاع ضغط الدم', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'medium', severityAr: 'متوسطة', message: 'Limit caffeine-containing beverages; avoid sugary drinks', messageAr: 'حد من المشروبات المحتوية على الكافيين تجنب المشروبات السكرية' },
  { foodCategory: 'beverages', condition: 'heart_failure', conditionAr: 'فشل القلب', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'high', severityAr: 'عالية', message: 'Strict fluid restriction may be required', messageAr: 'تقييد صارم للسوائل قد يكون مطلوباً' },
  { foodCategory: 'beverages', condition: 'geriatric_malnutrition', conditionAr: 'سوء تغذية مسنين', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'low', severityAr: 'منخفضة', message: 'Encourage adequate fluid intake; limit caffeine', messageAr: 'شجع على تناول كافٍ من السوائل وحد من الكافيين' },
  { foodCategory: 'herbs', condition: 'warfarin_therapy', conditionAr: 'علاج الوارفارين', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'high', severityAr: 'عالية', message: 'Some herbs affect INR; maintain consistent intake', messageAr: 'بعض الأعشاب تؤثر على INR حافظ على تناول ثابت' },
  { foodCategory: 'herbs', condition: 'pregnancy', conditionAr: 'الحمل', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'medium', severityAr: 'متوسطة', message: 'Some herbal teas may be contraindicated in pregnancy', messageAr: 'بعض الأعشاب قد تكون ممنوعة في الحمل' },
  { foodCategory: 'herbs', condition: 'hypertension', conditionAr: 'ارتفاع ضغط الدم', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'low', severityAr: 'منخفضة', message: 'Garlic and hibiscus may have mild BP-lowering effects', messageAr: 'الثوم والكركديه قد يكون لهما تأثير خفيف في خفض ضغط الدم' },
  { foodCategory: 'herbs', condition: 'iron_deficiency', conditionAr: 'نقص الحديد', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'medium', severityAr: 'متوسطة', message: 'Tannins in tea inhibit iron absorption; drink between meals', messageAr: 'العفص في الشاي يثبط امتصاص الحديد اشرب بين الوجبات' },
  { foodCategory: 'herbs', condition: 'gout', conditionAr: 'النقرس', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'low', severityAr: 'منخفضة', message: 'Cherry extract may help reduce gout flares', messageAr: 'مستخلص الكرز قد يساعد في تقليل نوبات النقرس' },
  { foodCategory: 'herbs', condition: 'geriatric_malnutrition', conditionAr: 'سوء تغذية مسنين', contraindicationType: 'caution', contraindicationTypeAr: 'انتباه', severity: 'low', severityAr: 'منخفضة', message: 'Herbs can flavour food without adding sodium', messageAr: 'الأعشاب يمكن أن تنكه الطعام دون إضافة صوديوم' },
];

function generateFilters(): FoodContraindicationFilterSeed[] {
  const filters: FoodContraindicationFilterSeed[] = [];
  let idCounter = 0;

  const foodCategories = ['grains', 'vegetables', 'fruits', 'proteins', 'dairy', 'fats', 'oriental', 'snacks', 'beverages', 'herbs', 'sugars'];

  for (const rule of FILTER_RULES) {
    const foodId = rule.foodCategory;
    filters.push({
      id: `filter-${String(++idCounter).padStart(4, '0')}`,
      food_id: foodId,
      condition: rule.condition,
      conditionAr: rule.conditionAr,
      contraindicationType: rule.contraindicationType,
      contraindicationTypeAr: rule.contraindicationTypeAr,
      severity: rule.severity,
      severityAr: rule.severityAr,
      message: rule.message,
      messageAr: rule.messageAr,
    });
  }

  for (const cat of foodCategories) {
    for (const rule of FILTER_RULES) {
      if (cat !== rule.foodCategory) {
        filters.push({
          id: `filter-${String(++idCounter).padStart(4, '0')}`,
          food_id: cat,
          condition: rule.condition,
          conditionAr: rule.conditionAr,
          contraindicationType: rule.contraindicationType,
          contraindicationTypeAr: rule.contraindicationTypeAr,
          severity: rule.severity,
          severityAr: rule.severityAr,
          message: rule.message,
          messageAr: rule.messageAr,
        });
      }
    }
  }

  return filters;
}

export const foodContraindicationFilters: FoodContraindicationFilterSeed[] = generateFilters();
