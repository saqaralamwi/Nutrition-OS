import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../../src/presentation/hooks/useAppTheme';
import { colors, spacing, fontFamilies, fontSizes } from '../../../src/presentation/theme';
import { useOsteoporosisAssessment } from '../../../src/presentation/hooks/useOsteoporosisAssessment';
import { useOsteoporosisNutritionPlan } from '../../../src/presentation/hooks/useOsteoporosisNutritionPlan';
import { OsteoporosisNutritionEngine } from '../../../src/domain/calculators/OsteoporosisNutritionEngine';

export default function OsteoporosisNutritionPlanScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useAppTheme();
  const { assessment } = useOsteoporosisAssessment(patientId);
  const { plan, createPlan, isLoading: saving } = useOsteoporosisNutritionPlan(patientId);

  const requirements = useMemo(() => {
    if (!assessment) return null;
    const age = assessment.age || 50;
    const gender = assessment.gender || 'female';
    return OsteoporosisNutritionEngine.calculateRequirements(assessment, age, gender);
  }, [assessment]);

  const [needsCalciumSupplement, setNeedsCalciumSupplement] = useState(plan?.needsCalciumSupplement ?? false);
  const [calciumSupplementType, setCalciumSupplementType] = useState<'calcium_carbonate' | 'calcium_citrate' | 'calcium_lactate'>(
    (plan?.calciumSupplementType as any) ?? 'calcium_carbonate'
  );
  const [calciumSupplementDose, setCalciumSupplementDose] = useState(String(plan?.calciumSupplementDose ?? ''));
  const [needsVitaminDSupplement, setNeedsVitaminDSupplement] = useState(plan?.needsVitaminDSupplement ?? false);
  const [vitaminDSupplementType, setVitaminDSupplementType] = useState<'d2' | 'd3'>(
    (plan?.vitaminDSupplementType as any) ?? 'd3'
  );
  const [vitaminDSupplementDose, setVitaminDSupplementDose] = useState(String(plan?.vitaminDSupplementDose ?? ''));
  const [needsVitaminKSupplement, setNeedsVitaminKSupplement] = useState(plan?.needsVitaminKSupplement ?? false);
  const [vitaminKSupplementDose, setVitaminKSupplementDose] = useState(String(plan?.vitaminKSupplementDose ?? ''));
  const [needsMagnesiumSupplement, setNeedsMagnesiumSupplement] = useState(plan?.needsMagnesiumSupplement ?? false);
  const [magnesiumSupplementDose, setMagnesiumSupplementDose] = useState(String(plan?.magnesiumSupplementDose ?? ''));
  const [weightBearingExercise, setWeightBearingExercise] = useState(plan?.weightBearingExercise ?? false);
  const [resistanceTraining, setResistanceTraining] = useState(plan?.resistanceTraining ?? false);
  const [balanceExercise, setBalanceExercise] = useState(plan?.balanceExercise ?? false);
  const [exerciseFrequency, setExerciseFrequency] = useState(String(plan?.exerciseFrequency ?? ''));
  const [exerciseDuration, setExerciseDuration] = useState(String(plan?.exerciseDuration ?? ''));
  const [homeSafetyReview, setHomeSafetyReview] = useState(plan?.homeSafetyReview ?? false);
  const [visionCheck, setVisionCheck] = useState(plan?.visionCheck ?? false);
  const [footwearAssessment, setFootwearAssessment] = useState(plan?.footwearAssessment ?? false);
  const [assistiveDevice, setAssistiveDevice] = useState(plan?.assistiveDevice ?? false);
  const [calciumRichFoods, setCalciumRichFoods] = useState((plan?.calciumRichFoods ?? []).join('\n'));
  const [vitaminDRichFoods, setVitaminDRichFoods] = useState((plan?.vitaminDRichFoods ?? []).join('\n'));
  const [proteinRichFoods, setProteinRichFoods] = useState((plan?.proteinRichFoods ?? []).join('\n'));
  const [vitaminKRichFoods, setVitaminKRichFoods] = useState((plan?.vitaminKRichFoods ?? []).join('\n'));
  const [avoidExcessSodium, setAvoidExcessSodium] = useState(plan?.avoidExcessSodium ?? false);
  const [avoidExcessProtein, setAvoidExcessProtein] = useState(plan?.avoidExcessProtein ?? false);
  const [avoidSmoking, setAvoidSmoking] = useState(plan?.avoidSmoking ?? false);
  const [avoidExcessAlcohol, setAvoidExcessAlcohol] = useState(plan?.avoidExcessAlcohol ?? false);
  const [avoidCaffeineExcess, setAvoidCaffeineExcess] = useState(plan?.avoidCaffeineExcess ?? false);
  const [boneDensityCheckFrequency, setBoneDensityCheckFrequency] = useState<'annual' | 'biennial'>(plan?.boneDensityCheckFrequency ?? 'annual');
  const [targetBoneDensity, setTargetBoneDensity] = useState(String(plan?.targetBoneDensity ?? ''));
  const [expectedImprovementMonths, setExpectedImprovementMonths] = useState(String(plan?.expectedImprovementMonths ?? ''));

  const supplementTypeLabels: Record<string, string> = {
    calcium_carbonate: 'كربونات الكالسيوم',
    calcium_citrate: 'سترات الكالسيوم',
    calcium_lactate: 'لاكتات الكالسيوم',
  };

  const handleSave = async () => {
    if (!assessment) {
      Alert.alert('تنبيه', 'يرجى إكمال التقييم السريري أولاً');
      return;
    }
    try {
      await createPlan({
        assessmentId: assessment.id || '',
        targetCalcium: requirements?.targetCalcium ?? 1000,
        targetVitaminD: requirements?.targetVitaminD ?? 600,
        targetProtein: requirements?.targetProtein ?? 0,
        targetVitaminK: requirements?.targetVitaminK ?? 90,
        targetMagnesium: requirements?.targetMagnesium ?? 320,
        targetZinc: requirements?.targetZinc ?? 8,
        targetPhosphorus: requirements?.targetPhosphorus ?? 700,
        targetPotassium: requirements?.targetPotassium ?? 4700,
        needsCalciumSupplement,
        calciumSupplementType,
        calciumSupplementDose: parseFloat(calciumSupplementDose) || 0,
        calciumSupplementTiming: 'with_meals',
        needsVitaminDSupplement,
        vitaminDSupplementType,
        vitaminDSupplementDose: parseFloat(vitaminDSupplementDose) || 0,
        needsVitaminKSupplement,
        vitaminKSupplementDose: parseFloat(vitaminKSupplementDose) || 0,
        needsMagnesiumSupplement,
        magnesiumSupplementDose: parseFloat(magnesiumSupplementDose) || 0,
        weightBearingExercise,
        resistanceTraining,
        balanceExercise,
        exerciseFrequency: parseInt(exerciseFrequency) || 0,
        exerciseDuration: parseInt(exerciseDuration) || 0,
        homeSafetyReview,
        visionCheck,
        footwearAssessment,
        assistiveDevice,
        calciumRichFoods: calciumRichFoods.split('\n').filter(Boolean),
        vitaminDRichFoods: vitaminDRichFoods.split('\n').filter(Boolean),
        proteinRichFoods: proteinRichFoods.split('\n').filter(Boolean),
        vitaminKRichFoods: vitaminKRichFoods.split('\n').filter(Boolean),
        avoidExcessSodium,
        avoidExcessProtein,
        avoidSmoking,
        avoidExcessAlcohol,
        avoidCaffeineExcess,
        boneDensityCheckFrequency,
        targetBoneDensity: parseFloat(targetBoneDensity) || 0,
        expectedImprovementMonths: parseInt(expectedImprovementMonths) || 0,
      });
      Alert.alert('نجاح', 'تم حفظ الخطة الغذائية لهشاشة العظام بنجاح');
      router.back();
    } catch {
      Alert.alert('خطأ', 'فشل حفظ الخطة الغذائية');
    }
  };

  const renderSectionTitle = (title: string) => (
    <View style={styles.sectionTitleBar}>
      <Text style={[styles.sectionTitleText, { color: colors.accentTeal }]}>{title}</Text>
      <View style={[styles.sectionLine, { backgroundColor: colors.accentTeal + '30' }]} />
    </View>
  );

  const renderToggle = (label: string, value: boolean, onToggle: () => void) => (
    <View style={styles.toggleRow}>
      <Text style={[styles.toggleLabel, { color: theme.text }]}>{label}</Text>
      <TouchableOpacity
        style={[styles.toggleBtn, value && { backgroundColor: colors.accentTeal }]}
        onPress={onToggle}
      >
        <Text style={[styles.toggleBtnText, { color: value ? '#FFF' : theme.subtext }]}>
          {value ? 'نعم' : 'لا'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderInput = (label: string, value: string, onChange: (v: string) => void, multiline?: boolean) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: theme.text }]}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
        value={value}
        onChangeText={onChange}
        keyboardType={multiline ? 'default' : 'decimal-pad'}
        placeholderTextColor={theme.subtext}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );

  const renderTargetCard = (label: string, value: number | undefined, unit: string, color: string) => (
    <View style={[styles.targetCard, { borderColor: color, backgroundColor: color + '08' }]}>
      <Text style={[styles.targetLabel, { color: theme.subtext }]}>{label}</Text>
      <Text style={[styles.targetValue, { color }]}>{value ?? '—'}</Text>
      <Text style={[styles.targetUnit, { color: theme.subtext }]}>{unit}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: colors.accentTeal }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-forward" size={24} color={colors.primaryContrast} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>الخطة الغذائية لهشاشة العظام</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {renderSectionTitle('المستهدفات الغذائية المحسوبة')}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {requirements ? (
              <View style={styles.targetsGrid}>
                {renderTargetCard('الكالسيوم', requirements.targetCalcium, 'ملغ/يوم', colors.accentViolet)}
                {renderTargetCard('فيتامين D', requirements.targetVitaminD, 'وحدة/يوم', colors.accentAmber)}
                {renderTargetCard('البروتين', requirements.targetProtein, 'غ/يوم', colors.accentTeal)}
                {renderTargetCard('فيتامين K', requirements.targetVitaminK, 'ميكروغ/يوم', colors.success)}
                {renderTargetCard('المغنيسيوم', requirements.targetMagnesium, 'ملغ/يوم', colors.accentIndigo)}
                {renderTargetCard('الزنك', requirements.targetZinc, 'ملغ/يوم', colors.info)}
              </View>
            ) : (
              <Text style={[styles.emptyText, { color: theme.subtext }]}>يرجى إكمال التقييم السريري لحساب المستهدفات</Text>
            )}
          </View>

          {renderSectionTitle('المكملات الغذائية')}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {renderToggle('مكمل كالسيوم', needsCalciumSupplement, () => setNeedsCalciumSupplement(!needsCalciumSupplement))}
            {needsCalciumSupplement && (
              <>
                <Text style={[styles.inputLabel, { color: theme.text }]}>نوع مكمل الكالسيوم</Text>
                <View style={styles.optionRow}>
                  {(Object.keys(supplementTypeLabels) as Array<keyof typeof supplementTypeLabels>).map(
                    (key) => (
                      <TouchableOpacity
                        key={key}
                        style={[styles.optionBtn, calciumSupplementType === key && { backgroundColor: colors.accentViolet }]}
                        onPress={() => setCalciumSupplementType(key as 'calcium_carbonate' | 'calcium_citrate' | 'calcium_lactate')}
                      >
                        <Text style={[styles.optionBtnText, { color: calciumSupplementType === key ? '#FFF' : theme.subtext }]}>
                          {supplementTypeLabels[key]}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
                {renderInput('جرعة الكالسيوم (ملغ/يوم)', calciumSupplementDose, setCalciumSupplementDose)}
              </>
            )}
            {renderToggle('مكمل فيتامين D', needsVitaminDSupplement, () => setNeedsVitaminDSupplement(!needsVitaminDSupplement))}
            {needsVitaminDSupplement && (
              <>
                <View style={styles.optionRow}>
                  <TouchableOpacity
                    style={[styles.optionBtn, vitaminDSupplementType === 'd3' && { backgroundColor: colors.accentTeal }]}
                    onPress={() => setVitaminDSupplementType('d3')}
                  >
                    <Text style={[styles.optionBtnText, { color: vitaminDSupplementType === 'd3' ? '#FFF' : theme.subtext }]}>D3</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.optionBtn, vitaminDSupplementType === 'd2' && { backgroundColor: colors.accentTeal }]}
                    onPress={() => setVitaminDSupplementType('d2')}
                  >
                    <Text style={[styles.optionBtnText, { color: vitaminDSupplementType === 'd2' ? '#FFF' : theme.subtext }]}>D2</Text>
                  </TouchableOpacity>
                </View>
                {renderInput('جرعة فيتامين D (وحدة/يوم)', vitaminDSupplementDose, setVitaminDSupplementDose)}
              </>
            )}
            {renderToggle('مكمل فيتامين K', needsVitaminKSupplement, () => setNeedsVitaminKSupplement(!needsVitaminKSupplement))}
            {needsVitaminKSupplement && renderInput('جرعة فيتامين K (ميكروغ/يوم)', vitaminKSupplementDose, setVitaminKSupplementDose)}
            {renderToggle('مكمل مغنيسيوم', needsMagnesiumSupplement, () => setNeedsMagnesiumSupplement(!needsMagnesiumSupplement))}
            {needsMagnesiumSupplement && renderInput('جرعة المغنيسيوم (ملغ/يوم)', magnesiumSupplementDose, setMagnesiumSupplementDose)}
          </View>

          {renderSectionTitle('التمارين الرياضية')}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {renderToggle('تمارين حمل الوزن', weightBearingExercise, () => setWeightBearingExercise(!weightBearingExercise))}
            {renderToggle('تمارين المقاومة', resistanceTraining, () => setResistanceTraining(!resistanceTraining))}
            {renderToggle('تمارين التوازن', balanceExercise, () => setBalanceExercise(!balanceExercise))}
            <View style={styles.inputRow}>
              {renderInput('عدد المرات (أسبوعياً)', exerciseFrequency, setExerciseFrequency)}
              {renderInput('المدة (دقيقة/جلسة)', exerciseDuration, setExerciseDuration)}
            </View>
          </View>

          {renderSectionTitle('الوقاية من السقوط')}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {renderToggle('مراجعة سلامة المنزل', homeSafetyReview, () => setHomeSafetyReview(!homeSafetyReview))}
            {renderToggle('فحص النظر', visionCheck, () => setVisionCheck(!visionCheck))}
            {renderToggle('تقييم الأحذية', footwearAssessment, () => setFootwearAssessment(!footwearAssessment))}
            {renderToggle('استخدام أداة مساعدة', assistiveDevice, () => setAssistiveDevice(!assistiveDevice))}
          </View>

          {renderSectionTitle('التوصيات الغذائية (الأطعمة الغنية)')}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {renderInput('الأطعمة الغنية بالكالسيوم (عنصر لكل سطر)', calciumRichFoods, setCalciumRichFoods, true)}
            {renderInput('الأطعمة الغنية بفيتامين D', vitaminDRichFoods, setVitaminDRichFoods, true)}
            {renderInput('الأطعمة الغنية بالبروتين', proteinRichFoods, setProteinRichFoods, true)}
            {renderInput('الأطعمة الغنية بفيتامين K', vitaminKRichFoods, setVitaminKRichFoods, true)}
          </View>

          {renderSectionTitle('العوامل المثبطة / الواجب تجنبها')}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {renderToggle('تجنب الإفراط في الصوديوم', avoidExcessSodium, () => setAvoidExcessSodium(!avoidExcessSodium))}
            {renderToggle('تجنب الإفراط في البروتين', avoidExcessProtein, () => setAvoidExcessProtein(!avoidExcessProtein))}
            {renderToggle('الإقلاع عن التدخين', avoidSmoking, () => setAvoidSmoking(!avoidSmoking))}
            {renderToggle('تجنب الإفراط في الكحول', avoidExcessAlcohol, () => setAvoidExcessAlcohol(!avoidExcessAlcohol))}
            {renderToggle('تجنب الإفراط في الكافيين', avoidCaffeineExcess, () => setAvoidCaffeineExcess(!avoidCaffeineExcess))}
          </View>

          {renderSectionTitle('إعدادات المتابعة')}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>وتيرة فحص كثافة العظام</Text>
            <View style={styles.optionRow}>
              <TouchableOpacity
                style={[styles.optionBtn, boneDensityCheckFrequency === 'annual' && { backgroundColor: colors.accentTeal }]}
                onPress={() => setBoneDensityCheckFrequency('annual')}
              >
                <Text style={[styles.optionBtnText, { color: boneDensityCheckFrequency === 'annual' ? '#FFF' : theme.subtext }]}>
                  سنوي
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionBtn, boneDensityCheckFrequency === 'biennial' && { backgroundColor: colors.accentTeal }]}
                onPress={() => setBoneDensityCheckFrequency('biennial')}
              >
                <Text style={[styles.optionBtnText, { color: boneDensityCheckFrequency === 'biennial' ? '#FFF' : theme.subtext }]}>
                  كل سنتين
                </Text>
              </TouchableOpacity>
            </View>
            {renderInput('T-Score المستهدف', targetBoneDensity, setTargetBoneDensity)}
            {renderInput('المدة المتوقعة للتحسن (أشهر)', expectedImprovementMonths, setExpectedImprovementMonths)}
          </View>

          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.accentTeal }]} onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="save" size={18} color="#FFF" />
                <Text style={styles.saveBtnText}>حفظ الخطة الغذائية</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  header: {
    height: 70,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingTop: Platform.OS === 'ios' ? 10 : 0,
  },
  backButton: {
    position: 'absolute',
    right: 16,
    padding: 8,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: fontSizes.lg,
    fontFamily: fontFamilies.bold,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitleBar: {
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionTitleText: {
    fontSize: fontSizes.md,
    fontFamily: fontFamilies.bold,
    textAlign: 'right',
    marginBottom: 4,
  },
  sectionLine: {
    height: 2,
    borderRadius: 1,
  },
  targetsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  targetCard: {
    flex: 1,
    minWidth: '28%',
    borderWidth: 1,
    borderRadius: 10,
    padding: spacing.sm,
    alignItems: 'center',
  },
  targetLabel: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.regular,
    textAlign: 'center',
    marginBottom: 2,
  },
  targetValue: {
    fontSize: fontSizes.lg,
    fontFamily: fontFamilies.bold,
  },
  targetUnit: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.regular,
    textAlign: 'center',
    marginTop: 2,
  },
  inputRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
  },
  inputGroup: {
    flex: 1,
    marginBottom: spacing.sm,
  },
  inputLabel: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.regular,
    marginBottom: 4,
    textAlign: 'right',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.regular,
    textAlign: 'right',
  },
  inputMultiline: {
    minHeight: 60,
    paddingTop: spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  toggleLabel: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.regular,
    flex: 1,
    textAlign: 'right',
  },
  toggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: colors.surfaceSecondary,
    minWidth: 60,
    alignItems: 'center',
  },
  toggleBtnText: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.bold,
  },
  optionRow: {
    flexDirection: 'row-reverse',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  optionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.surfaceSecondary,
  },
  optionBtnText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.regular,
  },
  saveBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: fontSizes.md,
    fontFamily: fontFamilies.bold,
  },
  emptyText: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.regular,
    textAlign: 'center',
  },
});
