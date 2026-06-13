import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { usePatientStore } from '../../../src/presentation/stores/patientStore';
import { Patient } from '../../../src/domain/entities/Patient';
import { spacing } from '../../../src/presentation/theme';
import ArabicText from '../../../src/presentation/components/ArabicText';

// Premium Midnight-Slate local color palette
const darkTheme = {
  background: '#0F172A',
  surface: '#1E293B',
  surfaceSecondary: '#334155',
  border: '#475569',
  accent: '#10B981', // Emerald green
  accentDark: '#059669',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textDisabled: '#64748B',
  white: '#FFFFFF',
  success: '#10B981',
  successBg: '#064E3B',
  danger: '#F43F5E', // Crimson red
  dangerBg: '#881337',
  forestGreen: '#1B6B4A', // Required solid save color
  forestGreenDark: '#145237',
};

const NUTRITIONAL_OPTIONS = [
  {
    score: 0,
    title: 'حالة طبيعية (Normal)',
    description: 'الحالة التغذوية سليمة ومعدل استهلاك الغذاء طبيعي.',
  },
  {
    score: 1,
    title: 'خفيف (Mild)',
    description: 'فقدان الوزن > 5% في 3 أشهر أو تناول الطعام بنسبة 50-75% من الاحتياج المعتاد في الأسبوع الماضي.',
  },
  {
    score: 2,
    title: 'متوسط (Moderate)',
    description: 'فقدان الوزن > 5% في شهرين أو تناول الطعام بنسبة 25-50% من الاحتياج المعتاد في الأسبوع الماضي.',
  },
  {
    score: 3,
    title: 'شديد (Severe)',
    description: 'فقدان الوزن > 5% في شهر واحد (أو > 15% في 3 أشهر) أو مؤشر كتلة الجسم BMI < 18.5 مع تدهور الحالة العامة.',
  },
] as const;

const DISEASE_OPTIONS = [
  {
    score: 0,
    title: 'طبيعي / أمراض مزمنة مستقرة (Normal)',
    description: 'حالة مزمنة مستقرة لا تسبب إجهاداً أيضياً إضافياً.',
  },
  {
    score: 1,
    title: 'خفيف (Mild)',
    description: 'مثلاً: كسر في عظم الورك، أو مرضى الحالات المزمنة المصابين بمضاعفات حادة.',
  },
  {
    score: 2,
    title: 'متوسط (Moderate)',
    description: 'مثلاً: جراحة كبرى في البطن، سكتة دماغية، التهاب رئوي حاد، أورام خبيثة.',
  },
  {
    score: 3,
    title: 'شديد (Severe)',
    description: 'مثلاً: إصابات الرأس الشديدة، زراعة نخاع العظم، أو مرضى العناية المركزة (ICU).',
  },
] as const;

export default function NRS2002ScreeningScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const showToast = usePatientStore((s) => s.showToast);

  const [isLoading, setIsLoading] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // NRS-2002 form state
  const [nutritionalScore, setNutritionalScore] = useState<0 | 1 | 2 | 3>(0);
  const [diseaseScore, setDiseaseScore] = useState<0 | 1 | 2 | 3>(0);

  // Load Patient age and past screening if available
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const { GetPatientUseCase } = await import('../../../src/domain/use-cases/GetPatientUseCase');
        const patientUC = new GetPatientUseCase();
        const p = await patientUC.execute(patientId);
        setPatient(p);

        // Prepopulate from database if NRS screening exists
        const { CalculationRepository } = await import('../../../src/data/repositories/CalculationRepository');
        const calcRepo = new CalculationRepository();
        const calcs = await calcRepo.getByPatientIdAndType(patientId, 'nrs_2002');
        if (calcs.length > 0) {
          const latest = calcs[0];
          if (latest.inputValues) {
            const nut = latest.inputValues.nutritionalImpairment;
            const dis = latest.inputValues.diseaseSeverity;
            if (typeof nut === 'number' && (nut === 0 || nut === 1 || nut === 2 || nut === 3)) {
              setNutritionalScore(nut);
            }
            if (typeof dis === 'number' && (dis === 0 || dis === 1 || dis === 2 || dis === 3)) {
              setDiseaseScore(dis);
            }
          }
        }
      } catch (error) {
        console.error('Error loading patient screening details:', error);
        showToast('فشل في تحميل البيانات الأساسية للمريض', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [patientId]);

  // Age calculation and adjustment check
  const age = patient?.age ?? 0;
  const ageBonus = age >= 70 ? 1 : 0;
  const totalScore = nutritionalScore + diseaseScore + ageBonus;

  // Live Reactive Risk Assessment Banner data
  const isHighRisk = totalScore >= 3;

  // Back-navigation handler
  const handleBack = useCallback(() => {
    router.navigate(`/patient/${patientId}`);
  }, [router, patientId]);

  // Persistent storage handler
  const handleSaveScreening = useCallback(async () => {
    try {
      setIsSaving(true);
      const { CalculationRepository } = await import('../../../src/data/repositories/CalculationRepository');
      const repo = new CalculationRepository();

      await repo.upsert({
        patientId,
        calculationType: 'nrs_2002',
        formulaName: 'NRS-2002 Protocol (Screening)',
        inputValues: {
          nutritionalImpairment: nutritionalScore,
          diseaseSeverity: diseaseScore,
          age,
          ageBonus,
        },
        resultValue: totalScore,
        isOverridden: false,
      });

      showToast('تم حفظ نتيجة تقييم الحالة وتحديث سجل المريض بنجاح', 'success');
      router.navigate(`/patient/${patientId}`);
    } catch (error) {
      console.error('Save NRS screening error:', error);
      showToast('فشل في حفظ نتيجة التقييم التغذوي', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [patientId, nutritionalScore, diseaseScore, age, ageBonus, totalScore, showToast, router]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={darkTheme.accent} />
        <ArabicText style={styles.loadingText}>جاري تحميل بيانات المريض...</ArabicText>
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={styles.centered}>
        <ArabicText style={styles.errorText}>المريض غير موجود أو تم إخلاء سبيله.</ArabicText>
        <TouchableOpacity style={styles.errorBtn} onPress={handleBack}>
          <ArabicText style={styles.errorBtnText}>العودة لملف المريض</ArabicText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Ionicons name="arrow-forward" size={24} color={darkTheme.textPrimary} />
          </TouchableOpacity>
          <ArabicText bold style={styles.headerTitle}>تقييم الخطر التغذوي (NRS-2002)</ArabicText>
          <ArabicText style={styles.headerSubtitle}>
            {patient.fullName} | ملف رقم: {patient.fileNumber}
          </ArabicText>
        </View>

        {/* Patient Profile Metadata Cards */}
        <View style={styles.metaRow}>
          <View style={styles.metaBox}>
            <ArabicText style={styles.metaLabel}>عمر المريض</ArabicText>
            <ArabicText bold style={styles.metaValue}>{age} سنة</ArabicText>
          </View>
          <View style={styles.metaBox}>
            <ArabicText style={styles.metaLabel}>إضافة السن (≥ 70)</ArabicText>
            <ArabicText
              bold
              style={[
                styles.metaValue,
                { color: ageBonus > 0 ? darkTheme.accent : darkTheme.textSecondary },
              ]}
            >
              {ageBonus > 0 ? '+1 نقطة' : 'لا يوجد'}
            </ArabicText>
          </View>
          <View style={styles.metaBox}>
            <ArabicText style={styles.metaLabel}>القسم السريري</ArabicText>
            <ArabicText bold style={styles.metaValue}>{patient.department}</ArabicText>
          </View>
        </View>

        {/* Live Reactive Risk Banner */}
        <View
          style={[
            styles.bannerContainer,
            isHighRisk ? styles.bannerDanger : styles.bannerSuccess,
          ]}
        >
          <Ionicons
            name={isHighRisk ? 'warning-outline' : 'checkmark-circle-outline'}
            size={24}
            color={darkTheme.white}
          />
          <ArabicText bold style={styles.bannerText}>
            {isHighRisk
              ? '⚠️ خطر تغذوي مرتفع: المريض يحتاج خطة تدخل وتغذية علاجية فورية!'
              : '✅ الحالة مستقرة: لا يوجد خطر تغذوي حالياً (يتم إعادة التقييم أسبوعياً)'}
          </ArabicText>
        </View>

        {/* Score Breakdown Widget */}
        <View style={styles.scoreBreakdown}>
          <View style={styles.scoreRow}>
            <ArabicText style={styles.scoreLabel}>نقاط الحالة التغذوية:</ArabicText>
            <ArabicText bold style={styles.scoreVal}>{nutritionalScore}</ArabicText>
          </View>
          <View style={styles.scoreRow}>
            <ArabicText style={styles.scoreLabel}>نقاط شدة المرض / الإجهاد:</ArabicText>
            <ArabicText bold style={styles.scoreVal}>{diseaseScore}</ArabicText>
          </View>
          <View style={styles.scoreRow}>
            <ArabicText style={styles.scoreLabel}>نقاط تعديل العمر:</ArabicText>
            <ArabicText bold style={styles.scoreVal}>{ageBonus}</ArabicText>
          </View>
          <View style={[styles.scoreRow, styles.scoreTotalRow]}>
            <ArabicText bold style={styles.scoreLabelTotal}>النتيجة الإجمالية (NRS Score):</ArabicText>
            <ArabicText bold style={styles.scoreValTotal}>{totalScore}</ArabicText>
          </View>
        </View>

        {/* Section 1: Nutritional Impairment */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="nutrition-outline" size={20} color={darkTheme.accent} />
            <ArabicText bold style={styles.sectionTitle}>1. الحالة التغذوية للمريض (Impairment of Nutritional Status)</ArabicText>
          </View>
          <View style={styles.optionsList}>
            {NUTRITIONAL_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.score}
                title={opt.title}
                description={opt.description}
                score={opt.score}
                selected={nutritionalScore === opt.score}
                onPress={() => setNutritionalScore(opt.score)}
              />
            ))}
          </View>
        </View>

        {/* Section 2: Disease Severity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="medical-outline" size={20} color={darkTheme.accent} />
            <ArabicText bold style={styles.sectionTitle}>2. شدة المرض والضغط الأيضي (Severity of Disease)</ArabicText>
          </View>
          <View style={styles.optionsList}>
            {DISEASE_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.score}
                title={opt.title}
                description={opt.description}
                score={opt.score}
                selected={diseaseScore === opt.score}
                onPress={() => setDiseaseScore(opt.score)}
              />
            ))}
          </View>
        </View>

        {/* Submit Persistence Button */}
        <TouchableOpacity
          style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
          onPress={handleSaveScreening}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={darkTheme.white} />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color={darkTheme.white} />
              <ArabicText bold style={styles.saveBtnText}>💾 حفظ نتيجة تقييم الحالة</ArabicText>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

interface OptionCardProps {
  title: string;
  description: string;
  score: number;
  selected: boolean;
  onPress: () => void;
}

function OptionCard({ title, description, score, selected, onPress }: OptionCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.optionCard,
        selected && styles.optionCardSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.optionHeader}>
        <View style={styles.radioButtonRow}>
          <View style={[styles.radioButton, selected && styles.radioButtonSelected]}>
            {selected && <View style={styles.radioButtonInner} />}
          </View>
          <ArabicText style={styles.optionTitle}>{title}</ArabicText>
        </View>
        <View style={[styles.scoreBadge, selected && styles.scoreBadgeSelected]}>
          <ArabicText bold style={styles.scoreBadgeText}>
            +{score}
          </ArabicText>
        </View>
      </View>
      <ArabicText style={styles.optionDescription}>{description}</ArabicText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: darkTheme.background,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: darkTheme.background,
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 16,
    color: darkTheme.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: darkTheme.danger,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  errorBtn: {
    padding: spacing.md,
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 8,
  },
  errorBtnText: {
    color: darkTheme.textPrimary,
    fontSize: 14,
  },
  header: {
    backgroundColor: darkTheme.surface,
    paddingTop: 60,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
  },
  backBtn: {
    position: 'absolute',
    top: 54,
    start: spacing.md,
    zIndex: 1,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    color: darkTheme.textPrimary,
    textAlign: 'right',
    marginTop: spacing.lg,
  },
  headerSubtitle: {
    fontSize: 14,
    color: darkTheme.textSecondary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginVertical: spacing.md,
  },
  metaBox: {
    flex: 1,
    backgroundColor: darkTheme.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: darkTheme.border,
    padding: spacing.sm,
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 11,
    color: darkTheme.textSecondary,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 14,
    color: darkTheme.textPrimary,
  },
  bannerContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  bannerSuccess: {
    backgroundColor: darkTheme.successBg,
    borderWidth: 1,
    borderColor: darkTheme.success,
  },
  bannerDanger: {
    backgroundColor: darkTheme.dangerBg,
    borderWidth: 1,
    borderColor: darkTheme.danger,
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    color: darkTheme.white,
    textAlign: 'right',
    lineHeight: 20,
  },
  scoreBreakdown: {
    backgroundColor: darkTheme.surface,
    marginHorizontal: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: darkTheme.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  scoreRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  scoreLabel: {
    fontSize: 13,
    color: darkTheme.textSecondary,
  },
  scoreVal: {
    fontSize: 13,
    color: darkTheme.textPrimary,
  },
  scoreTotalRow: {
    borderTopWidth: 1,
    borderTopColor: darkTheme.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  scoreLabelTotal: {
    fontSize: 15,
    color: darkTheme.white,
  },
  scoreValTotal: {
    fontSize: 18,
    color: darkTheme.accent,
  },
  section: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 14,
    color: darkTheme.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  optionsList: {
    gap: spacing.sm,
  },
  optionCard: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 10,
    padding: spacing.md,
    gap: spacing.xs,
  },
  optionCardSelected: {
    borderColor: darkTheme.accent,
    backgroundColor: darkTheme.surfaceSecondary,
  },
  optionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  radioButtonRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flex: 1,
  },
  radioButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: darkTheme.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  radioButtonSelected: {
    borderColor: darkTheme.accent,
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: darkTheme.accent,
  },
  optionTitle: {
    fontSize: 14,
    fontFamily: 'ThmanyahSans-Medium',
    color: darkTheme.textPrimary,
    textAlign: 'right',
    flex: 1,
  },
  scoreBadge: {
    backgroundColor: darkTheme.surfaceSecondary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  scoreBadgeSelected: {
    backgroundColor: darkTheme.accent,
    borderColor: darkTheme.accent,
  },
  scoreBadgeText: {
    fontSize: 12,
    color: darkTheme.white,
  },
  optionDescription: {
    fontSize: 13,
    fontFamily: 'ThmanyahSans-Medium',
    color: darkTheme.textSecondary,
    textAlign: 'right',
    lineHeight: 18,
  },
  saveBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkTheme.forestGreen,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 10,
    gap: spacing.sm,
    minHeight: 52,
  },
  saveBtnDisabled: {
    backgroundColor: darkTheme.forestGreenDark,
    opacity: 0.7,
  },
  saveBtnText: {
    color: darkTheme.white,
    fontSize: 16,
  },
});
