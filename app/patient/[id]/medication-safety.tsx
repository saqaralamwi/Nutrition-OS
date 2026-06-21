import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  Alert, Platform, TextInput, KeyboardAvoidingView,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { combineLatest, of, Observable } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { colors, spacing, fontFamilies, fontSizes } from '../../../src/presentation/theme';
import { useObservableArray } from '../../../src/presentation/hooks/useObservable';
import { observeActiveMedications } from '../../../src/data/repositories/ReactiveQuery';
import { watchQuery } from '../../../src/data/database/observe';
import type DrugNutrientInteraction from '../../../src/data/models/DrugNutrientInteraction';


interface InteractionAlert {
  id: string;
  activeIngredient: string;
  clinicalSeverity: string;
  mechanismEn?: string;
  dietaryActionEn?: string;
  isCritical: boolean;
  isModerate: boolean;
  isMild: boolean;
  matchedMedication: string;
}

function observeDrugNutrientAlerts(patientId: string): Observable<InteractionAlert[]> {
  return observeActiveMedications(patientId).pipe(
    map(meds =>
      meds
        .filter(m => m.isActive)
        .map(m => (m.drugName || m.name || '').toLowerCase().trim())
        .filter(Boolean)
    ),
    switchMap(activeNames => {
      if (activeNames.length === 0) return of([]);
      return watchQuery<DrugNutrientInteraction>(db =>
        db.get('drug_nutrient_interactions').query()
      ).pipe(
        map(allInteractions => {
          const results: InteractionAlert[] = [];
          for (const medName of activeNames) {
            for (const dni of allInteractions) {
              const ingredient = dni.activeIngredient.toLowerCase().trim();
              const matched =
                medName.includes(ingredient) || ingredient.includes(medName);
              if (!matched) continue;
              results.push({
                id: dni.id,
                activeIngredient: dni.activeIngredient,
                clinicalSeverity: dni.clinicalSeverity,
                mechanismEn: dni.mechanismEn,
                dietaryActionEn: dni.dietaryActionEn,
                isCritical: dni.isCritical,
                isModerate: dni.isModerate,
                isMild: dni.isMild,
                matchedMedication: medName,
              });
            }

          }
          return results;
        }),
        catchError(() => of([] as InteractionAlert[]))
      );
    }),
    catchError(() => of([] as InteractionAlert[]))
  );
}

export default function MedicationSafetyScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const interactions = useObservableArray(
    observeDrugNutrientAlerts(patientId)
  );

  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());
  const [ackNotes, setAckNotes] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const criticalCount = interactions.filter(i => i.isCritical).length;
  const moderateCount = interactions.filter(i => i.isModerate).length;
  const mildCount = interactions.filter(i => i.isMild).length;

  const handleAcknowledge = useCallback((id: string) => {
    setAcknowledgedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleConfirmAcknowledge = useCallback((id: string) => {
    const note = ackNotes[id] || '';
    Alert.alert(
      'تأكيد الإقرار',
      note
        ? `تم تسجيل الإقرار مع الملاحظة:\n${note}`
        : 'تم تسجيل الإقرار دون ملاحظات',
      [{ text: 'حسنًا', style: 'default' }]
    );
  }, [ackNotes]);

  const renderSeverityCard = (alert: InteractionAlert) => {
    const isAcknowledged = acknowledgedIds.has(alert.id);
    const isExpanded = expandedId === alert.id;
    const isCritical = alert.isCritical;

    const cardStyle = isCritical
      ? styles.criticalCard
      : alert.isModerate
      ? styles.moderateCard
      : styles.mildCard;

    const iconName = isCritical
      ? 'warning'
      : alert.isModerate
      ? 'alert-circle'
      : 'information-circle-outline';

    const iconColor = isCritical
      ? '#DC2626'
      : alert.isModerate
      ? '#D97706'
      : colors.info;

    const severityLabel = isCritical
      ? 'حرج'
      : alert.isModerate
      ? 'متوسط'
      : 'بسيط';

    return (
      <View key={alert.id} style={[styles.alertCard, cardStyle]}>
        <TouchableOpacity
          style={styles.alertHeader}
          onPress={() => setExpandedId(isExpanded ? null : alert.id)}
          activeOpacity={0.7}
        >
          <View style={styles.alertHeaderLeft}>
            {isCritical && (
              <View style={styles.hazardPulse}>
                <Ionicons name="flash" size={22} color="#FFFFFF" />
              </View>
            )}
            {!isCritical && (
              <Ionicons name={iconName as any} size={22} color={iconColor} />
            )}
            <View style={styles.alertHeaderText}>
              <Text style={[styles.alertTitle, isCritical && styles.criticalTitle]}>
                {isCritical
                  ? '🚨 تعارض دوائي غذائي حرج - خطر حاد على المريض'
                  : alert.isModerate
                  ? '⚠️ تعارض دوائي غذائي متوسط'
                  : 'ℹ️ تنبيه تفاعل غذائي بسيط'}
              </Text>
              <Text style={styles.alertIngredient}>
                {alert.activeIngredient} ← {alert.matchedMedication}
              </Text>
            </View>
          </View>
          <View style={[styles.severityBadge, { backgroundColor: iconColor }]}>
            <Text style={styles.severityBadgeText}>{severityLabel}</Text>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.alertBody}>
            <View style={styles.bodySection}>
              <Text style={styles.bodyLabel}>آلية التفاعل</Text>
              <Text style={styles.bodyText}>{alert.mechanismEn}</Text>
            </View>

            <View style={styles.bodySection}>
              <Text style={styles.bodyLabel}>الإجراء الغذائي المطلوب</Text>
              <Text style={[styles.bodyText, styles.dietaryActionText]}>
                {alert.dietaryActionEn}
              </Text>
            </View>

            {isCritical && (
              <View style={styles.acknowledgmentSection}>
                <Text style={styles.ackLabel}>إقرار أخصائي التغذية</Text>
                <TextInput
                  style={styles.ackInput}
                  value={ackNotes[alert.id] || ''}
                  onChangeText={text =>
                    setAckNotes(prev => ({ ...prev, [alert.id]: text }))
                  }
                  placeholder="ملاحظات إضافية (اختياري)..."
                  placeholderTextColor={colors.textDisabled}
                  textAlign="right"
                  multiline
                  numberOfLines={2}
                />
                <View style={styles.ackActions}>
                  <TouchableOpacity
                    style={[
                      styles.ackButton,
                      isAcknowledged && styles.ackButtonActive,
                    ]}
                    onPress={() => handleAcknowledge(alert.id)}
                  >
                    <Ionicons
                      name={isAcknowledged ? 'checkmark-circle' : 'checkmark-circle-outline'}
                      size={18}
                      color={isAcknowledged ? colors.success : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.ackButtonText,
                        isAcknowledged && { color: colors.success },
                      ]}
                    >
                      {isAcknowledged ? 'تم الإقرار' : 'إقرار المخاطرة'}
                    </Text>
                  </TouchableOpacity>
                  {isAcknowledged && (
                    <TouchableOpacity
                      style={styles.confirmButton}
                      onPress={() => handleConfirmAcknowledge(alert.id)}
                    >
                      <Text style={styles.confirmButtonText}>تأكيد التسجيل</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={colors.primaryContrast} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>سلامة الأدوية والتغذية</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statBox, { borderTopColor: '#DC2626' }]}>
          <Text style={[styles.statValue, { color: '#DC2626' }]}>{criticalCount}</Text>
          <Text style={styles.statLabel}>حرجة</Text>
        </View>
        <View style={[styles.statBox, { borderTopColor: '#D97706' }]}>
          <Text style={[styles.statValue, { color: '#D97706' }]}>{moderateCount}</Text>
          <Text style={styles.statLabel}>متوسطة</Text>
        </View>
        <View style={[styles.statBox, { borderTopColor: colors.info }]}>
          <Text style={[styles.statValue, { color: colors.info }]}>{mildCount}</Text>
          <Text style={styles.statLabel}>بسيطة</Text>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
      >
        {interactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="shield-checkmark-outline" size={48} color={colors.success} />
            <Text style={styles.emptyTitle}>لا توجد تعارضات دوائية غذائية</Text>
            <Text style={styles.emptyText}>
              جميع الأدوية النشطة للمريض آمنة من منظور التفاعلات الغذائية
            </Text>
          </View>
        ) : (
          interactions.map(renderSeverityCard)
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
  } as const,
  header: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'web' ? 16 : 60,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as const,
  backButton: {
    padding: spacing.xs,
  } as const,
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.primaryContrast,
    fontFamily: fontFamilies?.medium || 'System',
  } as const,
  statsRow: {
    flexDirection: 'row-reverse',
    padding: spacing.md,
    gap: spacing.sm,
  } as const,
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.sm,
    borderTopWidth: 3,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  } as const,
  statValue: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
    fontFamily: fontFamilies?.bold || 'System',
  } as const,
  statLabel: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  body: {
    flex: 1,
  } as const,
  bodyContent: {
    padding: spacing.md,
  } as const,
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  } as const,
  emptyTitle: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.md,
    fontFamily: fontFamilies?.medium || 'System',
  } as const,
  emptyText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
    lineHeight: 20,
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  alertCard: {
    borderRadius: 12,
    marginBottom: spacing.md,
    borderWidth: 2,
    overflow: 'hidden',
  } as const,
  criticalCard: {
    backgroundColor: '#1A0A0A',
    borderColor: '#DC2626',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  } as const,
  moderateCard: {
    backgroundColor: '#1E1A0A',
    borderColor: '#D97706',
  } as const,
  mildCard: {
    backgroundColor: colors.surface,
    borderColor: colors.info,
    borderWidth: 1,
  } as const,
  alertHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  } as const,
  alertHeaderLeft: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  } as const,
  hazardPulse: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  } as const,
  alertHeaderText: {
    flex: 1,
  } as const,
  alertTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: fontFamilies?.medium || 'System',
  } as const,
  criticalTitle: {
    color: '#FCA5A5',
  } as const,
  alertIngredient: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  severityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  } as const,
  severityBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: fontFamilies?.medium || 'System',
  } as const,
  alertBody: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  } as const,
  bodySection: {
    marginBottom: spacing.md,
  } as const,
  bodyLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textAlign: 'right',
    fontFamily: fontFamilies?.medium || 'System',
  } as const,
  bodyText: {
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    lineHeight: 20,
    textAlign: 'right',
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  dietaryActionText: {
    fontWeight: '700',
    color: '#FCA5A5',
  } as const,
  acknowledgmentSection: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
  } as const,
  ackLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'right',
    fontFamily: fontFamilies?.medium || 'System',
  } as const,
  ackInput: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.sm,
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 60,
    textAlignVertical: 'top',
    fontFamily: fontFamilies?.regular || 'System',
    marginBottom: spacing.sm,
  } as const,
  ackActions: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
  } as const,
  ackButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  } as const,
  ackButtonActive: {
    borderColor: colors.success,
    backgroundColor: '#052E16',
  } as const,
  ackButtonText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontWeight: '600',
    fontFamily: fontFamilies?.medium || 'System',
  } as const,
  confirmButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.primary,
  } as const,
  confirmButtonText: {
    fontSize: fontSizes.sm,
    color: colors.primaryContrast,
    fontWeight: '700',
    fontFamily: fontFamilies?.medium || 'System',
  } as const,
};
