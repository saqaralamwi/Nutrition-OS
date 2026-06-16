import { BuiltReport } from './ComprehensiveReportBuilder';
import { HtmlReportTemplate } from './HtmlReportTemplate';

export class PdfExporter {
  static async exportToPdf(report: BuiltReport): Promise<{ uri: string; success: boolean }> {
    try {
      const html = HtmlReportTemplate.render(report);
      const Print = await import('expo-print');
      const Sharing = await import('expo-sharing');

      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `حفظ التقرير - ${report.patientName}`,
          UTI: 'com.adobe.pdf',
        });
      }

      return { uri, success: true };
    } catch (error) {
      console.error('[PdfExporter] Failed to export PDF:', error);
      return { uri: '', success: false };
    }
  }

  static async printToHtml(report: BuiltReport): Promise<string> {
    return HtmlReportTemplate.render(report);
  }

  static async exportJson(report: BuiltReport): Promise<string> {
    return JSON.stringify(
      {
        reportTitle: report.reportTitle,
        patientName: report.patientName,
        generatedAt: report.generatedAt,
        sections: report.sections.map((s) => ({
          title: s.title,
          titleAr: s.titleAr,
          type: s.type,
          content: s.content,
        })),
      },
      null,
      2,
    );
  }
}
