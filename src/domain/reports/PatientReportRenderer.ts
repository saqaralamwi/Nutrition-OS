import { PatientReportOutput, LaboratoryResultItem } from './PatientFinalReportTypes';

/* ─────────────────────────────────────────────────────────────
 * PatientReportRenderer — Clinical Minimalism Design
 * 5-section high-fidelity HTML/CSS template for PDF export.
 * ───────────────────────────────────────────────────────────── */

export class PatientReportRenderer {

  /* ──────────────── PUBLIC API ──────────────── */
  static toHTML(output: PatientReportOutput, darkMode = false): string {
    const theme = darkMode ? this.darkTheme : this.lightTheme;
    const css = this.buildCSS(theme);
    const body = this.buildBody(output, theme);
    return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>التقرير النهائي — ${output.summary.fullName}</title>
<style>${css}</style>
</head>
<body>${body}</body>
</html>`;
  }

  /* ──────────────── THEME TOKENS ──────────────── */

  private static readonly lightTheme = {
    pageBg:      '#FFFFFF',
    cardBg:      '#FFFFFF',
    cardBorder:  '#E2E8F0',
    textPrimary: '#0F172A',
    textSecondary:'#64748B',
    textMuted:   '#94A3B8',
    accent:      '#0D9488',
    accentLight: '#CCFBF1',
    divider:     '#F1F5F9',
    danger:      '#DC2626',
    dangerLight: '#FEE2E2',
    warning:     '#D97706',
    warningLight:'#FEF3C7',
    success:     '#059669',
    successLight:'#D1FAE5',
    info:        '#6366F1',
    infoLight:   '#E0E7FF',
    riskCriticalBg:'#DC2626',
    riskHighBg:   '#D97706',
    riskMediumBg: '#0D9488',
    riskLowBg:    '#6366F1',
    shadow:      'rgba(0,0,0,0.06)',
    tableStripe: '#F8FAFC',
    tableBorder: '#E2E8F0',
  };

  private static readonly darkTheme = {
    pageBg:      '#0F172A',
    cardBg:      '#1A2332',
    cardBorder:  '#2C3E50',
    textPrimary: '#F8FAFC',
    textSecondary:'#94A3B8',
    textMuted:   '#64748B',
    accent:      '#0D9488',
    accentLight: '#134E4A',
    divider:     '#1E293B',
    danger:      '#EF4444',
    dangerLight: '#2D1B1B',
    warning:     '#F59E0B',
    warningLight:'#2D2510',
    success:     '#10B981',
    successLight:'#0B2B20',
    info:        '#818CF8',
    infoLight:   '#1E1B4B',
    riskCriticalBg:'#DC2626',
    riskHighBg:   '#D97706',
    riskMediumBg: '#0D9488',
    riskLowBg:    '#6366F1',
    shadow:      'rgba(0,0,0,0.25)',
    tableStripe: '#1E293B',
    tableBorder: '#2C3E50',
  };

  /* ──────────────── CSS GENERATOR ──────────────── */

  private static buildCSS(t: typeof PatientReportRenderer.lightTheme): string {
    return `
@page { size: A4; margin: 14mm 16mm; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'ThmanyahSans', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: ${t.pageBg};
  color: ${t.textPrimary};
  line-height: 1.75;
  direction: rtl;
  text-align: right;
  font-size: 10pt;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.page { max-width: 190mm; margin: 0 auto; }

/* ── HERO HEADER ── */
.hero {
  background: linear-gradient(135deg, ${t.accent} 0%, #0F766E 100%);
  border-radius: 14px;
  padding: 28px 28px 20px;
  margin-bottom: 18px;
  color: #fff;
  page-break-inside: avoid;
}
.hero-top { display: flex; justify-content: space-between; align-items: flex-start; }
.hero-brand h1 { font-size: 16pt; font-weight: 800; letter-spacing: 0.3px; margin: 0; }
.hero-brand p { font-size: 8pt; opacity: 0.85; margin-top: 2px; }
.hero-meta { text-align: left; font-size: 7.5pt; opacity: 0.8; line-height: 1.5; }
.hero-info {
  display: grid; grid-template-columns: 1fr 1fr 1fr;
  gap: 12px; margin-top: 16px;
  background: rgba(255,255,255,0.10);
  border-radius: 10px;
  padding: 12px 16px;
}
.hero-info .hi-item { text-align: center; }
.hero-info .hi-label { font-size: 7pt; opacity: 0.7; text-transform: uppercase; letter-spacing: 0.5px; }
.hero-info .hi-value { font-size: 11pt; font-weight: 700; margin-top: 1px; }

/* ── CARDS ── */
.card {
  background: ${t.cardBg};
  border: 1px solid ${t.cardBorder};
  border-radius: 12px;
  padding: 18px 20px;
  margin-bottom: 14px;
  box-shadow: 0 1px 3px ${t.shadow};
  page-break-inside: avoid;
}
.card-title {
  font-size: 11pt; font-weight: 700; color: ${t.textPrimary};
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 12px;
}
.card-title .badge {
  font-size: 7pt; font-weight: 600;
  padding: 2px 10px; border-radius: 20px;
  background: ${t.accentLight}; color: ${t.accent};
}
.card-title .badge-critical { background: ${t.dangerLight}; color: ${t.danger}; }
.card-title .badge-high    { background: ${t.warningLight}; color: ${t.warning}; }
.card-title .badge-medium  { background: ${t.accentLight}; color: ${t.accent}; }
.card-title .badge-low     { background: ${t.infoLight}; color: ${t.info}; }
.card-title .sep { flex: 1; border-bottom: 1px solid ${t.divider}; margin: 0 8px; }

/* ── STATUS RIBBON ── */
.status-ribbon {
  display: flex; align-items: center; gap: 14px;
  background: ${t.divider}; border-radius: 10px;
  padding: 10px 16px; margin-bottom: 14px;
}
.status-pill {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 16px; border-radius: 20px;
  font-size: 9pt; font-weight: 700; color: #fff;
}
.status-pill.critical { background: ${t.riskCriticalBg}; }
.status-pill.high     { background: ${t.riskHighBg}; }
.status-pill.medium   { background: ${t.riskMediumBg}; }
.status-pill.low      { background: ${t.riskLowBg}; }
.status-score { font-size: 8pt; color: ${t.textSecondary}; }

/* ── METRICS DASHBOARD ── */
.metrics-grid {
  display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px;
}
.metric-card {
  text-align: center; padding: 10px 6px;
  background: ${t.divider}; border-radius: 10px;
}
.metric-card .m-value { font-size: 14pt; font-weight: 800; color: ${t.accent}; }
.metric-card .m-label { font-size: 7.5pt; color: ${t.textSecondary}; margin-top: 1px; }
.metric-card .m-sub   { font-size: 7pt; color: ${t.textMuted}; }

/* ── LAB TABLE ── */
.lab-table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-top: 2px; }
.lab-table th {
  background: ${t.divider}; color: ${t.textSecondary};
  padding: 7px 10px; text-align: right;
  font-weight: 600; font-size: 7.5pt; text-transform: uppercase;
  letter-spacing: 0.3px;
}
.lab-table th:first-child { border-radius: 0 8px 0 0; }
.lab-table th:last-child  { border-radius: 8px 0 0 0; }
.lab-table td {
  padding: 6px 10px; border-bottom: 1px solid ${t.tableBorder};
  text-align: right; font-size: 9pt;
}
.lab-table tr:nth-child(even) td { background: ${t.tableStripe}; }
.lab-table .row-abnormal { background: ${t.dangerLight} !important; }
.lab-table .row-abnormal td:first-child::before { content: "!"; font-weight: 800; color: ${t.danger}; margin-left: 6px; }
.lab-table .row-critical { background: #FEE2E2 !important; }
.lab-table .row-critical td:first-child::before { content: "!!"; font-weight: 800; color: ${t.danger}; margin-left: 6px; }
.lab-table .val-abnormal { color: ${t.danger}; font-weight: 600; }
.lab-table .val-critical { color: ${t.danger}; font-weight: 700; }
.lab-table .val-normal   { color: ${t.success}; }

/* ── DNI CALLOUTS ── */
.dni-box {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 10px 14px; border-radius: 10px;
  margin-top: 8px; border-right: 4px solid;
}
.dni-box.critical { background: ${t.dangerLight}; border-color: ${t.danger}; }
.dni-box.moderate { background: ${t.warningLight}; border-color: ${t.warning}; }
.dni-box .dni-icon { font-size: 14pt; flex-shrink: 0; margin-top: 1px; }
.dni-box .dni-title { font-weight: 700; font-size: 9pt; color: ${t.textPrimary}; }
.dni-box .dni-desc  { font-size: 8.5pt; color: ${t.textSecondary}; margin-top: 1px; }

/* ── MACRO PROGRESS BARS ── */
.macro-row { display: flex; gap: 10px; margin-top: 8px; }
.macro-bar-wrapper { flex: 1; }
.macro-bar-label { display: flex; justify-content: space-between; font-size: 8.5pt; margin-bottom: 2px; }
.macro-bar-label .mb-name { font-weight: 600; color: ${t.textPrimary}; }
.macro-bar-label .mb-pct  { color: ${t.textSecondary}; }
.macro-bar-track {
  height: 10px; background: ${t.divider}; border-radius: 6px; overflow: hidden;
}
.macro-bar-fill { height: 100%; border-radius: 6px; }
.macro-bar-fill.protein { background: linear-gradient(90deg, #EF4444, #F87171); }
.macro-bar-fill.carbs   { background: linear-gradient(90deg, #0D9488, #2DD4BF); }
.macro-bar-fill.fat     { background: linear-gradient(90deg, #6366F1, #A5B4FC); }

/* ── MEAL TIMELINE ── */
.meal-timeline { margin-top: 8px; }
.meal-item {
  display: flex; align-items: center; gap: 10px;
  padding: 6px 0; position: relative;
}
.meal-dot {
  width: 10px; height: 10px; border-radius: 50%;
  flex-shrink: 0; border: 2px solid ${t.accent}; background: ${t.cardBg};
}
.meal-item:not(:last-child) .meal-dot::after {
  content: ""; position: absolute; top: 16px; right: 3px;
  width: 2px; height: 20px; background: ${t.divider};
}
.meal-time { font-size: 8pt; font-weight: 700; color: ${t.accent}; min-width: 50px; }
.meal-name { font-size: 9pt; color: ${t.textPrimary}; }
.meal-desc { font-size: 8pt; color: ${t.textSecondary}; }

/* ── ACTION CHECKLIST ── */
.checklist { list-style: none; padding: 0; }
.checklist li {
  padding: 6px 0 6px 0;
  font-size: 9pt; color: ${t.textPrimary};
  border-bottom: 1px solid ${t.divider};
  display: flex; align-items: flex-start; gap: 8px;
}
.checklist li:last-child { border-bottom: none; }
.checklist .chk { font-size: 12pt; color: ${t.textMuted}; flex-shrink: 0; margin-top: 1px; }
.checklist .chk.warning { color: ${t.warning}; }
.checklist .chk.danger  { color: ${t.danger}; }

/* ── DIAGNOSIS CONDITION PILLS ── */
.cond-pills { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.cond-pill {
  display: inline-block; padding: 3px 12px; border-radius: 16px;
  font-size: 8pt; font-weight: 500;
  background: ${t.divider}; color: ${t.textPrimary};
}
.cond-pill.allergy { background: ${t.warningLight}; color: ${t.warning}; }

/* ── MED LIST ── */
.med-list { list-style: none; padding: 0; margin-top: 6px; }
.med-list li {
  padding: 4px 0; font-size: 8.5pt; color: ${t.textPrimary};
  display: flex; align-items: center; gap: 6px;
}
.med-list li::before { content: "💊"; font-size: 9pt; }

/* ── SUPPLEMENT LIST ── */
.supp-list { list-style: none; padding: 0; margin-top: 6px; }
.supp-list li {
  padding: 4px 0; font-size: 8.5pt; color: ${t.textPrimary};
  display: flex; align-items: center; gap: 6px;
}
.supp-list li::before { content: "💊"; font-size: 9pt; }

/* ── DIETITIAN NOTES ── */
.notes-block {
  background: ${t.divider}; border-radius: 10px;
  padding: 12px 14px; margin-top: 6px;
  font-size: 9pt; line-height: 1.8;
  color: ${t.textPrimary};
}

/* ── WARNING ALERTS ── */
.warn-box {
  background: ${t.dangerLight}; border: 1px solid ${t.danger};
  border-radius: 10px; padding: 12px 14px; margin-top: 10px;
}
.warn-box .warn-item {
  font-size: 8.5pt; font-weight: 600; color: ${t.danger};
  padding: 3px 0;
}

/* ── FOOTER ── */
.footer {
  margin-top: 18px; padding-top: 10px;
  border-top: 1px solid ${t.divider};
  text-align: center; font-size: 7.5pt; color: ${t.textMuted};
  line-height: 1.6;
}

/* ── PRINT ── */
@media print {
  body { background: #fff; }
  .card { box-shadow: none; border-color: #ddd; page-break-inside: avoid; }
  .hero { page-break-after: avoid; }
}
`;
  }

  /* ──────────────── BODY BUILDER ──────────────── */

  private static buildBody(output: PatientReportOutput, t: typeof PatientReportRenderer.lightTheme): string {
    const { summary, reportDate, medicalDisclaimer, rawData: r } = output;

    return `<div class="page">
${this.renderHeader(output, t)}
${this.renderClinicalSnapshot(output, t)}
${this.renderLabAndMeds(output, t)}
${this.renderNutritionStrategy(output, t)}
${this.renderActionPlan(output, t)}
<div class="footer">
<p>تم إنشاء هذا التقرير آلياً عبر <strong>ADCN Clinical Nutrition Suite</strong> v4.0</p>
<p>${medicalDisclaimer}</p>
<p>تاريخ التقرير: ${new Date(reportDate).toLocaleString('ar-YE')} | ${r.clinicianName}</p>
</div>
</div>`;
  }

  /* ──────────────── SECTION 1: HERO HEADER ──────────────── */

  private static renderHeader(output: PatientReportOutput, t: typeof PatientReportRenderer.lightTheme): string {
    const { summary, reportDate } = output;
    const dateStr = new Date(reportDate).toLocaleString('ar-YE');

    return `<div class="hero">
<div class="hero-top">
  <div class="hero-brand">
    <h1>التقرير السريري النهائي</h1>
    <p>ADCN Clinical Nutrition — نظام التغذية العلاجية الذكي</p>
  </div>
  <div class="hero-meta">
    <div>${dateStr}</div>
    <div style="margin-top:2px;">v4.0</div>
  </div>
</div>
<div class="hero-info">
  <div class="hi-item">
    <div class="hi-label">اسم المريض</div>
    <div class="hi-value">${summary.fullName}</div>
  </div>
  <div class="hi-item">
    <div class="hi-label">العمر / الجنس</div>
    <div class="hi-value">${summary.age} سنة / ${summary.gender}</div>
  </div>
  <div class="hi-item">
    <div class="hi-label">رقم الملف</div>
    <div class="hi-value">${summary.patientId}</div>
  </div>
</div>
</div>`;
  }

  /* ──────────────── SECTION 2: CLINICAL SNAPSHOT ──────────────── */

  private static renderClinicalSnapshot(output: PatientReportOutput, t: typeof PatientReportRenderer.lightTheme): string {
    const { summary, rawData: r } = output;
    const ra = r.riskAssessment;
    const m  = r.clinicalMetrics;

    const riskClass = ra.overallRiskLevel === 'critical' ? 'critical'
      : ra.overallRiskLevel === 'high' ? 'high'
      : ra.overallRiskLevel === 'medium' ? 'medium' : 'low';

    const riskLabel = ra.overallRiskLevel === 'critical' ? '🔴 حرج'
      : ra.overallRiskLevel === 'high' ? '🟠 عالٍ'
      : ra.overallRiskLevel === 'medium' ? '🟡 متوسط' : '🟢 منخفض';

    const weightStr  = m.weight  ? `${m.weight} <span style="font-size:7pt;">كجم</span>` : '—';
    const heightStr  = m.height  ? `${m.height} <span style="font-size:7pt;">سم</span>` : '—';
    const bmiStr     = m.bmi     ? `${m.bmi.toFixed(1)} <span style="font-size:7pt;">كجم/م²</span>` : '—';
    const tdeeStr    = m.tdee    ? `${m.tdee} <span style="font-size:7pt;">ك.ك</span>` : '—';
    const bmrStr     = m.bmr     ? `${m.bmr} <span style="font-size:7pt;">ك.ك</span>` : '—';

    return `<div class="card">
<div class="card-title">📊 لمحة سريرية <span class="sep"></span> <span>درجة الخطورة ${ra.riskScore}/100</span></div>

<div class="status-ribbon">
  <span class="status-pill ${riskClass}">${riskLabel}</span>
  <span class="status-score">التشخيص: ${summary.primaryDiagnosis}</span>
</div>

<div class="metrics-grid">
  <div class="metric-card">
    <div class="m-value">${weightStr}</div>
    <div class="m-label">الوزن / الطول</div>
    <div class="m-sub">${heightStr}</div>
  </div>
  <div class="metric-card">
    <div class="m-value">${bmiStr}</div>
    <div class="m-label">مؤشر كتلة الجسم</div>
    <div class="m-sub">${m.bmiCategory}</div>
  </div>
  <div class="metric-card">
    <div class="m-value">${tdeeStr}</div>
    <div class="m-label">إجمالي الاحتياج</div>
    <div class="m-sub">TDEE</div>
  </div>
  <div class="metric-card">
    <div class="m-value">${bmrStr}</div>
    <div class="m-label">الأيض الأساسي</div>
    <div class="m-sub">BMR</div>
  </div>
</div>
</div>`;
  }

  /* ──────────────── SECTION 3: LAB & MED INTELLIGENCE ──────────────── */

  private static renderLabAndMeds(output: PatientReportOutput, t: typeof PatientReportRenderer.lightTheme): string {
    const { abnormalTests, rawData: r } = output;
    const allLabs = r.laboratoryResults;
    const meds = r.diagnosis.currentMedications;

    /* — Lab table — */
    let labHtml: string;
    if (allLabs.length === 0) {
      labHtml = '<p style="color:' + t.textMuted + ';font-style:italic;font-size:9pt;">لا توجد نتائج فحوصات مخبرية مسجلة</p>';
    } else {
      const rows = allLabs.map(lab => {
        const rowClass = lab.isCritical ? 'row-critical' : lab.isAbnormal ? 'row-abnormal' : '';
        const valClass = lab.isCritical ? 'val-critical' : lab.isAbnormal ? 'val-abnormal' : 'val-normal';
        const direction = lab.value > lab.normalHigh ? '↑ مرتفع' : lab.value < lab.normalLow ? '↓ منخفض' : '✔ طبيعي';
        return `<tr class="${rowClass}">
<td>${lab.testName}</td>
<td class="${valClass}">${lab.value}</td>
<td>${lab.unit}</td>
<td>${lab.normalLow} – ${lab.normalHigh}</td>
<td class="${valClass}">${direction}</td>
</tr>`;
      }).join('');

      const abCount = r.abnormalTestsCount;
      const badgeClass = r.criticalTestsCount > 0 ? 'badge-critical'
        : abCount > 0 ? 'badge-high' : 'badge-low';
      const badgeText = r.criticalTestsCount > 0
        ? `${abCount} غير طبيعي (${r.criticalTestsCount} حرج)`
        : abCount > 0 ? `${abCount} غير طبيعي` : 'طبيعي';

      labHtml = `<table class="lab-table">
<thead><tr><th>الفحص</th><th>النتيجة</th><th>الوحدة</th><th>المدى الطبيعي</th><th>الحالة</th></tr></thead>
<tbody>${rows}</tbody>
</table>
<div style="text-align:left;margin-top:6px;"><span class="badge ${badgeClass}">${badgeText}</span></div>`;
    }

    /* — Medications — */
    let medHtml = '';
    if (meds.length > 0) {
      const items = meds.map(m => `<li>${m.name} — ${m.dosage} (${m.frequency})</li>`).join('');
      medHtml = `<ul class="med-list">${items}</ul>`;
    } else {
      medHtml = '<p style="color:' + t.textMuted + ';font-style:italic;font-size:9pt;">لا توجد أدوية مسجلة</p>';
    }

    /* — DNI alerts derived from warning flags that mention medication — */
    const dniFlags = output.warningFlags.filter(w =>
      w.includes('دواء') || w.includes('تفاعل') || w.includes('medication') || w.includes('interaction') || w.includes('تحذير')
    );
    let dniHtml = '';
    if (dniFlags.length > 0) {
      dniHtml = dniFlags.map(f =>
        `<div class="dni-box critical"><div class="dni-icon">⚠️</div><div><div class="dni-title">تنبيه تفاعل دوائي-غذائي</div><div class="dni-desc">${f}</div></div></div>`
      ).join('');
    }

    return `<div class="card">
<div class="card-title">🔬 الذكاء المخبري والدوائي <span class="sep"></span> <span>Laboratory & Medication Intelligence</span></div>
${labHtml}
<div style="margin-top:14px;padding-top:12px;border-top:1px solid ${t.divider};">
  <div style="font-size:9pt;font-weight:700;color:${t.textPrimary};margin-bottom:4px;">💊 الأدوية الحالية</div>
  ${medHtml}
</div>
${dniHtml}
</div>`;
  }

  /* ──────────────── SECTION 4: NUTRITION STRATEGY ──────────────── */

  private static renderNutritionStrategy(output: PatientReportOutput, t: typeof PatientReportRenderer.lightTheme): string {
    const { summary, rawData: r } = output;
    const np = r.nutritionPlan;
    const ms = np.macroSplit;

    const calLabel = np.caloricTarget > 0
      ? `${np.caloricTarget.toLocaleString('ar-YE')} <span style="font-size:7.5pt;">ك.ك/يوم</span>`
      : 'غير محدد';

    /* — Macro progress bars — */
    const totalPct = ms.proteinPercentage + ms.carbsPercentage + ms.fatPercentage;
    const pPct = totalPct > 0 ? ms.proteinPercentage : 0;
    const cPct = totalPct > 0 ? ms.carbsPercentage : 0;
    const fPct = totalPct > 0 ? ms.fatPercentage : 0;

    let macroHtml = '';
    if (totalPct > 0) {
      macroHtml = `<div class="macro-row">
<div class="macro-bar-wrapper">
  <div class="macro-bar-label"><span class="mb-name">🥩 بروتين</span><span class="mb-pct">${ms.proteinGrams}غ (${pPct}%)</span></div>
  <div class="macro-bar-track"><div class="macro-bar-fill protein" style="width:${pPct}%"></div></div>
</div>
<div class="macro-bar-wrapper">
  <div class="macro-bar-label"><span class="mb-name">🌾 كربوهيدرات</span><span class="mb-pct">${ms.carbsGrams}غ (${cPct}%)</span></div>
  <div class="macro-bar-track"><div class="macro-bar-fill carbs" style="width:${cPct}%"></div></div>
</div>
<div class="macro-bar-wrapper">
  <div class="macro-bar-label"><span class="mb-name">🧈 دهون</span><span class="mb-pct">${ms.fatGrams}غ (${fPct}%)</span></div>
  <div class="macro-bar-track"><div class="macro-bar-fill fat" style="width:${fPct}%"></div></div>
</div>
</div>`;
    } else {
      macroHtml = '<p style="color:' + t.textMuted + ';font-style:italic;font-size:9pt;">لم يتم تحديد توزيع المغذيات الكبرى</p>';
    }

    /* — Meal timing timeline — */
    const meals = [];
    if (np.mealTiming.breakfastTime !== 'غير متوفر') meals.push({ time: np.mealTiming.breakfastTime, name: 'وجبة الإفطار', desc: '' });
    if (np.mealTiming.lunchTime !== 'غير متوفر')    meals.push({ time: np.mealTiming.lunchTime, name: 'وجبة الغداء', desc: '' });
    if (np.mealTiming.dinnerTime !== 'غير متوفر')   meals.push({ time: np.mealTiming.dinnerTime, name: 'وجبة العشاء', desc: '' });

    let mealHtml = '';
    if (meals.length > 0) {
      mealHtml = '<div class="meal-timeline">' + meals.map(m =>
        `<div class="meal-item"><div class="meal-dot"></div><span class="meal-time">${m.time}</span><span class="meal-name">${m.name}</span></div>`
      ).join('') + '</div>';
    } else {
      mealHtml = `<div style="text-align:center;padding:8px;color:${t.textMuted};font-size:8.5pt;">
        🍽️ ${np.mealTiming.mealsPerDay} وجبات / ${np.mealTiming.snacksPerDay} سناك
      </div>`;
    }

    /* — Restrictions — */
    let restrictHtml = '';
    if (np.restrictions.length > 0 && np.restrictions[0] !== 'غير متوفر') {
      restrictHtml = '<div style="margin-top:6px;"><div style="font-size:8pt;color:' + t.textSecondary + ';">القيود الغذائية:</div><div class="cond-pills">'
        + np.restrictions.map(r => `<span class="cond-pill">⚠️ ${r}</span>`).join('')
        + '</div></div>';
    }

    return `<div class="card">
<div class="card-title">🍽️ الاستراتيجية الغذائية <span class="sep"></span> <span style="font-weight:800;color:${t.accent};">${calLabel}</span></div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
  <div style="background:${t.divider};border-radius:10px;padding:8px 12px;">
    <div style="font-size:7pt;color:${t.textSecondary};">نوع الحمية</div>
    <div style="font-size:10pt;font-weight:700;color:${t.textPrimary};">${np.dietType}</div>
  </div>
  <div style="background:${t.divider};border-radius:10px;padding:8px 12px;">
    <div style="font-size:7pt;color:${t.textSecondary};">السوائل / الألياف</div>
    <div style="font-size:10pt;font-weight:700;color:${t.textPrimary};">${np.hydrationTarget > 0 ? np.hydrationTarget + ' لتر' : '—'} / ${np.fiberTarget > 0 ? np.fiberTarget + ' غ' : '—'}</div>
  </div>
</div>

<div style="font-size:9pt;font-weight:700;color:${t.textPrimary};margin-bottom:4px;">📊 توزيع المغذيات الكبرى</div>
${macroHtml}

<div style="margin-top:12px;padding-top:10px;border-top:1px solid ${t.divider};">
  <div style="font-size:9pt;font-weight:700;color:${t.textPrimary};margin-bottom:4px;">🕒 توقيت الوجبات</div>
  ${mealHtml}
</div>
${restrictHtml}
</div>`;
  }

  /* ──────────────── SECTION 5: ACTION PLAN ──────────────── */

  private static renderActionPlan(output: PatientReportOutput, t: typeof PatientReportRenderer.lightTheme): string {
    const { keyRecommendations, warningFlags, rawData: r } = output;
    const rec = r.recommendations;
    const dn  = r.dietitianNotes;

    /* — Dietary recs as checklist — */
    let dietChecklist = '';
    if (rec.dietaryRecommendations.length > 0 && rec.dietaryRecommendations[0] !== 'غير متوفر') {
      dietChecklist = '<ul class="checklist">' + rec.dietaryRecommendations.map(item =>
        `<li><span class="chk">☐</span>${item}</li>`
      ).join('') + '</ul>';
    } else if (keyRecommendations.length > 0) {
      dietChecklist = '<ul class="checklist">' + keyRecommendations.map(item =>
        `<li><span class="chk">☐</span>${item}</li>`
      ).join('') + '</ul>';
    } else {
      dietChecklist = '<p style="color:' + t.textMuted + ';font-style:italic;font-size:9pt;">لا توجد توصيات مسجلة</p>';
    }

    /* — Lifestyle — */
    let lifestyleHtml = '';
    if (rec.lifestyleRecommendations.length > 0 && rec.lifestyleRecommendations[0] !== 'غير متوفر') {
      lifestyleHtml = '<div style="margin-top:10px;padding-top:10px;border-top:1px solid ' + t.divider + ';">'
        + '<div style="font-size:9pt;font-weight:700;color:' + t.textPrimary + ';margin-bottom:4px;">🏃 نمط الحياة</div>'
        + '<ul class="checklist">' + rec.lifestyleRecommendations.map(item =>
          `<li><span class="chk">☐</span>${item}</li>`
        ).join('') + '</ul></div>';
    }

    /* — Supplements — */
    let suppHtml = '';
    if (rec.supplementRecommendations.length > 0) {
      suppHtml = '<div style="margin-top:10px;padding-top:10px;border-top:1px solid ' + t.divider + ';">'
        + '<div style="font-size:9pt;font-weight:700;color:' + t.textPrimary + ';margin-bottom:4px;">💊 المكملات الغذائية الموصى بها</div>'
        + '<ul class="supp-list">' + rec.supplementRecommendations.map(s =>
          `<li>${s.name} — <span style="color:${t.textSecondary};">${s.dosage}</span> <span style="color:${t.textMuted};font-size:7.5pt;">(${s.reason})</span></li>`
        ).join('') + '</ul></div>';
    }

    /* — Dietitian notes — */
    let notesHtml = '';
    if (dn.notes !== 'غير متوفر' || dn.followUpFrequency !== 'غير متوفر') {
      notesHtml = '<div style="margin-top:10px;padding-top:10px;border-top:1px solid ' + t.divider + ';">'
        + '<div style="font-size:9pt;font-weight:700;color:' + t.textPrimary + ';margin-bottom:4px;">📝 ملاحظات أخصائي التغذية</div>'
        + '<div class="notes-block">' + dn.notes
        + (dn.followUpFrequency !== 'غير متوفر' ? '<div style="margin-top:6px;font-size:8.5pt;color:' + t.textSecondary + ';">🔄 متابعة: ' + dn.followUpFrequency + '</div>' : '')
        + (dn.specialInstructions !== 'غير متوفر' ? '<div style="margin-top:3px;font-size:8.5pt;color:' + t.textSecondary + ';">⚠️ ' + dn.specialInstructions + '</div>' : '')
        + '</div></div>';
    }

    /* — Warning flags — */
    let warnHtml = '';
    if (warningFlags.length > 0) {
      warnHtml = '<div class="warn-box">'
        + '<div style="font-size:9pt;font-weight:700;color:' + t.danger + ';margin-bottom:4px;">⚠️ التحذيرات والتنبيهات</div>'
        + warningFlags.map(w => '<div class="warn-item">' + w + '</div>').join('')
        + '</div>';
    }

    return `<div class="card">
<div class="card-title">✅ خطة العمل والتوصيات <span class="sep"></span> <span>Action Plan</span></div>

<div style="font-size:9pt;font-weight:700;color:${t.textPrimary};margin-bottom:4px;">🥗 التوصيات الغذائية</div>
${dietChecklist}
${lifestyleHtml}
${suppHtml}
${notesHtml}
${warnHtml}
</div>`;
  }
}
