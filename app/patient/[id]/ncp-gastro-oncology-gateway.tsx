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
import { OncologyCachexiaEngine } from '../../../src/domain/calculators/OncologyCachexiaEngine';
import { BariatricProgressiveDietEngine } from '../../../src/domain/calculators/BariatricProgressiveDietEngine';
import { GastroHighLossEngine } from '../../../src/domain/calculators/GastroHighLossEngine';
import type VitalsRecord from '../../../src/data/models/VitalsRecord';
import type GastroSurgeryAssessment from '../../../src/data/models/GastroSurgeryAssessment';

interface GatewayData {
  vitals: VitalsRecord | null;
  assessment: GastroSurgeryAssessment | null;
  loading: boolean;
}

function observeGatewayData(patientId: string): Observable<GatewayData> {
  const vitals$ = watchQuery<VitalsRecord>(db =>
    db.get('vitals_records').query(
      Q.where('patient_id', patientId),
      Q.sortBy('recorded_at', Q.desc),
      Q.take(1),
    ),
  ).pipe(
    map(rows => rows[0] ?? null),
    catchError(() => of(null as VitalsRecord | null)),
  );

  const assessment$ = watchQuery<GastroSurgeryAssessment>(db =>
    db.get('gastro_surgery_assessments').query(
      Q.where('patient_id', patientId),
      Q.sortBy('recorded_at', Q.desc),
      Q.take(1),
    ),
  ).pipe(
    map(rows => rows[0] ?? null),
    catchError(() => of(null as GastroSurgeryAssessment | null)),
  );

  return combineLatest([vitals$, assessment$]).pipe(
    debounceTime(50),
    map(([vitals, assessment]) => ({
      vitals,
      assessment,
      loading: false,
    })),
  );
}

export default function NcpGastroOncologyGatewayScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const data = useObservable(observeGatewayData(patientId), {
    vitals: null,
    assessment: null,
    loading: true,
  } as GatewayData);

  const weightKg = data.vitals?.weightKg ?? data.vitals?.weight ?? 0;
  const bmi = data.vitals?.bmi ?? 0;
  const assessment = data.assessment;

  const oncologyResult = useMemo(() => {
    if (!assessment || assessment.cancerSiteType === 'none') return null;
    return OncologyCachexiaEngine.evaluateOncologyProfile({
      weightKg,
      bmi,
      unintentionalWeightLossPercent: assessment.unintentionalWeightLossPercent,
      cancerSiteType: assessment.cancerSiteType as any,
      hasSarcopeniaOrMuscleWasting: false,
      isRefractoryOncologyStatus: assessment.oncologyCachexiaStage === 'refractory_cachexia',
    });
  }, [assessment, weightKg, bmi]);

  const bariatricResult = useMemo(() => {
    if (!assessment || assessment.bariatricSurgeryType === 'none') return null;
    return BariatricProgressiveDietEngine.calculateBariatricDiet({
      surgeryType: assessment.bariatricSurgeryType as any,
      postOpDayMilestone: assessment.postOpDayMilestone,
      weightKg,
      hasDumpingSyndromeSymptoms: assessment.hasDumpingSyndromeSymptoms,
    });
  }, [assessment, weightKg]);

  const highLossResult = useMemo(() => {
    if (!assessment || assessment.stomaOrFistulaOutputMl24h <= 0) return null;
    const lossType = assessment.bariatricSurgeryType !== 'none'
      ? (assessment.bariatricSurgeryType === 'roux_en_y_bypass' || assessment.bariatricSurgeryType === 'mini_bypass' ? 'ileostomy' : 'colostomy')
      : 'ileostomy';
    return GastroHighLossEngine.calculateHighLossCompensation({
      baselineFluidRequirementMl: 2000,
      stomaOrFistulaOutputMl24h: assessment.stomaOrFistulaOutputMl24h,
      lossType: lossType as any,
    });
  }, [assessment]);

  const [overrideCalories, setOverrideCalories] = useState('');
  const [overrideProtein, setOverrideProtein] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSaveOverrides = useCallback(async () => {
    if (!overrideReason.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال مبرر التعديل');
      return;
    }
    setSaving(true);
    try {
      const db = await getDatabase();
      const existing = await db.get('nutritional_plans')
        .query(Q.where('patient_id', patientId), Q.sortBy('created_at', Q.desc), Q.take(1))
        .fetch();

      const now = new Date();

      await db.write(async () => {
        if (existing.length > 0) {
          const plan = existing[0];
          await plan.update((r: any) => {
            if (overrideCalories) {
              r.final_calories = parseFloat(overrideCalories) || 0;
              r.is_calories_overridden = true;
            }
            if (overrideProtein) {
              r.final_protein = parseFloat(overrideProtein) || 0;
              r.is_protein_overridden = true;
            }
            r.clinical_notes_ar = overrideReason.trim();
            r.updated_at = now;
          });
        } else {
          const collection = db.get('nutritional_plans');
          await collection.create((r: any) => {
            r.patient_id = patientId;
            if (overrideCalories) {
              r.final_calories = parseFloat(overrideCalories) || 0;
              r.is_calories_overridden = true;
            }
            if (overrideProtein) {
              r.final_protein = parseFloat(overrideProtein) || 0;
              r.is_protein_overridden = true;
            }
            r.clinical_notes_ar = overrideReason.trim();
            r.created_at = now;
            r.updated_at = now;
          });
        }
      });

      Alert.alert('نجاح', 'تم حفظ التعديلات بنجاح');
      setOverrideCalories('');
      setOverrideProtein('');
      setOverrideReason('');
    } catch (err) {
      Alert.alert('خطأ', 'فشل حفظ التعديلات');
    } finally {
      setSaving(false);
    }
  }, [patientId, overrideCalories, overrideProtein, overrideReason]);

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
        <Text style={styles.headerTitle}>ملف التقييم الهضمي والأورام</Text>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {!assessment && (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color={colors.textDisabled} />
            <Text style={styles.emptyTitle}>لا يوجد تقييم هضمي أو أورام مسجل</Text>
            <Text style={styles.emptyText}>
              قم بتسجيل بيانات التقييم الهضمي والأورام للمريض لعرض النتائج
            </Text>
          </View>
        )}

        {assessment && (
          <View style={styles.moduleRow}>
            <View style={[styles.riskDot, { backgroundColor: assessment.cancerSiteType !== 'none' ? colors.danger : colors.success }]} />
            <Text style={styles.moduleLabel}>
              {assessment.cancerSiteType !== 'none' ? 'حالة أورام نشطة' : 'لا توجد أورام'}
            </Text>
            <View style={styles.riskDot} />
            <Text style={styles.moduleLabel}>
              {assessment.bariatricSurgeryType !== 'none' ? 'متابعة ما بعد الجراحة' : 'لا توجد جراحة سمنة'}
            </Text>
          </View>
        )}

        {oncologyResult && (
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="fitness" size={20} color={colors.warning} />
              <Text style={styles.metricTitle}>مؤشرات الدنف والسرطان</Text>
            </View>
            <View style={styles.metricBody}>
              <View style={styles.tagRow}>
                <View style={[styles.stageTag, oncologyResult.cachexiaStage === 'cachexia' ? styles.stageTagHigh : oncologyResult.cachexiaStage === 'refractory_cachexia' ? styles.stageTagCritical : styles.stageTagNormal]}>
                  <Text style={styles.stageTagText}>
                    {oncologyResult.cachexiaStage === 'pre_cachexia' ? 'ما قبل الدنف' :
                     oncologyResult.cachexiaStage === 'cachexia' ? 'دنف نشط' :
                     oncologyResult.cachexiaStage === 'refractory_cachexia' ? 'دنف مقاوم' : 'مستقر'}
                  </Text>
                </View>
              </View>
              <View style={styles.metricRow}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{oncologyResult.recommendedCaloriesDaily}</Text>
                  <Text style={styles.metricUnit}>سعرة/يوم</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{oncologyResult.recommendedProteinGramsDaily}</Text>
                  <Text style={styles.metricUnit}>غ بروتين/يوم</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {bariatricResult && (
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="restaurant" size={20} color={colors.info} />
              <Text style={styles.metricTitle}>بوصلة التغذية التقدمية - جراحات السمنة</Text>
            </View>
            <View style={styles.metricBody}>
              <Text style={styles.phaseLabel}>{bariatricResult.phaseArabicLabel}</Text>
              <View style={styles.metricRow}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{bariatricResult.targetCalories}</Text>
                  <Text style={styles.metricUnit}>سعرة/يوم</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{bariatricResult.targetProteinGrams}</Text>
                  <Text style={styles.metricUnit}>غ بروتين/يوم</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{bariatricResult.minimumFluidMl}</Text>
                  <Text style={styles.metricUnit}>مل سوائل/يوم</Text>
                </View>
              </View>
            </View>
            {bariatricResult.requiresAntiDumpingProtocols && (
              <View style={styles.dumpingWarning}>
                <Ionicons name="warning" size={18} color="#FCA5A5" />
                <Text style={styles.dumpingWarningText}>
                  بروتوكول منع الإفراغ السريع نشط: يمنع تناول السوائل مع الوجبات الصلبة؛ يجب فصل السوائل بفارق 30 دقيقة
                </Text>
              </View>
            )}
          </View>
        )}

        {highLossResult && (
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="water" size={20} color={colors.danger} />
              <Text style={styles.metricTitle}>حراسة تعويض السوائل - الفغرة/الناسور</Text>
            </View>
            <View style={styles.metricBody}>
              <View style={styles.telemetryGrid}>
                <View style={styles.gridCell}>
                  <Text style={styles.gridLabel}>الإخراج المقاس</Text>
                  <Text style={styles.gridValue}>{assessment?.stomaOrFistulaOutputMl24h ?? 0}</Text>
                  <Text style={styles.gridUnit}>مل/24س</Text>
                </View>
                <View style={styles.gridCell}>
                  <Text style={styles.gridLabel}>الفقد الزائد</Text>
                  <Text style={styles.gridValue}>{highLossResult.excessLossMl}</Text>
                  <Text style={styles.gridUnit}>مل/24س</Text>
                </View>
                <View style={styles.gridCell}>
                  <Text style={styles.gridLabel}>وصفة السوائل</Text>
                  <Text style={[styles.gridValue, styles.gridValueEmph]}>{highLossResult.totalFluidPrescriptionMl}</Text>
                  <Text style={styles.gridUnit}>مل/24س</Text>
                </View>
              </View>
              {highLossResult.electrolyteRiskTier === 'high' && (
                <View style={styles.electrolyteWarning}>
                  <Ionicons name="flask" size={16} color="#FDE68A" />
                  <Text style={styles.electrolyteWarningText}>
                    خطر ارتفاع استنزاف الشوارد - يوصى بمحلول إرواء فموي (ORS) عالي الصوديوم وتقييد السوائل منخفضة الأسمولية
                  </Text>
                </View>
              )}
              {highLossResult.isCriticalDehydrationRisk && (
                <View style={styles.dehydrationWarning}>
                  <Ionicons name="alert-circle" size={16} color="#FCA5A5" />
                  <Text style={styles.dehydrationWarningText}>
                    خطر جفاف شديد - تدخل عاجل مطلوب
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.overrideCard}>
          <View style={styles.overrideHeader}>
            <Ionicons name="create-outline" size={20} color={colors.textPrimary} />
            <Text style={styles.overrideTitle}>تعديل يدوي للخطة الغذائية</Text>
          </View>
          <TextInput
            style={styles.overrideInput}
            value={overrideCalories}
            onChangeText={setOverrideCalories}
            placeholder="السعرات المستهدفة (سعرة/يوم)"
            placeholderTextColor={colors.textDisabled}
            keyboardType="numeric"
            textAlign="right"
          />
          <TextInput
            style={styles.overrideInput}
            value={overrideProtein}
            onChangeText={setOverrideProtein}
            placeholder="البروتين المستهدف (غ/يوم)"
            placeholderTextColor={colors.textDisabled}
            keyboardType="numeric"
            textAlign="right"
          />
          <TextInput
            style={[styles.overrideInput, styles.overrideTextArea]}
            value={overrideReason}
            onChangeText={setOverrideReason}
            placeholder="مبرر التعديل (إلزامي)..."
            placeholderTextColor={colors.textDisabled}
            textAlign="right"
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSaveOverrides}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.primaryContrast} />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color={colors.primaryContrast} />
                <Text style={styles.saveButtonText}>حفظ التعديلات</Text>
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
  } as const,
  emptyTitle: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.md,
    fontFamily: fontFamilies?.medium || 'System',
  } as const,
  emptyText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  moduleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  } as const,
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  } as const,
  moduleLabel: {
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    fontFamily: fontFamilies?.medium || 'System',
  } as const,
  metricCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  } as const,
  metricHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  } as const,
  metricTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: fontFamilies?.medium || 'System',
  } as const,
  metricBody: {
    padding: spacing.md,
  } as const,
  tagRow: {
    flexDirection: 'row-reverse',
    marginBottom: spacing.md,
  } as const,
  stageTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  } as const,
  stageTagNormal: {
    backgroundColor: '#052E16',
  } as const,
  stageTagHigh: {
    backgroundColor: '#7C2D12',
  } as const,
  stageTagCritical: {
    backgroundColor: '#450A0A',
  } as const,
  stageTagText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: fontFamilies?.medium || 'System',
  } as const,
  metricRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-around',
  } as const,
  metricItem: {
    alignItems: 'center',
    flex: 1,
  } as const,
  metricValue: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
    color: colors.textPrimary,
    fontFamily: fontFamilies?.bold || 'System',
  } as const,
  metricUnit: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  metricDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  } as const,
  phaseLabel: {
    fontSize: fontSizes.sm,
    color: colors.info,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: spacing.md,
    fontFamily: fontFamilies?.medium || 'System',
  } as const,
  dumpingWarning: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: '#1A0A0A',
    borderTopWidth: 1,
    borderTopColor: colors.danger,
  } as const,
  dumpingWarningText: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: '#FCA5A5',
    lineHeight: 20,
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  telemetryGrid: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    marginBottom: spacing.md,
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
  gridValueEmph: {
    color: colors.warning,
  } as const,
  gridUnit: {
    fontSize: fontSizes.xs,
    color: colors.textDisabled,
    marginTop: 2,
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  electrolyteWarning: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: '#422006',
    borderRadius: 8,
    marginBottom: spacing.sm,
  } as const,
  electrolyteWarningText: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: '#FDE68A',
    lineHeight: 20,
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  dehydrationWarning: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: '#450A0A',
    borderRadius: 8,
  } as const,
  dehydrationWarningText: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: '#FCA5A5',
    fontWeight: '700',
    fontFamily: fontFamilies?.medium || 'System',
  } as const,
  overrideCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  } as const,
  overrideHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  } as const,
  overrideTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
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
  saveButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 8,
  } as const,
  saveButtonDisabled: {
    opacity: 0.6,
  } as const,
  saveButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.primaryContrast,
    fontFamily: fontFamilies?.medium || 'System',
  } as const,
};
