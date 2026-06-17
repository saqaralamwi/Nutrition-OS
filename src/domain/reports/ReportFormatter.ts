import { IUniversalReportPayload } from '../use-cases/GenerateUniversalReportUseCase';

export class ReportFormatter {
  /**
   * Generates an isolated, medical-grade bilingual HTML clinical report.
   * Completely decoupled from the application dashboard UI.
   */
  public static toHTML(payload: IUniversalReportPayload): string {
    const { 
      patientProfile, 
      screening, 
      anthropometrics, 
      clinicalCalculations, 
      specializedMetrics, 
      alerts, 
      interventionSummary,
      header
    } = payload;

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>Clinical Report - ${patientProfile.fileNumber}</title>
        <style>
          /* MEDICAL GRADE PRINT STYLES */
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #1a202c;
            line-height: 1.5;
            direction: rtl;
            background-color: #fff;
            margin: 0;
            padding: 0;
            font-size: 11pt;
          }
          .hospital-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2.5pt solid #2d3748;
            padding-bottom: 10mm;
            margin-bottom: 8mm;
          }
          .hospital-brand h1 {
            color: #2c5282;
            margin: 0;
            font-size: 18pt;
            font-weight: 800;
          }
          .hospital-brand p {
            margin: 2pt 0;
            font-size: 9pt;
            color: #718096;
            font-weight: 600;
          }
          .confidential-tag {
            background-color: #ebf8ff;
            color: #2c5282;
            padding: 4pt 8pt;
            border-radius: 4pt;
            font-size: 8pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5pt;
          }

          /* GRID SYSTEM FOR MEDICAL CHARTS */
          .section {
            margin-bottom: 8mm;
            page-break-inside: avoid;
          }
          .section-title {
            background-color: #f7fafc;
            border-right: 4pt solid #2c5282;
            padding: 4pt 10pt;
            font-weight: 700;
            font-size: 12pt;
            color: #2d3748;
            margin-bottom: 4mm;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .clinical-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10pt;
          }
          .data-point {
            display: flex;
            justify-content: space-between;
            border-bottom: 0.5pt solid #edf2f7;
            padding: 4pt 0;
          }
          .label {
            color: #718096;
            font-weight: 500;
            font-size: 9pt;
          }
          .value {
            font-weight: 700;
            color: #1a202c;
            text-align: left;
          }

          /* TABLES */
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4mm;
          }
          th {
            background-color: #edf2f7;
            color: #4a5568;
            font-weight: 700;
            text-align: right;
            padding: 6pt 10pt;
            font-size: 9pt;
            border: 0.5pt solid #cbd5e0;
          }
          td {
            padding: 6pt 10pt;
            font-size: 10pt;
            border: 0.5pt solid #e2e8f0;
          }

          /* ALERTS & STATUS */
          .alert-box {
            background-color: #fff5f5;
            border: 1pt solid #feb2b2;
            border-radius: 4pt;
            padding: 8pt;
            margin-top: 4mm;
          }
          .alert-item {
            color: #c53030;
            font-weight: 600;
            font-size: 9pt;
            margin-bottom: 2pt;
          }
          .status-indicator {
            display: inline-block;
            width: 6pt;
            height: 6pt;
            border-radius: 50%;
            margin-left: 4pt;
          }
          .status-danger { background-color: #f56565; }
          .status-warning { background-color: #ed8936; }

          /* HIDE APP UI ELEMENTS JUST IN CASE */
          button, .no-print, nav, .toast-container, [role="button"] {
            display: none !important;
          }

          .footer {
            margin-top: 15mm;
            border-top: 0.5pt solid #e2e8f0;
            padding-top: 5mm;
            text-align: center;
            font-size: 8pt;
            color: #a0aec0;
          }
          .signature-line {
            margin-top: 10mm;
            display: flex;
            justify-content: flex-start;
            gap: 20mm;
          }
          .sig-box {
            border-top: 1pt solid #2d3748;
            width: 50mm;
            padding-top: 2pt;
            text-align: center;
            font-size: 9pt;
          }
        </style>
      </head>
      <body>
        <div class="hospital-header">
          <div class="hospital-brand">
            <h1>Clinical ADCN / نظام التغذية العلاجية</h1>
            <p>Integrated Nutritional Intelligence OS v3.0</p>
          </div>
          <div class="confidential-tag">MEDICAL CONFIDENTIAL / سري طبي</div>
        </div>

        <!-- 1. PATIENT CORE PROFILE -->
        <div class="section">
          <div class="section-title">
            <span>👤 ملف الحالة (Patient Profile)</span>
            <span style="font-size: 9pt; color: #718096;">Generated: ${header.generatedAt}</span>
          </div>
          <div class="clinical-grid">
            <div class="data-point"><span class="label">اسم المريض (Full Name):</span> <span class="value">${patientProfile.fullName}</span></div>
            <div class="data-point"><span class="label">رقم الملف (MRN):</span> <span class="value">${patientProfile.fileNumber}</span></div>
            <div class="data-point"><span class="label">العمر (Age):</span> <span class="value">${patientProfile.age} Yrs</span></div>
            <div class="data-point"><span class="label">الجنس (Gender):</span> <span class="value">${patientProfile.gender === 'male' ? 'ذكر' : 'أنثى'}</span></div>
            <div class="data-point" style="grid-column: span 2;"><span class="label">التشخيص الرئيسي (Primary Diagnosis):</span> <span class="value">${patientProfile.diagnosis}</span></div>
          </div>
        </div>

        <!-- 2. CLINICAL TRIAGE & SCREENING -->
        <div class="section">
          <div class="section-title"><span>📋 التقييم التغذوي الأولي (Clinical Triage)</span></div>
          ${screening ? `
            <div class="clinical-grid">
              <div class="data-point"><span class="label">الأداة (Screening Tool):</span> <span class="value">${screening.toolName}</span></div>
              <div class="data-point"><span class="label">الدرجة (Final Score):</span> <span class="value">${screening.score}</span></div>
              <div class="data-point"><span class="label">مستوى الخطر (Risk Level):</span> <span class="value highlight-red">${screening.riskLevelAr} (${screening.riskLevel})</span></div>
              <div class="data-point"><span class="label">تاريخ التقييم (Date):</span> <span class="value">${screening.date}</span></div>
            </div>
          ` : '<p style="color: #718096; font-style: italic;">No primary screening recorded for this instance.</p>'}
        </div>

        <!-- 3. SPECIALIZED CLINICAL DATA -->
        <div class="section">
          <div class="section-title"><span>🧬 المتطلبات التخصصية (${patientProfile.caseType})</span></div>
          ${this.renderSpecializedContent(specializedMetrics)}
        </div>

        <!-- 4. ANTHROPOMETRIC TRENDS -->
        <div class="section">
          <div class="section-title"><span>📏 المؤشرات الأنثروبومترية والنمو (Trends)</span></div>
          <div class="clinical-grid" style="margin-bottom: 4mm;">
            <div class="data-point"><span class="label">الوزن الحالي (Current Wt):</span> <span class="value">${anthropometrics.current.weight || 'N/A'} kg</span></div>
            <div class="data-point"><span class="label">الطول (Height):</span> <span class="value">${anthropometrics.current.height || 'N/A'} cm</span></div>
            <div class="data-point"><span class="label">BMI:</span> <span class="value">${anthropometrics.current.bmi || 'N/A'}</span></div>
            <div class="data-point"><span class="label">التصنيف (Category):</span> <span class="value">${anthropometrics.current.bmiCategory}</span></div>
          </div>
          ${anthropometrics.trends.length > 0 ? `
            <table>
              <thead>
                <tr><th>التاريخ (Date)</th><th>الوزن (Weight kg)</th><th>BMI</th><th>التغير (Change)</th></tr>
              </thead>
              <tbody>
                ${anthropometrics.trends.map(t => `<tr><td>${t.date}</td><td>${t.weight}</td><td>${t.bmi}</td><td>-</td></tr>`).join('')}
              </tbody>
            </table>
          ` : '<p style="color: #718096; text-align: center;">No longitudinal trend data available.</p>'}
        </div>

        <!-- 5. ACTIVE CLINICAL ALERTS -->
        ${alerts.length > 0 ? `
          <div class="section">
            <div class="section-title"><span>⚠️ التنبيهات السريرية (Critical Alerts & DNI)</span></div>
            <div class="alert-box">
              ${alerts.map(a => `
                <div class="alert-item">
                  <span class="status-indicator ${a.severity === 'severe' || a.severity === 'high' ? 'status-danger' : 'status-warning'}"></span>
                  ${a.messageAr} / ${a.messageEn}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- 6. NUTRITIONAL INTERVENTION SUMMARY -->
        <div class="section">
          <div class="section-title"><span>🎯 ملخص التدخل والحسابات (Intervention Plan)</span></div>
          <div class="clinical-grid">
            <div class="data-point"><span class="label">السعرات المستهدفة (Energy Target):</span> <span class="value">${interventionSummary.calorieTarget} kcal</span></div>
            <div class="data-point"><span class="label">البروتين المستهدف (Protein Target):</span> <span class="value">${interventionSummary.proteinTarget} g</span></div>
            <div class="data-point"><span class="label">السعرات الفعلية (Actual Intake):</span> <span class="value">${interventionSummary.actualIntake || 0} kcal</span></div>
            <div class="data-point"><span class="label">الفجوة (Nutrient Deficit):</span> <span class="value highlight-red">${interventionSummary.deficit} kcal</span></div>
          </div>
        </div>

        <div class="signature-line">
          <div class="sig-box">توقيع أخصائي التغذية<br>(Dietitian Signature)</div>
          <div class="sig-box">الختم الرسمي<br>(Hospital Stamp)</div>
        </div>

        <div class="footer">
          Clinician: ${header.clinicianName} | ID: ADCN-CERT-9921 | This is an electronically verified clinical document.
        </div>
      </body>
      </html>
    `;
  }

  private static renderSpecializedContent(metrics: IUniversalReportPayload['specializedMetrics']): string {
    if (metrics.icu) {
      return `
        <div class="clinical-grid">
          <div class="data-point"><span class="label">دخول العناية (ICU Adm):</span> <span class="value">${metrics.icu.admissionDate}</span></div>
          <div class="data-point"><span class="label">APACHE II Score:</span> <span class="value">${metrics.icu.apacheScore}</span></div>
          <div class="data-point" style="grid-column: span 2;"><span class="label">أهداف التغذية (EN/PN Strategy):</span> <span class="value">${metrics.icu.enPnTargets}</span></div>
          <div class="data-point"><span class="label">توازن السوائل (Fluid Bal):</span> <span class="value">${metrics.icu.fluidBalance24h}</span></div>
        </div>
      `;
    }
    if (metrics.renal) {
      return `
        <div class="clinical-grid">
          <div class="data-point"><span class="label">GFR (eGFR):</span> <span class="value">${metrics.renal.egfr || 'N/A'} ml/min</span></div>
          <div class="data-point"><span class="label">البوتاسيوم (Potassium):</span> <span class="value">${metrics.renal.potassiumLimit}</span></div>
          <div class="data-point"><span class="label">الفسفور (Phosphorus):</span> <span class="value">${metrics.renal.phosphorusLimit}</span></div>
          <div class="data-point"><span class="label">الصوديوم (Sodium):</span> <span class="value">${metrics.renal.sodiumLimit}</span></div>
        </div>
      `;
    }
    if (metrics.pediatric) {
      return `
        <div class="clinical-grid">
          <div class="data-point"><span class="label">تصنيف WHO (Classification):</span> <span class="value">${metrics.pediatric.classification}</span></div>
          <div class="data-point"><span class="label">WFA Z-Score:</span> <span class="value">${metrics.pediatric.wfaZScore || 'N/A'}</span></div>
          <div class="data-point"><span class="label">HFA Z-Score:</span> <span class="value">${metrics.pediatric.hfaZScore || 'N/A'}</span></div>
        </div>
      `;
    }
    return '<p style="color: #718096; font-style: italic;">No specific specialized metabolic profile flags for this patient type.</p>';
  }
}
