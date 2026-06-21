import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { watchRecord } from '../../../src/data/database/observe';
import { useObservable } from '../../../src/presentation/hooks/useObservable';
import { useAppTheme } from '../../../src/presentation/hooks/useAppTheme';
import { colors, spacing, fontFamilies, fontSizes } from '../../../src/presentation/theme';
import { useOsteoporosisAssessment } from '../../../src/presentation/hooks/useOsteoporosisAssessment';
import { useOsteoporosisNutritionPlan } from '../../../src/presentation/hooks/useOsteoporosisNutritionPlan';
import { useOsteoporosisMonitoring } from '../../../src/presentation/hooks/useOsteoporosisMonitoring';

const classificationLabels: Record<string, string> = {
  normal: 'طبيعي',
  low_bone_mass: 'نقص كثافة عظمية (أوستيوبينيا)',
  osteoporosis: 'هشاشة عظام',
  severe_osteoporosis: 'هشاشة عظام حادة',
};

const fractureRiskLabels: Record<string, string> = {
  low: 'منخفض',
  moderate: 'متوسط',
  high: 'مرتفع',
  very_high: 'مرتفع جداً',
};

const riskColors: Record<string, string> = {
  low: colors.success,
  moderate: colors.accentAmber,
  high: colors.danger,
  very_high: '#7F1D1D',
};

const classificationColors: Record<string, string> = {
  normal: colors.success,
  low_bone_mass: colors.accentAmber,
  osteoporosis: colors.danger,
  severe_osteoporosis: '#7F1D1D',
};

export default function NcpOsteoporosisGatewayScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useAppTheme();

  const patient = useObservable(
    useMemo(() => watchRecord<any>('patients', patientId), [patientId]),
    null
  );

  const { assessment, isLoading: loadingAssessment } = useOsteoporosisAssessment(patientId);
  const { plan, isLoading: loadingPlan } = useOsteoporosisNutritionPlan(patientId);
  const { monitoringList, isLoading: loadingMonitoring } = useOsteoporosisMonitoring(patientId);

  const latestMonitoring = useMemo(() => {
    return monitoringList.length > 0 ? monitoringList[0] : null;
  }, [monitoringList]);

  const isLoading = loadingAssessment || loadingPlan || loadingMonitoring || !patient;

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={colors.accentViolet} />
        <Text style={[styles.loadingText, { color: theme.subtext }]}>جاري تحميل بوابة رعاية هشاشة العظام...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: colors.accentViolet }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={colors.primaryContrast} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>بوابة رعاية هشاشة العظام</Text>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.patientCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={28} color={colors.accentViolet} />
          </View>
          <View style={styles.patientInfo}>
            <Text style={[styles.patientName, { color: theme.text }]}>{patient.fullName}</Text>
            <Text style={[styles.patientMeta, { color: theme.subtext }]}>
              {patient.gender === 'female' ? 'أنثى' : 'ذكر'} | {patient.age} سنة | MRN: {patient.fileNumber}
            </Text>
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="flask" size={20} color={colors.accentViolet} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>التقييم السريري</Text>
            </View>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.accentViolet + '15' }]}
              onPress={() => router.push(`/patient/${patientId}/osteoporosis-assessment`)}
            >
              <Text style={[styles.actionBtnText, { color: colors.accentViolet }]}>
                {assessment ? 'تحديث التقييم' : 'بدء تقييم جديد'}
              </Text>
            </TouchableOpacity>
          </View>

          {assessment ? (
            <View style={styles.detailsList}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.subtext }]}>T-Score الكلي:</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{assessment.overallTScore}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.subtext }]}>التصنيف:</Text>
                <View style={[styles.badge, { backgroundColor: (classificationColors[assessment.classification] || colors.textDisabled) + '20' }]}>
                  <Text style={[styles.badgeText, { color: classificationColors[assessment.classification] || colors.textDisabled }]}>
                    {classificationLabels[assessment.classification] || assessment.classification}
                  </Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.subtext }]}>مخاطر الكسور:</Text>
                <View style={[styles.badge, { backgroundColor: (riskColors[assessment.fractureRisk] || colors.textDisabled) + '20' }]}>
                  <Text style={[styles.badgeText, { color: riskColors[assessment.fractureRisk] || colors.textDisabled }]}>
                    {fractureRiskLabels[assessment.fractureRisk] || assessment.fractureRisk}
                  </Text>
                </View>
              </View>
              {assessment.vitaminD25OH > 0 && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.subtext }]}>فيتامين D (25OH):</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{assessment.vitaminD25OH} نانوغرام/مل</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="clipboard-outline" size={32} color={theme.subtext} />
              <Text style={[styles.emptyText, { color: theme.subtext }]}>لا يوجد تقييم لهشاشة العظام مسجل للمريض حتى الآن.</Text>
            </View>
          )}
        </View>

        <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="nutrition" size={20} color={colors.accentTeal} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>الخطة الغذائية</Text>
            </View>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.accentTeal + '15' }]}
              onPress={() => {
                if (!assessment) {
                  Alert.alert('تنبيه', 'يرجى تعبئة التقييم السريري أولاً');
                  return;
                }
                router.push(`/patient/${patientId}/osteoporosis-nutrition-plan`);
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
                  <Text style={[styles.gridLabel, { color: theme.subtext }]}>الكالسيوم</Text>
                  <Text style={[styles.gridVal, { color: colors.accentViolet }]}>{plan.targetCalcium} ملغ</Text>
                </View>
                <View style={[styles.gridCell, { backgroundColor: theme.background }]}>
                  <Text style={[styles.gridLabel, { color: theme.subtext }]}>فيتامين D</Text>
                  <Text style={[styles.gridVal, { color: theme.text }]}>{plan.targetVitaminD} وحدة</Text>
                </View>
                <View style={[styles.gridCell, { backgroundColor: theme.background }]}>
                  <Text style={[styles.gridLabel, { color: theme.subtext }]}>البروتين</Text>
                  <Text style={[styles.gridVal, { color: colors.accentTeal }]}>{plan.targetProtein} غ</Text>
                </View>
                <View style={[styles.gridCell, { backgroundColor: theme.background }]}>
                  <Text style={[styles.gridLabel, { color: theme.subtext }]}>فيتامين K</Text>
                  <Text style={[styles.gridVal, { color: theme.text }]}>{plan.targetVitaminK} ميكروغ</Text>
                </View>
              </View>

              {plan.needsCalciumSupplement && (
                <View style={[styles.supplementAlert, { backgroundColor: colors.accentViolet + '10' }]}>
                  <Ionicons name="medical" size={16} color={colors.accentViolet} />
                  <Text style={[styles.supplementText, { color: theme.text }]}>
                    مكمل كالسيوم: {plan.calciumSupplementType === 'calcium_carbonate' ? 'كربونات الكالسيوم' : plan.calciumSupplementType === 'calcium_citrate' ? 'سترات الكالسيوم' : 'لاكتات الكالسيوم'} بمعدل {plan.calciumSupplementDose} ملغ/يوم.
                  </Text>
                </View>
              )}
              {plan.needsVitaminDSupplement && (
                <View style={[styles.supplementAlert, { backgroundColor: colors.accentTeal + '10' }]}>
                  <Ionicons name="medical" size={16} color={colors.accentTeal} />
                  <Text style={[styles.supplementText, { color: theme.text }]}>
                    مكمل فيتامين D: {plan.vitaminDSupplementType === 'd3' ? 'D3' : 'D2'} بمعدل {plan.vitaminDSupplementDose} وحدة/يوم.
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

        <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="trending-up" size={20} color={colors.info} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>المتابعة</Text>
            </View>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.info + '15' }]}
              onPress={() => {
                if (!plan) {
                  Alert.alert('تنبيه', 'يرجى وضع الخطة الغذائية أولاً');
                  return;
                }
                router.push(`/patient/${patientId}/osteoporosis-monitoring`);
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
                <Text style={[styles.detailLabel, { color: theme.subtext }]}>آخر موعد متابعة:</Text>
                <Text style={[styles.detailValue, { color: theme.text, fontWeight: 'bold' }]}>
                  {latestMonitoring.followUpDate}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.subtext }]}>تغير كثافة العظام (T-Score):</Text>
                <Text style={[styles.detailValue, {
                  color: latestMonitoring.boneDensityChange >= 0 ? colors.success : colors.danger,
                  fontWeight: 'bold',
                }]}>
                  {latestMonitoring.boneDensityChange > 0 ? '+' : ''}{latestMonitoring.boneDensityChange}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.subtext }]}>حالة التحسن:</Text>
                <Text style={[styles.detailValue, {
                  color: latestMonitoring.isImproving ? colors.success : colors.accentAmber,
                  fontWeight: 'bold',
                }]}>
                  {latestMonitoring.isImproving ? 'يوجد تحسن ✅' : 'قيد المتابعة'}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="analytics-outline" size={32} color={theme.subtext} />
              <Text style={[styles.emptyText, { color: theme.subtext }]}>لا يوجد سجل زيارات متابعة حتى الآن.</Text>
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
    backgroundColor: colors.accentViolet + '15',
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
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: fontSizes.xs,
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
