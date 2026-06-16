import { Database } from '@nozbe/watermelondb';

const NOW = Date.now();

interface GuidelineSeed {
  title: string;
  titleAr: string;
  condition: string;
  category: string;
  summary: string;
  summaryAr: string;
  recommendations: string;
  evidenceLevel: string;
  source: string;
  isActive: boolean;
}

const GUIDELINES: GuidelineSeed[] = [
  // ===== DIABETES =====
  {
    title: 'Nutrition Therapy for Adults with Diabetes',
    titleAr: 'العلاج الغذائي للبالغين المصابين بداء السكري',
    condition: 'diabetes_mellitus',
    category: 'nutrition_therapy',
    summary: 'Comprehensive evidence-based nutrition recommendations for adults with type 1 and type 2 diabetes',
    summaryAr: 'توصيات غذائية شاملة مبنية على الأدلة للبالغين المصابين بداء السكري من النوع الأول والثاني',
    recommendations: JSON.stringify([
      { text: 'Recommend individualised medical nutrition therapy (MNT) for all adults with diabetes', textAr: 'يوصى بالعلاج الغذائي الطبي الفردي لجميع البالغين المصابين بداء السكري', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Carbohydrate intake should emphasise nutrient-dense carbohydrate sources', textAr: 'يجب أن يركز تناول الكربوهيدرات على مصادر الكربوهيدرات الغنية بالمغذيات', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Minimal intake of sugar-sweetened beverages', textAr: 'الحد الأدنى من تناول المشروبات المحلاة بالسكر', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Total protein intake 15-20% of total energy for those with normal renal function', textAr: 'تناول البروتين الكلي 15-20٪ من إجمالي الطاقة لمن لديهم وظائف كلوية طبيعية', strength: 'weak', evidenceQuality: 'moderate' },
      { text: 'Saturated fat intake limited to <10% of total energy', textAr: 'الحد من تناول الدهون المشبعة إلى أقل من 10٪ من إجمالي الطاقة', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Dietary fibre intake of 25-35g/day', textAr: 'تناول الألياف الغذائية 25-35 غرام/يوم', strength: 'weak', evidenceQuality: 'moderate' },
    ]),
    evidenceLevel: 'high',
    source: 'ADA Standards of Medical Care in Diabetes, 2024',
    isActive: true,
  },
  {
    title: 'Medical Nutrition Therapy for Gestational Diabetes',
    titleAr: 'العلاج الغذائي الطبي لسكري الحمل',
    condition: 'gestational_diabetes',
    category: 'nutrition_therapy',
    summary: 'Nutrition management guidelines for gestational diabetes mellitus (GDM)',
    summaryAr: 'إرشادات إدارة التغذية لسكري الحمل',
    recommendations: JSON.stringify([
      { text: 'All women with GDM should receive MNT from a qualified dietitian', textAr: 'جميع النساء المصابات بسكري الحمل يجب أن يحصلن على علاج غذائي طبي من أخصائي تغذية مؤهل', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Blood glucose monitoring 4 times daily (fasting + 1-hour postprandial)', textAr: 'مراقبة سكر الدم 4 مرات يومياً (صائم + ساعة بعد الأكل)', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Carbohydrate intake of 175g/day minimum, distributed across 3 meals and 2-3 snacks', textAr: 'تناول 175 غرام/يوم كحد أدنى من الكربوهيدرات موزعة على 3 وجبات و2-3 وجبات خفيفة', strength: 'weak', evidenceQuality: 'moderate' },
      { text: 'Fasting glucose target <95 mg/dL, 1-hour postprandial <140 mg/dL', textAr: 'سكر صائم أقل من 95 ملغ/دل، وبعد ساعة من الأكل أقل من 140 ملغ/دل', strength: 'strong', evidenceQuality: 'high' },
    ]),
    evidenceLevel: 'high',
    source: 'ADA Standards of Care, 2024',
    isActive: true,
  },
  {
    title: 'Carbohydrate Counting for Type 1 Diabetes',
    titleAr: 'حساب الكربوهيدرات لمرضى السكري من النوع الأول',
    condition: 'diabetes_type_1',
    category: 'carbohydrate_management',
    summary: 'Evidence-based carbohydrate counting education for type 1 diabetes management',
    summaryAr: 'تعليم حساب الكربوهيدرات القائم على الأدلة لإدارة السكري من النوع الأول',
    recommendations: JSON.stringify([
      { text: 'Advanced carbohydrate counting is recommended for insulin dose adjustment', textAr: 'يوصى بحساب الكربوهيدرات المتقدم لتعديل جرعة الأنسولين', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Insulin-to-carbohydrate ratio should be individualised', textAr: 'يجب تخصيص نسبة الأنسولين إلى الكربوهيدرات', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Continuous glucose monitoring is recommended for all patients on intensive insulin therapy', textAr: 'يوصى بالمراقبة المستمرة للغلوكوز لجميع المرضى على العلاج بالأنسولين المكثف', strength: 'strong', evidenceQuality: 'high' },
    ]),
    evidenceLevel: 'high',
    source: 'ISPAD Clinical Practice Consensus Guidelines, 2022',
    isActive: true,
  },

  // ===== RENAL =====
  {
    title: 'Dietary Management of Chronic Kidney Disease',
    titleAr: 'الإدارة الغذائية لأمراض الكلى المزمنة',
    condition: 'chronic_kidney_disease',
    category: 'medical_nutrition_therapy',
    summary: 'Evidence-based nutrition recommendations for adults with chronic kidney disease (CKD)',
    summaryAr: 'توصيات غذائية مبنية على الأدلة للبالغين المصابين بأمراض الكلى المزمنة',
    recommendations: JSON.stringify([
      { text: 'Protein restriction of 0.6-0.8 g/kg/day for non-dialysis CKD stage 3-5', textAr: 'تقييد البروتين 0.6-0.8 غرام/كغم/يوم لمرضى الكلى المزمن غير الخاضعين للغسيل الكلوي في المرحلة 3-5', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Sodium restriction <2g/day (5g salt)', textAr: 'تقييد الصوديوم أقل من 2 غرام/يوم (5 غرام ملح)', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Potassium intake individualised based on serum levels', textAr: 'تخصيص تناول البوتاسيوم بناءً على مستوياته في الدم', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Phosphate restriction 800-1000mg/day if hyperphosphataemic', textAr: 'تقييد الفوسفات إلى 800-1000 ملغ/يوم في حالة فرط فوسفات الدم', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Vitamin D supplementation if deficient', textAr: 'مكملات فيتامين د في حالة النقص', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Calcium intake 1000-1200mg/day (diet + binders)', textAr: 'تناول الكالسيوم 1000-1200 ملغ/يوم (غذاء + روابط)', strength: 'weak', evidenceQuality: 'moderate' },
    ]),
    evidenceLevel: 'high',
    source: 'KDIGO 2024 Clinical Practice Guideline for CKD',
    isActive: true,
  },
  {
    title: 'Nutrition in Haemodialysis',
    titleAr: 'التغذية في غسيل الكلى الدموي',
    condition: 'haemodialysis',
    category: 'renal_nutrition',
    summary: 'Dietary management for patients undergoing haemodialysis',
    summaryAr: 'الإدارة الغذائية للمرضى الخاضعين لغسيل الكلى الدموي',
    recommendations: JSON.stringify([
      { text: 'Protein intake 1.2-1.4 g/kg/day to maintain neutral nitrogen balance', textAr: 'تناول بروتين 1.2-1.4 غرام/كغم/يوم للحفاظ على توازن النيتروجين المحايد', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Energy intake 30-35 kcal/kg/day', textAr: 'تناول طاقة 30-35 سعرة حرارية/كغم/يوم', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Sodium restriction <2g/day', textAr: 'تقييد الصوديوم أقل من 2 غرام/يوم', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Fluid restriction 500-1000ml + urine output daily', textAr: 'تقييد السوائل 500-1000 مل + إخراج البول يومياً', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Water-soluble vitamin supplementation required', textAr: 'مكملات الفيتامينات القابلة للذوبان في الماء مطلوبة', strength: 'strong', evidenceQuality: 'high' },
    ]),
    evidenceLevel: 'high',
    source: 'KDOQI Clinical Practice Guideline for Nutrition in CKD, 2020',
    isActive: true,
  },
  {
    title: 'Nutrition in Peritoneal Dialysis',
    titleAr: 'التغذية في غسيل الكلى البريتوني',
    condition: 'peritoneal_dialysis',
    category: 'renal_nutrition',
    summary: 'Nutritional management for patients on peritoneal dialysis',
    summaryAr: 'الإدارة الغذائية للمرضى على غسيل الكلى البريتوني',
    recommendations: JSON.stringify([
      { text: 'Protein intake 1.2-1.5 g/kg/day including dialysate protein losses', textAr: 'تناول بروتين 1.2-1.5 غرام/كغم/يوم بما في ذلك فقدان البروتين في الديالة', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Energy intake 25-35 kcal/kg/day including dialysate glucose absorption', textAr: 'تناول طاقة 25-35 سعرة حرارية/كغم/يوم بما في ذلك امتصاص الغلوكوز من الديالة', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Sodium restriction 1.5-2g/day', textAr: 'تقييد الصوديوم 1.5-2 غرام/يوم', strength: 'weak', evidenceQuality: 'moderate' },
    ]),
    evidenceLevel: 'high',
    source: 'KDOQI Guidelines 2020',
    isActive: true,
  },

  // ===== ICU =====
  {
    title: 'Nutrition Support in the Critically Ill Adult',
    titleAr: 'دعم التغذية في البالغين المصابين بأمراض حرجة',
    condition: 'critical_illness',
    category: 'icu_nutrition',
    summary: 'Evidence-based guidelines for nutrition support therapy in adult ICU patients',
    summaryAr: 'إرشادات مبنية على الأدلة لعلاج دعم التغذية في مرضى العناية المركزة البالغين',
    recommendations: JSON.stringify([
      { text: 'Screen all ICU patients for malnutrition risk within 24-48 hours of admission', textAr: 'فحص جميع مرضى العناية المركزة لخطر سوء التغذية خلال 24-48 ساعة من الدخول', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Initiate enteral nutrition within 24-48 hours in patients who cannot eat', textAr: 'بدء التغذية المعوية خلال 24-48 ساعة في المرضى الذين لا يستطيعون الأكل', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Use a feeding protocol to optimise EN delivery', textAr: 'استخدام بروتوكول تغذية لتحسين توصيل التغذية المعوية', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Energy provision 25-30 kcal/kg/day for most ICU patients', textAr: 'توفير طاقة 25-30 سعرة حرارية/كغم/يوم لمعظم مرضى العناية المركزة', strength: 'weak', evidenceQuality: 'moderate' },
      { text: 'Protein provision 1.2-2.0 g/kg/day', textAr: 'توفير بروتين 1.2-2.0 غرام/كغم/يوم', strength: 'strong', evidenceQuality: 'moderate' },
      { text: 'Parenteral nutrition should be reserved for patients with contraindications to EN', textAr: 'يجب حجز التغذية الوريدية للمرضى الذين لديهم موانع للتغذية المعوية', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Monitor for refeeding syndrome in high-risk patients', textAr: 'مراقبة متلازمة إعادة التغذية في المرضى عالي الخطورة', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Provide supplemental PN if EN is insufficient after 7-10 days', textAr: 'توفير تغذية وريدية تكميلية إذا كانت التغذية المعوية غير كافية بعد 7-10 أيام', strength: 'weak', evidenceQuality: 'low' },
    ]),
    evidenceLevel: 'high',
    source: 'ASPEN/SCCM Critical Care Nutrition Guidelines, 2021',
    isActive: true,
  },
  {
    title: 'Glycemic Control in the ICU',
    titleAr: 'التحكم في سكر الدم في العناية المركزة',
    condition: 'icu_hyperglycaemia',
    category: 'icu_nutrition',
    summary: 'Management of hyperglycaemia and glucose control in critically ill patients',
    summaryAr: 'إدارة ارتفاع سكر الدم والتحكم في الغلوكوز في المرضى ذوي الحالات الحرجة',
    recommendations: JSON.stringify([
      { text: 'Maintain blood glucose between 140-180 mg/dL in most ICU patients', textAr: 'الحفاظ على سكر الدم بين 140-180 ملغ/دل في معظم مرضى العناية المركزة', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Avoid intensive insulin therapy targeting <110 mg/dL', textAr: 'تجنب العلاج المكثف بالأنسولين المستهدف أقل من 110 ملغ/دل', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Monitor blood glucose at least every 4 hours in patients on EN/PN', textAr: 'مراقبة سكر الدم كل 4 ساعات على الأقل في المرضى على التغذية المعوية/الوريدية', strength: 'weak', evidenceQuality: 'moderate' },
    ]),
    evidenceLevel: 'high',
    source: 'SSC Guidelines 2024',
    isActive: true,
  },

  // ===== CARDIAC =====
  {
    title: 'Dietary Management of Heart Failure',
    titleAr: 'الإدارة الغذائية لفشل القلب',
    condition: 'heart_failure',
    category: 'cardiac_nutrition',
    summary: 'Nutrition recommendations for patients with heart failure',
    summaryAr: 'توصيات غذائية لمرضى فشل القلب',
    recommendations: JSON.stringify([
      { text: 'Sodium restriction <2g/day in symptomatic heart failure', textAr: 'تقييد الصوديوم أقل من 2 غرام/يوم في فشل القلب المصحوب بأعراض', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Fluid restriction 1.5-2L/day in severe fluid overload', textAr: 'تقييد السوائل 1.5-2 لتر/يوم في الحمل الزائد للسوائل الشديد', strength: 'weak', evidenceQuality: 'moderate' },
      { text: 'Weight monitoring daily for early detection of fluid retention', textAr: 'مراقبة الوزن يومياً للكشف المبكر عن احتباس السوائل', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Consider omega-3 PUFA supplementation', textAr: 'النظر في مكملات أوميغا-3 المتعددة غير المشبعة', strength: 'weak', evidenceQuality: 'moderate' },
    ]),
    evidenceLevel: 'high',
    source: 'ACC/AHA Heart Failure Guidelines, 2022',
    isActive: true,
  },
  {
    title: 'Dietary Approaches for Hypertension',
    titleAr: 'الأساليب الغذائية لارتفاع ضغط الدم',
    condition: 'hypertension',
    category: 'cardiac_nutrition',
    summary: 'Evidence-based dietary patterns for blood pressure management (DASH diet)',
    summaryAr: 'أنماط غذائية مبنية على الأدلة لإدارة ضغط الدم (حمية داش)',
    recommendations: JSON.stringify([
      { text: 'Adopt DASH dietary pattern rich in fruits, vegetables, whole grains, low-fat dairy', textAr: 'اعتماد نمط حمية داش الغني بالفواكه والخضروات والحبوب الكاملة ومنتجات الألبان قليلة الدسم', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Sodium restriction <1.5g/day for greater blood pressure reduction', textAr: 'تقييد الصوديوم أقل من 1.5 غرام/يوم لمزيد من خفض ضغط الدم', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Potassium intake 3500-5000mg/day through dietary sources', textAr: 'تناول البوتاسيوم 3500-5000 ملغ/يوم من المصادر الغذائية', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Limit alcohol intake to 1 drink/day for women, 2 for men', textAr: 'الحد من تناول الكحول إلى مشروب واحد/يوم للنساء و 2 للرجال', strength: 'strong', evidenceQuality: 'high' },
    ]),
    evidenceLevel: 'high',
    source: 'ACC/AHA Hypertension Guidelines, 2017',
    isActive: true,
  },

  // ===== LIVER =====
  {
    title: 'Nutrition Management of Liver Cirrhosis',
    titleAr: 'إدارة التغذية لتليف الكبد',
    condition: 'liver_cirrhosis',
    category: 'hepatic_nutrition',
    summary: 'Nutrition therapy for patients with liver cirrhosis and complications',
    summaryAr: 'العلاج الغذائي لمرضى تليف الكبد والمضاعفات',
    recommendations: JSON.stringify([
      { text: 'Energy intake 25-35 kcal/kg/day based on dry weight', textAr: 'تناول طاقة 25-35 سعرة حرارية/كغم/يوم بناءً على الوزن الجاف', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Protein intake 1.2-1.5 g/kg/day even in hepatic encephalopathy', textAr: 'تناول بروتين 1.2-1.5 غرام/كغم/يوم حتى في اعتلال الدماغ الكبدي', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Sodium restriction <2g/day for ascites management', textAr: 'تقييد الصوديوم أقل من 2 غرام/يوم لإدارة الاستسقاء', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Small frequent meals with late-night snack to reduce muscle wasting', textAr: 'وجبات صغيرة متكررة مع وجبة خفيفة في وقت متأخر من الليل للحد من ضمور العضلات', strength: 'weak', evidenceQuality: 'moderate' },
      { text: 'Vitamin A, D, E, K, zinc, and selenium supplementation if deficient', textAr: 'مكملات فيتامين أ, د, ه, ك والزنك والسيلينيوم في حالة النقص', strength: 'weak', evidenceQuality: 'moderate' },
    ]),
    evidenceLevel: 'high',
    source: 'EASL Clinical Practice Guidelines on Nutrition in Liver Disease, 2019',
    isActive: true,
  },

  // ===== ONCOLOGY =====
  {
    title: 'Nutrition Support in Cancer Patients',
    titleAr: 'دعم التغذية لمرضى السرطان',
    condition: 'cancer',
    category: 'oncology_nutrition',
    summary: 'Evidence-based nutrition recommendations for cancer patients during treatment',
    summaryAr: 'توصيات غذائية مبنية على الأدلة لمرضى السرطان أثناء العلاج',
    recommendations: JSON.stringify([
      { text: 'Screen all cancer patients for malnutrition using validated tools (PG-SGA)', textAr: 'فحص جميع مرضى السرطان لسوء التغذية باستخدام أدوات موثقة (PG-SGA)', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Energy intake 25-30 kcal/kg/day for most cancer patients', textAr: 'تناول طاقة 25-30 سعرة حرارية/كغم/يوم لمعظم مرضى السرطان', strength: 'weak', evidenceQuality: 'moderate' },
      { text: 'Protein intake 1.2-2.0 g/kg/day to maintain lean body mass', textAr: 'تناول بروتين 1.2-2.0 غرام/كغم/يوم للحفاظ على كتلة الجسم الخالية من الدهون', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Omega-3 fatty acids (EPA) may help stabilise weight and appetite', textAr: 'قد تساعد أحماض أوميغا-3 الدهنية (EPA) في تثبيت الوزن والشهية', strength: 'weak', evidenceQuality: 'moderate' },
      { text: 'Enteral nutrition preferred over parenteral when GI tract is functional', textAr: 'التغذية المعوية مفضلة على الوريدية عندما يكون الجهاز الهضمي وظيفياً', strength: 'strong', evidenceQuality: 'high' },
    ]),
    evidenceLevel: 'high',
    source: 'ESPEN Guidelines on Nutrition in Cancer Patients, 2021',
    isActive: true,
  },

  // ===== PANCREATIC =====
  {
    title: 'Nutrition Management of Acute Pancreatitis',
    titleAr: 'إدارة التغذية لالتهاب البنكرياس الحاد',
    condition: 'acute_pancreatitis',
    category: 'gi_nutrition',
    summary: 'Nutrition support guidelines for acute pancreatitis management',
    summaryAr: 'إرشادات دعم التغذية لإدارة التهاب البنكرياس الحاد',
    recommendations: JSON.stringify([
      { text: 'Early enteral nutrition within 24-48 hours in predicted severe acute pancreatitis', textAr: 'التغذية المعوية المبكرة خلال 24-48 ساعة في التهاب البنكرياس الحاد المتوقع شدته', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Nasogastric or nasojejunal route are both acceptable', textAr: 'طريق أنفي معدي أو أنفي صائمي كلاهما مقبول', strength: 'weak', evidenceQuality: 'moderate' },
      { text: 'Semi-elemental formula may be better tolerated', textAr: 'قد تكون التركيبة شبه الأولية أفضل تحملاً', strength: 'weak', evidenceQuality: 'low' },
      { text: 'Parenteral nutrition if EN is not tolerated or contraindicated after 5-7 days', textAr: 'التغذية الوريدية إذا كانت التغذية المعوية غير محتملة أو ممنوعة بعد 5-7 أيام', strength: 'weak', evidenceQuality: 'moderate' },
    ]),
    evidenceLevel: 'high',
    source: 'IAP/APA Evidence-Based Guidelines for Acute Pancreatitis, 2023',
    isActive: true,
  },

  // ===== PAEDIATRIC =====
  {
    title: 'Paediatric Malnutrition Assessment and Management',
    titleAr: 'تقييم وإدارة سوء التغذية عند الأطفال',
    condition: 'paediatric_malnutrition',
    category: 'paediatric_nutrition',
    summary: 'WHO evidence-based guidelines for identification and management of malnutrition in children',
    summaryAr: 'إرشادات منظمة الصحة العالمية المبنية على الأدلة لتحديد وإدارة سوء التغذية عند الأطفال',
    recommendations: JSON.stringify([
      { text: 'Use WHO growth standards (z-scores) for assessment of all children under 5', textAr: 'استخدام معايير النمو لمنظمة الصحة العالمية (z-scores) لتقييم جميع الأطفال دون سن 5 سنوات', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Severe acute malnutrition defined as weight-for-height < -3 SD or MUAC < 115mm', textAr: 'سوء التغذية الحاد الوخيم يُعرف بأنه الوزن مقابل الطول أقل من -3 SD أو محيط منتصف الذراع أقل من 115 مم', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Ready-to-use therapeutic food (RUTF) for uncomplicated SAM in children >6 months', textAr: 'الغذاء العلاجي الجاهز للاستخدام (RUTF) لسوء التغذية الحاد الوخيم غير المعقد في الأطفال أكبر من 6 أشهر', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Exclusive breastfeeding for first 6 months of life', textAr: 'الرضاعة الطبيعية الحصرية لأول 6 أشهر من الحياة', strength: 'strong', evidenceQuality: 'high' },
      { text: 'Vitamin A supplementation in children with measles or malnutrition', textAr: 'مكملات فيتامين أ للأطفال المصابين بالحصبة أو سوء التغذية', strength: 'strong', evidenceQuality: 'high' },
    ]),
    evidenceLevel: 'high',
    source: 'WHO Malnutrition Guidelines, 2023',
    isActive: true,
  },
  {
    title: 'STAMP Paediatric Nutrition Screening',
    titleAr: 'فحص التغذية للأطفال STAMP',
    condition: 'paediatric_malnutrition',
    category: 'paediatric_nutrition',
    summary: 'Screening Tool for the Assessment of Malnutrition in Paediatrics (STAMP) protocol',
    summaryAr: 'أداة الفحص لتقييم سوء التغذية في طب الأطفال (STAMP)',
    recommendations: JSON.stringify([
      { text: 'Screen all paediatric patients within 24 hours of admission using STAMP', textAr: 'فحص جميع مرضى الأطفال خلال 24 ساعة من الدخول باستخدام STAMP', strength: 'strong', evidenceQuality: 'high' },
      { text: 'STAMP score 0-1: low risk, weekly rescreening', textAr: 'STAMP درجة 0-1: خطر منخفض، إعادة فحص أسبوعية', strength: 'strong', evidenceQuality: 'high' },
      { text: 'STAMP score 2-3: medium risk, refer to dietitian within 72 hours', textAr: 'STAMP درجة 2-3: خطر متوسط، إحالة لأخصائي التغذية خلال 72 ساعة', strength: 'strong', evidenceQuality: 'high' },
      { text: 'STAMP score 4+: high risk, refer to dietitian immediately', textAr: 'STAMP درجة 4+: خطر مرتفع، إحالة لأخصائي التغذية فوراً', strength: 'strong', evidenceQuality: 'high' },
    ]),
    evidenceLevel: 'high',
    source: 'STAMP Validation Study, BAPEN 2022',
    isActive: true,
  },
];

export async function seedGuidelines(database: Database): Promise<void> {
  const existing = await database.get('clinical_guidelines').query().fetchCount();
  if (existing > 0) return;

  const collection = database.get('clinical_guidelines');

  await database.write(async () => {
    const records = GUIDELINES.map((g) =>
      collection.prepareCreate((record: any) => {
        record.title = g.title;
        record.titleAr = g.titleAr;
        record.condition = g.condition;
        record.category = g.category;
        record.summary = g.summary;
        record.summaryAr = g.summaryAr;
        record.recommendationsJson = g.recommendations;
        record.evidenceLevel = g.evidenceLevel;
        record.source = g.source;
        record.isActive = g.isActive;
        record._raw.created_at = NOW;
        record._raw.updated_at = NOW;
      }),
    );

    await database.batch(records);
  });

  console.log(`[Seed] Clinical guidelines: ${GUIDELINES.length} records`);
}
