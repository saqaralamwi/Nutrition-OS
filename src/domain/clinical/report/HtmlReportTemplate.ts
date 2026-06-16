import { BuiltReport, ReportSection } from './ComprehensiveReportBuilder';

export class HtmlReportTemplate {
  static render(report: BuiltReport): string {
    const sectionHtml = report.sections.map((s) => this.renderSection(s)).join('\n');

    return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <title>${report.reportTitle}</title>
  <style>
    @page { margin: 15mm 10mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'system-ui', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      color: #1a1a2e;
      padding: 0;
      line-height: 1.7;
      direction: rtl;
      text-align: right;
      background: #f8f9fc;
    }
    .page { max-width: 210mm; margin: 0 auto; padding: 20px; }
    .header {
      text-align: center;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      color: #fff;
      padding: 30px 20px;
      border-radius: 12px;
      margin-bottom: 25px;
    }
    .header h1 { font-size: 24px; margin: 0 0 5px 0; letter-spacing: 1px; }
    .header h2 { font-size: 15px; font-weight: normal; opacity: 0.9; margin: 5px 0; }
    .header .meta { font-size: 11px; opacity: 0.7; margin-top: 10px; }
    .section {
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 10px;
      padding: 18px 20px;
      margin-bottom: 18px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 16px;
      font-weight: bold;
      color: #0f3460;
      border-bottom: 2px solid #0f3460;
      padding-bottom: 8px;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-title .badge {
      font-size: 11px;
      background: #0f3460;
      color: #fff;
      padding: 2px 10px;
      border-radius: 12px;
      margin-right: 8px;
    }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .grid-item {
      padding: 8px 10px;
      background: #f8f9fc;
      border-radius: 6px;
      border-right: 3px solid #0f3460;
    }
    .grid-item .label { font-size: 11px; color: #666; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
    .grid-item .value { font-size: 14px; color: #1a1a2e; margin-top: 2px; }
    .grid-item.danger { border-right-color: #e74c3c; }
    .grid-item.warning { border-right-color: #f39c12; }
    .grid-item .severity-badge {
      display: inline-block;
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 10px;
      color: #fff;
      margin-right: 6px;
    }
    .severity-badge.critical { background: #e74c3c; }
    .severity-badge.severe { background: #e67e22; }
    .severity-badge.moderate { background: #f39c12; }
    .severity-badge.mild { background: #27ae60; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 13px;
    }
    th {
      background: #0f3460;
      color: #fff;
      padding: 10px 12px;
      text-align: right;
      font-weight: 600;
      font-size: 12px;
    }
    th:first-child { border-radius: 0 8px 0 0; }
    th:last-child { border-radius: 8px 0 0 0; }
    td {
      padding: 8px 12px;
      border-bottom: 1px solid #eee;
      text-align: right;
    }
    tr:last-child td { border-bottom: none; }
    tr:nth-child(even) td { background: #f8f9fc; }
    .risk-high { color: #e74c3c; font-weight: bold; }
    .risk-medium { color: #f39c12; font-weight: bold; }
    .risk-low { color: #27ae60; }
    .list-block { margin-bottom: 12px; }
    .list-block-title {
      font-size: 13px;
      font-weight: bold;
      color: #0f3460;
      margin-bottom: 6px;
    }
    .list-block ul { margin: 0; padding-right: 20px; }
    .list-block li {
      font-size: 13px;
      margin-bottom: 4px;
      line-height: 1.6;
    }
    .alert-item {
      background: #fde8e8;
      border-right: 4px solid #e74c3c;
      padding: 10px 14px;
      margin-bottom: 8px;
      border-radius: 6px;
      font-size: 13px;
    }
    .narrative-block {
      font-size: 14px;
      line-height: 1.8;
      white-space: pre-line;
      color: #333;
      padding: 10px;
      background: #fafafa;
      border-radius: 6px;
    }
    .footer {
      text-align: center;
      font-size: 11px;
      color: #999;
      padding: 15px;
      border-top: 1px solid #e0e0e0;
      margin-top: 25px;
    }
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 60px;
      opacity: 0.03;
      color: #0f3460;
      pointer-events: none;
      z-index: -1;
    }
    @media print {
      .section { page-break-inside: avoid; }
      .header { page-break-after: avoid; }
    }
  </style>
</head>
<body>
  <div class="watermark">ADCN Clinical</div>
  <div class="page">
    ${sectionHtml}
    <div class="footer">
      <p>تم إنشاء هذا التقرير آلياً عبر نظام Clinical-ADCN Nutrition Suite</p>
      <p>تاريخ الإنشاء: ${report.generatedAt ? new Date(report.generatedAt).toLocaleString('ar-YE') : new Date().toLocaleString('ar-YE')}</p>
      <p>جميع الحقوق محفوظة © ${new Date().getFullYear()} - Clinical-ADCN v3.0</p>
    </div>
  </div>
</body>
</html>`;
  }

  private static renderSection(section: ReportSection): string {
    const titleHtml = `<div class="section-title">${section.titleAr}</div>`;

    switch (section.type) {
      case 'info':
        return this.renderInfo(section, titleHtml);
      case 'grid':
        return this.renderGrid(section, titleHtml);
      case 'table':
        return this.renderTable(section, titleHtml);
      case 'list':
        return this.renderList(section, titleHtml);
      case 'alert':
        return this.renderAlerts(section, titleHtml);
      case 'narrative':
        return this.renderNarrative(section, titleHtml);
      default:
        return '';
    }
  }

  private static renderInfo(section: ReportSection, titleHtml: string): string {
    const content = section.content;
    return `<div class="section">
      <div class="header">
        <h1>${content.subtitle || ''}</h1>
        <div class="meta">
          <span>${content.date || ''}</span>
          ${content.reportId ? `<span> | معرف التقرير: ${content.reportId}</span>` : ''}
        </div>
      </div>
    </div>`;
  }

  private static renderGrid(section: ReportSection, titleHtml: string): string {
    const items = Array.isArray(section.content)
      ? section.content
      : Object.entries(section.content).map(([label, value]) => ({ label, value }));

    const itemsHtml = items
      .map((item: any) => {
        const severityClass = item.severity === 'danger' ? 'danger' : item.severity === 'warning' ? 'warning' : '';
        const severityBadge = item.severity
          ? `<span class="severity-badge ${item.severity === 'danger' ? 'critical' : item.severity === 'warning' ? 'severe' : ''}">${item.severity}</span>`
          : '';
        return `<div class="grid-item ${severityClass}">
          <div class="label">${item.label} ${severityBadge}</div>
          <div class="value">${item.value || '-'}</div>
        </div>`;
      })
      .join('');

    return `<div class="section">${titleHtml}<div class="grid">${itemsHtml}</div></div>`;
  }

  private static renderTable(section: ReportSection, titleHtml: string): string {
    const headers = section.headers || [];
    const rows = section.rows || [];

    const headersHtml = headers.map((h: string) => `<th>${h}</th>`).join('');

    const rowsHtml = rows
      .map((row: string[]) => {
        const cells = row
          .map((cell: string, idx: number) => {
            const isFirst = idx === 0;
            const riskClass = cell === 'high' ? 'risk-high' : cell === 'medium' ? 'risk-medium' : cell === 'low' ? 'risk-low' : '';
            return `<td class="${riskClass}">${cell}</td>`;
          })
          .join('');
        return `<tr>${cells}</tr>`;
      })
      .join('');

    return `<div class="section">${titleHtml}<table><thead><tr>${headersHtml}</tr></thead><tbody>${rowsHtml}</tbody></table></div>`;
  }

  private static renderList(section: ReportSection, titleHtml: string): string {
    const blocks = Array.isArray(section.content) ? section.content : [];

    const blocksHtml = blocks
      .map((block: any) => {
        const items = Array.isArray(block.items)
          ? block.items.map((item: string) => `<li>${item}</li>`).join('')
          : '';
        return items
          ? `<div class="list-block"><div class="list-block-title">${block.label}</div><ul>${items}</ul></div>`
          : '';
      })
      .join('');

    return `<div class="section">${titleHtml}${blocksHtml}</div>`;
  }

  private static renderAlerts(section: ReportSection, titleHtml: string): string {
    const alerts = Array.isArray(section.content) ? section.content : [];

    const alertsHtml = alerts
      .map((alert: string) => `<div class="alert-item">⚠️ ${alert}</div>`)
      .join('');

    return `<div class="section">${titleHtml}${alertsHtml}</div>`;
  }

  private static renderNarrative(section: ReportSection, titleHtml: string): string {
    const text = typeof section.content === 'string' ? section.content : '';
    return `<div class="section">${titleHtml}<div class="narrative-block">${text}</div></div>`;
  }
}
