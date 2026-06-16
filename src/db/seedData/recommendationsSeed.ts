import { Database } from '@nozbe/watermelondb';

const NOW = Date.now();

interface RecommendationSeed {
  recommendationType: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  priority: string;
  status: string;
  evidenceLevel: string;
  source: string;
}

const RECOMMENDATIONS: RecommendationSeed[] = [
  // ===== DIABETES =====
  { recommendationType: 'dietary_modification', title: 'Implement Carbohydrate Counting', titleAr: 'تطبيق حساب الكربوهيدرات', description: 'Start carbohydrate counting education for better glycaemic control. Aim for consistent carbohydrate intake at meals.', descriptionAr: 'بدء تعليم حساب الكربوهيدرات لتحسين التحكم في سكر الدم. استهدف تناول كربوهيدرات ثابت في الوجبات.', priority: 'high', status: 'pending', evidenceLevel: 'high', source: 'ADA 2024' },
  { recommendationType: 'dietary_modification', title: 'Reduce Sugar-Sweetened Beverages', titleAr: 'تقليل المشروبات المحلاة بالسكر', description: 'Eliminate all sugar-sweetened beverages. Replace with water, unsweetened tea or coffee.', descriptionAr: 'إزالة جميع المشروبات المحلاة بالسكر. استبدالها بالماء أو الشاي أو القهوة غير المحلاة.', priority: 'high', status: 'pending', evidenceLevel: 'high', source: 'ADA 2024' },
  { recommendationType: 'dietary_modification', title: 'Increase Dietary Fibre Intake', titleAr: 'زيادة تناول الألياف الغذائية', description: 'Increase fibre intake to 25-35g/day from whole grains, legumes, vegetables, and fruits.', descriptionAr: 'زيادة تناول الألياف إلى 25-35 غرام/يوم من الحبوب الكاملة والبقوليات والخضروات والفواكه.', priority: 'medium', status: 'pending', evidenceLevel: 'moderate', source: 'ADA 2024' },
  { recommendationType: 'medication', title: 'Review Insulin Regimen', titleAr: 'مراجعة نظام الأنسولين', description: 'Adjust insulin doses based on glucose patterns and carbohydrate intake. Consider insulin-to-carbohydrate ratio.', descriptionAr: 'تعديل جرعات الأنسولين بناءً على أنماط الغلوكوز وتناول الكربوهيدرات. النظر في نسبة الأنسولين إلى الكربوهيدرات.', priority: 'high', status: 'pending', evidenceLevel: 'high', source: 'ADA 2024' },
  { recommendationType: 'monitoring', title: 'Increase Glucose Monitoring Frequency', titleAr: 'زيادة وتيرة مراقبة الغلوكوز', description: 'Increase blood glucose monitoring to 4-6 times daily for better glycaemic management.', descriptionAr: 'زيادة مراقبة سكر الدم إلى 4-6 مرات يومياً لتحسين إدارة سكر الدم.', priority: 'medium', status: 'pending', evidenceLevel: 'high', source: 'ADA 2024' },

  // ===== RENAL =====
  { recommendationType: 'dietary_modification', title: 'Implement Protein Restriction', titleAr: 'تطبيق تقييد البروتين', description: 'Restrict protein intake to 0.6-0.8 g/kg/day for non-dialysis CKD stage 3-5 patients.', descriptionAr: 'تقييد تناول البروتين إلى 0.6-0.8 غرام/كغم/يوم لمرضى الكلى المزمن غير الخاضعين للغسيل في المرحلة 3-5.', priority: 'high', status: 'pending', evidenceLevel: 'high', source: 'KDIGO 2024' },
  { recommendationType: 'dietary_modification', title: 'Sodium Restriction <2g/day', titleAr: 'تقييد الصوديوم أقل من 2 غرام/يوم', description: 'Limit sodium intake to less than 2g per day. Avoid processed foods, canned goods, and added salt.', descriptionAr: 'الحد من تناول الصوديوم إلى أقل من 2 غرام يومياً. تجنب الأطعمة المصنعة والمعلبة والملح المضاف.', priority: 'high', status: 'pending', evidenceLevel: 'high', source: 'KDIGO 2024' },
  { recommendationType: 'dietary_modification', title: 'Potassium Intake Individualisation', titleAr: 'تخصيص تناول البوتاسيوم', description: 'Individualise potassium intake based on serum potassium levels. Avoid high-potassium foods if hyperkalemic.', descriptionAr: 'تخصيص تناول البوتاسيوم بناءً على مستوياته في الدم. تجنب الأطعمة عالية البوتاسيوم في حالة فرط بوتاسيوم الدم.', priority: 'high', status: 'pending', evidenceLevel: 'high', source: 'KDIGO 2024' },
  { recommendationType: 'dietary_modification', title: 'Phosphate Restriction', titleAr: 'تقييد الفوسفات', description: 'Restrict phosphate intake to 800-1000mg/day. Avoid phosphate-containing additives.', descriptionAr: 'تقييد تناول الفوسفات إلى 800-1000 ملغ/يوم. تجنب الإضافات المحتوية على الفوسفات.', priority: 'high', status: 'pending', evidenceLevel: 'high', source: 'KDIGO 2024' },
  { recommendationType: 'medication', title: 'Phosphate Binder Review', titleAr: 'مراجعة رابط الفوسفات', description: 'Review phosphate binder type and dosing with meals based on phosphate content.', descriptionAr: 'مراجعة نوع وجرعة رابط الفوسفات مع الوجبات بناءً على محتوى الفوسفات.', priority: 'medium', status: 'pending', evidenceLevel: 'high', source: 'KDIGO 2024' },
  { recommendationType: 'monitoring', title: 'Weekly Lab Monitoring for HD', titleAr: 'مراقبة مختبر أسبوعية لغسيل الكلى', description: 'Monitor serum potassium, phosphate, calcium, and albumin weekly in haemodialysis patients.', descriptionAr: 'مراقبة البوتاسيوم والفوسفات والكالسيوم والألبومين أسبوعياً في مرضى غسيل الكلى الدموي.', priority: 'high', status: 'pending', evidenceLevel: 'high', source: 'KDOQI 2020' },

  // ===== ICU =====
  { recommendationType: 'nutrition_support', title: 'Initiate Early Enteral Nutrition', titleAr: 'بدء التغذية المعوية المبكرة', description: 'Start enteral nutrition within 24-48 hours of ICU admission if unable to eat orally.', descriptionAr: 'بدء التغذية المعوية خلال 24-48 ساعة من دخول العناية المركزة إذا كان غير قادر على الأكل.', priority: 'high', status: 'pending', evidenceLevel: 'high', source: 'ASPEN/SCCM 2021' },
  { recommendationType: 'nutrition_support', title: 'Optimise Protein Delivery', titleAr: 'تحسين توصيل البروتين', description: 'Target protein delivery of 1.2-2.0 g/kg/day. Use modular protein supplements if needed.', descriptionAr: 'استهداف توصيل بروتين 1.2-2.0 غرام/كغم/يوم. استخدام مكملات البروتين المعيارية إذا لزم الأمر.', priority: 'high', status: 'pending', evidenceLevel: 'moderate', source: 'ASPEN/SCCM 2021' },
  { recommendationType: 'nutrition_support', title: 'Implement Feeding Protocol', titleAr: 'تطبيق بروتوكول التغذية', description: 'Use evidence-based feeding protocol to improve enteral nutrition delivery.', descriptionAr: 'استخدام بروتوكول تغذية قائم على الأدلة لتحسين توصيل التغذية المعوية.', priority: 'medium', status: 'pending', evidenceLevel: 'high', source: 'ASPEN/SCCM 2021' },
  { recommendationType: 'monitoring', title: 'Refeeding Syndrome Monitoring', titleAr: 'مراقبة متلازمة إعادة التغذية', description: 'Monitor potassium, phosphate, and magnesium daily for first 7 days of nutrition support in high-risk patients.', descriptionAr: 'مراقبة البوتاسيوم والفوسفات والمغنيسيوم يومياً لأول 7 أيام من دعم التغذية في المرضى عالي الخطورة.', priority: 'high', status: 'pending', evidenceLevel: 'high', source: 'ASPEN/SCCM 2021' },
  { recommendationType: 'monitoring', title: 'Gastric Residual Volume Monitoring', titleAr: 'مراقبة حجم البقايا المعدية', description: 'Check gastric residual volume every 4 hours. Hold feeding if >500ml.', descriptionAr: 'فحص حجم البقايا المعدية كل 4 ساعات. إيقاف التغذية إذا >500 مل.', priority: 'medium', status: 'pending', evidenceLevel: 'moderate', source: 'ASPEN/SCCM 2021' },

  // ===== ONCOLOGY =====
  { recommendationType: 'nutrition_support', title: 'High-Protein Diet for Cachexia', titleAr: 'نظام غذائي عالي البروتين للدنف', description: 'Increase protein intake to 1.5-2.0 g/kg/day to counteract cachexia and maintain muscle mass.', descriptionAr: 'زيادة تناول البروتين إلى 1.5-2.0 غرام/كغم/يوم لمواجهة الدنف والحفاظ على كتلة العضلات.', priority: 'high', status: 'pending', evidenceLevel: 'high', source: 'ESPEN 2021' },
  { recommendationType: 'nutrition_support', title: 'Omega-3 Supplementation', titleAr: 'مكملات أوميغا-3', description: 'Consider EPA supplementation (2g/day) to help stabilise weight and appetite in cancer cachexia.', descriptionAr: 'النظر في مكملات EPA (2 غرام/يوم) للمساعدة في تثبيت الوزن والشهية في دنف السرطان.', priority: 'medium', status: 'pending', evidenceLevel: 'moderate', source: 'ESPEN 2021' },
  { recommendationType: 'symptom_management', title: 'Manage Chemotherapy Nausea', titleAr: 'إدارة الغثيان الكيميائي', description: 'Small frequent meals. Avoid strong odours. Ginger supplementation. Anti-emetic medication before meals.', descriptionAr: 'وجبات صغيرة متكررة. تجنب الروائح القوية. مكملات الزنجبيل. دواء مضاد للقيء قبل الوجبات.', priority: 'high', status: 'pending', evidenceLevel: 'high', source: 'ESPEN 2021' },
  { recommendationType: 'symptom_management', title: 'Oral Mucositis Diet', titleAr: 'نظام غذائي لالتهاب الغشاء المخاطي للفم', description: 'Provide soft, bland, room-temperature foods. Avoid acidic, spicy, or rough-textured foods.', descriptionAr: 'توفير أطعمة طرية خفيفة في درجة حرارة الغرفة. تجنب الأطعمة الحمضية أو الحارة أو خشنة الملمس.', priority: 'high', status: 'pending', evidenceLevel: 'high', source: 'ESPEN 2021' },

  // ===== PAEDIATRIC =====
  { recommendationType: 'nutrition_support', title: 'RUTF Therapy for SAM', titleAr: 'علاج RUTF لسوء التغذية الحاد الوخيم', description: 'Start ready-to-use therapeutic food (RUTF) for uncomplicated severe acute malnutrition.', descriptionAr: 'بدء الغذاء العلاجي الجاهز للاستخدام (RUTF) لسوء التغذية الحاد الوخيم غير المعقد.', priority: 'high', status: 'pending', evidenceLevel: 'high', source: 'WHO 2023' },
  { recommendationType: 'nutrition_support', title: 'Breastfeeding Support', titleAr: 'دعم الرضاعة الطبيعية', description: 'Promote exclusive breastfeeding for first 6 months. Continue breastfeeding with complementary foods up to 2 years.', descriptionAr: 'تعزيز الرضاعة الطبيعية الحصرية لأول 6 أشهر. استمرار الرضاعة الطبيعية مع الأغذية التكميلية حتى سنتين.', priority: 'high', status: 'pending', evidenceLevel: 'high', source: 'WHO 2023' },
  { recommendationType: 'monitoring', title: 'Weekly Growth Monitoring', titleAr: 'مراقبة النمو الأسبوعية', description: 'Monitor weight, height, and MUAC weekly in malnourished children. Plot on WHO growth charts.', descriptionAr: 'مراقبة الوزن والطول ومحيط منتصف الذراع أسبوعياً في الأطفال الذين يعانون من سوء التغذية. رسم على مخططات النمو لمنظمة الصحة العالمية.', priority: 'high', status: 'pending', evidenceLevel: 'high', source: 'WHO 2023' },
  { recommendationType: 'monitoring', title: 'Vitamin A Supplementation', titleAr: 'مكملات فيتامين أ', description: 'Give vitamin A supplementation (200,000 IU) for children with measles or severe malnutrition.', descriptionAr: 'إعطاء مكملات فيتامين أ (200,000 وحدة دولية) للأطفال المصابين بالحصبة أو سوء التغذية الشديد.', priority: 'high', status: 'pending', evidenceLevel: 'high', source: 'WHO 2023' },

  // ===== LIVER =====
  { recommendationType: 'dietary_modification', title: 'Late-Night Snack for Cirrhosis', titleAr: 'وجبة خفيفة في وقت متأخر من الليل لتليف الكبد', description: 'Provide a late-night snack of 200-400 kcal with protein to reduce muscle wasting in cirrhosis.', descriptionAr: 'توفير وجبة خفيفة في وقت متأخر من الليل من 200-400 سعرة حرارية مع بروتين للحد من ضمور العضلات في تليف الكبد.', priority: 'medium', status: 'pending', evidenceLevel: 'moderate', source: 'EASL 2019' },
  { recommendationType: 'dietary_modification', title: 'Sodium Restriction for Ascites', titleAr: 'تقييد الصوديوم للاستسقاء', description: 'Limit sodium to <2g/day for management of ascites in cirrhotic patients.', descriptionAr: 'الحد من الصوديوم إلى أقل من 2 غرام/يوم لإدارة الاستسقاء في مرضى تليف الكبد.', priority: 'high', status: 'pending', evidenceLevel: 'high', source: 'EASL 2019' },

  // ===== HYPERLIPIDEMIA =====
  { recommendationType: 'dietary_modification', title: 'Mediterranean Diet for Dyslipidemia', titleAr: 'النظام الغذائي المتوسطي لخلل شحميات الدم', description: 'Adopt Mediterranean dietary pattern rich in olive oil, nuts, fish, legumes, and whole grains.', descriptionAr: 'اعتماد نمط غذائي متوسطي غني بزيت الزيتون والمكسرات والأسماك والبقوليات والحبوب الكاملة.', priority: 'high', status: 'pending', evidenceLevel: 'high', source: 'ACC/AHA 2022' },
  { recommendationType: 'dietary_modification', title: 'Reduce Saturated Fat Intake', titleAr: 'تقليل تناول الدهون المشبعة', description: 'Limit saturated fat to <7% of total calories. Replace with unsaturated fats.', descriptionAr: 'الحد من الدهون المشبعة إلى أقل من 7٪ من إجمالي السعرات الحرارية. استبدالها بالدهون غير المشبعة.', priority: 'high', status: 'pending', evidenceLevel: 'high', source: 'ACC/AHA 2022' },
  { recommendationType: 'dietary_modification', title: 'Plant Stanols/Sterols Supplementation', titleAr: 'مكملات الستانول/الستيرول النباتي', description: 'Consider plant stanol/sterol supplementation (2g/day) for additional LDL reduction.', descriptionAr: 'النظر في مكملات الستانول/الستيرول النباتي (2 غرام/يوم) لمزيد من خفض LDL.', priority: 'low', status: 'pending', evidenceLevel: 'moderate', source: 'ACC/AHA 2022' },

  // ===== OBESITY =====
  { recommendationType: 'dietary_modification', title: 'Calorie Deficit for Weight Loss', titleAr: 'عجز السعرات الحرارية لفقدان الوزن', description: 'Create 500-1000 kcal/day deficit for weight loss of 0.5-1 kg per week. Target 5-10% weight loss.', descriptionAr: 'إنشاء عجز 500-1000 سعرة حرارية/يوم لفقدان الوزن 0.5-1 كغم في الأسبوع. استهداف فقدان 5-10٪ من الوزن.', priority: 'high', status: 'pending', evidenceLevel: 'high', source: 'AACE/ACE 2022' },
  { recommendationType: 'dietary_modification', title: 'Increase Physical Activity', titleAr: 'زيادة النشاط البدني', description: 'Recommend 150-300 minutes/week of moderate-intensity aerobic activity plus resistance training.', descriptionAr: 'التوصية بـ 150-300 دقيقة/أسبوع من النشاط الهوائي متوسط الشدة بالإضافة إلى تدريب المقاومة.', priority: 'medium', status: 'pending', evidenceLevel: 'high', source: 'AACE/ACE 2022' },
  { recommendationType: 'medication', title: 'Consider Anti-Obesity Medications', titleAr: 'النظر في أدوية مضادة للسمنة', description: 'For BMI >30 or >27 with comorbidity, consider anti-obesity medication as adjunct to lifestyle.', descriptionAr: 'لمؤشر كتلة الجسم >30 أو >27 مع مرض مصاحب، النظر في أدوية مضادة للسمنة كمساعدة لنمط الحياة.', priority: 'medium', status: 'pending', evidenceLevel: 'high', source: 'AACE/ACE 2022' },
];

export async function seedRecommendations(database: Database): Promise<void> {
  const existing = await database.get('clinical_recommendations').query().fetchCount();
  if (existing > 0) return;

  const collection = database.get('clinical_recommendations');

  await database.write(async () => {
    const records = RECOMMENDATIONS.map((r) =>
      collection.prepareCreate((record: any) => {
        record.recommendationType = r.recommendationType;
        record.title = r.title;
        record.titleAr = r.titleAr;
        record.description = r.description;
        record.descriptionAr = r.descriptionAr;
        record.priority = r.priority;
        record.status = r.status;
        record.evidenceLevel = r.evidenceLevel;
        record.source = r.source;
        record._raw.created_at = NOW;
        record._raw.updated_at = NOW;
      }),
    );

    await database.batch(records);
  });

  console.log(`[Seed] Clinical recommendations: ${RECOMMENDATIONS.length} records`);
}
