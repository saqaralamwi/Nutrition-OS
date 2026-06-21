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
  Alert,
} from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useToastStore } from '../../../src/presentation/stores/toastStore';
import { colors, spacing, safeHeaderPaddingTop } from '../../../src/presentation/theme';
import { Patient } from '../../../src/domain/entities/Patient';
import { ActivityLevel, ACTIVITY_LEVELS } from '../../../src/domain/entities/NutritionPlan';
import { PatientMetrics } from '../../../src/domain/entities/PatientMetrics';
import { useSafePatientId } from '../../../src/presentation/hooks/useSafePatientId';

interface EngineNutritionPlan {
  totalCalories: number;
  calorieAdjustment: number;
  macros: {
    proteinGrams: number;
    proteinCalories: number;
    carbsGrams: number;
    carbsCalories: number;
    fatGrams: number;
    fatCalories: number;
  };
  recommendations: string[];
  restrictions: string[];
  patientId: string;
  patientMetricsId: string;
}

interface DisplayNutritionPlan {
  id?: string;
  totalCalories: number;
  calorieAdjustment: number;
  macros: {
    proteinGrams: number;
    proteinCalories: number;
    carbsGrams: number;
    carbsCalories: number;
    fatGrams: number;
    fatCalories: number;
  };
  recommendations: string[];
  restrictions: string[];
  dietitianNotes?: string;
}

interface PlanMetadata {
  bmr?: number;
  activityLevel?: string;
}

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

function parseStringArray(json: string | undefined | null): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function tryParsePlanMeta(json: string | undefined | null): PlanMetadata | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return {
        bmr: typeof parsed.bmr === 'number' ? parsed.bmr : undefined,
        activityLevel: typeof parsed.activityLevel === 'string' ? parsed.activityLevel : undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export default function ClinicalAnalysisScreen() {
  const id = useSafePatientId();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('sedentary');
  const [dietitianNotes, setDietitianNotes] = useState('');

  const [savedWeight, setSavedWeight] = useState('');
  const [savedHeight, setSavedHeight] = useState('');
  const [savedActivity, setSavedActivity] = useState<ActivityLevel>('sedentary');
  const [savedNotes, setSavedNotes] = useState('');

  const showToast = useToastStore((s) => s.showToast);

  const [currentMetrics, setCurrentMetrics] = useState<PatientMetrics | null>(null);
  const [currentPlan, setCurrentPlan] = useState<DisplayNutritionPlan | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const restorationAttempted = useRef(false);

  useEffect(() => {
    if (!id) {
      router.replace('/');
      return;
    }
    loadPatient();
    setCurrentMetrics(null);
    setCurrentPlan(null);
    restorationAttempted.current = false;
  }, [id]);

  useEffect(() => {
    if (!patient || restorationAttempted.current) return;
    restorationAttempted.current = true;
    restorePriorRecords();
  }, [patient]);

  const navigation = useNavigation();

  // Check for any unsaved changes compared to the last database record
  const hasUnsavedChanges = useMemo(() => {
    return (
      weightKg !== savedWeight ||
      heightCm !== savedHeight ||
      activityLevel !== savedActivity ||
      dietitianNotes !== savedNotes
    );
  }, [weightKg, savedWeight, heightCm, savedHeight, activityLevel, savedActivity, dietitianNotes, savedNotes]);

  // Intercept navigation if there are unsaved changes
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!hasUnsavedChanges) {
        return;
      }

      e.preventDefault();

      Alert.alert(
        'تنبيه: تغييرات غير محفوظة',
        'لديك تغييرات غير محفوظة على هذه الصفحة. هل ترغب في الخروج وتجاهل التغييرات؟',
        [
          {
            text: 'تراجع وبقاء',
            style: 'cancel',
            onPress: () => {},
          },
          {
            text: 'تجاهل وخروج',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, hasUnsavedChanges]);

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

  async function restorePriorRecords() {
    if (!patient) return;
    setRestoring(true);
    try {
      const { VitalsRepository } = await import('../../../src/data/repositories/VitalsRepository');
      const vitalsRepo = new VitalsRepository();
      const latestVitals = await vitalsRepo.getLatestByPatientId(id);

      if (latestVitals && latestVitals.weightKg && latestVitals.heightCm) {
        const wtStr = String(latestVitals.weightKg);
        const htStr = String(latestVitals.heightCm);
        setWeightKg(wtStr);
        setSavedWeight(wtStr);
        setHeightCm(htStr);
        setSavedHeight(htStr);

        const { calculateBmi } = await import('../../../src/domain/calculators/BmiCalculator');
        const { calculateBmr } = await import('../../../src/domain/calculators/BmrCalculator');
        const { calculateTdee } = await import('../../../src/domain/calculators/TdeeCalculator');

        const bmiResult = calculateBmi(latestVitals.weightKg, latestVitals.heightCm);
        const bmrResult = calculateBmr(
          latestVitals.weightKg,
          latestVitals.heightCm,
          patient.age ?? 30,
          patient.gender === 'male',
        );
        const tdeeResult = calculateTdee(bmrResult.value, activityLevel);

        setCurrentMetrics({
          patientId: id,
          weightKg: latestVitals.weightKg,
          heightCm: latestVitals.heightCm,
          bmi: bmiResult,
          bmr: bmrResult,
          tdee: tdeeResult,
        });
      }

      const { NutritionPlanRepository } = await import('../../../src/data/repositories/NutritionPlanRepository');
      const planRepo = new NutritionPlanRepository();
      const latestPlan = await planRepo.getLatestByPatientId(id);

      if (latestPlan) {
        let restoredActivity: ActivityLevel | undefined;
        const meta = tryParsePlanMeta(latestPlan.mealsJson);
        if (meta?.activityLevel && meta.activityLevel in ACTIVITY_LEVELS) {
          restoredActivity = meta.activityLevel as ActivityLevel;
        }

        setCurrentPlan({
          id: latestPlan.id,
          totalCalories: latestPlan.targetCalories,
          calorieAdjustment: 0,
          macros: {
            proteinGrams: latestPlan.proteinTarget,
            proteinCalories: latestPlan.proteinTarget * 4,
            carbsGrams: latestPlan.carbsTarget,
            carbsCalories: latestPlan.carbsTarget * 4,
            fatGrams: latestPlan.fatTarget,
            fatCalories: latestPlan.fatTarget * 9,
          },
          recommendations: parseStringArray(latestPlan.recommendationsJson),
          restrictions: [],
          dietitianNotes: latestPlan.dietitianNotes ?? '',
        });

        const notes = latestPlan.dietitianNotes ?? '';
        setDietitianNotes(notes);
        setSavedNotes(notes);

        if (restoredActivity) {
          setActivityLevel(restoredActivity);
          setSavedActivity(restoredActivity);
        }
      }
    } catch {
      showToast('فشل في استعادة البيانات السابقة', 'error');
    } finally {
      setRestoring(false);
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
    setIsCalculating(true);
    try {
      const { calculatePatientMetrics } = await import('../../../src/domain/calculators/NutritionEngine');
      const result = calculatePatientMetrics({
        patientId: patient.id,
        weightKg: w,
        heightCm: h,
        age: patient.age ?? 30,
        isMale: patient.gender === 'male',
        activityLevel,
      });

      const { VitalsRepository } = await import('../../../src/data/repositories/VitalsRepository');
      const vitalsRepo = new VitalsRepository();
      await vitalsRepo.create({
        patientId: patient.id,
        weightKg: w,
        heightCm: h,
        bmi: result.bmi.value,
      });

      const { NutritionPlanRepository } = await import('../../../src/data/repositories/NutritionPlanRepository');
      const planRepo = new NutritionPlanRepository();
      await planRepo.save({
        patientId: patient.id,
        targetCalories: result.tdee.value,
        proteinTarget: 0,
        carbsTarget: 0,
        fatTarget: 0,
        fluidTarget: 0,
        mealsJson: JSON.stringify({ bmr: result.bmr.value, activityLevel }),
        recommendationsJson: '[]',
        vitalsId: undefined,
      });

      setCurrentMetrics(result);
      setSavedWeight(String(w));
      setSavedHeight(String(h));
      setSavedActivity(activityLevel);
      setIsCalculating(false);
      showToast('تم حساب القياسات وحفظها بنجاح', 'success');
    } catch {
      setIsCalculating(false);
      showToast('حدث خطأ أثناء حفظ القياسات في قاعدة البيانات', 'error');
    }
  }, [patient, weightKg, heightCm, activityLevel, showToast]);

  const handleGeneratePlan = useCallback(async () => {
    if (!patient || !currentMetrics) return;
    setIsGeneratingPlan(true);
    try {
      const { generateNutritionPlan } = await import('../../../src/domain/calculators/NutritionEngine');
      const rawPlan = generateNutritionPlan({
        patientId: patient.id,
        metricsId: currentMetrics.id ?? '',
        weightKg: currentMetrics.weightKg || parseFloat(weightKg),
        tdee: currentMetrics.tdee.value || 1800,
        diagnosis: patient.primaryDiagnosis ?? '',
        activityLevel,
      }) as unknown as EngineNutritionPlan;

      const { NutritionPlanRepository } = await import('../../../src/data/repositories/NutritionPlanRepository');
      const planRepo = new NutritionPlanRepository();

      const planId = await planRepo.save({
        patientId: patient.id,
        targetCalories: rawPlan.totalCalories,
        proteinTarget: rawPlan.macros.proteinGrams,
        carbsTarget: rawPlan.macros.carbsGrams,
        fatTarget: rawPlan.macros.fatGrams,
        fluidTarget: 0,
        mealsJson: JSON.stringify({
          bmr: currentMetrics.bmr.value,
          activityLevel,
          meals: [],
        }),
        recommendationsJson: JSON.stringify(rawPlan.recommendations ?? []),
        dietitianNotes: dietitianNotes || '',
      });

      setCurrentPlan({
        id: planId,
        totalCalories: rawPlan.totalCalories,
        calorieAdjustment: rawPlan.calorieAdjustment,
        macros: rawPlan.macros,
        recommendations: rawPlan.recommendations ?? [],
        restrictions: rawPlan.restrictions ?? [],
        dietitianNotes: dietitianNotes || '',
      });
      setSavedNotes(dietitianNotes);
      setSavedActivity(activityLevel);
      setIsGeneratingPlan(false);
      showToast('تم إنشاء الخطة الغذائية وحفظها بنجاح', 'success');
    } catch {
      setIsGeneratingPlan(false);
      showToast('حدث خطأ أثناء حفظ الخطة الغذائية في قاعدة البيانات', 'error');
    }
  }, [patient, currentMetrics, activityLevel, showToast, weightKg, dietitianNotes]);

  const handleSaveNotes = useCallback(async () => {
    if (!currentPlan?.id) return;
    try {
      const { NutritionPlanRepository } = await import('../../../src/data/repositories/NutritionPlanRepository');
      const planRepo = new NutritionPlanRepository();
      await planRepo.updateNotes(currentPlan.id, dietitianNotes);
      setCurrentPlan((prev) => prev ? { ...prev, dietitianNotes } : null);
      setSavedNotes(dietitianNotes);
      showToast('تم حفظ الملاحظات بنجاح', 'success');
    } catch {
      showToast('حدث خطأ أثناء حفظ الملاحظات في قاعدة البيانات', 'error');
    }
  }, [currentPlan, dietitianNotes, showToast]);

  if (!id) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>معرف المريض غير صالح</Text>
      </View>
    );
  }

  if (loading || restoring) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>
          {restoring ? 'جاري استعادة البيانات...' : 'جاري التحميل...'}
        </Text>
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
                <Text style={styles.metricValue}>{(currentMetrics.bmi?.value ?? 0).toFixed(2)}</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>التصنيف</Text>
                <Text style={[styles.metricValue, { color: colors.primary }]}>{currentMetrics.bmi?.categoryLabel ?? 'غير محدد'}</Text>
              </View>
              <View style={styles.clinicalNote}>
                <Text style={styles.clinicalNoteText}>{currentMetrics.bmi?.clinicalNote ?? ''}</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>معدل الأيض الأساسي (BMR)</Text>
                <Text style={styles.metricValue}>{(currentMetrics.bmr?.value ?? 0).toFixed(0)} سعرة</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>إجمالي السعرات (TDEE)</Text>
                <Text style={styles.metricValue}>{(currentMetrics.tdee?.value ?? 0)} سعرة</Text>
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

              {currentPlan.recommendations.length > 0 && (
                <View style={styles.listSection}>
                  <Text style={styles.listTitle}>توصيات:</Text>
                  {currentPlan.recommendations.map((r, i) => (
                    <Text key={i} style={styles.listItem}>• {r}</Text>
                  ))}
                </View>
              )}

              {currentPlan.restrictions.length > 0 && (
                <View style={styles.listSection}>
                  <Text style={[styles.listTitle, { color: colors.danger }]}>محظورات:</Text>
                  {currentPlan.restrictions.map((r, i) => (
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
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'ThmanyahSans-Regular',
    marginTop: spacing.sm,
    lineHeight: 14 * 1.8,
  },
  header: { backgroundColor: colors.primary, paddingTop: safeHeaderPaddingTop, paddingBottom: spacing.lg, paddingHorizontal: spacing.md, position: 'relative' },
  backBtn: { position: 'absolute', top: safeHeaderPaddingTop - 6, start: spacing.md, zIndex: 1, padding: 4 },
  headerTitle: { fontSize: 22, fontFamily: 'ThmanyahSans-Bold', color: colors.primaryContrast, textAlign: 'right', marginTop: spacing.lg },
  headerSubtitle: { fontSize: 14, fontFamily: 'ThmanyahSans-Regular', color: colors.primaryContrast, opacity: 0.8, textAlign: 'right', marginTop: spacing.xs },
  section: { backgroundColor: colors.surface, margin: spacing.md, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { fontSize: 16, fontFamily: 'ThmanyahSans-Bold', color: colors.textPrimary, marginBottom: spacing.md, textAlign: 'right' },
  fieldLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    fontFamily: 'ThmanyahSans-Regular',
    lineHeight: 14 * 1.8,
  },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.sm, fontSize: 16, color: colors.textPrimary, backgroundColor: colors.surfaceSecondary, fontFamily: 'ThmanyahSans-Regular' },
  activityRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm, marginTop: spacing.xs },
  activityButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  activityButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  activityButtonText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: 'ThmanyahSans-Regular',
    lineHeight: 13 * 1.8,
  },
  activityButtonTextActive: { color: colors.primaryContrast },
  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, padding: spacing.md, borderRadius: 10, gap: spacing.sm },
  primaryButtonText: {
    color: colors.primaryContrast,
    fontSize: 15,
    fontFamily: 'ThmanyahSans-Medium',
    lineHeight: 15 * 1.8,
  },
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
  noDataText: {
    fontSize: 15,
    color: colors.textPrimary,
    textAlign: 'center',
    marginVertical: spacing.md,
    fontFamily: 'ThmanyahSans-Regular',
    lineHeight: 15 * 1.8,
  },
});
