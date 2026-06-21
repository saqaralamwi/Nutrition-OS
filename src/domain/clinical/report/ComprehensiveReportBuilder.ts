import { ClinicalEngineOutput } from '../types';
import { VitalsRepository, VitalsRecord } from '../../../data/repositories/VitalsRepository';
import { CardioRepository, CardioAssessmentRecord } from '../../../data/repositories/CardioRepository';
import { SupplementRepository } from '../../../data/repositories/SupplementRepository';
import { PatientRepository } from '../../../data/repositories/PatientRepository';
import { getDatabase } from '../../../data/database';
import { Q } from '@nozbe/watermelondb';
import type { Patient } from '../../../domain/entities/Patient';

export interface ReportSection {
  title: string;
  titleAr: string;
  type: 'info' | 'table' | 'list' | 'grid' | 'alert' | 'narrative';
  content: any;
  headers?: string[];
  rows?: string[][];
}

export interface BuiltReport {
  sections: ReportSection[];
  generatedAt: string;
  reportTitle: string;
  patientName: string;
}

export interface GrowthChartSummary {
  recordDate: string;
  ageMonths: number;
  weightKg?: number;
  heightCm?: number;
  headCircumferenceCm?: number;
  weightZScore?: number;
  heightZScore?: number;
  bmiZScore?: number;
  whoPercentile?: number;
  standardUsed?: string;
}

export interface SupplementRecord {
  id: string;
  supplementName: string;
  dosage?: string;
  supplementType: string;
}

export interface ClinicalReportData {
  patient: Patient;
  vitals: VitalsRecord | null;
  bmi: number;
  bmiCategory: string;
  growthCharts: GrowthChartSummary[];
  cardiovascular: CardioAssessmentRecord | null;
  supplements: SupplementRecord[];
  generatedAt: string;
  reportTitle: string;
}

export class ComprehensiveReportBuilder {
  static async generate(patientId: string): Promise<ClinicalReportData> {
    const patientRepo = new PatientRepository();
    const vitalsRepo = new VitalsRepository();
    const cardioRepo = new CardioRepository();
    const supplementRepo = new SupplementRepository();

    const db = await getDatabase();

    const [patient, latestVitals, cardioAssessment, supplements, growthChartModels] = await Promise.all([
      patientRepo.findById(patientId),
      vitalsRepo.getLatestByPatientId(patientId),
      cardioRepo.getLatestByPatientId(patientId),
      supplementRepo.getByPatientId(patientId),
      db.get('pediatric_growth_charts')
        .query(Q.where('patient_id', patientId), Q.sortBy('record_date', Q.desc))
        .fetch(),
    ]);

    if (!patient) throw new Error(`Patient ${patientId} not found`);

    const weight = latestVitals?.weightKg ?? 70;
    const height = latestVitals?.heightCm ?? 170;
    const bmiVal = latestVitals?.bmi ?? (height > 0 ? weight / Math.pow(height / 100, 2) : 0);

    let bmiCategory: string;
    if (bmiVal < 18.5) bmiCategory = 'underweight';
    else if (bmiVal < 25) bmiCategory = 'normal';
    else if (bmiVal < 30) bmiCategory = 'overweight';
    else bmiCategory = 'obese';

    const growthCharts: GrowthChartSummary[] = growthChartModels.map((m: any) => ({
      recordDate: m.recordDate?.toISOString() || '',
      ageMonths: m.ageMonths,
      weightKg: m.weightKg,
      heightCm: m.heightCm,
      headCircumferenceCm: m.headCircumferenceCm,
      weightZScore: m.weightZScore,
      heightZScore: m.heightZScore,
      bmiZScore: m.bmiZScore,
      whoPercentile: m.whoPercentile,
      standardUsed: m.standardUsed,
    }));

    const supplementRecords: SupplementRecord[] = supplements.map((s: any) => ({
      id: s.id,
      supplementName: s.supplementName,
      dosage: s.dosage,
      supplementType: s.supplementType,
    }));

    return {
      patient,
      vitals: latestVitals,
      bmi: Math.round(bmiVal * 100) / 100,
      bmiCategory,
      growthCharts,
      cardiovascular: cardioAssessment,
      supplements: supplementRecords,
      generatedAt: new Date().toISOString(),
      reportTitle: `التقرير السريري الشامل - ${patient.fullName}`,
    };
  }

  static generateHtmlReport(data: ClinicalReportData): string {
    const p = data.patient;
    const v = data.vitals;
    const c = data.cardiovascular;
    const now = new Date(data.generatedAt);
    const reportId = `RPT-${now.getTime().toString(36).toUpperCase()}`;

    const vitalsRows = [
      ['الوزن (كجم)', v?.weightKg?.toFixed(1) ?? '---'],
      ['الطول (سم)', v?.heightCm?.toFixed(1) ?? '---'],
      ['مؤشر كتلة الجسم', data.bmi.toFixed(1)],
      ['تصنيف BMI', data.bmiCategory === 'underweight' ? 'نقص وزن' : data.bmiCategory === 'normal' ? 'طبيعي' : data.bmiCategory === 'overweight' ? 'زيادة وزن' : 'سمنة'],
      ['درجة الحرارة', v?.temperature != null ? `${v.temperature.toFixed(1)} °C` : '---'],
      ['معدل القلب', v?.heartRate != null ? `${v.heartRate} نبضة/د` : '---'],
      ['ضغط الدم الانقباضي', v?.bpSystolic != null ? `${v.bpSystolic} مم زئبق` : c?.systolicBloodPressure != null ? `${c.systolicBloodPressure} مم زئبق` : '---'],
      ['ضغط الدم الانبساطي', v?.bpDiastolic != null ? `${v.bpDiastolic} مم زئبق` : c?.diastolicBloodPressure != null ? `${c.diastolicBloodPressure} مم زئبق` : '---'],
      ['معدل التنفس', v?.respiratoryRate != null ? `${v.respiratoryRate} نفس/د` : '---'],
      ['تشبع الأكسجين', v?.o2Sat != null ? `${v.o2Sat}%` : '---'],
    ];

    const cardioRows: [string, string][] = [];
    if (c) {
      cardioRows.push(['الوزن الجاف المقاس', `${c.measuredDryWeightKg} كجم`]);
      cardioRows.push(['الكوليسترول الكلي', `${c.totalCholesterol} مغ/دل`]);
      cardioRows.push(['LDL', `${c.ldlCholesterol} مغ/دل`]);
      cardioRows.push(['HDL', `${c.hdlCholesterol} مغ/دل`]);
      cardioRows.push(['الدهون الثلاثية', `${c.triglycerides} مغ/دل`]);
      cardioRows.push(['وذمة محيطية', c.hasPeripheralEdema ? 'نعم' : 'لا']);
      cardioRows.push(['درجة الوذمة', c.edemaGrading]);
    }

    const suppRows = data.supplements.map((s) => [
      s.supplementName,
      s.dosage || '---',
      s.supplementType === 'vitamin' ? 'فيتامين' : s.supplementType === 'mineral' ? 'معدن' : s.supplementType === 'protein' ? 'بروتين' : s.supplementType === 'amino_acid' ? 'أحماض أمينية' : s.supplementType === 'herbal' ? 'أعشاب' : s.supplementType === 'oil' ? 'زيوت' : s.supplementType,
    ]);

    const growthRows = data.growthCharts.slice(0, 5).map((g) => [
      g.recordDate ? new Date(g.recordDate).toLocaleDateString('ar-YE') : '---',
      `${g.ageMonths} شهر`,
      g.weightKg?.toFixed(1) ?? '---',
      g.weightZScore?.toFixed(2) ?? '---',
      g.bmiZScore?.toFixed(2) ?? '---',
    ]);

    const supTable = suppRows.length > 0
      ? `<table><thead><tr><th>الاسم</th><th>الجرعة</th><th>النوع</th></tr></thead><tbody>${suppRows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`
      : '<p style="color:#666; text-align:center;">لا توجد مكملات مسجلة</p>';

    const growthSection = data.growthCharts.length > 0
      ? `<h3 style="color:#1A5276; border-bottom:2px solid #1A5276; padding-bottom:8px; margin-top:24px;">📈 ملخص منحنيات النمو</h3>
<table><thead><tr><th>التاريخ</th><th>العمر</th><th>الوزن (كجم)</th><th>Z-Score للوزن</th><th>Z-Score BMI</th></tr></thead><tbody>${growthRows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`
      : '';

    return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<title>${data.reportTitle}</title>
<style>
  @page { margin: 20mm 15mm; size: A4; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'system-ui', -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;
    color: #000;
    background: #fff;
    padding: 0;
    line-height: 1.6;
    direction: rtl;
    text-align: right;
    font-size: 11pt;
  }
  .header {
    text-align: center;
    border-bottom: 3px solid #1A5276;
    padding-bottom: 16px;
    margin-bottom: 24px;
  }
  .header h1 { font-size: 20pt; color: #1A5276; margin: 0 0 4px; }
  .header .sub { font-size: 10pt; color: #555; }
  .header .meta { font-size: 9pt; color: #777; margin-top: 8px; }
  .section { margin-bottom: 20px; }
  .section-title {
    font-size: 13pt;
    font-weight: bold;
    color: #1A5276;
    border-bottom: 2px solid #1A5276;
    padding-bottom: 6px;
    margin-bottom: 12px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0;
    font-size: 10pt;
  }
  th {
    background: #1A5276;
    color: #fff;
    padding: 8px 10px;
    text-align: center;
    font-weight: 600;
  }
  td {
    padding: 6px 10px;
    border-bottom: 1px solid #ddd;
    text-align: center;
  }
  tr:nth-child(even) td { background: #f5f7fa; }
  .patient-info { margin-bottom: 16px; }
  .patient-info td { text-align: right; }
  .info-label { font-weight: bold; color: #333; width: 140px; }
  .footer {
    text-align: center;
    font-size: 9pt;
    color: #999;
    border-top: 1px solid #ddd;
    padding-top: 12px;
    margin-top: 32px;
  }
  .print-only { display: block; }
  .no-print { display: none; }
  @media print {
    body { color: #000; background: #fff; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
<div class="header">
  <h1>ADCN Clinical — التقرير السريري الشامل</h1>
  <div class="sub">نظام إدارة التغذية العلاجية المتكامل</div>
  <div class="meta">
    <span>التاريخ: ${now.toLocaleDateString('ar-YE')}</span>
    <span> | </span>
    <span>معرف التقرير: ${reportId}</span>
  </div>
</div>

<div class="section">
  <div class="section-title">معلومات المريض</div>
  <table class="patient-info">
    <tr><td class="info-label">اسم المريض</td><td>${p.fullName}</td><td class="info-label">رقم الملف</td><td>${p.fileNumber}</td></tr>
    <tr><td class="info-label">العمر</td><td>${p.age} سنة</td><td class="info-label">الجنس</td><td>${p.gender === 'male' ? 'ذكر' : 'أنثى'}</td></tr>
    <tr><td class="info-label">القسم</td><td>${p.department}</td><td class="info-label">التشخيص</td><td>${p.primaryDiagnosis}</td></tr>
  </table>
</div>

<div class="section">
  <div class="section-title">📏 القياسات الأنثروبومترية (Anthropometrics)</div>
  <table>
    <thead><tr>${vitalsRows.map(r => `<th>${r[0]}</th>`).join('')}</tr></thead>
    <tbody><tr>${vitalsRows.map(r => `<td>${r[1]}</td>`).join('')}</tr></tbody>
  </table>
</div>

${growthSection}

<div class="section">
  <div class="section-title">❤️ تقييم القلب والأوعية الدموية (Cardiovascular Status)</div>
  ${c
    ? `<table><thead><tr>${cardioRows.map(r => `<th>${r[0]}</th>`).join('')}</tr></thead><tbody><tr>${cardioRows.map(r => `<td>${r[1]}</td>`).join('')}</tr></tbody></table>`
    : '<p style="color:#666; text-align:center;">لا يوجد تقييم قلبي وعائي مسجل</p>'}
</div>

<div class="section">
  <div class="section-title">💊 المكملات الغذائية (Supplements)</div>
  ${supTable}
</div>

<div class="footer">
  <p>تم إنشاء هذا التقرير آلياً عبر نظام ADCN Clinical Nutrition Suite</p>
  <p>تاريخ الإنشاء: ${now.toLocaleString('ar-YE')} | جميع الحقوق محفوظة © ${now.getFullYear()}</p>
</div>
</body>
</html>`;
  }

  static build(output: ClinicalEngineOutput): BuiltReport {
    const sections: ReportSection[] = [];
    const { report, patientStory, assessment, protocol, treatmentPlan, interventions, recommendations, monitoringPlan, therapeuticFoods, drugInteractions } = output;

    sections.push(this.headerSection(output));
    sections.push(this.executiveSummarySection(report.executiveSummary));
    sections.push(this.patientInfoSection(report.patientInfo));
    sections.push(this.patientStorySection(patientStory));
    sections.push(this.assessmentSection(assessment));
    sections.push(this.riskAssessmentSection(assessment.risks));
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

  private static assessmentSection(assessment: any): ReportSection {
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
      content: null,
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
      content: null,
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
      content: null,
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
      content: null,
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
      content: null,
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
