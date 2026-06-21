import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../../src/presentation/hooks/useAppTheme';
import { colors, spacing, fontFamilies, fontSizes } from '../../../src/presentation/theme';
import { useOsteoporosisAssessment } from '../../../src/presentation/hooks/useOsteoporosisAssessment';
import { OsteoporosisNutritionEngine } from '../../../src/domain/calculators/OsteoporosisNutritionEngine';

const classificationLabels: Record<string, string> = {
  normal: 'طبيعي',
  low_bone_mass: 'نقص كثافة عظمية',
  osteoporosis: 'هشاشة عظام',
  severe_osteoporosis: 'هشاشة عظام حادة',
};
const classificationColors: Record<string, string> = {
  normal: colors.success,
  low_bone_mass: colors.accentAmber,
  osteoporosis: colors.danger,
  severe_osteoporosis: '#7F1D1D',
};
const frLabels: Record<string, string> = {
  low: 'منخفضة', moderate: 'متوسطة', high: 'مرتفعة', very_high: 'مرتفعة جداً',
};
const dpl: Record<string, string> = {
  regular: 'عادي', vegetarian: 'نباتي', vegan: 'نباتي صرف', restricted: 'مقيد',
};

export default function OsteoporosisAssessmentScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useAppTheme();
  const { createAssessment, isLoading: saving } = useOsteoporosisAssessment(patientId);

  const [femoralNeckTScore, setFemoralNeckTScore] = useState('');
  const [lumbarSpineTScore, setLumbarSpineTScore] = useState('');
  const [overallTScore, setOverallTScore] = useState('');
  const [femoralNeckZScore, setFemoralNeckZScore] = useState('');
  const [lumbarZScore, setLumbarZScore] = useState('');
  const [overallZScore, setOverallZScore] = useState('');
  const [serumCalcium, setSerumCalcium] = useState('');
  const [vitaminD25OH, setVitaminD25OH] = useState('');
  const [serumPhosphorus, setSerumPhosphorus] = useState('');
  const [serumMagnesium, setSerumMagnesium] = useState('');
  const [serumPTH, setSerumPTH] = useState('');
  const [urinaryCalcium, setUrinaryCalcium] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [heightLost, setHeightLost] = useState('');
  const [hasFamilyHistory, setHasFamilyHistory] = useState(false);
  const [isPostmenopausal, setIsPostmenopausal] = useState(false);
  const [hasSmoking, setHasSmoking] = useState(false);
  const [hasAlcoholUse, setHasAlcoholUse] = useState(false);
  const [hasLowPhysicalActivity, setHasLowPhysicalActivity] = useState(false);
  const [hasFallHistory, setHasFallHistory] = useState(false);
  const [hasHipFracture, setHasHipFracture] = useState(false);
  const [hasVertebralFracture, setHasVertebralFracture] = useState(false);
  const [hasOtherFracture, setHasOtherFracture] = useState(false);
  const [hasGlucocorticoids, setHasGlucocorticoids] = useState(false);
  const [hasThyroidMedication, setHasThyroidMedication] = useState(false);
  const [hasAnticoagulants, setHasAnticoagulants] = useState(false);
  const [hasAromataseInhibitors, setHasAromataseInhibitors] = useState(false);
  const [hasProtonInhibitors, setHasProtonInhibitors] = useState(false);
  const [hasHyperthyroidism, setHasHyperthyroidism] = useState(false);
  const [hasHyperparathyroidism, setHasHyperparathyroidism] = useState(false);
  const [hasCKD, setHasCKD] = useState(false);
  const [hasGIDisease, setHasGIDisease] = useState(false);
  const [hasRheumatoidArthritis, setHasRheumatoidArthritis] = useState(false);
  const [hasDiabetes, setHasDiabetes] = useState(false);
  const [dietaryPattern, setDietaryPattern] = useState<'regular' | 'vegetarian' | 'vegan' | 'restricted'>('regular');
  const [dairyConsumption, setDairyConsumption] = useState('');
  const [isVegetarian, setIsVegetarian] = useState(false);
  const [isVegan, setIsVegan] = useState(false);
  const [hasBackPain, setHasBackPain] = useState(false);
  const [hasLostHeight, setHasLostHeight] = useState(false);
  const [hasKyphosis, setHasKyphosis] = useState(false);
  const [calcClass, setCalcClass] = useState<string | null>(null);
  const [calcRisk, setCalcRisk] = useState<string | null>(null);

  const bmi = useMemo(() => {
    const w = parseFloat(weight) || 0;
    const h = parseFloat(height) || 0;
    return w > 0 && h > 0 ? (w / Math.pow(h / 100, 2)).toFixed(1) : '0';
  }, [weight, height]);

  const handleCalculate = () => {
    const t = parseFloat(overallTScore);
    if (!t) { Alert.alert('تنبيه', 'يرجى إدخال T-Score الكلي'); return; }
    setCalcClass(OsteoporosisNutritionEngine.classifyBoneDensity(t));
    setCalcRisk(OsteoporosisNutritionEngine.calculateFractureRisk({
      overallTScore: t, age: parseFloat(age) || 0,
      hasHipFracture, hasVertebralFracture, hasOtherFracture,
      hasFallHistory, hasGlucocorticoids, hasSmoking,
      hasAlcoholUse, alcoholUnitsPerWeek: hasAlcoholUse ? 3 : 0,
      isPostmenopausal, hasFamilyHistory, hasLowPhysicalActivity,
    } as any));
  };

  const handleSave = async () => {
    if (!overallTScore) { Alert.alert('تنبيه', 'يرجى إدخال T-Score الكلي'); return; }
    const p = (v: string) => parseFloat(v) || 0;
    try {
      await createAssessment({
        femoralNeckTScore: p(femoralNeckTScore), lumbarSpineTScore: p(lumbarSpineTScore),
        overallTScore: p(overallTScore), femoralNeckZScore: p(femoralNeckZScore),
        lumbarZScore: p(lumbarZScore), overallZScore: p(overallZScore),
        classification: calcClass || OsteoporosisNutritionEngine.classifyBoneDensity(p(overallTScore)),
        fractureRisk: calcRisk || 'low',
        serumCalcium: p(serumCalcium), calciumIntake: 0, calciumStatus: 'adequate',
        vitaminD25OH: p(vitaminD25OH), vitaminDStatus: 'normal',
        serumPhosphorus: p(serumPhosphorus), serumMagnesium: p(serumMagnesium),
        serumPTH: p(serumPTH), urinaryCalcium: p(urinaryCalcium), p1NP: 0, dPyrid: 0,
        age: p(age), gender, weight: p(weight), height: p(height), bmi: parseFloat(bmi) || 0,
        hasFamilyHistory, hasEarlyMenopause: false, isPostmenopausal, yearsPostMenopause: 0,
        hasSmoking, smokingCigarettesPerDay: 0, hasAlcoholUse,
        alcoholUnitsPerWeek: hasAlcoholUse ? 3 : 0,
        hasLowPhysicalActivity, hasFallHistory, hasHipFracture, hasVertebralFracture, hasOtherFracture,
        hasGlucocorticoids, glucocorticoidDose: 0, glucocorticoidDuration: 0,
        hasThyroidMedication, hasAnticoagulants, hasAromataseInhibitors, hasProtonInhibitors,
        hasHyperthyroidism, hasHyperparathyroidism, hasCKD, hasGIDisease,
        hasRheumatoidArthritis, hasDiabetes,
        dietaryPattern, dairyConsumption: p(dairyConsumption), isVegetarian, isVegan,
        hasBackPain, hasLostHeight, heightLost: p(heightLost), hasKyphosis,
      });
      Alert.alert('نجاح', 'تم حفظ التقييم بنجاح');
      router.back();
    } catch { Alert.alert('خطأ', 'فشل حفظ التقييم'); }
  };

  const renderToggle = (label: string, value: boolean, set: (v: boolean) => void) => (
    <View style={styles.tr}>
      <Text style={[styles.tl, { color: theme.text }]}>{label}</Text>
      <TouchableOpacity style={[styles.tb, value && { backgroundColor: colors.accentViolet }]} onPress={() => set(!value)}>
        <Text style={[styles.tbt, { color: value ? '#FFF' : theme.subtext }]}>{value ? 'نعم' : 'لا'}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderInput = (label: string, value: string, set: (v: string) => void) => (
    <View style={styles.ig}>
      <Text style={[styles.il, { color: theme.text }]}>{label}</Text>
      <TextInput style={[styles.in, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
        value={value} onChangeText={set} keyboardType="decimal-pad" placeholderTextColor={theme.subtext} />
    </View>
  );

  const section = (title: string) => (
    <Text style={[styles.sectionTitle, { color: colors.accentViolet }]}>{title}</Text>
  );

  const T = (l: string, v: boolean, s: (x: boolean) => void) => renderToggle(l, v, s);
  const I = (l: string, v: string, s: (x: string) => void) => renderInput(l, v, s);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: colors.accentViolet }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-forward" size={24} color={colors.primaryContrast} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>تقييم هشاشة العظام</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {section('قياسات كثافة العظام')}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.row}>{I('T-Score عنق الفخذ', femoralNeckTScore, setFemoralNeckTScore)}{I('T-Score العمود الفقري', lumbarSpineTScore, setLumbarSpineTScore)}</View>
            <View style={styles.row}>{I('T-Score الكلي', overallTScore, setOverallTScore)}{I('Z-Score عنق الفخذ', femoralNeckZScore, setFemoralNeckZScore)}</View>
            <View style={styles.row}>{I('Z-Score العمود الفقري', lumbarZScore, setLumbarZScore)}{I('Z-Score الكلي', overallZScore, setOverallZScore)}</View>
            {calcClass && (
              <View style={styles.calcResult}>
                <View style={[styles.classBadge, { backgroundColor: (classificationColors[calcClass] || colors.textDisabled) + '20' }]}>
                  <Text style={[styles.classBadgeText, { color: classificationColors[calcClass] || colors.textDisabled }]}>{classificationLabels[calcClass] || calcClass}</Text>
                </View>
                {calcRisk && <Text style={[styles.riskText, { color: theme.subtext }]}>مخاطر الكسور: {frLabels[calcRisk]}</Text>}
              </View>
            )}
          </View>

          {section('البيانات الأساسية')}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.row}>
              {I('العمر (سنة)', age, setAge)}
              <View style={styles.ig}>
                <Text style={[styles.il, { color: theme.text }]}>الجنس</Text>
                <View style={styles.genderRow}>
                  <TouchableOpacity style={[styles.genderBtn, gender === 'female' && { backgroundColor: colors.accentViolet }]} onPress={() => setGender('female')}>
                    <Text style={[styles.genderBtnText, { color: gender === 'female' ? '#FFF' : theme.subtext }]}>أنثى</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.genderBtn, gender === 'male' && { backgroundColor: colors.accentViolet }]} onPress={() => setGender('male')}>
                    <Text style={[styles.genderBtnText, { color: gender === 'male' ? '#FFF' : theme.subtext }]}>ذكر</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <View style={styles.row}>{I('الوزن (كغم)', weight, setWeight)}{I('الطول (سم)', height, setHeight)}</View>
            <Text style={[styles.bmiText, { color: theme.subtext }]}>مؤشر كتلة الجسم (BMI): {bmi}</Text>
          </View>

          {section('الفحوصات المخبرية')}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.row}>{I('الكالسيوم (ملغ/دل)', serumCalcium, setSerumCalcium)}{I('فيتامين D 25OH (نانوغرام/مل)', vitaminD25OH, setVitaminD25OH)}</View>
            <View style={styles.row}>{I('الفوسفور (ملغ/دل)', serumPhosphorus, setSerumPhosphorus)}{I('المغنيسيوم (ملغ/دل)', serumMagnesium, setSerumMagnesium)}</View>
            <View style={styles.row}>{I('PTH (بغ/مل)', serumPTH, setSerumPTH)}{I('الكالسيوم البولي (ملغ/يوم)', urinaryCalcium, setUrinaryCalcium)}</View>
          </View>

          {section('عوامل الخطورة')}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {T('تاريخ عائلي للإصابة', hasFamilyHistory, setHasFamilyHistory)}{T('انقطاع الطمث', isPostmenopausal, setIsPostmenopausal)}
            {T('تدخين', hasSmoking, setHasSmoking)}{T('تناول الكحول', hasAlcoholUse, setHasAlcoholUse)}
            {T('قلة النشاط البدني', hasLowPhysicalActivity, setHasLowPhysicalActivity)}{T('تاريخ السقوط', hasFallHistory, setHasFallHistory)}
            {T('كسر الورك سابقاً', hasHipFracture, setHasHipFracture)}{T('كسر فقري سابقاً', hasVertebralFracture, setHasVertebralFracture)}{T('كسر آخر', hasOtherFracture, setHasOtherFracture)}
          </View>

          {section('الأدوية')}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {T('الكورتيكوستيرويدات', hasGlucocorticoids, setHasGlucocorticoids)}{T('أدوية الغدة الدرقية', hasThyroidMedication, setHasThyroidMedication)}
            {T('مضادات التخثر', hasAnticoagulants, setHasAnticoagulants)}{T('مثبطات الأروماتاز', hasAromataseInhibitors, setHasAromataseInhibitors)}{T('مثبطات البروتون', hasProtonInhibitors, setHasProtonInhibitors)}
          </View>

          {section('الحالات الطبية')}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {T('فرط نشاط الغدة الدرقية', hasHyperthyroidism, setHasHyperthyroidism)}{T('فرط نشاط جارات الدرقية', hasHyperparathyroidism, setHasHyperparathyroidism)}
            {T('أمراض الكلى المزمنة', hasCKD, setHasCKD)}{T('أمراض الجهاز الهضمي', hasGIDisease, setHasGIDisease)}
            {T('التهاب المفاصل الروماتويدي', hasRheumatoidArthritis, setHasRheumatoidArthritis)}{T('السكري', hasDiabetes, setHasDiabetes)}
          </View>

          {section('التقييم الغذائي')}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.il, { color: theme.text }]}>النمط الغذائي</Text>
            <View style={styles.optionRow}>
              {(Object.keys(dpl) as Array<keyof typeof dpl>).map((k) => (
                <TouchableOpacity key={k} style={[styles.optionBtn, dietaryPattern === k && { backgroundColor: colors.accentViolet }]} onPress={() => setDietaryPattern(k as 'regular' | 'vegetarian' | 'vegan' | 'restricted')}>
                  <Text style={[styles.optionBtnText, { color: dietaryPattern === k ? '#FFF' : theme.subtext }]}>{dpl[k]}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {I('عدد حصص الألبان يومياً', dairyConsumption, setDairyConsumption)}{T('نباتي', isVegetarian, setIsVegetarian)}{T('نباتي صرف', isVegan, setIsVegan)}
          </View>

          {section('الأعراض')}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {T('آلام الظهر', hasBackPain, setHasBackPain)}{T('فقدان الطول', hasLostHeight, setHasLostHeight)}
            {hasLostHeight && I('مقدار فقدان الطول (سم)', heightLost, setHeightLost)}{T('الحداب (تقوس الظهر)', hasKyphosis, setHasKyphosis)}
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.calcBtn, { backgroundColor: colors.accentAmber }]} onPress={handleCalculate}>
              <Ionicons name="calculator" size={18} color="#FFF" />
              <Text style={styles.calcBtnText}>حساب التصنيف والمخاطر</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.accentViolet }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#FFF" /> : <><Ionicons name="save" size={18} color="#FFF" /><Text style={styles.saveBtnText}>حفظ التقييم</Text></>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, container: { flex: 1 },
  header: { height: 70, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', position: 'relative', paddingTop: Platform.OS === 'ios' ? 10 : 0 },
  backBtn: { position: 'absolute', right: 16, padding: 8 },
  headerTitle: { color: '#FFF', fontSize: fontSizes.lg, fontFamily: fontFamilies.bold },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  card: { borderRadius: 12, borderWidth: 1, padding: spacing.md, marginBottom: spacing.md },
  sectionTitle: { fontSize: fontSizes.md, fontFamily: fontFamilies.bold, textAlign: 'right', marginBottom: spacing.sm, marginTop: spacing.xs, borderBottomWidth: 2, borderBottomColor: colors.accentViolet + '30' },
  row: { flexDirection: 'row-reverse', gap: spacing.sm },
  ig: { flex: 1, marginBottom: spacing.sm },
  il: { fontSize: fontSizes.sm, fontFamily: fontFamilies.regular, marginBottom: 4, textAlign: 'right' },
  in: { borderWidth: 1, borderRadius: 8, padding: spacing.sm, fontSize: fontSizes.sm, fontFamily: fontFamilies.regular, textAlign: 'right' },
  tr: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  tl: { fontSize: fontSizes.sm, fontFamily: fontFamilies.regular, flex: 1, textAlign: 'right' },
  tb: { paddingVertical: 6, paddingHorizontal: 20, borderRadius: 8, backgroundColor: colors.surfaceSecondary, minWidth: 60, alignItems: 'center' },
  tbt: { fontSize: fontSizes.sm, fontFamily: fontFamilies.bold },
  genderRow: { flexDirection: 'row-reverse', gap: spacing.xs },
  genderBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', backgroundColor: colors.surfaceSecondary },
  genderBtnText: { fontSize: fontSizes.sm, fontFamily: fontFamilies.bold },
  optionRow: { flexDirection: 'row-reverse', gap: spacing.xs, marginBottom: spacing.sm, flexWrap: 'wrap' },
  optionBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: colors.surfaceSecondary },
  optionBtnText: { fontSize: fontSizes.xs, fontFamily: fontFamilies.regular },
  calcResult: { alignItems: 'center', marginTop: spacing.sm, gap: spacing.xs },
  classBadge: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 8 },
  classBadgeText: { fontSize: fontSizes.md, fontFamily: fontFamilies.bold },
  riskText: { fontSize: fontSizes.sm, fontFamily: fontFamilies.regular },
  bmiText: { fontSize: fontSizes.sm, fontFamily: fontFamilies.regular, textAlign: 'right', marginTop: spacing.xs },
  actionsRow: { flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.sm, marginBottom: spacing.xl },
  calcBtn: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: spacing.sm },
  calcBtnText: { color: '#FFF', fontSize: fontSizes.sm, fontFamily: fontFamilies.bold },
  saveBtn: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: spacing.sm },
  saveBtnText: { color: '#FFF', fontSize: fontSizes.sm, fontFamily: fontFamilies.bold },
});
