import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { watchRecord } from '../../../src/data/database/observe';
import { useObservable } from '../../../src/presentation/hooks/useObservable';
import { useAppTheme } from '../../../src/presentation/hooks/useAppTheme';
import { colors, spacing, fontFamilies, fontSizes } from '../../../src/presentation/theme';
import { useGoutAssessment } from '../../../src/presentation/hooks/useGoutAssessment';
import { useGoutNutritionPlan } from '../../../src/presentation/hooks/useGoutNutritionPlan';
import { useGoutMonitoring } from '../../../src/presentation/hooks/useGoutMonitoring';

export default function GoutGatewayScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useAppTheme();

  const patient = useObservable(
    useMemo(() => watchRecord<any>('patients', patientId), [patientId]),
    null
  );

  const { assessment, isLoading: loadingAssessment } = useGoutAssessment(patientId);
  const { plan, isLoading: loadingPlan } = useGoutNutritionPlan(patientId);
  const { monitoring, isLoading: loadingMonitoring } = useGoutMonitoring(patientId);

  const isLoading = loadingAssessment || loadingPlan || loadingMonitoring || !patient;

  const severityLabels: Record<string, string> = {
    none: 'طبيعي (لا يوجد)',
    mild: 'خفيف',
    moderate: 'متوسط',
    severe: 'شديد',
    chronic_tophaceous: 'نقرس توفي مزمن',
  };

  const stageLabels: Record<string, string> = {
    hyperuricemia: 'فرط حمض يوريك الدم',
    acute_flare: 'نوبة حادة',
    intercritical: 'فترة بين النوبات',
    chronic_tophaceous: 'توفي مزمن',
  };

  const uricAcidStatusLabels: Record<string, string> = {
    normal: 'طبيعي',
    elevated: 'مرتفع قليلاً',
    high: 'مرتفع',
    very_high: 'مرتفع جداً',
  };

  const statusColors: Record<string, string> = {
    normal: colors.success,
    elevated: colors.warning,
    high: colors.danger,
    very_high: '#8B0000',
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={colors.accentRose} />
        <Text style={[styles.loadingText, { color: theme.subtext }]}>جاري تحميل ملف رعاية النقرس...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: colors.accentRose }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={colors.primaryContrast} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>بوابة رعاية النقرس (Gout NCP)</Text>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Patient header card */}
        <View style={[styles.patientCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={28} color={colors.accentRose} />
          </View>
          <View style={styles.patientInfo}>
            <Text style={[styles.patientName, { color: theme.text }]}>{patient.fullName}</Text>
            <Text style={[styles.patientMeta, { color: theme.subtext }]}>
              {patient.gender === 'female' ? 'أنثى' : 'ذكر'} | {patient.age} سنة | MRN: {patient.fileNumber}
            </Text>
          </View>
        </View>

        {/* SECTION 1: Assessment */}
        <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="flask" size={20} color={colors.accentRose} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>التقييم السريري والمخبري</Text>
            </View>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.accentRose + '15' }]}
              onPress={() => router.push(`/patient/${patientId}/gout-assessment`)}
            >
              <Text style={[styles.actionBtnText, { color: colors.accentRose }]}>
                {assessment ? 'تحديث التقييم' : 'بدء تقييم جديد'}
              </Text>
            </TouchableOpacity>
          </View>

          {assessment ? (
            <View style={styles.detailsList}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.subtext }]}>حمض اليوريك في المصل:</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>
                  {assessment.serumUricAcid} {assessment.uricAcidUnit}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.subtext }]}>حالة حمض اليوريك:</Text>
                <Text
                  style={[
                    styles.detailValue,
                    {
                      color: statusColors[assessment.uricAcidStatus] || theme.text,
                      fontWeight: 'bold',
                    },
                  ]}
                >
                  {uricAcidStatusLabels[assessment.uricAcidStatus] || assessment.uricAcidStatus}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.subtext }]}>شدة النقرس:</Text>
                <Text style={[styles.detailValue, { color: theme.text, fontWeight: 'bold' }]}>
                  {severityLabels[assessment.severity] || assessment.severity}
                </Text>
              </View>
              {assessment.stage && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.subtext }]}>المرحلة:</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {stageLabels[assessment.stage] || assessment.stage}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="clipboard-outline" size={32} color={theme.subtext} />
              <Text style={[styles.emptyText, { color: theme.subtext }]}>لا يوجد تقييم نقرس مسجل للمريض حتى الآن.</Text>
            </View>
          )}
        </View>

        {/* SECTION 2: Nutrition Plan */}
        <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="nutrition" size={20} color={colors.accentTeal} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>الخطة الغذائية والعلاجية</Text>
            </View>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.accentTeal + '15' }]}
              onPress={() => {
                if (!assessment) {
                  Alert.alert('تنبيه', 'يرجى تعبئة التقييم السريري أولاً');
                  return;
                }
                router.push(`/patient/${patientId}/gout-nutrition-plan`);
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
                  <Text style={[styles.gridLabel, { color: theme.subtext }]}>البيورين الأقصى</Text>
                  <Text style={[styles.gridVal, { color: colors.accentRose }]}>{plan.maxPurineIntake} ملغ</Text>
                </View>
                <View style={[styles.gridCell, { backgroundColor: theme.background }]}>
                  <Text style={[styles.gridLabel, { color: theme.subtext }]}>السعرات المستهدفة</Text>
                  <Text style={[styles.gridVal, { color: theme.text }]}>{plan.targetCalories} سعرة</Text>
                </View>
                <View style={[styles.gridCell, { backgroundColor: theme.background }]}>
                  <Text style={[styles.gridLabel, { color: theme.subtext }]}>السوائل المستهدفة</Text>
                  <Text style={[styles.gridVal, { color: colors.info }]}>{plan.targetFluid} مل</Text>
                </View>
                <View style={[styles.gridCell, { backgroundColor: theme.background }]}>
                  <Text style={[styles.gridLabel, { color: theme.subtext }]}>فيتامين C</Text>
                  <Text style={[styles.gridVal, { color: theme.text }]}>{plan.vitaminCDose} ملغ</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="restaurant-outline" size={32} color={theme.subtext} />
              <Text style={[styles.emptyText, { color: theme.subtext }]}>يرجى وضع الخطة الغذائية بعد استكمال تقييم المريض.</Text>
            </View>
          )}
        </View>

        {/* SECTION 3: Monitoring */}
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
                router.push(`/patient/${patientId}/gout-monitoring`);
              }}
            >
              <Text style={[styles.actionBtnText, { color: colors.info }]}>
                {monitoring ? 'تسجيل متابعة جديد' : 'بدء المتابعة'}
              </Text>
            </TouchableOpacity>
          </View>

          {monitoring ? (
            <View style={styles.detailsList}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.subtext }]}>آخر حمض يوريك مقاس:</Text>
                <Text style={[styles.detailValue, { color: theme.text, fontWeight: 'bold' }]}>
                  {monitoring.serumUricAcid} ملغ/دل
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.subtext }]}>حالة النوبة الأخيرة:</Text>
                <Text
                  style={[
                    styles.detailValue,
                    { color: monitoring.hasFlare ? colors.danger : colors.success },
                  ]}
                >
                  {monitoring.hasFlare ? `نوبة ${monitoring.flareSeverity}` : 'لا توجد نوبة نشطة'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.subtext }]}>نسبة التحسن:</Text>
                <View style={styles.progressWrapper}>
                  <View style={[styles.progressBarBg, { backgroundColor: theme.background }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${monitoring.improvementPercentage}%`, backgroundColor: colors.success },
                      ]}
                    />
                  </View>
                  <Text style={[styles.progressPct, { color: colors.success, fontWeight: 'bold' }]}>
                    {monitoring.improvementPercentage}%
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="analytics-outline" size={32} color={theme.subtext} />
              <Text style={[styles.emptyText, { color: theme.subtext }]}>لا يوجد سجل متابعة لتسجيل تغير حمض اليوريك بعد.</Text>
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
    backgroundColor: colors.accentRose + '15',
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
