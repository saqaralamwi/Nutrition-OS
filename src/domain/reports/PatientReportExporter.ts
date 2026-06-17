import { PatientReportOutput } from './PatientFinalReportTypes';
import { PatientReportRenderer } from './PatientReportRenderer';

export class PatientReportExporter {
  static async exportToPdf(output: PatientReportOutput): Promise<{ uri: string; success: boolean }> {
    try {
      const html = PatientReportRenderer.toHTML(output);
      const Print = await import('expo-print');
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      const Sharing = await import('expo-sharing');
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `حفظ التقرير النهائي - ${output.summary.fullName}`,
          UTI: 'com.adobe.pdf',
        });
      }

      return { uri, success: true };
    } catch (error) {
      console.error('[PatientReportExporter] Failed to export PDF:', error);
      return { uri: '', success: false };
    }
  }

  static async printToHtml(output: PatientReportOutput): Promise<string> {
    return PatientReportRenderer.toHTML(output);
  }

  static async directPrint(output: PatientReportOutput): Promise<boolean> {
    try {
      const html = PatientReportRenderer.toHTML(output);
      const Print = await import('expo-print');
      await Print.printAsync({ html });
      return true;
    } catch (error) {
      console.error('[PatientReportExporter] Failed to print:', error);
      return false;
    }
  }

  static exportToJson(output: PatientReportOutput): string {
    return JSON.stringify({
      summary: output.summary,
      abnormalTests: output.abnormalTests,
      warningFlags: output.warningFlags,
      keyRecommendations: output.keyRecommendations,
      reportDate: output.reportDate,
      medicalDisclaimer: output.medicalDisclaimer,
    }, null, 2);
  }
}
