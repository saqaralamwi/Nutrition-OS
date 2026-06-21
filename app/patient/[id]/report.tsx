import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import * as Print from 'expo-print';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useSafePatientId } from '../../../src/presentation/hooks/useSafePatientId';
import { colors, spacing, safeHeaderPaddingTop, fontFamilies, fontSizes } from '../../../src/presentation/theme';
import ArabicText from '../../../src/presentation/components/ArabicText';
import Button from '../../../src/presentation/components/Button';
import { useToastStore } from '../../../src/presentation/stores/toastStore';
import { ReportGenerator } from '../../../src/domain/reports/ReportGenerator';
import { renderHtml } from '../../../src/presentation/reports/HtmlRenderer';
import type { ReportPayload } from '../../../src/domain/reports/ReportTemplate';

type GenerationState = 'idle' | 'generating' | 'preview';

const SEVERITY_COLORS: Record<string, string> = {
  normal: colors.success,
  warning: colors.accentAmber,
  critical: colors.danger,
};

export default function ReportScreen() {
  const patientId = useSafePatientId();
  const router = useRouter();
  const showToast = useToastStore((s) => s.showToast);

  const [state, setState] = useState<GenerationState>('idle');
  const [payload, setPayload] = useState<ReportPayload | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [certActorName, setCertActorName] = useState('');
  const [certJustification, setCertJustification] = useState('');
  const [certRole, setCertRole] = useState<'nutritionist' | 'pharmacist' | 'systems_consultant'>('nutritionist');

  useEffect(() => {
    loadHistory();
  }, [patientId]);

  async function loadHistory() {
    setLoadingHistory(true);
    const items = await ReportGenerator.fetchReports(patientId);
    setHistory(items);
    setLoadingHistory(false);
  }

  async function handleGenerate(reportType: 'clinical-summary' | 'full-assessment') {
    try {
      setState('generating');
      const result = await ReportGenerator.generate(patientId, reportType);
      if (!result) {
        showToast('فشل إنشاء التقرير — بيانات المريض غير متوفرة', 'error');
        setState('idle');
        return;
      }
      const html = renderHtml(result);
      setPayload(result);
      setHtmlContent(html);
      setState('preview');
      showToast(
        reportType === 'clinical-summary' ? 'تم إنشاء الملخص السريري' : 'تم إنشاء التقرير الشامل',
        'success',
      );
    } catch (err: any) {
      showToast('فشل إنشاء التقرير', 'error');
      setState('idle');
    }
  }

  const handleExportPdf = useCallback(async () => {
    if (!htmlContent) return;
    try {
      setIsExporting(true);
      const { uri } = await Print.printToFileAsync({ html: htmlContent, base64: false });
      const Sharing = await import('expo-sharing');
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `التقرير السريري - ${payload?.profile.fullName ?? ''}`,
          UTI: 'com.adobe.pdf',
        });
      }
      showToast('تم تصدير التقرير بنجاح', 'success');
    } catch {
      showToast('فشل تصدير ملف PDF', 'error');
    } finally {
      setIsExporting(false);
    }
  }, [htmlContent, payload, showToast]);

  const handlePrint = useCallback(async () => {
    if (!htmlContent) return;
    try {
      await Print.printAsync({ html: htmlContent });
    } catch {
      showToast('فشلت الطباعة', 'error');
    }
  }, [htmlContent, showToast]);

  async function handleCertifyAndExport() {
    if (!payload || !htmlContent) return;
    setCertActorName('');
    setCertJustification('');
    setCertRole('nutritionist');
    setShowCertModal(true);
  }

  async function executeCertification() {
    if (!payload || !htmlContent) return;
    const actorName = certActorName.trim();
    if (!actorName) {
      showToast('الرجاء إدخال اسم الفاحص', 'error');
      return;
    }
    if (certJustification.trim().length < 15) {
      showToast('يجب أن يكون التبرير 15 حرفاً على الأقل', 'error');
      return;
    }

    setShowCertModal(false);
    try {
      setIsExporting(true);
      const certified = await ReportGenerator.certifyReport(
        patientId,
        payload.reportType,
        actorName,
        certRole,
        certJustification.trim(),
      );
      if (!certified) {
        showToast('فشلت عملية التصديق — بيانات غير كافية', 'error');
        setIsExporting(false);
        return;
      }

      const certifiedHtml = renderHtml(certified.payload);
      const { uri } = await Print.printToFileAsync({ html: certifiedHtml, base64: true });

      const recordId = await ReportGenerator.saveToDatabase(certified.payload, uri);
      if (recordId) {
        showToast(`تم التصديق والحفظ بنجاح (${certified.hash.slice(0, 16)}...)`, 'success');
        await loadHistory();
      } else {
        showToast('تم إنشاء PDF ولكن فشل الحفظ في قاعدة البيانات', 'info');
      }

      const Sharing = await import('expo-sharing');
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `تقرير مصدق - ${payload.profile.fullName}`,
          UTI: 'com.adobe.pdf',
        });
      }
    } catch {
      showToast('فشلت عملية التصديق والتصدير', 'error');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={colors.primaryContrast} />
        </TouchableOpacity>
        <ArabicText style={styles.headerTitle}>مركز التقارير السريرية</ArabicText>
        <ArabicText style={styles.headerSubtitle}>إنشاء وعرض وتصدير التقارير</ArabicText>
      </View>

      <View style={styles.actionCard}>
        <ArabicText style={styles.actionCardTitle}>إنشاء تقرير جديد</ArabicText>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.accentTeal }]}
            onPress={() => handleGenerate('clinical-summary')}
            disabled={state === 'generating'}
          >
            {state === 'generating' ? (
              <ActivityIndicator size="small" color={colors.primaryContrast} />
            ) : (
              <>
                <Ionicons name="document-text-outline" size={20} color={colors.primaryContrast} />
                <ArabicText style={styles.actionBtnText}>الملخص السريري</ArabicText>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={() => handleGenerate('full-assessment')}
            disabled={state === 'generating'}
          >
            {state === 'generating' ? (
              <ActivityIndicator size="small" color={colors.primaryContrast} />
            ) : (
              <>
                <Ionicons name="document-text" size={20} color={colors.primaryContrast} />
                <ArabicText style={styles.actionBtnText}>التقرير الشامل</ArabicText>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {state === 'preview' && payload && (
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <Ionicons name="eye-outline" size={20} color={colors.accentTeal} />
            <ArabicText style={styles.previewTitle}>
              {payload.reportType === 'clinical-summary' ? 'الملخص السريري' : 'التقرير الشامل'}
            </ArabicText>
            <ArabicText style={styles.previewMeta}>
              {new Date(payload.generatedAt).toLocaleString('ar-SA')}
            </ArabicText>
          </View>

          <View style={styles.previewActions}>
            <TouchableOpacity
              style={[styles.actionBtnSmall, { backgroundColor: colors.primary }]}
              onPress={handleExportPdf}
              disabled={isExporting}
            >
              {isExporting ? (
                <ActivityIndicator size="small" color={colors.primaryContrast} />
              ) : (
                <>
                  <Ionicons name="download-outline" size={16} color={colors.primaryContrast} />
                  <ArabicText style={styles.actionSmallText}>تصدير PDF</ArabicText>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtnSmall, { backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.border }]}
              onPress={handlePrint}
            >
              <Ionicons name="print-outline" size={16} color={colors.textPrimary} />
              <ArabicText style={[styles.actionSmallText, { color: colors.textPrimary }]}>طباعة</ArabicText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtnSmall, { backgroundColor: colors.accentAmber }]}
              onPress={handleCertifyAndExport}
              disabled={isExporting}
            >
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.primaryContrast} />
              <ArabicText style={styles.actionSmallText}>تصديق وتصدير</ArabicText>
            </TouchableOpacity>
          </View>

          {payload.sections.map((section) => (
            <View key={section.id} style={styles.sectionBlock}>
              <View style={styles.sectionTitleRow}>
                <ArabicText style={styles.sectionTitle}>{section.title}</ArabicText>
              </View>
              {section.findings.map((f, i) => (
                <View key={i} style={styles.findingRow}>
                  <View style={[styles.severityDot, { backgroundColor: f.severity ? SEVERITY_COLORS[f.severity] || colors.textSecondary : colors.textSecondary }]} />
                  <ArabicText style={styles.findingLabel}>{f.label}</ArabicText>
                  <ArabicText style={styles.findingValue}>{f.value}{f.unit ? ` ${f.unit}` : ''}</ArabicText>
                </View>
              ))}
              {section.narrative && (
                <View style={styles.narrativeBox}>
                  <ArabicText style={styles.narrativeText}>{section.narrative}</ArabicText>
                </View>
              )}
              {section.badges && section.badges.length > 0 && (
                <View style={styles.badgeRow}>
                  {section.badges.map((b, i) => (
                    <View key={i} style={[styles.badge, { backgroundColor: b.color }]}>
                      <ArabicText style={styles.badgeText}>{b.label}</ArabicText>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}

          {payload.certificationFingerprint && (
            <View style={styles.certBlock}>
              <Ionicons name="shield-checkmark" size={16} color={colors.accentAmber} />
              <ArabicText style={styles.certText}>
                بصمة التصديق: {payload.certificationFingerprint.slice(0, 24)}...
              </ArabicText>
            </View>
          )}
        </View>
      )}

      <View style={styles.historyCard}>
        <ArabicText style={styles.historyTitle}>التقارير السابقة</ArabicText>
        {loadingHistory ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />
        ) : history.length === 0 ? (
          <ArabicText style={styles.noData}>لا توجد تقارير سابقة</ArabicText>
        ) : (
          history.map((item) => (
            <View key={item.id} style={styles.historyRow}>
              <View style={styles.historyInfo}>
                <ArabicText style={styles.historyType}>
                  {item.reportType === 'clinical-summary' ? 'ملخص سريري' : 'تقرير شامل'}
                </ArabicText>
                <ArabicText style={styles.historyDate}>
                  {new Date(item.generatedAt).toLocaleString('ar-SA')}
                </ArabicText>
              </View>
              {item.digitalFingerprintHash && (
                <Ionicons name="shield-checkmark" size={16} color={colors.success} />
              )}
            </View>
          ))
        )}
      </View>

      <View style={{ height: spacing.xxl * 2 }} />
      <Modal visible={showCertModal} transparent animationType="fade" onRequestClose={() => setShowCertModal(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContent}>
            <ArabicText style={styles.modalTitle}>الفحص السريري والتوثيق</ArabicText>

            <ArabicText style={styles.modalLabel}>اسم الفاحص</ArabicText>
            <TextInput
              style={styles.modalInput}
              value={certActorName}
              onChangeText={setCertActorName}
              placeholder="أدخل اسم الفاحص"
              placeholderTextColor={colors.textSecondary}
              textAlign="right"
              autoFocus
            />

            <ArabicText style={styles.modalLabel}>سبب التصديق (15 حرفاً على الأقل)</ArabicText>
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              value={certJustification}
              onChangeText={setCertJustification}
              placeholder="التبرير السريري..."
              placeholderTextColor={colors.textSecondary}
              textAlign="right"
              multiline
            />

            <ArabicText style={styles.modalLabel}>دور الفاحص</ArabicText>
            <View style={styles.roleRow}>
              {(['nutritionist', 'pharmacist', 'systems_consultant'] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleChip, certRole === r && styles.roleChipActive]}
                  onPress={() => setCertRole(r)}
                >
                  <ArabicText style={[styles.roleChipText, certRole === r && styles.roleChipTextActive]}>
                    {r === 'nutritionist' ? 'أخصائي تغذية' : r === 'pharmacist' ? 'صيدلي' : 'مستشار أنظمة'}
                  </ArabicText>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Button title="إلغاء" onPress={() => setShowCertModal(false)} variant="secondary" />
              <Button title="تصديق وتصدير" onPress={executeCertification} variant="primary" />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceSecondary },
  header: {
    backgroundColor: colors.primaryDark,
    paddingTop: safeHeaderPaddingTop,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backBtn: {
    position: 'absolute',
    top: safeHeaderPaddingTop + 4,
    start: spacing.lg,
    zIndex: 1,
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fontFamilies.bold,
    color: colors.primaryContrast,
    textAlign: 'right',
    marginTop: 36,
  },
  headerSubtitle: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.regular,
    color: colors.textTertiary,
    textAlign: 'right',
    marginTop: 2,
    opacity: 0.85,
  },
  actionCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionCardTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fontFamilies.bold,
    color: colors.textPrimary,
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  actionRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 52,
  },
  actionBtnText: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.bold,
    color: colors.primaryContrast,
  },
  previewCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accentTeal + '40',
  },
  previewHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  previewTitle: {
    fontSize: fontSizes.md,
    fontFamily: fontFamilies.bold,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  previewMeta: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.regular,
    color: colors.textSecondary,
  },
  previewActions: {
    flexDirection: 'row-reverse',
    gap: spacing.xs,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  actionBtnSmall: {
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 36,
  },
  actionSmallText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.bold,
    color: colors.primaryContrast,
  },
  sectionBlock: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionTitleRow: {
    flexDirection: 'row-reverse',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.bold,
    color: colors.accentTeal,
    textAlign: 'right',
  },
  findingRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    gap: spacing.sm,
  },
  severityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  findingLabel: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.regular,
    color: colors.textSecondary,
    flex: 1,
    textAlign: 'right',
  },
  findingValue: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.bold,
    color: colors.textPrimary,
    textAlign: 'left',
    direction: 'ltr',
  },
  narrativeBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRightWidth: 4,
    borderRightColor: '#F59E0B',
    borderRadius: 4,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  narrativeText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.regular,
    color: '#92400E',
  },
  badgeRow: {
    flexDirection: 'row-reverse',
    gap: spacing.xs,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.bold,
    color: '#FFFFFF',
  },
  certBlock: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.accentAmber + '18',
    borderRadius: 8,
  },
  certText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.regular,
    color: colors.accentAmber,
    flex: 1,
    textAlign: 'right',
  },
  historyCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyTitle: {
    fontSize: fontSizes.md,
    fontFamily: fontFamilies.bold,
    color: colors.textPrimary,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  historyRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  historyInfo: {
    flex: 1,
  },
  historyType: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.medium,
    color: colors.textPrimary,
    textAlign: 'right',
  },
  historyDate: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.regular,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  noData: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    paddingVertical: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fontFamilies.bold,
    color: colors.textPrimary,
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  modalLabel: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.medium,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  modalInput: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    textAlign: 'right',
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  roleRow: {
    flexDirection: 'row-reverse',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  roleChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceCard,
  },
  roleChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleChipText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.medium,
    color: colors.textPrimary,
  },
  roleChipTextActive: {
    color: colors.primaryContrast,
  },
  modalActions: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});
