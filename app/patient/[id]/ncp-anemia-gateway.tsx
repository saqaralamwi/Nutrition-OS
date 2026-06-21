import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StyleSheet,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafePatientId } from '../../../src/presentation/hooks/useSafePatientId';
import { watchRecord } from '../../../src/data/database/observe';
import { useObservable } from '../../../src/presentation/hooks/useObservable';
import { useAppTheme } from '../../../src/presentation/hooks/useAppTheme';
import { colors, spacing, fontFamilies, fontSizes } from '../../../src/presentation/theme';
import { useAnemiaAssessment } from '../../../src/presentation/hooks/useAnemiaAssessment';
import { useAnemiaNutritionPlan } from '../../../src/presentation/hooks/useAnemiaNutritionPlan';
import { useAnemiaMonitoring } from '../../../src/presentation/hooks/useAnemiaMonitoring';

export default function AnemiaGatewayScreen() {
  const patientId = useSafePatientId();
  const router = useRouter();
  const { theme } = useAppTheme();

  // Observable patient data
  const patient = useObservable(
    useMemo(() => watchRecord<any>('patients', patientId), [patientId]),
    null
  );

  // Load latest NCP records via hooks
  const { assessment, isLoading: loadingAssessment } = useAnemiaAssessment(patientId);
  const { plan, isLoading: loadingPlan } = useAnemiaNutritionPlan(patientId);
  const { monitoringList, isLoading: loadingMonitoring } = useAnemiaMonitoring(patientId);

  const latestMonitoring = useMemo(() => {
    return monitoringList.length > 0 ? monitoringList[0] : null;
  }, [monitoringList]);

  const isLoading = loadingAssessment || loadingPlan || loadingMonitoring || !patient;

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: theme.subtext }]}>جاري تحميل ملف رعاية فقر الدم...</Text>
      </View>
    );
  }

  // Display translation mapping
  const severityLabels: Record<string, string> = {
    none: 'طبيعي (لا يوجد)',
    mild: 'خفيف',
    moderate: 'متوسط',
    severe: 'شديد',
    critical: 'حرج جداً',
  };

  const typeLabels: Record<string, string> = {
    iron_deficiency: 'نقص الحديد (IDA)',
    b12_deficiency: 'نقص فيتامين B12',
    folate_deficiency: 'نقص الفوليك (Folate)',
    mixed_deficiency: 'فقر دم مختلط (نقص متعدد)',
    hemolytic: 'تحللي (Hemolytic)',
    sickle_cell: 'منجلي (Sickle Cell)',
    chronic_disease: 'أمراض مزمنة',
    unknown: 'غير محدد',
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.danger }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={colors.primaryContrast} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>فقر الدم والتأهيل التغذوي (Anemia NCP)</Text>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Patient header card */}
        <View style={[styles.patientCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={28} color={colors.danger} />
          </View>
          <View style={styles.patientInfo}>
            <Text style={[styles.patientName, { color: theme.text }]}>{patient.fullName}</Text>
            <Text style={[styles.patientMeta, { color: theme.subtext }]}>
              {patient.gender === 'female' ? 'أنثى' : 'ذكر'} | {patient.age} سنة | MRN: {patient.fileNumber}
            </Text>
          </View>
        </View>

        {/* SECTION 1: assessment summary */}
        <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="flask" size={20} color={colors.danger} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>التقييم المخبري والسريري</Text>
            </View>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.danger + '15' }]}
              onPress={() => router.push(`/patient/${patientId}/anemia-assessment`)}
            >
              <Text style={[styles.actionBtnText, { color: colors.danger }]}>
                {assessment ? 'تحديث التقييم' : 'بدء تقييم جديد'}
              </Text>
            </TouchableOpacity>
          </View>

          {assessment ? (
            <View style={styles.detailsList}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.subtext }]}>الهيموجلوبين (Hb):</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>
                  {assessment.hemoglobin} {assessment.hemoglobinUnit}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.subtext }]}>الشدة (منظمة الصحة):</Text>
                <Text
                  style={[
                    styles.detailValue,
                    {
                      color:
                        assessment.severity === 'critical' || assessment.severity === 'severe'
                          ? colors.danger
                          : assessment.severity === 'moderate'
                          ? colors.warning
                          : theme.text,
                      fontWeight: 'bold',
                    },
                  ]}
                >
                  {severityLabels[assessment.severity] || assessment.severity}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.subtext }]}>نوع فقر الدم:</Text>
                <Text style={[styles.detailValue, { color: theme.text, fontWeight: 'bold' }]}>
                  {typeLabels[assessment.anemiaType] || assessment.anemiaType}
                </Text>
              </View>
              {assessment.ferritin > 0 && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.subtext }]}>الفيريتين (مخزون الحديد):</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {assessment.ferritin} ng/mL ({assessment.ironStatus === 'normal' ? 'طبيعي' : 'منخفض'})
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="clipboard-outline" size={32} color={theme.subtext} />
              <Text style={[styles.emptyText, { color: theme.subtext }]}>لا يوجد تقييم دمويات مسجل للمريض حتى الآن.</Text>
            </View>
          )}
        </View>

        {/* SECTION 2: nutrition plan summary */}
        <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="nutrition" size={20} color={colors.accentTeal} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>الخطة الغذائية والتدخل</Text>
            </View>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.accentTeal + '15' }]}
              onPress={() => {
                if (!assessment) {
                  Alert.alert('تنبيه', 'يرجى تعبئة التقييم السريري أولاً');
                  return;
                }
                router.push(`/patient/${patientId}/anemia-nutrition-plan`);
              }}
            >
              <Text style={[styles.actionBtnText, { color: colors.accentTeal }]}>
                {plan ? 'تعديل الخطة' : 'وضع خطة علاجية'}
              </Text>
            </TouchableOpacity>
          </View>

          {plan ? (
            <View style={styles.detailsList}>
              <View style={styles.gridContainer}>
                <View style={[styles.gridCell, { backgroundColor: theme.background }]}>
                  <Text style={[styles.gridLabel, { color: theme.subtext }]}>الحديد المستهدف</Text>
                  <Text style={[styles.gridVal, { color: colors.danger }]}>{plan.targetIron} ملغ</Text>
                </View>
                <View style={[styles.gridCell, { backgroundColor: theme.background }]}>
                  <Text style={[styles.gridLabel, { color: theme.subtext }]}>فيتامين C</Text>
                  <Text style={[styles.gridVal, { color: theme.text }]}>{plan.targetVitaminC} ملغ</Text>
                </View>
                <View style={[styles.gridCell, { backgroundColor: theme.background }]}>
                  <Text style={[styles.gridLabel, { color: theme.subtext }]}>البروتين المستهدف</Text>
                  <Text style={[styles.gridVal, { color: colors.accentTeal }]}>{plan.targetProtein} غ</Text>
                </View>
                <View style={[styles.gridCell, { backgroundColor: theme.background }]}>
                  <Text style={[styles.gridLabel, { color: theme.subtext }]}>فيتامين B12</Text>
                  <Text style={[styles.gridVal, { color: theme.text }]}>{plan.targetB12} ميكروغ</Text>
                </View>
              </View>

              {plan.needsIronSupplement && (
                <View style={[styles.supplementAlert, { backgroundColor: colors.danger + '10' }]}>
                  <Ionicons name="medical" size={16} color={colors.danger} />
                  <Text style={[styles.supplementText, { color: theme.text }]}>
                    موصى بمكمل حديد: {plan.ironSupplementType === 'ferrous_sulfate' ? 'كبريتات الحديدوز' : 'فومارات الحديدوز'} بمعدل {plan.ironSupplementDose} ملغ/يوم لمدة {plan.ironSupplementDuration} أسابيع.
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="restaurant-outline" size={32} color={theme.subtext} />
              <Text style={[styles.emptyText, { color: theme.subtext }]}>يرجى وضع خطة التغذية والمكملات بعد استكمال تقييم المريض.</Text>
            </View>
          )}
        </View>

        {/* SECTION 3: monitoring list snapshot */}
        <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="trending-up" size={20} color={colors.info} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>المراقبة ومؤشرات التعافي</Text>
            </View>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.info + '15' }]}
              onPress={() => {
                if (!plan) {
                  Alert.alert('تنبيه', 'يرجى وضع الخطة الغذائية أولاً');
                  return;
                }
                router.push(`/patient/${patientId}/anemia-monitoring`);
              }}
            >
              <Text style={[styles.actionBtnText, { color: colors.info }]}>
                {monitoringList.length > 0 ? 'سجل متابعة جديد' : 'بدء المتابعة'}
              </Text>
            </TouchableOpacity>
          </View>

          {latestMonitoring ? (
            <View style={styles.detailsList}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.subtext }]}>آخر هيموجلوبين مقاس:</Text>
                <Text style={[styles.detailValue, { color: theme.text, fontWeight: 'bold' }]}>
                  {latestMonitoring.hemoglobin} g/dL ({latestMonitoring.followUpDate})
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.subtext }]}>نسبة تحسن الحالة:</Text>
                <View style={styles.progressWrapper}>
                  <View style={[styles.progressBarBg, { backgroundColor: theme.background }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${latestMonitoring.recoveryPercentage}%`, backgroundColor: colors.success },
                      ]}
                    />
                  </View>
                  <Text style={[styles.progressPct, { color: colors.success, fontWeight: 'bold' }]}>
                    {latestMonitoring.recoveryPercentage}%
                  </Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.subtext }]}>الالتزام بالمكملات:</Text>
                <Text
                  style={[
                    styles.detailValue,
                    { color: latestMonitoring.adherenceToSupplements ? colors.success : colors.danger },
                  ]}
                >
                  {latestMonitoring.adherenceToSupplements ? 'ملتزم تماماً ✅' : 'غير ملتزم ❌'}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="analytics-outline" size={32} color={theme.subtext} />
              <Text style={[styles.emptyText, { color: theme.subtext }]}>لا يوجد سجل زيارات متابعة لتسجيل تغير الهيموجلوبين حتى الآن.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 70,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingTop: Platform.OS === 'ios' ? 10 : 0,
  },
  backButton: {
    position: 'absolute',
    right: 16,
    padding: 8,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: fontSizes.lg,
    fontFamily: fontFamilies.bold,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  patientCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.md,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.danger + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  patientName: {
    fontSize: fontSizes.md,
    fontFamily: fontFamilies.bold,
    marginBottom: 2,
  },
  patientMeta: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.regular,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSizes.md,
    fontFamily: fontFamilies.bold,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  actionBtnText: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.bold,
  },
  detailsList: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.regular,
  },
  detailValue: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.bold,
  },
  gridContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  gridCell: {
    flex: 1,
    minWidth: '45%',
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  gridLabel: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.regular,
    marginBottom: 4,
  },
  gridVal: {
    fontSize: fontSizes.md,
    fontFamily: fontFamilies.bold,
  },
  supplementAlert: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 8,
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  supplementText: {
    flex: 1,
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.regular,
    textAlign: 'right',
  },
  progressWrapper: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 0.6,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPct: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.bold,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.regular,
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.regular,
  },
});
