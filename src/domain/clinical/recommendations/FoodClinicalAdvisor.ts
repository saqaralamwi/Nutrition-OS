export interface IClinicalNotes {
  benefits: string[];
  contraindications: string[];
  servingRecommendation: {
    condition: string;
    amount: string;
    note?: string;
  }[];
}

export type AlertSeverity = 'none' | 'caution' | 'warning' | 'danger';

export interface IFoodClinicalAdvice {
  foodId: string;
  foodNameAr: string;
  condition: string;
  conditionAr: string;
  severity: AlertSeverity;
  isContraindicated: boolean;
  benefits: string[];
  warnings: string[];
  servingRecommendation: string | null;
  nutritionalHighlights: string[];
  contraindicationReason: string | null;
  contraindicationAction: string | null;
}

const CONDITION_MAP: Record<string, string> = {
  diabetes: 'السكري',
  dm: 'السكري',
  hypertension: 'ارتفاع ضغط الدم',
  renal: 'مرض كلوي',
  kidney: 'مرض كلوي',
  ckd: 'مرض كلوي مزمن',
  cardiovascular: 'أمراض القلب والأوعية الدموية',
  heart: 'أمراض القلب',
  obesity: 'السمنة',
  overweight: 'زيادة الوزن',
  malnutrition: 'سوء التغذية',
  underweight: 'نقص الوزن',
  anemia: 'فقر الدم',
  'iron deficiency': 'نقص الحديد',
  gerd: 'الجزر المعدي المريئي',
  ibs: 'متلازمة القولون العصبي',
  'celiac disease': 'الداء البطني (حساسية القمح)',
  'lactose intolerance': 'عدم تحمل اللاكتوز',
  pregnancy: 'الحمل',
  lactation: 'الرضاعة',
  elderly: 'المسنين',
  dysphagia: 'عسر البلع',
  constipation: 'إمساك',
  diarrhea: 'إسهال',
  edematous: 'وذمة',
  acute: 'حالة حادة',
  chronic: 'حالة مزمنة',
  hyperlipidemia: 'فرط شحميات الدم',
  gout: 'النقرس',
  asthma: 'الربو',
};

function detectCondition(diagnosis: string): string {
  const d = diagnosis.toLowerCase();
  for (const [key, ar] of Object.entries(CONDITION_MAP)) {
    if (d.includes(key)) return ar;
  }
  return diagnosis;
}

function computeNutritionalHighlights(
  calories: number, proteinG: number, carbsG: number, fatG: number,
  sodiumMg?: number, potassiumMg?: number, fiberG?: number, sugarG?: number,
): string[] {
  const highlights: string[] = [];
  if (calories > 0) highlights.push(`السعرات: ${Math.round(calories)} كيلو سعر`);
  if (proteinG > 0) highlights.push(`بروتين: ${proteinG.toFixed(1)} جم`);
  if (carbsG > 0) highlights.push(`كربوهيدرات: ${carbsG.toFixed(1)} جم`);
  if (fatG > 0) highlights.push(`دهون: ${fatG.toFixed(1)} جم`);
  if (fiberG != null && fiberG > 0) highlights.push(`ألياف: ${fiberG.toFixed(1)} جم`);
  if (sugarG != null && sugarG > 0) highlights.push(`سكريات: ${sugarG.toFixed(1)} جم`);
  if (sodiumMg != null && sodiumMg > 0) highlights.push(`صوديوم: ${Math.round(sodiumMg)} ملجم`);
  if (potassiumMg != null && potassiumMg > 0) highlights.push(`بوتاسيوم: ${Math.round(potassiumMg)} ملجم`);
  return highlights;
}

function computeDefaultAdvice(
  conditionAr: string, foodNameAr: string,
  calories: number, proteinG: number, carbsG: number, fatG: number,
  fiberG?: number, sugarG?: number, sodiumMg?: number,
  potassiumMg?: number, phosphorusMg?: number, ironMg?: number, vitaminCMg?: number,
): { benefits: string[]; warnings: string[]; serving: string; severity: AlertSeverity } {
  const benefits: string[] = [];
  const warnings: string[] = [];
  let severity: AlertSeverity = 'none';
  let serving = 'كمية معتدلة حسب احتياج المريض اليومي';

  if (proteinG >= 20) {
    benefits.push(`مصدر غني بالبروتين (${proteinG.toFixed(1)} جم) — مفيد لبناء العضلات وتعزيز الشفاء`);
  }
  if (fiberG != null && fiberG >= 3) {
    benefits.push(`غني بالألياف (${fiberG.toFixed(1)} جم) — يعزز صحة الجهاز الهضمي`);
  }
  if (sugarG != null && sugarG <= 2) {
    benefits.push('منخفض السكريات — مناسب للتحكم في سكر الدم');
  }
  if (sodiumMg != null && sodiumMg <= 140) {
    benefits.push('منخفض الصوديوم — مناسب لمرضى ارتفاع ضغط الدم');
  }
  if (calories > 0 && calories <= 150) {
    benefits.push('منخفض السعرات — مناسب لبرامج التحكم في الوزن');
  }
  if (proteinG >= 15 && calories >= 300) {
    benefits.push('غني بالطاقة والبروتين — مناسب لتعزيز الحالة التغذوية');
  }

  if (sodiumMg != null && sodiumMg > 600) {
    warnings.push(`⚠️ يحتوي على كمية عالية من الصوديوم (${Math.round(sodiumMg)} ملجم) — قد يسبب احتباس السوائل وارتفاع ضغط الدم`);
    severity = severity === 'none' ? 'caution' : severity;
    if (sodiumMg > 1000) severity = 'warning';
  }
  if (sugarG != null && sugarG > 20) {
    warnings.push(`⚠️ يحتوي على كمية عالية من السكريات (${sugarG.toFixed(1)} جم) — يرفع سكر الدم`);
    severity = severity === 'none' ? 'caution' : severity;
    if (sugarG > 30) severity = 'warning';
  }
  if (fatG > 20) {
    warnings.push(`⚠️ يحتوي على دهون عالية (${fatG.toFixed(1)} جم) — قد يزيد الشحوم والوزن`);
    if (severity === 'none') severity = 'caution';
  }
  if (calories > 500) {
    warnings.push(`⚠️ وجبة عالية السعرات (${Math.round(calories)} كيلو سعر) — قد تؤثر على الوزن`);
  }

  if (conditionAr.includes('السكري') || conditionAr.includes('سكر')) {
    if (carbsG > 30) {
      warnings.push(`🚨 كربوهيدرات مرتفعة (${carbsG.toFixed(1)} جم) — غير مناسب لمرضى السكري بكميات كبيرة`);
      severity = 'warning';
    }
    if (sugarG != null && sugarG > 10) {
      warnings.push('🚨 يحتوي على سكريات مضافة — غير مناسب لمرضى السكري');
      severity = 'danger';
    }
    if (fiberG != null && fiberG >= 3) {
      benefits.push('الألياف تساعد في تنظيم سكر الدم — مفيد لمرضى السكري');
    }
    serving = '½ حصة (نصف الكمية المعتادة) مع مراقبة سكر الدم بعد الأكل';
  } else if (conditionAr.includes('ضغط') || conditionAr.includes('قلب') || conditionAr.includes('قلبية')) {
    if (sodiumMg != null && sodiumMg > 400) {
      warnings.push(`🚨 صوديوم مرتفع (${Math.round(sodiumMg)} ملجم) — غير مناسب لمرضى ارتفاع الضغط`);
      severity = 'danger';
    }
    if (fatG > 15) {
      warnings.push(`🚨 دهون مرتفعة (${fatG.toFixed(1)} جم) — قد تؤثر على صحة القلب`);
      severity = severity === 'danger' ? 'danger' : 'warning';
    }
    if (potassiumMg != null && potassiumMg > 400) {
      warnings.push(`⚠️ بوتاسيوم مرتفع (${Math.round(potassiumMg)} ملجم) — استشر الطبيب لمرضى الكلى أو القلب`);
      severity = severity === 'danger' ? 'danger' : 'caution';
    }
    serving = 'كمية صغيرة (ربع الحصة) مع مراقبة ضغط الدم';
  } else if (conditionAr.includes('كلوي') || conditionAr.includes('كلى')) {
    if (potassiumMg != null && potassiumMg > 250) {
      warnings.push(`🚨 بوتاسيوم مرتفع (${Math.round(potassiumMg)} ملجم) — غير مناسب لمرضى الكلى`);
      severity = 'danger';
    }
    if (phosphorusMg != null && phosphorusMg > 150) {
      warnings.push('🚨 فوسفور مرتفع — غير مناسب لمرضى الكلى');
      severity = 'danger';
    }
    if (proteinG > 15) {
      warnings.push(`⚠️ بروتين مرتفع (${proteinG.toFixed(1)} جم) — يستشر الطبيب لتحديد الكمية المسموحة`);
      if (severity === 'none') severity = 'caution';
    }
    serving = 'حسب توصية أخصائي التغذية الكلوية';
  } else if (conditionAr.includes('سمنة') || conditionAr.includes('وزن')) {
    if (calories > 300) {
      warnings.push(`⚠️ سعرات مرتفعة (${Math.round(calories)} كيلو سعر) — قد تؤثر على وزن المريض`);
      severity = 'caution';
    }
    if (fiberG != null && fiberG >= 3) {
      benefits.push('الألياف تعزز الشبع — مناسبة لبرامج إنقاص الوزن');
    }
    serving = 'نصف حصة ضمن خطة التحكم بالسعرات اليومية';
  } else if (conditionAr.includes('فقر') || conditionAr.includes('حديد')) {
    if (ironMg != null && ironMg > 2) {
      benefits.push(`مصدر جيد للحديد (${ironMg.toFixed(1)} ملجم) — مفيد لعلاج فقر الدم`);
    }
    if (vitaminCMg != null && vitaminCMg > 10) {
      benefits.push('غني بفيتامين C — يعزز امتصاص الحديد');
    }
  }

  return { benefits, warnings, serving, severity };
}


export class FoodClinicalAdvisor {
  static async getClinicalAdvice(
    foodId: string,
    foodNameAr: string,
    diagnosis: string,
    clinicalNotesJson: string | null | undefined,
    calories: number,
    proteinG: number,
    carbsG: number,
    fatG: number,
    sodiumMg?: number,
    potassiumMg?: number,
    fiberG?: number,
    sugarG?: number,
    ironMg?: number,
    phosphorusMg?: number,
    vitaminCMg?: number,
  ): Promise<IFoodClinicalAdvice> {

    const conditionAr = detectCondition(diagnosis);
    const highlights = computeNutritionalHighlights(calories, proteinG, carbsG, fatG, sodiumMg, potassiumMg, fiberG, sugarG);

    let benefits: string[] = [];
    let warnings: string[] = [];
    let serving: string | null = null;
    let severity: AlertSeverity = 'none';
    let isContraindicated = false;
    let contraindicationReason: string | null = null;
    let contraindicationAction: string | null = null;

    if (clinicalNotesJson) {
      try {
        const notes: IClinicalNotes = JSON.parse(clinicalNotesJson);
        benefits = notes.benefits || [];
        const contraItem = notes.servingRecommendation?.find(
          (s) => conditionAr.includes(s.condition) || s.condition.includes(conditionAr),
        );
        if (contraItem) {
          serving = contraItem.amount;
          if (contraItem.note) warnings.push(contraItem.note);
        }
        if (notes.contraindications?.length > 0) {
          const matched = notes.contraindications.filter((c) =>
            conditionAr.includes(c) || c.includes(conditionAr),
          );
          if (matched.length > 0) {
            isContraindicated = true;
            severity = 'danger';
            contraindicationReason = matched.join('؛ ');
            warnings.push(`🚨 ممنوع: ${matched.join('؛ ')}`);
          }
        }
      } catch { /* ignore parse errors */ }
    }

    const defaultAdvice = computeDefaultAdvice(
      conditionAr,
      foodNameAr,
      calories,
      proteinG,
      carbsG,
      fatG,
      fiberG,
      sugarG,
      sodiumMg,
      potassiumMg,
      phosphorusMg,
      ironMg,
      vitaminCMg,
    );
    if (benefits.length === 0) benefits = defaultAdvice.benefits;
    if (!serving) serving = defaultAdvice.serving;
    if (warnings.length === 0) {
      warnings = defaultAdvice.warnings;
      severity = defaultAdvice.severity;
    }

    if (!serving) serving = 'كمية معتدلة حسب احتياج المريض اليومي';

    return {
      foodId,
      foodNameAr,
      condition: diagnosis,
      conditionAr,
      severity,
      isContraindicated,
      benefits: benefits.slice(0, 5),
      warnings: warnings.slice(0, 4),
      servingRecommendation: serving,
      nutritionalHighlights: highlights,
      contraindicationReason,
      contraindicationAction,
    };
  }
}
