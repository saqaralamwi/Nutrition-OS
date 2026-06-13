export interface ClinicalAlert {
  id: string;
  type: 'danger' | 'warning' | 'success';
  category: 'renal' | 'potassium' | 'albumin' | 'glycemic' | 'sodium';
  title: string;
  message: string;
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
 *
 * @param labs Object containing parameters like urea, creatinine, potassium, sodium, albumin, hba1c, random_blood_sugar
 * @param thresholds Custom alert threshold configuration
 */
export function validateLabMetrics(
  labs: any,
  thresholds?: {
    thresholdUrea?: number;
    thresholdCreatinine?: number;
    thresholdPotassium?: number;
    thresholdSodium?: number;
  }
): ClinicalAlert[] {
  if (!labs) return [];

  const alerts: ClinicalAlert[] = [];

  const urea = parseVal(labs.urea);
  const creatinine = parseVal(labs.creatinine);
  const potassium = parseVal(labs.potassium);
  const sodium = parseVal(labs.sodium);
  const albumin = parseVal(labs.albumin);
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

  return alerts;
}
