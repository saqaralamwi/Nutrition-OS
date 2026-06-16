import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  TextInput, Platform, KeyboardAvoidingView, Alert,
} from 'react-native';
import { useState, useCallback, useMemo } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { combineLatest, Observable, of } from 'rxjs';
import { map, catchError, debounceTime } from 'rxjs/operators';
import { Q } from '@nozbe/watermelondb';
import { colors, spacing, fontFamilies, fontSizes, safeHeaderPaddingTop } from '../../../src/presentation/theme';
import { useObservable } from '../../../src/presentation/hooks/useObservable';
import { watchQuery, watchRecord } from '../../../src/data/database/observe';
import { getDatabase } from '../../../src/data/database';
import { SurgicalErasEngine } from '../../../src/domain/calculators/SurgicalErasEngine';
import { PregnancyIncrementEngine } from '../../../src/domain/calculators/PregnancyIncrementEngine';
import { LactationIncrementEngine } from '../../../src/domain/calculators/LactationIncrementEngine';
import { IddsiTextureEngine } from '../../../src/domain/calculators/IddsiTextureEngine';
import { OrthopedicBoneHealingEngine } from '../../../src/domain/calculators/OrthopedicBoneHealingEngine';
import type SurgicalErasRecord from '../../../src/data/models/SurgicalErasRecord';

type ActiveModule = 'none' | 'eras_surgery' | 'pregnancy' | 'lactation';
type DysphagiaLevel = 'none' | 'mild' | 'moderate' | 'severe';

interface GatewayData {
  patient: any | null;
  erasRecord: SurgicalErasRecord | null;
  loading: boolean;
}

function observeGatewayData(patientId: string): Observable<GatewayData> {
  const patient$ = watchRecord<any>(db => db.get('patients').find(patientId)).pipe(
    catchError(() => of(null as any)),
  );

  const erasRecord$ = watchQuery<SurgicalErasRecord>(db =>
    db.get('surgical_eras_records').query(
      Q.where('patient_id', patientId),
      Q.sortBy('recorded_at', Q.desc),
      Q.take(1),
    ),
  ).pipe(
    map(rows => rows[0] ?? null),
    catchError(() => of(null as SurgicalErasRecord | null)),
  );

  return combineLatest([patient$, erasRecord$]).pipe(
    debounceTime(50),
    map(([patient, erasRecord]) => ({
      patient,
      erasRecord,
      loading: false,
    })),
  );
}

export default function SurgicalLifeGatewayScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const data = useObservable(observeGatewayData(patientId), {
    patient: null,
    erasRecord: null,
    loading: true,
  } as GatewayData);

  const [activeModule, setActiveModule] = useState<ActiveModule>('none');
  const [hasActiveFracture, setHasActiveFracture] = useState(false);
  const [hasDysphagia, setHasDysphagia] = useState(false);
  const [dysphagiaSeverity, setDysphagiaSeverity] = useState<DysphagiaLevel>('none');

  const [surgeryScheduledAt, setSurgeryScheduledAt] = useState('');
  const [lastSolidFoodIntakeAt, setLastSolidFoodIntakeAt] = useState('');
  const [lastClearFluidIntakeAt, setLastClearFluidIntakeAt] = useState('');
  const [isErasProtocolEnforced, setIsErasProtocolEnforced] = useState(false);

  const [gestationalAgeWeeks, setGestationalAgeWeeks] = useState('');

  const [monthsPostpartum, setMonthsPostpartum] = useState('');
  const [isExclusivelyBreastfeeding, setIsExclusivelyBreastfeeding] = useState(false);

  const [justification, setJustification] = useState('');
  const [saving, setSaving] = useState(false);

  const patient = data.patient;
  const ageYears = patient?.age ?? patient?.dateOfBirth
    ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / 31536000000)
    : 30;
  const gender: 'male' | 'female' = patient?.gender ?? 'male';
  const baselineCalories = patient?.baselineCalories ?? 2000;
  const baselineProteinGrams = patient?.baselineProteinGrams ?? 60;
  const baselineFluidsMl = patient?.baselineFluidsMl ?? 2000;
  const prePregnancyBmi = patient?.prePregnancyBmi ?? 22;
  const egfrValue = patient?.egfrValue ?? 90;

  const erasResult = useMemo(() => {
    if (activeModule !== 'eras_surgery' || !surgeryScheduledAt || !lastSolidFoodIntakeAt || !lastClearFluidIntakeAt) return null;
    const surgeryMs = parseInt(surgeryScheduledAt, 10);
    const solidMs = parseInt(lastSolidFoodIntakeAt, 10);
    const fluidMs = parseInt(lastClearFluidIntakeAt, 10);
    if (isNaN(surgeryMs) || isNaN(solidMs) || isNaN(fluidMs)) return null;
    return SurgicalErasEngine.evaluateErasProtocol({
      surgeryScheduledAt: surgeryMs,
      lastSolidFoodIntakeAt: solidMs,
      lastClearFluidIntakeAt: fluidMs,
      isErasProtocolEnforced,
    });
  }, [activeModule, surgeryScheduledAt, lastSolidFoodIntakeAt, lastClearFluidIntakeAt, isErasProtocolEnforced]);

  const pregnancyResult = useMemo(() => {
    if (activeModule !== 'pregnancy' || !gestationalAgeWeeks) return null;
    const weeks = parseInt(gestationalAgeWeeks, 10);
    if (isNaN(weeks)) return null;
    return PregnancyIncrementEngine.calculatePregnancyIncrements({
      baselineCalories,
      baselineProteinGrams,
      gestationalAgeWeeks: weeks,
      prePregnancyBmi,
    });
  }, [activeModule, gestationalAgeWeeks, baselineCalories, baselineProteinGrams, prePregnancyBmi]);

  const lactationResult = useMemo(() => {
    if (activeModule !== 'lactation' || !monthsPostpartum) return null;
    const months = parseInt(monthsPostpartum, 10);
    if (isNaN(months)) return null;
    return LactationIncrementEngine.calculateLactationIncrements({
      baselineCalories,
      baselineProteinGrams,
      baselineFluidsMl,
      monthsPostpartum: months,
      isExclusivelyBreastfeeding,
    });
  }, [activeModule, monthsPostpartum, baselineCalories, baselineProteinGrams, baselineFluidsMl, isExclusivelyBreastfeeding]);

  const iddsiResult = useMemo(() => {
    if (!hasDysphagia || dysphagiaSeverity === 'none') return null;
    return IddsiTextureEngine.evaluateIddsiRequirement({
      patientAgeYears: ageYears,
      hasDysphagia,
      clinicalCondition: 'stroke',
      dysphagiaSeverity,
    });
  }, [hasDysphagia, dysphagiaSeverity, ageYears]);

  const orthopedicResult = useMemo(() => {
    if (!hasActiveFracture) return null;
    return OrthopedicBoneHealingEngine.calculateBoneMineralTargets({
      hasActiveFracture,
      ageYears,
      egfrValue,
      gender,
    });
  }, [hasActiveFracture, ageYears, egfrValue, gender]);

  const allAlerts = useMemo(() => {
    const alerts: string[] = [];
    if (erasResult) alerts.push(...erasResult.arabicClinicalAlerts);
    if (pregnancyResult) alerts.push(...pregnancyResult.arabicClinicalAlerts);
    if (lactationResult) alerts.push(...lactationResult.arabicClinicalAlerts);
    if (iddsiResult) alerts.push(...iddsiResult.arabicClinicalAlerts);
    if (orthopedicResult) alerts.push(...orthopedicResult.arabicClinicalAlerts);
    return alerts;
  }, [erasResult, pregnancyResult, lactationResult, iddsiResult, orthopedicResult]);

  const requiresDelayOverride = erasResult?.clinicalAction === 'delay_surgery';

  const handleCommit = useCallback(async () => {
    if (requiresDelayOverride && justification.trim().length < 15) {
      Alert.alert('خطأ', 'الرجاء إدخال مبرر مكون من 15 حرفاً على الأقل لتأكيد تأجيل العملية');
      return;
    }
    setSaving(true);
    try {
      const db = await getDatabase();
      const now = new Date();

      await db.write(async () => {
        if (activeModule === 'eras_surgery') {
          const collection = db.get('surgical_eras_records');
          await collection.create((r: any) => {
            r.patient_id = patientId;
            r.surgery_type = 'general';
            r.surgery_scheduled_at = parseInt(surgeryScheduledAt, 10) || now.getTime();
            r.last_solid_food_intake_at = parseInt(lastSolidFoodIntakeAt, 10) || now.getTime();
            r.last_clear_fluid_intake_at = parseInt(lastClearFluidIntakeAt, 10) || now.getTime();
            r.is_eras_protocol_enforced = isErasProtocolEnforced;
            r.recorded_at = now.getTime();
          });
        }

        const planRows = await db.get('nutritional_plans')
          .query(Q.where('patient_id', patientId), Q.sortBy('created_at', Q.desc), Q.take(1))
          .fetch();

        if (planRows.length > 0) {
          await planRows[0].update((r: any) => {
            r.updated_at = now;
            if (pregnancyResult) {
              r.final_calories = pregnancyResult.totalCaloriesTarget;
              r.final_protein = pregnancyResult.totalProteinGramsTarget;
              r.is_calories_overridden = true;
              r.is_protein_overridden = true;
            }
            if (lactationResult) {
              r.final_calories = lactationResult.totalCaloriesTarget;
              r.final_protein = lactationResult.totalProteinGramsTarget;
              r.is_calories_overridden = true;
              r.is_protein_overridden = true;
            }
            if (requiresDelayOverride) {
              r.clinical_notes_ar = justification.trim();
            }
          });
        }
      });

      Alert.alert('نجاح', 'تم تثبيت واعتماد التعديلات الفسيولوجية والسريرية بنجاح');
      setJustification('');
    } catch (err) {
      Alert.alert('خطأ', 'فشل حفظ التعديلات');
    } finally {
      setSaving(false);
    }
  }, [patientId, activeModule, surgeryScheduledAt, lastSolidFoodIntakeAt, lastClearFluidIntakeAt, isErasProtocolEnforced, pregnancyResult, lactationResult, requiresDelayOverride, justification]);

  if (data.loading) {
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
        <Text style={styles.headerTitle}>بوابة المراحل الحياتية والجراحية</Text>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* CARD A: Physiological Context Switcher */}
        <View style={styles.switcherCard}>
          <View style={styles.switcherHeader}>
            <Ionicons name="swap-horizontal" size={20} color={colors.textPrimary} />
            <Text style={styles.switcherTitle}>مبدل السياق الفسيولوجي</Text>
          </View>
          <View style={styles.segmentRow}>
            {(['eras_surgery', 'pregnancy', 'lactation'] as ActiveModule[]).map(mod => (
              <TouchableOpacity
                key={mod}
                style={[styles.segmentButton, activeModule === mod && styles.segmentButtonActive]}
                onPress={() => setActiveModule(mod)}
              >
                <Text style={[styles.segmentText, activeModule === mod && styles.segmentTextActive]}>
                  {mod === 'eras_surgery' ? 'جراحة ERAS' : mod === 'pregnancy' ? 'حمل' : 'رضاعة'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.togglePill, hasActiveFracture && styles.togglePillActive]}
              onPress={() => setHasActiveFracture(v => !v)}
            >
              <Ionicons name="bone" size={16} color={hasActiveFracture ? colors.warning : colors.textDisabled} />
              <Text style={[styles.togglePillText, hasActiveFracture && styles.togglePillTextActive]}>
                🦴 كسر عظمي نشط
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.togglePill, hasDysphagia && styles.togglePillActive]}
              onPress={() => setHasDysphagia(v => !v)}
            >
              <Ionicons name="medical" size={16} color={hasDysphagia ? colors.warning : colors.textDisabled} />
              <Text style={[styles.togglePillText, hasDysphagia && styles.togglePillTextActive]}>
                🧠 عسر بلع عصبي
              </Text>
            </TouchableOpacity>
          </View>

          {hasDysphagia && (
            <View style={styles.severityRow}>
              {(['mild', 'moderate', 'severe'] as DysphagiaLevel[]).map(sev => (
                <TouchableOpacity
                  key={sev}
                  style={[styles.severityButton, dysphagiaSeverity === sev && styles.severityButtonActive]}
                  onPress={() => setDysphagiaSeverity(sev)}
                >
                  <Text style={[styles.severityText, dysphagiaSeverity === sev && styles.severityTextActive]}>
                    {sev === 'mild' ? 'خفيف' : sev === 'moderate' ? 'متوسط' : 'شديد'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {activeModule === 'eras_surgery' && (
            <View style={styles.contextForm}>
              <TextInput
                style={styles.contextInput}
                value={surgeryScheduledAt}
                onChangeText={setSurgeryScheduledAt}
                placeholder="موعد الجراحة (timestamp ms)"
                placeholderTextColor={colors.textDisabled}
                keyboardType="numeric"
                textAlign="right"
              />
              <TextInput
                style={styles.contextInput}
                value={lastSolidFoodIntakeAt}
                onChangeText={setLastSolidFoodIntakeAt}
                placeholder="آخر وجبة صلبة (timestamp ms)"
                placeholderTextColor={colors.textDisabled}
                keyboardType="numeric"
                textAlign="right"
              />
              <TextInput
                style={styles.contextInput}
                value={lastClearFluidIntakeAt}
                onChangeText={setLastClearFluidIntakeAt}
                placeholder="آخر سوائل شفافة (timestamp ms)"
                placeholderTextColor={colors.textDisabled}
                keyboardType="numeric"
                textAlign="right"
              />
              <TouchableOpacity
                style={[styles.togglePill, isErasProtocolEnforced && styles.togglePillActive, styles.erasToggle]}
                onPress={() => setIsErasProtocolEnforced(v => !v)}
              >
                <Text style={[styles.togglePillText, isErasProtocolEnforced && styles.togglePillTextActive]}>
                  {isErasProtocolEnforced ? '✅ بروتوكول ERAS مفعّل' : 'بروتوكول ERAS غير مفعّل'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {activeModule === 'pregnancy' && (
            <View style={styles.contextForm}>
              <TextInput
                style={styles.contextInput}
                value={gestationalAgeWeeks}
                onChangeText={setGestationalAgeWeeks}
                placeholder="عمر الحمل (أسابيع 1-42)"
                placeholderTextColor={colors.textDisabled}
                keyboardType="numeric"
                textAlign="right"
              />
            </View>
          )}

          {activeModule === 'lactation' && (
            <View style={styles.contextForm}>
              <TextInput
                style={styles.contextInput}
                value={monthsPostpartum}
                onChangeText={setMonthsPostpartum}
                placeholder="الأشهر بعد الولادة (0-12)"
                placeholderTextColor={colors.textDisabled}
                keyboardType="numeric"
                textAlign="right"
              />
              <TouchableOpacity
                style={[styles.togglePill, isExclusivelyBreastfeeding && styles.togglePillActive, styles.erasToggle]}
                onPress={() => setIsExclusivelyBreastfeeding(v => !v)}
              >
                <Text style={[styles.togglePillText, isExclusivelyBreastfeeding && styles.togglePillTextActive]}>
                  {isExclusivelyBreastfeeding ? '✅ رضاعة حصرية' : 'رضاعة غير حصرية'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* CARD B: Live Physiological Calculator Compass */}
        <View style={styles.compassCard}>
          <View style={styles.compassHeader}>
            <Ionicons name="compass" size={20} color={colors.textPrimary} />
            <Text style={styles.compassTitle}>بوصلة الحسابات الفسيولوجية الحية</Text>
          </View>

          {erasResult && (
            <View style={styles.resultSection}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>حالة السلامة قبل الجراحة:</Text>
                <View style={[styles.safetyBadge, erasResult.isPreOpSafe ? styles.safetySafe : styles.safetyDanger]}>
                  <Text style={styles.safetyBadgeText}>
                    {erasResult.isPreOpSafe ? 'آمن للجراحة' : '🚨 تأجيل الجراحة فوراً'}
                  </Text>
                </View>
              </View>
              <View style={styles.statRow}>
                <View style={styles.statCell}>
                  <Text style={styles.statValue}>{erasResult.solidFastingHours}</Text>
                  <Text style={styles.statLabel}>صيام صلب (س)</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCell}>
                  <Text style={styles.statValue}>{erasResult.fluidFastingHours}</Text>
                  <Text style={styles.statLabel}>صيام سوائل (س)</Text>
                </View>
              </View>
              {erasResult.recommendPreOpCarbLoading && (
                <View style={styles.erasCarbRow}>
                  <Ionicons name="flask" size={16} color={colors.info} />
                  <Text style={styles.erasCarbText}>{erasResult.carbSolutionPrescription}</Text>
                </View>
              )}
            </View>
          )}

          {pregnancyResult && (
            <View style={styles.resultSection}>
              <Text style={styles.resultSectionTitle}>زيادات الحمل - الثلث {pregnancyResult.trimester}</Text>
              <View style={styles.statRow}>
                <View style={styles.statCell}>
                  <Text style={styles.statValue}>{pregnancyResult.totalCaloriesTarget}</Text>
                  <Text style={styles.statLabel}>سعرة/يوم</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCell}>
                  <Text style={styles.statValue}>{pregnancyResult.totalProteinGramsTarget}</Text>
                  <Text style={styles.statLabel}>غ بروتين/يوم</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCell}>
                  <Text style={styles.statValue}>{pregnancyResult.recommendedWeightGainMinKg}-{pregnancyResult.recommendedWeightGainMaxKg}</Text>
                  <Text style={styles.statLabel}>زيادة وزن (كغ)</Text>
                </View>
              </View>
            </View>
          )}

          {lactationResult && (
            <View style={styles.resultSection}>
              <Text style={styles.resultSectionTitle}>زيادات الرضاعة</Text>
              <View style={styles.statRow}>
                <View style={styles.statCell}>
                  <Text style={styles.statValue}>{lactationResult.totalCaloriesTarget}</Text>
                  <Text style={styles.statLabel}>سعرة/يوم</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCell}>
                  <Text style={styles.statValue}>{lactationResult.totalProteinGramsTarget}</Text>
                  <Text style={styles.statLabel}>غ بروتين/يوم</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCell}>
                  <Text style={styles.statValue}>{lactationResult.totalFluidsMlTarget}</Text>
                  <Text style={styles.statLabel}>مل سوائل/يوم</Text>
                </View>
              </View>
            </View>
          )}

          {iddsiResult && (
            <View style={styles.resultSection}>
              <Text style={styles.resultSectionTitle}>تصنيف IDDSI للقوام</Text>
              <View style={styles.statRow}>
                <View style={styles.statCell}>
                  <Text style={styles.statValue}>مستوى {iddsiResult.liquidLevelCode}</Text>
                  <Text style={styles.statLabel}>{iddsiResult.liquidLevelNameAr}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCell}>
                  <Text style={styles.statValue}>مستوى {iddsiResult.foodTextureCode}</Text>
                  <Text style={styles.statLabel}>{iddsiResult.foodTextureNameAr}</Text>
                </View>
              </View>
            </View>
          )}

          {orthopedicResult && (
            <View style={styles.resultSection}>
              <Text style={styles.resultSectionTitle}>مستهدفات المعادن للعظام</Text>
              <View style={styles.statRow}>
                <View style={styles.statCell}>
                  <Text style={styles.statValue}>{orthopedicResult.targetCalciumMg}</Text>
                  <Text style={styles.statLabel}>كالسيوم (ملغ)</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCell}>
                  <Text style={styles.statValue}>{orthopedicResult.targetPhosphorusMg}</Text>
                  <Text style={styles.statLabel}>فسفور (ملغ)</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCell}>
                  <Text style={styles.statValue}>{orthopedicResult.targetVitaminD3Iu}</Text>
                  <Text style={styles.statLabel}>فيتامين D3 (وحدة)</Text>
                </View>
              </View>
              {orthopedicResult.isRenalConstrained && (
                <View style={styles.renalGuardBanner}>
                  <Ionicons name="shield-checkmark" size={16} color={colors.warning} />
                  <Text style={styles.renalGuardText}>مقيد كلوي - تم تطبيق سقوف KDOQI</Text>
                </View>
              )}
            </View>
          )}

          {allAlerts.length > 0 && (
            <View style={styles.alertsContainer}>
              {allAlerts.map((alert, i) => (
                <View key={i} style={styles.alertRow}>
                  <Ionicons name="warning" size={16} color={colors.warning} />
                  <Text style={styles.alertText}>{alert}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* CARD C: Transactional Commit & Audit Cap */}
        <View style={styles.commitCard}>
          <View style={styles.commitHeader}>
            <Ionicons name="checkmark-done" size={20} color={colors.textPrimary} />
            <Text style={styles.commitTitle}>تثبيت واعتماد التعديلات الفسيولوجية والسريرية</Text>
          </View>

          {requiresDelayOverride && (
            <View style={styles.delayOverrideSection}>
              <Text style={styles.delayOverrideLabel}>
                🚨 تم اكتشاف خطر يتطلب تأجيل الجراحة. الرجاء كتابة مبرر مكون من 15 حرفاً على الأقل للمتابعة:
              </Text>
              <TextInput
                style={[styles.contextInput, styles.justificationInput]}
                value={justification}
                onChangeText={setJustification}
                placeholder="مبرر التأجيل (15 حرفاً على الأقل)..."
                placeholderTextColor={colors.textDisabled}
                textAlign="right"
                multiline
                numberOfLines={3}
              />
              {justification.trim().length > 0 && justification.trim().length < 15 && (
                <Text style={styles.justificationHint}>
                  {justification.trim().length}/15 حرفاً - يجب إدخال 15 حرفاً على الأقل
                </Text>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.commitButton,
              (saving || (requiresDelayOverride && justification.trim().length < 15)) && styles.commitButtonDisabled,
            ]}
            onPress={handleCommit}
            disabled={saving || (requiresDelayOverride && justification.trim().length < 15)}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.primaryContrast} />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color={colors.primaryContrast} />
                <Text style={styles.commitButtonText}>تثبيت واعتماد التعديلات الفسيولوجية والسريرية</Text>
              </>
            )}
          </TouchableOpacity>
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
    paddingTop: Platform.OS === 'web' ? 16 : 60,
    paddingBottom: spacing.lg,
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

  switcherCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  } as const,
  switcherHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  } as const,
  switcherTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: fontFamilies?.medium || 'System',
  } as const,
  segmentRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    marginBottom: spacing.md,
  } as const,
  segmentButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
  } as const,
  segmentButtonActive: {
    backgroundColor: colors.primary,
  } as const,
  segmentText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: fontFamilies?.medium || 'System',
  } as const,
  segmentTextActive: {
    color: colors.primaryContrast,
  } as const,
  toggleRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    marginBottom: spacing.md,
  } as const,
  togglePill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  } as const,
  togglePillActive: {
    borderColor: colors.warning,
    backgroundColor: '#422006',
  } as const,
  togglePillText: {
    fontSize: fontSizes.sm,
    color: colors.textDisabled,
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  togglePillTextActive: {
    color: colors.warning,
  } as const,
  severityRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    marginBottom: spacing.md,
  } as const,
  severityButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  } as const,
  severityButtonActive: {
    borderColor: colors.danger,
    backgroundColor: '#450A0A',
  } as const,
  severityText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  severityTextActive: {
    color: colors.danger,
    fontWeight: '700',
  } as const,
  contextForm: {
    gap: spacing.sm,
  } as const,
  contextInput: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: spacing.sm,
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  erasToggle: {
    alignSelf: 'stretch',
    justifyContent: 'center',
  } as const,

  compassCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  } as const,
  compassHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  } as const,
  compassTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: fontFamilies?.medium || 'System',
  } as const,
  resultSection: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  } as const,
  resultSectionTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.info,
    marginBottom: spacing.sm,
    textAlign: 'right',
    fontFamily: fontFamilies?.medium || 'System',
  } as const,
  resultRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  } as const,
  resultLabel: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  safetyBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  } as const,
  safetySafe: {
    backgroundColor: '#052E16',
  } as const,
  safetyDanger: {
    backgroundColor: '#450A0A',
  } as const,
  safetyBadgeText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: fontFamilies?.medium || 'System',
  } as const,
  statRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-around',
  } as const,
  statCell: {
    alignItems: 'center',
    flex: 1,
  } as const,
  statValue: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
    color: colors.textPrimary,
    fontFamily: fontFamilies?.bold || 'System',
  } as const,
  statLabel: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  } as const,
  erasCarbRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: '#0C1F2E',
    borderRadius: 8,
  } as const,
  erasCarbText: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.info,
    lineHeight: 20,
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  renalGuardBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: '#422006',
    borderRadius: 8,
  } as const,
  renalGuardText: {
    fontSize: fontSizes.sm,
    color: colors.warning,
    fontWeight: '700',
    fontFamily: fontFamilies?.medium || 'System',
  } as const,
  alertsContainer: {
    padding: spacing.md,
    gap: spacing.sm,
  } as const,
  alertRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing.sm,
  } as const,
  alertText: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.warning,
    lineHeight: 20,
    fontFamily: fontFamilies?.regular || 'System',
  } as const,

  commitCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  } as const,
  commitHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  } as const,
  commitTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    fontFamily: fontFamilies?.medium || 'System',
  } as const,
  delayOverrideSection: {
    marginBottom: spacing.md,
  } as const,
  delayOverrideLabel: {
    fontSize: fontSizes.sm,
    color: colors.danger,
    lineHeight: 20,
    marginBottom: spacing.sm,
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  justificationInput: {
    minHeight: 72,
    textAlignVertical: 'top',
    borderColor: colors.danger,
  } as const,
  justificationHint: {
    fontSize: fontSizes.xs,
    color: colors.danger,
    marginTop: spacing.xs,
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
    opacity: 0.4,
  } as const,
  commitButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.primaryContrast,
    fontFamily: fontFamilies?.medium || 'System',
  } as const,
};
