import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { spacing, safeHeaderPaddingTop } from '../../../src/presentation/theme';
import ArabicText from '../../../src/presentation/components/ArabicText';
import LabTrendChart from '../../../src/presentation/components/LabTrendChart';
import LabTrendChartFilters, { LabFilters } from '../../../src/presentation/components/LabTrendChartFilters';
import { LabResultRecord } from '../../../src/domain/repositories/ILabResultRepository';
import { LAB_TEST_PARAMETERS } from '../../../src/domain/constants/labTestParameters';

const COLORS = {
  background: '#0F172A',
  surface: '#1E293B',
  border: '#475569',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  accent: '#10B981',
};

export default function LabTrendsScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<LabResultRecord[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<string[]>(['NA', 'K', 'CREAT', 'ALT']);
  const [filters, setFilters] = useState<LabFilters>({ category: null, showOnlyAbnormal: false });

  useEffect(() => {
    async function load() {
      try {
        const { LabResultRepository } = await import('../../../src/data/repositories/LabResultRepository');
        const repo = new LabResultRepository();
        const all = await repo.getByPatientId(patientId);
        setResults(all);
      } catch (err) {
        console.error('Failed to load lab results for trends:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [patientId]);

  const handleFilterChange = useCallback((f: LabFilters) => {
    setFilters(f);
  }, []);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <ArabicText style={styles.loadingText}>جاري تحميل البيانات...</ArabicText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-forward" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <ArabicText bold style={styles.headerTitle}>اتجاهات التحاليل المخبرية</ArabicText>
          <ArabicText style={styles.headerSubtitle}>
            {results.length} نتيجة
          </ArabicText>
        </View>
        <Ionicons name="trending-up-outline" size={24} color={COLORS.accent} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40, gap: spacing.md, paddingHorizontal: spacing.md }}>
        {/* Filters */}
        <LabTrendChartFilters
          onFilterChange={handleFilterChange}
          selectedCodes={selectedCodes}
          onSelectedCodesChange={setSelectedCodes}
        />

        {/* Summary Banner */}
        <View style={styles.summaryBanner}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.textSecondary} />
          <ArabicText style={styles.summaryText}>
            {selectedCodes.length === 0
              ? 'اختر معاملات من القائمة أعلاه لعرض الاتجاهات.'
              : `عرض الاتجاهات لـ ${selectedCodes.length} معمل` +
                (filters.showOnlyAbnormal ? ' (القيم غير الطبيعية فقط)' : '')}
          </ArabicText>
        </View>

        {/* Charts */}
        {selectedCodes.length > 0 ? (
          <LabTrendChart
            results={results}
            parameterCodes={selectedCodes}
            showOnlyAbnormal={filters.showOnlyAbnormal}
          />
        ) : (
          <View style={styles.noSelection}>
            <Ionicons name="bar-chart-outline" size={48} color={COLORS.textSecondary} />
            <ArabicText style={styles.noSelectionText}>
              اختر معاملات لعرض الاتجاهات البيانية
            </ArabicText>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  loadingText: { fontSize: 16, color: COLORS.textSecondary },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingTop: safeHeaderPaddingTop,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, color: COLORS.textPrimary, textAlign: 'right' },
  headerSubtitle: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'right' },
  summaryBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, textAlign: 'right' },
  noSelection: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: spacing.md },
  noSelectionText: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center' },
});
