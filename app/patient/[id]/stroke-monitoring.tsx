import React, { useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { watchRecord, watchQuery } from '../../../src/data/database/observe';
import { useObservable } from '../../../src/presentation/hooks/useObservable';
import { useAppTheme } from '../../../src/presentation/hooks/useAppTheme';
import { colors, spacing, fontFamilies, fontSizes } from '../../../src/presentation/theme';
import { useStrokeAssessment } from '../../../src/presentation/hooks/useStrokeAssessment';
import { useStrokeNutritionPlan } from '../../../src/presentation/hooks/useStrokeNutritionPlan';
import { useDysphagiaIntervention } from '../../../src/presentation/hooks/useDysphagiaIntervention';
import { Q } from '@nozbe/watermelondb';

export default function StrokeMonitoringScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useAppTheme();

  // Load patient & weight history
  const patient = useObservable(
    useMemo(() => watchRecord<any>('patients', patientId), [patientId]),
    null
  );

  const weightLogs = useObservable(
    useMemo(() => 
      watchQuery<any>(db => 
        db.get('vitals_records').query(
          Q.where('patient_id', patientId),
          Q.sortBy('recorded_at', Q.desc)
        )
      ), [patientId]
    ),
    []
  );

  const { assessment, isLoading: loadAss } = useStrokeAssessment(patientId);
  const { plan, isLoading: loadPlan } = useStrokeNutritionPlan(patientId);
  const { intervention, isLoading: loadInt } = useDysphagiaIntervention(patientId);

  const loading = loadAss || loadPlan || loadInt || !patient;

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={colors.primaryContrast} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📊 مراقبة ومتابعة السكتة الدماغية</Text>
        <Text style={styles.headerSubtitle}>{patient.fullName} | {patient.fileNumber}</Text>
      </View>

      <View style={styles.content}>
        {/* Compliance Status Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>الحالة الحالية والتوصيات الطبية</Text>
          
          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: theme.subtext }]}>مسار التغذية النشط:</Text>
            <Text style={[styles.metricValue, { color: colors.primary }]}>
              {assessment?.feedingRoute === 'oral' ? 'فموي' :
               assessment?.feedingRoute === 'enteral_nasogastric' ? 'أنبوب أنفي (NG)' :
               assessment?.feedingRoute === 'enteral_percutaneous' ? 'أنبوب معدي (PEG)' :
               assessment?.feedingRoute === 'mixed' ? 'مختلط' : 'غير محدد'}
            </Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: theme.subtext }]}>قوام الغذاء المعتمد:</Text>
            <Text style={[styles.metricValue, { color: colors.accentTeal }]}>
              {assessment?.foodConsistency === 'regular' ? 'طبيعي' :
               assessment?.foodConsistency === 'soft' ? 'لين' :
               assessment?.foodConsistency === 'pureed' ? 'مهروس' :
               assessment?.foodConsistency === 'npo' ? 'NPO صيام فموي' : 'غير محدد'}
            </Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: theme.subtext }]}>سماكة السوائل الموصى بها:</Text>
            <Text style={[styles.metricValue, { color: colors.accentIndigo }]}>
              {plan?.thickenLiquids ? (
                plan.liquidThickness === 'thin' ? 'رقيق جداً' :
                plan.liquidThickness === 'nectar' ? 'رحيق (Nectar)' :
                plan.liquidThickness === 'honey' ? 'عسل (Honey)' : 'سميك جداً'
              ) : 'سوائل طبيعية'}
            </Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: theme.subtext }]}>مستوى خطر الارتشاف الرئوي:</Text>
            <Text style={[
              styles.metricValue, 
              { color: plan?.aspirationRisk === 'high' ? colors.danger : plan?.aspirationRisk === 'moderate' ? colors.warning : colors.success }
            ]}>
              {plan?.aspirationRisk === 'high' ? 'مرتفع جداً ⚠️' :
               plan?.aspirationRisk === 'moderate' ? 'متوسط ⚠️' : 'منخفض عادي ✅'}
            </Text>
          </View>
        </View>

        {/* Safety Guidelines compliance checklist */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>تدابير السلامة والوضعية الحالية</Text>
          
          <View style={styles.checkRow}>
            <Ionicons 
              name={intervention?.feedingPosition === 'upright_90' ? "checkmark-circle" : "close-circle"} 
              size={20} 
              color={intervention?.feedingPosition === 'upright_90' ? colors.success : colors.warning} 
            />
            <Text style={[styles.checkText, { color: theme.text }]}>
              وضعية التغذية: {
                intervention?.feedingPosition === 'upright_90' ? 'قائم 90 درجة (طبيعي وآمن)' : 
                intervention?.feedingPosition === 'fowler' ? 'مائل 45 درجة (مقبول)' : 'غير آمن'
              }
            </Text>
          </View>

          <View style={styles.checkRow}>
            <Ionicons 
              name={intervention?.chinTuck ? "checkmark-circle" : "alert-circle"} 
              size={20} 
              color={intervention?.chinTuck ? colors.success : colors.danger} 
            />
            <Text style={[styles.checkText, { color: theme.text }]}>
              {intervention?.chinTuck ? 'تم توجيه المريض لإمالة الذقن للصدر أثناء البلع' : 'تحذير: لم يتم تفعيل تمرين الذقن للصدر (Chin-tuck)'}
            </Text>
          </View>

          <View style={styles.checkRow}>
            <Ionicons 
              name={intervention?.suctionAvailable ? "checkmark-circle" : "alert-circle"} 
              size={20} 
              color={intervention?.suctionAvailable ? colors.success : colors.danger} 
            />
            <Text style={[styles.checkText, { color: theme.text }]}>
              {intervention?.suctionAvailable ? 'جهاز شفط الإفرازات متوفر وجاهز بجانب السرير' : 'تحذير: لا يتوفر جهاز شفط الإفرازات بالسرير!'}
            </Text>
          </View>
        </View>

        {/* Weight Monitoring History */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>سجل وزن المريض والمتابعة</Text>
          
          {weightLogs.length === 0 ? (
            <Text style={[styles.noData, { color: theme.subtext }]}>لا توجد أوزان مسجلة للمريض حالياً.</Text>
          ) : (
            weightLogs.map((log: any, index: number) => (
              <View key={log.id || index} style={styles.logRow}>
                <Text style={[styles.logDate, { color: theme.subtext }]}>
                  {log.recordDate ? new Date(log.recordDate).toLocaleDateString() : new Date(log.createdAt).toLocaleDateString()}
                </Text>
                <Text style={[styles.logWeight, { color: theme.text }]}>
                  {log.weightKg || log.weight || '-'} كجم
                </Text>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: colors.primaryDark,
    paddingTop: 48,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backBtn: {
    position: 'absolute',
    top: 52,
    start: spacing.lg,
    zIndex: 1,
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fontFamilies.bold,
    color: colors.primaryContrast,
    textAlign: 'right',
    marginTop: 20,
  },
  headerSubtitle: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.regular,
    color: colors.textTertiary,
    textAlign: 'right',
    marginTop: 2,
    opacity: 0.85,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.lg,
  },
  cardTitle: {
    fontSize: fontSizes.md + 2,
    fontFamily: fontFamilies.bold,
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  metricRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  metricLabel: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.medium,
  },
  metricValue: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.bold,
  },
  checkRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs + 2,
  },
  checkText: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.regular,
    flex: 1,
    textAlign: 'right',
  },
  noData: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.regular,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  logRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logDate: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.regular,
  },
  logWeight: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.bold,
  },
});
