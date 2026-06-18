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
import * as Print from 'expo-print';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useToastStore } from '../../src/presentation/stores/toastStore';
import { useSettingsStore } from '../../src/presentation/stores/settingsStore';
import { colors, spacing, safeHeaderPaddingTop, fontFamilies, fontSizes, lineHeights } from '../../src/presentation/theme';
import { Patient } from '../../src/domain/entities/Patient';
import { ActivityLevel, ACTIVITY_LEVELS } from '../../src/domain/entities/NutritionPlan';
import DropdownField from '../../src/presentation/components/DropdownField';
import ClinicalAlertsBanner from '../../src/presentation/components/ClinicalAlertsBanner';
import useClinicalAlerts from '../../src/presentation/hooks/useClinicalAlerts';
import { withAuth } from '../../src/presentation/components/withAuth';

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

const FREQUENCY_LABELS: Record<string, string> = {
  once_daily: 'مرة يومياً',
  twice_daily: 'مرتين يومياً',
  three_times_daily: 'ثلاث مرات يومياً',
  four_times_daily: 'أربع مرات يومياً',
  prn: 'عند الحاجة',
  weekly: 'أسبوعياً',
  monthly: 'شهرياً',
};

const SUPPLEMENT_TYPE_LABELS: Record<string, string> = {
  vitamin: 'فيتامين',
  mineral: 'معدن',
  protein: 'بروتين',
  amino_acid: 'أحماض أمينية',
  herbal: 'أعشاب',
  oil: 'زيوت',
  other: 'أخرى',
};

function PatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('sedentary');
  const [showMoreTools, setShowMoreTools] = useState(false);

  const { alerts } = useClinicalAlerts(id);

  const [medicalHistory, setMedicalHistory] = useState<any>(null);
  const [socialHistory, setSocialHistory] = useState<any>(null);
  const [physicalExam, setPhysicalExam] = useState<any[]>([]);
  const [labResults, setLabResults] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [supplements, setSupplements] = useState<any[]>([]);
  const [intervention, setIntervention] = useState<any>(null);

  const diagnosisCategory = useMemo(() => {
    if (!patient) return 'GENERAL';
    const diag = patient.primaryDiagnosis?.toLowerCase() || '';
    const dept = patient.department?.toLowerCase() || '';
    if (dept.includes('icu') || diag.includes('icu') || diag.includes('critical') || diag.includes('عناية') || diag.includes('حرجة')) return 'ICU';
    if (diag.includes('renal') || diag.includes('kidney') || diag.includes('كلى') || diag.includes('فشل')) return 'RENAL';
    if (diag.includes('diabetes') || diag.includes('dm') || diag.includes('سكر')) return 'DIABETES';
    return 'GENERAL';
  }, [patient]);

  const MODULES_CONFIG = useMemo(() => [
    { id: 'medical-history', title: 'التاريخ المرضي', icon: 'clipboard' as const, route: `/patient/${patient?.id}/medical-history`, color: colors.accentTeal },
    { id: 'social-history', title: 'التاريخ الاجتماعي والنمط', icon: 'people' as const, route: `/patient/${patient?.id}/social-history`, color: colors.accentAmber },
    { id: 'physical-exam', title: 'الفحص السريري', icon: 'person' as const, route: `/patient/${patient?.id}/physical-exam`, color: colors.accentSky },
    { id: 'laboratory', title: 'الفحوصات المخبرية', icon: 'flask' as const, route: `/patient/${patient?.id}/laboratory`, color: colors.accentRose },
    { id: 'screening', title: 'تقييم الخطر التغذوي (NRS-2002)', icon: 'checkbox-outline' as const, route: `/patient/${patient?.id}/screening`, color: colors.accentTeal, minAge: 18 },
    { id: 'stamp', title: 'فحص سوء التغذية للأطفال (STAMP)', icon: 'bonfire' as const, route: `/patient/${patient?.id}/stamp`, color: colors.accentAmber, maxAge: 17 },
    { id: 'icu-admission', title: 'قبول العناية المركزة (ICU)', icon: 'fitness' as const, route: `/patient/${patient?.id}/icu-admission`, color: colors.danger, highlightFor: ['ICU'] },
    { id: 'dietary-history', title: 'تقييم التاريخ التغذوي (24h Recall)', icon: 'clipboard' as const, route: `/meal-planner/dietary-history?patientId=${patient?.id}`, color: colors.accentIndigo },
    { id: 'medications', title: 'الأدوية والمكملات', icon: 'medical' as const, route: `/patient/${patient?.id}/medications`, color: colors.accentIndigo },
    { id: 'supplements', title: 'المكملات الغذائية (منفصل)', icon: 'nutrition' as const, route: `/patient/${patient?.id}/supplements`, color: colors.accentTeal },
    { id: 'cardio-assessment', title: 'تقييم القلب والأوعية الدموية', icon: 'heart' as const, route: `/patient/${patient?.id}/cardio-assessment`, color: colors.accentRose, isWide: true },
    { id: 'iv-medications', title: 'المحاليل والأدوية المسببة للسعرات', icon: 'flask-outline' as const, route: `/patient/${patient?.id}/iv-medications`, color: colors.accentAmber, highlightFor: ['ICU'] },
    { id: 'nutrition-calculator', title: 'حاسبة التغذية الأنبوبية والوريدية', icon: 'flask' as const, route: `/patient/${patient?.id}/nutrition-calculator`, color: colors.accentTeal, highlightFor: ['ICU'] },
    { id: 'clinical-analysis', title: 'التحليل السريري المتقدم', icon: 'analytics' as const, route: `/patient/${patient?.id}/clinical-analysis`, color: colors.accentSky },
    { id: 'diabetes-gateway', title: 'بوابة رعاية السكري (Diabetes NCP)', icon: 'water' as const, route: `/patient/${patient?.id}/ncp-diabetes-gateway`, color: colors.danger, isWide: true, highlightFor: ['DIABETES'] },
    { id: 'renal-gateway', title: 'بوابة رعاية أمراض الكلى (Nephrology)', icon: 'funnel' as const, route: `/patient/${patient?.id}/ncp-nephrology-gateway`, color: colors.info, isWide: true, highlightFor: ['RENAL'] },
    { id: 'icu-gateway', title: 'بوابة العناية المركزة (ICU NCP)', icon: 'bed' as const, route: `/patient/${patient?.id}/ncp-icu-gateway`, color: colors.accentViolet, isWide: true, highlightFor: ['ICU'] },
    { id: 'critical-care', title: 'محاكي الرعاية الحرجة والتغذية الوريدية', icon: 'pulse' as const, route: `/patient/${patient?.id}/icu-critical-care`, color: colors.accentSky, isWide: true, highlightFor: ['ICU'] },
    { id: 'icu-charts', title: 'منحنيات سوائل العناية والأسموزية', icon: 'analytics' as const, route: `/patient/${patient?.id}/icu-charts`, color: colors.accentViolet, isWide: true, secondary: true },
    { id: 'burn-assessment', title: 'إنعاش وتقييم الحروق البليغة', icon: 'flame' as const, route: `/patient/${patient?.id}/burn-assessment`, color: colors.accentAmber, isWide: true, secondary: true },
    { id: 'respiratory-deck', title: 'لوحة التحكم التنفسي وكبح الكربوهيدرات', icon: 'options' as const, route: `/patient/${patient?.id}/respiratory-deck`, color: colors.accentSky, isWide: true, highlightFor: ['ICU'] },
    { id: 'certified-audit', title: 'بوابة التصديق والتدقيق السريري', icon: 'lock-closed' as const, route: `/patient/${patient?.id}/certified-audit-gateway`, color: colors.accentAmber, isWide: true, secondary: true },
    { id: 'growth-charts', title: 'منحنيات النمو للأطفال (WHO)', icon: 'trending-up' as const, route: `/patient/${patient?.id}/growth-charts`, color: colors.accentTeal, isWide: true, secondary: true, maxAge: 17 },
    { id: 'cardio-charts', title: 'منحنيات القلب والسوائل', icon: 'pulse' as const, route: `/patient/${patient?.id}/cardio-charts`, color: colors.danger, isWide: true, secondary: true },
  ], [patient]);

  const { priorityModules, standardModules, secondaryModules } = useMemo(() => {
    if (!patient) return { priorityModules: [], standardModules: [], secondaryModules: [] };
    const filtered = MODULES_CONFIG.filter(m => {
      if (m.minAge !== undefined && patient.age < m.minAge) return false;
      if (m.maxAge !== undefined && patient.age > m.maxAge) return false;
      return true;
    });
    return {
      priorityModules: filtered.filter(m => (m as any).highlightFor?.includes(diagnosisCategory)),
      standardModules: filtered.filter(m => !(m as any).highlightFor?.includes(diagnosisCategory) && !(m as any).secondary),
      secondaryModules: filtered.filter(m => (m as any).secondary && !(m as any).highlightFor?.includes(diagnosisCategory)),
    };
  }, [MODULES_CONFIG, patient, diagnosisCategory]);

  const scrollViewRef = useRef<ScrollView>(null);
  const clinicalAnalysisYRef = useRef<number>(0);
  const showToast = useToastStore((s) => s.showToast);

  const [currentMetrics, setCurrentMetrics] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  async function loadClinicalData(patientId: string) {
    try {
      const [medHistMod, socHistMod, physExamMod, labMod, medsMod, supsMod, intervMod] = await Promise.all([
        import('../../src/domain/use-cases/GetMedicalHistoryUseCase'),
        import('../../src/domain/use-cases/GetSocialHistoryUseCase'),
        import('../../src/domain/use-cases/GetPhysicalExamUseCase'),
        import('../../src/domain/use-cases/GetLabResultsUseCase'),
        import('../../src/domain/use-cases/GetMedicationsUseCase'),
        import('../../src/domain/use-cases/GetSupplementsUseCase'),
        import('../../src/domain/use-cases/GetActiveInterventionUseCase')
      ]);
      const [medHist, socHist, physExam, labs, meds, sups, interv] = await Promise.all([
        new medHistMod.GetMedicalHistoryUseCase().execute(patientId).catch(() => null),
        new socHistMod.GetSocialHistoryUseCase().execute(patientId).catch(() => null),
        new physExamMod.GetPhysicalExamUseCase().execute(patientId).catch(() => []),
        new labMod.GetLabResultsUseCase().execute(patientId).catch(() => []),
        new medsMod.GetMedicationsUseCase().execute(patientId).catch(() => []),
        new supsMod.GetSupplementsUseCase().execute(patientId).catch(() => []),
        new intervMod.GetActiveInterventionUseCase().execute(patientId).catch(() => null)
      ]);
      setMedicalHistory(medHist); setSocialHistory(socHist); setPhysicalExam(physExam);
      setLabResults(labs); setMedications(meds); setSupplements(sups); setIntervention(interv);
    } catch (e) { console.error(e); }
  }

  useEffect(() => {
    loadPatient();
    loadClinicalData(id);
  }, [id]);

  async function loadPatient() {
    try {
      const { GetPatientUseCase } = await import('../../src/domain/use-cases/GetPatientUseCase');
      const p = await new GetPatientUseCase().execute(id);
      setPatient(p);
    } catch { showToast('فشل تحميل البيانات', 'error'); }
    finally { setLoading(false); }
  }

  const handleCalculate = useCallback(async () => {
    if (!patient) return;
    const w = parseFloat(weightKg); const h = parseFloat(heightCm);
    if (!w || !h) return showToast('يرجى إدخال الوزن والطول', 'error');
    setIsCalculating(true);
    try {
      const { calculatePatientMetrics } = await import('../../src/domain/calculators/NutritionEngine');
      setCurrentMetrics(calculatePatientMetrics({
        patientId: id, weightKg: w, heightCm: h, age: patient.age,
        isMale: patient.gender === 'male', activityLevel
      }) as any);
    } catch { showToast('فشل الحساب', 'error'); }
    finally { setIsCalculating(false); }
  }, [patient, weightKg, heightCm, activityLevel, id, showToast]);

  const handleGeneratePlan = useCallback(async () => {
    if (!patient || !currentMetrics) return;
    setIsGeneratingPlan(true);
    try {
      const { generateNutritionPlan } = await import('../../src/domain/calculators/NutritionEngine');
      setCurrentPlan(generateNutritionPlan({
        patientId: id, metricsId: currentMetrics.id || '', weightKg: currentMetrics.weightKg,
        tdee: currentMetrics.tdee.value, activityLevel, diagnosis: patient.primaryDiagnosis
      }) as any);
    } catch { showToast('فشل توليد الخطة', 'error'); }
    finally { setIsGeneratingPlan(false); }
  }, [patient, currentMetrics, activityLevel, id, showToast]);

  const userName = useSettingsStore((s) => s.username) || 'Dietitian';

  const handlePrintReport = useCallback(async () => {
    try {
      const { GenerateUniversalReportUseCase } = await import('../../src/domain/use-cases/GenerateUniversalReportUseCase');
      const { ReportFormatter } = await import('../../src/domain/reports/ReportFormatter');
      
      const useCase = new GenerateUniversalReportUseCase();
      const payload = await useCase.execute(id);
      
      payload.header.clinicianName = userName;
      const htmlContent = ReportFormatter.toHTML(payload);
      await Print.printAsync({ html: htmlContent });
      showToast('تم تهيئة ملف الطباعة السريري بنجاح ✓', 'success');
    } catch (error) {
      console.error('Print error:', error);
      showToast('فشل تصدير التقرير السريري', 'error');
    }
  }, [id, showToast, userName]);

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  if (!patient) return <View style={styles.centered}><Text style={styles.errorText}>المريض غير موجود</Text></View>;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView ref={scrollViewRef} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><Ionicons name="arrow-forward" size={24} color={colors.primaryContrast} /></TouchableOpacity>
          <Text style={styles.headerTitle}>{patient.fullName}</Text>
          <Text style={styles.headerSubtitle}>{patient.fileNumber}</Text>
        </View>

        <ClinicalAlertsBanner alerts={alerts} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>معلومات المريض</Text>
          <InfoRow label="القسم" value={DEPARTMENT_LABELS[patient.department] || patient.department} />
          <InfoRow label="التشخيص" value={patient.primaryDiagnosis} />
          <InfoRow label="العمر" value={`${patient.age} سنة`} />
          
          <View style={{ marginTop: spacing.md }}>
            <DropdownField
              label="مستوى النشاط البدني (Activity Level)"
              options={Object.entries(ACTIVITY_LEVELS).map(([key, val]) => ({ label: val.label, value: key }))}
              selectedValue={activityLevel}
              onValueChange={(val) => setActivityLevel(val as ActivityLevel)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>مساحة العمل السريرية الذكية</Text>
          {priorityModules.length > 0 && (
            <View style={styles.prioritySection}>
              <Text style={styles.subSectionTitle}>⚠️ وحدات ذات أولوية للحالة</Text>
              {priorityModules.map(m => <ModuleButton key={m.id} {...(m as any)} highlighted isWide />)}
            </View>
          )}
          <IntegratedInterventionCard patientId={patient.id} />
          <View style={styles.twoColumnContainer}>
            <View style={styles.column}>{standardModules.filter((_, i) => i % 2 === 0).map(m => <ModuleButton key={m.id} {...(m as any)} />)}</View>
            <View style={styles.column}>{standardModules.filter((_, i) => i % 2 !== 0).map(m => <ModuleButton key={m.id} {...(m as any)} />)}</View>
          </View>
          {secondaryModules.length > 0 && (
            <>
              <TouchableOpacity style={styles.moreToolsToggle} onPress={() => setShowMoreTools(!showMoreTools)}>
                <Text style={styles.moreToolsToggleText}>{showMoreTools ? 'إخفاء الأدوات الإضافية' : 'عرض المزيد من الأدوات'}</Text>
                <Ionicons name={showMoreTools ? 'chevron-up' : 'chevron-down'} size={18} color={colors.primary} />
              </TouchableOpacity>
              {showMoreTools && <View style={styles.secondarySection}>{secondaryModules.map(m => <ModuleButton key={m.id} {...(m as any)} isWide />)}</View>}
            </>
          )}
        </View>

        <View style={styles.section} onLayout={(e) => clinicalAnalysisYRef.current = e.nativeEvent.layout.y}>
          <Text style={styles.sectionTitle}>التحليل السريري</Text>
          <TextInput style={[styles.input, { marginBottom: spacing.md }]} value={weightKg} onChangeText={setWeightKg} keyboardType="decimal-pad" placeholder="الوزن (كجم)" textAlign="right" />
          <TextInput style={[styles.input, { marginBottom: spacing.md }]} value={heightCm} onChangeText={setHeightCm} keyboardType="decimal-pad" placeholder="الطول (سم)" textAlign="right" />
          
          <DropdownField
            label="مستوى النشاط البدني"
            options={Object.entries(ACTIVITY_LEVELS).map(([key, val]) => ({ label: val.label, value: key }))}
            selectedValue={activityLevel}
            onValueChange={(val) => setActivityLevel(val as ActivityLevel)}
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleCalculate}><Text style={styles.primaryButtonText}>حساب القياسات</Text></TouchableOpacity>
          {currentMetrics && <MetricDisplay label="BMI" value={currentMetrics.bmi.value.toFixed(2)} />}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>خطة التغذية</Text>
          {currentPlan ? <Text style={styles.planTitle}>السعرات المستهدفة: {currentPlan.totalCalories} سعرة</Text> : <Text style={styles.noDataText}>لا توجد خطة حالية. يرجى إدخال البيانات أعلاه والضغط على توليد الخطة.</Text>}
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.success }]} onPress={handleGeneratePlan}><Text style={styles.primaryButtonText}>توليد الخطة</Text></TouchableOpacity>
        </View>

        <View style={styles.bottomSection}>
          <ModuleButton title="📉 المتابعة والتقييم الدوري" icon="pulse" route={`/patient/${patient.id}/monitoring`} color={colors.accentSky} isWide />
          <ModuleButton title="🚪 خروج وتلخيص الحالة" icon="log-out" route={`/patient/${patient.id}/discharge`} color={colors.accentAmber} isWide />
          <ModuleButton title="📋 التقرير النهائي الشامل" icon="document-text" route={`/patient/${patient.id}/patient-report`} color={colors.accentTeal} isWide />
          <ModuleButton title="📄 تصدير التقرير (PDF)" icon="print" color={colors.accentIndigo} isWide onPress={handlePrintReport} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function IntegratedInterventionCard({ patientId }: { patientId: string }) {
  return (
    <View style={styles.integratedInterventionCard}>
      <View style={styles.integratedHeader}>
        <Ionicons name="restaurant" size={22} color={colors.primary} />
        <Text style={styles.integratedTitle}>خطة التدخل الغذائي المتكاملة</Text>
      </View>
      <View style={styles.tabContainer}>
        <TabBtn title="الحسابات" icon="calculator" route={`/patient/${patientId}/calculations`} color={colors.accentTeal} />
        <TabBtn title="الخطة" icon="document-text" route={`/patient/${patientId}/intervention`} color={colors.accentIndigo} />
        <TabBtn title="البدائل" icon="nutrition" route={`/patient/${patientId}/diet-plan`} color={colors.accentSky} />
        <TabBtn title="الوصفة الذكية" icon="flash" route={`/meal-planner/smart-planner?patientId=${patientId}`} color={colors.accentAmber} />
      </View>
    </View>
  );
}

function TabBtn({ title, icon, route, color }: any) {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.tabButton} onPress={() => router.push(route as any)}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={styles.tabButtonText}>{title}</Text>
    </TouchableOpacity>
  );
}

function ModuleButton({ title, icon, route, color, isWide, highlighted, onPress }: any) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={[
        isWide ? styles.moduleButtonWide : styles.moduleButton,
        highlighted && styles.moduleHighlighted,
        highlighted && { borderLeftColor: color, borderLeftWidth: 3 },
      ]}
      onPress={() => onPress ? onPress() : router.push(route as any)}
      activeOpacity={0.7}
    >
      <View style={[styles.moduleIconContainer, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.moduleButtonText} numberOfLines={2}>{title}</Text>
    </TouchableOpacity>
  );
}

function InfoRow({ label, value }: any) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function MetricDisplay({ label, value }: any) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.surfaceSecondary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
    lineHeight: fontSizes.xl * 1.8,
  },
  headerSubtitle: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.regular,
    color: colors.textTertiary,
    textAlign: 'right',
    marginTop: 2,
    opacity: 0.85,
  },
  section: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fontFamilies.bold,
    color: colors.textPrimary,
    textAlign: 'right',
    marginBottom: spacing.md,
    lineHeight: fontSizes.lg * 1.8,
  },
  prioritySection: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  subSectionTitle: {
    fontSize: fontSizes.md,
    fontFamily: fontFamilies.medium,
    textAlign: 'right',
    color: colors.danger,
    marginBottom: spacing.xs,
    lineHeight: fontSizes.md * 1.8,
  },
  twoColumnContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  column: { flex: 1, gap: spacing.sm },
  moduleButtonWide: {
    width: '100%',
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
  },
  moduleButton: {
    width: '100%',
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
  },
  moduleHighlighted: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderLight,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  moduleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleButtonText: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.medium,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: fontSizes.sm * 1.8,
    flexShrink: 1,
  },
  integratedInterventionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  integratedHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  integratedTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fontFamilies.bold,
    color: colors.textPrimary,
    textAlign: 'right',
    lineHeight: fontSizes.lg * 1.8,
  },
  tabContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tabButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surfaceCard,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabButtonText: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.medium,
    color: colors.textPrimary,
    lineHeight: fontSizes.sm * 1.8,
  },
  moreToolsToggle: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  moreToolsToggleText: {
    color: colors.primary,
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * 1.8,
  },
  secondarySection: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  bottomSection: {
    gap: spacing.sm,
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  infoRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.sm,
    minWidth: 72,
    lineHeight: fontSizes.sm * 1.8,
  },
  infoValue: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
    lineHeight: fontSizes.sm * 1.8,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  metricLabel: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * 1.8,
  },
  metricValue: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    backgroundColor: colors.surfaceCard,
    color: colors.textPrimary,
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.md,
    textAlign: 'right',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  primaryButtonText: {
    color: colors.primaryContrast,
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.md,
  },
  planTitle: {
    fontSize: fontSizes.md,
    fontFamily: fontFamilies.medium,
    color: colors.success,
    textAlign: 'right',
    lineHeight: fontSizes.md * 1.8,
  },
  noDataText: {
    textAlign: 'right',
    color: colors.textPrimary,
    marginVertical: spacing.md,
    fontFamily: fontFamilies.regular,
    fontSize: 15,
    lineHeight: 15 * 1.8,
  },
  errorText: {
    color: colors.danger,
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.8,
  },
});

export default withAuth(PatientDetailScreen);
