import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  TextInput, Platform, KeyboardAvoidingView, Alert, StyleSheet
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { combineLatest, Observable, of } from 'rxjs';
import { map, catchError, debounceTime } from 'rxjs/operators';
import { Q } from '@nozbe/watermelondb';

import { getDatabase } from '../../../src/data/database';
import { watchQuery, watchRecord } from '../../../src/data/database/observe';
import { useObservable } from '../../../src/presentation/hooks/useObservable';
import { useAppTheme } from '../../../src/presentation/hooks/useAppTheme';
import { colors, spacing, fontFamilies, fontSizes } from '../../../src/presentation/theme';
import { CalculationRepository } from '../../../src/data/repositories/CalculationRepository';

// Engines
import { PregnancyIncrementEngine } from '../../../src/domain/calculators/PregnancyIncrementEngine';
import { LactationIncrementEngine } from '../../../src/domain/calculators/LactationIncrementEngine';

interface GatewayData {
  patient: any | null;
  vitals: any | null;
  lastPregCalculation: any | null;
  lastLactCalculation: any | null;
  loading: boolean;
}

function observeGatewayData(patientId: string): Observable<GatewayData> {
  const patient$ = watchRecord<any>('patients', patientId).pipe(
    catchError(() => of(null as any)),
  );

  const vitals$ = watchQuery<any>(db =>
    db.get('vitals_records').query(
      Q.where('patient_id', patientId),
      Q.sortBy('recorded_at', Q.desc),
      Q.take(1),
    ),
  ).pipe(
    map(rows => rows[0] ?? null),
    catchError(() => of(null)),
  );

  const lastPregCalculation$ = watchQuery<any>(db =>
    db.get('calculations').query(
      Q.where('patient_id', patientId),
      Q.where('calculation_type', 'pregnancy_increment'),
      Q.sortBy('created_at', Q.desc),
      Q.take(1),
    ),
  ).pipe(
    map(rows => rows[0] ?? null),
    catchError(() => of(null)),
  );

  const lastLactCalculation$ = watchQuery<any>(db =>
    db.get('calculations').query(
      Q.where('patient_id', patientId),
      Q.where('calculation_type', 'lactation_increment'),
      Q.sortBy('created_at', Q.desc),
      Q.take(1),
    ),
  ).pipe(
    map(rows => rows[0] ?? null),
    catchError(() => of(null)),
  );

  return combineLatest([patient$, vitals$, lastPregCalculation$, lastLactCalculation$]).pipe(
    debounceTime(50),
    map(([patient, vitals, lastPregCalculation, lastLactCalculation]) => ({
      patient,
      vitals,
      lastPregCalculation,
      lastLactCalculation,
      loading: false,
    })),
  );
}

export default function PregnancyLactationGatewayScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useAppTheme();

  const data = useObservable(observeGatewayData(patientId), {
    patient: null,
    vitals: null,
    lastPregCalculation: null,
    lastLactCalculation: null,
    loading: true,
  } as GatewayData);

  const patient = data.patient;
  const vitals = data.vitals;

  // Basic patient attributes
  const ageYears = patient?.age ?? patient?.dateOfBirth
    ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / 31536000000)
    : 28;
  const gender: 'male' | 'female' = patient?.gender === 'male' ? 'male' : 'female';
  const weightKg = vitals?.weightKg ?? vitals?.weight ?? 65;
  const heightCm = vitals?.heightCm ?? vitals?.height ?? 162;
  const bmi = vitals?.bmi ?? (weightKg / Math.pow(heightCm / 100, 2) || 24);

  const baselineCalories = patient?.baselineCalories ?? 2000;
  const baselineProtein = patient?.baselineProteinGrams ?? 60;
  const baselineFluids = patient?.baselineFluidsMl ?? 2000;
  const prePregnancyBmi = patient?.prePregnancyBmi ?? bmi ?? 22;

  // Mode Selection
  const [mode, setMode] = useState<'pregnancy' | 'lactation'>('pregnancy');

  // Pregnancy Inputs
  const [gestationalWeeksText, setGestationalWeeksText] = useState('12');

  // Lactation Inputs
  const [monthsPostpartumText, setMonthsPostpartumText] = useState('2');
  const [isExclusivelyBreastfeeding, setIsExclusivelyBreastfeeding] = useState(true);

  const [saving, setSaving] = useState(false);

  // Sync saved calculations if they exist
  const isInitializedRef = useRef(false);
  useEffect(() => {
    if ((data.lastPregCalculation || data.lastLactCalculation) && !isInitializedRef.current) {
      isInitializedRef.current = true;
      try {
        if (data.lastPregCalculation) {
          const inputs = JSON.parse(data.lastPregCalculation.inputValues || '{}');
          if (inputs.gestationalAgeWeeks) setGestationalWeeksText(String(inputs.gestationalAgeWeeks));
          setMode('pregnancy');
        }
        if (data.lastLactCalculation) {
          const inputs = JSON.parse(data.lastLactCalculation.inputValues || '{}');
          if (inputs.monthsPostpartum) setMonthsPostpartumText(String(inputs.monthsPostpartum));
          if (inputs.isExclusivelyBreastfeeding !== undefined) {
            setIsExclusivelyBreastfeeding(inputs.isExclusivelyBreastfeeding);
          }
          if (!data.lastPregCalculation) {
            setMode('lactation');
          }
        }
      } catch (e) {
        console.warn('Failed to parse previous calculation inputs', e);
      }
    }
  }, [data.lastPregCalculation, data.lastLactCalculation]);

  // Pregnancy Calculations
  const pregnancyResult = useMemo(() => {
    if (mode !== 'pregnancy') return null;
    const weeks = parseInt(gestationalWeeksText, 10) || 12;
    return PregnancyIncrementEngine.calculatePregnancyIncrements({
      baselineCalories,
      baselineProteinGrams: baselineProtein,
      gestationalAgeWeeks: weeks,
      prePregnancyBmi,
    });
  }, [mode, baselineCalories, baselineProtein, gestationalWeeksText, prePregnancyBmi]);

  // Lactation Calculations
  const lactationResult = useMemo(() => {
    if (mode !== 'lactation') return null;
    const months = parseInt(monthsPostpartumText, 10) || 2;
    return LactationIncrementEngine.calculateLactationIncrements({
      baselineCalories,
      baselineProteinGrams: baselineProtein,
      baselineFluidsMl: baselineFluids,
      monthsPostpartum: months,
      isExclusivelyBreastfeeding,
    });
  }, [mode, baselineCalories, baselineProtein, baselineFluids, monthsPostpartumText, isExclusivelyBreastfeeding]);

  const handleCommit = useCallback(async () => {
    setSaving(true);
    try {
      const calculationRepo = new CalculationRepository();
      const inputValues: any = {
        age: ageYears,
        weightKg,
        heightCm,
        gender,
        bmi,
        mode,
        baselineCalories,
        baselineProtein,
        baselineFluids,
        prePregnancyBmi,
      };

      let resultCalories = 0;
      let resultProtein = 0;
      let resultFluid = 0;
      let formulaName = '';
      let calculationType = '';

      if (mode === 'pregnancy') {
        inputValues.gestationalAgeWeeks = parseInt(gestationalWeeksText, 10) || 0;
        resultCalories = pregnancyResult?.totalCaloriesTarget ?? baselineCalories;
        resultProtein = pregnancyResult?.totalProteinGramsTarget ?? baselineProtein;
        resultFluid = baselineFluids;
        formulaName = 'Pregnancy Energy/Protein Increments';
        calculationType = 'pregnancy_increment';
      } else {
        inputValues.monthsPostpartum = parseInt(monthsPostpartumText, 10) || 0;
        inputValues.isExclusivelyBreastfeeding = isExclusivelyBreastfeeding;
        resultCalories = lactationResult?.totalCaloriesTarget ?? baselineCalories;
        resultProtein = lactationResult?.totalProteinGramsTarget ?? baselineProtein;
        resultFluid = lactationResult?.totalFluidsMlTarget ?? baselineFluids;
        formulaName = 'Lactation Energy/Protein/Fluid Increments';
        calculationType = 'lactation_increment';
      }

      await calculationRepo.upsert({
        patientId,
        calculationType,
        formulaName,
        inputValues,
        resultValue: resultCalories,
      });

      const db = await getDatabase();
      const planRows = await db.get('nutritional_plans')
        .query(Q.where('patient_id', patientId), Q.sortBy('created_at', Q.desc), Q.take(1))
        .fetch();

      if (planRows.length > 0) {
        await db.write(async () => {
          await planRows[0].update((r: any) => {
            r.final_calories = resultCalories;
            r.is_calories_overridden = true;
            r.final_protein = resultProtein;
            r.is_protein_overridden = true;
            r.clinical_notes_ar = `${formulaName}: السعرات المستهدفة ${resultCalories} سعرة | البروتين المستهدف ${resultProtein} غ | السوائل المستهدفة ${resultFluid} مل`;
            r.updated_at = new Date();
          });
        });
      }

      Alert.alert('نجاح', 'تم حفظ التعديلات الفسيولوجية للحمل والرضاعة واعتمادها بنجاح');
    } catch (err) {
      Alert.alert('خطأ', 'فشل حفظ تعديلات الحمل والرضاعة');
    } finally {
      setSaving(false);
    }
  }, [patientId, mode, ageYears, weightKg, heightCm, gender, bmi, baselineCalories, baselineProtein, baselineFluids, prePregnancyBmi, gestationalWeeksText, monthsPostpartumText, isExclusivelyBreastfeeding, pregnancyResult, lactationResult]);

  if (data.loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: theme.subtext }]}>جاري تحميل بيانات المريض...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={colors.primaryContrast} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>بوابة الحوامل والمرضعات</Text>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Patient Profile Snapshot */}
        <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.profileTitle, { color: theme.text }]}>الملخص الفسيولوجي للمريض</Text>
          <View style={styles.profileRow}>
            <View style={styles.profileItem}>
              <Text style={[styles.profileVal, { color: theme.text }]}>{baselineCalories} سعرة</Text>
              <Text style={[styles.profileLabel, { color: theme.subtext }]}>السعرات الأساسية</Text>
            </View>
            <View style={styles.profileItem}>
              <Text style={[styles.profileVal, { color: theme.text }]}>{baselineProtein} غ</Text>
              <Text style={[styles.profileLabel, { color: theme.subtext }]}>البروتين الأساسي</Text>
            </View>
            <View style={styles.profileItem}>
              <Text style={[styles.profileVal, { color: theme.text }]}>{baselineFluids} مل</Text>
              <Text style={[styles.profileLabel, { color: theme.subtext }]}>السوائل الأساسية</Text>
            </View>
            <View style={styles.profileItem}>
              <Text style={[styles.profileVal, { color: theme.text }]}>{prePregnancyBmi.toFixed(1)}</Text>
              <Text style={[styles.profileLabel, { color: theme.subtext }]}>BMI ما قبل الحمل</Text>
            </View>
          </View>
        </View>

        {/* Mode Switcher */}
        <View style={styles.tabContainer}>
          {(['pregnancy', 'lactation'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                { borderColor: theme.border, backgroundColor: theme.card },
                mode === tab && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}
              onPress={() => setMode(tab)}
            >
              <Text style={[styles.tabText, { color: theme.text }, mode === tab && { color: colors.primaryContrast }]}>
                {tab === 'pregnancy' ? 'حمل (Pregnancy)' : 'رضاعة طبيعية (Lactation)'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Input Form Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>تحديد محددات المرحلة الحياتية</Text>

          {mode === 'pregnancy' ? (
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>عمر الحمل (بالأسابيع 1-42):</Text>
              <TextInput
                style={[styles.inputField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                value={gestationalWeeksText}
                onChangeText={setGestationalWeeksText}
                keyboardType="numeric"
                placeholder="مثال: 24"
                placeholderTextColor={colors.textDisabled}
                textAlign="right"
              />
            </View>
          ) : (
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>عدد الأشهر ما بعد الولادة (0-12 شهر):</Text>
              <TextInput
                style={[styles.inputField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                value={monthsPostpartumText}
                onChangeText={setMonthsPostpartumText}
                keyboardType="numeric"
                placeholder="مثال: 4"
                placeholderTextColor={colors.textDisabled}
                textAlign="right"
              />

              <View style={[styles.toggleRow, { marginTop: spacing.sm }]}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>هل الرضاعة طبيعية حصرية؟</Text>
                <TouchableOpacity
                  style={[styles.toggleButton, isExclusivelyBreastfeeding && { backgroundColor: colors.accentRose }]}
                  onPress={() => setIsExclusivelyBreastfeeding(prev => !prev)}
                >
                  <Text style={styles.toggleButtonText}>
                    {isExclusivelyBreastfeeding ? 'نعم' : 'لا'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Live Calculation Compass Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.resultsHeader}>
            <Ionicons name="rose" size={20} color={colors.accentRose} />
            <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 0 }]}>بوصلة الزيادات الحسابية الفسيولوجية</Text>
          </View>

          {mode === 'pregnancy' && pregnancyResult && (
            <View style={styles.resultBody}>
              {pregnancyResult.isSafe ? (
                <>
                  <Text style={[styles.trimesterLabel, { color: colors.accentRose }]}>
                    مرحلة الحمل الحالية: الثلث {pregnancyResult.trimester === 1 ? 'الأول (الأسابيع 1-13)' : pregnancyResult.trimester === 2 ? 'الثاني (الأسابيع 14-26)' : 'الثالث والأخير (الأسابيع 27-42)'}
                  </Text>

                  <View style={styles.telemetryGrid}>
                    <View style={[styles.gridCell, { backgroundColor: theme.background }]}>
                      <Text style={[styles.gridLabel, { color: theme.subtext }]}>زيادة الطاقة</Text>
                      <Text style={[styles.gridValue, { color: colors.accentRose }]}>+{pregnancyResult.energyIncrement}</Text>
                      <Text style={[styles.gridUnit, { color: theme.subtext }]}>سعرة/يوم</Text>
                    </View>
                    <View style={[styles.gridCell, { backgroundColor: theme.background }]}>
                      <Text style={[styles.gridLabel, { color: theme.subtext }]}>زيادة البروتين</Text>
                      <Text style={[styles.gridValue, { color: colors.accentTeal }]}>+{pregnancyResult.proteinIncrement} غ</Text>
                      <Text style={[styles.gridUnit, { color: theme.subtext }]}>جرام/يومياً</Text>
                    </View>
                  </View>

                  <View style={[styles.detailSection, { borderTopColor: theme.border, marginTop: spacing.md }]}>
                    <Text style={[styles.detailTitle, { color: theme.text }]}>📊 الأهداف اليومية الإجمالية الموصى بها:</Text>
                    <Text style={[styles.detailText, { color: theme.subtext }]}>
                      • إجمالي السعرات المستهدفة: <Text style={{ fontWeight: 'bold', color: theme.text }}>{pregnancyResult.totalCaloriesTarget} سعرة/يوم</Text>
                    </Text>
                    <Text style={[styles.detailText, { color: theme.subtext }]}>
                      • إجمالي البروتين المستهدف: <Text style={{ fontWeight: 'bold', color: theme.text }}>{pregnancyResult.totalProteinGramsTarget} غ/يوم</Text>
                    </Text>
                    <Text style={[styles.detailText, { color: theme.subtext }]}>
                      • زيادة الوزن الإجمالية الموصى بها طوال فترة الحمل: <Text style={{ fontWeight: 'bold', color: theme.text }}>{pregnancyResult.recommendedWeightGainMinKg} - {pregnancyResult.recommendedWeightGainMaxKg} كجم</Text>
                    </Text>
                  </View>

                  {pregnancyResult.arabicClinicalAlerts.length > 0 && (
                    <View style={[styles.alertBanner, { backgroundColor: '#E11D4815', borderColor: colors.accentRose, marginTop: spacing.md }]}>
                      <Ionicons name="information-circle" size={24} color={colors.accentRose} />
                      <View style={styles.alertTextContainer}>
                        <Text style={[styles.alertTitle, { color: colors.accentRose }]}>محددات التغذية السريرية للثلث الأخير</Text>
                        <Text style={[styles.alertDesc, { color: theme.text }]}>
                          {pregnancyResult.arabicClinicalAlerts[0]}
                        </Text>
                      </View>
                    </View>
                  )}
                </>
              ) : (
                <Text style={styles.errorText}>⚠️ {pregnancyResult.arabicClinicalAlerts[0]}</Text>
              )}
            </View>
          )}

          {mode === 'lactation' && lactationResult && (
            <View style={styles.resultBody}>
              {lactationResult.isSafe ? (
                <>
                  <View style={styles.telemetryGrid}>
                    <View style={[styles.gridCell, { backgroundColor: theme.background }]}>
                      <Text style={[styles.gridLabel, { color: theme.subtext }]}>زيادة الطاقة</Text>
                      <Text style={[styles.gridValue, { color: colors.accentRose }]}>+{lactationResult.energyIncrement}</Text>
                      <Text style={[styles.gridUnit, { color: theme.subtext }]}>سعرة/يوم</Text>
                    </View>
                    <View style={[styles.gridCell, { backgroundColor: theme.background }]}>
                      <Text style={[styles.gridLabel, { color: theme.subtext }]}>زيادة البروتين</Text>
                      <Text style={[styles.gridValue, { color: colors.accentTeal }]}>+{lactationResult.proteinIncrement} غ</Text>
                      <Text style={[styles.gridUnit, { color: theme.subtext }]}>جرام/يومياً</Text>
                    </View>
                    <View style={[styles.gridCell, { backgroundColor: theme.background }]}>
                      <Text style={[styles.gridLabel, { color: theme.subtext }]}>زيادة السوائل</Text>
                      <Text style={[styles.gridValue, { color: colors.info }]}>+{lactationResult.fluidIncrement} مل</Text>
                      <Text style={[styles.gridUnit, { color: theme.subtext }]}>سوائل يومياً</Text>
                    </View>
                  </View>

                  <View style={[styles.detailSection, { borderTopColor: theme.border, marginTop: spacing.md }]}>
                    <Text style={[styles.detailTitle, { color: theme.text }]}>📊 الأهداف اليومية الإجمالية الموصى بها:</Text>
                    <Text style={[styles.detailText, { color: theme.subtext }]}>
                      • إجمالي السعرات المستهدفة: <Text style={{ fontWeight: 'bold', color: theme.text }}>{lactationResult.totalCaloriesTarget} سعرة/يوم</Text>
                    </Text>
                    <Text style={[styles.detailText, { color: theme.subtext }]}>
                      • إجمالي البروتين المستهدف: <Text style={{ fontWeight: 'bold', color: theme.text }}>{lactationResult.totalProteinGramsTarget} غ/يوم</Text>
                    </Text>
                    <Text style={[styles.detailText, { color: theme.subtext }]}>
                      • إجمالي السوائل المستهدفة: <Text style={{ fontWeight: 'bold', color: theme.text }}>{lactationResult.totalFluidsMlTarget} مل سوائل/يوم</Text>
                    </Text>
                  </View>

                  {lactationResult.arabicClinicalAlerts.length > 0 && (
                    <View style={[styles.alertBanner, { backgroundColor: '#E11D4815', borderColor: colors.accentRose, marginTop: spacing.md }]}>
                      <Ionicons name="information-circle" size={24} color={colors.accentRose} />
                      <View style={styles.alertTextContainer}>
                        <Text style={[styles.alertTitle, { color: colors.accentRose }]}>إرشادات فسيولوجية الرضاعة</Text>
                        <Text style={[styles.alertDesc, { color: theme.text }]}>
                          {lactationResult.arabicClinicalAlerts[0]}
                        </Text>
                      </View>
                    </View>
                  )}
                </>
              ) : (
                <Text style={styles.errorText}>⚠️ {lactationResult.arabicClinicalAlerts[0]}</Text>
              )}
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, saving && { opacity: 0.6 }]}
          onPress={handleCommit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primaryContrast} />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color={colors.primaryContrast} />
              <Text style={styles.submitButtonText}>حفظ واعتماد التعديلات التغذوية للمرحلة</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.regular,
  },
  header: {
    paddingTop: Platform.OS === 'web' ? 16 : 60,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.primaryContrast,
    fontFamily: fontFamilies.medium,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: spacing.md,
  },
  profileCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  profileTitle: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.bold,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  profileRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
  },
  profileItem: {
    alignItems: 'center',
  },
  profileVal: {
    fontSize: fontSizes.md,
    fontFamily: fontFamilies.bold,
  },
  profileLabel: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.regular,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row-reverse',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  tabText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.bold,
    textAlign: 'center',
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: fontSizes.md,
    fontFamily: fontFamilies.bold,
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  formGroup: {
    gap: spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleButton: {
    backgroundColor: colors.textDisabled,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  toggleButtonText: {
    color: '#FFF',
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.xs,
  },
  inputLabel: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.bold,
    textAlign: 'right',
  },
  inputField: {
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.regular,
  },
  optionRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
  },
  optionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  optionText: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.bold,
  },
  resultsHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: spacing.sm,
  },
  resultBody: {
    gap: spacing.md,
  },
  trimesterLabel: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.bold,
    textAlign: 'right',
    marginBottom: spacing.xs,
  },
  telemetryGrid: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
  },
  gridCell: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 8,
    padding: spacing.sm,
  },
  gridLabel: {
    fontSize: fontSizes.xs,
    marginBottom: 4,
    fontFamily: fontFamilies.regular,
  },
  gridValue: {
    fontSize: fontSizes.xl,
    fontFamily: fontFamilies.bold,
  },
  gridUnit: {
    fontSize: fontSizes.xs,
    marginTop: 2,
    fontFamily: fontFamilies.regular,
  },
  detailSection: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
  detailTitle: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.bold,
    textAlign: 'right',
  },
  detailText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.regular,
    textAlign: 'right',
    lineHeight: 18,
  },
  alertBanner: {
    flexDirection: 'row-reverse',
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  alertTextContainer: {
    flex: 1,
    gap: 2,
  },
  alertTitle: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.bold,
    textAlign: 'right',
  },
  alertDesc: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.regular,
    textAlign: 'right',
    lineHeight: 18,
  },
  errorText: {
    fontSize: fontSizes.sm,
    color: colors.danger,
    fontFamily: fontFamilies.medium,
    textAlign: 'right',
  },
  submitButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row-reverse',
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  submitButtonText: {
    color: colors.primaryContrast,
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.md,
  },
});
