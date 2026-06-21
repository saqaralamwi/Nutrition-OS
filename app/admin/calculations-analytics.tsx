import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../src/presentation/theme';
import {
  queryCalculationsByWeight,
  queryCalculationsByTEE,
  aggregateCalculations
} from '../../src/data/repositories/CalculationRepository';
import CalculationModel from '../../src/data/models/Calculation';

export default function CalculationsAnalyticsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Filters and Lists
  const [minWeight, setMinWeight] = useState('80');
  const [maxTee, setMaxTee] = useState('2500');
  const [weightFilteredCalcs, setWeightFilteredCalcs] = useState<CalculationModel[]>([]);
  const [teeFilteredCalcs, setTeeFilteredCalcs] = useState<CalculationModel[]>([]);

  // Aggregates
  const [aggregates, setAggregates] = useState<Record<string, { count: number; avgTee: number; avgProtein: number }>>({});

  useEffect(() => {
    let cancelled = false;
    loadData(() => cancelled);
    return () => { cancelled = true; };
  }, []);

  async function loadData(isCancelled: () => boolean = () => false) {
    setLoading(true);
    try {
      // Load aggregates grouped by gender
      const agg = await aggregateCalculations('total_energy', 'input_gender');
      if (!isCancelled()) setAggregates(agg);

      // Load filtered lists based on default inputs
      const wt = parseFloat(minWeight) || 0;
      const te = parseFloat(maxTee) || 99999;
      
      const wCalcs = await queryCalculationsByWeight(wt, 'total_energy');
      const tCalcs = await queryCalculationsByTEE(te, 'total_energy');

      if (!isCancelled()) {
        setWeightFilteredCalcs(wCalcs);
        setTeeFilteredCalcs(tCalcs);
      }
    } catch (err) {
      console.error('Error loading analytics data:', err);
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  }

  async function handleApplyFilters() {
    setLoading(true);
    try {
      const wt = parseFloat(minWeight) || 0;
      const te = parseFloat(maxTee) || 99999;

      const wCalcs = await queryCalculationsByWeight(wt, 'total_energy');
      const tCalcs = await queryCalculationsByTEE(te, 'total_energy');

      setWeightFilteredCalcs(wCalcs);
      setTeeFilteredCalcs(tCalcs);
    } catch (err) {
      console.error('Error applying filters:', err);
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={colors.primaryContrast} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تحليلات العمليات الحسابية</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Aggregate Cards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>معدلات استهلاك الطاقة والبروتين حسب الجنس</Text>
        <View style={styles.grid}>
          {/* Male Aggregates */}
          <View style={[styles.card, { borderLeftColor: colors.info }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="male" size={20} color={colors.info} />
              <Text style={styles.cardTitle}>الذكور</Text>
            </View>
            <Text style={styles.metricText}>
              العدد: <Text style={styles.boldText}>{aggregates.male?.count || 0}</Text>
            </Text>
            <Text style={styles.metricText}>
              متوسط TEE: <Text style={styles.boldText}>{aggregates.male?.avgTee || 0} kcal</Text>
            </Text>
            <Text style={styles.metricText}>
              متوسط البروتين: <Text style={styles.boldText}>{aggregates.male?.avgProtein || 0} g</Text>
            </Text>
          </View>

          {/* Female Aggregates */}
          <View style={[styles.card, { borderLeftColor: colors.danger }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="female" size={20} color={colors.danger} />
              <Text style={styles.cardTitle}>الإناث</Text>
            </View>
            <Text style={styles.metricText}>
              العدد: <Text style={styles.boldText}>{aggregates.female?.count || 0}</Text>
            </Text>
            <Text style={styles.metricText}>
              متوسط TEE: <Text style={styles.boldText}>{aggregates.female?.avgTee || 0} kcal</Text>
            </Text>
            <Text style={styles.metricText}>
              متوسط البروتين: <Text style={styles.boldText}>{aggregates.female?.avgProtein || 0} g</Text>
            </Text>
          </View>
        </View>
      </View>

      {/* Query Filters */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>البحث والفلترة المتقدمة (مؤرشف ومفهرس)</Text>
        
        <View style={styles.filterRow}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>الوزن الأدنى (kg):</Text>
            <TextInput
              style={styles.textInput}
              value={minWeight}
              onChangeText={setMinWeight}
              keyboardType="numeric"
              placeholder="مثال: 80"
              placeholderTextColor={colors.textDisabled}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>الحد الأقصى للطاقة (kcal):</Text>
            <TextInput
              style={styles.textInput}
              value={maxTee}
              onChangeText={setMaxTee}
              keyboardType="numeric"
              placeholder="مثال: 2500"
              placeholderTextColor={colors.textDisabled}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilters}>
          <Ionicons name="search" size={18} color={colors.primaryContrast} style={{ marginLeft: 8 }} />
          <Text style={styles.applyButtonText}>تطبيق الفلترة المفهرسة</Text>
        </TouchableOpacity>
      </View>

      {/* Filtered Lists View */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          المرضى فوق وزن ({minWeight} كجم) - العدد: {weightFilteredCalcs.length}
        </Text>
        {weightFilteredCalcs.length === 0 ? (
          <Text style={styles.emptyText}>لا يوجد مرضى مطابقين لهذا الوزن.</Text>
        ) : (
          weightFilteredCalcs.slice(0, 5).map((calc) => (
            <View key={calc.id} style={styles.patientRow}>
              <View style={styles.patientInfo}>
                <Text style={styles.patientIdText}>الرمز: {calc.patientId}</Text>
                <Text style={styles.patientSubText}>
                  الوزن: {calc.inputWeightKg} كجم | الجنس: {calc.inputGender === 'male' ? 'ذكر' : 'أنثى'}
                </Text>
              </View>
              <Text style={styles.patientMetricText}>{calc.resultTee} kcal</Text>
            </View>
          ))
        )}

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>
          الحسابات بأقل من ({maxTee} سعرة) - العدد: {teeFilteredCalcs.length}
        </Text>
        {teeFilteredCalcs.length === 0 ? (
          <Text style={styles.emptyText}>لا يوجد مرضى مطابقين لهذه السعرات.</Text>
        ) : (
          teeFilteredCalcs.slice(0, 5).map((calc) => (
            <View key={calc.id} style={styles.patientRow}>
              <View style={styles.patientInfo}>
                <Text style={styles.patientIdText}>الرمز: {calc.patientId}</Text>
                <Text style={styles.patientSubText}>
                  الوزن: {calc.inputWeightKg} كجم | الصيغة: {calc.formulaName}
                </Text>
              </View>
              <Text style={styles.patientMetricText}>{calc.resultTee} kcal</Text>
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
  section: {
    backgroundColor: colors.surface,
    margin: spacing.md,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'right',
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  metricText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    marginBottom: 4,
  },
  boldText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
    textAlign: 'right',
  },
  textInput: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    color: colors.textPrimary,
    textAlign: 'center',
    fontSize: 14,
  },
  applyButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  applyButtonText: {
    color: colors.primaryContrast,
    fontWeight: '600',
    fontSize: 14,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textDisabled,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  patientRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
  },
  patientInfo: {
    alignItems: 'flex-end',
  },
  patientIdText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  patientSubText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  patientMetricText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
});
