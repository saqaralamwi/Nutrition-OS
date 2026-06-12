import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../src/presentation/theme';
import { PatientRepository } from '../../src/data/repositories/PatientRepository';

interface DiseaseStat {
  name: string;
  count: number;
  percentage: number;
}

interface AnalyticsData {
  totalPatients: number;
  activePatients: number;
  avgAge: number;
  avgBmi: number;
  diseaseDistribution: DiseaseStat[];
  inpatientCount: number;
  outpatientCount: number;
}

export default function AdminDashboardScreen() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      const repo = new PatientRepository();
      const allPatients = await repo.findAll();
      const activePatients = allPatients.filter((p) => p.status === 'active');
      const inpatients = allPatients.filter((p) => p.patientType === 'inpatient');
      const outpatients = allPatients.filter((p) => p.patientType === 'outpatient');

      const avgAge =
        allPatients.length > 0
          ? Math.round(allPatients.reduce((s, p) => s + p.age, 0) / allPatients.length)
          : 0;

      const diseaseMap = new Map<string, number>();
      allPatients.forEach((p) => {
        const diag = p.primaryDiagnosis;
        diseaseMap.set(diag, (diseaseMap.get(diag) || 0) + 1);
      });
      const total = allPatients.length;
      const diseaseDistribution: DiseaseStat[] = Array.from(diseaseMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({
          name,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        }));

      setData({
        totalPatients: allPatients.length,
        activePatients: activePatients.length,
        avgAge,
        avgBmi: 0,
        diseaseDistribution,
        inpatientCount: inpatients.length,
        outpatientCount: outpatients.length,
      });
    } catch {
      setData(null);
    } finally {
      setLoading(false);
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>لوحة التحكم</Text>
      </View>

      {data && (
        <>
          <View style={styles.statsGrid}>
            <StatCard
              icon="people"
              value={data.totalPatients.toString()}
              label="إجمالي المرضى"
              color={colors.primary}
            />
            <StatCard
              icon="heart"
              value={data.activePatients.toString()}
              label="حالات نشطة"
              color={colors.success}
            />
            <StatCard
              icon="calendar"
              value={data.avgAge.toString()}
              label="متوسط العمر"
              color={colors.info}
            />
            <StatCard
              icon="bed"
              value={data.inpatientCount.toString()}
              label="منومين"
              color={colors.warning}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>توزيع التشخيصات</Text>
            {data.diseaseDistribution.slice(0, 5).map((d, i) => (
              <View key={i} style={styles.diseaseRow}>
                <View style={styles.diseaseInfo}>
                  <Text style={styles.diseaseName} numberOfLines={1}>
                    {d.name}
                  </Text>
                  <Text style={styles.diseaseCount}>{d.count}</Text>
                </View>
                <View style={styles.barBg}>
                  <View
                    style={[styles.barFill, { width: `${d.percentage}%` }]}
                  />
                </View>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>أنواع المرضى</Text>
            <TypeRow label="منوم" count={data.inpatientCount} icon="bed" />
            <TypeRow label="عيادات خارجية" count={data.outpatientCount} icon="medical" />
            <TypeRow
              label="استشارة"
              count={data.totalPatients - data.inpatientCount - data.outpatientCount}
              icon="chatbubbles"
            />
          </View>
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Ionicons name={icon as any} size={24} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function TypeRow({ label, count, icon }: { label: string; count: number; icon: string }) {
  return (
    <View style={styles.typeRow}>
      <Ionicons name={icon as any} size={18} color={colors.textSecondary} />
      <Text style={styles.typeLabel}>{label}</Text>
      <Text style={styles.typeCount}>{count}</Text>
    </View>
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
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primaryContrast,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  statCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  section: {
    backgroundColor: colors.surface,
    margin: spacing.md,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  diseaseRow: {
    marginBottom: spacing.sm,
  },
  diseaseInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  diseaseName: {
    fontSize: 13,
    color: colors.textPrimary,
    flex: 1,
  },
  diseaseCount: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  barBg: {
    height: 6,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
  },
  typeLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  typeCount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
