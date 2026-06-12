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
import { useCallback, useEffect, useState, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { usePatientStore } from '../../src/presentation/stores/patientStore';
import { colors, spacing } from '../../src/presentation/theme';
import { Patient } from '../../src/domain/entities/Patient';
import { ActivityLevel } from '../../src/domain/entities/NutritionPlan';
import { ACTIVITY_LEVELS } from '../../src/domain/entities/NutritionPlan';


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

const GENDER_LABELS: Record<string, string> = {
  male: 'ذكر',
  female: 'أنثى',
};

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('sedentary');
  const [dietitianNotes, setDietitianNotes] = useState('');

  const scrollViewRef = useRef<ScrollView>(null);
  const clinicalAnalysisYRef = useRef<number>(0);

  const scrollToClinicalAnalysis = useCallback(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: clinicalAnalysisYRef.current,
        animated: true,
      });
    }
  }, []);

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
      const { GetPatientUseCase } = await import('../../src/domain/use-cases/GetPatientUseCase');
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
    } catch {
      /* error handled in store */
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
    } catch {
      /* error handled in store */
    }
  }, [patient, currentMetrics, activityLevel, generatePlan]);

  const handleSaveNotes = useCallback(async () => {
    if (!currentPlan?.id) return;
    try {
      const { UpdatePlanNotesUseCase } = await import('../../src/domain/use-cases/UpdatePlanNotesUseCase');
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>عودة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView ref={scrollViewRef} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-forward" size={24} color={colors.primaryContrast} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{patient.fullName}</Text>
          <Text style={styles.headerSubtitle}>{patient.fileNumber}</Text>
        </View>

        {/* Patient Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>معلومات المريض</Text>
          <InfoRow label="القسم" value={DEPARTMENT_LABELS[patient.department] || patient.department} />
          <InfoRow label="نوع المريض" value={PATIENT_TYPE_LABELS[patient.patientType] || patient.patientType} />
          <InfoRow label="الجنس" value={GENDER_LABELS[patient.gender] || patient.gender} />
          <InfoRow label="العمر" value={`${patient.age} سنة`} />
          <InfoRow label="التشخيص" value={patient.primaryDiagnosis} />
          <InfoRow label="رقم السرير" value={patient.bedNumber || '-'} />
        </View>

        {/* Clinical Modules Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الأقسام السريرية</Text>
          <View style={styles.twoColumnContainer}>
            {/* Left Column: DATA COLLECTION & ASSESSMENT */}
            <View style={styles.column}>
              <ModuleButton
                title="📜 التاريخ المرضي"
                icon="clipboard"
                route={`/patient/${patient.id}/medical-history`}
                color="#4CAF50"
              />
              <ModuleButton
                title="🌍 التاريخ الاجتماعي والنمط"
                icon="people"
                route={`/patient/${patient.id}/social-history`}
                color="#FF9800"
              />
              <ModuleButton
                title="🩺 الفحص السريري"
                icon="body"
                route={`/patient/${patient.id}/physical-exam`}
                color="#00BCD4"
              />
              <ModuleButton
                title="🧪 الفحوصات المخبرية"
                icon="flask"
                route={`/patient/${patient.id}/laboratory`}
                color="#E91E63"
              />
            </View>

            {/* Right Column: ANALYSIS, CALCULATION & INTERVENTION */}
            <View style={styles.column}>
              <ModuleButton
                title="💊 الأدوية والمكملات"
                icon="medical"
                route={`/patient/${patient.id}/medications`}
                color="#3F51B5"
              />
              <ModuleButton
                title="🧮 حسابات الطاقة التفصيلية"
                icon="calculator"
                route={`/patient/${patient.id}/calculations`}
                color="#607D8B"
              />
              <ModuleButton
                title="🎯 خطة التدخل التغذوي"
                icon="restaurant"
                route={`/patient/${patient.id}/intervention`}
                color="#795548"
              />
              <ModuleButton
                title="🍽️ تخطيط الوجبات والبدائل الغذائية"
                icon="nutrition"
                route={`/patient/${patient.id}/diet-plan`}
                color="#2E7D32"
              />
            </View>
          </View>

          {/* BOTTOM SECTION: MONITORING, ANALYSIS & DISCHARGE */}
          <View style={styles.bottomSection}>
            <ModuleButton
              title="🔬 التحليل السريري"
              icon="analytics"
              onPress={scrollToClinicalAnalysis}
              color="#008080"
              isWide
            />
            <ModuleButton
              title="📉 المتابعة والتقييم"
              icon="pulse"
              route={`/patient/${patient.id}/monitoring`}
              color={colors.primary}
              isWide
            />
            <ModuleButton
              title="🚪 خروج وتلخيص الحالة"
              icon="log-out"
              route={`/patient/${patient.id}/discharge`}
              color="#E67E22"
              isWide
            />
          </View>
        </View>

        {/* Clinical Analysis */}
        <View
          style={styles.section}
          onLayout={(event) => {
            clinicalAnalysisYRef.current = event.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.sectionTitle}>التحليل السريري</Text>

          {/* Weight Input */}
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

          {/* Height Input */}
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

          {/* Activity Level */}
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

          {/* Calculate Button */}
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

          {/* Results */}
          {currentMetrics && (
            <View style={styles.metricsContainer}>
              <MetricDisplay label="مؤشر كتلة الجسم (BMI)" value={currentMetrics.bmi.value.toFixed(2)} />
              <MetricDisplay label="التصنيف" value={currentMetrics.bmi.categoryLabel} color={colors.primary} />
              <View style={styles.clinicalNote}>
                <Text style={styles.clinicalNoteText}>{currentMetrics.bmi.clinicalNote}</Text>
              </View>
              <MetricDisplay label="معدل الأيض الأساسي (BMR)" value={`${currentMetrics.bmr.value.toFixed(0)} سعرة`} />
              <MetricDisplay label="إجمالي السعرات (TDEE)" value={`${currentMetrics.tdee.value} سعرة`} />
            </View>
          )}
        </View>

        {/* Nutrition Plan */}
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
                <MacroBox label="بروتين" grams={currentPlan.macros.proteinGrams} calories={currentPlan.macros.proteinCalories} />
                <MacroBox label="كربوهيدرات" grams={currentPlan.macros.carbsGrams} calories={currentPlan.macros.carbsCalories} />
                <MacroBox label="دهون" grams={currentPlan.macros.fatGrams} calories={currentPlan.macros.fatCalories} />
              </View>

              {currentPlan.recommendations.length > 0 && (
                <View style={styles.listSection}>
                  <Text style={styles.listTitle}>توصيات:</Text>
                  {currentPlan.recommendations.map((r: string, i: number) => (
                    <Text key={i} style={styles.listItem}>• {r}</Text>
                  ))}
                </View>
              )}

              {currentPlan.restrictions.length > 0 && (
                <View style={styles.listSection}>
                  <Text style={[styles.listTitle, { color: colors.danger }]}>محظورات:</Text>
                  {currentPlan.restrictions.map((r: string, i: number) => (
                    <Text key={i} style={[styles.listItem, { color: colors.danger }]}>• {r}</Text>
                  ))}
                </View>
              )}

              {/* Dietitian Notes */}
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

          {/* Generate Plan Button */}
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

function ModuleButton({
  title,
  icon,
  route,
  onPress,
  color,
  isWide = false,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: string;
  onPress?: () => void;
  color: string;
  isWide?: boolean;
}) {
  const router = useRouter();
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (route) {
      router.push(route as any);
    }
  };

  return (
    <TouchableOpacity
      style={[
        isWide ? styles.moduleButtonWide : styles.moduleButton,
        { borderColor: color + '22' }
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[styles.moduleIconContainer, { backgroundColor: color + '12' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.moduleButtonText}>{title}</Text>
    </TouchableOpacity>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function MetricDisplay({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, color ? { color } : undefined]}>{value}</Text>
    </View>
  );
}

function MacroBox({ label, grams, calories }: { label: string; grams: number; calories: number }) {
  return (
    <View style={styles.macroBox}>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroGrams}>{grams} غم</Text>
      <Text style={styles.macroCalories}>{calories} سعرة</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
  },
  errorText: {
    fontSize: 16,
    color: colors.danger,
    marginBottom: spacing.md,
  },
  backButton: {
    padding: spacing.md,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 60,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  backBtn: {
    position: 'absolute',
    top: 54,
    start: spacing.md,
    zIndex: 1,
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'ThmanyahSans-Bold',
    color: colors.primaryContrast,
    textAlign: 'right',
    marginTop: spacing.lg,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'ThmanyahSans-Regular',
    color: colors.primaryContrast,
    opacity: 0.8,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  section: {
    backgroundColor: colors.surface,
    margin: spacing.md,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'ThmanyahSans-Bold',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'right',
  },
  fieldLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceSecondary,
  },
  infoRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
    gap: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  infoValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontFamily: 'ThmanyahSans-Medium',
    textAlign: 'right',
  },
  metricsContainer: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  metricLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  metricValue: {
    fontSize: 14,
    fontFamily: 'ThmanyahSans-Bold',
    color: colors.textPrimary,
  },
  clinicalNote: {
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.sm,
    borderRadius: 8,
    marginVertical: spacing.xs,
  },
  clinicalNoteText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'right',
    lineHeight: 20,
  },
  noDataText: {
    fontSize: 14,
    color: colors.textDisabled,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  activityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  activityButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  activityButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  activityButtonText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  activityButtonTextActive: {
    color: colors.primaryContrast,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 10,
    gap: spacing.sm,
  },
  primaryButtonText: {
    color: colors.primaryContrast,
    fontSize: 15,
    fontFamily: 'ThmanyahSans-Medium',
  },
  planContainer: {
    gap: spacing.sm,
  },
  planTitle: {
    fontSize: 16,
    fontFamily: 'ThmanyahSans-Bold',
    color: colors.success,
    textAlign: 'right',
  },
  adjustmentText: {
    fontSize: 13,
    color: colors.warning,
    textAlign: 'right',
  },
  macroRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  macroBox: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  macroGrams: {
    fontSize: 16,
    fontFamily: 'ThmanyahSans-Bold',
    color: colors.textPrimary,
  },
  macroCalories: {
    fontSize: 11,
    color: colors.textDisabled,
    marginTop: 2,
  },
  listSection: {
    marginTop: spacing.xs,
  },
  listTitle: {
    fontSize: 14,
    fontFamily: 'ThmanyahSans-Bold',
    color: colors.textPrimary,
    textAlign: 'right',
    marginBottom: spacing.xs,
  },
  listItem: {
    fontSize: 13,
    color: colors.textPrimary,
    textAlign: 'right',
    lineHeight: 22,
    paddingEnd: spacing.sm,
  },
  notesLabel: {
    fontSize: 14,
    fontFamily: 'ThmanyahSans-Bold',
    color: colors.textPrimary,
    textAlign: 'right',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceSecondary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: spacing.sm,
    borderRadius: 10,
    marginTop: spacing.sm,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: 'ThmanyahSans-Medium',
  },
  twoColumnContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  column: {
    flex: 1,
    gap: spacing.sm,
  },
  bottomSection: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  moduleButtonWide: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: 10,
    padding: spacing.sm,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.md,
    minHeight: 52,
  },
  moduleButton: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: 10,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 85,
  },
  moduleIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleButtonText: {
    fontSize: 13,
    fontFamily: 'ThmanyahSans-Bold',
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
