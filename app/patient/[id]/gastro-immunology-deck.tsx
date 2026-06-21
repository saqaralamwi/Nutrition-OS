import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  TextInput, Platform, KeyboardAvoidingView, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Q } from '@nozbe/watermelondb';

// Database & Observe
import { getDatabase } from '../../../src/data/database';
import { watchQuery, watchRecord } from '../../../src/data/database/observe';
import { useObservable } from '../../../src/presentation/hooks/useObservable';

// Domain engines
import { GlutenIsolationEngine } from '../../../src/domain/calculators/GlutenIsolationEngine';
import { LowFodmapEngine } from '../../../src/domain/calculators/LowFodmapEngine';
import { GastroHighLossEngine } from '../../../src/domain/calculators/GastroHighLossEngine';
import { MilkAllergenEngine } from '../../../src/domain/calculators/MilkAllergenEngine';

// Models & Types
import Patient from '../../../src/data/models/Patient';
import type GastrointestinalAssessment from '../../../src/data/models/GastrointestinalAssessment';
import type { GlutenDiagnosis, FodmapDiagnosis, MilkAllergyType, AnatomicalSource } from '../../../src/data/types/gastrointestinal';
import { colors, spacing, fontFamilies, fontSizes, safeHeaderPaddingTop } from '../../../src/presentation/theme';

interface GastroState {
  patient: Patient | null;
  assessment: GastrointestinalAssessment | null;
  glutenResult: any;
  fodmapResult: any;
  highLossResult: any;
  milkResult: any;
  isSevereCrisis: boolean;
  allAlerts: string[];
  inputs: {
    glutenDiagnosis: GlutenDiagnosis;
    fodmapDiagnosis: FodmapDiagnosis;
    milkAllergyType: MilkAllergyType;
    isReintroductionPhase: boolean;
    fistulaOutputMl24h: number;
    anatomicalSource: AnatomicalSource;
    scannerText: string;
  };
}

const GLUTEN_OPTIONS: { label: string; value: GlutenDiagnosis }[] = [
  { label: 'داء السيلياك', value: 'celiac_disease' },
  { label: 'حساسية القمح', value: 'wheat_allergy' },
  { label: 'لا يوجد', value: 'none' },
];

const FODMAP_OPTIONS: { label: string; value: FodmapDiagnosis }[] = [
  { label: 'القولون العصبي (IBS)', value: 'IBS' },
  { label: 'التهاب أمعاء نشط (IBD)', value: 'IBD_active' },
  { label: 'لا يوجد', value: 'none' },
];

const MILK_OPTIONS: { label: string; value: MilkAllergyType }[] = [
  { label: 'حساسية بروتين الحليب (CMPA)', value: 'cow_milk_protein_allergy' },
  { label: 'عدم تحمل اللاكتوز', value: 'lactose_intolerance' },
  { label: 'لا يوجد', value: 'none' },
];

const SOURCE_OPTIONS: { label: string; value: AnatomicalSource }[] = [
  { label: 'معدي', value: 'gastric' },
  { label: 'عفجي', value: 'duodenal' },
  { label: 'صائمي/لفائفي', value: 'jejunal_ileal' },
  { label: 'فغر القولون', value: 'colostomy' },
];

function OptionPicker<T extends string>({
  options, selected, onSelect, label,
}: {
  options: { label: string; value: T }[];
  selected: T;
  onSelect: (v: T) => void;
  label: string;
}) {
  return (
    <View style={styles.pickerGroup}>
      <Text style={styles.pickerLabel}>{label}</Text>
      <View style={styles.pickerRow}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.pickerOption,
              selected === opt.value && styles.pickerOptionActive,
            ]}
            onPress={() => onSelect(opt.value)}
          >
            <Text
              style={[
                styles.pickerOptionText,
                selected === opt.value && styles.pickerOptionTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function AlertBlock({ alerts }: { alerts: string[] }) {
  if (alerts.length === 0) return null;
  return (
    <View style={styles.alertContainer}>
      {alerts.map((alert, i) => (
        <View key={i} style={styles.alertRow}>
          <Ionicons name="warning" size={16} color="#FCA5A5" />
          <Text style={styles.alertText}>{alert}</Text>
        </View>
      ))}
    </View>
  );
}

export default function GastroImmunologyDeckScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Lockout inputs & saving states
  const [clinicalJustification, setClinicalJustification] = useState('');
  const [saving, setSaving] = useState(false);

  // Local React state for input buffering to avoid focus lag while typing
  const [fistulaOutputText, setFistulaOutputText] = useState('');
  const [scannerText, setScannerText] = useState('');

  // 1. Enforce RxJS BehaviorSubjects for inputs
  const input$ = useMemo(() => ({
    glutenDiagnosis: new BehaviorSubject<GlutenDiagnosis>('none'),
    fodmapDiagnosis: new BehaviorSubject<FodmapDiagnosis>('none'),
    milkAllergyType: new BehaviorSubject<MilkAllergyType>('none'),
    isReintroductionPhase: new BehaviorSubject<boolean>(false),
    fistulaOutputMl24h: new BehaviorSubject<number>(0),
    anatomicalSource: new BehaviorSubject<AnatomicalSource>('jejunal_ileal'),
    scannerText: new BehaviorSubject<string>(''),
  }), []);

  // 2. Reactive Stream Consolidation inside combineLatest
  const calculations$ = useMemo((): Observable<GastroState> => {
    const patient$ = watchRecord<Patient>('patients', patientId);

    const assessment$ = watchQuery<GastrointestinalAssessment>(db =>
      db.get('gastrointestinal_assessments').query(
        Q.where('patient_id', patientId),
        Q.sortBy('recorded_at', Q.desc),
        Q.take(1),
      ),
    ).pipe(
      map(rows => rows[0] ?? null),
      catchError(() => of(null as GastrointestinalAssessment | null)),
    );

    return combineLatest([
      patient$,
      assessment$,
      input$.glutenDiagnosis,
      input$.fodmapDiagnosis,
      input$.milkAllergyType,
      input$.isReintroductionPhase,
      input$.fistulaOutputMl24h,
      input$.anatomicalSource,
      input$.scannerText,
    ]).pipe(
      map(([p, assessment, gluten, fodmap, milk, reintro, fistula, source, scanner]) => {
        const chemicalTags = scanner ? scanner.toLowerCase().split(',').map(s => s.trim()) : [];
        const ingredientsListEn = scanner ? scanner.toLowerCase().split(',').map(s => s.trim()) : [];

        const glutenResult = GlutenIsolationEngine.evaluateGlutenSafety({
          diagnosis: gluten,
          foodNameAr: '',
          foodNameEn: '',
          chemicalTags,
          ingredientsListEn,
        });

        const fodmapResult = LowFodmapEngine.evaluateFodmapCompliance({
          diagnosis: fodmap,
          chemicalTags,
          ingredientsListEn,
          isReintroductionPhase: reintro,
        });

        const highLossResult = fistula > 0 ? GastroHighLossEngine.calculateLossReplacements({
          fistulaOutputMl24h: fistula,
          anatomicalSource: source,
          patientWeightKg: 70,
        }) : null;

        const milkResult = MilkAllergenEngine.evaluateMilkSafety({
          allergyType: milk,
          chemicalTags,
          ingredientsListEn,
        });

        const isSevereCrisis = highLossResult?.severityTier === 'severe_crisis_loss';

        const alerts: string[] = [];
        if (glutenResult.arabicClinicalAlerts.length > 0 && gluten !== 'none') {
          alerts.push(...glutenResult.arabicClinicalAlerts);
        }
        if (fodmapResult.arabicClinicalAlerts.length > 0 && fodmap !== 'none') {
          alerts.push(...fodmapResult.arabicClinicalAlerts);
        }
        if (milkResult.arabicClinicalAlerts.length > 0 && milk !== 'none') {
          alerts.push(...milkResult.arabicClinicalAlerts);
        }
        if (highLossResult?.arabicClinicalAlerts) {
          alerts.push(...highLossResult.arabicClinicalAlerts);
        }

        return {
          patient: p,
          assessment,
          glutenResult,
          fodmapResult,
          highLossResult,
          milkResult,
          isSevereCrisis,
          allAlerts: alerts,
          inputs: {
            glutenDiagnosis: gluten,
            fodmapDiagnosis: fodmap,
            milkAllergyType: milk,
            isReintroductionPhase: reintro,
            fistulaOutputMl24h: fistula,
            anatomicalSource: source,
            scannerText: scanner,
          }
        };
      })
    );
  }, [patientId, input$]);

  // 3. Force re-render via useObservable hook
  const state = useObservable<GastroState>(calculations$, {
    patient: null,
    assessment: null,
    glutenResult: { isAllowed: true, arabicClinicalAlerts: [] },
    fodmapResult: { limitationLevel: 'none', arabicClinicalAlerts: [] },
    highLossResult: null,
    milkResult: { isAllowed: true, arabicClinicalAlerts: [] },
    isSevereCrisis: false,
    allAlerts: [],
    inputs: {
      glutenDiagnosis: 'none',
      fodmapDiagnosis: 'none',
      milkAllergyType: 'none',
      isReintroductionPhase: false,
      fistulaOutputMl24h: 0,
      anatomicalSource: 'jejunal_ileal',
      scannerText: '',
    }
  });

  // Sync initial values from database
  const isInitializedRef = useRef(false);
  useEffect(() => {
    if (state.patient && !isInitializedRef.current) {
      isInitializedRef.current = true;
      const p = state.patient as any;
      const savedGluten = p._gluten_restriction || p._raw?._gluten_restriction || 'none';
      const savedFodmap = p._fodmap_restriction || p._raw?._fodmap_restriction || 'none';
      const savedMilk = p._milk_restriction || p._raw?._milk_restriction || 'none';

      input$.glutenDiagnosis.next(savedGluten as GlutenDiagnosis);
      input$.fodmapDiagnosis.next(savedFodmap as FodmapDiagnosis);
      input$.milkAllergyType.next(savedMilk as MilkAllergyType);

      try {
        const parsed = JSON.parse(p.notes || '{}');
        if (parsed.gastroSettings) {
          const settings = parsed.gastroSettings;
          input$.isReintroductionPhase.next(settings.isReintroductionPhase || false);
          if (settings.fistulaOutputMl24h) {
            input$.fistulaOutputMl24h.next(settings.fistulaOutputMl24h);
            setFistulaOutputText(String(settings.fistulaOutputMl24h));
          }
          if (settings.anatomicalSource) {
            input$.anatomicalSource.next(settings.anatomicalSource as AnatomicalSource);
          }
        }
      } catch (e) {}
    }
  }, [state.patient, input$]);

  // Handle Input Changes
  const handleGlutenChange = (val: GlutenDiagnosis) => {
    input$.glutenDiagnosis.next(val);
  };
  const handleFodmapChange = (val: FodmapDiagnosis) => {
    input$.fodmapDiagnosis.next(val);
  };
  const handleMilkChange = (val: MilkAllergyType) => {
    input$.milkAllergyType.next(val);
  };
  const handleReintroChange = (val: boolean) => {
    input$.isReintroductionPhase.next(val);
  };
  const handleFistulaChange = (val: string) => {
    setFistulaOutputText(val);
    input$.fistulaOutputMl24h.next(parseFloat(val) || 0);
  };
  const handleSourceChange = (val: AnatomicalSource) => {
    input$.anatomicalSource.next(val);
  };
  const handleScannerChange = (val: string) => {
    setScannerText(val);
    input$.scannerText.next(val);
  };

  const canSubmit = !state.isSevereCrisis || clinicalJustification.trim().length >= 15;

  const handleCommit = useCallback(async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const db = await getDatabase();
      const now = new Date();
      const profileSummary = [
        `الجلوتين: ${state.inputs.glutenDiagnosis}`,
        `FODMAP: ${state.inputs.fodmapDiagnosis}${state.inputs.isReintroductionPhase ? ' (إعادة إدخال)' : ''}`,
        `الحليب: ${state.inputs.milkAllergyType}`,
        `الناسور: ${state.inputs.fistulaOutputMl24h} مل/24س`,
        state.isSevereCrisis ? `مبرر: ${clinicalJustification}` : '',
      ].filter(Boolean).join(' | ');

      const gastroSettings = {
        isReintroductionPhase: state.inputs.isReintroductionPhase,
        fistulaOutputMl24h: state.inputs.fistulaOutputMl24h,
        anatomicalSource: state.inputs.anatomicalSource,
      };

      await db.write(async () => {
        const collection = db.get('gastrointestinal_assessments');
        await collection.create((r: any) => {
          r.patient_id = patientId;
          r.stool_frequency_per_24h = 0;
          r.diarrhea_grading = 'none';
          r.has_intestinal_bleeding = false;
          r.has_malabsorption_signs = false;
          r.fecal_fat_g24h = 0;
          r.steatorrhea_present = false;
          r.recorded_at = now;
          r.created_at = now;
          r.updated_at = now;
          r._raw._notes_ar = profileSummary;
        });
      });

      const patientCollection = db.get('patients');
      await db.write(async () => {
        const patients = await patientCollection.query(Q.where('id', patientId)).fetch();
        if (patients.length > 0) {
          const patient = patients[0];
          await patient.update((r: any) => {
            r._raw._gluten_restriction = state.inputs.glutenDiagnosis;
            r._raw._fodmap_restriction = state.inputs.fodmapDiagnosis;
            r._raw._milk_restriction = state.inputs.milkAllergyType;

            let currentNotesObj: any = {};
            try {
              currentNotesObj = JSON.parse(r.notes || '{}');
            } catch (e) {
              currentNotesObj = { legacyNotes: r.notes || '' };
            }
            currentNotesObj.gastroSettings = gastroSettings;
            r.notes = JSON.stringify(currentNotesObj);

            r.updated_at = now;
          });
        }
      });

      Alert.alert('نجاح', 'تم اعتماد الحظر المناعي وحسابات التعويض الهضمي بنجاح');
      setClinicalJustification('');
    } catch (err) {
      Alert.alert('خطأ', 'فشل حفظ البيانات');
    } finally {
      setSaving(false);
    }
  }, [patientId, state.inputs, state.isSevereCrisis, clinicalJustification, canSubmit]);

  if (state.patient === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>جاري تحميل بيانات المريض...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={colors.primaryContrast} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>لوحة المناعة الهضمية والتعويض الكهربائي</Text>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* CARD A: Clinical Diagnosis & Outflow Workspace */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="medkit" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>تشخيص الحساسية والتدفق الهضمي</Text>
          </View>
          <View style={styles.cardBody}>
            <OptionPicker
              label="تشخيص الجلوتين"
              options={GLUTEN_OPTIONS}
              selected={state.inputs.glutenDiagnosis}
              onSelect={handleGlutenChange}
            />
            <OptionPicker
              label="تشخيص FODMAP"
              options={FODMAP_OPTIONS}
              selected={state.inputs.fodmapDiagnosis}
              onSelect={handleFodmapChange}
            />
            <OptionPicker
              label="تشخيص الحليب"
              options={MILK_OPTIONS}
              selected={state.inputs.milkAllergyType}
              onSelect={handleMilkChange}
            />

            <View style={styles.toggleGroup}>
              <Text style={styles.pickerLabel}>مرحلة إعادة إدخال الـ FODMAPs</Text>
              <TouchableOpacity
                style={[styles.toggle, state.inputs.isReintroductionPhase && styles.toggleActive]}
                onPress={() => handleReintroChange(!state.inputs.isReintroductionPhase)}
              >
                <Text style={[styles.toggleText, state.inputs.isReintroductionPhase && styles.toggleTextActive]}>
                  {state.inputs.isReintroductionPhase ? 'نشط' : 'غير نشط'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.pickerLabel}>حجم تدفق الناسور/الفتحة الجراحية (مل/24 ساعة)</Text>
              <TextInput
                style={styles.numericInput}
                value={fistulaOutputText}
                onChangeText={handleFistulaChange}
                placeholder="0"
                placeholderTextColor={colors.textDisabled}
                keyboardType="numeric"
                textAlign="right"
              />
            </View>

            <OptionPicker
              label="المصدر التشريحي"
              options={SOURCE_OPTIONS}
              selected={state.inputs.anatomicalSource}
              onSelect={handleSourceChange}
            />
          </View>
        </View>

        {/* CARD B: Live Molecular & Hydro-Electrolyte Compass */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="compass" size={20} color={colors.info} />
            <Text style={styles.cardTitle}>البوصلة الجزيئية والكهربائية الحية</Text>
          </View>
          <View style={styles.cardBody}>
            {/* Electrolyte Replacement Panel */}
            {state.highLossResult && (
              <View style={styles.electrolytePanel}>
                <Text style={styles.sectionLabel}>تعويض السوائل والكهارل</Text>
                <View style={styles.telemetryGrid}>
                  <View style={styles.gridCell}>
                    <Text style={styles.gridLabel}>تعويض السوائل</Text>
                    <Text style={styles.gridValue}>{state.highLossResult.fluidReplacementMl}</Text>
                    <Text style={styles.gridUnit}>مل</Text>
                  </View>
                  <View style={styles.gridCell}>
                    <Text style={styles.gridLabel}>Na+ المطلوب</Text>
                    <Text style={styles.gridValue}>{state.highLossResult.totalNaRequiredMeq}</Text>
                    <Text style={styles.gridUnit}>mEq</Text>
                  </View>
                  <View style={styles.gridCell}>
                    <Text style={styles.gridLabel}>K+ المطلوب</Text>
                    <Text style={styles.gridValue}>{state.highLossResult.totalKRequiredMeq}</Text>
                    <Text style={styles.gridUnit}>mEq</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Low-FODMAP Status Badge */}
            {state.inputs.fodmapDiagnosis !== 'none' && (
              <View style={styles.statusBadgeRow}>
                <Text style={styles.sectionLabel}>حالة FODMAP</Text>
                <View style={[
                  styles.statusBadge,
                  state.fodmapResult.limitationLevel === 'strict_elimination' && styles.badgeDanger,
                  state.fodmapResult.limitationLevel === 'moderate_restriction' && styles.badgeWarning,
                  state.fodmapResult.limitationLevel === 'none' && styles.badgeSuccess,
                ]}>
                  <Text style={styles.statusBadgeText}>
                    {state.fodmapResult.limitationLevel === 'strict_elimination' ? 'إقصاء صارم' :
                     state.fodmapResult.limitationLevel === 'moderate_restriction' ? 'تقييد معتدل' :
                     state.fodmapResult.limitationLevel === 'none' ? 'مسموح' : 'غير محدد'}
                  </Text>
                </View>
              </View>
            )}

            {/* Molecular Quick Scanner */}
            <View style={styles.scannerGroup}>
              <Text style={styles.sectionLabel}>الماسح الجزيئي السريع</Text>
              <TextInput
                style={styles.scannerInput}
                value={scannerText}
                onChangeText={handleScannerChange}
                placeholder="اكتب اسم الطعام أو المكونات (مفصولة بفواصل)..."
                placeholderTextColor={colors.textDisabled}
                textAlign="right"
              />
              <View style={styles.scannerResults}>
                {scannerText.trim().length > 0 && (
                  <>
                    {state.inputs.glutenDiagnosis !== 'none' && (
                      <View style={styles.scannerItem}>
                        <Ionicons
                          name={state.glutenResult.isAllowed ? 'checkmark-circle' : 'close-circle'}
                          size={16}
                          color={state.glutenResult.isAllowed ? colors.success : colors.danger}
                        />
                        <Text style={styles.scannerItemText}>
                          الجلوتين: {state.glutenResult.isAllowed ? 'مسموح' : 'مرفوض'}
                        </Text>
                      </View>
                    )}
                    {state.inputs.milkAllergyType !== 'none' && (
                      <View style={styles.scannerItem}>
                        <Ionicons
                          name={state.milkResult.isAllowed ? 'checkmark-circle' : 'close-circle'}
                          size={16}
                          color={state.milkResult.isAllowed ? colors.success : colors.danger}
                        />
                        <Text style={styles.scannerItemText}>
                          الحليب: {state.milkResult.isAllowed ? 'مسموح' : 'مرفوض'}
                        </Text>
                      </View>
                    )}
                  </>
                )}
              </View>
            </View>

            {/* Alerts block */}
            <AlertBlock alerts={state.allAlerts} />
          </View>
        </View>

        {/* CARD C: Transactional Commit & Critical Lockout */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="lock-closed" size={20} color={colors.warning} />
            <Text style={styles.cardTitle}>الاعتماد النهائي والإقفال الحرج</Text>
          </View>
          <View style={styles.cardBody}>
            {state.isSevereCrisis && (
              <View style={styles.justificationGroup}>
                <Text style={styles.justificationLabel}>
                  🚨 إنذار فقد هيدروليكي حاد - يجب إدخال مبرر سريري (15 حرفاً على الأقل)
                </Text>
                <TextInput
                  style={[styles.overrideInput, styles.overrideTextArea]}
                  value={clinicalJustification}
                  onChangeText={setClinicalJustification}
                  placeholder="المبرر السريري الإلزامي..."
                  placeholderTextColor={colors.textDisabled}
                  textAlign="right"
                  multiline
                  numberOfLines={3}
                />
                {clinicalJustification.trim().length > 0 && clinicalJustification.trim().length < 15 && (
                  <Text style={styles.validationHint}>
                    المتبقي: {15 - clinicalJustification.trim().length} حرف
                  </Text>
                )}
              </View>
            )}

            <TouchableOpacity
              style={[styles.commitButton, (!canSubmit || saving) && styles.commitButtonDisabled]}
              onPress={handleCommit}
              disabled={!canSubmit || saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.primaryContrast} />
              ) : (
                <>
                  <Ionicons name="shield-checkmark" size={18} color={colors.primaryContrast} />
                  <Text style={styles.commitButtonText}>اعتماد الحظر المناعي وحسابات التعويض الهضمي</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    paddingTop: safeHeaderPaddingTop,
  } as const,
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
  } as const,
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  header: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  } as const,
  backButton: {
    padding: spacing.xs,
  } as const,
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.primaryContrast,
    fontFamily: fontFamilies?.medium || 'System',
  } as const,
  body: {
    flex: 1,
  } as const,
  bodyContent: {
    padding: spacing.md,
  } as const,
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  } as const,
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  } as const,
  cardTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: fontFamilies?.medium || 'System',
  } as const,
  cardBody: {
    padding: spacing.md,
  } as const,
  pickerGroup: {
    marginBottom: spacing.md,
  } as const,
  pickerLabel: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'right',
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  pickerRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
  } as const,
  pickerOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  } as const,
  pickerOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryDark,
  } as const,
  pickerOptionText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  pickerOptionTextActive: {
    color: colors.primaryContrast,
    fontWeight: '700',
  } as const,
  toggleGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  } as const,
  toggle: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  } as const,
  toggleActive: {
    borderColor: colors.success,
    backgroundColor: '#052E16',
  } as const,
  toggleText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fontFamilies?.medium || 'System',
  } as const,
  toggleTextActive: {
    color: colors.success,
  } as const,
  inputGroup: {
    marginBottom: spacing.md,
  } as const,
  numericInput: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: spacing.sm,
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  electrolytePanel: {
    marginBottom: spacing.md,
  } as const,
  sectionLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'right',
    fontFamily: fontFamilies?.medium || 'System',
  } as const,
  telemetryGrid: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
  } as const,
  gridCell: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: spacing.sm,
  } as const,
  gridLabel: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  gridValue: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
    color: colors.textPrimary,
    fontFamily: fontFamilies?.bold || 'System',
  } as const,
  gridUnit: {
    fontSize: fontSizes.xs,
    color: colors.textDisabled,
    marginTop: 2,
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  statusBadgeRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  } as const,
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  } as const,
  badgeDanger: {
    backgroundColor: '#450A0A',
  } as const,
  badgeWarning: {
    backgroundColor: '#422006',
  } as const,
  badgeSuccess: {
    backgroundColor: '#052E16',
  } as const,
  statusBadgeText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: fontFamilies?.medium || 'System',
  } as const,
  scannerGroup: {
    marginBottom: spacing.md,
  } as const,
  scannerInput: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: spacing.sm,
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  scannerResults: {
    gap: spacing.xs,
  } as const,
  scannerItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  } as const,
  scannerItemText: {
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  alertContainer: {
    gap: spacing.sm,
  } as const,
  alertRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: '#450A0A',
    borderRadius: 8,
  } as const,
  alertText: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: '#FCA5A5',
    lineHeight: 20,
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  justificationGroup: {
    marginBottom: spacing.md,
  } as const,
  justificationLabel: {
    fontSize: fontSizes.sm,
    color: '#FCA5A5',
    marginBottom: spacing.sm,
    textAlign: 'right',
    fontWeight: '700',
    fontFamily: fontFamilies?.medium || 'System',
  } as const,
  overrideInput: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: spacing.sm,
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  overrideTextArea: {
    minHeight: 72,
    textAlignVertical: 'top',
  } as const,
  validationHint: {
    fontSize: fontSizes.xs,
    color: colors.warning,
    textAlign: 'right',
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  commitButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 8,
  } as const,
  commitButtonDisabled: {
    opacity: 0.6,
  } as const,
  commitButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.primaryContrast,
    fontFamily: fontFamilies?.medium || 'System',
  } as const,
};
