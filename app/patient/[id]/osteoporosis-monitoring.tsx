import React, { useState } from 'react';
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
import { useOsteoporosisMonitoring } from '../../../src/presentation/hooks/useOsteoporosisMonitoring';

export default function OsteoporosisMonitoringScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useAppTheme();
  const { addMonitoring, isLoading: saving } = useOsteoporosisMonitoring(patientId);

  const [followUpDate, setFollowUpDate] = useState(new Date().toISOString().split('T')[0]);
  const [femoralNeckTScore, setFemoralNeckTScore] = useState('');
  const [lumbarSpineTScore, setLumbarSpineTScore] = useState('');
  const [overallTScore, setOverallTScore] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [vitaminD25OH, setVitaminD25OH] = useState('');
  const [serumCalcium, setSerumCalcium] = useState('');
  const [hasNewFracture, setHasNewFracture] = useState(false);
  const [fractureType, setFractureType] = useState<'hip' | 'vertebral' | 'other' | null>(null);
  const [backPainImprovement, setBackPainImprovement] = useState<'none' | 'mild' | 'moderate' | 'significant'>('none');
  const [physicalActivityImprovement, setPhysicalActivityImprovement] = useState<'none' | 'mild' | 'moderate' | 'significant'>('none');
  const [adherenceToSupplements, setAdherenceToSupplements] = useState(false);
  const [adherenceToExercise, setAdherenceToExercise] = useState(false);
  const [adherenceToDiet, setAdherenceToDiet] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [boneDensityChange, setBoneDensityChange] = useState('');
  const [improvementPercentage, setImprovementPercentage] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');

  const bmi = (() => {
    const w = parseFloat(weight) || 0;
    const h = parseFloat(height) || 0;
    if (w > 0 && h > 0) return (w / Math.pow(h / 100, 2)).toFixed(1);
    return '—';
  })();

  const improvementLabels: Record<string, string> = {
    none: 'لا يوجد',
    mild: 'خفيف',
    moderate: 'متوسط',
    significant: 'كبير',
  };

  const fractureTypeLabels: Record<string, string> = {
    hip: 'الورك',
    vertebral: 'فقري',
    other: 'آخر',
  };

  const handleSave = async () => {
    if (!followUpDate) {
      Alert.alert('تنبيه', 'يرجى إدخال تاريخ المتابعة');
      return;
    }
    try {
      await addMonitoring({
        planId: '',
        followUpDate,
        femoralNeckTScore: parseFloat(femoralNeckTScore) || 0,
        lumbarSpineTScore: parseFloat(lumbarSpineTScore) || 0,
        overallTScore: parseFloat(overallTScore) || 0,
        weight: parseFloat(weight) || 0,
        height: parseFloat(height) || 0,
        bmi: parseFloat(bmi) || 0,
        vitaminD25OH: parseFloat(vitaminD25OH) || 0,
        serumCalcium: parseFloat(serumCalcium) || 0,
        hasNewFracture,
        fractureType: hasNewFracture ? fractureType : null,
        backPainImprovement,
        physicalActivityImprovement,
        adherenceToSupplements,
        adherenceToExercise,
        adherenceToDiet,
        isImproving,
        boneDensityChange: parseFloat(boneDensityChange) || 0,
        improvementPercentage: parseFloat(improvementPercentage) || 0,
        nextFollowUpDate,
      });
      Alert.alert('نجاح', 'تم تسجيل متابعة هشاشة العظام بنجاح');
      router.back();
    } catch {
      Alert.alert('خطأ', 'فشل حفظ المتابعة');
    }
  };

  const renderSectionTitle = (title: string) => (
    <View style={styles.sectionTitleBar}>
      <Text style={[styles.sectionTitleText, { color: colors.info }]}>{title}</Text>
      <View style={[styles.sectionLine, { backgroundColor: colors.info + '30' }]} />
    </View>
  );

  const renderToggle = (label: string, value: boolean, onToggle: () => void) => (
    <View style={styles.toggleRow}>
      <Text style={[styles.toggleLabel, { color: theme.text }]}>{label}</Text>
      <TouchableOpacity
        style={[styles.toggleBtn, value && { backgroundColor: colors.info }]}
        onPress={onToggle}
      >
        <Text style={[styles.toggleBtnText, { color: value ? '#FFF' : theme.subtext }]}>
          {value ? 'نعم' : 'لا'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderInput = (label: string, value: string, onChange: (v: string) => void) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: theme.text }]}>{label}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        placeholderTextColor={theme.subtext}
      />
    </View>
  );

  const renderOptionGroup = <T extends string>(
    options: { key: T; label: string }[],
    selected: T,
    onSelect: (key: T) => void,
    color?: string
  ) => (
    <View style={styles.optionRow}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.key}
          style={[styles.optionBtn, selected === opt.key && { backgroundColor: color || colors.info }]}
          onPress={() => onSelect(opt.key)}
        >
          <Text style={[styles.optionBtnText, { color: selected === opt.key ? '#FFF' : theme.subtext }]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: colors.info }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-forward" size={24} color={colors.primaryContrast} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>متابعة هشاشة العظام</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {renderSectionTitle('تاريخ المتابعة')}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>تاريخ المتابعة</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                value={followUpDate}
                onChangeText={setFollowUpDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.subtext}
              />
            </View>
          </View>

          {renderSectionTitle('القياسات الحالية')}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.inputRow}>
              {renderInput('T-Score عنق الفخذ', femoralNeckTScore, setFemoralNeckTScore)}
              {renderInput('T-Score العمود الفقري', lumbarSpineTScore, setLumbarSpineTScore)}
            </View>
            {renderInput('T-Score الكلي', overallTScore, setOverallTScore)}
            <View style={styles.inputRow}>
              {renderInput('الوزن (كغم)', weight, setWeight)}
              {renderInput('الطول (سم)', height, setHeight)}
            </View>
            <Text style={[styles.bmiText, { color: theme.subtext }]}>مؤشر كتلة الجسم (BMI): {bmi}</Text>
          </View>

          {renderSectionTitle('الفحوصات المخبرية')}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.inputRow}>
              {renderInput('فيتامين D 25OH (نانوغرام/مل)', vitaminD25OH, setVitaminD25OH)}
              {renderInput('الكالسيوم (ملغ/دل)', serumCalcium, setSerumCalcium)}
            </View>
          </View>

          {renderSectionTitle('الحالة السريرية')}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {renderToggle('وجود كسر جديد', hasNewFracture, () => {
              setHasNewFracture(!hasNewFracture);
              if (hasNewFracture) setFractureType(null);
            })}
            {hasNewFracture && (
              <>
                <Text style={[styles.inputLabel, { color: theme.text }]}>نوع الكسر</Text>
                {renderOptionGroup(
                  [
                    { key: 'hip' as const, label: 'الورك' },
                    { key: 'vertebral' as const, label: 'فقري' },
                    { key: 'other' as const, label: 'آخر' },
                  ],
                  fractureType || 'hip',
                  (k) => setFractureType(k),
                  colors.danger
                )}
              </>
            )}
            <Text style={[styles.inputLabel, { color: theme.text }]}>تحسن آلام الظهر</Text>
            {renderOptionGroup(
              [
                { key: 'none' as const, label: 'لا يوجد' },
                { key: 'mild' as const, label: 'خفيف' },
                { key: 'moderate' as const, label: 'متوسط' },
                { key: 'significant' as const, label: 'كبير' },
              ],
              backPainImprovement,
              setBackPainImprovement,
              colors.accentAmber
            )}
            <Text style={[styles.inputLabel, { color: theme.text }]}>تحسن النشاط البدني</Text>
            {renderOptionGroup(
              [
                { key: 'none' as const, label: 'لا يوجد' },
                { key: 'mild' as const, label: 'خفيف' },
                { key: 'moderate' as const, label: 'متوسط' },
                { key: 'significant' as const, label: 'كبير' },
              ],
              physicalActivityImprovement,
              setPhysicalActivityImprovement,
              colors.accentTeal
            )}
          </View>

          {renderSectionTitle('الالتزام')}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {renderToggle('الالتزام بالمكملات', adherenceToSupplements, () => setAdherenceToSupplements(!adherenceToSupplements))}
            {renderToggle('الالتزام بالتمارين', adherenceToExercise, () => setAdherenceToExercise(!adherenceToExercise))}
            {renderToggle('الالتزام بالحمية', adherenceToDiet, () => setAdherenceToDiet(!adherenceToDiet))}
          </View>

          {renderSectionTitle('مؤشرات التقدم')}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {renderToggle('يوجد تحسن', isImproving, () => setIsImproving(!isImproving))}
            <View style={styles.inputRow}>
              {renderInput('تغير كثافة العظام (T-Score)', boneDensityChange, setBoneDensityChange)}
              {renderInput('نسبة التحسن (%)', improvementPercentage, setImprovementPercentage)}
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>موعد المتابعة القادم</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                value={nextFollowUpDate}
                onChangeText={setNextFollowUpDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.subtext}
              />
            </View>
          </View>

          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.info }]} onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="save" size={18} color="#FFF" />
                <Text style={styles.saveBtnText}>حفظ المتابعة</Text>
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
  bmiText: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.regular,
    textAlign: 'right',
    marginTop: spacing.xs,
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
});
