import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontFamilies } from '../../theme';
import Button from '../Button';
import { AutomatedMenuGeneratorEngine } from '../../../domain/calculators/AutomatedMenuGeneratorEngine';
import type { IMealDistributionPlan, IMealSlotAllocation, IMealAllocationItem } from '../../../domain/calculators/AutomatedMenuGeneratorEngine';
import type { ICalculatedMetabolicTargets } from '../../../domain/calculators/DietaryIntakeAnalyzerEngine';
import type {
  IFoodExchange, IPatientAversionRecord, IPatientMealPlan,
  MealSlotType, ExchangeGroup,
} from '../../../data/types/meal_planner';

const r2 = (v: number): number => {
  if (typeof v !== 'number' || isNaN(v) || !isFinite(v) || v < 0) return 0;
  return parseFloat(v.toFixed(2));
};

const MEAL_SLOT_LABELS: Record<MealSlotType, string> = {
  breakfast: 'الفطور',
  snack_1: 'الوجبة الخفيفة الأولى',
  lunch: 'الغداء',
  snack_2: 'الوجبة الخفيفة الثانية',
  dinner: 'العشاء',
  late_snack: 'وجبة ما قبل النوم المتأخرة',
};

const MEAL_SLOT_ORDER: MealSlotType[] = [
  'breakfast', 'snack_1', 'lunch', 'snack_2', 'dinner', 'late_snack',
];

const GROUP_LABELS: Record<string, string> = {
  starch: 'نشويات',
  meat_lean: 'لحوم قليلة الدهن',
  meat_medium: 'لحوم متوسطة الدهن',
  meat_high: 'لحوم عالية الدهن',
  vegetable: 'خضار',
  fruit: 'فواكه',
  milk: 'حليب',
  fat: 'دهون',
};

interface SmartMealPlannerProps {
  patientId: string;
  masterFoods: IFoodExchange[];
  targets: ICalculatedMetabolicTargets;
  aversions: IPatientAversionRecord[];
  onSavePlan?: (plan: IPatientMealPlan) => Promise<void>;
}

export default function SmartMealPlanner({
  patientId,
  masterFoods,
  targets,
  aversions,
  onSavePlan,
}: SmartMealPlannerProps) {
  const [localDist, setLocalDist] = useState<IMealDistributionPlan | null>(null);
  const [planMeta, setPlanMeta] = useState<IPatientMealPlan | null>(null);
  const [insights, setInsights] = useState<{ title: string; body: string; type: string }[]>([]);
  const [swapSlotIdx, setSwapSlotIdx] = useState<number | null>(null);
  const [swapItemIdx, setSwapItemIdx] = useState<number | null>(null);
  const [swapModalVisible, setSwapModalVisible] = useState(false);

  const generated = useMemo(() => {
    try {
      const plan = AutomatedMenuGeneratorEngine.generatePrescriptiveMenu(
        patientId, targets, masterFoods, aversions,
      );
      const dist = JSON.parse(plan.mealDistributionJson) as IMealDistributionPlan;
      const cards = JSON.parse(plan.educationalInsightsJson) as { title: string; body: string; type: string }[];
      return { plan, dist, cards };
    } catch {
      return null;
    }
  }, [patientId, targets, masterFoods, aversions]);

  const distribution = localDist ?? generated?.dist ?? null;

  useEffect(() => {
    if (generated) {
      setLocalDist(generated.dist);
      setPlanMeta(generated.plan);
      setInsights(generated.cards);
    }
  }, [generated]);

  const safePool = useMemo(() => {
    const avertedIds = new Set(aversions.map((a) => a.foodExchangeId));
    return masterFoods.filter(
      (f) => !avertedIds.has((f as unknown as Record<string, string>).id),
    );
  }, [masterFoods, aversions]);

  const handleSwap = useCallback((slotIdx: number, itemIdx: number) => {
    setSwapSlotIdx(slotIdx);
    setSwapItemIdx(itemIdx);
    setSwapModalVisible(true);
  }, []);

  const handleConfirmSwap = useCallback((newFood: IFoodExchange) => {
    if (!distribution || swapSlotIdx === null || swapItemIdx === null) return;

    const newSlots = distribution.slots.map((slot, si) => {
      if (si !== swapSlotIdx) return slot;
      const newItems = slot.items.map((item, ii) => {
        if (ii !== swapItemIdx) return item;
        return {
          ...item,
          foodNameAr: newFood.foodNameAr,
          foodExchangeGroup: newFood.exchangeGroup,
          calories: r2(newFood.caloriesKcal * item.servings),
          protein: r2(newFood.proteinG * item.servings),
          carbs: r2(newFood.carbsG * item.servings),
          fat: r2(newFood.fatG * item.servings),
          grams: r2(estimateGramsStatic(newFood, item.servings)),
          portionDescriptor: buildDescriptorStatic(newFood, item.servings),
        };
      });
      const slotCal = r2(newItems.reduce((s, i) => s + i.calories, 0));
      const slotProt = r2(newItems.reduce((s, i) => s + i.protein, 0));
      const slotCarb = r2(newItems.reduce((s, i) => s + i.carbs, 0));
      const slotFt = r2(newItems.reduce((s, i) => s + i.fat, 0));
      return { ...slot, items: newItems, slotCalories: slotCal, slotProtein: slotProt, slotCarbs: slotCarb, slotFat: slotFt };
    });

    const totalCal = r2(newSlots.reduce((s, sl) => s + sl.slotCalories, 0));
    const totalProt = r2(newSlots.reduce((s, sl) => s + sl.slotProtein, 0));
    const totalCarb = r2(newSlots.reduce((s, sl) => s + sl.slotCarbs, 0));
    const totalFat = r2(newSlots.reduce((s, sl) => s + sl.slotFat, 0));

    setLocalDist({ slots: newSlots, totalCalories: totalCal, totalProtein: totalProt, totalCarbs: totalCarb, totalFat: totalFat });
    setSwapModalVisible(false);
  }, [distribution, swapSlotIdx, swapItemIdx]);

  const alternatives = useMemo(() => {
    if (swapSlotIdx === null || swapItemIdx === null || !distribution) return [];
    const item = distribution.slots[swapSlotIdx]?.items[swapItemIdx];
    if (!item) return [];
    return safePool.filter(
      (f) => f.exchangeGroup === item.foodExchangeGroup && f.foodNameAr !== item.foodNameAr,
    );
  }, [safePool, swapSlotIdx, swapItemIdx, distribution]);

  const renderSlot = (slot: IMealSlotAllocation, idx: number) => (
    <View key={slot.slot} style={styles.slotCard}>
      <View style={styles.slotHeader}>
        <Ionicons name="time-outline" size={18} color={colors.primary} />
        <Text style={styles.slotTitle}>{MEAL_SLOT_LABELS[slot.slot]}</Text>
      </View>

      {slot.items.map((item, ii) => (
        <View key={`${item.foodExchangeGroup}-${ii}`} style={styles.itemRow}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.foodNameAr}</Text>
            <Text style={styles.itemDetail}>{item.portionDescriptor}</Text>
            <Text style={styles.itemMacro}>
              {item.calories} كال | {item.protein}g بروتين | {item.carbs}g كرب | {item.fat}g دهون
            </Text>
          </View>
          <TouchableOpacity
            style={styles.swapButton}
            onPress={() => handleSwap(idx, ii)}
          >
            <Ionicons name="swap-horizontal" size={20} color={colors.warning} />
            <Text style={styles.swapText}>تبديل</Text>
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.slotTotals}>
        <Text style={styles.slotTotalsText}>
          المجموع: {slot.slotCalories} كال | {slot.slotProtein}g بروتين | {slot.slotCarbs}g كرب | {slot.slotFat}g دهون
        </Text>
      </View>
    </View>
  );

  const renderInsightCard = (card: { title: string; body: string; type: string }, idx: number) => (
    <View key={`insight-${idx}`} style={styles.insightCard}>
      <Ionicons
        name={card.type === 'medical' ? 'medkit' : card.type === 'lifestyle' ? 'bulb' : 'nutrition'}
        size={22}
        color={colors.warning}
      />
      <View style={styles.insightContent}>
        <Text style={styles.insightTitle}>{card.title}</Text>
        <Text style={styles.insightBody}>{card.body}</Text>
      </View>
    </View>
  );

  if (!distribution) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="hourglass-outline" size={48} color={colors.textDisabled} />
        <Text style={styles.loadingText}>جاري إنشاء الخطة العلاجية...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* ===== Summary Header ===== */}
      <View style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>ملخص الخطة العلاجية</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>السعرات المستهدفة</Text>
          <Text style={styles.summaryValue}>{planMeta?.targetCalories ?? distribution.totalCalories} كال</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>البروتين المستهدف</Text>
          <Text style={styles.summaryValue}>{planMeta?.targetProtein ?? targets.protein} غ</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>مؤشر الحمل الجلايسمي</Text>
          <Text style={styles.summaryValue}>{planMeta?.averageGlycemicLoad ?? 0}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>النمط الغذائي</Text>
          <Text style={styles.summaryValue}>
            {planMeta?.dietaryPatternTag === 'diabetic_spaced'
              ? 'سكري موزع'
              : planMeta?.dietaryPatternTag === 'hepatic_night_snack'
                ? 'كبدي مع وجبة ليلية'
                : planMeta?.dietaryPatternTag === 'hypermetabolic_built'
                  ? 'فرط استقلاب مدمج'
                  : 'قياسي'}
          </Text>
        </View>
      </View>

      {/* ===== 6-Slot Schedule ===== */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>جدول الوجبات العلاجي</Text>
        {distribution.slots.map((slot, idx) => renderSlot(slot, idx))}
      </View>

      {/* ===== Total Verification ===== */}
      <View style={styles.verificationCard}>
        <Text style={styles.sectionTitle}>التحقق من الماكرو</Text>
        <View style={styles.verifyRow}>
          <Text style={styles.verifyLabel}>إجمالي السعرات</Text>
          <Text style={styles.verifyValue}>{distribution.totalCalories} / {planMeta?.targetCalories ?? 0} كال</Text>
          <Text style={[
            styles.verifyBadge,
            { color: Math.abs(distribution.totalCalories - (planMeta?.targetCalories ?? 0)) / (planMeta?.targetCalories ?? 1) <= 0.05 ? colors.success : colors.danger },
          ]}>
            {Math.abs(distribution.totalCalories - (planMeta?.targetCalories ?? 0)) / (planMeta?.targetCalories ?? 1) <= 0.05 ? '✓' : '⚠'}
          </Text>
        </View>
        <View style={styles.verifyRow}>
          <Text style={styles.verifyLabel}>إجمالي البروتين</Text>
          <Text style={styles.verifyValue}>{distribution.totalProtein} / {planMeta?.targetProtein ?? 0} غ</Text>
        </View>
        <View style={styles.verifyRow}>
          <Text style={styles.verifyLabel}>إجمالي الكربوهيدرات</Text>
          <Text style={styles.verifyValue}>{distribution.totalCarbs} / {planMeta?.targetCarbs ?? 0} غ</Text>
        </View>
        <View style={styles.verifyRow}>
          <Text style={styles.verifyLabel}>إجمالي الدهون</Text>
          <Text style={styles.verifyValue}>{distribution.totalFat} / {planMeta?.targetFat ?? 0} غ</Text>
        </View>
      </View>

      {/* ===== Educational Insights ===== */}
      {insights.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>التوجيهات التثقيفية</Text>
          {insights.map((card, idx) => renderInsightCard(card, idx))}
        </View>
      )}

      {/* ===== Save Button ===== */}
      {onSavePlan && planMeta && (
        <View style={styles.sectionCard}>
          <Button
            title="حفظ الخطة العلاجية"
            onPress={() => onSavePlan(planMeta)}
          />
        </View>
      )}

      {/* ===== Swap Modal ===== */}
      <Modal
        visible={swapModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSwapModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>اختيار بديل</Text>
              <TouchableOpacity onPress={() => setSwapModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {alternatives.length === 0 ? (
              <Text style={styles.noAlternatives}>لا توجد بدائل متاحة لهذه المجموعة</Text>
            ) : (
              <FlatList
                data={alternatives}
                keyExtractor={(item) => item.foodNameAr}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.altItem}
                    onPress={() => handleConfirmSwap(item)}
                  >
                    <Text style={styles.altItemName}>{item.foodNameAr}</Text>
                    <Text style={styles.altItemMacro}>
                      {item.caloriesKcal} كال | {item.carbsG}g كرب | {item.proteinG}g بروتين | {item.fatG}g دهون
                    </Text>
                    <Text style={styles.altItemServing}>{item.servingSizeDesc}</Text>
                  </TouchableOpacity>
                )}
                style={{ maxHeight: 400 }}
              />
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function estimateGramsStatic(food: IFoodExchange, servings: number): number {
  const match = food.servingSizeDesc.match(/([\d.]+)\s*غرام/);
  if (match) {
    return r2(parseFloat(match[1]) * servings);
  }
  return r2(100 * servings);
}

function buildDescriptorStatic(food: IFoodExchange, servings: number): string {
  const unitMap: Record<string, string> = {
    كوب: 'أكواب',
    ملعقة: 'ملاعق',
    شريحة: 'شرائح',
    حبة: 'حبات',
    قطعة: 'قطع',
    بيضة: 'بيضات',
  };

  for (const [singular, plural] of Object.entries(unitMap)) {
    if (food.servingSizeDesc.includes(singular)) {
      if (servings <= 1) {
        return `${servings} ${singular} واحد بوزن ${estimateGramsStatic(food, servings)} غرام`;
      }
      return `${servings} ${plural} بوزن ${estimateGramsStatic(food, servings)} غرام`;
    }
  }
  return `${servings} حصة بوزن ${estimateGramsStatic(food, servings)} غرام`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: fontFamilies.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: fontFamilies.regular,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: fontFamilies.bold,
    color: colors.textPrimary,
    textAlign: 'left',
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fontFamilies.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'right',
  },
  slotCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  slotTitle: {
    fontSize: 15,
    fontFamily: fontFamilies.bold,
    color: colors.primary,
    textAlign: 'right',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.xs,
    marginBottom: spacing.xs,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontFamily: fontFamilies.bold,
    color: colors.textPrimary,
    textAlign: 'right',
  },
  itemDetail: {
    fontSize: 11,
    fontFamily: fontFamilies.regular,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  itemMacro: {
    fontSize: 11,
    fontFamily: fontFamilies.regular,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  swapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.warning,
    backgroundColor: '#3B2E1540',
  },
  swapText: {
    fontSize: 12,
    fontFamily: fontFamilies.bold,
    color: colors.warning,
  },
  slotTotals: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  slotTotalsText: {
    fontSize: 12,
    fontFamily: fontFamilies.regular,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  verificationCard: {
    backgroundColor: '#0D1B2A',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  verifyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  verifyLabel: {
    fontSize: 13,
    fontFamily: fontFamilies.regular,
    color: colors.textSecondary,
    textAlign: 'right',
    flex: 1,
  },
  verifyValue: {
    fontSize: 13,
    fontFamily: fontFamilies.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    flex: 1,
  },
  verifyBadge: {
    fontSize: 16,
    fontFamily: fontFamilies.bold,
    textAlign: 'center',
    width: 24,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontFamily: fontFamilies.bold,
    color: colors.warning,
    marginBottom: 4,
    textAlign: 'right',
  },
  insightBody: {
    fontSize: 13,
    fontFamily: fontFamilies.regular,
    color: colors.textPrimary,
    textAlign: 'right',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.md,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: fontFamilies.bold,
    color: colors.textPrimary,
    textAlign: 'right',
  },
  noAlternatives: {
    fontSize: 14,
    fontFamily: fontFamilies.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  altItem: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  altItemName: {
    fontSize: 14,
    fontFamily: fontFamilies.bold,
    color: colors.textPrimary,
    textAlign: 'right',
  },
  altItemMacro: {
    fontSize: 11,
    fontFamily: fontFamilies.regular,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  altItemServing: {
    fontSize: 11,
    fontFamily: fontFamilies.regular,
    color: colors.textDisabled,
    textAlign: 'right',
  },
});
