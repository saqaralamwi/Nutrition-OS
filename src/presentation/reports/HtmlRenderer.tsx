import type { ReportPayload, ReportSection, ReportFindingRow } from '../../domain/reports/ReportTemplate';

const CSS = `
@page { size: A4; margin: 20mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Segoe UI', Tahoma, Arial, Helvetica, sans-serif;
  direction: rtl; text-align: right;
  color: #1E293B; background: #FFFFFF;
  font-size: 10pt; line-height: 1.7;
}
h1 { font-size: 16pt; font-weight: 700; color: #1A5276; }
h2 { font-size: 12pt; font-weight: 600; color: #1A5276; margin-bottom: 6pt; }
table { width: 100%; border-collapse: collapse; margin: 8pt 0; }
th {
  background: #1A5276; color: #FFFFFF; font-weight: 600; font-size: 9pt;
  padding: 6pt 8pt; border: 1px solid #154360; text-align: right;
}
td {
  padding: 5pt 8pt; border: 1px solid #E2E8F0; font-size: 9.5pt;
  vertical-align: top;
}
tr:nth-child(even) td { background: #F8FAFC; }
.page-header {
  display: flex; justify-content: space-between; align-items: center;
  padding-bottom: 12pt; border-bottom: 2pt solid #1A5276; margin-bottom: 16pt;
}
.page-header-left { display: flex; align-items: center; gap: 10pt; }
.page-header-icon { font-size: 24pt; }
.page-header-title { font-size: 18pt; font-weight: 700; color: #1A5276; }
.page-header-sub { font-size: 9pt; color: #64748B; margin-top: 2pt; }
.page-header-right { text-align: left; direction: ltr; font-size: 8pt; color: #94A3B8; line-height: 1.5; }
.patient-table { margin: 8pt 0; }
.patient-table td { padding: 4pt 8pt; border: none; border-bottom: 1px solid #F1F5F9; vertical-align: middle; }
.patient-table td:first-child { color: #64748B; width: 35%; white-space: nowrap; }
.patient-table td:last-child { color: #1E293B; font-weight: 500; }
.section { margin-bottom: 16pt; page-break-inside: avoid; }
.section-header {
  display: flex; align-items: center; gap: 8pt;
  padding: 8pt 12pt; background: #F1F5F9;
  border-bottom: 2pt solid #1A5276; margin-bottom: 8pt;
}
.section-header h2 { margin: 0; font-size: 11pt; }
.section-icon { font-size: 14pt; }
.finding-list { list-style: none; padding: 0; margin: 4pt 0; }
.finding-item {
  display: flex; align-items: baseline; gap: 6pt;
  padding: 4pt 0; border-bottom: 1px solid #F1F5F9;
  font-size: 9.5pt;
}
.finding-item:last-child { border-bottom: none; }
.finding-icon { font-size: 10pt; color: #64748B; min-width: 16pt; text-align: center; }
.finding-label { color: #475569; min-width: 40%; }
.finding-value { font-weight: 500; color: #1E293B; direction: ltr; text-align: left; }
.finding-unit { color: #94A3B8; font-size: 8pt; }
.narrative-box {
  background: #FFFBEB; border: 1px solid #FDE68A;
  border-right: 4px solid #F59E0B;
  border-radius: 4px; padding: 8pt 12pt; margin: 8pt 0;
  font-size: 9pt; color: #92400E; white-space: pre-wrap;
}
.badge-row { display: flex; gap: 6pt; margin: 8pt 0; flex-wrap: wrap; }
.badge {
  display: inline-block; padding: 2pt 10pt; border-radius: 12pt;
  font-size: 8pt; font-weight: 700; color: #FFFFFF;
}
.signature-block {
  margin-top: 24pt; padding: 16pt 0; border-top: 2pt solid #1A5276;
  text-align: center; font-size: 10pt;
}
.signature-line {
  display: inline-block; width: 200pt; border-bottom: 1pt solid #1E293B;
  margin: 8pt 0;
}
.page-footer {
  margin-top: 24pt; padding-top: 10pt; border-top: 1pt solid #E2E8F0;
  display: flex; justify-content: space-between;
  font-size: 8pt; color: #94A3B8;
}
.confidential {
  font-size: 7pt; color: #CBD5E1; text-align: center; margin-top: 4pt;
}
@media print {
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

const FINDING_ICONS: Record<string, string> = {
  '\u0647\u064A\u0645\u0648\u062A\u0631\u0648\u0628\u064A\u0646': '\uD83D\uDD0C',
};

function iconForFinding(label: string): string {
  for (const [key, icon] of Object.entries(FINDING_ICONS)) {
    if (label.includes(key)) return icon;
  }
  return '\uD83D\uDCCB';
}

function formatNumeric(s: string): string {
  const t = s.trim();
  if (/^-?\d+(\.\d+)?$/.test(t)) return parseFloat(t).toFixed(2);
  return s;
}

function escape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('ar-SA', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function renderFindingItem(f: ReportFindingRow): string {
  const icon = iconForFinding(f.label);
  const val = formatNumeric(escape(f.value));
  const unit = f.unit ? ` <span class="finding-unit">${escape(f.unit)}</span>` : '';
  return `<li class="finding-item">
    <span class="finding-icon">${icon}</span>
    <span class="finding-label">${escape(f.label)}</span>
    <span class="finding-value">${val}${unit}</span>
  </li>`;
}

function renderComputedRow(f: ReportFindingRow): string {
  const val = formatNumeric(escape(f.value));
  const unit = f.unit ? ` <span style="color:#94A3B8;font-size:8pt;">${escape(f.unit)}</span>` : '';
  return `<tr><td style="font-weight:500;">${escape(f.label)}</td><td style="direction:ltr;text-align:left;">${val}${unit}</td></tr>`;
}

function renderHeaderSection(s: ReportSection): string {
  return `<div class="page-header">
    <div class="page-header-left">
      <span class="page-header-icon">\uD83C\uDFE5</span>
      <div>
        <div class="page-header-title">ADCN-Clinical</div>
        <div class="page-header-sub">${escape(s.title)}</div>
      </div>
    </div>
  </div>`;
}

function renderPatientInfoSection(s: ReportSection): string {
  const rows = s.findings.map((f) =>
    `<tr><td>${escape(f.label)}</td><td>${escape(f.value)}</td></tr>`,
  ).join('');
  return `<div class="section">
    <h2>\uD83D\uDC64 ${escape(s.title)}</h2>
    <table class="patient-table">${rows}</table>
  </div>`;
}

function renderClinicalFindingsSection(s: ReportSection): string {
  const items = s.findings.map(renderFindingItem).join('');
  return `<div class="section">
    <div class="section-header"><span class="section-icon">\uD83D\uDD0D</span><h2>${escape(s.title)}</h2></div>
    <ul class="finding-list">${items}</ul>
    ${s.badges ? `<div class="badge-row">${s.badges.map((b) => `<span class="badge" style="background:${b.color};">${escape(b.label)}</span>`).join('')}</div>` : ''}
    ${s.narrative ? `<div class="narrative-box">${escape(s.narrative)}</div>` : ''}
  </div>`;
}

function renderComputedResultsSection(s: ReportSection): string {
  const rows = s.findings.map(renderComputedRow).join('');
  return `<div class="section">
    <div class="section-header"><span class="section-icon">\u2697\uFE0F</span><h2>${escape(s.title)}</h2></div>
    <table><tr><th>\u0627\u0644\u0645\u0624\u0634\u0631</th><th>\u0627\u0644\u0646\u062A\u064A\u062C\u0629</th></tr>${rows}</table>
    ${s.badges ? `<div class="badge-row">${s.badges.map((b) => `<span class="badge" style="background:${b.color};">${escape(b.label)}</span>`).join('')}</div>` : ''}
  </div>`;
}

function renderFooterSection(s: ReportSection): string {
  return `<div class="page-footer">
    <span>${escape(s.title)}</span>
    <span>\u0633\u0631\u064A</span>
  </div>`;
}

function renderSection(s: ReportSection): string {
  switch (s.type) {
    case 'header': return renderHeaderSection(s);
    case 'patient_info': return renderPatientInfoSection(s);
    case 'clinical_findings': return renderClinicalFindingsSection(s);
    case 'computed_results': return renderComputedResultsSection(s);
    case 'footer': return renderFooterSection(s);
    default: return '';
  }
}

function renderSignatureBlock(): string {
  const dateStr = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  return `<div class="signature-block">
    <div style="margin-bottom:4pt;">\u0627\u0644\u0641\u0627\u062D\u0635 \u0627\u0644\u0633\u0631\u064A\u0631\u064A: <span style="border-bottom:1px solid #1E293B;min-width:120pt;display:inline-block;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></div>
    <div style="margin-bottom:4pt;">\u0627\u0644\u062A\u0627\u0631\u064A\u062E: ${dateStr}</div>
    <div>\u0627\u0644\u062E\u062A\u0645: [\u062E\u062A\u0645 \u0631\u0633\u0645\u064A]</div>
  </div>`;
}

export function renderHtml(payload: ReportPayload): string {
  const dateStr = formatDate(payload.generatedAt);
  const hasCert = Boolean(payload.certificationFingerprint);

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escape(payload.profile.fullName)} — \u062A\u0642\u0631\u064A\u0631 \u0633\u0631\u064A\u0631\u064A</title>
<style>${CSS}</style>
</head>
<body>

<div class="page-header">
  <div class="page-header-left">
    <span class="page-header-icon">\uD83C\uDFE5</span>
    <div>
      <div class="page-header-title">ADCN-Clinical</div>
      <div class="page-header-sub">${payload.reportType === 'clinical-summary' ? '\u0627\u0644\u0645\u0644\u062E\u0635 \u0627\u0644\u0633\u0631\u064A\u0631\u064A' : '\u0627\u0644\u062A\u0642\u0631\u064A\u0631 \u0627\u0644\u0633\u0631\u064A\u0631\u064A \u0627\u0644\u0634\u0627\u0645\u0644'}</div>
    </div>
  </div>
  <div class="page-header-right">
    <div>${escape(dateStr)}</div>
    <div style="margin-top:2pt;">${escape(payload.reportId)}</div>
  </div>
</div>

${payload.sections.map(renderSection).join('\n')}

${hasCert ? renderSignatureBlock() : ''}

<div class="page-footer">
  <span>ADCN-Clinical \u00A9 ${new Date().getFullYear()}</span>
  <span>${escape(dateStr)} \u2014 \u0633\u0631\u064A</span>
</div>
<div class="confidential">\u0647\u0630\u0627 \u062A\u0642\u0631\u064A\u0631 \u0637\u0628\u064A \u0633\u0631\u064A \u0644\u0644\u0627\u0633\u062A\u0639\u0645\u0627\u0644 \u0627\u0644\u0645\u0647\u0646\u064A \u0641\u0642\u0637</div>

</body>
</html>`;
}
