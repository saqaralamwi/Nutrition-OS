import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Switch,
  Modal,
  Text,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { getDatabase } from '../../../src/data/database';
import { watchQuery, watchRecord } from '../../../src/data/database/observe';
import { Q } from '@nozbe/watermelondb';

// Models
import Patient from '../../../src/data/models/Patient';
import NutritionalPlan from '../../../src/data/models/NutritionalPlan';
import VitalsRecord from '../../../src/data/models/VitalsRecord';

// Engines
import { InsulinCarbRatioEngine } from '../../../src/domain/calculators/InsulinCarbRatioEngine';
import { InsulinSensitivityEngine } from '../../../src/domain/calculators/InsulinSensitivityEngine';
import { Type2DiabetesEngine } from '../../../src/domain/calculators/Type2DiabetesEngine';
import { GestationalDiabetesEngine } from '../../../src/domain/calculators/GestationalDiabetesEngine';
import { GestationalMetabolicTracker } from '../../../src/domain/monitors/GestationalMetabolicTracker';

// Presentation / Design System
import { colors, spacing, safeHeaderPaddingTop } from '../../../src/presentation/theme';
import ArabicText from '../../../src/presentation/components/ArabicText';
import TextInputField from '../../../src/presentation/components/TextInputField';
import Button from '../../../src/presentation/components/Button';
import { usePatientStore } from '../../../src/presentation/stores/patientStore';
import { useToastStore } from '../../../src/presentation/stores/toastStore';

// Helper for Mifflin St-Jeor BMR
function calculateMifflinBMR(weight: number, height: number, age: number, isMale: boolean): number {
  if (weight <= 0 || height <= 0 || age <= 0) return 1500;
  const genderOffset = isMale ? 5 : -161;
  return Math.round(10 * weight + 6.25 * height - 5 * age + genderOffset);
}

export default function NCPDiabetesGatewayScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const showToast = useToastStore((s) => s.showToast);

  // Core stream states
  const [patient, setPatient] = useState<Patient | null>(null);
  const [latestPlan, setLatestPlan] = useState<NutritionalPlan | null>(null);
  const [latestVitals, setLatestVitals] = useState<VitalsRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form states - Diabetes Profile / Glycemic values
  const [diabetesType, setDiabetesType] = useState<'type_1' | 'type_2' | 'gestational'>('type_1');
  const [fastingBG, setFastingBG] = useState('90');
  const [postPrandialBG, setPostPrandialBG] = useState('120');
  const [hba1c, setHba1c] = useState('5.8');
  const [ketonesPresent, setKetonesPresent] = useState(false);

  // Type 1 Inputs
  const [tdd, setTdd] = useState('40');
  const [insulinRegimen, setInsulinRegimen] = useState<'basal_bolus' | 'pump' | 'split_mixed'>('basal_bolus');
  const [plannedCarbs, setPlannedCarbs] = useState('60'); // Carb exchange interactive counter
  const [targetBG, setTargetBG] = useState('100');

  // Type 2 Inputs
  const [hasInsulinResistance, setHasInsulinResistance] = useState(false);
  const [activityFactor, setActivityFactor] = useState('1.2');
  const [targetWeightLossPercent, setTargetWeightLossPercent] = useState('10');

  // Gestational Inputs
  const [gestationalWeeks, setGestationalWeeks] = useState('24');
  const [prePregnancyBMI, setPrePregnancyBMI] = useState('24.5');
  const [prePregnancyWeight, setPrePregnancyWeight] = useState('65');

  // Overrides inputs
  const [calorieOverride, setCalorieOverride] = useState('');
  const [icrOverride, setIcrOverride] = useState('');
  const [carbOverride, setCarbOverride] = useState('');

  // Save justifications & signing
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [signature, setSignature] = useState('');
  const [justification, setJustification] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Pulsating animation for ketones warning
  const pulseAnim = useRef(new Animated.Value(0.7)).current;

  // 1. Reactive stream aggregation via combineLatest
  useEffect(() => {
    setIsLoading(true);

    const patient$ = watchRecord<Patient>('patients', patientId);
    
    const latestPlan$ = watchQuery<NutritionalPlan>((db) => {
      return db.get('nutritional_plans').query(
        Q.where('patient_id', patientId),
        Q.sortBy('created_at', 'desc')
      );
    }).pipe(
      map(plans => plans.length > 0 ? plans[0] : null)
    );

    const vitals$ = watchQuery<VitalsRecord>((db) => {
      return db.get('vitals_records').query(
        Q.where('patient_id', patientId),
        Q.sortBy('created_at', 'desc')
      );
    }).pipe(
      map(records => records.length > 0 ? records[0] : null)
    );

    const stream = combineLatest([patient$, latestPlan$, vitals$]).subscribe({
      next: ([p, plan, vitals]) => {
        setPatient(p);
        setLatestPlan(plan);
        setLatestVitals(vitals);

        if (plan) {
          const profile = plan.diabetesProfile;
          if (profile) {
            setDiabetesType(profile.diabetesType as any);
            setFastingBG(String(profile.fastingBloodGlucose ?? ''));
            setPostPrandialBG(String(profile.postPrandialBloodGlucose ?? ''));
            setHba1c(String(profile.hba1c ?? ''));
            
            if (profile.diabetesType === 'type_1') {
              const t1 = profile as any;
              setTdd(String(t1.totalDailyInsulinDose ?? ''));
              setInsulinRegimen(t1.currentInsulinRegimen ?? 'basal_bolus');
            } else if (profile.diabetesType === 'type_2') {
              const t2 = profile as any;
              setHasInsulinResistance(!!t2.hasInsulinResistance);
            } else if (profile.diabetesType === 'gestational') {
              const gest = profile as any;
              setGestationalWeeks(String(gest.gestationalWeeks ?? ''));
              setPrePregnancyBMI(String(gest.prePregnancyBMI ?? ''));
              setPrePregnancyWeight(String(gest.prePregnancyWeightKg ?? ''));
              setKetonesPresent(!!gest.morningUrineKetonesPresent);
            }

            // Load overrides
            try {
              const metadata = JSON.parse(plan.specializedMetadata || '{}');
              if (metadata.overrides) {
                setCalorieOverride(String(metadata.overrides.calorieLimitOverride ?? ''));
                setIcrOverride(String(metadata.overrides.icrOverride ?? ''));
                setCarbOverride(String(metadata.overrides.carbLimitOverride ?? ''));
              }
            } catch {}
          }
        }
        setIsLoading(false);
      },
      error: (err) => {
        console.error('NCP Diabetes Gateway stream error:', err);
        showToast('فشل تحميل البيانات التفاعلية', 'error');
        setIsLoading(false);
      }
    });

    return () => stream.unsubscribe();
  }, [patientId]);

  // Pulsating ketones warning animation
  useEffect(() => {
    if (ketonesPresent && diabetesType === 'gestational') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.6,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [ketonesPresent, diabetesType]);

  // Fallback metrics computed from patient age/gender + latest vitals weight/height
  const weight = latestVitals?.weightKg ?? latestVitals?.weight ?? 70;
  const height = latestVitals?.heightCm ?? latestVitals?.height ?? 165;
  const age = patient?.age ?? 40;
  const isMale = patient?.gender === 'male';

  const computedBmr = useMemo(() => {
    return calculateMifflinBMR(weight, height, age, isMale);
  }, [weight, height, age, isMale]);

  // 1.3 DISPATCHING PIPELINE & VARIABLE PRE-CALCULATION
  const type1Outputs = useMemo(() => {
    if (diabetesType !== 'type_1') return null;
    const tddVal = parseFloat(tdd) || 0;
    const icrRes = InsulinCarbRatioEngine.calculateICR(tddVal);
    
    const currentBGNum = parseFloat(postPrandialBG) || 0;
    const targetBGNum = parseFloat(targetBG) || 100;
    const isfRes = InsulinSensitivityEngine.calculateCorrection({
      totalDailyDose: tddVal,
      currentBloodGlucose: currentBGNum,
      targetBloodGlucose: targetBGNum,
    });

    return {
      icr: icrRes,
      isf: isfRes,
    };
  }, [diabetesType, tdd, postPrandialBG, targetBG]);

  const type2Outputs = useMemo(() => {
    if (diabetesType !== 'type_2') return null;
    const activity = parseFloat(activityFactor) || 1.2;
    const lossPct = parseFloat(targetWeightLossPercent) || 10;
    
    return Type2DiabetesEngine.calculateType2Requirements({
      baselineREE: computedBmr,
      activityFactor: activity,
      gender: isMale ? 'male' : 'female',
      weightKg: weight,
      targetWeightLossPercent: lossPct,
      hasInsulinResistance,
    });
  }, [diabetesType, computedBmr, activityFactor, weight, isMale, targetWeightLossPercent, hasInsulinResistance]);

  const gestationalOutputs = useMemo(() => {
    if (diabetesType !== 'gestational') return null;
    const preBMIVal = parseFloat(prePregnancyBMI) || 24.5;
    const preWtVal = parseFloat(prePregnancyWeight) || 65;
    const weeksVal = parseFloat(gestationalWeeks) || 24;
    const bmrVal = calculateMifflinBMR(preWtVal, height, age, false); // always female

    const gdmRes = GestationalDiabetesEngine.calculateGDMDynamics({
      prePregnancyBMI: preBMIVal,
      currentWeightKg: weight,
      prePregnancyWeightKg: preWtVal,
      gestationalWeeks: weeksVal,
      baseCaloriesREE: bmrVal,
      activityFactor: 1.2,
    });

    const trackerRes = GestationalMetabolicTracker.evaluatePregnancyMetabolism({
      fastingBloodGlucose: parseFloat(fastingBG) || 90,
      twoHourPostPrandial: parseFloat(postPrandialBG) || 120,
      hba1c: parseFloat(hba1c) || 5.8,
      morningUrineKetonesPresent: ketonesPresent,
    });

    return {
      dynamics: gdmRes,
      metabolism: trackerRes,
    };
  }, [diabetesType, prePregnancyBMI, prePregnancyWeight, gestationalWeeks, weight, height, age, fastingBG, postPrandialBG, hba1c, ketonesPresent]);

  // Real-time bolus and correction estimation for Carb exchange counter (Type 1)
  const realTimeInsulinEstimations = useMemo(() => {
    if (!type1Outputs) return { bolus: 0, correction: 0, total: 0 };
    const plannedCarbsNum = parseFloat(plannedCarbs) || 0;
    
    // ICR factor (unit per grams)
    const icrVal = parseFloat(icrOverride) || type1Outputs.icr.icrValue || 15;
    const estimatedBolus = icrVal > 0 ? plannedCarbsNum / icrVal : 0;
    
    // Correction dose
    const correction = type1Outputs.isf.correctionDose || 0;
    const total = estimatedBolus + correction;

    return {
      bolus: Math.round(estimatedBolus * 10) / 10,
      correction: Math.round(correction * 10) / 10,
      total: Math.round(total * 10) / 10,
    };
  }, [type1Outputs, plannedCarbs, icrOverride]);

  // 3.2 WATERMELONDB TRANSACTION-WRITTEN AUDITING HANDLER
  const persistClinicianAdjustments = async () => {
    if (!signature.trim() || !justification.trim()) {
      showToast('الرجاء كتابة التبرير السريري والتوقيع لحفظ التعديلات', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const db = await getDatabase();

      await db.write(async () => {
        const plansCollection = db.get<NutritionalPlan>('nutritional_plans');

        // Compile specialized metadata structure
        const specializedPayload = {
          diabetesType,
          fastingBloodGlucose: parseFloat(fastingBG) || 0,
          postPrandialBloodGlucose: parseFloat(postPrandialBG) || 0,
          hba1c: parseFloat(hba1c) || 0,
          morningUrineKetonesPresent: ketonesPresent && diabetesType === 'gestational',
          lastUpdatedTimestamp: Date.now(),
          clinicianSignature: signature.trim(),
          justificationText: justification.trim(),
          
          // Type 1 specific fields
          ...(diabetesType === 'type_1' && {
            totalDailyInsulinDose: parseFloat(tdd) || 0,
            currentInsulinRegimen: insulinRegimen,
            targetBloodGlucose: parseFloat(targetBG) || 100,
          }),

          // Type 2 specific fields
          ...(diabetesType === 'type_2' && {
            hasInsulinResistance,
            activityFactor: parseFloat(activityFactor) || 1.2,
            targetWeightLossPercent: parseFloat(targetWeightLossPercent) || 10,
          }),

          // Gestational specific fields
          ...(diabetesType === 'gestational' && {
            gestationalWeeks: parseFloat(gestationalWeeks) || 0,
            prePregnancyBMI: parseFloat(prePregnancyBMI) || 0,
            prePregnancyWeightKg: parseFloat(prePregnancyWeight) || 0,
          }),

          // Audited Override values
          overrides: {
            calorieLimitOverride: calorieOverride.trim() ? parseFloat(calorieOverride) : null,
            icrOverride: icrOverride.trim() ? parseFloat(icrOverride) : null,
            carbLimitOverride: carbOverride.trim() ? parseFloat(carbOverride) : null,
          },
        };

        const metadataStr = JSON.stringify(specializedPayload);

        // Derive active target values considering overrides
        let targetCals = computedBmr * 1.2;
        if (diabetesType === 'type_2' && type2Outputs) {
          targetCals = type2Outputs.targetCalories;
        } else if (diabetesType === 'gestational' && gestationalOutputs) {
          targetCals = gestationalOutputs.dynamics.totalRecommendedCalories;
        }
        if (calorieOverride.trim()) {
          targetCals = parseFloat(calorieOverride);
        }

        let targetCarbs = targetCals * 0.5 / 4; // default 50%
        if (diabetesType === 'type_2' && type2Outputs) {
          targetCarbs = type2Outputs.carbGrams;
        } else if (diabetesType === 'gestational' && gestationalOutputs) {
          targetCarbs = gestationalOutputs.dynamics.targetCarbGrams;
        }
        if (carbOverride.trim()) {
          targetCarbs = parseFloat(carbOverride);
        }

        const targetPro = weight * 1.2;
        const targetFat = (targetCals - (targetCarbs * 4) - (targetPro * 4)) / 9;

        if (latestPlan) {
          // Update the existing latest nutritional plan
          await latestPlan.update((record) => {
            record.specializedMetadata = metadataStr;
            record.targetCalories = Math.round(targetCals);
            record.carbsTarget = Math.round(targetCarbs);
            record.proteinTarget = Math.round(targetPro);
            record.fatTarget = Math.round(targetFat);
          });
        } else {
          // Create a new nutritional plan record
          await plansCollection.create((record) => {
            record.patientId = patientId;
            record.targetCalories = Math.round(targetCals);
            record.carbsTarget = Math.round(targetCarbs);
            record.proteinTarget = Math.round(targetPro);
            record.fatTarget = Math.round(targetFat);
            record.fluidTarget = Math.round(weight * 30);
            record.mealsJson = '[]';
            record.recommendationsJson = '[]';
            record.specializedMetadata = metadataStr;
            record.status = 'active';
          });
        }
      });

      showToast('تم حفظ التعديلات وتوقيع التبرير السريري بنجاح', 'success');
      setIsSaveModalOpen(false);
      setJustification('');
    } catch (e) {
      console.error('Failed to save adjustments:', e);
      showToast('خطأ في كتابة التعديلات بقاعدة البيانات', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.flex}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-forward" size={24} color={colors.primaryContrast} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <ArabicText bold style={styles.headerTitle}>بوابة التغذية السريرية لمرضى السكري (NCP)</ArabicText>
            <ArabicText style={styles.headerSubtitle}>
              المريض: {patient?.fullName} | وزن: {weight}كغم | طول: {height}سم | عمر: {age}
            </ArabicText>
          </View>
        </View>

        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          
          {/* Glycemic and Profile Inputs Card */}
          <View style={styles.card}>
            <ArabicText bold style={styles.cardTitle}>الملف الأيضي وحالة السكري</ArabicText>
            
            {/* Segmented Tab Selector for Diabetes Type */}
            <ArabicText style={styles.label}>تصنيف السكري:</ArabicText>
            <View style={styles.tabRow}>
              {(['type_1', 'type_2', 'gestational'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.tabButton,
                    diabetesType === type && styles.tabButtonActive,
                  ]}
                  onPress={() => setDiabetesType(type)}
                >
                  <ArabicText
                    bold={diabetesType === type}
                    style={[
                      styles.tabText,
                      diabetesType === type && styles.tabTextActive,
                    ]}
                  >
                    {type === 'type_1' ? 'النوع الأول' : type === 'type_2' ? 'النوع الثاني' : 'الحملي'}
                  </ArabicText>
                </TouchableOpacity>
              ))}
            </View>

            {/* Core Glycemic inputs grid */}
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <TextInputField
                  label="سكر الصائم (ملغم/دل)"
                  value={fastingBG}
                  onChangeText={setFastingBG}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.gridItem}>
                <TextInputField
                  label="سكر فاطر / عشوائي"
                  value={postPrandialBG}
                  onChangeText={setPostPrandialBG}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.gridItem}>
                <TextInputField
                  label="معدل التراكمي HbA1c (%)"
                  value={hba1c}
                  onChangeText={setHba1c}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Additional Conditional Profile Inputs */}
            {diabetesType === 'type_1' && (
              <View style={styles.subGrid}>
                <View style={styles.gridItem}>
                  <TextInputField
                    label="إجمالي الجرعة اليومية (TDD)"
                    value={tdd}
                    onChangeText={setTdd}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.gridItem}>
                  <TextInputField
                    label="مستوى السكر المستهدف"
                    value={targetBG}
                    onChangeText={setTargetBG}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            )}

            {diabetesType === 'type_2' && (
              <View style={styles.switchRow}>
                <ArabicText style={styles.switchLabel}>مقاومة الإنسولين الموثقة سريراً (Insulin Resistance)</ArabicText>
                <Switch
                  value={hasInsulinResistance}
                  onValueChange={setHasInsulinResistance}
                  trackColor={{ false: '#334155', true: colors.primary }}
                  thumbColor={hasInsulinResistance ? '#ffffff' : '#94a3b8'}
                />
              </View>
            )}

            {diabetesType === 'gestational' && (
              <View>
                <View style={styles.subGrid}>
                  <View style={styles.gridItem}>
                    <TextInputField
                      label="أسابيع الحمل"
                      value={gestationalWeeks}
                      onChangeText={setGestationalWeeks}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.gridItem}>
                    <TextInputField
                      label="الوزن قبل الحمل (كغم)"
                      value={prePregnancyWeight}
                      onChangeText={setPrePregnancyWeight}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.gridItem}>
                    <TextInputField
                      label="مؤشر كتلة الجسم قبل الحمل"
                      value={prePregnancyBMI}
                      onChangeText={setPrePregnancyBMI}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <View style={styles.switchRow}>
                  <ArabicText style={styles.switchLabel}>وجود أجسام كيتونية في البول الصباحي (Urine Ketones)</ArabicText>
                  <Switch
                    value={ketonesPresent}
                    onValueChange={setKetonesPresent}
                    trackColor={{ false: '#334155', true: colors.danger }}
                    thumbColor={ketonesPresent ? '#ffffff' : '#94a3b8'}
                  />
                </View>
              </View>
            )}
          </View>

          {/* 2. CONDITIONAL METABOLIC UI RENDERING MATRIX */}

          {/* PANEL A: TYPE 1 INSULIN STRATEGY CARD */}
          {diabetesType === 'type_1' && type1Outputs && (
            <View style={styles.card}>
              <View style={styles.badgeRow}>
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <ArabicText bold style={styles.badgeText}>نشط</ArabicText>
                </View>
                <ArabicText bold style={styles.cardTitle}>لوحة حسابات الإنسولين والجرعات (Type 1)</ArabicText>
              </View>

              <View style={styles.doubleMetricContainer}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricVal}>{type1Outputs.icr.icrValue || '—'}</Text>
                  <ArabicText style={styles.metricLabel}>معامل الكربوهيدرات (ICR)</ArabicText>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricVal}>{type1Outputs.isf.isfValue || '—'}</Text>
                  <ArabicText style={styles.metricLabel}>معامل حساسية الإنسولين (ISF)</ArabicText>
                </View>
              </View>

              <ArabicText style={styles.helperText}>{type1Outputs.icr.clinicalNote}</ArabicText>

              {/* Carbohydrate Exchange Counter */}
              <View style={styles.calcGrid}>
                <ArabicText bold style={styles.subSectionTitle}>عداد بدائل الكربوهيدرات التفاعلي</ArabicText>
                <View style={styles.stepperContainer}>
                  <TextInputField
                    label="كمية الكربوهيدرات المخططة للوجبة (غرام)"
                    value={plannedCarbs}
                    onChangeText={setPlannedCarbs}
                    keyboardType="numeric"
                  />
                  <View style={styles.stepperActions}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => setPlannedCarbs(prev => String(Math.max(0, (parseInt(prev) || 0) - 10)))}
                    >
                      <ArabicText bold style={styles.stepBtnText}>- 10غ</ArabicText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => setPlannedCarbs(prev => String((parseInt(prev) || 0) + 10))}
                    >
                      <ArabicText bold style={styles.stepBtnText}>+ 10غ</ArabicText>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Real-time estimations */}
                <View style={styles.outputEstimationContainer}>
                  <View style={styles.estimationItem}>
                    <Text style={styles.estVal}>{realTimeInsulinEstimations.bolus} و</Text>
                    <ArabicText style={styles.estLabel}>جرعة الوجبة (Bolus)</ArabicText>
                  </View>
                  <View style={styles.estimationItem}>
                    <Text style={styles.estVal}>{realTimeInsulinEstimations.correction} و</Text>
                    <ArabicText style={styles.estLabel}>جرعة التصحيح (Correction)</ArabicText>
                  </View>
                  <View style={[styles.estimationItem, styles.estimationItemHighlight]}>
                    <Text style={[styles.estVal, styles.estValHighlight]}>{realTimeInsulinEstimations.total} و</Text>
                    <ArabicText bold style={styles.estLabelHighlight}>إجمالي الإنسولين السريع المطلوب</ArabicText>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* PANEL B: TYPE 2 METABOLIC DEFICIT CARD */}
          {diabetesType === 'type_2' && type2Outputs && (
            <View style={styles.card}>
              <View style={styles.badgeRow}>
                {type2Outputs.isFloorGuardTriggered ? (
                  <View style={[styles.badge, { backgroundColor: colors.warning }]}>
                    <ArabicText bold style={styles.badgeText}>حارس الحد الأدنى مفعل</ArabicText>
                  </View>
                ) : (
                  <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                    <ArabicText bold style={styles.badgeText}>مستقر</ArabicText>
                  </View>
                )}
                <ArabicText bold style={styles.cardTitle}>حسابات العجز الأيضي (Type 2)</ArabicText>
              </View>

              <View style={styles.doubleMetricContainer}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricVal}>{type2Outputs.totalEnergyExpenditure}</Text>
                  <ArabicText style={styles.metricLabel}>إجمالي حرق الطاقة اليومي (TEE)</ArabicText>
                </View>
                <View style={[styles.metricCard, type2Outputs.isFloorGuardTriggered && styles.metricCardWarning]}>
                  <Text style={styles.metricVal}>{type2Outputs.targetCalories}</Text>
                  <ArabicText style={styles.metricLabel}>السعرات المستهدفة</ArabicText>
                </View>
              </View>

              {/* Macronutrient Split Layout Bar Chart */}
              <ArabicText bold style={styles.subSectionTitle}>توزيع المغذيات الكبرى المستهدف ({hasInsulinResistance ? '45%' : '50%'} كربوهيدرات):</ArabicText>
              <View style={styles.macroProgressContainer}>
                <View style={[styles.macroBar, { flex: hasInsulinResistance ? 45 : 50, backgroundColor: '#14b8a6' }]}>
                  <ArabicText bold style={styles.macroBarText}>كربوهيدرات</ArabicText>
                  <Text style={styles.macroBarGram}>{type2Outputs.carbGrams}غ</Text>
                </View>
                <View style={[styles.macroBar, { flex: 20, backgroundColor: '#3b82f6' }]}>
                  <ArabicText bold style={styles.macroBarText}>بروتين</ArabicText>
                  <Text style={styles.macroBarGram}>{type2Outputs.proteinGrams}غ</Text>
                </View>
                <View style={[styles.macroBar, { flex: hasInsulinResistance ? 35 : 30, backgroundColor: '#eab308' }]}>
                  <ArabicText bold style={styles.macroBarText}>دهون</ArabicText>
                  <Text style={styles.macroBarGram}>{type2Outputs.fatGrams}غ</Text>
                </View>
              </View>

              {/* Recommendations list */}
              <View style={styles.alertList}>
                {type2Outputs.clinicalRecommendations.map((rec, i) => (
                  <ArabicText key={i} style={styles.alertListItem}>• {rec}</ArabicText>
                ))}
              </View>
            </View>
          )}

          {/* PANEL C: GESTATIONAL PROTECTION & KETONE HAZARD PANEL */}
          {diabetesType === 'gestational' && gestationalOutputs && (
            <View style={styles.card}>
              <ArabicText bold style={styles.cardTitle}>متابعة الحمل والتمثيل الغذائي (Gestational)</ArabicText>

              {/* Flashing Crimson Ketones Warning Alert Box */}
              {ketonesPresent && (
                <Animated.View style={[styles.ketoneAlertContainer, { opacity: pulseAnim }]}>
                  <ArabicText bold style={styles.ketoneAlertText}>
                    🚨 تحذير حرج: وجود أجسام كيتونية في البول الصباحي يشير إلى كيتوزية المجاعة نتيجة التقييد المفرط للكربوهيدرات! يجب رفع حصص الكربوهيدرات المعقدة فوراً لحماية الجهاز العصبي للجنين.
                  </ArabicText>
                </Animated.View>
              )}

              {/* Projections & Limits */}
              <View style={styles.doubleMetricContainer}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricVal}>
                    {gestationalOutputs.dynamics.targetWeightGainMinKg} - {gestationalOutputs.dynamics.targetWeightGainMaxKg} كغم
                  </Text>
                  <ArabicText style={styles.metricLabel}>زيادة الوزن المستهدفة (IOM)</ArabicText>
                </View>
                <View style={styles.metricCard}>
                  <Text style={[
                    styles.metricVal,
                    gestationalOutputs.dynamics.actualWeightGainSoFarKg < 0 ? { color: colors.danger } : {}
                  ]}>
                    {gestationalOutputs.dynamics.actualWeightGainSoFarKg} كغم
                  </Text>
                  <ArabicText style={styles.metricLabel}>زيادة الوزن الفعلية حالياً</ArabicText>
                </View>
              </View>

              <View style={styles.pregnancyStatusContainer}>
                <ArabicText bold style={styles.subSectionTitle}>مستهدفات الطاقة والكربوهيدرات في الحمل:</ArabicText>
                <View style={styles.targetRow}>
                  <ArabicText style={styles.targetText}>السعرات الموصى بها:</ArabicText>
                  <Text style={styles.targetNum}>{gestationalOutputs.dynamics.totalRecommendedCalories} سعرة</Text>
                </View>
                <View style={styles.targetRow}>
                  <ArabicText style={styles.targetText}>مستهدف الكربوهيدرات اليومي:</ArabicText>
                  <Text style={styles.targetNum}>{gestationalOutputs.dynamics.targetCarbGrams} غرام</Text>
                </View>
                <View style={styles.targetRow}>
                  <ArabicText style={styles.targetText}>الحد الأدنى الآمن للكربوهيدرات:</ArabicText>
                  <Text style={[styles.targetNum, { color: colors.danger }]}>{gestationalOutputs.dynamics.minimumSafeCarbGrams} غرام</Text>
                </View>
              </View>

              {/* Alerts list */}
              <View style={styles.alertList}>
                {gestationalOutputs.metabolism.clinicalAlerts.map((rec, i) => (
                  <ArabicText key={i} style={[
                    styles.alertListItem, 
                    rec.includes('حرج') ? { color: colors.danger } : {}
                  ]}>• {rec}</ArabicText>
                ))}
              </View>
            </View>
          )}

          {/* 3. TRANSACTION WRAPPED OVERRIDE LAYER */}
          <View style={styles.card}>
            <ArabicText bold style={styles.cardTitle}>تعديل وتجاوز المعايير الغذائية (السريرية)</ArabicText>
            
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <TextInputField
                  label="تجاوز السعرات اليومية"
                  value={calorieOverride}
                  onChangeText={setCalorieOverride}
                  keyboardType="numeric"
                  placeholder="تلقائي"
                />
              </View>
              {diabetesType === 'type_1' && (
                <View style={styles.gridItem}>
                  <TextInputField
                    label="تجاوز ICR"
                    value={icrOverride}
                    onChangeText={setIcrOverride}
                    keyboardType="numeric"
                    placeholder="تلقائي"
                  />
                </View>
              )}
              <View style={styles.gridItem}>
                <TextInputField
                  label="تجاوز الكربوهيدرات (غ)"
                  value={carbOverride}
                  onChangeText={setCarbOverride}
                  keyboardType="numeric"
                  placeholder="تلقائي"
                />
              </View>
            </View>

            <Button
              title="حفظ التعديلات والتوقيع سريرياً"
              onPress={() => setIsSaveModalOpen(true)}
              variant="primary"
            />
          </View>

        </ScrollView>

        {/* Auditing Save Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isSaveModalOpen}
          onRequestClose={() => setIsSaveModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ArabicText bold style={styles.modalTitle}>إقرار التعديل والتجاوز السريري</ArabicText>
              <ArabicText style={styles.modalDescription}>
                يتطلب تغيير معايير السكري الغذائية وحفظها تبريراً سريرياً وتوقيع الأخصائي في سجل التدقيق الأمني.
              </ArabicText>

              <TextInputField
                label="التبرير السريري للتجاوز (السبب الطبي)"
                value={justification}
                onChangeText={setJustification}
                placeholder="أدخل مبرر التغيير السريري..."
                multiline
              />

              <TextInputField
                label="اسم الأخصائي المعالج (التوقيع الإلكتروني)"
                value={signature}
                onChangeText={setSignature}
                placeholder="اسم الأخصائي..."
              />

              <View style={styles.modalActions}>
                <Button
                  title="إلغاء"
                  onPress={() => {
                    setIsSaveModalOpen(false);
                    setJustification('');
                  }}
                  variant="ghost"
                  style={{ flex: 1 }}
                />
                <Button
                  title="توقيع وحفظ السجل"
                  onPress={persistClinicianAdjustments}
                  variant="primary"
                  loading={isSaving}
                  style={{ flex: 2 }}
                />
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: safeHeaderPaddingTop + spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  backBtn: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: 3,
    marginBottom: spacing.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primaryContrast,
  },
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  gridItem: {
    flex: 1,
    minWidth: '45%',
    paddingHorizontal: spacing.xs,
  },
  subGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: spacing.md,
  },
  switchRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  switchLabel: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    color: colors.primaryContrast,
  },
  doubleMetricContainer: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricCardWarning: {
    borderColor: colors.warning,
  },
  metricVal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: 'right',
  },
  calcGrid: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subSectionTitle: {
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  stepperContainer: {
    marginBottom: spacing.md,
  },
  stepperActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },
  stepBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  stepBtnText: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  outputEstimationContainer: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
  },
  estimationItem: {
    flex: 1,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 6,
    alignItems: 'center',
  },
  estimationItemHighlight: {
    backgroundColor: 'rgba(27, 107, 74, 0.15)',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  estVal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  estValHighlight: {
    color: colors.success,
  },
  estLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  estLabelHighlight: {
    fontSize: 10,
    color: colors.success,
    marginTop: 2,
    textAlign: 'center',
  },
  macroProgressContainer: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  macroBar: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  macroBarText: {
    fontSize: 10,
    color: colors.primaryContrast,
  },
  macroBarGram: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.primaryContrast,
  },
  alertList: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  alertListItem: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
  ketoneAlertContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: colors.danger,
    borderWidth: 1.5,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  ketoneAlertText: {
    fontSize: 13,
    color: colors.danger,
    lineHeight: 20,
    textAlign: 'right',
  },
  pregnancyStatusContainer: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  targetRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 0.5,
    borderColor: colors.border,
  },
  targetText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  targetNum: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'right',
  },
  modalDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 18,
    textAlign: 'right',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
