import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  ActivityIndicator, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { watchRecord } from '../../../src/data/database/observe';
import { useObservable } from '../../../src/presentation/hooks/useObservable';
import { useAppTheme } from '../../../src/presentation/hooks/useAppTheme';
import { colors, spacing, fontFamilies, fontSizes } from '../../../src/presentation/theme';
import { useStrokeNutritionPlan } from '../../../src/presentation/hooks/useStrokeNutritionPlan';
import { useStrokeAssessment } from '../../../src/presentation/hooks/useStrokeAssessment';
import { StrokeNutritionEngine } from '../../../src/domain/calculators/StrokeNutritionEngine';

export default function StrokeNutritionPlanScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useAppTheme();

  // Load patient
  const patient = useObservable(
    useMemo(() => watchRecord<any>('patients', patientId), [patientId]),
    null
  );

  const { plan, isLoading, createPlan } = useStrokeNutritionPlan(patientId);
  const { assessment } = useStrokeAssessment(patientId);

  // States
  const [targetCalories, setTargetCalories] = useState('2000');
  const [targetProtein, setTargetProtein] = useState('75');
  const [targetFluid, setTargetFluid] = useState('2000');
  const [stressFactor, setStressFactor] = useState('1.1');
  const [activityFactor, setActivityFactor] = useState('1.0');
  const [thickenLiquids, setThickenLiquids] = useState(false);
  const [liquidThickness, setLiquidThickness] = useState<'thin' | 'moderate' | 'thick' | 'nectar' | 'honey'>('thin');
  const [avoidFoodsText, setAvoidFoodsText] = useState('');
  const [feedingFrequency, setFeedingFrequency] = useState('5');
  const [nocturnalFeeding, setNocturnalFeeding] = useState(false);
  const [nocturnalRate, setNocturnalRate] = useState('0');
  const [weightCheckFrequency, setWeightCheckFrequency] = useState<'daily' | 'weekly' | 'biweekly'>('weekly');
  const [aspirationRisk, setAspirationRisk] = useState<'low' | 'moderate' | 'high'>('low');

  // Load assessment calculations automatically if present
  useEffect(() => {
    if (assessment && patient) {
      const age = patient.age ?? 65;
      const gender = patient.gender === 'female' ? 'female' : 'male';
      const weight = 70; // baseline/default
      const height = 170; // baseline/default
      
      const calcResult = StrokeNutritionEngine.calculate({
        age,
        weightKg: weight,
        heightCm: height,
        gender,
        strokeType: assessment.strokeType,
        strokeLocation: assessment.strokeLocation,
        severity: assessment.severity,
        hoursSinceStroke: assessment.hoursSinceStroke,
        gcs: assessment.gcs,
        nse: assessment.nse,
        hasDysphagia: assessment.hasDysphagia,
        dysphagiaSeverity: assessment.dysphagiaSeverity,
        waterSwallowTestResult: assessment.waterSwallowTestResult,
        coughReflex: assessment.coughReflex,
        oralIntakePercentage: assessment.oralIntakePercentage,
        baselineCalories: 1800,
        baselineProteinGrams: 60,
        baselineFluidsMl: 2000,
      });

      setTargetCalories(String(calcResult.nutritionPlan.targetCalories));
      setTargetProtein(String(calcResult.nutritionPlan.targetProtein));
      setTargetFluid(String(calcResult.nutritionPlan.targetFluid));
      setAspirationRisk(calcResult.nutritionPlan.aspirationRisk);
    }
  }, [assessment, patient]);

  // Sync state once plan is loaded
  useEffect(() => {
    if (plan) {
      setTargetCalories(String(plan.targetCalories));
      setTargetProtein(String(plan.targetProtein));
      setTargetFluid(String(plan.targetFluid));
      setStressFactor(String(plan.stressFactor));
      setActivityFactor(String(plan.activityFactor));
      setThickenLiquids(plan.thickenLiquids);
      setLiquidThickness(plan.liquidThickness);
      setAvoidFoodsText(plan.avoidFoods?.join(', ') || '');
      setFeedingFrequency(String(plan.feedingFrequency));
      setNocturnalFeeding(plan.nocturnalFeeding);
      setNocturnalRate(String(plan.nocturnalRate));
      setWeightCheckFrequency(plan.weightCheckFrequency);
      setAspirationRisk(plan.aspirationRisk);
    }
  }, [plan]);

  const handleSave = async () => {
    try {
      const data = {
        patientId,
        assessmentId: assessment?.createdAt || new Date().toISOString(),
        targetCalories: parseFloat(targetCalories) || 2000,
        targetProtein: parseFloat(targetProtein) || 75,
        targetFluid: parseFloat(targetFluid) || 2000,
        stressFactor: parseFloat(stressFactor) || 1.1,
        activityFactor: parseFloat(activityFactor) || 1.0,
        thickenLiquids,
        liquidThickness,
        avoidFoods: avoidFoodsText.split(',').map(s => s.trim()).filter(Boolean),
        feedingFrequency: parseInt(feedingFrequency, 10) || 5,
        nocturnalFeeding,
        nocturnalRate: parseFloat(nocturnalRate) || 0,
        weightCheckFrequency,
        aspirationRisk,
        createdAt: plan?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await createPlan(data);
      Alert.alert('نجاح', 'تم حفظ وتفعيل خطة التغذية العصبية بنجاح');
      router.back();
    } catch (err) {
      Alert.alert('خطأ', 'فشل حفظ خطة التغذية.');
    }
  };

  if (isLoading || !patient) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.flex} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-forward" size={24} color={colors.primaryContrast} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>📋 خطة التغذية العصبية</Text>
          <Text style={styles.headerSubtitle}>{patient.fullName} | {patient.fileNumber}</Text>
        </View>

        <View style={styles.content}>
          {/* Targets Card */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>أهداف وعناصر التغذية الموصى بها</Text>

            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>الطاقة المستهدفة (سعرة):</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={targetCalories}
                  onChangeText={setTargetCalories}
                  keyboardType="numeric"
                  textAlign="center"
                />
              </View>
              <View style={styles.gridCol}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>البروتين المستهدف (غ):</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={targetProtein}
                  onChangeText={setTargetProtein}
                  keyboardType="numeric"
                  textAlign="center"
                />
              </View>
              <View style={styles.gridCol}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>السوائل المستهدفة (مل):</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={targetFluid}
                  onChangeText={setTargetFluid}
                  keyboardType="numeric"
                  textAlign="center"
                />
              </View>
            </View>

            <View style={[styles.gridRow, { marginTop: spacing.md }]}>
              <View style={styles.gridCol}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>عامل الإجهاد (Stress):</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={stressFactor}
                  onChangeText={setStressFactor}
                  keyboardType="numeric"
                  textAlign="center"
                />
              </View>
              <View style={styles.gridCol}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>عامل الحركة (Activity):</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={activityFactor}
                  onChangeText={setActivityFactor}
                  keyboardType="numeric"
                  textAlign="center"
                />
              </View>
            </View>
          </View>

          {/* Safety & Dysphagia Adjustments */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>تعديلات القوام والسلامة البلعومية</Text>

            <View style={styles.toggleRow}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>استخدام مغلظات القوام للسوائل؟</Text>
              <TouchableOpacity
                style={[styles.toggleButton, thickenLiquids && { backgroundColor: colors.accentSky }]}
                onPress={() => setThickenLiquids(prev => !prev)}
              >
                <Text style={styles.toggleButtonText}>
                  {thickenLiquids ? 'نعم' : 'لا'}
                </Text>
              </TouchableOpacity>
            </View>

            {thickenLiquids && (
              <View style={{ marginTop: spacing.md }}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>درجة سماكة السوائل (Thickness):</Text>
                <View style={styles.optionRow}>
                  {(['thin', 'nectar', 'honey', 'thick'] as const).map(thick => (
                    <TouchableOpacity
                      key={thick}
                      style={[
                        styles.optionButton,
                        { backgroundColor: theme.background, borderColor: theme.border },
                        liquidThickness === thick && { backgroundColor: colors.accentIndigo, borderColor: colors.accentIndigo }
                      ]}
                      onPress={() => setLiquidThickness(thick)}
                    >
                      <Text style={[styles.optionText, { color: theme.text }, liquidThickness === thick && { color: '#FFF' }]}>
                        {thick === 'thin' ? 'رقيق' :
                         thick === 'nectar' ? 'رحيق (Nectar)' :
                         thick === 'honey' ? 'عسل (Honey)' : 'سميك جداً'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={[styles.formGroup, { marginTop: spacing.md }]}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>أطعمة يجب تجنبها (مفصولة بفاصلة):</Text>
              <TextInput
                style={[styles.inputField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                value={avoidFoodsText}
                onChangeText={setAvoidFoodsText}
                placeholder="مثال: الخبز الناشف، الفواكه المائية، المكسرات"
                placeholderTextColor={theme.subtext}
                textAlign="right"
              />
            </View>
          </View>

          {/* Schedule & Monitoring */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>جدولة التغذية والمراقبة</Text>

            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>عدد الوجبات الفموية أو الجرعات/يوم:</Text>
              <TextInput
                style={[styles.inputField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                value={feedingFrequency}
                onChangeText={setFeedingFrequency}
                keyboardType="numeric"
                textAlign="center"
              />
            </View>

            <View style={styles.toggleRow}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>تغذية أنبوبية ليلية (Nocturnal)؟</Text>
              <TouchableOpacity
                style={[styles.toggleButton, nocturnalFeeding && { backgroundColor: colors.primary }]}
                onPress={() => setNocturnalFeeding(prev => !prev)}
              >
                <Text style={styles.toggleButtonText}>
                  {nocturnalFeeding ? 'نعم' : 'لا'}
                </Text>
              </TouchableOpacity>
            </View>

            {nocturnalFeeding && (
              <View style={[styles.formGroup, { marginTop: spacing.md }]}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>معدل الضخ الليلي (مل/ساعة):</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={nocturnalRate}
                  onChangeText={setNocturnalRate}
                  keyboardType="numeric"
                  textAlign="center"
                />
              </View>
            )}

            <View style={[styles.formGroup, { marginTop: spacing.md }]}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>تواتر قياس الوزن:</Text>
              <View style={styles.optionRow}>
                {(['daily', 'weekly', 'biweekly'] as const).map(freq => (
                  <TouchableOpacity
                    key={freq}
                    style={[
                      styles.optionButton,
                      { backgroundColor: theme.background, borderColor: theme.border },
                      weightCheckFrequency === freq && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                    onPress={() => setWeightCheckFrequency(freq)}
                  >
                    <Text style={[styles.optionText, { color: theme.text }, weightCheckFrequency === freq && { color: '#FFF' }]}>
                      {freq === 'daily' ? 'يومي' :
                       freq === 'weekly' ? 'أسبوعي' : 'كل أسبوعين'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.formGroup, { marginTop: spacing.md }]}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>مستوى خطر الارتشاف الرئوي (Aspiration Risk):</Text>
              <View style={[styles.badge, aspirationRisk === 'high' ? styles.badgeHigh : aspirationRisk === 'moderate' ? styles.badgeMod : styles.badgeLow]}>
                <Text style={styles.badgeText}>
                  {aspirationRisk === 'high' ? '⚠️ خطر ارتشاف رئوي مرتفع' :
                   aspirationRisk === 'moderate' ? '⚠️ خطر ارتشاف رئوي متوسط' : '✅ خطر ارتشاف رئوي منخفض'}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>حفظ وتفعيل خطة التغذية</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: colors.primaryDark,
    paddingTop: 48,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backBtn: {
    position: 'absolute',
    top: 52,
    start: spacing.lg,
    zIndex: 1,
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fontFamilies.bold,
    color: colors.primaryContrast,
    textAlign: 'right',
    marginTop: 20,
  },
  headerSubtitle: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.regular,
    color: colors.textTertiary,
    textAlign: 'right',
    marginTop: 2,
    opacity: 0.85,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.lg,
  },
  cardTitle: {
    fontSize: fontSizes.md + 2,
    fontFamily: fontFamilies.bold,
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.medium,
    textAlign: 'right',
    marginBottom: 6,
  },
  inputField: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: fontSizes.md,
    fontFamily: fontFamilies.regular,
  },
  optionRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionButton: {
    flex: 1,
    minWidth: '45%',
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.medium,
  },
  gridRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  gridCol: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleButton: {
    backgroundColor: '#94A3B8',
    width: 60,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonText: {
    color: '#FFF',
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.bold,
  },
  saveButton: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  saveButtonText: {
    color: colors.primaryContrast,
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.md,
  },
  badge: {
    padding: spacing.md,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeHigh: {
    backgroundColor: '#fee2e2',
  },
  badgeMod: {
    backgroundColor: '#fef3c7',
  },
  badgeLow: {
    backgroundColor: '#ecfdf5',
  },
  badgeText: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.bold,
    color: colors.textPrimary,
  },
});
