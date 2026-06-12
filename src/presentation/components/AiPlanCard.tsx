import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AiPlan, AiMealSuggestion } from '../../domain/entities/AiPlan';
import { colors, spacing } from '../theme';

interface AiPlanCardProps {
  plan: AiPlan | null;
  loading: boolean;
  error: string | null;
  latencyMs: number | null;
  onClose?: () => void;
}

export default function AiPlanCard({ plan, loading, error, latencyMs, onClose }: AiPlanCardProps) {
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingRow}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>جاري إنشاء خطة الذكاء الاصطناعي...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={24} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  if (!plan) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Ionicons name="sparkles" size={20} color={colors.warning} />
          <Text style={styles.title}>خطة الذكاء الاصطناعي</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>AI</Text>
        </View>
      </View>

      {latencyMs != null && latencyMs > 0 && (
        <Text style={styles.latency}>تم الإنشاء في {(latencyMs / 1000).toFixed(1)} ثانية</Text>
      )}

      <View style={styles.calorieRow}>
        <Text style={styles.calorieValue}>{plan.totalCalories}</Text>
        <Text style={styles.calorieUnit}>سعرة/يوم</Text>
      </View>

      {plan.calorieAdjustment !== 0 && (
        <Text style={styles.adjustmentText}>
          (تعديل: {plan.calorieAdjustment > 0 ? '+' : ''}{plan.calorieAdjustment} سعرة)
        </Text>
      )}

      <View style={styles.macroRow}>
        <MacroBadge label="بروتين" value={`${plan.macros.proteinGrams} غم`} color="#E74C3C" />
        <MacroBadge label="كربوهيدرات" value={`${plan.macros.carbsGrams} غم`} color="#F39C12" />
        <MacroBadge label="دهون" value={`${plan.macros.fatGrams} غم`} color="#3498DB" />
      </View>

      {plan.mealPlan.length > 0 && (
        <View style={styles.mealSection}>
          <Text style={styles.sectionLabel}>الوجبات المقترحة:</Text>
          {plan.mealPlan.map((meal: AiMealSuggestion, idx: number) => (
            <View key={idx} style={styles.mealCard}>
              <Text style={styles.mealName}>
                {meal.meal}
                {meal.calories ? ` (${meal.calories} سعرة)` : ''}
              </Text>
              {meal.foods.map((food: string, fi: number) => (
                <Text key={fi} style={styles.foodItem}>• {food}</Text>
              ))}
            </View>
          ))}
        </View>
      )}

      {plan.recommendations.length > 0 && (
        <View style={styles.listBlock}>
          <Text style={[styles.sectionLabel, { color: colors.success }]}>توصيات:</Text>
          {plan.recommendations.map((r, i) => (
            <Text key={i} style={styles.listItem}>✓ {r}</Text>
          ))}
        </View>
      )}

      {plan.restrictions.length > 0 && (
        <View style={styles.listBlock}>
          <Text style={[styles.sectionLabel, { color: colors.danger }]}>محظورات:</Text>
          {plan.restrictions.map((r, i) => (
            <Text key={i} style={[styles.listItem, { color: colors.danger }]}>✗ {r}</Text>
          ))}
        </View>
      )}

      {plan.clinicalNotes && (
        <View style={styles.notesBlock}>
          <Text style={styles.sectionLabel}>ملاحظات سريرية:</Text>
          <Text style={styles.notesText}>{plan.clinicalNotes}</Text>
        </View>
      )}

      <View style={styles.disclaimerBlock}>
        <Ionicons name="information-circle" size={16} color={colors.warning} />
        <Text style={styles.disclaimerText}>{plan.disclaimer}</Text>
      </View>
    </View>
  );
}

function MacroBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.macroBadge, { borderLeftColor: color }]}>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={[styles.macroValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning,
    borderStyle: 'dashed',
    marginTop: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  badge: {
    backgroundColor: colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  latency: {
    fontSize: 11,
    color: colors.textDisabled,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  loadingRow: {
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  errorText: {
    fontSize: 14,
    color: colors.danger,
    flex: 1,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  calorieValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
  },
  calorieUnit: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  adjustmentText: {
    fontSize: 13,
    color: colors.warning,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  macroRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  macroBadge: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.sm,
    borderRadius: 8,
    borderStartWidth: 3,
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  macroValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  mealSection: {
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'right',
  },
  mealCard: {
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  mealName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
    textAlign: 'right',
  },
  foodItem: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'right',
    paddingEnd: spacing.sm,
    lineHeight: 22,
  },
  listBlock: {
    marginBottom: spacing.sm,
  },
  listItem: {
    fontSize: 13,
    color: colors.textPrimary,
    textAlign: 'right',
    lineHeight: 22,
    paddingEnd: spacing.sm,
  },
  notesBlock: {
    backgroundColor: colors.primaryLight,
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  notesText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'right',
    lineHeight: 20,
  },
  disclaimerBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: '#FFF8E1',
    padding: spacing.sm,
    borderRadius: 8,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#856404',
    flex: 1,
    lineHeight: 18,
  },
});
