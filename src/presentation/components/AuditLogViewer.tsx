import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontFamilies } from '../theme';
import { getAuditLogsByPatient, AuditLogEntry } from '../../data/services/AuditService';
import EmptyState from './EmptyState';

interface AuditLogViewerProps {
  patientId: string;
  limit?: number;
}

export default function AuditLogViewer({ patientId, limit = 50 }: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getAuditLogsByPatient(patientId, limit);
      setLogs(result);
    } catch (err) {
      setError('فشل في تحميل سجل النشاطات');
    } finally {
      setLoading(false);
    }
  }, [patientId, limit]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (logs.length === 0) {
    return (
      <EmptyState
        title="لا يوجد سجلات نشاط"
        subtitle="لم يتم تسجيل أي نشاط لهذا المريض بعد"
        icon="document-text-outline"
      />
    );
  }

  const renderLogItem = ({ item }: { item: AuditLogEntry }) => (
    <View style={styles.logItem}>
      <View style={styles.logHeader}>
        <Text style={styles.actionBadge}>{item.action}</Text>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleString('ar-YE')}
        </Text>
      </View>
      <Text style={styles.userInfo}>المستخدم: {item.userId}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>سجل نشاطات المريض</Text>
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={renderLogItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'right',
    fontFamily: fontFamilies.bold,
  },
  list: {
    paddingBottom: spacing.md,
  },
  logItem: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  actionBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    fontFamily: fontFamilies.bold,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: fontFamilies.regular,
  },
  userInfo: {
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: 'right',
    fontFamily: fontFamilies.regular,
  },
  errorText: {
    fontSize: 16,
    color: colors.danger,
    marginTop: spacing.md,
    textAlign: 'center',
    fontFamily: fontFamilies.regular,
  },
});
