import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { usePatientStore } from '../../../src/presentation/stores/patientStore';
import { colors, spacing, safeHeaderPaddingTop } from '../../../src/presentation/theme';
import { Patient } from '../../../src/domain/entities/Patient';
import { ActivityLevel, ACTIVITY_LEVELS } from '../../../src/domain/entities/NutritionPlan';

const DEPARTMENT_LABELS: Record<string, string> = {
  ICU: 'عناية مركزة',
  Internal: 'داخلي',
  Surgical: 'جراحي',
  Pediatrics: 'أطفال',
  'OB/GYN': 'نساء وتوليد',
  Outpatient: 'عيادات خارجية',
};

const PATIENT_TYPE_LABELS: Record<string, string> = {
  inpatient: 'منوم',
  outpatient: 'عيادات خارجية',
  consultation: 'استشارة',
};

export default function ClinicalAnalysisScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('sedentary');
  const [dietitianNotes, setDietitianNotes] = useState('');

  const currentMetrics = usePatientStore((s) => s.currentMetrics);
  const currentPlan = usePatientStore((s) => s.currentPlan);
  const isCalculating = usePatientStore((s) => s.isCalculating);
  const isGeneratingPlan = usePatientStore((s) => s.isGeneratingPlan);
  const calculateMetrics = usePatientStore((s) => s.calculateMetrics);
  const generatePlan = usePatientStore((s) => s.generatePlan);
  const loadMetricsForPatient = usePatientStore((s) => s.loadMetricsForPatient);
  const loadPlanForPatient = usePatientStore((s) => s.loadPlanForPatient);
  const showToast = usePatientStore((s) => s.showToast);

  useEffect(() => {
    loadPatient();
    loadMetricsForPatient(id);
    loadPlanForPatient(id);
  }, [id]);

  useEffect(() => {
    if (currentMetrics) {
      setWeightKg(String(currentMetrics.weightKg));
      setHeightCm(String(currentMetrics.heightCm));
    }
    if (currentPlan?.dietitianNotes) {
      setDietitianNotes(currentPlan.dietitianNotes);
    }
  }, [currentMetrics, currentPlan]);

  async function loadPatient() {
    try {
      const { GetPatientUseCase } = await import('../../../src/domain/use-cases/GetPatientUseCase');
      const useCase = new GetPatientUseCase();
      const p = await useCase.execute(id);
      setPatient(p);
    } catch {
      showToast('فشل في تحميل بيانات المريض', 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleCalculate = useCallback(async () => {
    if (!patient) return;
    const w = parseFloat(weightKg);
    const h = parseFloat(heightCm);
    if (!w || !h || w <= 0 || h <= 0) {
      showToast('يرجى إدخال وزن وطول صحيحين', 'error');
      return;
    }
    try {
      await calculateMetrics({
        patientId: patient.id,
        weightKg: w,
        heightCm: h,
        age: patient.age,
        isMale: patient.gender === 'male',
        activityLevel,
      });
      showToast('تم حساب القياسات بنجاح', 'success');
    } catch {
      // handled in store
    }
  }, [patient, weightKg, heightCm, activityLevel, calculateMetrics, showToast]);

  const handleGeneratePlan = useCallback(async () => {
    if (!patient || !currentMetrics?.id || !currentMetrics?.tdee) return;
    try {
      await generatePlan({
        patientId: patient.id,
        metricsId: currentMetrics.id,
        weightKg: currentMetrics.weightKg,
        tdee: currentMetrics.tdee.value,
        diagnosis: patient.primaryDiagnosis,
        activityLevel,
      });
      showToast('تم إنشاء الخطة الغذائية', 'success');
    } catch {
      // handled in store
    }
  }, [patient, currentMetrics, activityLevel, generatePlan, showToast]);

  const handleSaveNotes = useCallback(async () => {
    if (!currentPlan?.id) return;
    try {
      const { UpdatePlanNotesUseCase } = await import('../../../src/domain/use-cases/UpdatePlanNotesUseCase');
      const useCase = new UpdatePlanNotesUseCase();
      await useCase.execute(currentPlan.id, dietitianNotes);
      showToast('تم حفظ الملاحظات', 'success');
    } catch {
      showToast('فشل في حفظ الملاحظات', 'error');
    }
  }, [currentPlan, dietitianNotes, showToast]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>المريض غير موجود</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-forward" size={24} color={colors.primaryContrast} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>التحليل السريري</Text>
          <Text style={styles.headerSubtitle}>{patient.fullName}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>القياسات والاحتياجات</Text>
          
          <Text style={styles.fieldLabel}>الوزن (كجم)</Text>
          <TextInput
            style={styles.input}
            value={weightKg}
            onChangeText={setWeightKg}
            keyboardType="decimal-pad"
            placeholder="مثال: 70"
            placeholderTextColor={colors.textDisabled}
            textAlign="right"
          />

          <Text style={styles.fieldLabel}>الطول (سم)</Text>
          <TextInput
            style={styles.input}
            value={heightCm}
            onChangeText={setHeightCm}
            keyboardType="decimal-pad"
            placeholder="مثال: 170"
            placeholderTextColor={colors.textDisabled}
            textAlign="right"
          />

          <Text style={styles.fieldLabel}>مستوى النشاط:</Text>
          <View style={styles.activityRow}>
            {(Object.entries(ACTIVITY_LEVELS) as [ActivityLevel, typeof ACTIVITY_LEVELS[ActivityLevel]][]).map(
              ([key, val]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.activityButton,
                    activityLevel === key && styles.activityButtonActive,
                  ]}
                  onPress={() => setActivityLevel(key)}
                >
                  <Text
                    style={[
                      styles.activityButtonText,
                      activityLevel === key && styles.activityButtonTextActive,
                    ]}
                  >
                    {val.label}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleCalculate}
            disabled={isCalculating}
          >
            {isCalculating ? (
              <ActivityIndicator size="small" color={colors.primaryContrast} />
            ) : (
              <>
                <Ionicons name="calculator-outline" size={18} color={colors.primaryContrast} />
                <Text style={styles.primaryButtonText}>حساب القياسات</Text>
              </>
            )}
          </TouchableOpacity>

          {currentMetrics && (
            <View style={styles.metricsContainer}>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>مؤشر كتلة الجسم (BMI)</Text>
                <Text style={styles.metricValue}>{currentMetrics.bmi.value.toFixed(2)}</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>التصنيف</Text>
                <Text style={[styles.metricValue, { color: colors.primary }]}>{currentMetrics.bmi.categoryLabel}</Text>
              </View>
              <View style={styles.clinicalNote}>
                <Text style={styles.clinicalNoteText}>{currentMetrics.bmi.clinicalNote}</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>معدل الأيض الأساسي (BMR)</Text>
                <Text style={styles.metricValue}>{currentMetrics.bmr.value.toFixed(0)} سعرة</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>إجمالي السعرات (TDEE)</Text>
                <Text style={styles.metricValue}>{currentMetrics.tdee.value} سعرة</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>خطة التغذية</Text>

          {currentPlan ? (
            <View style={styles.planContainer}>
              <Text style={styles.planTitle}>
                السعرات المستهدفة: {currentPlan.totalCalories} سعرة/يوم
              </Text>
              {currentPlan.calorieAdjustment !== 0 && (
                <Text style={styles.adjustmentText}>
                  (تعديل: {currentPlan.calorieAdjustment > 0 ? '+' : ''}{currentPlan.calorieAdjustment} سعرة)
                </Text>
              )}

              <View style={styles.macroRow}>
                <View style={styles.macroBox}>
                  <Text style={styles.macroLabel}>بروتين</Text>
                  <Text style={styles.macroGrams}>{currentPlan.macros.proteinGrams} غم</Text>
                  <Text style={styles.macroCalories}>{currentPlan.macros.proteinCalories} سعرة</Text>
                </View>
                <View style={styles.macroBox}>
                  <Text style={styles.macroLabel}>كربوهيدرات</Text>
                  <Text style={styles.macroGrams}>{currentPlan.macros.carbsGrams} غم</Text>
                  <Text style={styles.macroCalories}>{currentPlan.macros.carbsCalories} سعرة</Text>
                </View>
                <View style={styles.macroBox}>
                  <Text style={styles.macroLabel}>دهون</Text>
                  <Text style={styles.macroGrams}>{currentPlan.macros.fatGrams} غم</Text>
                  <Text style={styles.macroCalories}>{currentPlan.macros.fatCalories} سعرة</Text>
                </View>
              </View>

              {currentPlan.recommendations && currentPlan.recommendations.length > 0 && (
                <View style={styles.listSection}>
                  <Text style={styles.listTitle}>توصيات:</Text>
                  {currentPlan.recommendations.map((r: string, i: number) => (
                    <Text key={i} style={styles.listItem}>• {r}</Text>
                  ))}
                </View>
              )}

              {currentPlan.restrictions && currentPlan.restrictions.length > 0 && (
                <View style={styles.listSection}>
                  <Text style={[styles.listTitle, { color: colors.danger }]}>محظورات:</Text>
                  {currentPlan.restrictions.map((r: string, i: number) => (
                    <Text key={i} style={[styles.listItem, { color: colors.danger }]}>• {r}</Text>
                  ))}
                </View>
              )}

              <Text style={styles.notesLabel}>ملاحظات أخصائي التغذية:</Text>
              <TextInput
                style={styles.notesInput}
                value={dietitianNotes}
                onChangeText={setDietitianNotes}
                placeholder="أضف ملاحظات..."
                placeholderTextColor={colors.textDisabled}
                textAlign="right"
                multiline
              />
              {currentPlan.id && (
                <TouchableOpacity style={styles.secondaryButton} onPress={handleSaveNotes}>
                  <Text style={styles.secondaryButtonText}>حفظ الملاحظات</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <Text style={styles.noDataText}>لم يتم إنشاء خطة تغذية بعد</Text>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.success, marginTop: spacing.md }]}
            onPress={handleGeneratePlan}
            disabled={isGeneratingPlan || !currentMetrics}
          >
            {isGeneratingPlan ? (
              <ActivityIndicator size="small" color={colors.primaryContrast} />
            ) : (
              <>
                <Ionicons name="document-text-outline" size={18} color={colors.primaryContrast} />
                <Text style={styles.primaryButtonText}>إنشاء خطة تغذية</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.surfaceSecondary },
  scrollContent: { paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surfaceSecondary },
  errorText: { fontSize: 16, color: colors.danger, fontFamily: 'ThmanyahSans-Medium' },
  header: { backgroundColor: colors.primary, paddingTop: safeHeaderPaddingTop, paddingBottom: spacing.lg, paddingHorizontal: spacing.md, position: 'relative' },
  backBtn: { position: 'absolute', top: safeHeaderPaddingTop - 6, start: spacing.md, zIndex: 1, padding: 4 },
  headerTitle: { fontSize: 22, fontFamily: 'ThmanyahSans-Bold', color: colors.primaryContrast, textAlign: 'right', marginTop: spacing.lg },
  headerSubtitle: { fontSize: 14, fontFamily: 'ThmanyahSans-Regular', color: colors.primaryContrast, opacity: 0.8, textAlign: 'right', marginTop: spacing.xs },
  section: { backgroundColor: colors.surface, margin: spacing.md, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { fontSize: 16, fontFamily: 'ThmanyahSans-Bold', color: colors.textPrimary, marginBottom: spacing.md, textAlign: 'right' },
  fieldLabel: { fontSize: 14, color: colors.textSecondary, textAlign: 'right', marginTop: spacing.sm, marginBottom: spacing.xs, fontFamily: 'ThmanyahSans-Regular' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.sm, fontSize: 16, color: colors.textPrimary, backgroundColor: colors.surfaceSecondary, fontFamily: 'ThmanyahSans-Regular' },
  activityRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm, marginTop: spacing.xs },
  activityButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  activityButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  activityButtonText: { fontSize: 13, color: colors.textSecondary, fontFamily: 'ThmanyahSans-Regular' },
  activityButtonTextActive: { color: colors.primaryContrast },
  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, padding: spacing.md, borderRadius: 10, gap: spacing.sm },
  primaryButtonText: { color: colors.primaryContrast, fontSize: 15, fontFamily: 'ThmanyahSans-Medium' },
  metricsContainer: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md, gap: spacing.sm },
  metricRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: spacing.xs },
  metricLabel: { fontSize: 14, color: colors.textSecondary, fontFamily: 'ThmanyahSans-Regular' },
  metricValue: { fontSize: 14, fontFamily: 'ThmanyahSans-Bold', color: colors.textPrimary },
  clinicalNote: { backgroundColor: colors.surfaceSecondary, padding: spacing.sm, borderRadius: 8, marginVertical: spacing.xs },
  clinicalNoteText: { fontSize: 13, color: colors.textSecondary, textAlign: 'right', lineHeight: 20, fontFamily: 'ThmanyahSans-Regular' },
  planContainer: { gap: spacing.sm },
  planTitle: { fontSize: 16, fontFamily: 'ThmanyahSans-Bold', color: colors.success, textAlign: 'right' },
  adjustmentText: { fontSize: 13, color: colors.warning, textAlign: 'right', fontFamily: 'ThmanyahSans-Regular' },
  macroRow: { flexDirection: 'row-reverse', gap: spacing.sm, marginVertical: spacing.sm },
  macroBox: { flex: 1, backgroundColor: colors.surfaceSecondary, padding: spacing.sm, borderRadius: 8, alignItems: 'center' },
  macroLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 2, fontFamily: 'ThmanyahSans-Regular' },
  macroGrams: { fontSize: 16, fontFamily: 'ThmanyahSans-Bold', color: colors.textPrimary },
  macroCalories: { fontSize: 11, color: colors.textDisabled, marginTop: 2, fontFamily: 'ThmanyahSans-Regular' },
  listSection: { marginTop: spacing.xs },
  listTitle: { fontSize: 14, fontFamily: 'ThmanyahSans-Bold', color: colors.textPrimary, textAlign: 'right', marginBottom: spacing.xs },
  listItem: { fontSize: 13, color: colors.textPrimary, textAlign: 'right', lineHeight: 22, paddingEnd: spacing.sm, fontFamily: 'ThmanyahSans-Regular' },
  notesLabel: { fontSize: 14, fontFamily: 'ThmanyahSans-Bold', color: colors.textPrimary, textAlign: 'right', marginTop: spacing.md, marginBottom: spacing.xs },
  notesInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.sm, fontSize: 14, color: colors.textPrimary, backgroundColor: colors.surfaceSecondary, minHeight: 80, textAlignVertical: 'top', fontFamily: 'ThmanyahSans-Regular' },
  secondaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary, padding: spacing.sm, borderRadius: 10, marginTop: spacing.sm },
  secondaryButtonText: { color: colors.primary, fontSize: 14, fontFamily: 'ThmanyahSans-Medium' },
  noDataText: { fontSize: 14, color: colors.textDisabled, textAlign: 'center', marginVertical: spacing.md, fontFamily: 'ThmanyahSans-Regular' },
});
