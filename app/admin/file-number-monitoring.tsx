import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontFamilies } from '../../src/presentation/theme';
import { getDatabase } from '../../src/data/database';
import { migrateFileNumbers } from '../../src/database/migrate/migrateFileNumbers';
import PatientModel from '../../src/data/models/Patient';
import FileNumberCounterModel from '../../src/data/models/FileNumberCounter';

export default function FileNumberMonitoringScreen() {
  const router = useRouter();
  const [counters, setCounters] = useState<any[]>([]);
  const [patientCount, setPatientCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);

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
        Alert.alert('خطأ', 'تعذر الاتصال بقاعدة البيانات');
        return;
      }
      if (!db || isCancelled()) return;

      const countersData = await db.get<FileNumberCounterModel>('file_number_counters').query().fetch();
      if (isCancelled()) return;
      const sorted = countersData.sort((a, b) => b.year - a.year);
      setCounters(sorted);

      const count = await db.get<PatientModel>('patients').query().fetchCount();
      if (!isCancelled()) setPatientCount(count);
    } catch (err) {
      console.error(err);
      if (!isCancelled()) Alert.alert('خطأ', 'فشل في تحميل بيانات عدادات الملفات');
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  }

  async function handleMigration() {
    Alert.alert(
      'تأكيد تشغيل أداة الترحيل',
      'هل تريد تشغيل أداة تصحيح وترحيل أرقام الملفات القديمة إلى التنسيق التسلسلي الجديد؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تشغيل',
          style: 'default',
          onPress: async () => {
            try {
              setMigrating(true);
              const result = await migrateFileNumbers();
              Alert.alert(
                'اكتمل الترحيل',
                `تم ترحيل وتصحيح ${result.migrated} مريض.\nالأخطاء: ${result.errors}`,
                [{ text: 'حسنًا', onPress: () => loadData() }]
              );
            } catch (err: any) {
              Alert.alert('خطأ', err.message || 'فشلت عملية الترحيل');
            } finally {
              setMigrating(false);
            }
          }
        }
      ]
    );
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={colors.primaryContrast} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>مراقبة أرقام الملفات</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderLeftColor: colors.primary }]}>
          <Ionicons name="documents-outline" size={24} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.primary }]}>{patientCount}</Text>
          <Text style={styles.statLabel}>إجمالي ملفات المرضى</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: colors.success }]}>
          <Ionicons name="calendar-outline" size={24} color={colors.success} />
          <Text style={[styles.statValue, { color: colors.success }]}>{counters.length}</Text>
          <Text style={styles.statLabel}>السنوات النشطة</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>عدادات الترقيم السنوي</Text>
        
        {counters.length === 0 ? (
          <Text style={styles.emptyText}>لا توجد عدادات مسجلة حاليًا. سيتم إنشاء عداد جديد عند إنشاء أول مريض.</Text>
        ) : (
          counters.map((c) => (
            <View key={c.id} style={styles.counterRow}>
              <View style={styles.counterHeader}>
                <Text style={styles.counterYear}>{c.year}م</Text>
                <Text style={styles.counterCount}>{c.count} ملف</Text>
              </View>
              <Text style={styles.counterDate}>
                آخر تحديث: {c.lastIncrementedAt ? new Date(c.lastIncrementedAt).toLocaleString('ar-EG') : 'غير متوفر'}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>صيانة البيانات والترحيل</Text>
        <Text style={styles.descriptionText}>
          تُستخدم هذه الأداة لفحص وتصحيح أرقام ملفات المرضى القديمة التي لا تتبع التنسيق الجديد (CN-YYYY-XXXXX) لضمان اتساق قاعدة البيانات وتجنب أي تداخل في السجلات.
        </Text>
        
        <TouchableOpacity 
          style={[styles.migrateButton, migrating && styles.disabledButton]} 
          onPress={handleMigration}
          disabled={migrating}
        >
          {migrating ? (
            <ActivityIndicator size="small" color={colors.primaryContrast} />
          ) : (
            <>
              <Ionicons name="sync-outline" size={20} color={colors.primaryContrast} />
              <Text style={styles.migrateButtonText}>تصحيح وترحيل السجلات القديمة</Text>
            </>
          )}
        </TouchableOpacity>
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
    fontFamily: fontFamilies?.medium || 'System',
  },
  statsGrid: {
    flexDirection: 'row-reverse',
    padding: spacing.md,
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
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    fontFamily: fontFamilies?.regular || 'System',
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'right',
    fontFamily: fontFamilies?.medium || 'System',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: fontFamilies?.regular || 'System',
    paddingVertical: spacing.md,
  },
  counterRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
    alignItems: 'stretch',
  },
  counterHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  counterYear: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  counterCount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  counterDate: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    fontFamily: fontFamilies?.regular || 'System',
  },
  descriptionText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    textAlign: 'right',
    marginBottom: spacing.md,
    fontFamily: fontFamilies?.regular || 'System',
  },
  migrateButton: {
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.primary,
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  disabledButton: {
    opacity: 0.6,
  },
  migrateButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryContrast,
    fontFamily: fontFamilies?.medium || 'System',
  },
});
