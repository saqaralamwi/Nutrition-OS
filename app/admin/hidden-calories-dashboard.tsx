import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontFamilies } from '../../src/presentation/theme';
import { getDatabase } from '../../src/data/database';
import { Q } from '@nozbe/watermelondb';
import { calculateNutritionalRequirementsWithHiddenCalories } from '../../src/domain/calculators/NutritionEngine';

interface PatientHiddenCalDetails {
  id: string;
  fullName: string;
  fileNumber: string;
  bedNumber: string;
  department: string;
  primaryDiagnosis: string;
  hiddenCaloriesTotal: number;
  baseTee: number;
  adjustedTee: number;
  overfeedingRisk: boolean;
  medsBreakdown: {
    propofol: number;
    dextrose: number;
    midol: number;
    lipids: number;
    text: string;
  };
}

export default function HiddenCaloriesDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'high_risk'>('all');

  // Stats
  const [totalPatientsCount, setTotalPatientsCount] = useState(0);
  const [patientsWithMeds, setPatientsWithMeds] = useState<PatientHiddenCalDetails[]>([]);

  useEffect(() => {
    let cancelled = false;
    loadData(() => cancelled);
    return () => { cancelled = true; };
  }, []);

  async function loadData(isCancelled: () => boolean = () => false) {
    try {
      setLoading(true);
      let db;
      try {
        db = await getDatabase();
      } catch {
        Alert.alert('خطأ', 'تعذر الاتصال بقاعدة البيانات. يرجى التحقق من اتصال التخزين المحلي.');
        return;
      }
      if (!db || isCancelled()) return;

      // 1. Fetch total patients
      const totalCount = await db.get('patients').query().fetchCount();
      if (isCancelled()) return;
      setTotalPatientsCount(totalCount);

      // 2. Fetch all patients and find who has active medications
      const allPatients = (await db.get('patients').query().fetch()) as any[];
      const activeMeds = (await db
        .get('medications')
        .query(Q.where('is_active', true))
        .fetch()) as any[];

      // Group active meds by patientId
      const medsMap = new Map<string, any[]>();
      activeMeds.forEach((med) => {
        const pid = med.patientId;
        if (!medsMap.has(pid)) {
          medsMap.set(pid, []);
        }
        medsMap.get(pid)!.push(med);
      });

      // 3. For patients with active medications, calculate requirements and hidden calories
      const detailedList: PatientHiddenCalDetails[] = [];

      for (const p of allPatients) {
        if (isCancelled()) return;
        if (medsMap.has(p.id)) {
          try {
            const reqs = await calculateNutritionalRequirementsWithHiddenCalories(p.id);
            detailedList.push({
              id: p.id,
              fullName: p.fullName || p.nameAr || p.name || 'مريض غير معروف',
              fileNumber: p.fileNumber || '',
              bedNumber: p.bedNumber || 'غير محدد',
              department: p.department || 'العناية المركزة',
              primaryDiagnosis: p.primaryDiagnosis || 'غير محدد',
              hiddenCaloriesTotal: reqs.hiddenCalories.total,
              baseTee: reqs.baseTee,
              adjustedTee: reqs.adjustedTee,
              overfeedingRisk: reqs.adjustedTee < reqs.calories * 0.9 || reqs.hiddenCalories.total > reqs.baseTee * 0.1,
              medsBreakdown: {
                propofol: reqs.hiddenCalories.propofol,
                dextrose: reqs.hiddenCalories.dextrose,
                midol: reqs.hiddenCalories.midol,
                lipids: reqs.hiddenCalories.lipids,
                text: reqs.hiddenCalories.breakdown,
              },
            });
          } catch (err) {
            console.error(`Error calculating reqs for patient ${p.id}:`, err);
          }
        }
      }

      if (!isCancelled()) {
        setPatientsWithMeds(detailedList);
      }
    } catch (err) {
      console.error('Error loading dashboard statistics:', err);
      Alert.alert('خطأ', 'فشل في تحميل إحصائيات السعرات الحرارية المخفية');
    } finally {
      if (!isCancelled()) {
        setLoading(false);
      }
    }
  }

  // Derived stats
  const unitStats = useMemo(() => {
    let totalHiddenCal = 0;
    let propofolCount = 0;
    let dextroseCount = 0;
    let highRiskCount = 0;

    patientsWithMeds.forEach((p) => {
      totalHiddenCal += p.hiddenCaloriesTotal;
      if (p.medsBreakdown.propofol > 0) propofolCount++;
      if (p.medsBreakdown.dextrose > 0) dextroseCount++;
      if (p.overfeedingRisk) highRiskCount++;
    });

    return {
      totalHiddenCal,
      propofolCount,
      dextroseCount,
      highRiskCount,
    };
  }, [patientsWithMeds]);

  // Filtered list
  const filteredPatients = useMemo(() => {
    return patientsWithMeds.filter((p) => {
      // Tab filter
      if (activeTab === 'high_risk' && !p.overfeedingRisk) return false;

      // Search filter
      if (searchQuery.trim() === '') return true;
      const query = searchQuery.toLowerCase();
      return (
        p.fullName.toLowerCase().includes(query) ||
        p.fileNumber.toLowerCase().includes(query) ||
        p.bedNumber.toLowerCase().includes(query) ||
        p.primaryDiagnosis.toLowerCase().includes(query)
      );
    });
  }, [patientsWithMeds, activeTab, searchQuery]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>جاري تحميل إحصائيات وحدة التغذية...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={colors.primaryContrast} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>مراقبة السعرات الحرارية المخفية</Text>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {/* Unit Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderLeftColor: colors.danger }]}>
            <Ionicons name="flame-outline" size={24} color={colors.danger} />
            <Text style={[styles.statValue, { color: colors.danger }]}>
              {unitStats.totalHiddenCal}
            </Text>
            <Text style={styles.statLabel}>إجمالي السعرات المخفية بالوحدة</Text>
            <Text style={styles.statSubLabel}>سعرة/يوم من IV medications</Text>
          </View>

          <View style={[styles.statCard, { borderLeftColor: colors.warning }]}>
            <Ionicons name="alert-circle-outline" size={24} color={colors.warning} />
            <Text style={[styles.statValue, { color: colors.warning }]}>
              {unitStats.highRiskCount}
            </Text>
            <Text style={styles.statLabel}>حالات خطر فرط التغذية</Text>
            <Text style={styles.statSubLabel}>السعرات المخفية &gt; 10% من TEE</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderLeftColor: colors.info }]}>
            <Ionicons name="water-outline" size={24} color={colors.info} />
            <Text style={[styles.statValue, { color: colors.info }]}>
              {unitStats.propofolCount}
            </Text>
            <Text style={styles.statLabel}>مرضى على البروبوفول</Text>
            <Text style={styles.statSubLabel}>مستحلب دهون (1.1 kcal/ml)</Text>
          </View>

          <View style={[styles.statCard, { borderLeftColor: colors.success }]}>
            <Ionicons name="flask-outline" size={24} color={colors.success} />
            <Text style={[styles.statValue, { color: colors.success }]}>
              {unitStats.dextroseCount}
            </Text>
            <Text style={styles.statLabel}>مرضى على الدكستروز</Text>
            <Text style={styles.statSubLabel}>محاليل وريدية وغسيل (3.4 kcal/g)</Text>
          </View>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.success} />
          <Text style={styles.infoBannerText}>
            تقوم الحاسبة تلقائياً بخصم السعرات المخفية (Non-Nutritional Calories) من أهداف التغذية الأنبوبية والوريدية الصافية لتجنب المتلازمة الأيضية والإفراط في التغذية (Overfeeding).
          </Text>
        </View>

        {/* Tab Filters */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'high_risk' && styles.tabButtonActive]}
            onPress={() => setActiveTab('high_risk')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'high_risk' ? styles.tabTextActive : { color: colors.danger },
              ]}
            >
              عالية الخطورة ({unitStats.highRiskCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'all' && styles.tabButtonActive]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
              كل الحالات النشطة ({patientsWithMeds.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث بالاسم، رقم الملف، السرير أو التشخيص..."
            placeholderTextColor={colors.textDisabled}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Patients List */}
        <View style={styles.listSection}>
          {filteredPatients.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="file-tray-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>
                {searchQuery
                  ? 'لا توجد نتائج تطابق بحثك حالياً.'
                  : 'لا يوجد مرضى لديهم أدوية وريدية نشطة مسببة لسعرات مخفية في الوحدة.'}
              </Text>
            </View>
          ) : (
            filteredPatients.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.patientCard, p.overfeedingRisk && styles.patientCardHighRisk]}
                onPress={() => router.push(`/patient/${p.id}`)}
              >
                {/* Patient Header info */}
                <View style={styles.patientCardHeader}>
                  <View style={styles.bedBadge}>
                    <Text style={styles.bedText}>سرير: {p.bedNumber}</Text>
                  </View>
                  <View style={styles.patientNameContainer}>
                    <Text style={styles.patientName}>{p.fullName}</Text>
                    <Text style={styles.patientMeta}>
                      ملف: {p.fileNumber} | {p.department}
                    </Text>
                  </View>
                </View>

                {/* Primary Diagnosis */}
                <Text style={styles.diagnosisText}>التشخيص: {p.primaryDiagnosis}</Text>

                {/* Calorie Progress/Comparison */}
                <View style={styles.calContainer}>
                  <View style={styles.calBox}>
                    <Text style={styles.calLabel}>الهدف الصافي</Text>
                    <Text style={[styles.calValue, { color: colors.success }]}>
                      {p.adjustedTee} <Text style={styles.calUnit}>سعرة</Text>
                    </Text>
                  </View>

                  <View style={styles.calBox}>
                    <Text style={styles.calLabel}>السعرات المخفية</Text>
                    <Text style={[styles.calValue, { color: colors.danger }]}>
                      +{p.hiddenCaloriesTotal} <Text style={styles.calUnit}>سعرة</Text>
                    </Text>
                  </View>

                  <View style={styles.calBox}>
                    <Text style={styles.calLabel}>إجمالي الاحتياج (TEE)</Text>
                    <Text style={[styles.calValue, { color: colors.textPrimary }]}>
                      {p.baseTee} <Text style={styles.calUnit}>سعرة</Text>
                    </Text>
                  </View>
                </View>

                {/* Overfeeding Warning Banner */}
                {p.overfeedingRisk && (
                  <View style={styles.warningAlertBox}>
                    <Ionicons name="warning" size={16} color={colors.warning} />
                    <Text style={styles.warningAlertText}>
                      تنبيه: السعرات المخفية تمثل أكثر من 10% من الاحتياج الكلي. يجب تعديل التغذية!
                    </Text>
                  </View>
                )}

                {/* Medications detail breakdown */}
                <View style={styles.medsDetailBox}>
                  <Text style={styles.medsDetailTitle}>تفاصيل الأدوية النشطة والسعرات:</Text>
                  {p.medsBreakdown.propofol > 0 && (
                    <Text style={styles.medsDetailRow}>
                      • بروبوفول: +{p.medsBreakdown.propofol} سعرة/يوم
                    </Text>
                  )}
                  {p.medsBreakdown.dextrose > 0 && (
                    <Text style={styles.medsDetailRow}>
                      • دكستروز وريدي: +{p.medsBreakdown.dextrose} سعرة/يوم
                    </Text>
                  )}
                  {p.medsBreakdown.midol > 0 && (
                    <Text style={styles.medsDetailRow}>
                      • ميدازولام: +{p.medsBreakdown.midol} سعرة/يوم
                    </Text>
                  )}
                  {p.medsBreakdown.lipids > 0 && (
                    <Text style={styles.medsDetailRow}>
                      • مستحلب دهون: +{p.medsBreakdown.lipids} سعرة/يوم
                    </Text>
                  )}
                </View>

                <View style={styles.viewPatientRow}>
                  <Text style={styles.viewPatientText}>انتقل إلى ملف المريض وحاسبة التغذية</Text>
                  <Ionicons name="chevron-back" size={16} color={colors.primary} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: fontFamilies.medium,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 60,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primaryContrast,
    fontFamily: fontFamilies.bold,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row-reverse',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: fontFamilies.bold,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textPrimary,
    textAlign: 'center',
    fontFamily: fontFamilies.medium,
  },
  statSubLabel: {
    fontSize: 9,
    color: colors.textSecondary,
    textAlign: 'center',
    fontFamily: fontFamilies.regular,
  },
  infoBanner: {
    flexDirection: 'row-reverse',
    backgroundColor: '#0F2C20',
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.sm,
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    color: colors.textPrimary,
    textAlign: 'right',
    lineHeight: 18,
    fontFamily: fontFamilies.regular,
  },
  tabsContainer: {
    flexDirection: 'row-reverse',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: fontFamilies.medium,
  },
  tabTextActive: {
    color: colors.primaryContrast,
    fontFamily: fontFamilies.bold,
  },
  searchContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    height: 48,
  },
  searchIcon: {
    marginLeft: spacing.xs,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    textAlign: 'right',
    fontFamily: fontFamilies.regular,
    fontSize: 14,
  },
  listSection: {
    gap: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    fontFamily: fontFamilies.regular,
    paddingHorizontal: spacing.xl,
    lineHeight: 22,
  },
  patientCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  patientCardHighRisk: {
    borderColor: colors.danger,
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
  },
  patientCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bedBadge: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  bedText: {
    fontSize: 11,
    color: colors.textPrimary,
    fontFamily: fontFamilies.medium,
  },
  patientNameContainer: {
    alignItems: 'flex-end',
  },
  patientName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textPrimary,
    fontFamily: fontFamilies.bold,
  },
  patientMeta: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: fontFamilies.regular,
  },
  diagnosisText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    fontFamily: fontFamilies.medium,
  },
  calContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  calBox: {
    flex: 1,
    alignItems: 'center',
  },
  calLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontFamily: fontFamilies.regular,
    marginBottom: 4,
  },
  calValue: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fontFamilies.bold,
  },
  calUnit: {
    fontSize: 10,
    fontFamily: fontFamilies.regular,
  },
  warningAlertBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#451a03',
    borderColor: colors.warning,
    borderWidth: 1,
    borderRadius: 6,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  warningAlertText: {
    flex: 1,
    fontSize: 11,
    color: colors.warning,
    textAlign: 'right',
    fontFamily: fontFamilies.medium,
  },
  medsDetailBox: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: spacing.sm,
  },
  medsDetailTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'right',
    fontFamily: fontFamilies.bold,
    marginBottom: 4,
  },
  medsDetailRow: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'right',
    fontFamily: fontFamilies.regular,
    lineHeight: 16,
  },
  viewPatientRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  viewPatientText: {
    fontSize: 12,
    color: colors.primary,
    fontFamily: fontFamilies.medium,
  },
});
