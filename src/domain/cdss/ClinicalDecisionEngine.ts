export interface ClinicalRecommendation {
  id: string;
  titleAr: string;
  messageAr: string;
  priority: 'high' | 'medium' | 'low';
  source: string;
}

export class ClinicalDecisionEngine {
  /**
   * Processes ICU patient data to generate nutrition recommendations.
   */
  static analyzeICU(data: {
    nutricScore?: number;
    isHemodynamicallyStable: boolean;
    lactateLevel?: number;
  }): ClinicalRecommendation[] {
    const recs: ClinicalRecommendation[] = [];

    if (!data.isHemodynamicallyStable || (data.lactateLevel && data.lactateLevel > 2)) {
      recs.push({
        id: 'icu_stability_warning',
        titleAr: 'تنبيه الاستقرار السريري',
        messageAr: 'المريض غير مستقر ديناميكياً. يوصى بتأجيل التغذية المعوية حتى استقرار ضغط الدم وانخفاض مستويات اللاكتات.',
        priority: 'high',
        source: 'ASPEN/ESICM Guidelines'
      });
    }

    if (data.nutricScore && data.nutricScore >= 5) {
      recs.push({
        id: 'icu_high_risk',
        titleAr: 'خطر تغذوي مرتفع (NUTRIC)',
        messageAr: 'درجة NUTRIC تشير إلى فائدة عالية من التغذية المبكرة والمكثفة. يوصى بالوصول إلى 80% من الأهداف البروتينية خلال 48-72 ساعة.',
        priority: 'high',
        source: 'NUTRIC Score Protocol'
      });
    }

    return recs;
  }

  /**
   * Processes Oncology data to generate specialized recommendations.
   */
  static analyzeOncology(data: {
    isAtRiskOfRefeeding: boolean;
    treatmentModality?: string;
  }): ClinicalRecommendation[] {
    const recs: ClinicalRecommendation[] = [];

    if (data.isAtRiskOfRefeeding) {
      recs.push({
        id: 'onc_refeeding_risk',
        titleAr: 'خطر متلازمة إعادة التغذية',
        messageAr: 'المريض معرض لخطر إعادة التغذية. ابدأ بـ 25% من الاحتياجات مع مراقبة دقيقة للأملاح (K, P, Mg).',
        priority: 'high',
        source: 'NICE Clinical Guidelines'
      });
    }

    if (data.treatmentModality === 'chemo' || data.treatmentModality === 'radio') {
      recs.push({
        id: 'onc_treatment_support',
        titleAr: 'دعم العلاج الكيميائي/الإشعاعي',
        messageAr: 'توصيات لزيادة البروتين (1.2-1.5 غم/كجم) لتقليل فقدان الكتلة العضلية أثناء العلاج.',
        priority: 'medium',
        source: 'ESPEN Oncology'
      });
    }

    return recs;
  }
}
