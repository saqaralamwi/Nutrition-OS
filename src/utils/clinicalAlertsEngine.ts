export interface ClinicalAlert {
  id: string;
  type: 'danger' | 'warning' | 'success';
  category: 'renal' | 'potassium' | 'albumin' | 'glycemic' | 'sodium' | 'refeeding' | 'monitoring' | 'hypoglycemia' | 'overfeeding';
  title: string;
  message: string;
  code?: string;
  action?: string;
  actionEn?: string;
  recommendedCaloriesDay1?: number;
  recommendedCaloriesDay2?: number;
  recommendedCaloriesDay3?: number;
}

const parseVal = (val: any): number | undefined => {
  if (val === null || val === undefined) return undefined;
  if (typeof val === 'number') {
    return isNaN(val) ? undefined : val;
  }
  const parsed = parseFloat(String(val));
  return isNaN(parsed) ? undefined : parsed;
};

/**
 * Evaluates lab metrics and generates targeted Arabic clinical diet alerts.
 * Supports camelCase, snake_case, and custom lab mapping conventions.
 * Adds Refeeding Syndrome risk verification (ESICM guidelines) and low limit checks.
 *
 * @param labs Object containing parameters like urea, creatinine, potassium, sodium, albumin, hba1c, blood glucose, phosphorus, magnesium
 * @param thresholds Custom alert threshold configuration
 * @param patientContext Patient clinical metrics context (weight, BMI, NPO duration, malnutrition)
 */
export function validateLabMetrics(
  labs: any,
  thresholds?: {
    thresholdUrea?: number;
    thresholdCreatinine?: number;
    thresholdPotassium?: number;
    thresholdSodium?: number;
  },
  patientContext?: {
    weightKg?: number;
    bmi?: number;
    weightLossPercent?: number;
    npoDays?: number;
    hasMalnutrition?: boolean;
  }
): ClinicalAlert[] {
  if (!labs) return [];

  const alerts: ClinicalAlert[] = [];

  const urea = parseVal(labs.urea);
  const creatinine = parseVal(labs.creatinine);
  const potassium = parseVal(labs.potassium);
  const sodium = parseVal(labs.sodium);
  const albumin = parseVal(labs.albumin);
  const phosphorus = parseVal(labs.phosphorus);
  const magnesium = parseVal(labs.magnesium);
  const hba1c = parseVal(labs.hba1c) ?? parseVal(labs.hbA1c);
  const randomBloodSugar = parseVal(labs.random_blood_sugar) 
    ?? parseVal(labs.randomBloodSugar) 
    ?? parseVal(labs.bloodGlucose);

  const tUrea = thresholds?.thresholdUrea ?? 40;
  const tCreatinine = thresholds?.thresholdCreatinine ?? 1.2;
  const tPotassium = thresholds?.thresholdPotassium ?? 5.0;
  const tSodium = thresholds?.thresholdSodium ?? 145;

  // A. Renal Impairment Warning
  if ((urea !== undefined && urea > tUrea) || (creatinine !== undefined && creatinine > tCreatinine)) {
    alerts.push({
      id: 'renal_alert',
      type: 'danger',
      category: 'renal',
      title: '⚠️ تنبيه: اعتلال كلوى أو تصفية منخفضة',
      message: `يرجى مراجعة وتعديل أهداف البروتين الكلية بدقة، ومراقبة توازن السوائل (Fluid Balance) لتجنب الإجهاد الكلوي. (حد الإنذار: يوريا > ${tUrea}، كرياتينين > ${tCreatinine})`,
    });
  }

  // B. Hyperkalemia Warning
  if (potassium !== undefined && potassium > tPotassium) {
    alerts.push({
      id: 'potassium_alert',
      type: 'danger',
      category: 'potassium',
      title: '⚠️ خطر: فرط بوتاسيوم الدم',
      message: `نتائج المختبر تشير لارتفاع البوتاسيوم. يرجى استبعاد الأغذية والمكونات الغنية بالبوتاسيوم (مثل الطماطم، الموز، المرق) وتعديل خطة المحاليل فوراً. (حد الإنذار: > ${tPotassium})`,
    });
  }

  // C. Severe Hypoalbuminemia Warning
  if (albumin !== undefined && albumin < 3.0) {
    alerts.push({
      id: 'albumin_alert',
      type: 'warning',
      category: 'albumin',
      title: '📢 إشعار: نقص ألبومين الدم الحاد',
      message: 'المريض يعاني من سوء تغذية بروتيني حاد أو متلازمة نفروزية. يرجى رفع أهداف البروتين السريرية تدريجياً لتعويض الفقد.',
    });
  }

  // D. Hyperglycemia / Diabetes Warning
  if ((hba1c !== undefined && hba1c > 6.5) || (randomBloodSugar !== undefined && randomBloodSugar > 140)) {
    alerts.push({
      id: 'glycemic_alert',
      type: 'warning',
      category: 'glycemic',
      title: '⚠️ تنبيه: عدم انضباط سكر الدم',
      message: 'يرجى حساب الحمل الجليسمي (Glycemic Load) للوجبات بدقة وتقييد الكربوهيدرات السريعة بما يتوافق مع توصيات جمعية السكري الأمريكية (ADA).',
    });
  }

  // E. Hypernatremia Warning
  if (sodium !== undefined && sodium > tSodium) {
    alerts.push({
      id: 'sodium_alert',
      type: 'danger',
      category: 'sodium',
      title: '⚠️ خطر: فرط صوديوم الدم',
      message: `نتائج المختبر تشير لارتفاع الصوديوم. يرجى مراجعة محتوى الصوديوم في التغذية والمحاليل الوريدية وضبط السوائل. (حد الإنذار: > ${tSodium})`,
    });
  }

  // F. Refeeding Syndrome Detection Engine (ESICM / ASPEN Guidelines)
  const hasLowPhosphorus = phosphorus !== undefined && phosphorus < 0.8;
  const hasLowPotassium = potassium !== undefined && potassium < 3.5;
  const hasLowMagnesium = magnesium !== undefined && magnesium < 0.7;
  const hasSevereMalnutrition = (patientContext?.bmi !== undefined && patientContext.bmi < 16) || patientContext?.hasMalnutrition === true;
  const hasNoIntake5Days = patientContext?.npoDays !== undefined && patientContext.npoDays >= 5;
  const hasWeightLoss10Percent = patientContext?.weightLossPercent !== undefined && patientContext.weightLossPercent > 10;

  const riskScore =
    (hasLowPhosphorus ? 2 : 0) +
    (hasLowPotassium ? 2 : 0) +
    (hasLowMagnesium ? 2 : 0) +
    (hasSevereMalnutrition ? 3 : 0) +
    (hasNoIntake5Days ? 1 : 0) +
    (hasWeightLoss10Percent ? 1 : 0);

  const weight = patientContext?.weightKg ?? 70;

  if (riskScore >= 3) {
    alerts.push({
      id: 'refeeding_high_risk',
      type: 'danger',
      category: 'refeeding',
      title: '🚨 خطر عالي لمتلازمة إعادة التغذية (Refeeding Syndrome)',
      message: `المريض في مرحلة خطورة حرجة (${riskScore}/6). الإجراءات الفورية المطلوبة: 1. تقييد السعرات في اليوم الأول إلى 10 kcal/kg (الحد الأقصى: ${Math.round(10 * weight)} سعرة). 2. فحص وتعويض الفوسفور والبوتاسيوم والمغنيسيوم قبل وأثناء البدء. 3. فحص سكر الدم كل 6 ساعات.`,
      code: 'REFEEDING_SYNDROME_HIGH_RISK',
      action: 'تقييد السعرات: 10 kcal/kg يوم 1، مع تدرج حذر فوسفات/بوتاسيوم',
      actionEn: 'Restrict energy intake to 10 kcal/kg Day 1, with electrolyte replenishment',
      recommendedCaloriesDay1: 10 * weight,
      recommendedCaloriesDay2: 12 * weight,
      recommendedCaloriesDay3: 15 * weight,
    });

    alerts.push({
      id: 'refeeding_monitoring_required',
      type: 'warning',
      category: 'monitoring',
      title: '📋 بروتوكول المراقبة اليومية للمحاليل والإلكتروليتات',
      message: 'نظراً لارتفاع خطر متلازمة إعادة التغذية، يرجى إجراء فحص دم يومي لقياس الفوسفور، البوتاسيوم، المغنيسيوم، ومراقبة ضربات القلب وتوازن السوائل بدقة.',
      code: 'ELECTROLYTE_MONITORING_REQUIRED',
      action: 'مراقبة الإلكتروليتات اليومية',
    });
  } else if (riskScore > 0) {
    alerts.push({
      id: 'refeeding_medium_risk',
      type: 'warning',
      category: 'refeeding',
      title: '⚠️ خطر متوسط لمتلازمة إعادة التغذية (Refeeding Syndrome)',
      message: `المريض لديه خطر متوسط (${riskScore}/6). يوصى بالبدء بنظام تغذية متحفظ يتراوح بين 12-15 kcal/kg في اليوم الأول (الحد الأقصى: ${Math.round(12 * weight)} سعرة)، مع زيادة تدريجية ومراقبة دورية للإلكتروليتات.`,
      code: 'REFEEDING_SYNDROME_MEDIUM_RISK',
      action: 'تقييد السعرات: 12-15 kcal/kg يوم 1',
      actionEn: 'Restrict energy intake to 12-15 kcal/kg Day 1',
      recommendedCaloriesDay1: 12 * weight,
      recommendedCaloriesDay2: 14 * weight,
      recommendedCaloriesDay3: 16 * weight,
    });
  }

  // G. Hypoglycemia (Lower Limits)
  if (randomBloodSugar !== undefined && randomBloodSugar < 70) {
    alerts.push({
      id: 'hypoglycemia_alert',
      type: 'danger',
      category: 'hypoglycemia',
      title: '🚨 حالة طارئة: انخفاض حاد في سكر الدم (Hypoglycemia)',
      message: `مستوى السكر المسجل منخفض جداً (${randomBloodSugar} mg/dL). يرجى إعطاء الجلوكوز/الكربوهيدرات سريعة الامتصاص فوراً وفقاً لبروتوكول نقص السكر في المستشفى لتفادي غيبوبة السكر.`,
      action: 'حقن جلوكوز وريدي 10% أو 50% فوراً وإعادة الفحص بعد 15 دقيقة',
    });
  }

  // H. Critical Electrolyte Lower Limits
  if (hasLowPhosphorus) {
    alerts.push({
      id: 'hypophosphatemia_alert',
      type: 'danger',
      category: 'potassium',
      title: '🚨 خطر: نقص فوسفات الدم الحاد (Hypophosphatemia)',
      message: `مستوى الفوسفور منخفض (${phosphorus} mmol/L). خطر حدوث متلازمة إعادة التغذية قاتل. يرجى التوقف عن زيادة التغذية وتعويض الفوسفور وريدياً فوراً.`,
      action: 'تعويض الفوسفور وريدياً وتجميد زيادة السعرات',
    });
  }

  if (hasLowPotassium) {
    alerts.push({
      id: 'hypokalemia_alert',
      type: 'danger',
      category: 'potassium',
      title: '🚨 خطر: نقص بوتاسيوم الدم الحاد (Hypokalemia)',
      message: `مستوى البوتاسيوم منخفض جداً (${potassium} mEq/L). خطر حدوث توقف عضلة القلب أو اختلال النظم الكهربائي مرتفع. تعويض البوتاسيوم فوري ومطلوب.`,
      action: 'حقن كلوريد البوتاسيوم وريدياً مع المراقبة المستمرة لمخطط القلب ECG',
    });
  }

  if (hasLowMagnesium) {
    alerts.push({
      id: 'hypomagnesemia_alert',
      type: 'danger',
      category: 'potassium',
      title: '⚠️ تنبيه: نقص مغنيسيوم الدم (Hypomagnesemia)',
      message: `مستوى المغنيسيوم منخفض (${magnesium} mEq/L). قد يعيق تصحيح البوتاسيوم ويزيد من خطر النوبات الصرعية واخلال كهرباء القلب.`,
      action: 'تعويض كبريتات المغنيسيوم',
    });
  }

  return alerts;
}

export function checkOverfeedingRisk(
  requirements: any,
  enteralIntake: number,
  parenteralIntake: number
): ClinicalAlert | null {
  const totalIntake = enteralIntake + parenteralIntake;
  const targetCalories = requirements.calories ?? requirements.targetCalories ?? 0;
  const hiddenCalories = requirements.hiddenCalories?.total ?? requirements.hidden_calories_total ?? 0;

  if (targetCalories <= 0) return null;

  // The actual calories received is nutrition (intake) + hidden calories (propofol, dextrose, etc.)
  const actualCalories = totalIntake + hiddenCalories;
  
  // Overfeeding check: actual received calories exceed target by > 10%
  const excessPercent = ((actualCalories - targetCalories) / targetCalories) * 100;

  if (excessPercent > 10) {
    const propofolCal = requirements.hiddenCalories?.propofol ?? requirements.hidden_calories_propofol ?? 0;
    const dextroseCal = requirements.hiddenCalories?.dextrose ?? requirements.hidden_calories_dextrose ?? 0;
    const midolCal = requirements.hiddenCalories?.midol ?? requirements.hidden_calories_midol ?? 0;
    const lipidsCal = requirements.hiddenCalories?.lipids ?? requirements.hidden_calories_lipids ?? 0;

    const reasons: string[] = [];
    if (propofolCal > 0) reasons.push(`• البروفوفول: ${propofolCal.toFixed(0)} سعرة/يوم`);
    if (dextroseCal > 0) reasons.push(`• الدكستروز الوريدي: ${dextroseCal.toFixed(0)} سعرة/يوم`);
    if (midolCal > 0) reasons.push(`• الميدازولام: ${midolCal.toFixed(0)} سعرة/يوم`);
    if (lipidsCal > 0) reasons.push(`• الدهون الإضافية: ${lipidsCal.toFixed(0)} سعرة/يوم`);

    const netTarget = Math.max(0, targetCalories - hiddenCalories);

    return {
      id: 'overfeeding_alert_' + Date.now(),
      type: 'danger',
      category: 'overfeeding',
      title: '🚨 خطر فرط التغذية (Overfeeding Risk)',
      message: `السعرات الإجمالية الفعلية المستلمة (${actualCalories.toFixed(0)} سعرة/يوم) تتجاوز الاحتياجات المستهدفة (${targetCalories.toFixed(0)} سعرة/يوم) بمقدار ${excessPercent.toFixed(1)}%.

السعرات المخفية من الأدوية والمحاليل: ${hiddenCalories.toFixed(0)} سعرة/يوم.
${reasons.length > 0 ? `الأسباب التفصيلية:\n${reasons.join('\n')}\n` : ''}
الإجراء الموصى به:
1. تقليل حجم التغذية الأنبوبية أو الوريدية لتغطية السعرات الصافية المطلوبة فقط.
2. الهدف الجديد للتغذية: ${netTarget.toFixed(0)} سعرة/يوم.
3. مراقبة سكر الدم ومستوى الدهون الثلاثية كل 6-12 ساعة.`,
      code: 'OVERFEEDING_RISK',
      action: `تقليل سعرات التغذية، السعرات الصافية المطلوبة: ${netTarget.toFixed(0)} سعرة/يوم`,
    };
  }

  return null;
}

