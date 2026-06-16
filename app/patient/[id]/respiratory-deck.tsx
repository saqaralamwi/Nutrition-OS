import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Text,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Q } from '@nozbe/watermelondb';

// Database & Observe
import { getDatabase } from '../../../src/data/database';
import { watchQuery, watchRecord } from '../../../src/data/database/observe';
import { useObservable } from '../../../src/presentation/hooks/useObservable';

// Models, Types & Engines
import Patient from '../../../src/data/models/Patient';
import VitalsRecord from '../../../src/data/models/VitalsRecord';
import RespiratoryAssessmentRecord from '../../../src/data/models/RespiratoryAssessmentRecord';
import { RespiratoryQuotientEngine } from '../../../src/domain/calculators/RespiratoryQuotientEngine';
import { calculateBmr } from '../../../src/domain/calculators/BmrCalculator';
import { PennStateEngine } from '../../../src/domain/calculators/PennStateEngine';
import type { OxygenDeliveryMode, IRespiratoryOutput } from '../../../src/data/types/respiratory';

// Presentation / Design System
import { colors, spacing, safeHeaderPaddingTop, fontFamilies } from '../../../src/presentation/theme';
import ArabicText from '../../../src/presentation/components/ArabicText';
import TextInputField from '../../../src/presentation/components/TextInputField';
import Button from '../../../src/presentation/components/Button';
import { usePatientStore } from '../../../src/presentation/stores/patientStore';
import { useAuthStore } from '../../../src/presentation/stores/authStore';

interface RespiratoryState {
  patient: Patient | null;
  vitals: VitalsRecord | null;
  latestRecord: RespiratoryAssessmentRecord | null;
  calcResult: IRespiratoryOutput;
  inputs: {
    fev1Percentage: number;
    hasCo2Retention: boolean;
    oxygenDeliveryMode: OxygenDeliveryMode;
    totalEnergyTargetKcal: number;
  };
}

export default function RespiratoryDeckScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const showToast = usePatientStore((s) => s.showToast);
  const currentUser = useAuthStore((s) => s.user);

  // Lockout inputs & saving state
  const [clinicalJustification, setClinicalJustification] = useState('');
  const [signature, setSignature] = useState(currentUser?.fullName || '');
  const [isSaving, setIsSaving] = useState(false);

  // Local React state solely for text-input buffering to avoid focus lag while typing
  const [energyInputText, setEnergyInputText] = useState('');

  // Track layout width for slider coordinate mapping
  const [sliderWidth, setSliderWidth] = useState(0);

  // Sync signature when auth user hydrates
  useEffect(() => {
    if (currentUser?.fullName) {
      setSignature(currentUser.fullName);
    }
  }, [currentUser]);

  // 1. Enforce RxJS BehaviorSubjects for inputs
  const input$ = useMemo(() => ({
    fev1Percentage: new BehaviorSubject<number>(80),
    hasCo2Retention: new BehaviorSubject<boolean>(false),
    oxygenDeliveryMode: new BehaviorSubject<OxygenDeliveryMode>('none'),
    totalEnergyTargetKcal: new BehaviorSubject<number>(2000),
  }), []);

  // 2. Consolidate patient data, vitals, historical records, and inputs inside combineLatest
  const calculations$ = useMemo((): Observable<RespiratoryState> => {
    const patient$ = watchRecord<Patient>('patients', patientId);

    const vitals$ = watchQuery<VitalsRecord>((db) => {
      return db.get('vitals_records').query(
        Q.where('patient_id', patientId),
        Q.sortBy('created_at', 'desc')
      );
    }).pipe(
      map((records) => (records.length > 0 ? records[0] : null))
    );

    const latestRecord$ = watchQuery<RespiratoryAssessmentRecord>((db) => {
      return db.get('respiratory_assessment_records').query(
        Q.where('patient_id', patientId),
        Q.sortBy('recorded_at', 'desc')
      );
    }).pipe(
      map((records) => (records.length > 0 ? records[0] : null))
    );

    return combineLatest([
      patient$,
      vitals$,
      latestRecord$,
      input$.fev1Percentage,
      input$.hasCo2Retention,
      input$.oxygenDeliveryMode,
      input$.totalEnergyTargetKcal,
    ]).pipe(
      map(([p, vitals, latestRec, fev1, co2, mode, energy]) => {
        const result = RespiratoryQuotientEngine.evaluateRespiratoryConstraints({
          fev1Percentage: fev1,
          hasCo2Retention: co2,
          oxygenDeliveryMode: mode,
          totalEnergyTargetKcal: energy,
        });

        return {
          patient: p,
          vitals,
          latestRecord: latestRec,
          calcResult: result,
          inputs: {
            fev1Percentage: fev1,
            hasCo2Retention: co2,
            oxygenDeliveryMode: mode,
            totalEnergyTargetKcal: energy,
          },
        };
      })
    );
  }, [patientId, input$]);

  // 3. Force re-render via useObservable hook
  const state = useObservable<RespiratoryState>(calculations$, {
    patient: null,
    vitals: null,
    latestRecord: null,
    calcResult: {
      targetRq: 0.85,
      maxCarbohydrateEnergyRatio: 0,
      maxCarbKcal: 0,
      minLipidEnergyRatio: 0,
      isSafe: false,
      arabicClinicalAlerts: [],
    },
    inputs: {
      fev1Percentage: 80,
      hasCo2Retention: false,
      oxygenDeliveryMode: 'none',
      totalEnergyTargetKcal: 2000,
    },
  });

  // Sync initial values from database snapshot
  const isInitializedRef = useRef(false);
  useEffect(() => {
    if (!isInitializedRef.current && state.latestRecord) {
      isInitializedRef.current = true;
      input$.fev1Percentage.next(state.latestRecord.fev1Percentage);
      input$.hasCo2Retention.next(state.latestRecord.hasCo2Retention);
      input$.oxygenDeliveryMode.next(state.latestRecord.oxygenDeliveryMode as OxygenDeliveryMode);

      // Check if patient notes has a saved target
      let savedEnergy = 2000;
      if (state.patient) {
        try {
          const parsedNotes = JSON.parse(state.patient.notes || '{}');
          if (parsedNotes?.respiratoryPlan?.totalEnergyTargetKcal) {
            savedEnergy = parseFloat(parsedNotes.respiratoryPlan.totalEnergyTargetKcal) || 2000;
            hasUserEditedEnergyRef.current = true;
          }
        } catch (e) {}
      }
      input$.totalEnergyTargetKcal.next(savedEnergy);
      setEnergyInputText(String(savedEnergy));
    }
  }, [state.latestRecord, state.patient, input$]);

  // Derived Mifflin BMR or Penn State baseline target
  const defaultEnergyNeeds = useMemo(() => {
    if (!state.patient) return 2000;
    const wt = state.vitals?.weightKg ?? state.vitals?.weight ?? 70;
    const ht = state.vitals?.heightCm ?? state.vitals?.height ?? 170;
    const age = state.patient.age ?? 40;
    const isMale = state.patient.gender === 'male';
    const bmi = wt / Math.pow(ht / 100, 2);
    const isObese = bmi >= 30;

    const baseMifflin = 10 * wt + 6.25 * ht - 5 * age + (isMale ? 5 : -161);

    if (state.inputs.oxygenDeliveryMode === 'mechanical_ventilation') {
      const temp = state.vitals?.temperature ?? 37.0;
      const mv = 6.0;

      const psResult = PennStateEngine.calculatePennState({
        mifflinRee: baseMifflin,
        minuteVentilationLMin: mv,
        maxTemperatureCelsius: temp,
        isObese,
      });
      if (psResult.isSafe) {
        return Math.round(psResult.rmrValue);
      }
    }

    return Math.round(baseMifflin);
  }, [state.patient, state.vitals, state.inputs.oxygenDeliveryMode]);

  // Auto pre-fill target with calculated BMR if user has not edited it
  const hasUserEditedEnergyRef = useRef(false);
  useEffect(() => {
    if (!hasUserEditedEnergyRef.current && defaultEnergyNeeds > 0) {
      input$.totalEnergyTargetKcal.next(defaultEnergyNeeds);
      setEnergyInputText(String(defaultEnergyNeeds));
    }
  }, [defaultEnergyNeeds, input$]);

  // Input Update Handlers
  const handleFev1Change = (val: number) => {
    const clamped = Math.max(0, Math.min(120, val));
    input$.fev1Percentage.next(clamped);
  };

  const handleCo2RetentionChange = (val: boolean) => {
    input$.hasCo2Retention.next(val);
  };

  const handleOxygenDeliveryModeChange = (val: OxygenDeliveryMode) => {
    input$.oxygenDeliveryMode.next(val);
  };

  const handleEnergyChange = (val: string) => {
    setEnergyInputText(val);
    hasUserEditedEnergyRef.current = true;
    const parsed = parseFloat(val) || 0;
    input$.totalEnergyTargetKcal.next(parsed);
  };

  const handleSliderTouch = (evt: any) => {
    if (sliderWidth <= 0) return;
    const touchX = evt.nativeEvent.locationX;
    const pct = Math.max(0, Math.min(1, touchX / sliderWidth));
    const val = Math.round(pct * 120);
    handleFev1Change(val);
  };

  // Lockout logic
  const isLockoutActive = useMemo(() => {
    return state.inputs.hasCo2Retention === true || state.inputs.oxygenDeliveryMode === 'mechanical_ventilation';
  }, [state.inputs.hasCo2Retention, state.inputs.oxygenDeliveryMode]);

  const isCommitDisabled = useMemo(() => {
    if (isLockoutActive) {
      return clinicalJustification.trim().length < 15;
    }
    return false;
  }, [isLockoutActive, clinicalJustification]);

  // Database Save Transaction
  const handleSavePlan = async () => {
    if (isCommitDisabled) {
      showToast('خطأ: يرجى كتابة تبرير سريري كافٍ (15 حرفاً على الأقل) لفك القفل', 'error');
      return;
    }
    if (!signature.trim()) {
      showToast('خطأ: يرجى التوقيع باسم الأخصائي المعتمد', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const db = await getDatabase();

      await db.write(async () => {
        const patientRecord = await db.get<Patient>('patients').find(patientId);
        const respiratoryAssessmentCollection = db.get<RespiratoryAssessmentRecord>('respiratory_assessment_records');
        const auditLogCollection = db.get('audit_logs');

        const respiratoryPlan = {
          fev1Percentage: state.inputs.fev1Percentage,
          hasCo2Retention: state.inputs.hasCo2Retention,
          oxygenDeliveryMode: state.inputs.oxygenDeliveryMode,
          totalEnergyTargetKcal: state.inputs.totalEnergyTargetKcal,
          targetRq: state.calcResult.targetRq,
          maxCarbohydrateEnergyRatio: state.calcResult.maxCarbohydrateEnergyRatio,
          maxCarbKcal: state.calcResult.maxCarbKcal,
          minLipidEnergyRatio: state.calcResult.minLipidEnergyRatio,
          clinicalJustification: clinicalJustification.trim(),
          signature: signature.trim(),
          timestamp: new Date().toISOString(),
        };

        // 1. Create a new respiratory assessment record
        await respiratoryAssessmentCollection.create((record) => {
          record.patientId = patientId;
          record.fev1Percentage = state.inputs.fev1Percentage;
          record.hasCo2Retention = state.inputs.hasCo2Retention;
          record.respiratoryQuotientTarget = state.calcResult.targetRq;
          record.oxygenDeliveryMode = state.inputs.oxygenDeliveryMode;
          record.maxCarbohydrateEnergyRatio = state.calcResult.maxCarbohydrateEnergyRatio;
          record.recordedAt = new Date();
        });

        // 2. Update Patient notes and clinical tags
        await patientRecord.update((record) => {
          let currentNotesObj: any = {};
          try {
            currentNotesObj = JSON.parse(record.notes || '{}');
          } catch (e) {
            currentNotesObj = { legacyNotes: record.notes || '' };
          }
          currentNotesObj.respiratoryPlan = respiratoryPlan;
          record.notes = JSON.stringify(currentNotesObj);

          const tags = record.clinicalTags ? record.clinicalTags.split(',') : [];
          if (!tags.includes('RESPIRATORY_RESTRICTION')) {
            tags.push('RESPIRATORY_RESTRICTION');
            record.clinicalTags = tags.join(',');
          }

          const tagsAr = record.clinicalTagsAr ? record.clinicalTagsAr.split(',') : [];
          if (!tagsAr.includes('تقييد تنفسي كبح الكربوهيدرات')) {
            tagsAr.push('تقييد تنفسي كبح الكربوهيدرات');
            record.clinicalTagsAr = tagsAr.join(',');
          }
        });

        // 3. Write record inside 'audit_logs'
        await auditLogCollection.create((record: any) => {
          record.actionType = 'respiratory_assessment_audit';
          record.userId = signature.trim() || currentUser?.fullName || 'clinical_user';
          record.details = JSON.stringify({
            patientId,
            justification: clinicalJustification.trim(),
            signature: signature.trim(),
            systemTime: new Date().getTime(),
            timestamp: new Date().toISOString(),
            userVector: {
              userId: currentUser?.id || '',
              fullName: currentUser?.fullName || '',
              role: (currentUser as any)?.role || 'clinical_user',
            },
            respiratoryPlan,
          });
        });
      });

      showToast('تم اعتماد الخطة التنفسية والحدود الأيضية بنجاح في قاعدة البيانات', 'success');
      router.back();
    } catch (error) {
      console.error('Failed to commit respiratory assessment:', error);
      showToast('فشل حفظ وتوثيق الجلسة التنفسية بقاعدة البيانات', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (state.patient === null) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  const weightVal = state.vitals?.weightKg ?? state.vitals?.weight ?? 70;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <ArabicText bold style={styles.headerTitle}>لوحة التحكم التنفسي وكبح الكربوهيدرات</ArabicText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Patient Demographics Info Panel */}
        <View style={styles.demographicsCard}>
          <ArabicText bold style={styles.cardTitle}>بيانات حالة المريض الأساسية</ArabicText>
          <View style={styles.demographicsGrid}>
            <View style={styles.demoItem}>
              <ArabicText style={styles.demoLabel}>الاسم:</ArabicText>
              <ArabicText style={styles.demoValue}>{state.patient.fullName || '-'}</ArabicText>
            </View>
            <View style={styles.demoItem}>
              <ArabicText style={styles.demoLabel}>العمر:</ArabicText>
              <ArabicText style={styles.demoValue}>{state.patient.age ? `${state.patient.age} سنة` : '-'}</ArabicText>
            </View>
            <View style={styles.demoItem}>
              <ArabicText style={styles.demoLabel}>الوزن الحالي:</ArabicText>
              <ArabicText style={styles.demoValue}>{weightVal} كجم</ArabicText>
            </View>
            <View style={styles.demoItem}>
              <ArabicText style={styles.demoLabel}>الاحتياج الحراري المقدر (BMR):</ArabicText>
              <ArabicText style={styles.demoValue}>{defaultEnergyNeeds} سعرة</ArabicText>
            </View>
          </View>
        </View>

        {/* CARD A (PULMONARY VENTILATORY SETTINGS) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="options-outline" size={22} color="#0EA5E9" />
            <ArabicText bold style={styles.cardTitle}>أ. إعدادات التهوية الرئوية والزفير (Card A)</ArabicText>
          </View>

          {/* FEV1 Slider input from 0 to 120% */}
          <View style={styles.sliderSection}>
            <View style={styles.sliderTextRow}>
              <ArabicText style={styles.sliderLabel}>كفاءة حد الزفير القسري في الثانية الأولى (FEV1%):</ArabicText>
              <ArabicText bold style={styles.sliderValueText}>
                {state.inputs.fev1Percentage}%
              </ArabicText>
            </View>

            {/* Custom interactive touch track wrapper */}
            <View style={styles.sliderWrapper}>
              <TouchableOpacity
                style={styles.sliderMicroButton}
                onPress={() => handleFev1Change(state.inputs.fev1Percentage - 1)}
              >
                <Text style={styles.sliderMicroButtonText}>-1%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sliderMicroButton}
                onPress={() => handleFev1Change(state.inputs.fev1Percentage - 5)}
              >
                <Text style={styles.sliderMicroButtonText}>-5%</Text>
              </TouchableOpacity>

              <View
                style={styles.sliderTrackContainer}
                onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
                onTouchStart={handleSliderTouch}
                onTouchMove={handleSliderTouch}
              >
                <View style={styles.sliderTrackLine}>
                  <View style={[styles.sliderTrackFill, { width: `${(state.inputs.fev1Percentage / 120) * 100}%` }]} />
                </View>
                <View style={[styles.sliderTrackThumb, { left: `${(state.inputs.fev1Percentage / 120) * 100}%` }]} />
              </View>

              <TouchableOpacity
                style={styles.sliderMicroButton}
                onPress={() => handleFev1Change(state.inputs.fev1Percentage + 5)}
              >
                <Text style={styles.sliderMicroButtonText}>+5%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sliderMicroButton}
                onPress={() => handleFev1Change(state.inputs.fev1Percentage + 1)}
              >
                <Text style={styles.sliderMicroButtonText}>+1%</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Interactive toggle switch for active Hypercapnia */}
          <View style={styles.switchRow}>
            <ArabicText style={styles.switchLabel}>🚨 المريض يعاني من احتباس غاز ثاني أكسيد الكربون (Hypercapnia / CO2 Retention)</ArabicText>
            <Switch
              value={state.inputs.hasCo2Retention}
              onValueChange={handleCo2RetentionChange}
              trackColor={{ false: '#334155', true: '#EF4444' }}
              thumbColor={state.inputs.hasCo2Retention ? '#B91C1C' : '#94A3B8'}
            />
          </View>

          {/* Drop-down layout picker for oxygenDeliveryMode */}
          <View style={styles.deliveryModeSection}>
            <ArabicText style={styles.sectionLabel}>طريقة إمداد الأكسجين والدعم التنفسي (Oxygen Mode):</ArabicText>
            <View style={styles.deliveryModeContainer}>
              {(['none', 'nasal_cannula', 'cpap_bipap', 'mechanical_ventilation'] as const).map((mode) => {
                const labelMap = {
                  none: 'لا يوجد دعم تنفسي',
                  nasal_cannula: 'قنية أنفية (Nasal)',
                  cpap_bipap: 'جهاز (CPAP/BiPAP)',
                  mechanical_ventilation: 'تنفس اصطناعي (Vent)',
                };
                const iconMap = {
                  none: 'close-circle-outline',
                  nasal_cannula: 'medical-outline',
                  cpap_bipap: 'pulse-outline',
                  mechanical_ventilation: 'speedometer-outline',
                };
                const isSelected = state.inputs.oxygenDeliveryMode === mode;
                return (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.modeButton, isSelected && styles.modeButtonSelected]}
                    onPress={() => handleOxygenDeliveryModeChange(mode)}
                  >
                    <Ionicons
                      name={iconMap[mode] as any}
                      size={18}
                      color={isSelected ? '#F8FAFC' : '#38BDF8'}
                    />
                    <ArabicText style={[styles.modeText, isSelected && styles.modeTextSelected]}>
                      {labelMap[mode]}
                    </ArabicText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Total energy input */}
          <View style={{ marginTop: spacing.md }}>
            <TextInputField
              label="إجمالي الاحتياج الطاقي اليومي (kcal/day):"
              value={energyInputText}
              onChangeText={handleEnergyChange}
              keyboardType="decimal-pad"
              placeholder="مثال: 1800"
            />
          </View>
        </View>

        {/* CARD B (LIVE METABOLIC RESPIRATORY COMPASS) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="compass-outline" size={22} color="#34D399" />
            <ArabicText bold style={styles.cardTitle}>ب. المؤشرات والقيود الأيضية التنفسية (Card B)</ArabicText>
          </View>

          {/* Compiled clinical telemetry inside high-fidelity grid */}
          <View style={styles.telemetryGrid}>
            <View style={styles.telemetryBadge}>
              <ArabicText style={styles.teleLabel}>المعامل التنفسي المستهدف (Target RQ):</ArabicText>
              <ArabicText bold style={styles.teleValue}>
                {state.calcResult.targetRq.toFixed(2)}
              </ArabicText>
            </View>

            {/* Custom color coding for max allowable ratio */}
            <View style={[styles.telemetryBadge, state.calcResult.maxCarbohydrateEnergyRatio === 0.40 && styles.badgeWarning]}>
              <ArabicText style={styles.teleLabel}>سقف كربوهيدرات الوجبة (Max Carbohydrate Ratio):</ArabicText>
              <ArabicText bold style={[styles.teleValue, state.calcResult.maxCarbohydrateEnergyRatio === 0.40 && styles.textWarning]}>
                {Math.round(state.calcResult.maxCarbohydrateEnergyRatio * 100)}%
              </ArabicText>
            </View>

            <View style={styles.telemetryBadge}>
              <ArabicText style={styles.teleLabel}>السقف الكالوري للكربوهيدرات (Max Carb Calories):</ArabicText>
              <ArabicText bold style={styles.teleValue}>
                {Math.round(state.calcResult.maxCarbKcal).toLocaleString('en-US')} <Text style={{ fontSize: 12, fontWeight: 'normal' }}>سعرة</Text>
              </ArabicText>
            </View>

            <View style={styles.telemetryBadge}>
              <ArabicText style={styles.teleLabel}>الحد الأدنى لأكسدة الدهون (Min Lipid Ratio):</ArabicText>
              <ArabicText bold style={[styles.teleValue, { color: '#818CF8' }]}>
                {Math.round(state.calcResult.minLipidEnergyRatio * 100)}%
              </ArabicText>
            </View>
          </View>

          {/* Scrolling warning viewport block */}
          <View style={styles.directivesViewport}>
            <ArabicText bold style={styles.directivesTitle}>🔬 توجيهات والتحذيرات السريرية للتنفس:</ArabicText>
            <ScrollView nestedScrollEnabled style={styles.directivesScroll}>
              {state.calcResult.arabicClinicalAlerts.length > 0 ? (
                state.calcResult.arabicClinicalAlerts.map((directive, index) => (
                  <View key={index} style={styles.directiveRow}>
                    <Ionicons name="alert-circle" size={18} color="#F87171" />
                    <ArabicText style={styles.directiveText}>{directive}</ArabicText>
                  </View>
                ))
              ) : (
                <View style={styles.directiveRow}>
                  <Ionicons name="checkmark-circle" size={18} color="#34D399" />
                  <ArabicText style={[styles.directiveText, { color: '#A7F3D0' }]}>
                    المريض لا يعاني من احتباس الكربون الحرج. يتم الحفاظ على المعامل التنفسي الطبيعي (RQ = 0.85) وتغذية معتدلة.
                  </ArabicText>
                </View>
              )}
            </ScrollView>
          </View>
        </View>

        {/* CARD C (TRANSACTIVE COMMIT & CO2 OVERLOAD LOCKOUT) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="lock-closed-outline" size={22} color="#818CF8" />
            <ArabicText bold style={styles.cardTitle}>ج. اعتماد وإقرار الخطة التنفسية (Card C)</ArabicText>
          </View>

          {/* Enforce Strict Transaction Lockout Justification overlays */}
          {isLockoutActive && (
            <View style={styles.lockoutWarningCard}>
              <Ionicons name="lock-closed" size={26} color="#EF4444" />
              <ArabicText bold style={styles.lockoutTitle}>🚨 تم تفعيل قفل الأمان الرئوي (احتباس CO2 أو تنفس اصطناعي)</ArabicText>
              <ArabicText style={styles.lockoutSubtitle}>
                مستويات احتباس الغاز تتطلب توقيع وتبرير سريري معتمد (15 حرفاً عربياً على الأقل) لاعتماد الوجبات قليلة الكربوهيدرات.
              </ArabicText>

              <TextInputField
                label="التبرير الطبي المعتمد سريرياً لكبح السكريات"
                value={clinicalJustification}
                onChangeText={setClinicalJustification}
                multiline
                placeholder="اكتب التبرير هنا (مثال: تعويض السعرات بالدهون ضروري لتسريع فطام المريض عن جهاز التنفس...)"
              />
              <Text
                style={[
                  styles.charCounter,
                  clinicalJustification.trim().length >= 15 ? styles.counterOk : styles.counterErr,
                ]}
              >
                عدد الحروف الحالي: {clinicalJustification.trim().length} / 15
              </Text>
            </View>
          )}

          <TextInputField
            label="اسم وتوقيع الأخصائي السريري المعتمد"
            value={signature}
            onChangeText={setSignature}
            placeholder="مثال: د. مازن العتيبي"
            required
          />

          <Button
            title="اعتماد الحظر التنفسي والنسب المستهدفة للـ OS"
            onPress={handleSavePlan}
            disabled={isCommitDisabled || !signature.trim()}
            loading={isSaving}
            variant={isLockoutActive ? 'danger' : 'primary'}
            icon={<Ionicons name="shield" size={20} color="#F8FAFC" />}
            style={styles.commitButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Deep dark-slate background
    paddingTop: safeHeaderPaddingTop,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0F172A',
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    color: '#F8FAFC',
    fontFamily: fontFamilies.bold,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl * 2,
  },
  demographicsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
  },
  demographicsGrid: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  demoItem: {
    width: '47%',
    backgroundColor: '#0F172A',
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  demoLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 2,
    textAlign: 'right',
  },
  demoValue: {
    fontSize: 14,
    color: '#F8FAFC',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  card: {
    backgroundColor: '#1E293B', // Slate surface
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: spacing.xs,
  },
  cardTitle: {
    fontSize: 16,
    color: '#F8FAFC',
    fontFamily: fontFamilies.bold,
    textAlign: 'right',
  },
  switchRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: spacing.md,
  },
  switchLabel: {
    fontSize: 12,
    color: '#F8FAFC',
    flex: 1,
    textAlign: 'right',
    paddingRight: 4,
  },
  sliderSection: {
    marginBottom: spacing.md,
  },
  sliderTextRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sliderLabel: {
    fontSize: 13,
    color: '#94A3B8',
  },
  sliderValueText: {
    fontSize: 18,
    color: '#0EA5E9',
    fontFamily: fontFamilies.bold,
  },
  sliderWrapper: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#0F172A',
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sliderMicroButton: {
    backgroundColor: '#1E293B',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#475569',
  },
  sliderMicroButtonText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  sliderTrackContainer: {
    flex: 1,
    height: 30,
    justifyContent: 'center',
    position: 'relative',
    marginHorizontal: spacing.xs,
  },
  sliderTrackLine: {
    height: 6,
    backgroundColor: '#334155',
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  sliderTrackFill: {
    height: '100%',
    backgroundColor: '#0EA5E9',
  },
  sliderTrackThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#38BDF8',
    borderWidth: 2,
    borderColor: '#F8FAFC',
    marginTop: -8,
    top: '50%',
    transform: [{ translateX: -8 }],
  },
  deliveryModeSection: {
    marginTop: spacing.md,
  },
  sectionLabel: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: spacing.sm,
    textAlign: 'right',
  },
  deliveryModeContainer: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  modeButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#0F172A',
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modeButtonSelected: {
    borderColor: '#0EA5E9',
    backgroundColor: '#075985',
  },
  modeText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  modeTextSelected: {
    color: '#F8FAFC',
    fontWeight: 'bold',
  },
  telemetryGrid: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  telemetryBadge: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeWarning: {
    backgroundColor: '#450A0A',
    borderColor: '#EF4444',
  },
  teleLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  teleValue: {
    fontSize: 14,
    color: '#34D399',
    fontWeight: 'bold',
  },
  textWarning: {
    color: '#F87171',
  },
  directivesViewport: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
    maxHeight: 180,
  },
  directivesTitle: {
    fontSize: 13,
    color: '#0EA5E9',
    textAlign: 'right',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 4,
    marginBottom: spacing.xs,
  },
  directivesScroll: {
    flex: 1,
  },
  directiveRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  directiveText: {
    flex: 1,
    fontSize: 11,
    color: '#E2E8F0',
    textAlign: 'right',
    lineHeight: 16,
  },
  lockoutWarningCard: {
    backgroundColor: '#450A0A',
    borderColor: '#EF4444',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  lockoutTitle: {
    fontSize: 14,
    color: '#F87171',
    marginTop: spacing.xs,
    marginBottom: 4,
  },
  lockoutSubtitle: {
    fontSize: 12,
    color: '#FCA5A5',
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 16,
  },
  charCounter: {
    fontSize: 12,
    textAlign: 'right',
    alignSelf: 'stretch',
    marginBottom: spacing.xs,
  },
  counterOk: {
    color: '#10B981',
  },
  counterErr: {
    color: '#EF4444',
  },
  commitButton: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
  },
});
