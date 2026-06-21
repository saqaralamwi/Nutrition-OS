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

// Engines & Types
import { StrokeNutritionEngine } from '../../../src/domain/calculators/StrokeNutritionEngine';
import type {
  StrokeType,
  StrokeLocation,
  StrokeSeverity,
  DysphagiaSeverity,
  FeedingRoute,
  FoodConsistency
} from '../../../src/domain/types/stroke';

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
      Q.where('calculation_type', 'stroke_assessment'),
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

export default function StrokeGatewayScreen() {
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

  // Basic attributes
  const ageYears = patient?.age ?? patient?.dateOfBirth
    ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / 31536000000)
    : 65;
  const gender: 'male' | 'female' = patient?.gender === 'female' ? 'female' : 'male';
  const weightKg = vitals?.weightKg ?? vitals?.weight ?? 70;
  const heightCm = vitals?.heightCm ?? vitals?.height ?? 170;
  const bmi = vitals?.bmi ?? (weightKg / Math.pow(heightCm / 100, 2) || 24);

  const baselineCalories = patient?.baselineCalories ?? 1800;
  const baselineProtein = patient?.baselineProteinGrams ?? 60;
  const baselineFluids = patient?.baselineFluidsMl ?? 2000;

  // Tabs state
  const [activeTab, setActiveTab] = useState<'assessment' | 'plan' | 'interventions' | 'monitoring'>('assessment');

  // Input states
  const [strokeType, setStrokeType] = useState<StrokeType>('ischemic');
  const [strokeLocation, setStrokeLocation] = useState<StrokeLocation>('left_hemisphere');
  const [severity, setSeverity] = useState<StrokeSeverity>('moderate');
  const [hoursSinceStrokeText, setHoursSinceStrokeText] = useState('12');
  const [gcsText, setGcsText] = useState('14');
  const [nseText, setNseText] = useState('12');
  const [hasDysphagia, setHasDysphagia] = useState(true);
  const [dysphagiaSeverity, setDysphagiaSeverity] = useState<DysphagiaSeverity>('moderate');
  const [waterSwallowTest, setWaterSwallowTest] = useState<'pass' | 'fail' | 'inconclusive'>('inconclusive');
  const [coughReflex, setCoughReflex] = useState<'normal' | 'diminished' | 'absent'>('diminished');
  const [oralIntakePercentText, setOralIntakePercentText] = useState('100');

  const [clinicalNotes, setClinicalNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Sync previous state
  const isInitializedRef = useRef(false);
  useEffect(() => {
    if (data.lastCalculation && !isInitializedRef.current) {
      isInitializedRef.current = true;
      try {
        const calc = data.lastCalculation;
        const inputs = JSON.parse(calc.inputValues || '{}');
        
        if (inputs.strokeType) setStrokeType(inputs.strokeType);
        if (inputs.strokeLocation) setStrokeLocation(inputs.strokeLocation);
        if (inputs.severity) setSeverity(inputs.severity);
        if (inputs.hoursSinceStroke) setHoursSinceStrokeText(String(inputs.hoursSinceStroke));
        if (inputs.gcs) setGcsText(String(inputs.gcs));
        if (inputs.nse) setNseText(String(inputs.nse));
        if (inputs.hasDysphagia !== undefined) setHasDysphagia(inputs.hasDysphagia);
        if (inputs.dysphagiaSeverity) setDysphagiaSeverity(inputs.dysphagiaSeverity);
        if (inputs.waterSwallowTestResult) setWaterSwallowTest(inputs.waterSwallowTestResult);
        if (inputs.coughReflex) setCoughReflex(inputs.coughReflex);
        if (inputs.oralIntakePercentage !== undefined) setOralIntakePercentText(String(inputs.oralIntakePercentage));
        if (inputs.clinicalNotes) setClinicalNotes(inputs.clinicalNotes);
      } catch (e) {
        console.warn('Failed to parse previous calculation inputs', e);
      }
    }
  }, [data.lastCalculation]);

  // Run Stroke Engine
  const engineResult = useMemo(() => {
    const hours = parseInt(hoursSinceStrokeText, 10) || 12;
    const gcs = parseInt(gcsText, 10) || 15;
    const nse = parseInt(nseText, 10) || 0;
    const oralIntake = parseInt(oralIntakePercentText, 10) || 100;

    return StrokeNutritionEngine.calculate({
      age: ageYears,
      weightKg,
      heightCm,
      gender,
      strokeType,
      strokeLocation,
      severity,
      hoursSinceStroke: hours,
      gcs,
      nse,
      hasDysphagia,
      dysphagiaSeverity: hasDysphagia ? dysphagiaSeverity : 'none',
      waterSwallowTestResult: hasDysphagia ? waterSwallowTest : 'pass',
      coughReflex: hasDysphagia ? coughReflex : 'normal',
      oralIntakePercentage: oralIntake,
      baselineCalories,
      baselineProteinGrams: baselineProtein,
      baselineFluidsMl: baselineFluids,
    });
  }, [ageYears, weightKg, heightCm, gender, strokeType, strokeLocation, severity, hoursSinceStrokeText, gcsText, nseText, hasDysphagia, dysphagiaSeverity, waterSwallowTest, coughReflex, oralIntakePercentText, baselineCalories, baselineProtein, baselineFluids]);

  const handleCommit = useCallback(async () => {
    if (!engineResult.isSafe) {
      Alert.alert('خطأ', engineResult.arabicClinicalAlerts[0] || 'المدخلات غير صالحة.');
      return;
    }

    setSaving(true);
    try {
      const calculationRepo = new CalculationRepository();
      const inputValues = {
        age: ageYears,
        weightKg,
        heightCm,
        gender,
        bmi,
        strokeType,
        strokeLocation,
        severity,
        hoursSinceStroke: parseInt(hoursSinceStrokeText, 10) || 12,
        gcs: parseInt(gcsText, 10) || 15,
        nse: parseInt(nseText, 10) || 0,
        hasDysphagia,
        dysphagiaSeverity: hasDysphagia ? dysphagiaSeverity : 'none',
        waterSwallowTestResult: hasDysphagia ? waterSwallowTest : 'pass',
        coughReflex: hasDysphagia ? coughReflex : 'normal',
        oralIntakePercentage: parseInt(oralIntakePercentText, 10) || 100,
        clinicalNotes,
      };

      const resultValue = engineResult.nutritionPlan.targetCalories;
      const formulaName = 'Stroke Clinical Nutrition Protocol';

      // Save to calculations table
      await calculationRepo.upsert({
        patientId,
        calculationType: 'stroke_assessment',
        formulaName,
        inputValues,
        resultValue,
      });

      // Sync and update active nutritional plan
      const db = await getDatabase();
      const planRows = await db.get('nutritional_plans')
        .query(Q.where('patient_id', patientId), Q.sortBy('created_at', Q.desc), Q.take(1))
        .fetch();

      if (planRows.length > 0) {
        await db.write(async () => {
          await planRows[0].update((r: any) => {
            r.final_calories = engineResult.nutritionPlan.targetCalories;
            r.is_calories_overridden = true;
            r.final_protein = engineResult.nutritionPlan.targetProtein;
            r.is_protein_overridden = true;
            r.final_fluid = engineResult.nutritionPlan.targetFluid;
            r.clinical_notes_ar = `بروتوكول السكتة الدماغية: طاقة ${resultValue} سعرة | بروتين ${engineResult.nutritionPlan.targetProtein} غ | القوام الموصى به (${engineResult.assessment.foodConsistency === 'npo' ? 'NPO (صيام فموي)' : engineResult.assessment.foodConsistency === 'pureed' ? 'مهروس' : engineResult.assessment.foodConsistency === 'soft' ? 'لين' : 'طبيعي'}) | مبررات: ${clinicalNotes || 'لا يوجد'}`;
            r.updated_at = new Date();
          });
        });
      }

      Alert.alert('نجاح', 'تم حفظ خطة التغذية العصبية واعتمادها بنجاح');
    } catch (err) {
      Alert.alert('خطأ', 'فشل حفظ تقييم السكتة الدماغية.');
    } finally {
      setSaving(false);
    }
  }, [patientId, ageYears, weightKg, heightCm, gender, bmi, strokeType, strokeLocation, severity, hoursSinceStrokeText, gcsText, nseText, hasDysphagia, dysphagiaSeverity, waterSwallowTest, coughReflex, oralIntakePercentText, clinicalNotes, engineResult]);

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
        <Text style={styles.headerTitle}>بوابة رعاية السكتة الدماغية وعسر البلع</Text>
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
              <Text style={[styles.profileLabel, { color: theme.subtext }]}>الوزن</Text>
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
              <Text style={[styles.profileVal, { color: theme.text }]}>{bmi.toFixed(1)}</Text>
              <Text style={[styles.profileLabel, { color: theme.subtext }]}>BMI</Text>
            </View>
          </View>
        </View>

        {/* Workspace Tab Switcher */}
        <View style={styles.tabContainer}>
          {(['assessment', 'plan', 'interventions', 'monitoring'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                { borderColor: theme.border, backgroundColor: theme.card },
                activeTab === tab && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, { color: theme.text }, activeTab === tab && { color: colors.primaryContrast }]}>
                {tab === 'assessment' ? 'التقييم' :
                 tab === 'plan' ? 'الخطة الغذائية' :
                 tab === 'interventions' ? 'البلع الآمن' : 'المراقبة'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab 1: Assessment Form */}
        {activeTab === 'assessment' && (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>الحالة العصبية والسريرية للدماغ</Text>

            <View style={styles.formGroup}>
              {/* Stroke Type */}
              <Text style={[styles.inputLabel, { color: theme.text }]}>نوع السكتة الدماغية (Stroke Type):</Text>
              <View style={styles.optionRow}>
                {(['ischemic', 'hemorrhagic', 'subarachnoid_hemorrhage', 'unknown'] as const).map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.optionButton,
                      { backgroundColor: theme.background, borderColor: theme.border },
                      strokeType === type && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                    onPress={() => setStrokeType(type)}
                  >
                    <Text style={[styles.optionText, { color: theme.text }, strokeType === type && { color: '#FFF' }]}>
                      {type === 'ischemic' ? 'انسدادية' :
                       type === 'hemorrhagic' ? 'نزيفية' :
                       type === 'subarachnoid_hemorrhage' ? 'تحت العنكبوتية' : 'غير محدد'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Stroke Location */}
              <Text style={[styles.inputLabel, { color: theme.text, marginTop: spacing.md }]}>موقع الإصابة الدماغية (Location):</Text>
              <View style={styles.optionRow}>
                {(['left_hemisphere', 'right_hemisphere', 'brainstem', 'cerebellum'] as const).map(loc => (
                  <TouchableOpacity
                    key={loc}
                    style={[
                      styles.optionButton,
                      { backgroundColor: theme.background, borderColor: theme.border },
                      strokeLocation === loc && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                    onPress={() => setStrokeLocation(loc)}
                  >
                    <Text style={[styles.optionText, { color: theme.text }, strokeLocation === loc && { color: '#FFF' }]}>
                      {loc === 'left_hemisphere' ? 'نصف أيسر' :
                       loc === 'right_hemisphere' ? 'نصف أيمن' :
                       loc === 'brainstem' ? 'جذع الدماغ' : 'المخيخ'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Stroke Severity */}
              <Text style={[styles.inputLabel, { color: theme.text, marginTop: spacing.md }]}>درجة شدة السكتة (Stroke Severity):</Text>
              <View style={styles.optionRow}>
                {(['mild', 'moderate', 'severe', 'massive'] as const).map(sev => (
                  <TouchableOpacity
                    key={sev}
                    style={[
                      styles.optionButton,
                      { backgroundColor: theme.background, borderColor: theme.border },
                      severity === sev && {
                        backgroundColor: sev === 'mild' ? colors.success : sev === 'moderate' ? colors.warning : colors.danger,
                        borderColor: sev === 'mild' ? colors.success : sev === 'moderate' ? colors.warning : colors.danger,
                      }
                    ]}
                    onPress={() => setSeverity(sev)}
                  >
                    <Text style={[styles.optionText, { color: theme.text }, severity === sev && { color: '#FFF' }]}>
                      {sev === 'mild' ? 'خفيف' :
                       sev === 'moderate' ? 'متوسط' :
                       sev === 'severe' ? 'شديد' : 'واسع'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Telemetry Numbers */}
              <View style={[styles.gridRow, { marginTop: spacing.md }]}>
                <View style={styles.gridCol}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>عمر الإصابة (ساعات):</Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    value={hoursSinceStrokeText}
                    onChangeText={setHoursSinceStrokeText}
                    keyboardType="numeric"
                    textAlign="center"
                  />
                </View>
                <View style={styles.gridCol}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>مقياس NIHSS (0-42):</Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    value={nseText}
                    onChangeText={setNseText}
                    keyboardType="numeric"
                    textAlign="center"
                  />
                </View>
                <View style={styles.gridCol}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>مقياس وعي GCS (3-15):</Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    value={gcsText}
                    onChangeText={setGcsText}
                    keyboardType="numeric"
                    textAlign="center"
                  />
                </View>
              </View>

              {/* Dysphagia Screening workspace */}
              <View style={[styles.toggleRow, { marginTop: spacing.lg }]}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>هل يعاني من صعوبة البلع (Dysphagia)؟</Text>
                <TouchableOpacity
                  style={[styles.toggleButton, hasDysphagia && { backgroundColor: colors.accentRose }]}
                  onPress={() => setHasDysphagia(prev => !prev)}
                >
                  <Text style={styles.toggleButtonText}>
                    {hasDysphagia ? 'نعم' : 'لا'}
                  </Text>
                </TouchableOpacity>
              </View>

              {hasDysphagia && (
                <>
                  <Text style={[styles.inputLabel, { color: theme.text, marginTop: spacing.md }]}>درجة شدة عسر البلع:</Text>
                  <View style={styles.optionRow}>
                    {(['none', 'mild', 'moderate', 'severe', 'cannot_eat'] as const).map(ds => (
                      <TouchableOpacity
                        key={ds}
                        style={[
                          styles.optionButton,
                          { backgroundColor: theme.background, borderColor: theme.border },
                          dysphagiaSeverity === ds && { backgroundColor: colors.accentViolet, borderColor: colors.accentViolet }
                        ]}
                        onPress={() => setDysphagiaSeverity(ds)}
                      >
                        <Text style={[styles.optionText, { color: theme.text }, dysphagiaSeverity === ds && { color: '#FFF' }]}>
                          {ds === 'none' ? 'لا يوجد' :
                           ds === 'mild' ? 'خفيف' :
                           ds === 'moderate' ? 'متوسط' :
                           ds === 'severe' ? 'شديد' : 'لا يبتلع'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={[styles.gridRow, { marginTop: spacing.md }]}>
                    <View style={styles.gridCol}>
                      <Text style={[styles.inputLabel, { color: theme.text }]}>اختبار رشفة الماء:</Text>
                      <View style={{ flexDirection: 'row-reverse', gap: 4, marginTop: 4 }}>
                        {(['pass', 'fail', 'inconclusive'] as const).map(wst => (
                          <TouchableOpacity
                            key={wst}
                            style={[
                              styles.smallOptionBtn,
                              { backgroundColor: theme.background, borderColor: theme.border },
                              waterSwallowTest === wst && {
                                backgroundColor: wst === 'pass' ? colors.success : wst === 'fail' ? colors.danger : colors.warning,
                                borderColor: wst === 'pass' ? colors.success : wst === 'fail' ? colors.danger : colors.warning,
                              }
                            ]}
                            onPress={() => setWaterSwallowTest(wst)}
                          >
                            <Text style={[styles.smallOptionText, { color: theme.text }, waterSwallowTest === wst && { color: '#FFF' }]}>
                              {wst === 'pass' ? 'نجاح' : wst === 'fail' ? 'فشل' : 'حائر'}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={styles.gridCol}>
                      <Text style={[styles.inputLabel, { color: theme.text }]}>منعكس السعال (Cough Reflex):</Text>
                      <View style={{ flexDirection: 'row-reverse', gap: 4, marginTop: 4 }}>
                        {(['normal', 'diminished', 'absent'] as const).map(cr => (
                          <TouchableOpacity
                            key={cr}
                            style={[
                              styles.smallOptionBtn,
                              { backgroundColor: theme.background, borderColor: theme.border },
                              coughReflex === cr && {
                                backgroundColor: cr === 'normal' ? colors.success : cr === 'diminished' ? colors.warning : colors.danger,
                                borderColor: cr === 'normal' ? colors.success : cr === 'diminished' ? colors.warning : colors.danger,
                              }
                            ]}
                            onPress={() => setCoughReflex(cr)}
                          >
                            <Text style={[styles.smallOptionText, { color: theme.text }, coughReflex === cr && { color: '#FFF' }]}>
                              {cr === 'normal' ? 'طبيعي' : cr === 'diminished' ? 'ضعيف' : 'غائب'}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* Tab 2: Nutrition Plan */}
        {activeTab === 'plan' && engineResult && (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.resultsHeader}>
              <Ionicons name="nutrition" size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 0 }]}>الاحتياجات الطاقية ومسار التغذية</Text>
            </View>

            <View style={styles.telemetryGrid}>
              <View style={[styles.gridCell, { backgroundColor: theme.background }]}>
                <Text style={[styles.gridLabel, { color: theme.subtext }]}>الطاقة المستهدفة</Text>
                <Text style={[styles.gridValue, { color: theme.text }]}>{engineResult.nutritionPlan.targetCalories}</Text>
                <Text style={[styles.gridUnit, { color: theme.subtext }]}>سعرة/يوم</Text>
              </View>
              <View style={[styles.gridCell, { backgroundColor: theme.background }]}>
                <Text style={[styles.gridLabel, { color: theme.subtext }]}>البروتين المستهدف</Text>
                <Text style={[styles.gridValue, { color: colors.accentRose }]}>{engineResult.nutritionPlan.targetProtein}</Text>
                <Text style={[styles.gridUnit, { color: theme.subtext }]}>غ/يومياً</Text>
              </View>
              <View style={[styles.gridCell, { backgroundColor: theme.background }]}>
                <Text style={[styles.gridLabel, { color: theme.subtext }]}>مستهدف السوائل</Text>
                <Text style={[styles.gridValue, { color: colors.info }]}>{engineResult.nutritionPlan.targetFluid}</Text>
                <Text style={[styles.gridUnit, { color: theme.subtext }]}>مل/يوم</Text>
              </View>
            </View>

            <View style={[styles.detailSection, { borderTopColor: theme.border, marginTop: spacing.md }]}>
              <Text style={[styles.detailTitle, { color: theme.text }]}>🏥 التوصيات السريرية للأنابيب والتغذية:</Text>
              
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.subtext }]}>مسار الإطعام الموصى به:</Text>
                <Text style={[styles.infoValue, { color: theme.text, fontWeight: 'bold' }]}>
                  {engineResult.assessment.feedingRoute === 'oral' ? 'فموي بالكامل (Oral)' :
                   engineResult.assessment.feedingRoute === 'enteral_nasogastric' ? 'أنبوب أنفي معدي (NG Tube)' :
                   engineResult.assessment.feedingRoute === 'enteral_percutaneous' ? 'أنبوب المعدة المباشر PEG' :
                   engineResult.assessment.feedingRoute === 'mixed' ? 'مختلط (أنبوب + فموي)' : 'صيام طبي (NPO)'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.subtext }]}>قوام الغذاء الموصى به:</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {engineResult.assessment.foodConsistency === 'regular' ? 'طبيعي اعتيادي' :
                   engineResult.assessment.foodConsistency === 'soft' ? 'غذاء لين (Soft Diet)' :
                   engineResult.assessment.foodConsistency === 'pureed' ? 'غذاء مهروس (Pureed Diet)' : 'صيام فموي (NPO)'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.subtext }]}>مستوى خطر الشرقة (Aspiration):</Text>
                <View style={[
                  styles.riskBadge,
                  engineResult.nutritionPlan.aspirationRisk === 'high' && { backgroundColor: colors.danger },
                  engineResult.nutritionPlan.aspirationRisk === 'moderate' && { backgroundColor: colors.warning },
                  engineResult.nutritionPlan.aspirationRisk === 'low' && { backgroundColor: colors.success },
                ]}>
                  <Text style={styles.riskBadgeText}>
                    {engineResult.nutritionPlan.aspirationRisk === 'high' ? 'عالي جداً' :
                     engineResult.nutritionPlan.aspirationRisk === 'moderate' ? 'متوسط' : 'منخفض'}
                  </Text>
                </View>
              </View>

              {/* Oral Intake Percentage Slider Override */}
              <View style={{ marginTop: spacing.md }}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>نسبة التغذية الفموية المقدرة حالياً (0-100%):</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border, marginTop: 4 }]}
                  value={oralIntakePercentText}
                  onChangeText={setOralIntakePercentText}
                  keyboardType="numeric"
                  textAlign="center"
                />
              </View>
            </View>
          </View>
        )}

        {/* Tab 3: Swallowing Interventions */}
        {activeTab === 'interventions' && engineResult && (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.resultsHeader}>
              <Ionicons name="shield" size={20} color={colors.accentRose} />
              <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 0 }]}>إجراءات البلع الآمن وتعديلات القوام</Text>
            </View>

            {hasDysphagia ? (
              <View style={styles.resultBody}>
                {/* Thickening liquids details */}
                <View style={[styles.infoCard, { backgroundColor: theme.background }]}>
                  <Text style={[styles.infoCardTitle, { color: colors.accentRose }]}>🥛 تعديلات كثافة السوائل:</Text>
                  <Text style={[styles.infoCardText, { color: theme.text }]}>
                    • حالة التكثيف: <Text style={{ fontWeight: 'bold' }}>{engineResult.nutritionPlan.thickenLiquids ? 'مطلوب إجبارياً' : 'غير مطلوب'}</Text>
                  </Text>
                  <Text style={[styles.infoCardText, { color: theme.text }]}>
                    • القوام الموصى به: <Text style={{ fontWeight: 'bold' }}>
                      {engineResult.nutritionPlan.liquidThickness === 'nectar' ? 'شراب النكتار (قوام متوسط)' :
                       engineResult.nutritionPlan.liquidThickness === 'honey' ? 'شراب العسل (قوام كثيف)' :
                       engineResult.nutritionPlan.liquidThickness === 'thick' ? 'قوام البودينغ الكثيف جداً' : 'سوائل رقيقة طبيعية'}
                    </Text>
                  </Text>
                </View>

                {/* Safe postures */}
                <View style={[styles.infoCard, { backgroundColor: theme.background, marginTop: spacing.sm }]}>
                  <Text style={[styles.infoCardTitle, { color: colors.accentTeal }]}>🧘 وضعية الجسد والبلع السريري:</Text>
                  <Text style={[styles.infoCardText, { color: theme.text }]}>
                    • زاوية الجلوس: <Text style={{ fontWeight: 'bold' }}>زاوية قائمة كاملة (90 درجة Upright)</Text>
                  </Text>
                  <Text style={[styles.infoCardText, { color: theme.text }]}>
                    • ثني الذقن لأسفل (Chin Tuck): <Text style={{ fontWeight: 'bold' }}>{engineResult.intervention.chinTuck ? 'مفعل لمنع فتح المجرى التنفسي' : 'غير مطلوب'}</Text>
                  </Text>
                  <Text style={[styles.infoCardText, { color: theme.text }]}>
                    • تدوير الرأس (Head Rotation): <Text style={{ fontWeight: 'bold' }}>{engineResult.intervention.headRotation ? 'نعم، يوصى بالتدوير إلى جانب الشلل الأضعف' : 'غير مطلوب'}</Text>
                  </Text>
                </View>

                {/* Swallowing therapy & safety */}
                <View style={[styles.infoCard, { backgroundColor: theme.background, marginTop: spacing.sm }]}>
                  <Text style={[styles.infoCardTitle, { color: colors.accentViolet }]}>🧠 تنشيط منعكس البلع والأمان:</Text>
                  <Text style={[styles.infoCardText, { color: theme.text }]}>
                    • نوع العلاج التأهيلي: <Text style={{ fontWeight: 'bold' }}>
                      {engineResult.intervention.swallowTherapyType === 'rehabilitative' ? 'تمارين تأهيل عضلات البلع واللسان' :
                       engineResult.intervention.swallowTherapyType === 'compensatory' ? 'مناورات التعويض الحركي' : 'لا يوجد'}
                    </Text>
                  </Text>
                  <Text style={[styles.infoCardText, { color: theme.text }]}>
                    • عدد الجلسات: <Text style={{ fontWeight: 'bold' }}>{engineResult.intervention.therapyFrequency} جلسات أسبوعياً</Text>
                  </Text>
                  <Text style={[styles.infoCardText, { color: theme.text }]}>
                    • درجة حرارة الطعام: <Text style={{ fontWeight: 'bold', color: colors.info }}>بارد (Cold) - يحفز مستقبلات البلع الميكانيكية بالبلعوم</Text>
                  </Text>
                </View>

                {/* Avoid foods list */}
                {engineResult.nutritionPlan.avoidFoods.length > 0 && (
                  <View style={[styles.avoidList, { borderColor: theme.border }]}>
                    <Text style={[styles.avoidListTitle, { color: colors.danger }]}>🚫 أطعمة ومكونات ممنوعة قطعياً للبلع:</Text>
                    {engineResult.nutritionPlan.avoidFoods.map((f, index) => (
                      <Text key={index} style={[styles.avoidItem, { color: theme.subtext }]}>• {f}</Text>
                    ))}
                  </View>
                )}

                {/* Safety check status */}
                <View style={[styles.alertBanner, { backgroundColor: '#EF444415', borderColor: colors.danger }]}>
                  <Ionicons name="warning" size={20} color={colors.danger} />
                  <View style={styles.alertTextContainer}>
                    <Text style={[styles.alertTitle, { color: colors.danger }]}>حراسة الأمان السريرية للبلع</Text>
                    <Text style={[styles.alertDesc, { color: theme.text }]}>
                      • وحدة الشفط (Suction Unit): {engineResult.intervention.suctionAvailable ? '✅ مطلوبة بجانب السرير فوراً' : 'غير مطلوبة'}
                    </Text>
                    <Text style={[styles.alertDesc, { color: theme.text }]}>
                      • بروتوكول الطوارئ للاختناق: {engineResult.intervention.emergencyProtocol === 'fast_response' ? '🚨 مفعل لسرعة التدخل المباشر' : 'طبيعي'}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={[styles.alertBanner, { backgroundColor: '#10B98115', borderColor: colors.success }]}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                <View style={styles.alertTextContainer}>
                  <Text style={[styles.alertTitle, { color: colors.success }]}>منعكس البلع سليم</Text>
                  <Text style={[styles.alertDesc, { color: theme.text }]}>المريض يجتاز اختبار السوائل رشفة الماء بدون بوادر شرقة أو كحة. التغذية الفموية اللينة أو الطبيعية آمنة تماماً.</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Tab 4: Monitoring and Report */}
        {activeTab === 'monitoring' && engineResult && (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.resultsHeader}>
              <Ionicons name="analytics" size={20} color={colors.accentViolet} />
              <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 0 }]}>أمن المراقبة والتحذيرات السريرية</Text>
            </View>

            {/* Weight and Vitals Monitoring */}
            <View style={[styles.infoCard, { backgroundColor: theme.background }]}>
              <Text style={[styles.infoCardTitle, { color: colors.accentViolet }]}>⚖️ وتيرة مراقبة الوزن والكتلة:</Text>
              <Text style={[styles.infoCardText, { color: theme.text }]}>
                • وتيرة الوزن: <Text style={{ fontWeight: 'bold' }}>
                  {engineResult.nutritionPlan.weightCheckFrequency === 'daily' ? 'يومياً (لمتابعة الترطيب والسوائل)' : 'أسبوعياً'}
                </Text>
              </Text>
              <Text style={[styles.infoCardText, { color: theme.text }]}>
                • خطر الالتهاب الرئوي (Aspiration Pneumonia): <Text style={{ fontWeight: 'bold', color: engineResult.nutritionPlan.aspirationRisk === 'high' ? colors.danger : colors.success }}>
                  {engineResult.nutritionPlan.aspirationRisk === 'high' ? 'خطر حرج ومرتفع جداً' : 'منخفض'}
                </Text>
              </Text>
            </View>

            {/* Arabic Alerts from Engine */}
            {engineResult.arabicClinicalAlerts.length > 0 && (
              <View style={styles.alertsContainer}>
                {engineResult.arabicClinicalAlerts.map((alert, i) => (
                  <View key={i} style={[styles.alertBanner, { backgroundColor: '#EF444410', borderColor: colors.danger, marginTop: spacing.sm }]}>
                    <Ionicons name="alert-circle" size={20} color={colors.danger} />
                    <View style={styles.alertTextContainer}>
                      <Text style={[styles.alertDesc, { color: theme.text }]}>{alert}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Custom Notes overrides */}
            <View style={{ marginTop: spacing.md }}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>ملاحظات ومبررات التقييم التغذوي العصبي:</Text>
              <TextInput
                style={[styles.inputField, styles.textArea, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border, marginTop: 4 }]}
                value={clinicalNotes}
                onChangeText={setClinicalNotes}
                placeholder="اكتب ملاحظاتك وتبريرات التعديل السريرية هنا..."
                placeholderTextColor={colors.textDisabled}
                textAlign="right"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        )}

        {/* Submit Save Button */}
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
              <Text style={styles.submitButtonText}>تثبيت واعتماد خطة التغذية العصبية والبلع</Text>
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
  textArea: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  optionRow: {
    flexDirection: 'row-reverse',
    gap: spacing.xs,
  },
  optionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  optionText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.bold,
    textAlign: 'center',
  },
  gridRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
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
  smallOptionBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  smallOptionText: {
    fontSize: 10,
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
  infoRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.regular,
  },
  infoValue: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.medium,
  },
  riskBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
    borderRadius: 12,
  },
  riskBadgeText: {
    color: '#FFF',
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.bold,
  },
  resultBody: {
    gap: spacing.sm,
  },
  infoCard: {
    padding: spacing.md,
    borderRadius: 8,
    gap: 4,
  },
  infoCardTitle: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.bold,
    textAlign: 'right',
  },
  infoCardText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.regular,
    textAlign: 'right',
  },
  avoidList: {
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.sm,
    gap: 4,
  },
  avoidListTitle: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.bold,
    textAlign: 'right',
    marginBottom: 4,
  },
  avoidItem: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.regular,
    textAlign: 'right',
  },
  alertBanner: {
    flexDirection: 'row-reverse',
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    gap: spacing.sm,
    alignItems: 'flex-start',
    marginTop: spacing.md,
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
  alertsContainer: {
    gap: spacing.xs,
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
