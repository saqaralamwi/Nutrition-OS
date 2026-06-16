import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { usePatientStore } from '../../../src/presentation/stores/patientStore';
import { Patient } from '../../../src/domain/entities/Patient';
import { spacing, safeHeaderPaddingTop } from '../../../src/presentation/theme';
import ArabicText from '../../../src/presentation/components/ArabicText';
import { calculateStampScreening, StampComponentScore } from '../../../src/domain/calculators/stampCalculator';

const darkTheme = {
  background: '#0F172A',
  surface: '#1E293B',
  surfaceSecondary: '#334155',
  border: '#475569',
  accent: '#10B981',
  accentDark: '#059669',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textDisabled: '#64748B',
  white: '#FFFFFF',
  success: '#10B981',
  successBg: '#064E3B',
  danger: '#F43F5E',
  dangerBg: '#881337',
  warning: '#F59E0B',
  warningBg: '#78350F',
  forestGreen: '#1B6B4A',
  forestGreenDark: '#145237',
};

const MEDICAL_CONDITION_OPTIONS: { score: StampComponentScore; title: string; description: string; descriptionAr: string }[] = [
  {
    score: 0,
    title: 'لا خطر (No risk)',
    description: 'Non-nutritional diagnosis, routine care, minor injury',
    descriptionAr: 'تشخيص غير تغذوي، رعاية روتينية، إصابة بسيطة',
  },
  {
    score: 1,
    title: 'خطر منخفض (Low risk)',
    description: 'Mild acute illness: asthma, pneumonia, mild infection',
    descriptionAr: 'مرض حاد خفيف: ربو، التهاب رئوي، عدوى خفيفة',
  },
  {
    score: 2,
    title: 'خطر مرتفع (High risk)',
    description: 'Severe illness: cancer, major surgery, burns, GI disease',
    descriptionAr: 'مرض شديد: سرطان، جراحة كبرى، حروق، مرض معوي',
  },
];

const NUTRITIONAL_STATUS_OPTIONS: { score: StampComponentScore; title: string; description: string; descriptionAr: string }[] = [
  {
    score: 0,
    title: 'أفضل أو نفس (Better/Same)',
    description: 'Eating normally, no change in intake',
    descriptionAr: 'يأكل طبيعياً، لا تغير في المدخول',
  },
  {
    score: 1,
    title: 'أسوأ (Worse)',
    description: 'Eating less than usual, some food refused',
    descriptionAr: 'يأكل أقل من المعتاد، رفض بعض الطعام',
  },
  {
    score: 2,
    title: 'ضعيف (Poor)',
    description: 'Eating very little or nothing, NPO, feeding difficulties',
    descriptionAr: 'يأكل قليلاً جداً أو لا يأكل، NPO، صعوبات في التغذية',
  },
];

const WEIGHT_LOSS_OPTIONS: { score: StampComponentScore; title: string; description: string; descriptionAr: string }[] = [
  {
    score: 0,
    title: 'لا يوجد (None)',
    description: 'No weight loss',
    descriptionAr: 'لا فقدان في الوزن',
  },
  {
    score: 1,
    title: 'بعض (Some)',
    description: '1-5% weight loss',
    descriptionAr: 'فقدان وزن 1-5%',
  },
  {
    score: 2,
    title: 'شديد (Severe)',
    description: '>5% weight loss',
    descriptionAr: 'فقدان وزن >5%',
  },
];

export default function StampScreeningScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const showToast = usePatientStore((s) => s.showToast);

  const [isLoading, setIsLoading] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [medicalConditionRisk, setMedicalConditionRisk] = useState<StampComponentScore>(0);
  const [medicalConditionNote, setMedicalConditionNote] = useState('');
  const [nutritionalStatus, setNutritionalStatus] = useState<StampComponentScore>(0);
  const [nutritionalStatusNote, setNutritionalStatusNote] = useState('');
  const [weightLoss, setWeightLoss] = useState<StampComponentScore>(0);
  const [previousWeightKg, setPreviousWeightKg] = useState('');
  const [currentWeightKg, setCurrentWeightKg] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const { GetPatientUseCase } = await import('../../../src/domain/use-cases/GetPatientUseCase');
        const patientUC = new GetPatientUseCase();
        const p = await patientUC.execute(patientId);
        setPatient(p);

        const { CalculationRepository } = await import('../../../src/data/repositories/CalculationRepository');
        const calcRepo = new CalculationRepository();
        const calcs = await calcRepo.getByPatientIdAndType(patientId, 'stamp');
        if (calcs.length > 0) {
          const latest = calcs[0];
          const iv = latest.inputValues || {};
          if (typeof iv.medicalConditionRisk === 'number') setMedicalConditionRisk(iv.medicalConditionRisk as StampComponentScore);
          if (typeof iv.nutritionalStatus === 'number') setNutritionalStatus(iv.nutritionalStatus as StampComponentScore);
          if (typeof iv.weightLoss === 'number') setWeightLoss(iv.weightLoss as StampComponentScore);
          if (iv.medicalConditionNote) setMedicalConditionNote(iv.medicalConditionNote);
          if (iv.nutritionalStatusNote) setNutritionalStatusNote(iv.nutritionalStatusNote);
          if (iv.previousWeightKg) setPreviousWeightKg(String(iv.previousWeightKg));
          if (iv.currentWeightKg) setCurrentWeightKg(String(iv.currentWeightKg));
        }
      } catch (error) {
        console.error('Error loading patient data for STAMP:', error);
        showToast('فشل في تحميل بيانات المريض', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [patientId]);

  const stampResult = useMemo(() => {
    return calculateStampScreening({
      medicalConditionRisk,
      nutritionalStatus,
      weightLoss,
      previousWeightKg: previousWeightKg ? parseFloat(previousWeightKg) : null,
      currentWeightKg: currentWeightKg ? parseFloat(currentWeightKg) : null,
      medicalConditionNote: medicalConditionNote || null,
      nutritionalStatusNote: nutritionalStatusNote || null,
    });
  }, [medicalConditionRisk, nutritionalStatus, weightLoss, previousWeightKg, currentWeightKg]);

  const handleBack = useCallback(() => {
    router.navigate(`/patient/${patientId}`);
  }, [router, patientId]);

  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);
      const { CalculationRepository } = await import('../../../src/data/repositories/CalculationRepository');
      const repo = new CalculationRepository();

      await repo.upsert({
        patientId,
        calculationType: 'stamp',
        formulaName: 'STAMP Pediatric Malnutrition Screening',
        inputValues: {
          medicalConditionRisk,
          medicalConditionNote: medicalConditionNote || undefined,
          nutritionalStatus,
          nutritionalStatusNote: nutritionalStatusNote || undefined,
          weightLoss,
          previousWeightKg: previousWeightKg ? parseFloat(previousWeightKg) : undefined,
          currentWeightKg: currentWeightKg ? parseFloat(currentWeightKg) : undefined,
          weightLossPercent: stampResult.weightLossPercent,
        },
        resultValue: stampResult.totalScore,
        isOverridden: false,
      });

      showToast('تم حفظ فحص STAMP بنجاح', 'success');
      router.navigate(`/patient/${patientId}`);
    } catch (error) {
      console.error('Save STAMP error:', error);
      showToast('فشل في حفظ الفحص', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [patientId, medicalConditionRisk, medicalConditionNote, nutritionalStatus, nutritionalStatusNote, weightLoss, previousWeightKg, currentWeightKg, stampResult, showToast, router]);

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

  const riskColor = stampResult.riskLevel === 'high'
    ? darkTheme.danger
    : stampResult.riskLevel === 'medium'
      ? darkTheme.warning
      : darkTheme.success;

  const riskBgColor = stampResult.riskLevel === 'high'
    ? darkTheme.dangerBg
    : stampResult.riskLevel === 'medium'
      ? darkTheme.warningBg
      : darkTheme.successBg;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 160, paddingHorizontal: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Ionicons name="arrow-forward" size={24} color={darkTheme.textPrimary} />
          </TouchableOpacity>
          <ArabicText bold style={styles.headerTitle}>فحص STAMP لخطر سوء التغذية للأطفال</ArabicText>
          <ArabicText style={styles.headerSubtitle}>
            {patient.fullName} | ملف رقم: {patient.fileNumber}
          </ArabicText>
        </View>

        {/* Live Risk Banner */}
        <View style={[styles.bannerContainer, { backgroundColor: riskBgColor, borderColor: riskColor }]}>
          <Ionicons
            name={stampResult.riskLevel === 'low' ? 'checkmark-circle-outline' : 'warning-outline'}
            size={24}
            color={darkTheme.white}
          />
          <ArabicText bold style={styles.bannerText}>
            {stampResult.riskLevel === 'low'
              ? '✅ خطر منخفض - رعاية تغذوية روتينية'
              : stampResult.riskLevel === 'medium'
                ? '⚠️ خطر متوسط - تقييم تغذوي مطلوب'
                : '🚨 خطر مرتفع - تدخل تغذوي فوري مطلوب!'}
          </ArabicText>
        </View>

        {/* Score Breakdown */}
        <View style={styles.scoreBreakdown}>
          <View style={styles.scoreRow}>
            <ArabicText style={styles.scoreLabel}>خطر الحالة الطبية:</ArabicText>
            <ArabicText bold style={styles.scoreVal}>+{medicalConditionRisk}</ArabicText>
          </View>
          <View style={styles.scoreRow}>
            <ArabicText style={styles.scoreLabel}>الحالة التغذوية:</ArabicText>
            <ArabicText bold style={styles.scoreVal}>+{nutritionalStatus}</ArabicText>
          </View>
          <View style={styles.scoreRow}>
            <ArabicText style={styles.scoreLabel}>فقدان الوزن:</ArabicText>
            <ArabicText bold style={styles.scoreVal}>+{weightLoss}</ArabicText>
          </View>
          <View style={[styles.scoreRow, styles.scoreTotalRow]}>
            <ArabicText bold style={styles.scoreLabelTotal}>مجموع STAMP:</ArabicText>
            <ArabicText bold style={[styles.scoreValTotal, { color: riskColor }]}>{stampResult.totalScore}</ArabicText>
          </View>
        </View>

        {/* Section 1: Medical Condition Risk */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="medical-outline" size={20} color={darkTheme.accent} />
            <ArabicText bold style={styles.sectionTitle}>1. خطر الحالة الطبية (Medical Condition Risk)</ArabicText>
          </View>
          <View style={styles.optionsList}>
            {MEDICAL_CONDITION_OPTIONS.map((opt) => (
              <OptionCard
                key={`mc-${opt.score}`}
                title={opt.title}
                description={opt.description}
                descriptionAr={opt.descriptionAr}
                score={opt.score}
                selected={medicalConditionRisk === opt.score}
                onPress={() => setMedicalConditionRisk(opt.score)}
              />
            ))}
          </View>
          <TextInput
            style={styles.noteInput}
            value={medicalConditionNote}
            onChangeText={setMedicalConditionNote}
            placeholder="ملاحظة عن التشخيص (اختياري)..."
            placeholderTextColor={darkTheme.textDisabled}
            textAlign="right"
          />
        </View>

        {/* Section 2: Nutritional Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="nutrition-outline" size={20} color={darkTheme.accent} />
            <ArabicText bold style={styles.sectionTitle}>2. الحالة التغذوية (Nutritional Status)</ArabicText>
          </View>
          <View style={styles.optionsList}>
            {NUTRITIONAL_STATUS_OPTIONS.map((opt) => (
              <OptionCard
                key={`ns-${opt.score}`}
                title={opt.title}
                description={opt.description}
                descriptionAr={opt.descriptionAr}
                score={opt.score}
                selected={nutritionalStatus === opt.score}
                onPress={() => setNutritionalStatus(opt.score)}
              />
            ))}
          </View>
          <TextInput
            style={styles.noteInput}
            value={nutritionalStatusNote}
            onChangeText={setNutritionalStatusNote}
            placeholder="ملاحظة عن الأكل (اختياري)..."
            placeholderTextColor={darkTheme.textDisabled}
            textAlign="right"
          />
        </View>

        {/* Section 3: Weight Loss */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="scale-outline" size={20} color={darkTheme.accent} />
            <ArabicText bold style={styles.sectionTitle}>3. فقدان الوزن (Weight Loss)</ArabicText>
          </View>
          <View style={styles.optionsList}>
            {WEIGHT_LOSS_OPTIONS.map((opt) => (
              <OptionCard
                key={`wl-${opt.score}`}
                title={opt.title}
                description={opt.description}
                descriptionAr={opt.descriptionAr}
                score={opt.score}
                selected={weightLoss === opt.score}
                onPress={() => setWeightLoss(opt.score)}
              />
            ))}
          </View>

          <View style={styles.weightRow}>
            <View style={styles.halfInput}>
              <ArabicText style={styles.weightLabel}>الوزن السابق (كغم)</ArabicText>
              <TextInput
                style={styles.weightInput}
                value={previousWeightKg}
                onChangeText={setPreviousWeightKg}
                keyboardType="decimal-pad"
                placeholder="مثال: 25"
                placeholderTextColor={darkTheme.textDisabled}
                textAlign="right"
              />
            </View>
            <View style={styles.halfInput}>
              <ArabicText style={styles.weightLabel}>الوزن الحالي (كغم)</ArabicText>
              <TextInput
                style={styles.weightInput}
                value={currentWeightKg}
                onChangeText={setCurrentWeightKg}
                keyboardType="decimal-pad"
                placeholder="مثال: 23.5"
                placeholderTextColor={darkTheme.textDisabled}
                textAlign="right"
              />
            </View>
          </View>

          {stampResult.weightLossPercent !== null && (
            <View style={styles.weightLossResult}>
              <Ionicons name="trending-down-outline" size={18} color={darkTheme.warning} />
              <ArabicText style={styles.weightLossText}>
                {`نسبة فقدان الوزن: ${stampResult.weightLossPercent}%`}
              </ArabicText>
            </View>
          )}
        </View>

        {/* Recommended Actions */}
        <View style={[styles.actionsSection, { borderColor: riskColor }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="clipboard-outline" size={20} color={riskColor} />
            <ArabicText bold style={[styles.sectionTitle, { color: riskColor }]}>
              الإجراءات الموصى بها
            </ArabicText>
          </View>
          <ArabicText style={styles.actionsText}>{stampResult.recommendedActionsAr}</ArabicText>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={darkTheme.white} />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color={darkTheme.white} />
              <ArabicText bold style={styles.saveBtnText}>💾 حفظ نتيجة فحص STAMP</ArabicText>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function OptionCard({
  title,
  description,
  descriptionAr,
  score,
  selected,
  onPress,
}: {
  title: string;
  description: string;
  descriptionAr: string;
  score: number;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.optionCard, selected && styles.optionCardSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.optionHeader}>
        <View style={styles.radioButtonRow}>
          <View style={[styles.radioButton, selected && styles.radioButtonSelected]}>
            {selected && <View style={styles.radioButtonInner} />}
          </View>
          <View style={{ flex: 1 }}>
            <ArabicText style={styles.optionTitle}>{title}</ArabicText>
            <ArabicText style={styles.optionDescEn}>{description}</ArabicText>
            <ArabicText style={styles.optionDescAr}>{descriptionAr}</ArabicText>
          </View>
        </View>
        <View style={[styles.scoreBadge, selected && styles.scoreBadgeSelected]}>
          <ArabicText bold style={styles.scoreBadgeText}>+{score}</ArabicText>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: darkTheme.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: darkTheme.background, gap: spacing.md },
  loadingText: { fontSize: 16, color: darkTheme.textSecondary, textAlign: 'center' },
  errorText: { fontSize: 16, color: darkTheme.danger, textAlign: 'center', marginBottom: spacing.md },
  errorBtn: { padding: spacing.md, backgroundColor: darkTheme.surface, borderWidth: 1, borderColor: darkTheme.border, borderRadius: 8 },
  errorBtnText: { color: darkTheme.textPrimary, fontSize: 14 },
  header: { backgroundColor: darkTheme.surface, paddingTop: safeHeaderPaddingTop, paddingBottom: spacing.lg, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: darkTheme.border },
  backBtn: { position: 'absolute', top: safeHeaderPaddingTop - 6, start: spacing.md, zIndex: 1, padding: 4 },
  headerTitle: { fontSize: 20, color: darkTheme.textPrimary, textAlign: 'right', marginTop: spacing.lg },
  headerSubtitle: { fontSize: 14, color: darkTheme.textSecondary, textAlign: 'right', marginTop: spacing.xs },
  bannerContainer: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.md, borderRadius: 10, padding: spacing.md, marginTop: spacing.md, marginBottom: spacing.md, borderWidth: 1 },
  bannerText: { flex: 1, fontSize: 14, color: darkTheme.white, textAlign: 'right', lineHeight: 20 },
  scoreBreakdown: { backgroundColor: darkTheme.surface, marginHorizontal: spacing.md, borderRadius: 10, borderWidth: 1, borderColor: darkTheme.border, padding: spacing.md, marginBottom: spacing.md, gap: spacing.xs },
  scoreRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 2 },
  scoreLabel: { fontSize: 13, color: darkTheme.textSecondary },
  scoreVal: { fontSize: 13, color: darkTheme.textPrimary },
  scoreTotalRow: { borderTopWidth: 1, borderTopColor: darkTheme.border, paddingTop: spacing.sm, marginTop: spacing.xs },
  scoreLabelTotal: { fontSize: 15, color: darkTheme.white },
  scoreValTotal: { fontSize: 18 },
  section: { marginHorizontal: spacing.md, marginBottom: spacing.md, gap: spacing.sm },
  sectionHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs, paddingBottom: 4 },
  sectionTitle: { fontSize: 14, color: darkTheme.textPrimary, flex: 1, textAlign: 'right' },
  optionsList: { gap: spacing.sm },
  optionCard: { backgroundColor: darkTheme.surface, borderWidth: 1, borderColor: darkTheme.border, borderRadius: 10, padding: spacing.md, gap: spacing.xs },
  optionCardSelected: { borderColor: darkTheme.accent, backgroundColor: darkTheme.surfaceSecondary },
  optionHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start' },
  radioButtonRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', flex: 1 },
  radioButton: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: darkTheme.border, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.sm, marginTop: 2 },
  radioButtonSelected: { borderColor: darkTheme.accent },
  radioButtonInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: darkTheme.accent },
  optionTitle: { fontSize: 14, color: darkTheme.textPrimary, textAlign: 'right' },
  optionDescEn: { fontSize: 11, color: darkTheme.textSecondary, textAlign: 'right', marginTop: 2 },
  optionDescAr: { fontSize: 12, color: darkTheme.textDisabled, textAlign: 'right', marginTop: 1 },
  scoreBadge: { backgroundColor: darkTheme.surfaceSecondary, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: darkTheme.border },
  scoreBadgeSelected: { backgroundColor: darkTheme.accent, borderColor: darkTheme.accent },
  scoreBadgeText: { fontSize: 12, color: darkTheme.white },
  noteInput: { backgroundColor: darkTheme.surface, borderWidth: 1, borderColor: darkTheme.border, borderRadius: 8, padding: spacing.sm, color: darkTheme.textPrimary, fontSize: 13, minHeight: 40, marginTop: spacing.xs },
  weightRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  halfInput: { flex: 1 },
  weightLabel: { fontSize: 12, color: darkTheme.textSecondary, textAlign: 'right', marginBottom: 4 },
  weightInput: { backgroundColor: darkTheme.surface, borderWidth: 1, borderColor: darkTheme.border, borderRadius: 8, padding: spacing.sm, color: darkTheme.textPrimary, fontSize: 14 },
  weightLossResult: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, backgroundColor: darkTheme.warningBg + '40', borderRadius: 8 },
  weightLossText: { fontSize: 13, color: darkTheme.warning },
  actionsSection: { marginHorizontal: spacing.md, marginBottom: spacing.md, backgroundColor: darkTheme.surface, borderRadius: 10, borderWidth: 1, padding: spacing.md, gap: spacing.sm },
  actionsText: { fontSize: 14, color: darkTheme.textPrimary, lineHeight: 22, textAlign: 'right' },
  saveBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', backgroundColor: darkTheme.forestGreen, marginHorizontal: spacing.md, marginTop: spacing.md, padding: spacing.md, borderRadius: 10, gap: spacing.sm, minHeight: 52 },
  saveBtnDisabled: { backgroundColor: darkTheme.forestGreenDark, opacity: 0.7 },
  saveBtnText: { color: darkTheme.white, fontSize: 16 },
});
