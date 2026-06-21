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

// Engine
import { OrthopedicBoneHealingEngine } from '../../../src/domain/calculators/OrthopedicBoneHealingEngine';

interface GatewayData {
  patient: any | null;
  vitals: any | null;
  lastCalculation: any | null;
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

  const lastCalculation$ = watchQuery<any>(db =>
    db.get('calculations').query(
      Q.where('patient_id', patientId),
      Q.where('calculation_type', 'ortho_healing'),
      Q.sortBy('created_at', Q.desc),
      Q.take(1),
    ),
  ).pipe(
    map(rows => rows[0] ?? null),
    catchError(() => of(null)),
  );

  return combineLatest([patient$, vitals$, lastCalculation$]).pipe(
    debounceTime(50),
    map(([patient, vitals, lastCalculation]) => ({
      patient,
      vitals,
      lastCalculation,
      loading: false,
    })),
  );
}

export default function OrthopedicsGatewayScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useAppTheme();

  const data = useObservable(observeGatewayData(patientId), {
    patient: null,
    vitals: null,
    lastCalculation: null,
    loading: true,
  } as GatewayData);

  const patient = data.patient;
  const vitals = data.vitals;

  // Basic patient attributes
  const ageYears = patient?.age ?? patient?.dateOfBirth
    ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / 31536000000)
    : 45;
  const gender: 'male' | 'female' = patient?.gender === 'female' ? 'female' : 'male';
  const weightKg = vitals?.weightKg ?? vitals?.weight ?? 70;
  const heightCm = vitals?.heightCm ?? vitals?.height ?? 170;
  const bmi = vitals?.bmi ?? (weightKg / Math.pow(heightCm / 100, 2) || 24);

  const baselineCalories = patient?.baselineCalories ?? 2000;
  const baselineProtein = patient?.baselineProteinGrams ?? 60;

  // Screen State
  const [hasActiveFracture, setHasActiveFracture] = useState(true);
  const [egfrText, setEgfrText] = useState('90');
  const [fractureLocation, setFractureLocation] = useState('femur');
  const [isPostOp, setIsPostOp] = useState(false);
  const [tScoreCategory, setTScoreCategory] = useState<'normal' | 'osteopenia' | 'osteoporosis'>('normal');

  const [saving, setSaving] = useState(false);

  // Sync saved calculations if they exist
  const isInitializedRef = useRef(false);
  useEffect(() => {
    if (data.lastCalculation && !isInitializedRef.current) {
      isInitializedRef.current = true;
      try {
        const calc = data.lastCalculation;
        const inputs = JSON.parse(calc.inputValues || '{}');
        if (inputs.hasActiveFracture !== undefined) setHasActiveFracture(inputs.hasActiveFracture);
        if (inputs.egfrValue !== undefined) setEgfrText(String(inputs.egfrValue));
        if (inputs.fractureLocation) setFractureLocation(inputs.fractureLocation);
        if (inputs.isPostOp !== undefined) setIsPostOp(inputs.isPostOp);
        if (inputs.tScoreCategory) setTScoreCategory(inputs.tScoreCategory);
      } catch (e) {
        console.warn('Failed to parse previous calculation inputs', e);
      }
    } else if (patient && !isInitializedRef.current) {
      // Fallback default egfr
      if (patient.egfrValue) {
        setEgfrText(String(patient.egfrValue));
      }
    }
  }, [data.lastCalculation, patient]);

  // Calculations
  const orthopedicResult = useMemo(() => {
    const egfrVal = parseFloat(egfrText) || 90;
    return OrthopedicBoneHealingEngine.calculateBoneMineralTargets({
      hasActiveFracture,
      ageYears,
      egfrValue: egfrVal,
      gender,
    });
  }, [hasActiveFracture, ageYears, egfrText, gender]);

  // Extra protein calculation (+0.2 g/kg if active fracture)
  const extraProtein = useMemo(() => {
    if (!hasActiveFracture) return 0;
    return parseFloat((weightKg * 0.2).toFixed(1));
  }, [hasActiveFracture, weightKg]);

  const targetProtein = useMemo(() => {
    return baselineProtein + extraProtein;
  }, [baselineProtein, extraProtein]);

  const handleCommit = useCallback(async () => {
    setSaving(true);
    try {
      const calculationRepo = new CalculationRepository();
      const inputValues = {
        age: ageYears,
        weightKg,
        heightCm,
        gender,
        bmi,
        hasActiveFracture,
        egfrValue: parseFloat(egfrText) || 90,
        fractureLocation,
        isPostOp,
        tScoreCategory,
      };

      const resultValue = orthopedicResult?.targetCalciumMg ?? 0;
      const formulaName = 'Orthopedic Bone Healing Protocol';

      await calculationRepo.upsert({
        patientId,
        calculationType: 'ortho_healing',
        formulaName,
        inputValues,
        resultValue,
      });

      const db = await getDatabase();
      const planRows = await db.get('nutritional_plans')
        .query(Q.where('patient_id', patientId), Q.sortBy('created_at', Q.desc), Q.take(1))
        .fetch();

      if (planRows.length > 0) {
        await db.write(async () => {
          await planRows[0].update((r: any) => {
            r.final_protein = targetProtein;
            r.is_protein_overridden = true;
            r.clinical_notes_ar = `بروتوكول العظام والكسور: مستهدف الكالسيوم ${resultValue} ملغ | مستهدف البروتين المرتفع ${targetProtein} غ (زيادة +${extraProtein} غ لدعم التئام العظام)`;
            r.updated_at = new Date();
          });
        });
      }

      Alert.alert('نجاح', 'تم حفظ تقييم صحة العظام واعتماده بنجاح');
    } catch (err) {
      Alert.alert('خطأ', 'فشل حفظ تقييم جراحة العظام والكسور');
    } finally {
      setSaving(false);
    }
  }, [patientId, ageYears, weightKg, heightCm, gender, bmi, hasActiveFracture, egfrText, fractureLocation, isPostOp, tScoreCategory, orthopedicResult, targetProtein, extraProtein]);

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
        <Text style={styles.headerTitle}>بوابة العظام والتئام الكسور</Text>
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
              <Text style={[styles.profileVal, { color: theme.text }]}>{weightKg} كجم</Text>
              <Text style={[styles.profileLabel, { color: theme.subtext }]}>الوزن الحالي</Text>
            </View>
            <View style={styles.profileItem}>
              <Text style={[styles.profileVal, { color: theme.text }]}>{ageYears} سنة</Text>
              <Text style={[styles.profileLabel, { color: theme.subtext }]}>العمر</Text>
            </View>
            <View style={styles.profileItem}>
              <Text style={[styles.profileVal, { color: theme.text }]}>{gender === 'female' ? 'أنثى' : 'ذكر'}</Text>
              <Text style={[styles.profileLabel, { color: theme.subtext }]}>الجنس</Text>
            </View>
            <View style={styles.profileItem}>
              <Text style={[styles.profileVal, { color: theme.text }]}>{baselineProtein} غ</Text>
              <Text style={[styles.profileLabel, { color: theme.subtext }]}>البروتين الأساسي</Text>
            </View>
          </View>
        </View>

        {/* Input Form */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>البيانات السريرية والمعدنية</Text>

          <View style={styles.formGroup}>
            {/* Active Fracture Switch */}
            <View style={styles.toggleRow}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>هل يوجد كسر عظمي نشط؟</Text>
              <TouchableOpacity
                style={[styles.toggleButton, hasActiveFracture && { backgroundColor: colors.accentSky }]}
                onPress={() => setHasActiveFracture(prev => !prev)}
              >
                <Text style={styles.toggleButtonText}>
                  {hasActiveFracture ? 'نعم' : 'لا'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Fracture Location */}
            {hasActiveFracture && (
              <>
                <Text style={[styles.inputLabel, { color: theme.text, marginTop: spacing.xs }]}>موقع الكسر العظمي:</Text>
                <View style={styles.optionRow}>
                  {['femur', 'spine', 'wrist', 'other'].map(loc => (
                    <TouchableOpacity
                      key={loc}
                      style={[
                        styles.optionButton,
                        { backgroundColor: theme.background, borderColor: theme.border },
                        fractureLocation === loc && { backgroundColor: colors.primary, borderColor: colors.primary }
                      ]}
                      onPress={() => setFractureLocation(loc)}
                    >
                      <Text style={[styles.optionText, { color: theme.text }, fractureLocation === loc && { color: '#FFF' }]}>
                        {loc === 'femur' ? 'عظم الفخذ' :
                         loc === 'spine' ? 'العمود الفقري' :
                         loc === 'wrist' ? 'المعصم' : 'موقع آخر'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Post-Op Switch */}
            <View style={[styles.toggleRow, { marginTop: spacing.sm }]}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>هل المريض في مرحلة ما بعد الجراحة؟</Text>
              <TouchableOpacity
                style={[styles.toggleButton, isPostOp && { backgroundColor: colors.accentSky }]}
                onPress={() => setIsPostOp(prev => !prev)}
              >
                <Text style={styles.toggleButtonText}>
                  {isPostOp ? 'نعم' : 'لا'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* eGFR Value */}
            <Text style={[styles.inputLabel, { color: theme.text, marginTop: spacing.sm }]}>معدل ترشيح الكلى (eGFR ml/min/1.73m²):</Text>
            <TextInput
              style={[styles.inputField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              value={egfrText}
              onChangeText={setEgfrText}
              keyboardType="numeric"
              placeholder="مثال: 90"
              placeholderTextColor={colors.textDisabled}
              textAlign="right"
            />

            {/* Bone Density Category */}
            <Text style={[styles.inputLabel, { color: theme.text, marginTop: spacing.sm }]}>كثافة العظام المحددة (T-Score):</Text>
            <View style={styles.optionRow}>
              {(['normal', 'osteopenia', 'osteoporosis'] as const).map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.optionButton,
                    { backgroundColor: theme.background, borderColor: theme.border },
                    tScoreCategory === cat && {
                      backgroundColor: cat === 'normal' ? colors.success : cat === 'osteopenia' ? colors.warning : colors.danger,
                      borderColor: cat === 'normal' ? colors.success : cat === 'osteopenia' ? colors.warning : colors.danger,
                    }
                  ]}
                  onPress={() => setTScoreCategory(cat)}
                >
                  <Text style={[styles.optionText, { color: theme.text }, tScoreCategory === cat && { color: '#FFF' }]}>
                    {cat === 'normal' ? 'طبيعي' :
                     cat === 'osteopenia' ? 'قلة العظام' :
                     'هشاشة العظام'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Results Panel */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.resultsHeader}>
            <Ionicons name="shield-checkmark" size={20} color={colors.accentSky} />
            <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 0 }]}>المستهدفات المعدنية والبروتينية الحية</Text>
          </View>

          {orthopedicResult && (
            <View style={styles.resultBody}>
              {orthopedicResult.isSafe ? (
                <>
                  <View style={styles.telemetryGrid}>
                    <View style={[styles.gridCell, { backgroundColor: theme.background }]}>
                      <Text style={[styles.gridLabel, { color: theme.subtext }]}>مستهدف الكالسيوم</Text>
                      <Text style={[styles.gridValue, { color: colors.accentSky }]}>{orthopedicResult.targetCalciumMg}</Text>
                      <Text style={[styles.gridUnit, { color: theme.subtext }]}>ملغ/يوم</Text>
                    </View>
                    <View style={[styles.gridCell, { backgroundColor: theme.background }]}>
                      <Text style={[styles.gridLabel, { color: theme.subtext }]}>مستهدف الفسفور</Text>
                      <Text style={[styles.gridValue, { color: theme.text }]}>{orthopedicResult.targetPhosphorusMg}</Text>
                      <Text style={[styles.gridUnit, { color: theme.subtext }]}>ملغ/يوم</Text>
                    </View>
                    <View style={[styles.gridCell, { backgroundColor: theme.background }]}>
                      <Text style={[styles.gridLabel, { color: theme.subtext }]}>فيتامين D3</Text>
                      <Text style={[styles.gridValue, { color: colors.accentAmber }]}>{orthopedicResult.targetVitaminD3Iu}</Text>
                      <Text style={[styles.gridUnit, { color: theme.subtext }]}>وحدة دولية/يوم</Text>
                    </View>
                  </View>

                  {/* Protein allocations */}
                  <View style={[styles.detailSection, { borderTopColor: theme.border, marginTop: spacing.md }]}>
                    <Text style={[styles.detailTitle, { color: theme.text }]}>🥩 زيادة مخصصات البروتين لدعم الالتئام:</Text>
                    <View style={styles.proteinGrid}>
                      <View style={styles.proteinCol}>
                        <Text style={[styles.proteinVal, { color: theme.text }]}>{baselineProtein} غ</Text>
                        <Text style={[styles.proteinLabel, { color: theme.subtext }]}>البروتين الأساسي</Text>
                      </View>
                      <Text style={{ fontSize: 24, color: theme.subtext }}>+</Text>
                      <View style={styles.proteinCol}>
                        <Text style={[styles.proteinVal, { color: colors.success }]}>+{extraProtein} غ</Text>
                        <Text style={[styles.proteinLabel, { color: theme.subtext }]}>زيادة الكسر (+0.2g/kg)</Text>
                      </View>
                      <Text style={{ fontSize: 24, color: theme.subtext }}>=</Text>
                      <View style={styles.proteinCol}>
                        <Text style={[styles.proteinVal, { color: colors.primary }]}>{targetProtein} غ</Text>
                        <Text style={[styles.proteinLabel, { color: theme.subtext }]}>المستهدف الكلي الجديد</Text>
                      </View>
                    </View>
                  </View>

                  {/* Micronutrients standards */}
                  <View style={[styles.detailSection, { borderTopColor: theme.border }]}>
                    <Text style={[styles.detailTitle, { color: theme.text }]}>🧪 مكملات التئام العظام والأنسجة الرابطة:</Text>
                    <Text style={[styles.detailText, { color: theme.subtext }]}>
                      • <Text style={{ fontWeight: 'bold', color: theme.text }}>الزنك (Zinc):</Text> يوصى بـ 15-25 ملغ/يوم لدعم بناء الكولاجين بالكسر.
                    </Text>
                    <Text style={[styles.detailText, { color: theme.subtext }]}>
                      • <Text style={{ fontWeight: 'bold', color: theme.text }}>فيتامين C:</Text> يوصى بـ 500-1000 ملغ/يوم كعامل مساعد لتشبيك ألياف الكولاجين العظمية.
                    </Text>
                  </View>

                  {/* Alerts */}
                  {orthopedicResult.arabicClinicalAlerts.length > 0 && (
                    <View style={[styles.alertBanner, { backgroundColor: '#EF444415', borderColor: colors.danger }]}>
                      <Ionicons name="alert-circle" size={24} color={colors.danger} />
                      <View style={styles.alertTextContainer}>
                        <Text style={[styles.alertTitle, { color: colors.danger }]}>كابح أمان كلوى نشط</Text>
                        <Text style={[styles.alertDesc, { color: theme.text }]}>
                          {orthopedicResult.arabicClinicalAlerts[0]}
                        </Text>
                      </View>
                    </View>
                  )}
                </>
              ) : (
                <Text style={styles.errorText}>⚠️ {orthopedicResult.arabicClinicalAlerts[0]}</Text>
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
              <Text style={styles.submitButtonText}>حفظ واعتماد التعديلات العظمية والبروتينية</Text>
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
    gap: spacing.sm,
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
  proteinGrid: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  proteinCol: {
    alignItems: 'center',
  },
  proteinVal: {
    fontSize: fontSizes.md,
    fontFamily: fontFamilies.bold,
  },
  proteinLabel: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fontFamilies.regular,
    marginTop: 2,
  },
  alertBanner: {
    flexDirection: 'row-reverse',
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    gap: spacing.sm,
    alignItems: 'flex-start',
    marginTop: spacing.sm,
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
