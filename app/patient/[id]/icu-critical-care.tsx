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

// Models
import Patient from '../../../src/data/models/Patient';
import VitalsRecord from '../../../src/data/models/VitalsRecord';

// Domain engines
import { IcuCriticalCareEngine } from '../../../src/domain/calculators/IcuCriticalCareEngine';
import { TpnCompoundingEngine } from '../../../src/domain/calculators/TpnCompoundingEngine';
import { ClinicalConflictResolver } from '../../../src/domain/calculators/ClinicalConflictResolver';
import { calculateBmr } from '../../../src/domain/calculators/BmrCalculator';

// Presentation / Design System
import { colors, spacing, safeHeaderPaddingTop, fontFamilies } from '../../../src/presentation/theme';
import ArabicText from '../../../src/presentation/components/ArabicText';
import TextInputField from '../../../src/presentation/components/TextInputField';
import Button from '../../../src/presentation/components/Button';
import { usePatientStore } from '../../../src/presentation/stores/patientStore';
import { useToastStore } from '../../../src/presentation/stores/toastStore';
import { useAuthStore } from '../../../src/presentation/stores/authStore';

interface IcuState {
  patient: Patient | null;
  vitals: VitalsRecord | null;
  mifflinRmr: number;
  icuResult: any;
  tpnResult: any;
  conflictResult: any;
  inputs: {
    isMechanicallyVentilated: boolean;
    maxTemperatureCelsius: number;
    minuteVentilationLmin: number;
    refeedingRiskLevel: 'low' | 'moderate' | 'high';
    aminoAcidGrams: number;
    dextroseGrams: number;
    lipidGrams: number;
    sodiumMeq: number;
    potassiumMeq: number;
    totalFluidVolumeMl: number;
    ckd: boolean;
    chf: boolean;
    burns: boolean;
  };
}

export default function IcuCriticalCareScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const showToast = useToastStore((s) => s.showToast);
  const currentUser = useAuthStore((s) => s.user);

  // Specialist signature & justification states
  const [clinicalJustification, setClinicalJustification] = useState('');
  const [signature, setSignature] = useState(currentUser?.fullName || '');
  const [isSaving, setIsSaving] = useState(false);

  // Local React states for text inputs to prevent focus jumping/lag while typing
  const [tempText, setTempText] = useState('37.0');
  const [mvText, setMvText] = useState('6.0');
  const [aaText, setAaText] = useState('80');
  const [dexText, setDexText] = useState('150');
  const [lipText, setLipText] = useState('50');
  const [naText, setNaText] = useState('70');
  const [kText, setKText] = useState('40');
  const [fluidText, setFluidText] = useState('2000');

  // Initialize signature when auth hydrates
  useEffect(() => {
    if (currentUser?.fullName) {
      setSignature(currentUser.fullName);
    }
  }, [currentUser]);

  // 1. Enforce BehaviorSubjects for all clinical inputs
  const input$ = useMemo(() => ({
    isMechanicallyVentilated: new BehaviorSubject<boolean>(false),
    maxTemperatureCelsius: new BehaviorSubject<number>(37.0),
    minuteVentilationLmin: new BehaviorSubject<number>(6.0),
    refeedingRiskLevel: new BehaviorSubject<'low' | 'moderate' | 'high'>('low'),
    aminoAcidGrams: new BehaviorSubject<number>(80),
    dextroseGrams: new BehaviorSubject<number>(150),
    lipidGrams: new BehaviorSubject<number>(50),
    sodiumMeq: new BehaviorSubject<number>(70),
    potassiumMeq: new BehaviorSubject<number>(40),
    totalFluidVolumeMl: new BehaviorSubject<number>(2000),
    ckd: new BehaviorSubject<boolean>(false),
    chf: new BehaviorSubject<boolean>(false),
    burns: new BehaviorSubject<boolean>(false),
  }), []);

  // 2. Reactive Stream Consolidation inside combineLatest
  const calculations$ = useMemo((): Observable<IcuState> => {
    const patient$ = watchRecord<Patient>('patients', patientId);
    
    const vitals$ = watchQuery<VitalsRecord>((db) => {
      return db.get('vitals_records').query(
        Q.where('patient_id', patientId),
        Q.sortBy('created_at', 'desc')
      );
    }).pipe(
      map(records => records.length > 0 ? records[0] : null)
    );

    return combineLatest([
      patient$,
      vitals$,
      input$.isMechanicallyVentilated,
      input$.maxTemperatureCelsius,
      input$.minuteVentilationLmin,
      input$.refeedingRiskLevel,
      input$.aminoAcidGrams,
      input$.dextroseGrams,
      input$.lipidGrams,
      input$.sodiumMeq,
      input$.potassiumMeq,
      input$.totalFluidVolumeMl,
      input$.ckd,
      input$.chf,
      input$.burns,
    ]).pipe(
      map(([p, vitals, vent, temp, mv, refeed, aa, dex, lip, na, k, fluid, ckd, chf, burns]) => {
        const wt = vitals?.weightKg ?? vitals?.weight ?? 70;
        const ht = vitals?.heightCm ?? vitals?.height ?? 170;
        const age = p?.age ?? 40;
        const isMale = p?.gender === 'male';

        let mifflinRmrVal = 10 * wt + 6.25 * ht - 5 * age + (isMale ? 5 : -161);
        try {
          mifflinRmrVal = calculateBmr(wt, ht, age, isMale).value;
        } catch (e) {}

        const icuResult = IcuCriticalCareEngine.evaluateIcuNutrition({
          mifflinRmr: mifflinRmrVal,
          isMechanicallyVentilated: vent,
          maxTemperatureCelsius: temp,
          minuteVentilationLmin: mv,
          refeedingRiskLevel: refeed,
        });

        const tpnResult = TpnCompoundingEngine.calculateTpnRequirements({
          aminoAcidGrams: aa,
          dextroseGrams: dex,
          lipidGrams: lip,
          sodiumMeq: na,
          potassiumMeq: k,
          totalFluidVolumeMl: fluid,
        });

        const list: any[] = [
          {
            conditionCode: 'ICU_TPN_PLAN',
            priorityScore: 90,
            suggestedFluidMl: fluid,
            suggestedProteinGrams: aa,
            isOverrideAllowed: true,
          }
        ];

        if (burns) {
          list.push({
            conditionCode: 'BURNS',
            priorityScore: 95,
            suggestedFluidMl: 4000,
            suggestedProteinGrams: 150,
            isOverrideAllowed: true,
          });
        }

        if (ckd) {
          list.push({
            conditionCode: 'CKD',
            priorityScore: 80,
            suggestedFluidMl: 1000,
            suggestedProteinGrams: 45,
            isOverrideAllowed: false,
          });
        }

        if (chf) {
          list.push({
            conditionCode: 'CHF',
            priorityScore: 85,
            suggestedFluidMl: 1500,
            suggestedProteinGrams: 60,
            isOverrideAllowed: false,
          });
        }

        const conflictResult = ClinicalConflictResolver.resolveComorbidConflicts({
          activeConditions: list,
        });

        return {
          patient: p,
          vitals,
          mifflinRmr: mifflinRmrVal,
          icuResult,
          tpnResult,
          conflictResult,
          inputs: {
            isMechanicallyVentilated: vent,
            maxTemperatureCelsius: temp,
            minuteVentilationLmin: mv,
            refeedingRiskLevel: refeed,
            aminoAcidGrams: aa,
            dextroseGrams: dex,
            lipidGrams: lip,
            sodiumMeq: na,
            potassiumMeq: k,
            totalFluidVolumeMl: fluid,
            ckd,
            chf,
            burns,
          }
        };
      })
    );
  }, [patientId, input$]);

  // 3. Consume consolidated state via useObservable hook
  const state = useObservable<IcuState>(calculations$, {
    patient: null,
    vitals: null,
    mifflinRmr: 1500,
    icuResult: {
      icuEnergyTarget: 0,
      initialCaloricCeiling: 0,
      isRefeedingRestrictionEnforced: false,
      arabicClinicalAlerts: [],
    },
    tpnResult: {
      calculatedOsmolarityMosmL: 0,
      recommendedRoute: 'peripheral',
      arabicClinicalAlerts: [],
    },
    conflictResult: {
      governingConditionCode: '',
      resolvedFluidMl: 2000,
      resolvedProteinGrams: 80,
      requiresMultidisciplinarySignOff: false,
      arabicResolutionDirectives: [],
    },
    inputs: {
      isMechanicallyVentilated: false,
      maxTemperatureCelsius: 37.0,
      minuteVentilationLmin: 6.0,
      refeedingRiskLevel: 'low',
      aminoAcidGrams: 80,
      dextroseGrams: 150,
      lipidGrams: 50,
      sodiumMeq: 70,
      potassiumMeq: 40,
      totalFluidVolumeMl: 2000,
      ckd: false,
      chf: false,
      burns: false,
    }
  });

  // Sync initial values from database
  const isInitializedRef = useRef(false);
  useEffect(() => {
    if (state.patient && !isInitializedRef.current) {
      isInitializedRef.current = true;
      const p = state.patient;
      const diag = (p.primaryDiagnosis || '').toLowerCase();
      const notes = (p.notes || '').toLowerCase();
      const hasCkd = diag.includes('ckd') || diag.includes('renal') || diag.includes('كلوي') || notes.includes('كلوي');
      const hasChf = diag.includes('heart') || diag.includes('chf') || diag.includes('قلب') || notes.includes('قلب');
      const hasBurns = diag.includes('burn') || diag.includes('حروق') || notes.includes('حروق');

      input$.ckd.next(hasCkd);
      input$.chf.next(hasChf);
      input$.burns.next(hasBurns);

      // Pre-populate input values from patient notes if available
      try {
        const parsed = JSON.parse(p.notes || '{}');
        if (parsed.icuCriticalCareSettings) {
          const settings = parsed.icuCriticalCareSettings;
          input$.isMechanicallyVentilated.next(settings.isMechanicallyVentilated || false);
          input$.refeedingRiskLevel.next(settings.refeedingRiskLevel || 'low');
          
          if (settings.maxTemperatureCelsius) {
            input$.maxTemperatureCelsius.next(settings.maxTemperatureCelsius);
            setTempText(String(settings.maxTemperatureCelsius));
          }
          if (settings.minuteVentilationLmin) {
            input$.minuteVentilationLmin.next(settings.minuteVentilationLmin);
            setMvText(String(settings.minuteVentilationLmin));
          }
          if (settings.aminoAcidGrams) {
            input$.aminoAcidGrams.next(settings.aminoAcidGrams);
            setAaText(String(settings.aminoAcidGrams));
          }
          if (settings.dextroseGrams) {
            input$.dextroseGrams.next(settings.dextroseGrams);
            setDexText(String(settings.dextroseGrams));
          }
          if (settings.lipidGrams) {
            input$.lipidGrams.next(settings.lipidGrams);
            setLipText(String(settings.lipidGrams));
          }
          if (settings.sodiumMeq) {
            input$.sodiumMeq.next(settings.sodiumMeq);
            setNaText(String(settings.sodiumMeq));
          }
          if (settings.potassiumMeq) {
            input$.potassiumMeq.next(settings.potassiumMeq);
            setKText(String(settings.potassiumMeq));
          }
          if (settings.totalFluidVolumeMl) {
            input$.totalFluidVolumeMl.next(settings.totalFluidVolumeMl);
            setFluidText(String(settings.totalFluidVolumeMl));
          }
        }
      } catch (e) {}
    }
  }, [state.patient, input$]);

  useEffect(() => {
    if (state.vitals && !isInitializedRef.current) {
      if (state.vitals.temperature) {
        input$.maxTemperatureCelsius.next(state.vitals.temperature);
        setTempText(String(state.vitals.temperature));
      }
    }
  }, [state.vitals, input$]);

  // Handle Input Changes
  const handleVentChange = (val: boolean) => {
    input$.isMechanicallyVentilated.next(val);
  };
  const handleTempChange = (val: string) => {
    setTempText(val);
    input$.maxTemperatureCelsius.next(parseFloat(val) || 37.0);
  };
  const handleMvChange = (val: string) => {
    setMvText(val);
    input$.minuteVentilationLmin.next(parseFloat(val) || 6.0);
  };
  const handleRefeedChange = (val: 'low' | 'moderate' | 'high') => {
    input$.refeedingRiskLevel.next(val);
  };
  const handleAaChange = (val: string) => {
    setAaText(val);
    input$.aminoAcidGrams.next(parseFloat(val) || 0);
  };
  const handleDexChange = (val: string) => {
    setDexText(val);
    input$.dextroseGrams.next(parseFloat(val) || 0);
  };
  const handleLipChange = (val: string) => {
    setLipText(val);
    input$.lipidGrams.next(parseFloat(val) || 0);
  };
  const handleNaChange = (val: string) => {
    setNaText(val);
    input$.sodiumMeq.next(parseFloat(val) || 0);
  };
  const handleKChange = (val: string) => {
    setKText(val);
    input$.potassiumMeq.next(parseFloat(val) || 0);
  };
  const handleFluidChange = (val: string) => {
    setFluidText(val);
    input$.totalFluidVolumeMl.next(parseFloat(val) || 0);
  };
  const handleCkdChange = (val: boolean) => {
    input$.ckd.next(val);
  };
  const handleChfChange = (val: boolean) => {
    input$.chf.next(val);
  };
  const handleBurnsChange = (val: boolean) => {
    input$.burns.next(val);
  };

  // Lockout logic
  const isLockoutActive = useMemo(() => {
    return state.conflictResult.requiresMultidisciplinarySignOff || state.inputs.refeedingRiskLevel === 'high';
  }, [state.conflictResult.requiresMultidisciplinarySignOff, state.inputs.refeedingRiskLevel]);

  const isCommitDisabled = useMemo(() => {
    if (isLockoutActive) {
      return clinicalJustification.trim().length < 15;
    }
    return false;
  }, [isLockoutActive, clinicalJustification]);

  // Secure write transaction persistency
  const handleSavePlan = async () => {
    if (isCommitDisabled) {
      showToast('خطأ: التبرير السريري غير كافٍ لتمرير خطة الأمان الكلوية / متلازمة إعادة التغذية', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const db = await getDatabase();

      await db.write(async () => {
        const patientRecord = await db.get<Patient>('patients').find(patientId);
        const auditLogCollection = db.get('audit_logs');

        const icuCriticalCareSettings = {
          isMechanicallyVentilated: state.inputs.isMechanicallyVentilated,
          maxTemperatureCelsius: state.inputs.maxTemperatureCelsius,
          minuteVentilationLmin: state.inputs.minuteVentilationLmin,
          refeedingRiskLevel: state.inputs.refeedingRiskLevel,
          aminoAcidGrams: state.inputs.aminoAcidGrams,
          dextroseGrams: state.inputs.dextroseGrams,
          lipidGrams: state.inputs.lipidGrams,
          sodiumMeq: state.inputs.sodiumMeq,
          potassiumMeq: state.inputs.potassiumMeq,
          totalFluidVolumeMl: state.inputs.totalFluidVolumeMl,
          calculatedOsmolarityMosmL: state.tpnResult.calculatedOsmolarityMosmL,
          recommendedRoute: state.tpnResult.recommendedRoute,
          governingConditionCode: state.conflictResult.governingConditionCode,
          requiresMultidisciplinarySignOff: state.conflictResult.requiresMultidisciplinarySignOff,
          clinicalJustification: clinicalJustification.trim(),
          signature: signature.trim(),
          timestamp: new Date().toISOString(),
        };

        await patientRecord.update((record) => {
          let currentNotesObj: any = {};
          try {
            currentNotesObj = JSON.parse(record.notes || '{}');
          } catch (e) {
            currentNotesObj = { legacyNotes: record.notes || '' };
          }
          currentNotesObj.icuCriticalCareSettings = icuCriticalCareSettings;
          record.notes = JSON.stringify(currentNotesObj);
        });

        await auditLogCollection.create((record: any) => {
          record.actionType = 'icu_critical_care_simulation_audit';
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
            icuCriticalCareSettings,
          });
        });
      });

      showToast('تم اعتماد وحقن خطة الرعاية الحرجة بنجاح في قاعدة البيانات', 'success');
      router.back();
    } catch (error) {
      console.error('Failed to commit ICU care plan:', error);
      showToast('فشل حفظ وتوثيق الجلسة الحرجة بقاعدة البيانات', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (state.patient === null) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#38BDF8" />
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
        <ArabicText bold style={styles.headerTitle}>محاكي الرعاية الحرجة والتغذية الوريدية</ArabicText>
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
              <ArabicText style={styles.demoLabel}>خط Mifflin RMR:</ArabicText>
              <ArabicText style={styles.demoValue}>{state.mifflinRmr} سعرة</ArabicText>
            </View>
          </View>
        </View>

        {/* CARD A (ICU METABOLIC VENTILATOR COMPASS) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="speedometer-outline" size={22} color="#38BDF8" />
            <ArabicText bold style={styles.cardTitle}>أ. مقياس الأيض والتهوية الرئوية (Card A)</ArabicText>
          </View>

          <View style={styles.switchRow}>
            <ArabicText style={styles.switchLabel}>🚨 المريض تحت التنفس الاصطناعي</ArabicText>
            <Switch
              value={state.inputs.isMechanicallyVentilated}
              onValueChange={handleVentChange}
              trackColor={{ false: '#334155', true: '#38BDF8' }}
              thumbColor={state.inputs.isMechanicallyVentilated ? '#0284C7' : '#94A3B8'}
            />
          </View>

          <TextInputField
            label="أقصى درجة حرارة مسجلة (°م)"
            value={tempText}
            onChangeText={handleTempChange}
            keyboardType="decimal-pad"
            placeholder="مثال: 37.5"
          />

          {state.inputs.isMechanicallyVentilated && (
            <TextInputField
              label="حجم التهوية الدقيقة (لتر/دقيقة)"
              value={mvText}
              onChangeText={handleMvChange}
              keyboardType="decimal-pad"
              placeholder="مثال: 6.5"
            />
          )}

          <View style={styles.segmentedContainer}>
            <ArabicText style={styles.segmentedLabel}>مستوى خطر إعادة التغذية (Refeeding Risk)</ArabicText>
            <View style={styles.segmentsRow}>
              {(['low', 'moderate', 'high'] as const).map((level) => {
                const labelMap = { low: 'منخفض', moderate: 'متوسط', high: 'مرتفع' };
                const isSelected = state.inputs.refeedingRiskLevel === level;
                return (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.segmentButton,
                      isSelected && styles.segmentButtonSelected,
                      isSelected && level === 'high' && styles.segmentButtonHigh,
                      isSelected && level === 'moderate' && styles.segmentButtonMod,
                    ]}
                    onPress={() => handleRefeedChange(level)}
                  >
                    <ArabicText
                      style={[
                        styles.segmentText,
                        isSelected && styles.segmentTextSelected,
                      ]}
                    >
                      {labelMap[level]}
                    </ArabicText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ICU Nutrition Outputs */}
          <View style={styles.outputsContainer}>
            <View style={styles.outputBadge}>
              <ArabicText style={styles.badgeLabel}>الهدف الطاقي المستهدف (Energy Target):</ArabicText>
              <View style={styles.badgeValueContainer}>
                <ArabicText bold style={styles.badgeValue}>
                  {state.icuResult.icuEnergyTarget} سعرة / يوم
                </ArabicText>
              </View>
            </View>

            <View style={[styles.outputBadge, state.icuResult.isRefeedingRestrictionEnforced && styles.badgeWarning]}>
              <ArabicText style={styles.badgeLabel}>السقف الكالوري الابتدائي (Initial Ceiling):</ArabicText>
              <View style={styles.badgeValueContainer}>
                <ArabicText bold style={[styles.badgeValue, state.icuResult.isRefeedingRestrictionEnforced && styles.textWarning]}>
                  {state.icuResult.initialCaloricCeiling} سعرة / يوم
                </ArabicText>
              </View>
            </View>
          </View>

          {state.icuResult.arabicClinicalAlerts.map((alert: string, index: number) => (
            <View key={index} style={styles.alertBox}>
              <Ionicons name="warning-outline" size={18} color="#FB7185" />
              <ArabicText style={styles.alertText}>{alert}</ArabicText>
            </View>
          ))}
        </View>

        {/* CARD B (TPN LIQUID & ELECTROLTYE LAB) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="beaker-outline" size={22} color="#34D399" />
            <ArabicText bold style={styles.cardTitle}>ب. مختبر السوائل والأملاح والـ TPN (Card B)</ArabicText>
          </View>

          <View style={styles.denseGrid}>
            <View style={styles.gridCol}>
              <TextInputField
                label="الأحماض الأمينية (g AA)"
                value={aaText}
                onChangeText={handleAaChange}
                keyboardType="decimal-pad"
              />
              <TextInputField
                label="الدهون (g Lipids)"
                value={lipText}
                onChangeText={handleLipChange}
                keyboardType="decimal-pad"
              />
              <TextInputField
                label="البوتاسيوم (mEq K)"
                value={kText}
                onChangeText={handleKChange}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.gridCol}>
              <TextInputField
                label="الدكستروز (g Dextrose)"
                value={dexText}
                onChangeText={handleDexChange}
                keyboardType="decimal-pad"
              />
              <TextInputField
                label="الصوديوم (mEq Na)"
                value={naText}
                onChangeText={handleNaChange}
                keyboardType="decimal-pad"
              />
              <TextInputField
                label="حجم السائل الكلي (mL Fluid)"
                value={fluidText}
                onChangeText={handleFluidChange}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.telemetryPanel}>
            <ArabicText style={styles.telemetryLabel}>أسمولية المحلول الكلية (Calculated Osmolarity):</ArabicText>
            <ArabicText bold style={styles.telemetryValue}>
              {state.tpnResult.calculatedOsmolarityMosmL} <Text style={{ fontSize: 14, fontWeight: 'normal' }}>mOsm/L</Text>
            </ArabicText>

            {state.tpnResult.recommendedRoute === 'central_line' ? (
              <View style={styles.routeBadgeCentral}>
                <Ionicons name="alert-circle" size={18} color="#EF4444" />
                <ArabicText bold style={styles.routeBadgeTextCentral}>
                  ⚠️ خط وريدي مركزي إلزامي (CVC)
                </ArabicText>
              </View>
            ) : (
              <View style={styles.routeBadgePeripheral}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <ArabicText bold style={styles.routeBadgeTextPeripheral}>
                  ✅ خط وريدي طرفي آمن
                </ArabicText>
              </View>
            )}
          </View>

          {state.tpnResult.arabicClinicalAlerts.map((alert: string, index: number) => (
            <View key={index} style={styles.alertBox}>
              <Ionicons name="information-circle-outline" size={18} color="#34D399" />
              <ArabicText style={styles.alertText}>{alert}</ArabicText>
            </View>
          ))}
        </View>

        {/* CARD C (COMORBIDITY ARBITRATION BOARD & SAVE LOCKOUT) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="git-branch-outline" size={22} color="#818CF8" />
            <ArabicText bold style={styles.cardTitle}>ج. مجلس موازنة الأمراض المصاحبة وقفل الحفظ (Card C)</ArabicText>
          </View>

          <ArabicText style={styles.sectionSubtitle}>تحديد الأمراض المصاحبة النشطة لتجنب التعارض:</ArabicText>

          <View style={styles.comorbidityToggles}>
            <View style={styles.comorbidityRow}>
              <ArabicText style={styles.comorbidityLabel}>الفشل الكلوي المزمن (CKD - قيود بروتين وسوائل)</ArabicText>
              <Switch
                value={state.inputs.ckd}
                onValueChange={handleCkdChange}
                trackColor={{ false: '#334155', true: '#818CF8' }}
                thumbColor={state.inputs.ckd ? '#4F46E5' : '#94A3B8'}
              />
            </View>

            <View style={styles.comorbidityRow}>
              <ArabicText style={styles.comorbidityLabel}>فشل القلب الاحتقاني (CHF - قيود سوائل شديدة)</ArabicText>
              <Switch
                value={state.inputs.chf}
                onValueChange={handleChfChange}
                trackColor={{ false: '#334155', true: '#818CF8' }}
                thumbColor={state.inputs.chf ? '#4F46E5' : '#94A3B8'}
              />
            </View>

            <View style={styles.comorbidityRow}>
              <ArabicText style={styles.comorbidityLabel}>حروق بليغة حادة (Acute Burns - احتياج سوائل عالي)</ArabicText>
              <Switch
                value={state.inputs.burns}
                onValueChange={handleBurnsChange}
                trackColor={{ false: '#334155', true: '#818CF8' }}
                thumbColor={state.inputs.burns ? '#4F46E5' : '#94A3B8'}
              />
            </View>
          </View>

          {/* Scrolling Viewport Container for Arabic emergency directives */}
          <View style={styles.directivesViewport}>
            <ArabicText bold style={styles.directivesTitle}>🔬 توجيهات حل التعارض والامتثال الطبي:</ArabicText>
            <ScrollView nestedScrollEnabled style={styles.directivesScroll}>
              <View style={styles.arbitrationStats}>
                <ArabicText style={styles.statLine}>
                  الحالة السائدة (Governing Condition):{' '}
                  <Text style={{ fontWeight: 'bold', color: '#818CF8' }}>
                    {state.conflictResult.governingConditionCode || 'خطة ICU التغذوية الكلية'}
                  </Text>
                </ArabicText>
                <ArabicText style={styles.statLine}>
                  توصية السائل الآمنة: {state.conflictResult.resolvedFluidMl} مل/يوم
                </ArabicText>
                <ArabicText style={styles.statLine}>
                  توصية البروتين الآمنة: {state.conflictResult.resolvedProteinGrams} جرام/يوم
                </ArabicText>
              </View>

              {state.conflictResult.arabicResolutionDirectives.map((directive: string, index: number) => (
                <View key={index} style={styles.directiveRow}>
                  <Ionicons
                    name={state.conflictResult.requiresMultidisciplinarySignOff ? "shield-outline" : "shield-checkmark"}
                    size={20}
                    color={state.conflictResult.requiresMultidisciplinarySignOff ? "#EF4444" : "#10B981"}
                  />
                  <ArabicText style={styles.directiveText}>{directive}</ArabicText>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Enforce Strict Transaction Lockout Justification overlays */}
          {isLockoutActive && (
            <View style={styles.lockoutWarningCard}>
              <Ionicons name="lock-closed" size={24} color="#EF4444" />
              <ArabicText bold style={styles.lockoutTitle}>⚠️ تفعيل قفل الأمان الغذائي المتكامل</ArabicText>
              <ArabicText style={styles.lockoutSubtitle}>
                يتطلب إقرار هذه الخطة كتابة مبرر سريري مقنع (15 حرفاً عربياً على الأقل) وتأكيد التوقيع.
              </ArabicText>

              <TextInputField
                label="التبرير الطبي المعتمد سريرياً"
                value={clinicalJustification}
                onChangeText={setClinicalJustification}
                multiline
                placeholder="اكتب التبرير هنا (مثال: تعويض السوائل للمريض ضروري لإنقاص النسبة المرتفعة من...)"
              />
              <Text style={[styles.charCounter, clinicalJustification.trim().length >= 15 ? styles.counterOk : styles.counterErr]}>
                عدد الحروف الحالي: {clinicalJustification.trim().length} / 15
              </Text>
            </View>
          )}

          <TextInputField
            label="اسم وتوقيع الأخصائي المعتمد"
            value={signature}
            onChangeText={setSignature}
            placeholder="مثال: د. أحمد الرويلي"
            required
          />

          <Button
            title="اعتماد وحقن خطة الرعاية الحرجة (ICU Plan)"
            onPress={handleSavePlan}
            disabled={isCommitDisabled || !signature.trim()}
            loading={isSaving}
            variant={isLockoutActive ? "danger" : "primary"}
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
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
  },
  switchLabel: {
    fontSize: 14,
    color: '#F8FAFC',
  },
  segmentedContainer: {
    marginBottom: spacing.md,
  },
  segmentedLabel: {
    fontSize: 14,
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
    backgroundColor: '#334155',
  },
  segmentButtonHigh: {
    backgroundColor: '#EF4444',
  },
  segmentButtonMod: {
    backgroundColor: '#D97706',
  },
  segmentText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  segmentTextSelected: {
    color: '#F8FAFC',
    fontWeight: 'bold',
  },
  outputsContainer: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  outputBadge: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: spacing.sm,
    flexDirection: 'column',
    borderWidth: 1,
    borderColor: '#334155',
  },
  badgeWarning: {
    borderColor: '#EF4444',
    backgroundColor: '#450A0A',
  },
  badgeLabel: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'right',
    marginBottom: 4,
  },
  badgeValueContainer: {
    alignItems: 'flex-end',
  },
  badgeValue: {
    fontSize: 16,
    color: '#38BDF8',
  },
  textWarning: {
    color: '#F87171',
  },
  alertBox: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    backgroundColor: '#450A0A',
    borderColor: '#7F1D1D',
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.sm,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  alertText: {
    flex: 1,
    fontSize: 12,
    color: '#FCA5A5',
    textAlign: 'right',
    lineHeight: 18,
  },
  denseGrid: {
    flexDirection: 'row-reverse',
    gap: spacing.md,
  },
  gridCol: {
    flex: 1,
  },
  telemetryPanel: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
  },
  telemetryLabel: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: spacing.xs,
  },
  telemetryValue: {
    fontSize: 28,
    color: '#34D399',
    marginBottom: spacing.sm,
  },
  routeBadgeCentral: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#450A0A',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    gap: spacing.xs,
  },
  routeBadgeTextCentral: {
    fontSize: 12,
    color: '#EF4444',
  },
  routeBadgePeripheral: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#10B981',
    gap: spacing.xs,
  },
  routeBadgeTextPeripheral: {
    fontSize: 12,
    color: '#10B981',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  comorbidityToggles: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  comorbidityRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  comorbidityLabel: {
    fontSize: 12,
    color: '#F8FAFC',
    flex: 1,
    textAlign: 'right',
    paddingRight: 6,
  },
  directivesViewport: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
    maxHeight: 220,
    marginBottom: spacing.md,
  },
  directivesTitle: {
    fontSize: 13,
    color: '#818CF8',
    textAlign: 'right',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 4,
    marginBottom: spacing.xs,
  },
  directivesScroll: {
    flex: 1,
  },
  arbitrationStats: {
    backgroundColor: '#1E293B',
    borderRadius: 6,
    padding: spacing.xs,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statLine: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'right',
    marginBottom: 2,
  },
  directiveRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  directiveText: {
    flex: 1,
    fontSize: 12,
    color: '#E2E8F0',
    textAlign: 'right',
    lineHeight: 18,
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
