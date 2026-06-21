import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase } from '../../../src/data/database';
import { useAdaptiveWizardSteps, WizardStepConfig } from '../../../src/presentation/hooks/useAdaptiveWizardSteps';
import { colors, spacing, safeHeaderPaddingTop } from '../../../src/presentation/theme';
import ArabicText from '../../../src/presentation/components/ArabicText';
import Button from '../../../src/presentation/components/Button';
import { useToastStore } from '../../../src/presentation/stores/toastStore';
import DiabetesForm from '../../../src/presentation/components/DiabetesForm';
import RenalForm from '../../../src/presentation/components/RenalForm';
import IcuCriticalForm from '../../../src/presentation/components/IcuCriticalForm';

const STEP_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  screening: 'search-outline',
  diabetes: 'pulse-outline',
  renal: 'water-outline',
  icu: 'medkit-outline',
  final_report: 'document-text-outline',
};

function StepIndicator({
  step,
  index,
  currentIndex,
  onPress,
}: {
  step: WizardStepConfig;
  index: number;
  currentIndex: number;
  onPress: (index: number) => void;
}) {
  const isActive = index === currentIndex;
  const isDone = step.isCompleted;
  const isFuture = !step.isActive || (index > currentIndex && !isDone);

  const circleBg = isDone ? colors.success : isActive ? colors.primary : isFuture ? colors.surfaceSecondary : colors.textDisabled;
  const circleBorder = isActive ? colors.primary : isDone ? colors.success : colors.border;
  const textColor = isActive || isDone ? colors.primaryContrast : colors.textDisabled;
  const labelColor = isActive ? colors.textPrimary : isDone ? colors.success : colors.textDisabled;

  return (
    <TouchableOpacity
      style={styles.stepIndicator}
      onPress={() => { if (!isFuture) onPress(index); }}
      disabled={isFuture}
    >
      <View style={[styles.stepCircle, { backgroundColor: circleBg, borderColor: circleBorder }]}>
        {isDone ? (
          <Ionicons name="checkmark" size={16} color={colors.primaryContrast} />
        ) : (
          <Text style={[styles.stepNumber, { color: textColor }]}>{index + 1}</Text>
        )}
      </View>
      <ArabicText style={[styles.stepLabel, { color: labelColor }]}>{step.titleAr}</ArabicText>
    </TouchableOpacity>
  );
}

export default function AdaptiveWizardScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const showToast = useToastStore((s) => s.showToast);

  const { steps, loading } = useAdaptiveWizardSteps(patientId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isPromoting, setIsPromoting] = useState(false);

  const currentStep = steps[currentIndex];

  const goNext = useCallback(() => {
    if (currentIndex < steps.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, steps.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  const handleStepComplete = useCallback((stepId: string) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      next.add(stepId);
      return next;
    });
    goNext();
  }, [goNext]);

  const activeSteps = steps.filter((s) => s.isActive);
  const isOnFinalStep = currentStep?.id === 'final_report';
  const allPrecedingDone = activeSteps
    .filter((s) => s.id !== 'final_report')
    .every((s) => completedSteps.has(s.id));

  const handlePromoteToActive = async () => {
    if (!allPrecedingDone) {
      showToast('يرجى إكمال جميع الخطوات النشطة قبل التقرير الختامي', 'error');
      return;
    }

    try {
      setIsPromoting(true);
      const db = await getDatabase();

      await db.write(async () => {
        const patientRecord = await db.get('patients').find(patientId);

        await patientRecord.update((r: any) => {
          r.status = 'active';
          r.incompleteSections = '';
          r.completedAt = new Date();
        });

        const auditLogCollection = db.get('audit_logs');
        await auditLogCollection.create((record: any) => {
          record.actionType = 'wizard_promotion';
          record.userId = 'wizard_auto';
          record.details = JSON.stringify({
            patientId,
            completedSteps: Array.from(completedSteps),
            timestamp: new Date().toISOString(),
          });
        });
      });

      showToast('تم اعتماد الخطة الغذائية الشاملة بنجاح', 'success');
      router.back();
    } catch (e) {
      showToast('فشل في اعتماد الخطة الغذائية', 'error');
    } finally {
      setIsPromoting(false);
    }
  };

  const renderStepContent = () => {
    if (!currentStep) return null;

    switch (currentStep.id) {
      case 'screening': {
        const isScreeningDone = completedSteps.has('screening') || currentStep.isCompleted;
        return (
          <View style={styles.stepContent}>
            <View style={styles.card}>
              <ArabicText bold style={styles.cardTitle}>الفحص التغذوي الأولي</ArabicText>
              <ArabicText style={styles.cardDescription}>
                تم تحديد احتياج المريض للتقييم الغذائي المتقدم بناءً على التشخيص السريري والعلامات الحيوية.
              </ArabicText>
              {isScreeningDone ? (
                <View style={styles.completedBanner}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <ArabicText bold style={styles.completedText}>تم إكمال الفحص التغذوي</ArabicText>
                </View>
              ) : (
                <Button title="تأكيد الفحص والمتابعة" onPress={() => handleStepComplete('screening')} variant="primary" />
              )}
            </View>
          </View>
        );
      }

      case 'diabetes':
        return (
          <View style={styles.stepContent}>
            <DiabetesForm
              patientId={patientId}
              mode="wizard"
              onStepComplete={() => handleStepComplete('diabetes')}
            />
          </View>
        );

      case 'renal':
        return (
          <View style={styles.stepContent}>
            <RenalForm
              patientId={patientId}
              mode="wizard"
              onStepComplete={() => handleStepComplete('renal')}
            />
          </View>
        );

      case 'icu':
        return (
          <View style={styles.stepContent}>
            <IcuCriticalForm
              patientId={patientId}
              mode="wizard"
              onStepComplete={() => handleStepComplete('icu')}
            />
          </View>
        );

      case 'final_report': {
        const completedList = activeSteps.filter((s) => s.id !== 'final_report');
        const doneCount = completedList.filter((s) => completedSteps.has(s.id)).length;
        const totalCount = completedList.length;

        return (
          <View style={styles.stepContent}>
            <View style={styles.card}>
              <ArabicText bold style={styles.cardTitle}>التقرير الختامي</ArabicText>
              <ArabicText style={styles.cardDescription}>
                تم إكمال {doneCount} من {totalCount} خطوات التقييم الغذائي بنجاح.
              </ArabicText>

              <View style={styles.summaryList}>
                {completedList.map((s) => {
                  const isCompleted = completedSteps.has(s.id);
                  return (
                    <View key={s.id} style={styles.summaryItem}>
                      <Ionicons
                        name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                        size={20}
                        color={isCompleted ? colors.success : colors.textDisabled}
                      />
                      <ArabicText style={[styles.summaryText, !isCompleted && { color: colors.textDisabled }]}>
                        {s.titleAr}
                      </ArabicText>
                    </View>
                  );
                })}
              </View>

              {allPrecedingDone && (
                <View style={styles.promotionCard}>
                  <ArabicText bold style={styles.promotionTitle}>اعتماد الخطة الغذائية الشاملة</ArabicText>
                  <ArabicText style={styles.promotionDescription}>
                    سيتم ترقية جميع التقييمات من حالة 'مسودة' إلى 'نشط' وتوليد تقرير نهائي موحد. هذا الإجراء نهائي ولا يمكن التراجع عنه.
                  </ArabicText>
                  <Button
                    title="اعتماد وإنهاء"
                    onPress={handlePromoteToActive}
                    variant="primary"
                    loading={isPromoting}
                  />
                </View>
              )}

              {!allPrecedingDone && (
                <ArabicText style={styles.incompleteHint}>
                  يرجى العودة لإكمال الخطوات المتبقية قبل التمكن من اعتماد الخطة.
                </ArabicText>
              )}
            </View>
          </View>
        );
      }

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-forward" size={24} color={colors.primaryContrast} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <ArabicText bold style={styles.headerTitle}>المعاين التكيفي للخطة الغذائية</ArabicText>
          <ArabicText style={styles.headerSubtitle}>
            الخطوة {currentIndex + 1} من {activeSteps.length}
          </ArabicText>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stepperContainer} contentContainerStyle={styles.stepperContent}>
        {activeSteps.map((step, index) => (
          <StepIndicator
            key={step.id}
            step={step}
            index={index}
            currentIndex={currentIndex}
            onPress={setCurrentIndex}
          />
        ))}
      </ScrollView>

      <ScrollView style={styles.contentArea} contentContainerStyle={styles.contentAreaScroll}>
        {renderStepContent()}

        {!isOnFinalStep && (
          <View style={styles.navigationRow}>
            <TouchableOpacity
              style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
              onPress={goPrev}
              disabled={currentIndex === 0}
            >
              <Ionicons name="arrow-forward" size={20} color={currentIndex === 0 ? colors.textDisabled : colors.textPrimary} />
              <ArabicText style={[styles.navBtnText, currentIndex === 0 && { color: colors.textDisabled }]}>السابق</ArabicText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navBtn, !completedSteps.has(currentStep?.id ?? '') && styles.navBtnDisabled]}
              onPress={goNext}
              disabled={!completedSteps.has(currentStep?.id ?? '')}
            >
              <ArabicText style={[styles.navBtnText, !completedSteps.has(currentStep?.id ?? '') && { color: colors.textDisabled }]}>التالي</ArabicText>
              <Ionicons name="arrow-back" size={20} color={!completedSteps.has(currentStep?.id ?? '') ? colors.textDisabled : colors.textPrimary} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceSecondary },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingTop: safeHeaderPaddingTop + spacing.sm, paddingBottom: spacing.md,
    paddingHorizontal: spacing.md, backgroundColor: colors.surface,
    borderBottomWidth: 1, borderColor: colors.border,
    flexDirection: 'row-reverse', alignItems: 'center',
  },
  backBtn: { padding: spacing.xs, marginLeft: spacing.sm },
  headerTitleContainer: { flex: 1, alignItems: 'flex-end' },
  headerTitle: { fontSize: 16, color: colors.textPrimary },
  headerSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  stepperContainer: { maxHeight: 80, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border },
  stepperContent: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  stepIndicator: { alignItems: 'center', marginHorizontal: spacing.xs, minWidth: 60 },
  stepCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, marginBottom: 4 },
  stepNumber: { fontSize: 14, fontWeight: 'bold' },
  stepLabel: { fontSize: 10, textAlign: 'center' },
  contentArea: { flex: 1 },
  contentAreaScroll: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  stepContent: { flex: 1 },
  card: {
    backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginBottom: spacing.md,
  },
  cardTitle: { fontSize: 16, color: colors.textPrimary, marginBottom: spacing.sm, textAlign: 'right' },
  cardDescription: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, textAlign: 'right', marginBottom: spacing.md },
  completedBanner: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 8, padding: spacing.md },
  completedText: { fontSize: 14, color: colors.success },
  summaryList: { marginBottom: spacing.md },
  summaryItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  summaryText: { fontSize: 14, color: colors.textPrimary, textAlign: 'right' },
  promotionCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)', borderColor: colors.success, borderWidth: 1.5,
    borderRadius: 12, padding: spacing.md, marginTop: spacing.md,
  },
  promotionTitle: { fontSize: 15, color: colors.success, textAlign: 'right', marginBottom: spacing.xs },
  promotionDescription: { fontSize: 12, color: colors.textPrimary, lineHeight: 18, textAlign: 'right', marginBottom: spacing.md },
  incompleteHint: { fontSize: 12, color: colors.warning, textAlign: 'right', marginTop: spacing.md },
  navigationRow: {
    flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: spacing.md,
    borderTopWidth: 1, borderColor: colors.border,
  },
  navBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs, padding: spacing.sm },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: { fontSize: 14, color: colors.textPrimary },
});
