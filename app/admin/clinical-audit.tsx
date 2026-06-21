import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../src/presentation/theme';
import {
  queryCalculationsByWeight,
  queryCalculationsByTEE
} from '../../src/data/repositories/CalculationRepository';
import CalculationModel from '../../src/data/models/Calculation';

export default function ClinicalAuditScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Cohorts
  const [obeseLowProtein, setObeseLowProtein] = useState<CalculationModel[]>([]);
  const [underfedPatients, setUnderfedPatients] = useState<CalculationModel[]>([]);

  useEffect(() => {
    let cancelled = false;
    loadAuditData(() => cancelled);
    return () => { cancelled = true; };
  }, []);

  async function loadAuditData(isCancelled: () => boolean = () => false) {
    setLoading(true);
    try {
      // 1. Obese patients cohort (Weight >= 100 kg)
      const heavyCalcs = await queryCalculationsByWeight(100, 'total_energy');
      
      // Filter obese patients with low protein (< 1.2 g/kg)
      const lowProt = heavyCalcs.filter((calc) => {
        const ratio = calc.proteinPerKg;
        return ratio !== null && ratio < 1.2;
      });
      if (!isCancelled()) setObeseLowProtein(lowProt);

      // 2. Underfed patients cohort (0 < TEE < 1500 kcal)
      const lowTeeCalcs = await queryCalculationsByTEE(1499, 'total_energy');
      // Filter out zero TEE
      const underfed = lowTeeCalcs.filter((calc) => (calc.resultTee || 0) > 0);
      if (!isCancelled()) setUnderfedPatients(underfed);
    } catch (err) {
      console.error('Error loading clinical audit cohorts:', err);
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={colors.primaryContrast} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>التدقيق الإكلينيكي والمخاطر</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Intro info alert */}
      <View style={styles.infoAlert}>
        <Ionicons name="shield-checkmark-outline" size={22} color={colors.success} style={{ marginLeft: 10 }} />
        <Text style={styles.infoAlertText}>
          تحديث تدقيق المخاطر الإكلينيكية تلقائي من السجلات الطبية. نستخدم الفهرسة لتحديد الحالات الحرجة.
        </Text>
      </View>

      {/* Cohort 1: Obese Low Protein */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.badge, { backgroundColor: colors.danger }]}>
            <Text style={styles.badgeText}>مخاطر عالية</Text>
          </View>
          <Text style={styles.sectionTitle}>
            مرضى السمنة المفرطة مع بروتين منخفض
          </Text>
        </View>
        
        <Text style={styles.criteriaDescription}>
          المعيار: وزن المريض {" >= "} 100 كجم ونسبة البروتين المحددة أقل من 1.2 جم/كجم من الوزن الفعلي.
        </Text>

        {obeseLowProtein.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle" size={40} color={colors.success} />
            <Text style={styles.emptyText}>لا توجد حالات سمنة تعاني من نقص مستهدف البروتين حالياً.</Text>
          </View>
        ) : (
          obeseLowProtein.map((calc) => {
            const ratio = calc.proteinPerKg;
            const isCritical = ratio !== null && ratio < 1.0;
            return (
              <View key={calc.id} style={styles.auditRow}>
                <View style={styles.rowTop}>
                  <View style={[styles.riskLabel, { backgroundColor: isCritical ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)' }]}>
                    <Text style={[styles.riskLabelText, { color: isCritical ? colors.danger : colors.warning }]}>
                      {ratio ? `${ratio.toFixed(2)} g/kg` : 'غير متوفر'}
                    </Text>
                  </View>
                  <Text style={styles.patientIdText}>الرمز التعريفي: {calc.patientId}</Text>
                </View>

                <View style={styles.rowDetails}>
                  <Text style={styles.detailText}>الوزن الحالي: {calc.inputWeightKg} كجم</Text>
                  <Text style={styles.detailText}>البروتين الكلي: {calc.resultProteinG} جم</Text>
                  <Text style={styles.detailText}>احتياج الطاقة TEE: {calc.resultTee} kcal</Text>
                </View>

                {isCritical && (
                  <View style={styles.criticalNotice}>
                    <Ionicons name="alert-circle" size={14} color={colors.danger} style={{ marginLeft: 4 }} />
                    <Text style={styles.criticalNoticeText}>
                      تنبيه: مستوى البروتين حرِج جدًا ({" < "} 1.0 جم/كجم) لمرضى السمنة!
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>

      {/* Cohort 2: Underfed (TEE < 1500) */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.badge, { backgroundColor: colors.warning }]}>
            <Text style={styles.badgeText}>متابعة لازمة</Text>
          </View>
          <Text style={styles.sectionTitle}>
            حالات سوء التغذية ونقص السعرات
          </Text>
        </View>

        <Text style={styles.criteriaDescription}>
          المعيار: الطاقة الكلية المقدرة TEE أقل من 1500 سعرة حرارية/يوم (مع استبعاد الحسابات الصفرية).
        </Text>

        {underfedPatients.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle" size={40} color={colors.success} />
            <Text style={styles.emptyText}>لا توجد حالات استهلاك طاقة منخفض للغاية حالياً.</Text>
          </View>
        ) : (
          underfedPatients.map((calc) => (
            <View key={calc.id} style={styles.auditRow}>
              <View style={styles.rowTop}>
                <View style={[styles.riskLabel, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                  <Text style={[styles.riskLabelText, { color: colors.info }]}>
                    {calc.resultTee} kcal
                  </Text>
                </View>
                <Text style={styles.patientIdText}>الرمز التعريفي: {calc.patientId}</Text>
              </View>

              <View style={styles.rowDetails}>
                <Text style={styles.detailText}>الوزن: {calc.inputWeightKg} كجم</Text>
                <Text style={styles.detailText}>العمر: {calc.inputAge} سنة</Text>
                <Text style={styles.detailText}>الصيغة المستخدمة: {calc.formulaName}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceSecondary },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 60,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primaryContrast,
    textAlign: 'center',
  },
  infoAlert: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: 8,
    margin: spacing.md,
    padding: spacing.md,
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  infoAlertText: {
    flex: 1,
    fontSize: 12,
    color: colors.success,
    textAlign: 'right',
    lineHeight: 18,
  },
  section: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'right',
  },
  criteriaDescription: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'right',
    marginBottom: spacing.md,
    lineHeight: 16,
  },
  badge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryContrast,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  auditRow: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  rowTop: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientIdText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  riskLabel: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  riskLabelText: {
    fontSize: 12,
    fontWeight: '700',
  },
  rowDetails: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  detailText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  criticalNotice: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderRadius: 6,
    padding: 6,
    marginTop: 2,
  },
  criticalNoticeText: {
    fontSize: 11,
    color: colors.danger,
    textAlign: 'right',
    fontWeight: '500',
  },
});
