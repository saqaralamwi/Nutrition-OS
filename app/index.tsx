import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
  ListRenderItemInfo,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { usePatientStore } from '../src/presentation/stores/patientStore';
import PatientCard from '../src/presentation/components/PatientCard';
import EmptyState from '../src/presentation/components/EmptyState';
import ErrorView from '../src/presentation/components/ErrorView';
import SearchBar from '../src/presentation/components/SearchBar';
import { colors, spacing } from '../src/presentation/theme';
import { Patient } from '../src/domain/entities/Patient';

const LIST_ITEM_HEIGHT = 110;

export default function PatientListScreen() {
  const router = useRouter();
  const patients = usePatientStore((s) => s.patients);
  const isLoading = usePatientStore((s) => s.isLoading);
  const error = usePatientStore((s) => s.error);
  const totalCount = usePatientStore((s) => s.totalCount);
  const activeCount = usePatientStore((s) => s.activeCount);
  const sortOrder = usePatientStore((s) => s.sortOrder);
  const searchQuery = usePatientStore((s) => s.searchQuery);
  const loadPatients = usePatientStore((s) => s.loadPatients);
  const searchPatients = usePatientStore((s) => s.searchPatients);
  const setSortOrder = usePatientStore((s) => s.setSortOrder);
  const deletePatient = usePatientStore((s) => s.deletePatient);

  useFocusEffect(
    useCallback(() => {
      loadPatients();
    }, [])
  );

  const handlePatientPress = useCallback(
    (patient: Patient) => {
      router.push(`/patient/${patient.id}`);
    },
    [router]
  );

  const handleDeletePress = useCallback(
    (id: string, name: string) => {
      Alert.alert('حذف مريض', `هل أنت متأكد من حذف المريض "${name}"؟`, [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => deletePatient(id),
        },
      ]);
    },
    [deletePatient]
  );

  const handleSearch = useCallback(
    (text: string) => {
      if (text.trim().length === 0) {
        loadPatients();
        return;
      }
      searchPatients(text);
    },
    [loadPatients, searchPatients]
  );

  const toggleSort = useCallback(() => {
    setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest');
  }, [sortOrder, setSortOrder]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Patient>) => (
      <PatientCard
        patient={item}
        onPress={handlePatientPress}
        onDelete={() => handleDeletePress(item.id, item.fullName)}
      />
    ),
    [handlePatientPress, handleDeletePress]
  );

  const keyExtractor = useCallback((item: Patient) => item.id, []);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: LIST_ITEM_HEIGHT,
      offset: LIST_ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  if (error && patients.length === 0) {
    return (
      <View style={styles.container}>
        <ErrorView message={error} onRetry={loadPatients} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            onPress={() => router.push('/admin')}
            style={styles.headerIconBtn}
          >
            <Ionicons name="stats-chart" size={20} color={colors.primaryContrast} />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>نظام إدارة التغذية العلاجية</Text>
        <Text style={styles.headerSubtitle}>نسخة قيد التطوير من أنس الأموي</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalCount}</Text>
          <Text style={styles.statLabel}>إجمالي الحالات</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{activeCount}</Text>
          <Text style={styles.statLabel}>نشط</Text>
        </View>
      </View>

      <SearchBar value={searchQuery} onChangeText={handleSearch} />

      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.sortButton} onPress={toggleSort}>
          <Ionicons
            name={sortOrder === 'newest' ? 'arrow-down' : 'arrow-up'}
            size={16}
            color={colors.textSecondary}
          />
          <Text style={styles.sortLabel}>
            {sortOrder === 'newest' ? 'الأحدث أولاً' : 'الأقدم أولاً'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.resultCount}>{patients.length} مريض</Text>
      </View>

      <FlatList
        data={patients}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews={true}
        contentContainerStyle={
          patients.length === 0 ? styles.emptyContainer : styles.list
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <EmptyState
              title={searchQuery ? 'لا توجد نتائج' : 'لا يوجد مرضى'}
              subtitle={
                searchQuery
                  ? 'حاول البحث باسم آخر'
                  : 'أضف مريضاً جديداً لبدء العمل'
              }
              icon={searchQuery ? 'search-outline' : 'people-outline'}
            />
          )
        }
        onRefresh={loadPatients}
        refreshing={isLoading}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/patient/new')}
        activeOpacity={0.8}
        accessibilityLabel="إضافة مريض جديد"
      >
        <Ionicons name="add" size={28} color={colors.primaryContrast} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 60,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  headerIconBtn: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'ThmanyahSans-Black',
    color: colors.primaryContrast,
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'ThmanyahSans-Medium',
    color: colors.primaryContrast,
    opacity: 0.8,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  headerUser: {
    fontSize: 12,
    fontFamily: 'ThmanyahSans-Light',
    color: colors.primaryContrast,
    opacity: 0.6,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNumber: {
    fontSize: 28,
    fontFamily: 'ThmanyahSans-Bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: 'ThmanyahSans-Regular',
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
  },
  sortLabel: {
    fontSize: 13,
    fontFamily: 'ThmanyahSans-Regular',
    color: colors.textSecondary,
  },
  resultCount: {
    fontSize: 13,
    fontFamily: 'ThmanyahSans-Regular',
    color: colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  list: {
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    start: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
  },
});
