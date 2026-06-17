import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { useToastStore } from '../../../src/presentation/stores/toastStore';
import { colors, spacing, safeHeaderPaddingTop, fontFamilies, fontSizes, lineHeights } from '../../../src/presentation/theme';
import { PatientReportOutput } from '../../../src/domain/reports/PatientFinalReportTypes';

type ExportStatus = 'idle' | 'exporting' | 'success' | 'error';

export default function PatientReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const showToast = useToastStore((s) => s.showToast);

  const [report, setReport] = useState<PatientReportOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [printStatus, setPrintStatus] = useState<ExportStatus>('idle');
  const [selectedSection, setSelectedSection] = useState<number | null>(null);

  useEffect(() => {
    loadReport();
  }, [id]);

  async function loadReport() {
    try {
      const { PatientReportGenerator } = await import('../../../src/domain/reports/PatientReportGenerator');
      const generator = new PatientReportGenerator();
      const result = await generator.execute(id);
      setReport(result);
    } catch (error) {
      console.error('Failed to load report:', error);
      showToast('فشل تحميل التقرير', 'error');
    } finally {
      setLoading(false);
    }
  }

  const handlePrint = useCallback(async () => {
    if (!report) return;
    setPrintStatus('exporting');
    try {
      const { PatientReportRenderer } = await import('../../../src/domain/reports/PatientReportRenderer');
      const html = PatientReportRenderer.toHTML(report);
      await Print.printAsync({ html });
      setPrintStatus('success');
      showToast('تم فتح التقرير للطباعة ✓', 'success');
    } catch (error) {
      console.error('Print error:', error);
      setPrintStatus('error');
      showToast('فشل تصدير التقرير', 'error');
    }
  }, [report, showToast]);

  const handleShareText = useCallback(async () => {
    if (!report) return;
    try {
      await Share.share({
        message: report.reportText,
        title: `التقرير النهائي - ${report.summary.fullName}`,
      });
    } catch { }
  }, [report]);

  const handleExportPdf = useCallback(async () => {
    if (!report) return;
    setPrintStatus('exporting');
    try {
      const { PatientReportRenderer } = await import('../../../src/domain/reports/PatientReportRenderer');
      const html = PatientReportRenderer.toHTML(report);
      const { uri } = await Print.printToFileAsync({ html, base64: false });

      if (Platform.OS !== 'web') {
        try {
          const Sharing = await import('expo-sharing');
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri, {
              mimeType: 'application/pdf',
              dialogTitle: `حفظ التقرير - ${report.summary.fullName}`,
              UTI: 'com.adobe.pdf',
            });
          }
        } catch { }
      }

      setPrintStatus('success');
      showToast('تم حفظ التقرير بنجاح ✓', 'success');
    } catch (error) {
      console.error('PDF export error:', error);
      setPrintStatus('error');
      showToast('فشل تصدير PDF', 'error');
    }
  }, [report, showToast]);

  const sections = report ? [
    { id: 1, title: 'بيانات المريض الأساسية', icon: 'person', color: colors.accentTeal },
    { id: 2, title: 'المؤشرات الحيوية', icon: 'stats-chart', color: colors.accentIndigo },
    { id: 3, title: 'الفحوصات المخبرية', icon: 'flask', color: report.abnormalTests.length > 0 ? colors.danger : colors.success },
    { id: 4, title: 'التشخيص والحالات المزمنة', icon: 'medkit', color: colors.accentAmber },
    { id: 5, title: 'الخطة العلاجية الغذائية', icon: 'restaurant', color: colors.accentTeal },
    { id: 6, title: 'ملاحظات أخصائي التغذية', icon: 'clipboard', color: colors.accentSky },
    { id: 7, title: 'التوصيات', icon: 'checkbox', color: colors.accentIndigo },
    { id: 8, title: 'تقييم الخطورة', icon: 'warning', color: report.summary.overallRiskLevel === 'critical' || report.summary.overallRiskLevel === 'high' ? colors.danger : colors.warning },
  ] : [];

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>جاري تحميل التقرير...</Text>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle" size={48} color={colors.danger} />
        <Text style={styles.errorText}>فشل تحميل بيانات التقرير</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadReport}>
          <Text style={styles.retryBtnText}>إعادة المحاولة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const riskBadgeColor = report.summary.overallRiskLevel === 'critical' ? colors.danger :
    report.summary.overallRiskLevel === 'high' ? colors.warning :
    report.summary.overallRiskLevel === 'medium' ? colors.accentAmber : colors.success;

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={colors.primaryContrast} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📄 التقرير النهائي</Text>
        <Text style={styles.headerSubtitle}>{report.summary.fullName}</Text>
      </View>

      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{report.summary.riskScore}</Text>
          <Text style={styles.summaryLabel}>درجة الخطورة</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: report.summary.caloricTarget > 0 ? colors.success : colors.textSecondary }]}>
            {report.summary.caloricTarget > 0 ? `${report.summary.caloricTarget.toLocaleString('ar-YE')}` : '--'}
          </Text>
          <Text style={styles.summaryLabel}>سعرة/يوم</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: report.abnormalTests.length > 0 ? colors.warning : colors.success }]}>
            {report.abnormalTests.length}
          </Text>
          <Text style={styles.summaryLabel}>فحوصات غير طبيعية</Text>
        </View>
      </View>

      <ScrollView style={styles.flex}>
        <View style={styles.riskBanner}>
          <View style={[styles.riskIndicator, { backgroundColor: riskBadgeColor }]} />
          <View style={styles.riskContent}>
            <Text style={styles.riskTitle}>تقييم الخطورة العام</Text>
            <Text style={[styles.riskLevel, { color: riskBadgeColor }]}>
              {report.summary.overallRiskLevel === 'critical' ? '🔴 حرج' :
               report.summary.overallRiskLevel === 'high' ? '🟠 عالٍ' :
               report.summary.overallRiskLevel === 'medium' ? '🟡 متوسط' : '🟢 منخفض'}
            </Text>
          </View>
        </View>

        {report.warningFlags.length > 0 && (
          <View style={styles.warningsSection}>
            <Text style={styles.warningsTitle}>⚠️ التحذيرات</Text>
            {report.warningFlags.map((w, i) => (
              <View key={i} style={styles.warningItem}>
                <Text style={styles.warningText}>{w}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.sectionGrid}>
          {sections.map((section) => (
            <TouchableOpacity
              key={section.id}
              style={[styles.sectionCard, selectedSection === section.id && styles.sectionCardActive]}
              onPress={() => setSelectedSection(selectedSection === section.id ? null : section.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.sectionIcon, { backgroundColor: section.color + '20' }]}>
                <Ionicons name={section.icon as any} size={22} color={section.color} />
              </View>
              <Text style={styles.sectionCardTitle}>{section.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.textSection}>
          <Text style={styles.textSectionTitle}>📋 نص التقرير الكامل</Text>
          <ScrollView style={styles.reportTextContainer} nestedScrollEnabled>
            <Text style={styles.reportText}>{report.reportText}</Text>
          </ScrollView>
        </View>

        <View style={styles.disclaimerBox}>
          <Ionicons name="information-circle" size={18} color={colors.textSecondary} />
          <Text style={styles.disclaimerText}>{report.medicalDisclaimer}</Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.printBtn]}
            onPress={handlePrint}
            disabled={printStatus === 'exporting'}
          >
            {printStatus === 'exporting' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="print" size={20} color="#fff" />
                <Text style={styles.actionBtnText}>طباعة التقرير</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.pdfBtn]}
            onPress={handleExportPdf}
            disabled={printStatus === 'exporting'}
          >
            <Ionicons name="document" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>تصدير PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.shareBtn]}
            onPress={handleShareText}
          >
            <Ionicons name="share" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>مشاركة النص</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surfaceSecondary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surfaceSecondary, padding: spacing.lg },
  loadingText: { color: colors.textSecondary, marginTop: spacing.md, fontFamily: fontFamilies.regular, fontSize: fontSizes.md },
  errorText: { color: colors.danger, marginTop: spacing.md, fontFamily: fontFamilies.medium, fontSize: fontSizes.md, textAlign: 'center' },
  retryBtn: { marginTop: spacing.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 12 },
  retryBtnText: { color: colors.primaryContrast, fontFamily: fontFamilies.bold, fontSize: fontSizes.md },

  header: {
    backgroundColor: colors.primaryDark,
    paddingTop: safeHeaderPaddingTop,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backBtn: { position: 'absolute', top: safeHeaderPaddingTop + 4, start: spacing.lg, zIndex: 1, padding: spacing.xs },
  headerTitle: { fontSize: fontSizes.xl, fontFamily: fontFamilies.bold, color: colors.primaryContrast, textAlign: 'right', marginTop: 36, lineHeight: fontSizes.xl * 1.8 },
  headerSubtitle: { fontSize: fontSizes.sm, fontFamily: fontFamilies.regular, color: colors.textTertiary, textAlign: 'right', marginTop: 2, opacity: 0.85 },

  summaryBar: {
    flexDirection: 'row-reverse',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: -10,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: fontSizes.xl, fontFamily: fontFamilies.bold, color: colors.textPrimary, lineHeight: fontSizes.xl * 1.8 },
  summaryLabel: { fontSize: fontSizes.xs, fontFamily: fontFamilies.regular, color: colors.textSecondary, marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: colors.border, marginVertical: 4 },

  riskBanner: {
    flexDirection: 'row-reverse',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  riskIndicator: { width: 6 },
  riskContent: { flex: 1, padding: spacing.md, alignItems: 'center' },
  riskTitle: { fontSize: fontSizes.sm, fontFamily: fontFamilies.regular, color: colors.textSecondary },
  riskLevel: { fontSize: fontSizes.lg, fontFamily: fontFamilies.bold, marginTop: 4, lineHeight: fontSizes.lg * 1.8 },

  warningsSection: {
    backgroundColor: '#2D1B1B',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger + '40',
  },
  warningsTitle: { fontSize: fontSizes.md, fontFamily: fontFamilies.bold, color: colors.danger, marginBottom: spacing.sm, lineHeight: fontSizes.md * 1.8 },
  warningItem: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, marginBottom: 2 },
  warningText: { fontSize: fontSizes.sm, fontFamily: fontFamilies.regular, color: colors.danger, lineHeight: fontSizes.sm * 1.8 },

  sectionGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  sectionCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceElevated,
  },
  sectionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sectionCardTitle: { fontSize: fontSizes.sm, fontFamily: fontFamilies.medium, color: colors.textPrimary, textAlign: 'center', lineHeight: fontSizes.sm * 1.8 },

  textSection: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textSectionTitle: { fontSize: fontSizes.md, fontFamily: fontFamilies.bold, color: colors.textPrimary, marginBottom: spacing.sm, lineHeight: fontSizes.md * 1.8 },
  reportTextContainer: { maxHeight: 400, backgroundColor: colors.surfaceCard, borderRadius: 12, padding: spacing.md },
  reportText: { color: colors.textPrimary, fontFamily: fontFamilies.regular, fontSize: 13, lineHeight: 13 * 1.8, textAlign: 'right' },

  disclaimerBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.surfaceCard,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disclaimerText: { flex: 1, fontSize: fontSizes.xs, fontFamily: fontFamilies.regular, color: colors.textSecondary, lineHeight: fontSizes.xs * 1.8 },

  actionButtons: {
    flexDirection: 'row-reverse',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: 14,
    minHeight: 48,
  },
  printBtn: { backgroundColor: colors.accentIndigo },
  pdfBtn: { backgroundColor: colors.accentTeal },
  shareBtn: { backgroundColor: colors.accentAmber },
  actionBtnText: { color: '#fff', fontFamily: fontFamilies.bold, fontSize: fontSizes.sm },
});
