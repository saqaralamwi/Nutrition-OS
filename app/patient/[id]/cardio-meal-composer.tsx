import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  TextInput, Platform, KeyboardAvoidingView, Alert, FlatList,
} from 'react-native';
import { useState, useCallback, useMemo } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { combineLatest, Observable, of } from 'rxjs';
import { map, catchError, debounceTime } from 'rxjs/operators';
import { Q } from '@nozbe/watermelondb';
import { colors, spacing, fontFamilies, fontSizes } from '../../../src/presentation/theme';
import { useObservable } from '../../../src/presentation/hooks/useObservable';
import { watchQuery, watchRecord } from '../../../src/data/database/observe';
import { getDatabase } from '../../../src/data/database';
import { DashComplianceEngine } from '../../../src/domain/calculators/DashComplianceEngine';
import type { IDashInput, IDashOutput } from '../../../src/data/types/cardiovascular';

interface FoodItem {
  id: string;
  nameAr: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  sodiumMg?: number;
  saturatedFatG?: number;
  cholesterolMg?: number;
  tags: string[];
}

interface MealComposerData {
  patient: any;
  assessment: any;
  foods: FoodItem[];
  loading: boolean;
}

interface SelectedFood extends FoodItem {
  selectedGrams: number;
}

function observeMealComposerData(patientId: string): Observable<MealComposerData> {
  const patient$ = watchRecord<any>(db =>
    db.get('patients').find(patientId),
  ).pipe(catchError(() => of(null)));

  const assessment$ = watchQuery<any>(db =>
    db.get('cardiovascular_assessments').query(
      Q.where('patient_id', patientId),
      Q.sortBy('recorded_at', Q.desc),
      Q.take(1),
    ),
  ).pipe(
    map(rows => rows[0] ?? null),
    catchError(() => of(null)),
  );

  const foods$ = watchQuery<FoodItem>(db =>
    db.get('therapeutic_foods').query(),
  ).pipe(catchError(() => of([])));

  return combineLatest([patient$, assessment$, foods$]).pipe(
    debounceTime(50),
    map(([patient, assessment, foods]) => ({
      patient,
      assessment,
      foods,
      loading: false,
    })),
  );
}

function computeDashInput(
  assessment: any,
  targetCalories: number,
): IDashInput {
  return {
    systolicBloodPressure: assessment?.systolicBloodPressure ?? 120,
    diastolicBloodPressure: assessment?.diastolicBloodPressure ?? 80,
    totalCholesterol: assessment?.totalCholesterol ?? 180,
    ldlCholesterol: assessment?.ldlCholesterol ?? 100,
    triglycerides: assessment?.triglycerides ?? 150,
    targetCalories,
  };
}

function computeSelectedTotals(selected: SelectedFood[]): {
  totalSodiumMg: number;
  totalSaturatedFatG: number;
  totalCholesterolMg: number;
  totalCalories: number;
  totalProteinG: number;
} {
  return selected.reduce(
    (acc, item) => {
      const ratio = item.selectedGrams / 100;
      return {
        totalSodiumMg: acc.totalSodiumMg + (item.sodiumMg ?? 0) * ratio,
        totalSaturatedFatG: acc.totalSaturatedFatG + (item.saturatedFatG ?? 0) * ratio,
        totalCholesterolMg: acc.totalCholesterolMg + (item.cholesterolMg ?? 0) * ratio,
        totalCalories: acc.totalCalories + item.caloriesPer100g * ratio,
        totalProteinG: acc.totalProteinG + item.proteinPer100g * ratio,
      };
    },
    { totalSodiumMg: 0, totalSaturatedFatG: 0, totalCholesterolMg: 0, totalCalories: 0, totalProteinG: 0 },
  );
}

export default function CardioMealComposerScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [selectedFoods, setSelectedFoods] = useState<SelectedFood[]>([]);
  const [clinicalJustification, setClinicalJustification] = useState('');
  const [saving, setSaving] = useState(false);

  const data = useObservable(observeMealComposerData(patientId), {
    patient: null,
    assessment: null,
    foods: [],
    loading: true,
  } as MealComposerData);

  const targetCalories = data.patient?.targetCalories ?? 2000;

  const dashInput = useMemo(
    () => computeDashInput(data.assessment, targetCalories),
    [data.assessment, targetCalories],
  );

  const dashResult = useMemo(
    () => DashComplianceEngine.evaluateCardiovascularDiet(dashInput),
    [dashInput],
  );

  const selectedTotals = useMemo(() => computeSelectedTotals(selectedFoods), [selectedFoods]);

  const isSodiumViolated = selectedTotals.totalSodiumMg > dashResult.maxSodiumMg;
  const isFatViolated = selectedTotals.totalSaturatedFatG > dashResult.maxSaturatedFatGrams;
  const isCholesterolViolated = selectedTotals.totalCholesterolMg > dashResult.maxDietaryCholesterolMg;
  const hasViolation = isSodiumViolated || isFatViolated || isCholesterolViolated;

  const justificationValid = clinicalJustification.trim().length >= 15;
  const canSave = !hasViolation || justificationValid;

  const toggleFood = useCallback((food: FoodItem) => {
    setSelectedFoods(prev => {
      const idx = prev.findIndex(f => f.id === food.id);
      if (idx >= 0) {
        return prev.filter(f => f.id !== food.id);
      }
      return [...prev, { ...food, selectedGrams: 100 }];
    });
  }, []);

  const updateGrams = useCallback((foodId: string, grams: number) => {
    setSelectedFoods(prev =>
      prev.map(f => (f.id === foodId ? { ...f, selectedGrams: Math.max(10, Math.min(500, grams)) } : f)),
    );
  }, []);

  const handleSave = useCallback(async () => {
    if (hasViolation && !justificationValid) {
      Alert.alert('خطأ', 'الرجاء إدخال مبرر سريري (15 حرفاً على الأقل)');
      return;
    }
    setSaving(true);
    try {
      const db = await getDatabase();
      const now = new Date();
      const menuPayload = JSON.stringify(
        selectedFoods.map(f => ({
          foodId: f.id,
          nameAr: f.nameAr,
          selectedGrams: f.selectedGrams,
        })),
      );

      await db.write(async () => {
        const collection = db.get('nutritional_plans');
        await collection.create((r: any) => {
          r.patient_id = patientId;
          r.meals_json = menuPayload;
          r.clinical_notes_ar = hasViolation ? clinicalJustification.trim() : 'خطة غذائية قلبية متوافقة مع DASH';
          r.created_at = now;
          r.updated_at = now;
        });
      });

      Alert.alert('نجاح', 'تم حفظ الخطة الغذائية القلبية بنجاح');
      setSelectedFoods([]);
      setClinicalJustification('');
    } catch (err) {
      Alert.alert('خطأ', 'فشل حفظ الخطة الغذائية');
    } finally {
      setSaving(false);
    }
  }, [patientId, selectedFoods, clinicalJustification, hasViolation, justificationValid]);

  const getBpBadgeColor = (stage: string) => {
    switch (stage) {
      case 'stage_2_hypertension': return colors.danger;
      case 'stage_1_hypertension': return colors.warning;
      case 'elevated': return '#F59E0B';
      default: return colors.success;
    }
  };

  const getBpBadgeLabel = (stage: string) => {
    switch (stage) {
      case 'stage_2_hypertension': return 'ارتفاع ضغط من الدرجة الثانية';
      case 'stage_1_hypertension': return 'ارتفاع ضغط من الدرجة الأولى';
      case 'elevated': return 'ضغط مرتفع';
      default: return 'ضغط طبيعي';
    }
  };

  const progressPercent = (current: number, max: number) => {
    if (max <= 0) return 0;
    return Math.min(100, (current / max) * 100);
  };

  const barColor = (violated: boolean) => (violated ? '#EF4444' : '#10B981');

  if (data.loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>جاري تحميل بيانات المريض...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={colors.primaryContrast} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ملف التغذية القلبية - DASH</Text>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* SECTOR A: LIVE DASH METABOLIC COMPASS */}
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Ionicons name="heart" size={20} color={colors.danger} />
            <Text style={styles.metricTitle}>بوصلة DASH الأيضية</Text>
          </View>
          <View style={styles.metricBody}>
            <View style={styles.bpBadgeRow}>
              <View style={[styles.bpBadge, { backgroundColor: getBpBadgeColor(dashResult.bpStage) }]}>
                <Text style={styles.bpBadgeText}>{getBpBadgeLabel(dashResult.bpStage)}</Text>
              </View>
              <Text style={styles.sodiumCapText}>الحد الأقصى للصوديوم: {dashResult.maxSodiumMg} ملغ</Text>
            </View>

            {/* Sodium progress bar */}
            <View style={styles.barSection}>
              <View style={styles.barLabelRow}>
                <Text style={styles.barLabel}>الصوديوم</Text>
                <Text style={[styles.barValue, isSodiumViolated && { color: '#EF4444' }]}>
                  {selectedTotals.totalSodiumMg.toFixed(0)} / {dashResult.maxSodiumMg} ملغ
                </Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${progressPercent(selectedTotals.totalSodiumMg, dashResult.maxSodiumMg)}%`, backgroundColor: barColor(isSodiumViolated) }]} />
              </View>
            </View>

            {/* Saturated Fat progress bar */}
            <View style={styles.barSection}>
              <View style={styles.barLabelRow}>
                <Text style={styles.barLabel}>الدهون المشبعة</Text>
                <Text style={[styles.barValue, isFatViolated && { color: '#EF4444' }]}>
                  {selectedTotals.totalSaturatedFatG.toFixed(1)} / {dashResult.maxSaturatedFatGrams.toFixed(1)} غ
                </Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${progressPercent(selectedTotals.totalSaturatedFatG, dashResult.maxSaturatedFatGrams)}%`, backgroundColor: barColor(isFatViolated) }]} />
              </View>
            </View>

            {/* Cholesterol progress bar */}
            <View style={styles.barSection}>
              <View style={styles.barLabelRow}>
                <Text style={styles.barLabel}>الكوليسترول</Text>
                <Text style={[styles.barValue, isCholesterolViolated && { color: '#EF4444' }]}>
                  {selectedTotals.totalCholesterolMg.toFixed(0)} / {dashResult.maxDietaryCholesterolMg} ملغ
                </Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${progressPercent(selectedTotals.totalCholesterolMg, dashResult.maxDietaryCholesterolMg)}%`, backgroundColor: barColor(isCholesterolViolated) }]} />
              </View>
            </View>

            {dashResult.arabicDirectives.length > 0 && (
              <View style={styles.directivesBox}>
                {dashResult.arabicDirectives.map((d, i) => (
                  <Text key={i} style={styles.directiveText}>{d}</Text>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* SECTOR B: THERAPEUTIC FOOD PICKER MATRIX */}
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Ionicons name="restaurant" size={20} color={colors.info} />
            <Text style={styles.metricTitle}>مصفوفة الأغذية العلاجية</Text>
          </View>
          <View style={styles.foodCountRow}>
            <Text style={styles.foodCountText}>
              تم اختيار {selectedFoods.length} عناصر
              {selectedFoods.length > 0 && ` (${selectedTotals.totalCalories.toFixed(0)} سعرة)`}
            </Text>
          </View>
          <View style={styles.foodGrid}>
            {data.foods.map(food => {
              const isSelected = selectedFoods.some(f => f.id === food.id);
              const selected = selectedFoods.find(f => f.id === food.id);
              const isHighSodium = (food.sodiumMg ?? 0) > 300;
              const isHighFat = (food.saturatedFatG ?? 0) > 5;
              return (
                <TouchableOpacity
                  key={food.id}
                  style={[styles.foodCard, isSelected && styles.foodCardSelected]}
                  onPress={() => toggleFood(food)}
                >
                  <View style={styles.foodCardHeader}>
                    <Text style={styles.foodName}>{food.nameAr}</Text>
                    {(isHighSodium || isHighFat) && (
                      <Ionicons name="warning" size={14} color={colors.warning} />
                    )}
                  </View>
                  <Text style={styles.foodCalories}>{food.caloriesPer100g} سعرة/100غ</Text>
                  <Text style={styles.foodMacro}>بروتين: {food.proteinPer100g}غ</Text>
                  {isSelected && selected && (
                    <TextInput
                      style={styles.gramInput}
                      value={String(selected.selectedGrams)}
                      onChangeText={t => updateGrams(food.id, parseFloat(t) || 0)}
                      keyboardType="numeric"
                      textAlign="center"
                      selectTextOnFocus
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* SECTOR C: SECURITY OVERRIDE & TRANSACTION LOCKOUT */}
        {hasViolation && (
          <View style={styles.overrideCard}>
            <View style={styles.overrideHeader}>
              <Ionicons name="shield-checkmark" size={20} color={colors.warning} />
              <Text style={styles.overrideTitle}>تجاوز حدود DASH - مبرر إلزامي</Text>
            </View>
            <Text style={styles.overrideDesc}>
              تم تجاوز الحدود المسموح بها. الرجاء إدخال مبرر سريري (15 حرفاً على الأقل)
            </Text>
            <TextInput
              style={[styles.overrideInput, styles.overrideTextArea]}
              value={clinicalJustification}
              onChangeText={setClinicalJustification}
              placeholder="المبرر السريري الإلزامي..."
              placeholderTextColor={colors.textDisabled}
              textAlign="right"
              multiline
              numberOfLines={3}
            />
            {clinicalJustification.length > 0 && clinicalJustification.length < 15 && (
              <Text style={styles.charCount}>
                {clinicalJustification.length} / 15 حرفاً
              </Text>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveButton, (!canSave || saving) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!canSave || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primaryContrast} />
          ) : (
            <>
              <Ionicons name="save-outline" size={18} color={colors.primaryContrast} />
              <Text style={styles.saveButtonText}>حفظ الخطة الغذائية القلبية</Text>
            </>
          )}
        </TouchableOpacity>

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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
  } as const,
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  header: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'web' ? 16 : 60,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
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
  body: {
    flex: 1,
  } as const,
  bodyContent: {
    padding: spacing.md,
  } as const,
  metricCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  } as const,
  metricHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  } as const,
  metricTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: fontFamilies?.medium || 'System',
  } as const,
  metricBody: {
    padding: spacing.md,
  } as const,
  bpBadgeRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  } as const,
  bpBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  } as const,
  bpBadgeText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: fontFamilies?.medium || 'System',
  } as const,
  sodiumCapText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  barSection: {
    marginBottom: spacing.md,
  } as const,
  barLabelRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  } as const,
  barLabel: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  barValue: {
    fontSize: fontSizes.xs,
    color: colors.textPrimary,
    fontWeight: '700',
    fontFamily: fontFamilies?.medium || 'System',
  } as const,
  barTrack: {
    height: 8,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  } as const,
  barFill: {
    height: '100%',
    borderRadius: 4,
  } as const,
  directivesBox: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: spacing.sm,
    marginTop: spacing.sm,
  } as const,
  directiveText: {
    fontSize: fontSizes.xs,
    color: '#FDE68A',
    lineHeight: 18,
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  foodCountRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  } as const,
  foodCountText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    textAlign: 'right',
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  foodGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    padding: spacing.sm,
    gap: spacing.sm,
  } as const,
  foodCard: {
    width: '47%',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  } as const,
  foodCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#0A2E1F',
  } as const,
  foodCardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  } as const,
  foodName: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: fontFamilies?.medium || 'System',
    flex: 1,
  } as const,
  foodCalories: {
    fontSize: fontSizes.xs,
    color: colors.info,
    marginBottom: 2,
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  foodMacro: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  gramInput: {
    backgroundColor: colors.surface,
    borderRadius: 6,
    padding: spacing.xs,
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  overrideCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warning,
    padding: spacing.md,
    marginBottom: spacing.md,
  } as const,
  overrideHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  } as const,
  overrideTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: fontFamilies?.medium || 'System',
  } as const,
  overrideDesc: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'right',
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  overrideInput: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: spacing.sm,
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  overrideTextArea: {
    minHeight: 72,
    textAlignVertical: 'top',
  } as const,
  charCount: {
    fontSize: fontSizes.xs,
    color: colors.warning,
    textAlign: 'left',
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  saveButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 8,
  } as const,
  saveButtonDisabled: {
    opacity: 0.6,
  } as const,
  saveButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.primaryContrast,
    fontFamily: fontFamilies?.medium || 'System',
  } as const,
};
