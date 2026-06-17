import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  useWindowDimensions,
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

// Models & Types
import Patient from '../../../src/data/models/Patient';
import VitalsRecord from '../../../src/data/models/VitalsRecord';
import BurnAssessmentRecord from '../../../src/data/models/BurnAssessmentRecord';
import { BurnMetabolicEngine } from '../../../src/domain/calculators/BurnMetabolicEngine';
import type { BurnDegree, IBurnMetabolicOutput } from '../../../src/data/types/burn_metabolic';

// Interactive Body Map
import InteractiveBodyMap from '../../../src/components/InteractiveBodyMap';

// Presentation / Design System
import { colors, spacing, safeHeaderPaddingTop, fontFamilies } from '../../../src/presentation/theme';
import ArabicText from '../../../src/presentation/components/ArabicText';
import TextInputField from '../../../src/presentation/components/TextInputField';
import Button from '../../../src/presentation/components/Button';
import { usePatientStore } from '../../../src/presentation/stores/patientStore';
import { useToastStore } from '../../../src/presentation/stores/toastStore';
import { useAuthStore } from '../../../src/presentation/stores/authStore';

interface BurnState {
  patient: Patient | null;
  vitals: VitalsRecord | null;
  latestRecord: BurnAssessmentRecord | null;
  calcResult: IBurnMetabolicOutput;
  inputs: {
    tbsaPercentage: number;
    burnDegree: BurnDegree;
    isIntubated: boolean;
  };
}

export default function BurnAssessmentScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const showToast = useToastStore((s) => s.showToast);
  const currentUser = useAuthStore((s) => s.user);
  const { width: screenW } = useWindowDimensions();
  const isDesktop = screenW >= 768;

  // Lockout inputs & saving state
  const [clinicalJustification, setClinicalJustification] = useState('');
  const [signature, setSignature] = useState(currentUser?.fullName || '');
  const [isSaving, setIsSaving] = useState(false);

  // Track layout width for custom slider touch coordinates
  const [sliderWidth, setSliderWidth] = useState(0);

  // Sync signature when auth user hydrates
  useEffect(() => {
    if (currentUser?.fullName) {
      setSignature(currentUser.fullName);
    }
  }, [currentUser]);

  // 1. Enforce RxJS BehaviorSubjects for inputs
  const input$ = useMemo(() => ({
    tbsaPercentage: new BehaviorSubject<number>(0),
    burnDegree: new BehaviorSubject<BurnDegree>('first'),
    isIntubated: new BehaviorSubject<boolean>(false),
  }), []);

  // 2. Reactive Stream Consolidation inside combineLatest
  const calculations$ = useMemo((): Observable<BurnState> => {
    const patient$ = watchRecord<Patient>('patients', patientId);

    const vitals$ = watchQuery<VitalsRecord>((db) => {
      return db.get('vitals_records').query(
        Q.where('patient_id', patientId),
        Q.sortBy('created_at', 'desc')
      );
    }).pipe(
      map((records) => (records.length > 0 ? records[0] : null))
    );

    const latestRecord$ = watchQuery<BurnAssessmentRecord>((db) => {
      return db.get('burn_assessment_records').query(
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
      input$.tbsaPercentage,
      input$.burnDegree,
      input$.isIntubated,
    ]).pipe(
      map(([p, vitals, latestRec, tbsa, degree, intubated]) => {
        const wt = vitals?.weightKg ?? vitals?.weight ?? 70;
        const result = BurnMetabolicEngine.calculateBurnRequirements({
          patientWeightKg: wt,
          tbsaPercentage: tbsa,
          burnDegree: degree,
          isIntubated: intubated,
        });

        return {
          patient: p,
          vitals,
          latestRecord: latestRec,
          calcResult: result,
          inputs: {
            tbsaPercentage: tbsa,
            burnDegree: degree,
            isIntubated: intubated,
          },
        };
      })
    );
  }, [patientId, input$]);

  // 3. Force re-render via useObservable hook
  const state = useObservable<BurnState>(calculations$, {
    patient: null,
    vitals: null,
    latestRecord: null,
    calcResult: {
      parklandFluidMl24h: 0,
      first8hFluidMl: 0,
      remaining16hFluidMl: 0,
      curreriEnergyKcal24h: 0,
      targetProteinGrams: 0,
      isSafe: false,
      arabicClinicalAlerts: [],
    },
    inputs: {
      tbsaPercentage: 0,
      burnDegree: 'first',
      isIntubated: false,
    },
  });

  // Sync initial values from database
  const isInitializedRef = useRef(false);
  useEffect(() => {
    if (!isInitializedRef.current && state.latestRecord) {
      isInitializedRef.current = true;
      input$.tbsaPercentage.next(state.latestRecord.tbsaPercentage);
      input$.burnDegree.next(state.latestRecord.burnDegree as BurnDegree);
      input$.isIntubated.next(state.latestRecord.isIntubated);
    }
  }, [state.latestRecord, input$]);

  // Input Update Handlers
  const handleTbsaChange = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    input$.tbsaPercentage.next(clamped);
  };

  const handleBodyMapChange = useCallback((calculatedTBSA: number) => {
    const clamped = Math.max(0, Math.min(100, calculatedTBSA));
    input$.tbsaPercentage.next(clamped);
  }, [input$]);

  const handleBurnDegreeChange = (val: BurnDegree) => {
    input$.burnDegree.next(val);
  };

  const handleIntubatedChange = (val: boolean) => {
    input$.isIntubated.next(val);
  };

  const handleSliderTouch = (evt: any) => {
    if (sliderWidth <= 0) return;
    const touchX = evt.nativeEvent.locationX;
    const pct = Math.max(0, Math.min(1, touchX / sliderWidth));
    const val = Math.round(pct * 100);
    handleTbsaChange(val);
  };

  // Lockout logic
  const isLockoutActive = useMemo(() => {
    return state.inputs.tbsaPercentage >= 20;
  }, [state.inputs.tbsaPercentage]);

  const isCommitDisabled = useMemo(() => {
    if (isLockoutActive) {
      return clinicalJustification.trim().length < 15;
    }
    return false;
  }, [isLockoutActive, clinicalJustification]);

  // Database Save Transaction
  const handleSavePlan = async () => {
    if (isCommitDisabled) {
      showToast('خطأ: يرجى كتابة تبرير سريري كافٍ (15 حرفاً على الأقل)', 'error');
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
        const burnAssessmentCollection = db.get<BurnAssessmentRecord>('burn_assessment_records');
        const auditLogCollection = db.get('audit_logs');

        const burnResuscitationPlan = {
          tbsaPercentage: state.inputs.tbsaPercentage,
          burnDegree: state.inputs.burnDegree,
          isIntubated: state.inputs.isIntubated,
          parklandFluidMl24h: state.calcResult.parklandFluidMl24h,
          first8hFluidMl: state.calcResult.first8hFluidMl,
          remaining16hFluidMl: state.calcResult.remaining16hFluidMl,
          curreriEnergyKcal24h: state.calcResult.curreriEnergyKcal24h,
          targetProteinGrams: state.calcResult.targetProteinGrams,
          clinicalJustification: clinicalJustification.trim(),
          signature: signature.trim(),
          timestamp: new Date().toISOString(),
        };

        // 1. Create a new burn assessment record
        await burnAssessmentCollection.create((record) => {
          record.patientId = patientId;
          record.tbsaPercentage = state.inputs.tbsaPercentage;
          record.burnDegree = state.inputs.burnDegree;
          record.isIntubated = state.inputs.isIntubated;
          record.curreriEnergyTarget = state.calcResult.curreriEnergyKcal24h;
          record.parklandFluidTarget = state.calcResult.parklandFluidMl24h;
          record.recordedAt = new Date();
        });

        // 2. Update Patient metadata settings and active trauma restriction flags
        await patientRecord.update((record) => {
          let currentNotesObj: any = {};
          try {
            currentNotesObj = JSON.parse(record.notes || '{}');
          } catch (e) {
            currentNotesObj = { legacyNotes: record.notes || '' };
          }
          currentNotesObj.burnResuscitationPlan = burnResuscitationPlan;
          record.notes = JSON.stringify(currentNotesObj);

          if (state.inputs.tbsaPercentage >= 20) {
            const tags = record.clinicalTags ? record.clinicalTags.split(',') : [];
            if (!tags.includes('TRAUMA_BURN_RESTRICTION')) {
              tags.push('TRAUMA_BURN_RESTRICTION');
              record.clinicalTags = tags.join(',');
            }

            const tagsAr = record.clinicalTagsAr ? record.clinicalTagsAr.split(',') : [];
            if (!tagsAr.includes('تقييد الحروق البليغة الصدمية')) {
              tagsAr.push('تقييد الحروق البليغة الصدمية');
              record.clinicalTagsAr = tagsAr.join(',');
            }
          }
        });

        // 3. Write record inside 'audit_logs'
        await auditLogCollection.create((record: any) => {
          record.actionType = 'burn_resuscitation_assessment_audit';
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
            burnResuscitationPlan,
          });
        });
      });

      showToast('تم اعتماد وحقن خطة إنعاش الحروق بنجاح في قاعدة البيانات', 'success');
      router.back();
    } catch (error) {
      console.error('Failed to commit burn assessment:', error);
      showToast('فشل حفظ وتوثيق جلسة إنعاش الحروق بقاعدة البيانات', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (state.patient === null) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#F97316" />
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
        <ArabicText bold style={styles.headerTitle}>تقييم الحروق البليغة وإنعاش السوائل</ArabicText>
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
              <ArabicText style={styles.demoLabel}>الجنس:</ArabicText>
              <ArabicText style={styles.demoValue}>
                {state.patient.gender === 'male' ? 'ذكر' : state.patient.gender === 'female' ? 'أنثى' : '-'}
              </ArabicText>
            </View>
          </View>
        </View>

        {/* RESPONSIVE PANEL: Interactive Body Map + Inputs */}
        {isDesktop ? (
          <View style={styles.desktopRow}>
            <View style={styles.desktopMapPane}>
              <InteractiveBodyMap
                onTBSAChange={handleBodyMapChange}
                initialTBSA={state.latestRecord?.tbsaPercentage ?? 0}
              />
            </View>
            <View style={styles.desktopInputPane}>
              {/* CARD A (TRAUMA SURFACE PERCENTAGE WORKSPACE) */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="flame-outline" size={22} color="#F97316" />
                  <ArabicText bold style={styles.cardTitle}>أ. مساحة الحرق ودرجة الإصابة</ArabicText>
                </View>

                {/* Slider input from 0 to 100% */}
                <View style={styles.sliderSection}>
                  <View style={styles.sliderTextRow}>
                    <ArabicText style={styles.sliderLabel}>مساحة الحرق الكلية المقدرة (TBSA %):</ArabicText>
                    <ArabicText bold style={styles.sliderValueText}>
                      {state.inputs.tbsaPercentage}%
                    </ArabicText>
                  </View>

                  <View style={styles.sliderWrapper}>
                    <TouchableOpacity
                      style={styles.sliderMicroButton}
                      onPress={() => handleTbsaChange(state.inputs.tbsaPercentage - 1)}
                    >
                      <Text style={styles.sliderMicroButtonText}>-1%</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.sliderMicroButton}
                      onPress={() => handleTbsaChange(state.inputs.tbsaPercentage - 5)}
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
                        <View style={[styles.sliderTrackFill, { width: `${state.inputs.tbsaPercentage}%` }]} />
                      </View>
                      <View style={[styles.sliderTrackThumb, { left: `${state.inputs.tbsaPercentage}%` }]} />
                    </View>

                    <TouchableOpacity
                      style={styles.sliderMicroButton}
                      onPress={() => handleTbsaChange(state.inputs.tbsaPercentage + 5)}
                    >
                      <Text style={styles.sliderMicroButtonText}>+5%</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.sliderMicroButton}
                      onPress={() => handleTbsaChange(state.inputs.tbsaPercentage + 1)}
                    >
                      <Text style={styles.sliderMicroButtonText}>+1%</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Segmented layout picker for burnDegree */}
                <View style={styles.segmentedContainer}>
                  <ArabicText style={styles.segmentedLabel}>درجة الحروق السائدة (Burn Degree):</ArabicText>
                  <View style={styles.segmentsRow}>
                    {(['first', 'second', 'third', 'fourth'] as const).map((deg) => {
                      const labelMap = { first: 'الأولى', second: 'الثانية', third: 'الثالثة', fourth: 'الرابعة' };
                      const isSelected = state.inputs.burnDegree === deg;
                      return (
                        <TouchableOpacity
                          key={deg}
                          style={[styles.segmentButton, isSelected && styles.segmentButtonSelected]}
                          onPress={() => handleBurnDegreeChange(deg)}
                        >
                          <ArabicText style={[styles.segmentText, isSelected && styles.segmentTextSelected]}>
                            {labelMap[deg]}
                          </ArabicText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Interactive toggle switch for intubation */}
                <View style={styles.switchRow}>
                  <ArabicText style={styles.switchLabel}>🚨 المريض خاضع للتنفس الاصطناعي (إصابة استنشاقية حادة)</ArabicText>
                  <Switch
                    value={state.inputs.isIntubated}
                    onValueChange={handleIntubatedChange}
                    trackColor={{ false: '#334155', true: '#F97316' }}
                    thumbColor={state.inputs.isIntubated ? '#EA580C' : '#94A3B8'}
                  />
                </View>
              </View>

              {/* CARD B (LIVE FLUID RESUSCITATION & CURRERI COMPASS) */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="calculator-outline" size={22} color="#38BDF8" />
                  <ArabicText bold style={styles.cardTitle}>ب. متطلبات السوائل والإنعاش والتمثيل الغذائي</ArabicText>
                </View>

                <View style={styles.totalFluidPanel}>
                  <ArabicText style={styles.totalFluidTitle}>إجمالي احتياج السوائل (Parkland 24h Target):</ArabicText>
                  <ArabicText bold style={styles.totalFluidValue}>
                    {state.calcResult.parklandFluidMl24h.toLocaleString('en-US', { minimumFractionDigits: 0 })} <Text style={{ fontSize: 16, fontWeight: 'normal' }}>مل/24 ساعة</Text>
                  </ArabicText>
                </View>

                <View style={styles.splitGrid}>
                  <View style={styles.splitBadge}>
                    <View style={styles.badgeHeader}>
                      <Ionicons name="time-outline" size={16} color="#FB923C" />
                      <ArabicText bold style={styles.badgeHeaderTitle}>أول 8 ساعات (50%)</ArabicText>
                    </View>
                    <ArabicText style={styles.badgeSubLabel}>مستهدف الضخ المتواصل:</ArabicText>
                    <ArabicText bold style={styles.badgeFluidValue}>
                      {state.calcResult.first8hFluidMl.toLocaleString('en-US')} <Text style={{ fontSize: 11, fontWeight: 'normal' }}>مل</Text>
                    </ArabicText>
                    <ArabicText style={styles.badgeHourlyRate}>
                      {(state.calcResult.first8hFluidMl / 8).toFixed(1)} ml/h
                    </ArabicText>
                  </View>

                  <View style={styles.splitBadge}>
                    <View style={styles.badgeHeader}>
                      <Ionicons name="hourglass-outline" size={16} color="#38BDF8" />
                      <ArabicText bold style={styles.badgeHeaderTitle}>16 ساعة المتبقية (50%)</ArabicText>
                    </View>
                    <ArabicText style={styles.badgeSubLabel}>مستهدف الضخ المتواصل:</ArabicText>
                    <ArabicText bold style={styles.badgeFluidValue}>
                      {state.calcResult.remaining16hFluidMl.toLocaleString('en-US')} <Text style={{ fontSize: 11, fontWeight: 'normal' }}>مل</Text>
                    </ArabicText>
                    <ArabicText style={styles.badgeHourlyRate}>
                      {(state.calcResult.remaining16hFluidMl / 16).toFixed(1)} ml/h
                    </ArabicText>
                  </View>
                </View>

                <View style={styles.metabolicGrid}>
                  <View style={styles.metabolicBadge}>
                    <ArabicText style={styles.metaLabel}>مستهدف كريري الحراري (Curreri Energy):</ArabicText>
                    <ArabicText bold style={styles.metaValue}>
                      {state.calcResult.curreriEnergyKcal24h.toLocaleString('en-US')} <Text style={{ fontSize: 12, fontWeight: 'normal' }}>سعرة / 24 ساعة</Text>
                    </ArabicText>
                  </View>

                  <View style={styles.metabolicBadge}>
                    <ArabicText style={styles.metaLabel}>مستهدف البروتين الإجباري (Protein Target):</ArabicText>
                    <ArabicText bold style={styles.metaValue}>
                      {state.calcResult.targetProteinGrams.toLocaleString('en-US')} <Text style={{ fontSize: 12, fontWeight: 'normal' }}>غرام / يوم (2.0g/kg)</Text>
                    </ArabicText>
                  </View>
                </View>

                <View style={styles.directivesViewport}>
                  <ArabicText bold style={styles.directivesTitle}>🔬 توجيهات والتحذيرات السريرية الطارئة:</ArabicText>
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
                          كل المؤشرات الحيوية ونسبة الحرق ضمن الحدود الفسيولوجية الطبيعية. لا قيود إضافية على سوائل Parkland.
                        </ArabicText>
                      </View>
                    )}
                  </ScrollView>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <>
            <InteractiveBodyMap
              onTBSAChange={handleBodyMapChange}
              initialTBSA={state.latestRecord?.tbsaPercentage ?? 0}
            />

            {/* CARD A (TRAUMA SURFACE PERCENTAGE WORKSPACE) */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="flame-outline" size={22} color="#F97316" />
                <ArabicText bold style={styles.cardTitle}>أ. مساحة الحرق ودرجة الإصابة</ArabicText>
              </View>

              {/* Slider input from 0 to 100% */}
              <View style={styles.sliderSection}>
                <View style={styles.sliderTextRow}>
                  <ArabicText style={styles.sliderLabel}>مساحة الحرق الكلية المقدرة (TBSA %):</ArabicText>
                  <ArabicText bold style={styles.sliderValueText}>
                    {state.inputs.tbsaPercentage}%
                  </ArabicText>
                </View>

                <View style={styles.sliderWrapper}>
                  <TouchableOpacity
                    style={styles.sliderMicroButton}
                    onPress={() => handleTbsaChange(state.inputs.tbsaPercentage - 1)}
                  >
                    <Text style={styles.sliderMicroButtonText}>-1%</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.sliderMicroButton}
                    onPress={() => handleTbsaChange(state.inputs.tbsaPercentage - 5)}
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
                      <View style={[styles.sliderTrackFill, { width: `${state.inputs.tbsaPercentage}%` }]} />
                    </View>
                    <View style={[styles.sliderTrackThumb, { left: `${state.inputs.tbsaPercentage}%` }]} />
                  </View>

                  <TouchableOpacity
                    style={styles.sliderMicroButton}
                    onPress={() => handleTbsaChange(state.inputs.tbsaPercentage + 5)}
                  >
                    <Text style={styles.sliderMicroButtonText}>+5%</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.sliderMicroButton}
                    onPress={() => handleTbsaChange(state.inputs.tbsaPercentage + 1)}
                  >
                    <Text style={styles.sliderMicroButtonText}>+1%</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Segmented layout picker for burnDegree */}
              <View style={styles.segmentedContainer}>
                <ArabicText style={styles.segmentedLabel}>درجة الحروق السائدة (Burn Degree):</ArabicText>
                <View style={styles.segmentsRow}>
                  {(['first', 'second', 'third', 'fourth'] as const).map((deg) => {
                    const labelMap = { first: 'الأولى', second: 'الثانية', third: 'الثالثة', fourth: 'الرابعة' };
                    const isSelected = state.inputs.burnDegree === deg;
                    return (
                      <TouchableOpacity
                        key={deg}
                        style={[styles.segmentButton, isSelected && styles.segmentButtonSelected]}
                        onPress={() => handleBurnDegreeChange(deg)}
                      >
                        <ArabicText style={[styles.segmentText, isSelected && styles.segmentTextSelected]}>
                          {labelMap[deg]}
                        </ArabicText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Interactive toggle switch for intubation */}
              <View style={styles.switchRow}>
                <ArabicText style={styles.switchLabel}>🚨 المريض خاضع للتنفس الاصطناعي (إصابة استنشاقية حادة)</ArabicText>
                <Switch
                  value={state.inputs.isIntubated}
                  onValueChange={handleIntubatedChange}
                  trackColor={{ false: '#334155', true: '#F97316' }}
                  thumbColor={state.inputs.isIntubated ? '#EA580C' : '#94A3B8'}
                />
              </View>
            </View>

            {/* CARD B (LIVE FLUID RESUSCITATION & CURRERI COMPASS) — mobile */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="calculator-outline" size={22} color="#38BDF8" />
                <ArabicText bold style={styles.cardTitle}>ب. متطلبات السوائل والإنعاش والتمثيل الغذائي</ArabicText>
              </View>

              <View style={styles.totalFluidPanel}>
                <ArabicText style={styles.totalFluidTitle}>إجمالي احتياج السوائل (Parkland 24h Target):</ArabicText>
                <ArabicText bold style={styles.totalFluidValue}>
                  {state.calcResult.parklandFluidMl24h.toLocaleString('en-US', { minimumFractionDigits: 0 })} <Text style={{ fontSize: 16, fontWeight: 'normal' }}>مل/24 ساعة</Text>
                </ArabicText>
              </View>

              <View style={styles.splitGrid}>
                <View style={styles.splitBadge}>
                  <View style={styles.badgeHeader}>
                    <Ionicons name="time-outline" size={16} color="#FB923C" />
                    <ArabicText bold style={styles.badgeHeaderTitle}>أول 8 ساعات (50%)</ArabicText>
                  </View>
                  <ArabicText style={styles.badgeSubLabel}>مستهدف الضخ المتواصل:</ArabicText>
                  <ArabicText bold style={styles.badgeFluidValue}>
                    {state.calcResult.first8hFluidMl.toLocaleString('en-US')} <Text style={{ fontSize: 11, fontWeight: 'normal' }}>مل</Text>
                  </ArabicText>
                  <ArabicText style={styles.badgeHourlyRate}>
                    {(state.calcResult.first8hFluidMl / 8).toFixed(1)} ml/h
                  </ArabicText>
                </View>

                <View style={styles.splitBadge}>
                  <View style={styles.badgeHeader}>
                    <Ionicons name="hourglass-outline" size={16} color="#38BDF8" />
                    <ArabicText bold style={styles.badgeHeaderTitle}>16 ساعة المتبقية (50%)</ArabicText>
                  </View>
                  <ArabicText style={styles.badgeSubLabel}>مستهدف الضخ المتواصل:</ArabicText>
                  <ArabicText bold style={styles.badgeFluidValue}>
                    {state.calcResult.remaining16hFluidMl.toLocaleString('en-US')} <Text style={{ fontSize: 11, fontWeight: 'normal' }}>مل</Text>
                  </ArabicText>
                  <ArabicText style={styles.badgeHourlyRate}>
                    {(state.calcResult.remaining16hFluidMl / 16).toFixed(1)} ml/h
                  </ArabicText>
                </View>
              </View>

              <View style={styles.metabolicGrid}>
                <View style={styles.metabolicBadge}>
                  <ArabicText style={styles.metaLabel}>مستهدف كريري الحراري (Curreri Energy):</ArabicText>
                  <ArabicText bold style={styles.metaValue}>
                    {state.calcResult.curreriEnergyKcal24h.toLocaleString('en-US')} <Text style={{ fontSize: 12, fontWeight: 'normal' }}>سعرة / 24 ساعة</Text>
                  </ArabicText>
                </View>

                <View style={styles.metabolicBadge}>
                  <ArabicText style={styles.metaLabel}>مستهدف البروتين الإجباري (Protein Target):</ArabicText>
                  <ArabicText bold style={styles.metaValue}>
                    {state.calcResult.targetProteinGrams.toLocaleString('en-US')} <Text style={{ fontSize: 12, fontWeight: 'normal' }}>غرام / يوم (2.0g/kg)</Text>
                  </ArabicText>
                </View>
              </View>

              <View style={styles.directivesViewport}>
                <ArabicText bold style={styles.directivesTitle}>🔬 توجيهات والتحذيرات السريرية الطارئة:</ArabicText>
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
                        كل المؤشرات الحيوية ونسبة الحرق ضمن الحدود الفسيولوجية الطبيعية. لا قيود إضافية على سوائل Parkland.
                      </ArabicText>
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          </>
        )}

        {/* CARD C (TRANSACTIVE COMMIT & CLINICAL LOCKOUT) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#10B981" />
            <ArabicText bold style={styles.cardTitle}>ج. التوقيع وتخزين الخطة الطبي (Card C)</ArabicText>
          </View>

          {/* Strict Transaction Lockout Warning/Justification overlay */}
          {isLockoutActive && (
            <View style={styles.lockoutWarningCard}>
              <Ionicons name="lock-closed" size={26} color="#EF4444" />
              <ArabicText bold style={styles.lockoutTitle}>⚠️ تم تفعيل قفل الأمان الغذائي والإنعاشي</ArabicText>
              <ArabicText style={styles.lockoutSubtitle}>
                نظراً لارتفاع نسبة الحرق عن 20%، يتطلب النظام كتابة تبرير سريري واضح ومصدق (15 حرفاً عربياً على الأقل) لفك القفل والحفظ.
              </ArabicText>

              <TextInputField
                label="التبرير الطبي المعتمد سريرياً لإنعاش سوائل الحروق الكبيرة"
                value={clinicalJustification}
                onChangeText={setClinicalJustification}
                multiline
                placeholder="اكتب التبرير هنا (مثال: تعويض السوائل للمريض ضروري لحمايته من الصدمة الوعائية...)"
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
            placeholder="مثال: د. عبدالرحمن الحربي"
            required
          />

          <Button
            title="اعتماد وحقن خطة إنعاش الحروق والهدم الأيضي"
            onPress={handleSavePlan}
            disabled={isCommitDisabled || !signature.trim()}
            loading={isSaving}
            variant={isLockoutActive ? 'danger' : 'primary'}
            icon={<Ionicons name="pulse" size={20} color="#F8FAFC" />}
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
    color: '#F97316',
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
    backgroundColor: '#F97316',
  },
  sliderTrackThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FB923C',
    borderWidth: 2,
    borderColor: '#F8FAFC',
    marginTop: -8,
    top: '50%',
    transform: [{ translateX: -8 }],
  },
  segmentedContainer: {
    marginBottom: spacing.md,
  },
  segmentedLabel: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: spacing.xs,
    textAlign: 'right',
  },
  segmentsRow: {
    flexDirection: 'row-reverse',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonSelected: {
    backgroundColor: '#F97316',
  },
  segmentText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  segmentTextSelected: {
    color: '#F8FAFC',
    fontWeight: 'bold',
  },
  totalFluidPanel: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
  },
  totalFluidTitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 4,
  },
  totalFluidValue: {
    fontSize: 26,
    color: '#34D399',
    fontFamily: fontFamilies.bold,
  },
  splitGrid: {
    flexDirection: 'row-reverse',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  splitBadge: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  badgeHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  badgeHeaderTitle: {
    fontSize: 11,
    color: '#F8FAFC',
  },
  badgeSubLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginBottom: 2,
  },
  badgeFluidValue: {
    fontSize: 16,
    color: '#FB923C',
  },
  badgeHourlyRate: {
    fontSize: 12,
    color: '#38BDF8',
    marginTop: 2,
    fontWeight: 'bold',
  },
  metabolicGrid: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metabolicBadge: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  metaValue: {
    fontSize: 14,
    color: '#38BDF8',
    fontWeight: 'bold',
  },
  directivesViewport: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
    maxHeight: 200,
  },
  directivesTitle: {
    fontSize: 13,
    color: '#F97316',
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
  desktopRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  desktopMapPane: {
    flex: 1,
    minWidth: 280,
  },
  desktopInputPane: {
    flex: 1.5,
    minWidth: 300,
  },
  commitButton: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
  },
});
