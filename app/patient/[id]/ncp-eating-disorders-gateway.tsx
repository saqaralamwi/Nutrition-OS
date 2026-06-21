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
import { AnorexiaNutritionalRehab } from '../../../src/domain/calculators/AnorexiaNutritionalRehab';
import { BulimiaNutritionalPlan } from '../../../src/domain/calculators/BulimiaNutritionalPlan';
import { EVAvoidantRestrictiveDiet } from '../../../src/domain/calculators/EVAvoidantRestrictiveDiet';

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
      Q.where('calculation_type', 'eating_disorder'),
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

export default function EatingDisordersGatewayScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme, themeMode } = useAppTheme();

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
    : 25;
  const gender: 'male' | 'female' = patient?.gender === 'female' ? 'female' : 'male';
  const weightKg = vitals?.weightKg ?? vitals?.weight ?? 55;
  const heightCm = vitals?.heightCm ?? vitals?.height ?? 160;
  const bmi = vitals?.bmi ?? (weightKg / Math.pow(heightCm / 100, 2) || 20);

  // Tab State
  const [activeTab, setActiveTab] = useState<'anorexia' | 'bulimia' | 'arfid'>('anorexia');

  // Anorexia State
  const [targetWeightText, setTargetWeightText] = useState('50');
  const [medicalStability, setMedicalStability] = useState<'stable' | 'unstable'>('stable');
  const [riskLevel, setRiskLevel] = useState<'low' | 'moderate' | 'high'>('low');

  // Bulimia State
  const [mealFrequencyText, setMealFrequencyText] = useState('3');
  const [bingeFrequencyText, setBingeFrequencyText] = useState('3');
  const [purgingFrequencyText, setPurgingFrequencyText] = useState('2');
  const [potassiumText, setPotassiumText] = useState('4.0');
  const [phosphorusText, setPhosphorusText] = useState('3.5');
  const [magnesiumText, setMagnesiumText] = useState('2.0');

  // ARFID State
  const [restrictionLevel, setRestrictionLevel] = useState<'low' | 'moderate' | 'high'>('low');
  const [anxietyLevel, setAnxietyLevel] = useState<'low' | 'moderate' | 'high'>('low');
  const [deficiencies, setDeficiencies] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);

  // Sync saved calculations if they exist
  const isInitializedRef = useRef(false);
  useEffect(() => {
    if (data.lastCalculation && !isInitializedRef.current) {
      isInitializedRef.current = true;
      try {
        const calc = data.lastCalculation;
        const inputs = JSON.parse(calc.inputValues || '{}');
        if (inputs.activeTab) {
          setActiveTab(inputs.activeTab);
        }
        if (inputs.targetWeight) setTargetWeightText(String(inputs.targetWeight));
        if (inputs.medicalStability) setMedicalStability(inputs.medicalStability);
        if (inputs.riskLevel) setRiskLevel(inputs.riskLevel);

        if (inputs.mealFrequency) setMealFrequencyText(String(inputs.mealFrequency));
        if (inputs.bingeFrequency) setBingeFrequencyText(String(inputs.bingeFrequency));
        if (inputs.purgingFrequency) setPurgingFrequencyText(String(inputs.purgingFrequency));
        if (inputs.electrolytes) {
          setPotassiumText(String(inputs.electrolytes.potassium || ''));
          setPhosphorusText(String(inputs.electrolytes.phosphorus || ''));
          setMagnesiumText(String(inputs.electrolytes.magnesium || ''));
        }

        if (inputs.foodRestriction) setRestrictionLevel(inputs.foodRestriction);
        if (inputs.anxietyLevel) setAnxietyLevel(inputs.anxietyLevel);
        if (inputs.nutritionalDeficiency) setDeficiencies(inputs.nutritionalDeficiency);
      } catch (e) {
        console.warn('Failed to parse previous calculation inputs', e);
      }
    }
  }, [data.lastCalculation]);

  // Calculations
  const anorexiaResult = useMemo(() => {
    if (activeTab !== 'anorexia') return null;
    const targetW = parseFloat(targetWeightText) || 0;
    return AnorexiaNutritionalRehab.calculate({
      age: ageYears,
      weight: weightKg,
      targetWeight: targetW,
      bmi,
      medicalStability,
      riskLevel,
    });
  }, [activeTab, ageYears, weightKg, targetWeightText, bmi, medicalStability, riskLevel]);

  const bulimiaResult = useMemo(() => {
    if (activeTab !== 'bulimia') return null;
    const mealF = parseInt(mealFrequencyText, 10) || 0;
    const bingeF = parseInt(bingeFrequencyText, 10) || 0;
    const purgingF = parseInt(purgingFrequencyText, 10) || 0;
    const k = parseFloat(potassiumText) || 0;
    const p = parseFloat(phosphorusText) || 0;
    const mg = parseFloat(magnesiumText) || 0;

    const electrolytesInput = k > 0 && p > 0 && mg > 0 ? {
      potassium: k,
      phosphorus: p,
      magnesium: mg,
    } : null;

    return BulimiaNutritionalPlan.calculate({
      age: ageYears,
      weight: weightKg,
      height: heightCm,
      gender,
      mealFrequency: mealF,
      bingeFrequency: bingeF,
      purgingFrequency: purgingF,
      electrolytes: electrolytesInput,
    });
  }, [activeTab, ageYears, weightKg, heightCm, gender, mealFrequencyText, bingeFrequencyText, purgingFrequencyText, potassiumText, phosphorusText, magnesiumText]);

  const arfidResult = useMemo(() => {
    if (activeTab !== 'arfid') return null;
    return EVAvoidantRestrictiveDiet.calculate({
      age: ageYears,
      weight: weightKg,
      foodRestriction: restrictionLevel,
      anxietyLevel,
      nutritionalDeficiency: deficiencies,
    });
  }, [activeTab, ageYears, weightKg, restrictionLevel, anxietyLevel, deficiencies]);

  const toggleDeficiency = (item: string) => {
    setDeficiencies(prev =>
      prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]
    );
  };

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
        activeTab,
      };

      let resultValue = 0;
      let formulaName = '';

      if (activeTab === 'anorexia') {
        inputValues.targetWeight = parseFloat(targetWeightText) || 0;
        inputValues.medicalStability = medicalStability;
        inputValues.riskLevel = riskLevel;
        resultValue = anorexiaResult?.startCalories ?? 0;
        formulaName = 'Anorexia Nutritional Rehab';
      } else if (activeTab === 'bulimia') {
        inputValues.mealFrequency = parseInt(mealFrequencyText, 10) || 0;
        inputValues.bingeFrequency = parseInt(bingeFrequencyText, 10) || 0;
        inputValues.purgingFrequency = parseInt(purgingFrequencyText, 10) || 0;
        inputValues.electrolytes = {
          potassium: parseFloat(potassiumText) || 0,
          phosphorus: parseFloat(phosphorusText) || 0,
          magnesium: parseFloat(magnesiumText) || 0,
        };
        resultValue = bulimiaResult?.targetCalories ?? 0;
        formulaName = 'Bulimia Nutritional Plan';
      } else if (activeTab === 'arfid') {
        inputValues.foodRestriction = restrictionLevel;
        inputValues.anxietyLevel = anxietyLevel;
        inputValues.nutritionalDeficiency = deficiencies;
        resultValue = arfidResult?.targetCalories ?? 0;
        formulaName = 'ARFID Avoidant Restrictive Diet Plan';
      }

      await calculationRepo.upsert({
        patientId,
        calculationType: 'eating_disorder',
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
            r.final_calories = resultValue;
            r.is_calories_overridden = true;
            if (activeTab === 'arfid' && arfidResult) {
              r.final_protein = arfidResult.proteinGrams;
              r.is_protein_overridden = true;
            }
            r.clinical_notes_ar = `بروتوكول اضطرابات الأكل: ${formulaName} | السعرات المستهدفة: ${resultValue} سعرة`;
            r.updated_at = new Date();
          });
        });
      }

      Alert.alert('نجاح', 'تم حفظ التقييم واعتماده في الخطة الغذائية بنجاح');
    } catch (err) {
      Alert.alert('خطأ', 'فشل حفظ تقييم اضطراب الأكل');
    } finally {
      setSaving(false);
    }
  }, [patientId, activeTab, ageYears, weightKg, heightCm, gender, bmi, targetWeightText, medicalStability, riskLevel, mealFrequencyText, bingeFrequencyText, purgingFrequencyText, potassiumText, phosphorusText, magnesiumText, restrictionLevel, anxietyLevel, deficiencies, anorexiaResult, bulimiaResult, arfidResult]);

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
        <Text style={styles.headerTitle}>بوابة رعاية اضطرابات الأكل</Text>
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
              <Text style={[styles.profileVal, { color: theme.text }]}>{bmi.toFixed(1)}</Text>
              <Text style={[styles.profileLabel, { color: theme.subtext }]}>كتلة الجسم (BMI)</Text>
            </View>
            <View style={styles.profileItem}>
              <Text style={[styles.profileVal, { color: theme.text }]}>{ageYears} سنة</Text>
              <Text style={[styles.profileLabel, { color: theme.subtext }]}>العمر</Text>
            </View>
            <View style={styles.profileItem}>
              <Text style={[styles.profileVal, { color: theme.text }]}>{gender === 'female' ? 'أنثى' : 'ذكر'}</Text>
              <Text style={[styles.profileLabel, { color: theme.subtext }]}>الجنس</Text>
            </View>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          {(['anorexia', 'bulimia', 'arfid'] as const).map(tab => (
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
                {tab === 'anorexia' ? 'فقدان الشهية (Anorexia)' :
                 tab === 'bulimia' ? 'الشره المرضي (Bulimia)' :
                 'تجنب الغذاء (ARFID)'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Dynamic Form Area */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>إدخال محددات البروتوكول</Text>

          {activeTab === 'anorexia' && (
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>الوزن المستهدف (كجم):</Text>
              <TextInput
                style={[styles.inputField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                value={targetWeightText}
                onChangeText={setTargetWeightText}
                keyboardType="numeric"
                placeholder="مثال: 52"
                placeholderTextColor={colors.textDisabled}
                textAlign="right"
              />

              <Text style={[styles.inputLabel, { color: theme.text, marginTop: spacing.md }]}>الحالة الطبية العامة:</Text>
              <View style={styles.optionRow}>
                {(['stable', 'unstable'] as const).map(item => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.optionButton,
                      { backgroundColor: theme.background, borderColor: theme.border },
                      medicalStability === item && { backgroundColor: colors.accentTeal, borderColor: colors.accentTeal }
                    ]}
                    onPress={() => setMedicalStability(item)}
                  >
                    <Text style={[styles.optionText, { color: theme.text }, medicalStability === item && { color: '#FFF' }]}>
                      {item === 'stable' ? 'مستقر طبياً' : '🚨 غير مستقر طبياً'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: theme.text, marginTop: spacing.md }]}>مستوى خطر إعادة التغذية (Refeeding Risk):</Text>
              <View style={styles.optionRow}>
                {(['low', 'moderate', 'high'] as const).map(item => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.optionButton,
                      { backgroundColor: theme.background, borderColor: theme.border },
                      riskLevel === item && {
                        backgroundColor: item === 'low' ? colors.success : item === 'moderate' ? colors.warning : colors.danger,
                        borderColor: item === 'low' ? colors.success : item === 'moderate' ? colors.warning : colors.danger,
                      }
                    ]}
                    onPress={() => setRiskLevel(item)}
                  >
                    <Text style={[styles.optionText, { color: theme.text }, riskLevel === item && { color: '#FFF' }]}>
                      {item === 'low' ? 'منخفض' : item === 'moderate' ? 'متوسط' : 'مرتفع'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {activeTab === 'bulimia' && (
            <View style={styles.formGroup}>
              <View style={styles.gridRow}>
                <View style={styles.gridCol}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>عدد الوجبات/اليوم:</Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    value={mealFrequencyText}
                    onChangeText={setMealFrequencyText}
                    keyboardType="numeric"
                    textAlign="center"
                  />
                </View>
                <View style={styles.gridCol}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>نوبات النهم/أسبوع:</Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    value={bingeFrequencyText}
                    onChangeText={setBingeFrequencyText}
                    keyboardType="numeric"
                    textAlign="center"
                  />
                </View>
                <View style={styles.gridCol}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>نوبات التطهير/أسبوع:</Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    value={purgingFrequencyText}
                    onChangeText={setPurgingFrequencyText}
                    keyboardType="numeric"
                    textAlign="center"
                  />
                </View>
              </View>

              <Text style={[styles.inputLabel, { color: theme.text, marginTop: spacing.md }]}>شوارد الدم الأخيرة (مهمة لتقييم المخاطر):</Text>
              <View style={styles.gridRow}>
                <View style={styles.gridCol}>
                  <Text style={[styles.inputSubLabel, { color: theme.subtext }]}>البوتاسيوم (Potassium):</Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    value={potassiumText}
                    onChangeText={setPotassiumText}
                    keyboardType="numeric"
                    placeholder="3.5-5.0"
                    placeholderTextColor={colors.textDisabled}
                    textAlign="center"
                  />
                </View>
                <View style={styles.gridCol}>
                  <Text style={[styles.inputSubLabel, { color: theme.subtext }]}>الفوسفور (Phosphorus):</Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    value={phosphorusText}
                    onChangeText={setPhosphorusText}
                    keyboardType="numeric"
                    placeholder="0.8-1.5"
                    placeholderTextColor={colors.textDisabled}
                    textAlign="center"
                  />
                </View>
                <View style={styles.gridCol}>
                  <Text style={[styles.inputSubLabel, { color: theme.subtext }]}>المغنيسيوم (Magnesium):</Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    value={magnesiumText}
                    onChangeText={setMagnesiumText}
                    keyboardType="numeric"
                    placeholder="1.7-2.2"
                    placeholderTextColor={colors.textDisabled}
                    textAlign="center"
                  />
                </View>
              </View>
            </View>
          )}

          {activeTab === 'arfid' && (
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>درجة تقييد الغذاء (Restriction Severity):</Text>
              <View style={styles.optionRow}>
                {(['low', 'moderate', 'high'] as const).map(item => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.optionButton,
                      { backgroundColor: theme.background, borderColor: theme.border },
                      restrictionLevel === item && { backgroundColor: colors.accentViolet, borderColor: colors.accentViolet }
                    ]}
                    onPress={() => setRestrictionLevel(item)}
                  >
                    <Text style={[styles.optionText, { color: theme.text }, restrictionLevel === item && { color: '#FFF' }]}>
                      {item === 'low' ? 'خفيف' : item === 'moderate' ? 'متوسط' : 'شديد'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: theme.text, marginTop: spacing.md }]}>درجة القلق عند الوجبة (Mealtime Anxiety):</Text>
              <View style={styles.optionRow}>
                {(['low', 'moderate', 'high'] as const).map(item => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.optionButton,
                      { backgroundColor: theme.background, borderColor: theme.border },
                      anxietyLevel === item && { backgroundColor: colors.accentViolet, borderColor: colors.accentViolet }
                    ]}
                    onPress={() => setAnxietyLevel(item)}
                  >
                    <Text style={[styles.optionText, { color: theme.text }, anxietyLevel === item && { color: '#FFF' }]}>
                      {item === 'low' ? 'منخفض' : item === 'moderate' ? 'متوسط' : 'مرتفع'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: theme.text, marginTop: spacing.md }]}>نقص المغذيات السريري الشائع:</Text>
              <View style={styles.chipGrid}>
                {['الحديد (Iron)', 'الكالسيوم (Calcium)', 'فيتامين D', 'فيتامين B12', 'الزنك (Zinc)', 'البروتين'].map(item => {
                  const active = deficiencies.includes(item);
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.chip,
                        { backgroundColor: theme.background, borderColor: theme.border },
                        active && { backgroundColor: colors.accentSky, borderColor: colors.accentSky }
                      ]}
                      onPress={() => toggleDeficiency(item)}
                    >
                      <Text style={[styles.chipText, { color: theme.text }, active && { color: '#FFF' }]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Results Live Panel */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.resultsHeader}>
            <Ionicons name="compass" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 0 }]}>لوحة توجيه العلاج التغذوي</Text>
          </View>

          {activeTab === 'anorexia' && anorexiaResult && (
            <View style={styles.resultBody}>
              {anorexiaResult.isSafe ? (
                <>
                  <View style={styles.telemetryGrid}>
                    <View style={[styles.gridCell, { backgroundColor: theme.background }]}>
                      <Text style={[styles.gridLabel, { color: theme.subtext }]}>الحصة البدئية</Text>
                      <Text style={[styles.gridValue, { color: theme.text }]}>{anorexiaResult.startCalories}</Text>
                      <Text style={[styles.gridUnit, { color: theme.subtext }]}>سعرة/يوم</Text>
                    </View>
                    <View style={[styles.gridCell, { backgroundColor: theme.background }]}>
                      <Text style={[styles.gridLabel, { color: theme.subtext }]}>معدل الزيادة</Text>
                      <Text style={[styles.gridValue, { color: colors.accentAmber }]}>+{anorexiaResult.increasePerDay}</Text>
                      <Text style={[styles.gridUnit, { color: theme.subtext }]}>سعرة/يومياً</Text>
                    </View>
                    <View style={[styles.gridCell, { backgroundColor: theme.background }]}>
                      <Text style={[styles.gridLabel, { color: theme.subtext }]}>الزيادة الأسبوعية</Text>
                      <Text style={[styles.gridValue, { color: colors.success }]}>+{anorexiaResult.weeklyIncrease}</Text>
                      <Text style={[styles.gridUnit, { color: theme.subtext }]}>كجم/أسبوع</Text>
                    </View>
                  </View>

                  <View style={[styles.alertBanner, { backgroundColor: '#0D948815', borderColor: colors.accentTeal }]}>
                    <Ionicons name="shield-checkmark" size={20} color={colors.accentTeal} />
                    <View style={styles.alertTextContainer}>
                      <Text style={[styles.alertTitle, { color: colors.accentTeal }]}>مستوى الإشراف الموصى به</Text>
                      <Text style={[styles.alertDesc, { color: theme.text }]}>
                        {anorexiaResult.supervisionLevel === 'inpatient' ? 'الرعاية الداخلية بالمستشفى (Inpatient) - تتطلب مراقبة طبية لسلامة وظائف الأعضاء.' :
                         anorexiaResult.supervisionLevel === 'dayPatient' ? 'الرعاية النهارية (Day Patient) - رعاية مكثفة دون بيات.' :
                         'رعاية العيادات الخارجية (Outpatient).'}
                      </Text>
                    </View>
                  </View>
                </>
              ) : (
                <Text style={styles.errorText}>⚠️ {anorexiaResult.message}</Text>
              )}
            </View>
          )}

          {activeTab === 'bulimia' && bulimiaResult && (
            <View style={styles.resultBody}>
              {bulimiaResult.isSafe ? (
                <>
                  <View style={styles.telemetryGrid}>
                    <View style={[styles.gridCell, { backgroundColor: theme.background }]}>
                      <Text style={[styles.gridLabel, { color: theme.subtext }]}>السعرات المستهدفة</Text>
                      <Text style={[styles.gridValue, { color: theme.text }]}>{bulimiaResult.targetCalories}</Text>
                      <Text style={[styles.gridUnit, { color: theme.subtext }]}>سعرة/يوم</Text>
                    </View>
                    <View style={[styles.gridCell, { backgroundColor: theme.background }]}>
                      <Text style={[styles.gridLabel, { color: theme.subtext }]}>نظام الوجبات</Text>
                      <Text style={[styles.gridValue, { color: colors.accentTeal, fontSize: fontSizes.lg }]}>
                        {bulimiaResult.mealFrequency} + {bulimiaResult.snackFrequency}
                      </Text>
                      <Text style={[styles.gridUnit, { color: theme.subtext }]}>رئيسية + خفيفة</Text>
                    </View>
                    <View style={[styles.gridCell, { backgroundColor: theme.background }]}>
                      <Text style={[styles.gridLabel, { color: theme.subtext }]}>مستوى الخطر</Text>
                      <Text style={[
                        styles.gridValue,
                        {
                          color: bulimiaResult.riskTier === 'high' || bulimiaResult.riskTier === 'critical' ? colors.danger :
                                 bulimiaResult.riskTier === 'moderate' ? colors.warning : colors.success
                        }
                      ]}>
                        {bulimiaResult.riskTier === 'critical' ? 'حرج' :
                         bulimiaResult.riskTier === 'high' ? 'عالي' :
                         bulimiaResult.riskTier === 'moderate' ? 'متوسط' : 'منخفض'}
                      </Text>
                      <Text style={[styles.gridUnit, { color: theme.subtext }]}>خطر Refeeding</Text>
                    </View>
                  </View>

                  <View style={[styles.detailSection, { borderTopColor: theme.border }]}>
                    <Text style={[styles.detailTitle, { color: theme.text }]}>📋 جدول انتظام التغذية والشوارد:</Text>
                    <Text style={[styles.detailText, { color: theme.subtext }]}>• {bulimiaResult.regularitySchedule}</Text>
                    {bulimiaResult.electrolyteSchedule && (
                      <View style={{ marginTop: spacing.sm }}>
                        <Text style={[styles.detailText, { color: theme.subtext }]}>
                          • البوتاسيوم: {bulimiaResult.electrolyteSchedule.potassium.frequency} (الهدف {bulimiaResult.electrolyteSchedule.potassium.target})
                        </Text>
                        <Text style={[styles.detailText, { color: theme.subtext }]}>
                          • الفوسفور: {bulimiaResult.electrolyteSchedule.phosphorus.frequency} (الهدف {bulimiaResult.electrolyteSchedule.phosphorus.target})
                        </Text>
                      </View>
                    )}
                    {bulimiaResult.ecgMonitoring?.mandatory && (
                      <View style={[styles.alertBanner, { backgroundColor: '#EF444415', borderColor: colors.danger, marginTop: spacing.md }]}>
                        <Ionicons name="heart" size={20} color={colors.danger} />
                        <View style={styles.alertTextContainer}>
                          <Text style={[styles.alertTitle, { color: colors.danger }]}>تنبيه تخطيط القلب (ECG Required)</Text>
                          <Text style={[styles.alertDesc, { color: theme.text }]}>
                            {bulimiaResult.ecgMonitoring.reason} ({bulimiaResult.ecgMonitoring.timing})
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </>
              ) : (
                <View style={[styles.alertBanner, { backgroundColor: '#EF444415', borderColor: colors.danger }]}>
                  <Ionicons name="alert-circle" size={24} color={colors.danger} />
                  <View style={styles.alertTextContainer}>
                    <Text style={[styles.alertTitle, { color: colors.danger }]}>متطلبات الأمان السريري ناقصة</Text>
                    <Text style={[styles.alertDesc, { color: theme.text }]}>{bulimiaResult.message}</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {activeTab === 'arfid' && arfidResult && (
            <View style={styles.resultBody}>
              {arfidResult.isSafe ? (
                <>
                  <View style={styles.telemetryGrid}>
                    <View style={[styles.gridCell, { backgroundColor: theme.background }]}>
                      <Text style={[styles.gridLabel, { color: theme.subtext }]}>مستهدف الطاقة</Text>
                      <Text style={[styles.gridValue, { color: theme.text }]}>{arfidResult.targetCalories}</Text>
                      <Text style={[styles.gridUnit, { color: theme.subtext }]}>سعرة/يوم</Text>
                    </View>
                    <View style={[styles.gridCell, { backgroundColor: theme.background }]}>
                      <Text style={[styles.gridLabel, { color: theme.subtext }]}>مستهدف البروتين</Text>
                      <Text style={[styles.gridValue, { color: colors.accentTeal }]}>{arfidResult.proteinGrams}</Text>
                      <Text style={[styles.gridUnit, { color: theme.subtext }]}>جرام بروتين</Text>
                    </View>
                    <View style={[styles.gridCell, { backgroundColor: theme.background }]}>
                      <Text style={[styles.gridLabel, { color: theme.subtext }]}>الأطعمة التجريبية</Text>
                      <Text style={[styles.gridValue, { color: colors.accentViolet }]}>{arfidResult.exposureFoods}</Text>
                      <Text style={[styles.gridUnit, { color: theme.subtext }]}>أطعمة/جلسة</Text>
                    </View>
                  </View>

                  <View style={[styles.detailSection, { borderTopColor: theme.border }]}>
                    <Text style={[styles.detailTitle, { color: theme.text }]}>💡 نوع العلاج السلوكي الموصى به:</Text>
                    <Text style={[styles.detailText, { color: theme.subtext, fontSize: fontSizes.md }]}>{arfidResult.therapyType}</Text>
                    {deficiencies.length > 0 && (
                      <View style={{ marginTop: spacing.sm }}>
                        <Text style={[styles.detailTitle, { color: theme.text, marginTop: spacing.sm }]}>⚠️ نقص المغذيات المحدد:</Text>
                        <Text style={[styles.detailText, { color: theme.subtext }]}>
                          تم رصد نقص في ({deficiencies.join('، ')}). يوصى بإضافة مكملات صيدلانية متكاملة فوراً لمنع التدهور العظمي والدموي للمريض.
                        </Text>
                      </View>
                    )}
                  </View>
                </>
              ) : (
                <Text style={styles.errorText}>⚠️ {arfidResult.message}</Text>
              )}
            </View>
          )}
        </View>

        {/* Submit Section */}
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
              <Text style={styles.submitButtonText}>حفظ واعتماد التقييم في خطة المريض</Text>
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
  inputSubLabel: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.regular,
    textAlign: 'center',
    marginBottom: 4,
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
  gridRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
  },
  gridCol: {
    flex: 1,
  },
  chipGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.medium,
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
