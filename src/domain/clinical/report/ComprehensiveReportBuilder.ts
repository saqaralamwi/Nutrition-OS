import { ClinicalEngineOutput } from '../types';

export interface ReportSection {
  title: string;
  titleAr: string;
  type: 'info' | 'table' | 'list' | 'grid' | 'alert' | 'narrative';
  content: any;
}

export interface BuiltReport {
  sections: ReportSection[];
  generatedAt: string;
  reportTitle: string;
  patientName: string;
}

export class ComprehensiveReportBuilder {
  static build(output: ClinicalEngineOutput): BuiltReport {
    const sections: ReportSection[] = [];
    const { report, patientStory, clinicalAssessment, protocol, treatmentPlan, interventions, recommendations, monitoringPlan, therapeuticFoods, drugInteractions } = output;

    sections.push(this.headerSection(output));
    sections.push(this.executiveSummarySection(report.executiveSummary));
    sections.push(this.patientInfoSection(report.patientInfo));
    sections.push(this.patientStorySection(patientStory));
    sections.push(this.clinicalAssessmentSection(clinicalAssessment));
    sections.push(this.riskAssessmentSection(clinicalAssessment.risks));
    sections.push(this.protocolSection(protocol));
    sections.push(this.treatmentPlanSection(treatmentPlan));
    sections.push(this.macronutrientTableSection(treatmentPlan));
    if (therapeuticFoods && therapeuticFoods.length > 0) {
      sections.push(this.therapeuticFoodsSection(therapeuticFoods));
    }
    if (drugInteractions && drugInteractions.length > 0) {
      sections.push(this.drugInteractionsSection(drugInteractions));
    }
    sections.push(this.interventionsSection(interventions));
    sections.push(this.recommendationsSection(recommendations));
    sections.push(this.monitoringSection(monitoringPlan));
    if (report.alerts.length > 0) {
      sections.push(this.alertsSection(report.alerts));
    }
    sections.push(this.conclusionSection(report.conclusion));

    return {
      sections,
      generatedAt: report.generatedAt,
      reportTitle: `التقرير السريري التغذوي الشامل - ${protocol.nameAr}`,
      patientName: report.patientInfo.name,
    };
  }

  private static headerSection(output: ClinicalEngineOutput): ReportSection {
    return {
      title: 'نظام إدارة التغذية العلاجية المتكامل',
      titleAr: 'نظام إدارة التغذية العلاجية المتكامل - ADCN Clinical',
      type: 'info',
      content: {
        subtitle: 'التقرير السريري التغذوي الشامل',
        date: new Date().toLocaleString('ar-YE'),
        reportId: `RPT-${Date.now().toString(36).toUpperCase()}`,
      },
    };
  }

  private static executiveSummarySection(summary: string): ReportSection {
    return {
      title: 'Executive Summary',
      titleAr: 'الملخص التنفيذي',
      type: 'narrative',
      content: summary,
    };
  }

  private static patientInfoSection(info: any): ReportSection {
    return {
      title: 'Patient Information',
      titleAr: 'معلومات المريض الأساسية',
      type: 'grid',
      content: [
        { label: 'اسم المريض', value: info.name },
        { label: 'العمر', value: `${info.age} سنة` },
        { label: 'الجنس', value: info.gender },
        { label: 'الوزن', value: `${info.weight} كلغ` },
        { label: 'الطول', value: `${info.height} سم` },
        { label: 'مؤشر كتلة الجسم', value: info.bmi.toFixed(1) },
        { label: 'القسم', value: info.department },
        { label: 'التشخيص', value: info.diagnosis },
      ],
    };
  }

  private static patientStorySection(story: any): ReportSection {
    return {
      title: 'Patient Story',
      titleAr: 'قصة المريض السريرية',
      type: 'narrative',
      content: story.narrative,
    };
  }

  private static clinicalAssessmentSection(assessment: any): ReportSection {
    return {
      title: 'Clinical Assessment',
      titleAr: 'التقييم السريري',
      type: 'grid',
      content: [
        { label: 'التشخيص الغذائي', value: assessment.nutritionalDiagnosis, severity: assessment.severity === 'critical' ? 'danger' : assessment.severity === 'severe' ? 'warning' : 'normal' },
        { label: 'الشدة السريرية', value: assessment.severity, severity: assessment.severity === 'critical' ? 'danger' : assessment.severity === 'severe' ? 'warning' : 'normal' },
        { label: 'المشاكل', value: assessment.problems.join('، ') },
        { label: 'الأهداف', value: assessment.goals.join('، ') },
      ],
    };
  }

  private static riskAssessmentSection(risks: any): ReportSection {
    return {
      title: 'Risk Assessment',
      titleAr: 'تقييم المخاطر',
      type: 'table',
      headers: ['المخاطرة', 'المستوى', 'الدرجة'],
      rows: [
        ['متلازمة إعادة التغذية', risks.refeeding.riskLevel, `${risks.refeeding.riskScore}/6`],
        ['فرط التغذية', risks.overfeeding.riskLevel, `${risks.overfeeding.riskScore}/6`],
        ['هزال العضلات', risks.muscleWasting.riskLevel, `${risks.muscleWasting.riskScore}/6`],
        ['فرط سكر الدم', risks.hyperglycemia.riskLevel, `${risks.hyperglycemia.riskScore}/6`],
        ['سوء التغذية', risks.malnutrition.riskLevel, `${risks.malnutrition.riskScore}/6`],
      ],
    };
  }

  private static protocolSection(protocol: any): ReportSection {
    return {
      title: 'Clinical Protocol',
      titleAr: 'البروتوكول السريري المطبق',
      type: 'grid',
      content: [
        { label: 'البروتوكول', value: protocol.nameAr },
        { label: 'المرحلة', value: protocol.phase },
        { label: 'الإرشادات', value: protocol.guidelines.join('، ') },
        { label: 'اعتبارات خاصة', value: protocol.specialConsiderations.join('; ') },
        { label: 'موانع', value: protocol.contraindications.length > 0 ? protocol.contraindications.join('، ') : 'لا توجد' },
        { label: 'مراقبة', value: protocol.monitoringRequirements.join('، ') },
      ],
    };
  }

  private static treatmentPlanSection(plan: any): ReportSection {
    return {
      title: 'Treatment Plan',
      titleAr: 'الخطة العلاجية',
      type: 'grid',
      content: [
        { label: 'السعرات الحرارية', value: `${plan.nutrition.calories} ك.ك/يوم` },
        { label: 'البروتين', value: `${plan.nutrition.protein} غ/يوم (${plan.nutrition.proteinPerKg} غ/كلغ)` },
        { label: 'الكربوهيدرات', value: `${plan.nutrition.carbs} غ/يوم (${plan.nutrition.carbsPercent}%)` },
        { label: 'الدهون', value: `${plan.nutrition.fat} غ/يوم (${plan.nutrition.fatPercent}%)` },
        { label: 'السوائل', value: `${plan.nutrition.fluid} مل/يوم` },
        { label: 'المتابعة', value: plan.followUp.join('; ') },
        { label: 'التوقعات', value: plan.expectations },
      ],
    };
  }

  private static macronutrientTableSection(plan: any): ReportSection {
    const total = plan.nutrition.calories;
    return {
      title: 'Macronutrient Distribution',
      titleAr: 'توزيع المغذيات الكبرى',
      type: 'table',
      headers: ['المغذي', 'الجرام/يوم', 'السعرات', 'النسبة المئوية'],
      rows: [
        ['البروتين', `${plan.nutrition.protein} غ`, `${plan.nutrition.protein * 4} ك.ك`, `${total > 0 ? Math.round(plan.nutrition.protein * 4 / total * 100) : 0}%`],
        ['الكربوهيدرات', `${plan.nutrition.carbs} غ`, `${plan.nutrition.carbs * 4} ك.ك`, `${total > 0 ? Math.round(plan.nutrition.carbs * 4 / total * 100) : 0}%`],
        ['الدهون', `${plan.nutrition.fat} غ`, `${plan.nutrition.fat * 9} ك.ك`, `${total > 0 ? Math.round(plan.nutrition.fat * 9 / total * 100) : 0}%`],
        ['المجموع', '', `${total} ك.ك`, '100%'],
      ],
    };
  }

  private static therapeuticFoodsSection(foods: any[]): ReportSection {
    const severityMap: Record<string, string> = {
      blood_sugar_control: 'مفيد لسكر الدم',
      blood_sugar_lowering: 'خافض لسكر الدم',
      anti_inflammatory: 'مضاد للالتهابات',
      antioxidant: 'مضاد للأكسدة',
      immune_booster: 'معزز للمناعة',
      immune_support: 'داعم للمناعة',
      heart_healthy: 'مفيد للقلب',
      cholesterol_lowering: 'خافض للكوليسترول',
      blood_pressure_lowering: 'خافض للضغط',
      digestive_aid: 'مساعد للهضم',
      fiber_rich: 'غني بالألياف',
      probiotic: 'بروبيوتيك',
      wound_healing: 'مساعد لالتئام الجروح',
      high_protein: 'غني بالبروتين',
      calcium_source: 'مصدر كالسيوم',
      antimicrobial: 'مضاد للميكروبات',
      omega_3_source: 'مصدر أوميغا 3',
      energy_source: 'مصدر طاقة',
      natural_laxative: 'ملين طبيعي',
      lactation_aid: 'مساعدة للرضاعة',
      anti_asthmatic: 'مضاد للربو',
      antihistamine: 'مضاد للحساسية',
      liver_protection: 'واقي للكبد',
      joint_health: 'صحة المفاصل',
      anti_nausea: 'مضاد للغثيان',
      calming: 'مهدئ',
      sleep_aid: 'مساعدة للنوم',
      beta_glucan: 'غني بالبيتا جلوكان',
      lignans: 'غني باللجنان',
      satiety: 'زيادة الشعور بالشبع',
    };

    return {
      title: 'Therapeutic Food Recommendations',
      titleAr: 'توصيات الأغذية العلاجية',
      type: 'table',
      headers: ['الغذاء', 'الفائدة العلاجية', 'السعرات/100غ', 'البروتين/100غ'],
      rows: foods.map((f: any) => [
        f.nameAr,
        severityMap[f.benefit] || f.benefit,
        `${f.caloriesPer100g} ك.ك`,
        `${f.proteinPer100g} غ`,
      ]),
    };
  }

  private static drugInteractionsSection(interactions: any[]): ReportSection {
    return {
      title: 'Drug-Nutrient Interactions',
      titleAr: 'التفاعلات الدوائية-الغذائية',
      type: 'table',
      headers: ['المادة الفعالة', 'الشدة السريرية', 'الإجراء الغذائي المطلوب'],
      rows: interactions.map((d: any) => [
        d.ingredient,
        d.severity === 'high' ? '🔴 شديد' : d.severity === 'moderate' ? '🟡 متوسط' : '🟢 بسيط',
        d.action,
      ]),
    };
  }

  private static interventionsSection(interventions: any): ReportSection {
    return {
      title: 'Interventions',
      titleAr: 'التدخلات العلاجية',
      type: 'list',
      content: [
        { label: 'تدخلات فورية', items: interventions.immediate },
        { label: 'تدخلات قصيرة المدى', items: interventions.shortTerm },
        { label: 'تدخلات طويلة المدى', items: interventions.longTerm },
        { label: 'التدخلات التعليمية', items: interventions.education },
      ],
    };
  }

  private static recommendationsSection(recommendations: any[]): ReportSection {
    return {
      title: 'Recommendations',
      titleAr: 'التوصيات السريرية',
      type: 'table',
      headers: ['الأولوية', 'الفئة', 'العنوان', 'الوصف'],
      rows: recommendations.map((r) => [
        r.priority === 'critical' ? 'حرج' : r.priority === 'high' ? 'عالية' : r.priority === 'medium' ? 'متوسطة' : 'منخفضة',
        r.category,
        r.titleAr,
        r.descriptionAr,
      ]),
    };
  }

  private static monitoringSection(monitoring: any): ReportSection {
    return {
      title: 'Monitoring Plan',
      titleAr: 'خطة المراقبة والمتابعة',
      type: 'grid',
      content: [
        { label: 'التواتر', value: monitoring.frequency },
        { label: 'معايير المراقبة', value: monitoring.parameters.join('، ') },
        { label: 'الفحوصات', value: monitoring.tests.join('، ') },
        { label: 'جدول المتابعة', value: monitoring.followUpSchedule },
        { label: 'معايير إعادة التقييم', value: monitoring.reassessmentCriteria.join('، ') },
      ],
    };
  }

  private static alertsSection(alerts: string[]): ReportSection {
    return {
      title: 'Clinical Alerts',
      titleAr: 'التنبيهات السريرية',
      type: 'alert',
      content: alerts,
    };
  }

  private static conclusionSection(conclusion: string): ReportSection {
    return {
      title: 'Conclusion',
      titleAr: 'الخلاصة والتوصيات النهائية',
      type: 'narrative',
      content: conclusion,
    };
  }
}
