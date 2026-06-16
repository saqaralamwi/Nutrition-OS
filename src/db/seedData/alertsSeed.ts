import { Database } from '@nozbe/watermelondb';

const NOW = Date.now();

interface AlertSeed {
  alertType: string;
  severity: string;
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  condition: string;
  recommendation: string;
  isRead: boolean;
  isDismissed: boolean;
}

const ALERTS: AlertSeed[] = [
  // ===== NUTRITIONAL RISK =====
  { alertType: 'malnutrition_risk', severity: 'critical', title: 'Severe Malnutrition Risk Detected', titleAr: 'تم اكتشاف خطر سوء تغذية شديد', message: 'Patient meets criteria for severe malnutrition based on weight loss >5% in 1 month', messageAr: 'المريض يستوفي معايير سوء التغذية الشديد بناءً على فقدان الوزن >5% في شهر واحد', condition: 'malnutrition', recommendation: 'Urgent dietitian referral for nutrition assessment and intervention', isRead: false, isDismissed: false },
  { alertType: 'malnutrition_risk', severity: 'warning', title: 'Moderate Malnutrition Risk', titleAr: 'خطر سوء تغذية متوسط', message: 'Patient shows signs of moderate malnutrition risk. Weight loss 3-5% in 1 month', messageAr: 'المريض يظهر علامات خطر سوء تغذية متوسط. فقدان الوزن 3-5% في شهر واحد', condition: 'malnutrition', recommendation: 'Refer to dietitian within 72 hours', isRead: false, isDismissed: false },
  { alertType: 'malnutrition_risk', severity: 'info', title: 'Nutrition Screening Recommended', titleAr: 'فحص التغذية موصى به', message: 'Patient has not been screened for malnutrition risk in the past 7 days', messageAr: 'لم يتم فحص المريض لخطر سوء التغذية في الأيام السبعة الماضية', condition: 'malnutrition', recommendation: 'Complete nutrition screening using validated tool', isRead: false, isDismissed: false },

  // ===== HYPERGLYCEMIA =====
  { alertType: 'hyperglycaemia', severity: 'critical', title: 'Severe Hyperglycaemia', titleAr: 'ارتفاع سكر الدم الشديد', message: 'Blood glucose >300 mg/dL. Immediate intervention required', messageAr: 'سكر الدم >300 ملغ/دل. تدخل فوري مطلوب', condition: 'diabetes', recommendation: 'Check ketones. Administer insulin as per protocol. Review nutrition support', isRead: false, isDismissed: false },
  { alertType: 'hyperglycaemia', severity: 'warning', title: 'Elevated Blood Glucose', titleAr: 'ارتفاع سكر الدم', message: 'Blood glucose 180-300 mg/dL. Review insulin regimen and nutrition intake', messageAr: 'سكر الدم 180-300 ملغ/دل. مراجعة نظام الأنسولين وتناول الطعام', condition: 'diabetes', recommendation: 'Adjust insulin dose. Review carbohydrate intake. Monitor glucose', isRead: false, isDismissed: false },

  // ===== HYPOGLYCEMIA =====
  { alertType: 'hypoglycaemia', severity: 'critical', title: 'Severe Hypoglycaemia', titleAr: 'انخفاض سكر الدم الشديد', message: 'Blood glucose <54 mg/dL. Emergency intervention required', messageAr: 'سكر الدم <54 ملغ/دل. تدخل طارئ مطلوب', condition: 'diabetes', recommendation: 'Administer 15g fast-acting carbohydrate. Recheck in 15 minutes. Review medication', isRead: false, isDismissed: false },
  { alertType: 'hypoglycaemia', severity: 'warning', title: 'Low Blood Glucose', titleAr: 'انخفاض سكر الدم', message: 'Blood glucose 54-70 mg/dL. Patient at risk of hypoglycaemia', messageAr: 'سكر الدم 54-70 ملغ/دل. المريض معرض لخطر انخفاض السكر', condition: 'diabetes', recommendation: 'Give 15g fast-acting carbohydrate. Monitor glucose. Adjust insulin if needed', isRead: false, isDismissed: false },

  // ===== ICU =====
  { alertType: 'icu_refeeding', severity: 'critical', title: 'Refeeding Syndrome Risk', titleAr: 'خطر متلازمة إعادة التغذية', message: 'Patient at high risk for refeeding syndrome. Check electrolytes before initiating nutrition', messageAr: 'المريض معرض لخطر متلازمة إعادة التغذية. فحص الشوارد قبل البدء بالتغذية', condition: 'refeeding_syndrome', recommendation: 'Check K, Mg, PO4. Thiamine supplementation. Start feeding at 10-15 kcal/kg/day', isRead: false, isDismissed: false },
  { alertType: 'icu_refeeding', severity: 'warning', title: 'Electrolyte Abnormalities Detected', titleAr: 'تم اكتشاف تشوهات في الشوارد', message: 'Low potassium, magnesium, or phosphate levels detected in patient at risk', messageAr: 'انخفاض مستويات البوتاسيوم أو المغنيسيوم أو الفوسفات لدى المريض المعرض للخطر', condition: 'refeeding_syndrome', recommendation: 'Correct electrolytes. Monitor daily. Adjust nutrition support rate', isRead: false, isDismissed: false },

  { alertType: 'tube_feeding', severity: 'warning', title: 'Feeding Tube Dislodgement Risk', titleAr: 'خطر انزياح أنبوب التغذية', message: 'Feeding tube position has not been verified. Confirm placement before use', messageAr: 'لم يتم التحقق من موضع أنبوب التغذية. تأكيد الموضع قبل الاستخدام', condition: 'enteral_nutrition', recommendation: 'Verify tube placement. Check gastric residual. Confirm with X-ray if needed', isRead: false, isDismissed: false },
  { alertType: 'tube_feeding', severity: 'critical', title: 'High Gastric Residual Volume', titleAr: 'حجم بقايا معدي مرتفع', message: 'Gastric residual volume >500ml. Stop enteral feeding and reassess tolerance', messageAr: 'حجم البقايا المعدية >500 مل. إيقاف التغذية المعوية وإعادة تقييم التحمل', condition: 'enteral_intolerance', recommendation: 'Pause feeding. Check abdominal exam. Consider prokinetic agent. Lower infusion rate', isRead: false, isDismissed: false },

  // ===== ELECTROLYTES =====
  { alertType: 'electrolyte_imbalance', severity: 'critical', title: 'Critical Hyperkalemia', titleAr: 'فرط بوتاسيوم الدم الحرج', message: 'Serum potassium >6.0 mmol/L. Urgent medical intervention required', messageAr: 'البوتاسيوم في الدم >6.0 ملليمول/لتر. تدخل طبي عاجل مطلوب', condition: 'hyperkalemia', recommendation: 'ECG monitoring. Calcium gluconate. Insulin + glucose. Review K-sparing drugs', isRead: false, isDismissed: false },
  { alertType: 'electrolyte_imbalance', severity: 'critical', title: 'Critical Hypokalemia', titleAr: 'نقص بوتاسيوم الدم الحرج', message: 'Serum potassium <3.0 mmol/L. Urgent replacement required', messageAr: 'البوتاسيوم في الدم <3.0 ملليمول/لتر. استبدال عاجل مطلوب', condition: 'hypokalemia', recommendation: 'IV potassium replacement. Monitor ECG. Check Mg levels', isRead: false, isDismissed: false },
  { alertType: 'electrolyte_imbalance', severity: 'critical', title: 'Critical Hyponatremia', titleAr: 'نقص صوديوم الدم الحرج', message: 'Serum sodium <120 mmol/L. Urgent correction required', messageAr: 'الصوديوم في الدم <120 ملليمول/لتر. تصحيح عاجل مطلوب', condition: 'hyponatremia', recommendation: 'Fluid restriction. Hypertonic saline if severe symptoms. Monitor neuro status', isRead: false, isDismissed: false },
  { alertType: 'electrolyte_imbalance', severity: 'warning', title: 'Hypophosphatemia', titleAr: 'نقص فوسفات الدم', message: 'Serum phosphate <2.0 mg/dL. Monitor for refeeding syndrome', messageAr: 'الفوسفات في الدم <2.0 ملغ/دل. مراقبة متلازمة إعادة التغذية', condition: 'hypophosphatemia', recommendation: 'Phosphate replacement. Monitor levels daily. Consider nutrition rate adjustment', isRead: false, isDismissed: false },

  // ===== RENAL =====
  { alertType: 'renal_warning', severity: 'critical', title: 'Acute Kidney Injury Detected', titleAr: 'تم الكشف عن إصابة الكلى الحادة', message: 'Creatinine increased by >0.3 mg/dL in 48 hours. Urine output <0.5 ml/kg/hr', messageAr: 'ارتفاع الكرياتينين بمقدار >0.3 ملغ/دل في 48 ساعة. إخراج البول <0.5 مل/كغم/ساعة', condition: 'aki', recommendation: 'Review nephrotoxic drugs. Fluid management. Renal nutrition consult', isRead: false, isDismissed: false },
  { alertType: 'renal_warning', severity: 'warning', title: 'Worsening Renal Function', titleAr: 'تدهور وظائف الكلى', message: 'eGFR declining. Serum creatinine rising. Review protein and electrolyte intake', messageAr: 'انخفاض معدل الترشيح الكبيبي المقدر. ارتفاع كرياتينين الدم. مراجعة تناول البروتين والشوارد', condition: 'ckd', recommendation: 'Renal dietitian referral. Adjust protein and electrolyte intake. Monitor fluid balance', isRead: false, isDismissed: false },

  // ===== MEDICATION INTERACTIONS =====
  { alertType: 'drug_nutrient_interaction', severity: 'warning', title: 'Warfarin-Vitamin K Interaction', titleAr: 'تفاعل الوارفارين مع فيتامين ك', message: 'Patient on warfarin. Monitor vitamin K intake for consistency', messageAr: 'المريض يتناول وارفارين. مراقبة تناول فيتامين ك للثبات', condition: 'drug_interaction', recommendation: 'Maintain consistent vitamin K intake. Monitor INR weekly. Educate patient', isRead: false, isDismissed: false },
  { alertType: 'drug_nutrient_interaction', severity: 'warning', title: 'Metformin-B12 Monitoring', titleAr: 'مراقبة الميتفورمين وفيتامين ب12', message: 'Long-term metformin use associated with vitamin B12 deficiency', messageAr: 'استخدام الميتفورمين طويل الأمد مرتبط بنقص فيتامين ب12', condition: 'drug_interaction', recommendation: 'Check B12 levels annually. Supplement if deficient. Consider metformin dose', isRead: false, isDismissed: false },

  // ===== WEIGHT =====
  { alertType: 'weight_loss', severity: 'warning', title: 'Significant Weight Loss Detected', titleAr: 'تم الكشف عن فقدان وزن كبير', message: 'Unintentional weight loss >5% in 1 month. Investigate cause', messageAr: 'فقدان وزن غير مقصود >5% في شهر واحد. التحقق من السبب', condition: 'weight_loss', recommendation: 'Comprehensive nutrition assessment. Review medications. Rule out malabsorption', isRead: false, isDismissed: false },
  { alertType: 'weight_loss', severity: 'info', title: 'Mild Weight Loss', titleAr: 'فقدان وزن خفيف', message: 'Weight loss 2-5% in 1 month. Monitor closely', messageAr: 'فقدان الوزن 2-5% في شهر واحد. مراقبة دقيقة', condition: 'weight_loss', recommendation: 'Monitor weekly weights. Review oral intake. Consider supplements', isRead: false, isDismissed: false },

  // ===== PRESSURE INJURY =====
  { alertType: 'pressure_injury', severity: 'critical', title: 'Stage 3+ Pressure Injury', titleAr: 'إصابة الضغط المرحلة 3+', message: 'Pressure injury stage 3 or higher. Intensive nutrition support required', messageAr: 'إصابة الضغط المرحلة 3 أو أعلى. دعم غذائي مكثف مطلوب', condition: 'pressure_ulcer', recommendation: 'High protein intake 1.5-2.0 g/kg/day. Vitamin C and zinc supplementation. Wound consult', isRead: false, isDismissed: false },
  { alertType: 'pressure_injury', severity: 'warning', title: 'Pressure Injury Risk', titleAr: 'خطر إصابة الضغط', message: 'Patient at risk for pressure injury. Nutrition screening completed', messageAr: 'المريض معرض لخطر إصابة الضغط. تم إكمال فحص التغذية', condition: 'pressure_ulcer_prevention', recommendation: 'Optimise protein intake. Ensure adequate calories. Reposition frequently', isRead: false, isDismissed: false },

  // ===== FLUID BALANCE =====
  { alertType: 'fluid_balance', severity: 'critical', title: 'Severe Fluid Overload', titleAr: 'الحمل الزائد للسوائل الشديد', message: 'Positive fluid balance >10% of body weight. Diuretic review needed', messageAr: 'توازن سوائل إيجابي >10% من وزن الجسم. مراجعة مدرات البول مطلوبة', condition: 'fluid_overload', recommendation: 'Fluid restriction. Diuretic therapy. Daily weight monitoring. Sodium restriction', isRead: false, isDismissed: false },
  { alertType: 'fluid_balance', severity: 'warning', title: 'Fluid Imbalance Detected', titleAr: 'تم اكتشاف خلل في توازن السوائل', message: 'Fluid balance out of target range. Review intake and output', messageAr: 'توازن السوائل خارج النطاق المستهدف. مراجعة المدخول والمخرجات', condition: 'fluid_imbalance', recommendation: 'Accurate I/O charting. Adjust fluid prescription. Monitor electrolytes', isRead: false, isDismissed: false },

  // ===== PEDIATRIC =====
  { alertType: 'paediatric_growth', severity: 'warning', title: 'Growth Faltering Detected', titleAr: 'تم اكتشاف تباطؤ النمو', message: 'Weight-for-height z-score decreased by >1 SD. Growth monitoring required', messageAr: 'انخفاض درجة z للوزن مقابل الطول بمقدار >1 SD. مراقبة النمو مطلوبة', condition: 'growth_faltering', recommendation: 'Paediatric dietitian referral. Increase calorie density. Monitor growth weekly', isRead: false, isDismissed: false },
  { alertType: 'paediatric_growth', severity: 'critical', title: 'Severe Acute Malnutrition', titleAr: 'سوء التغذية الحاد الوخيم', message: 'MUAC <115mm or weight-for-height z-score <-3. Immediate intervention', messageAr: 'محيط منتصف الذراع <115 مم أو درجة z للوزن مقابل الطول <-3. تدخل فوري', condition: 'sam', recommendation: 'Refer to therapeutic feeding programme. RUTF therapy. Medical assessment', isRead: false, isDismissed: false },

  // ===== LAB =====
  { alertType: 'lab_critical', severity: 'critical', title: 'Critical Lab Value: Haemoglobin', titleAr: 'قيمة مختبر حرجة: هيموغلوبين', message: 'Hb <7 g/dL. Immediate transfusion assessment needed', messageAr: 'الهيموغلوبين <7 غ/دل. تقييم نقل الدم الفوري مطلوب', condition: 'anaemia', recommendation: 'Transfusion assessment. Iron studies. GI bleed workup if indicated', isRead: false, isDismissed: false },
  { alertType: 'lab_critical', severity: 'warning', title: 'Elevated Liver Enzymes', titleAr: 'ارتفاع إنزيمات الكبد', message: 'ALT/AST >3x normal. Review hepatotoxic medications', messageAr: 'ALT/AST >3x الطبيعي. مراجعة الأدوية السامة للكبد', condition: 'hepatic_injury', recommendation: 'Hold hepatotoxic drugs. Monitor LFTs. Hepatology consult. Adjust nutrition support', isRead: false, isDismissed: false },
  { alertType: 'lab_critical', severity: 'warning', title: 'Hypertriglyceridemia in PN', titleAr: 'فرط الدهون الثلاثية في التغذية الوريدية', message: 'Triglycerides >400 mg/dL in patient on PN. Reduce lipid infusion', messageAr: 'الدهون الثلاثية >400 ملغ/دل في مريض على تغذية وريدية. تقليل تسريب الدهون', condition: 'pn_complication', recommendation: 'Reduce or hold IV lipid emulsion. Monitor triglycerides weekly. Check for LPL deficiency', isRead: false, isDismissed: false },
];

export async function seedAlerts(database: Database): Promise<void> {
  const existing = await database.get('clinical_alerts').query().fetchCount();
  if (existing > 0) return;

  const collection = database.get('clinical_alerts');

  await database.write(async () => {
    const records = ALERTS.map((a) =>
      collection.prepareCreate((record: any) => {
        record.alertType = a.alertType;
        record.severity = a.severity;
        record.title = a.title;
        record.titleAr = a.titleAr;
        record.message = a.message;
        record.messageAr = a.messageAr;
        record.condition = a.condition;
        record.recommendation = a.recommendation;
        record.isRead = a.isRead;
        record.isDismissed = a.isDismissed;
        record._raw.created_at = NOW;
        record._raw.updated_at = NOW;
      }),
    );

    await database.batch(records);
  });

  console.log(`[Seed] Clinical alerts: ${ALERTS.length} records`);
}
