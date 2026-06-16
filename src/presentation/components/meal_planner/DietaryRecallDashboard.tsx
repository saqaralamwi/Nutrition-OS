import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, FlatList, Switch, Modal, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontFamilies } from '../../theme';
import DropdownField from '../DropdownField';
import TextInputField from '../TextInputField';
import Button from '../Button';
import { DietaryIntakeAnalyzerEngine } from '../../../domain/calculators/DietaryIntakeAnalyzerEngine';
import type { ICalculatedMetabolicTargets } from '../../../domain/calculators/DietaryIntakeAnalyzerEngine';
import type {
  IFoodExchange, IDietaryHistorySession, IDietaryHistoryItem,
  MealSlotType, ServingUnit, ExchangeGroup,
} from '../../../data/types/meal_planner';

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

const DAY_TYPE_OPTIONS = [
  { label: 'يوم عادي', value: 'normal_weekday' },
  { label: 'عطلة نهاية الأسبوع', value: 'weekend_holiday' },
  { label: 'يوم مرض', value: 'sick_day' },
] as const;

const RELIABILITY_OPTIONS = [
  { label: 'عالية', value: 'high' },
  { label: 'متوسطة', value: 'medium' },
  { label: 'منخفضة', value: 'low' },
] as const;

const SERVING_UNIT_OPTIONS = [
  { label: 'غرام', value: 'grams' },
  { label: 'ملعقة طعام', value: 'tablespoon' },
  { label: 'كوب', value: 'cup' },
  { label: 'شريحة', value: 'slice' },
  { label: 'حبة', value: 'piece' },
] as const;

const EXCHANGE_GROUP_OPTIONS: { label: string; value: ExchangeGroup }[] = [
  { label: 'نشويات', value: 'starch' },
  { label: 'لحوم قليلة الدهن', value: 'meat_lean' },
  { label: 'لحوم متوسطة الدهن', value: 'meat_medium' },
  { label: 'لحوم عالية الدهن', value: 'meat_high' },
  { label: 'خضار', value: 'vegetable' },
  { label: 'فواكه', value: 'fruit' },
  { label: 'حليب', value: 'milk' },
  { label: 'دهون', value: 'fat' },
];

const MINERAL_LEVEL_OPTIONS = [
  { label: 'منخفض', value: 'low' },
  { label: 'متوسط', value: 'medium' },
  { label: 'مرتفع', value: 'high' },
] as const;

interface MealEntry {
  id: string;
  foodExchangeId: string;
  customReportedName: string;
  servingUnitUsed: ServingUnit;
  servingsConsumed: number;
  derivedFluidMl: number;
}

interface MealSlotData {
  consumptionTime: string;
  entries: MealEntry[];
}

interface DietaryRecallDashboardProps {
  patientId: string;
  masterFoods: IFoodExchange[];
  targets: ICalculatedMetabolicTargets;
  onSaveSession?: (session: IDietaryHistorySession, items: IDietaryHistoryItem[]) => Promise<void>;
  onSaveNewFood?: (food: IFoodExchange) => Promise<void>;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function formatDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function initSlots(): Record<string, MealSlotData> {
  const slots: Record<string, MealSlotData> = {};
  for (const slot of MEAL_SLOT_ORDER) {
    slots[slot] = { consumptionTime: '', entries: [] };
  }
  return slots;
}

export default function DietaryRecallDashboard({
  patientId,
  masterFoods,
  targets,
  onSaveSession,
  onSaveNewFood,
}: DietaryRecallDashboardProps) {
  const [dayType, setDayType] = useState<string>('normal_weekday');
  const [reliabilityScore, setReliabilityScore] = useState<string>('high');
  const [interviewDate, setInterviewDate] = useState<string>(formatDateString(new Date()));
  const [mealSlots, setMealSlots] = useState<Record<string, MealSlotData>>(initSlots);
  const [saving, setSaving] = useState(false);
  const [showInjector, setShowInjector] = useState(false);

  const [typeaheadText, setTypeaheadText] = useState<Record<string, string>>({});
  const [typeaheadResults, setTypeaheadResults] = useState<Record<string, IFoodExchange[]>>({});
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const [injectFoodName, setInjectFoodName] = useState('');
  const [injectExchangeGroup, setInjectExchangeGroup] = useState<string>('starch');
  const [injectCarbs, setInjectCarbs] = useState('');
  const [injectProtein, setInjectProtein] = useState('');
  const [injectFat, setInjectFat] = useState('');
  const [injectCalories, setInjectCalories] = useState('');
  const [injectGlycemicIndex, setInjectGlycemicIndex] = useState('50');
  const [injectPotassium, setInjectPotassium] = useState<string>('low');
  const [injectPhosphorus, setInjectPhosphorus] = useState<string>('low');
  const [injectGlutenFree, setInjectGlutenFree] = useState(true);
  const [injectLowFodmap, setInjectLowFodmap] = useState(true);
  const [injectLactoseFree, setInjectLactoseFree] = useState(true);
  const [injectMicronutrients, setInjectMicronutrients] = useState('');

  const handleTypeaheadChange = useCallback((slotKey: string, text: string) => {
    setTypeaheadText((prev) => ({ ...prev, [slotKey]: text }));
    if (debounceRef.current[slotKey]) {
      clearTimeout(debounceRef.current[slotKey]);
    }
    debounceRef.current[slotKey] = setTimeout(() => {
      if (text.trim().length === 0) {
        setTypeaheadResults((prev) => ({ ...prev, [slotKey]: [] }));
        return;
      }
      const q = text.trim().toLowerCase();
      const filtered = masterFoods.filter((f) => f.foodNameAr.includes(q));
      setTypeaheadResults((prev) => ({ ...prev, [slotKey]: filtered }));
    }, 250);
  }, [masterFoods]);

  const selectTypeaheadItem = useCallback((slotKey: string, food: IFoodExchange) => {
    setMealSlots((prev) => {
      const slot = prev[slotKey];
      if (!slot) return prev;
      const newEntry: MealEntry = {
        id: generateId(),
        foodExchangeId: food.foodNameAr,
        customReportedName: food.foodNameAr,
        servingUnitUsed: 'piece',
        servingsConsumed: 1,
        derivedFluidMl: 0,
      };
      return {
        ...prev,
        [slotKey]: { ...slot, entries: [...slot.entries, newEntry] },
      };
    });
    setTypeaheadText((prev) => ({ ...prev, [slotKey]: '' }));
    setTypeaheadResults((prev) => ({ ...prev, [slotKey]: [] }));
  }, []);

  const removeEntry = useCallback((slotKey: string, entryId: string) => {
    setMealSlots((prev) => {
      const slot = prev[slotKey];
      if (!slot) return prev;
      return {
        ...prev,
        [slotKey]: { ...slot, entries: slot.entries.filter((e) => e.id !== entryId) },
      };
    });
  }, []);

  const updateEntryField = useCallback((
    slotKey: string, entryId: string,
    field: keyof MealEntry, value: string | number,
  ) => {
    setMealSlots((prev) => {
      const slot = prev[slotKey];
      if (!slot) return prev;
      return {
        ...prev,
        [slotKey]: {
          ...slot,
          entries: slot.entries.map((e) =>
            e.id === entryId ? { ...e, [field]: value } : e,
          ),
        },
      };
    });
  }, []);

  const updateConsumptionTime = useCallback((slotKey: string, time: string) => {
    setMealSlots((prev) => {
      const slot = prev[slotKey];
      if (!slot) return prev;
      return { ...prev, [slotKey]: { ...slot, consumptionTime: time } };
    });
  }, []);

  const analysisResult = useMemo(() => {
    const isFormValid = MEAL_SLOT_ORDER.some(
      (slotKey) => (mealSlots[slotKey]?.entries.length ?? 0) > 0,
    );
    if (!isFormValid) return null;

    const now = Math.floor(Date.now() / 1000);
    const session: IDietaryHistorySession = {
      patientId,
      interviewDate: now,
      dayType: dayType as IDietaryHistorySession['dayType'],
      reliabilityScore: reliabilityScore as IDietaryHistorySession['reliabilityScore'],
      totalComputedCalories: 0,
      totalComputedProtein: 0,
      totalFluidIntakeMl: 0,
      recordedAt: now,
    };

    const items: IDietaryHistoryItem[] = [];
    for (const slotKey of MEAL_SLOT_ORDER) {
      const slot = mealSlots[slotKey];
      if (!slot) continue;
      for (const entry of slot.entries) {
        items.push({
          sessionId: session.patientId,
          mealSlotType: slotKey as MealSlotType,
          consumptionTime: slot.consumptionTime || '00:00',
          foodExchangeId: entry.foodExchangeId,
          customReportedName: entry.customReportedName,
          servingUnitUsed: entry.servingUnitUsed,
          servingsConsumed: entry.servingsConsumed,
          derivedFluidMl: entry.derivedFluidMl,
          derivedCalories: 0,
          derivedProtein: 0,
          derivedCarbs: 0,
          derivedFat: 0,
        });
      }
    }

    return DietaryIntakeAnalyzerEngine.analyzeSessionIntake(
      session, items, masterFoods, targets,
    );
  }, [mealSlots, patientId, dayType, reliabilityScore, masterFoods, targets]);

  const handleSaveSession = useCallback(async () => {
    if (!onSaveSession || !analysisResult) return;
    setSaving(true);
    try {
      const now = Math.floor(Date.now() / 1000);
      const session: IDietaryHistorySession = {
        patientId,
        interviewDate: now,
        dayType: dayType as IDietaryHistorySession['dayType'],
        reliabilityScore: reliabilityScore as IDietaryHistorySession['reliabilityScore'],
        totalComputedCalories: analysisResult.actualTotals.calories,
        totalComputedProtein: analysisResult.actualTotals.protein,
        totalFluidIntakeMl: analysisResult.actualTotals.fluidMl,
        recordedAt: now,
      };

      const items: IDietaryHistoryItem[] = [];
      for (const slotKey of MEAL_SLOT_ORDER) {
        const slot = mealSlots[slotKey];
        if (!slot) continue;
        for (const entry of slot.entries) {
          items.push({
            sessionId: session.patientId,
            mealSlotType: slotKey as MealSlotType,
            consumptionTime: slot.consumptionTime || '00:00',
            foodExchangeId: entry.foodExchangeId,
            customReportedName: entry.customReportedName,
            servingUnitUsed: entry.servingUnitUsed,
            servingsConsumed: entry.servingsConsumed,
            derivedFluidMl: entry.derivedFluidMl,
            derivedCalories: 0,
            derivedProtein: 0,
            derivedCarbs: 0,
            derivedFat: 0,
          });
        }
      }

      await onSaveSession(session, items);
    } finally {
      setSaving(false);
    }
  }, [onSaveSession, analysisResult, patientId, dayType, reliabilityScore, mealSlots]);

  const handleAddNewFood = useCallback(async () => {
    const newFood: IFoodExchange = {
      exchangeGroup: injectExchangeGroup as ExchangeGroup,
      foodNameAr: injectFoodName,
      servingSizeDesc: 'حصة واحدة',
      carbsG: parseFloat(injectCarbs) || 0,
      proteinG: parseFloat(injectProtein) || 0,
      fatG: parseFloat(injectFat) || 0,
      caloriesKcal: parseFloat(injectCalories) || 0,
      glycemicIndex: parseFloat(injectGlycemicIndex) || 0,
      potassiumLevel: injectPotassium as IFoodExchange['potassiumLevel'],
      phosphorusLevel: injectPhosphorus as IFoodExchange['phosphorusLevel'],
      isGlutenFree: injectGlutenFree,
      isLowFodmap: injectLowFodmap,
      isLactoseFree: injectLactoseFree,
      isUserDefined: true,
      associatedPatientId: patientId,
      isCompositeRecipe: false,
      recipeDecompositionJson: '[]',
      householdUnitsJson: '{}',
      micronutrientTagsJson: injectMicronutrients || '[]',
    };
    if (onSaveNewFood) {
      await onSaveNewFood(newFood);
    }
    setShowInjector(false);
    setInjectFoodName('');
    setInjectCarbs('');
    setInjectProtein('');
    setInjectFat('');
    setInjectCalories('');
    setInjectGlycemicIndex('50');
    setInjectPotassium('low');
    setInjectPhosphorus('low');
    setInjectGlutenFree(true);
    setInjectLowFodmap(true);
    setInjectLactoseFree(true);
    setInjectMicronutrients('');
  }, [
    injectFoodName, injectExchangeGroup, injectCarbs, injectProtein,
    injectFat, injectCalories, injectGlycemicIndex, injectPotassium,
    injectPhosphorus, injectGlutenFree, injectLowFodmap, injectLactoseFree,
    injectMicronutrients, patientId, onSaveNewFood,
  ]);

  const getProgressColor = (coverage: number): string => {
    if (coverage >= 90 && coverage <= 110) return colors.success;
    if (coverage >= 50) return colors.warning;
    return colors.danger;
  };

  const getProgressWidth = (coverage: number): string => {
    return `${Math.min(coverage, 200)}%`;
  };

  useEffect(() => {
    return () => {
      for (const key of Object.keys(debounceRef.current)) {
        clearTimeout(debounceRef.current[key]);
      }
    };
  }, []);

  const renderProgressBar = (
    labelAr: string,
    unit: string,
    actual: number,
    target: number,
    coverage: number,
  ) => {
    const color = getProgressColor(coverage);
    return (
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>{labelAr}</Text>
          <Text style={styles.progressValue}>
            {actual.toFixed(2)} {unit} / {target.toFixed(2)} {unit} ({coverage.toFixed(2)}%)
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: getProgressWidth(coverage), backgroundColor: color },
            ]}
          />
        </View>
      </View>
    );
  };

  const renderMealSlot = (slotKey: MealSlotType) => {
    const slot = mealSlots[slotKey];
    if (!slot) return null;
    const tResults = typeaheadResults[slotKey] ?? [];

    return (
      <View key={slotKey} style={styles.mealSlotCard}>
        <Text style={styles.mealSlotTitle}>{MEAL_SLOT_LABELS[slotKey]}</Text>

        <Text style={styles.fieldLabel}>وقت تناول الوجبة</Text>
        <TextInput
          style={styles.timeInput}
          value={slot.consumptionTime}
          onChangeText={(t) => updateConsumptionTime(slotKey, t)}
          placeholder="08:00"
          placeholderTextColor={colors.textDisabled}
          textAlign="right"
        />

        {slot.entries.map((entry) => (
          <View key={entry.id} style={styles.entryRow}>
            <TouchableOpacity onPress={() => removeEntry(slotKey, entry.id)}>
              <Ionicons name="close-circle" size={22} color={colors.danger} />
            </TouchableOpacity>
            <Text style={styles.entryName}>{entry.customReportedName}</Text>
            <TextInput
              style={styles.entryQtyInput}
              value={String(entry.servingsConsumed)}
              onChangeText={(t) => {
                const v = parseFloat(t) || 0;
                updateEntryField(slotKey, entry.id, 'servingsConsumed', v);
              }}
              keyboardType="decimal-pad"
              textAlign="center"
            />
            <DropdownField
              label=""
              options={SERVING_UNIT_OPTIONS}
              selectedValue={entry.servingUnitUsed}
              onValueChange={(v) =>
                updateEntryField(slotKey, entry.id, 'servingUnitUsed', v as ServingUnit)
              }
            />
          </View>
        ))}

        <View style={styles.typeaheadContainer}>
          <TextInput
            style={styles.typeaheadInput}
            value={typeaheadText[slotKey] ?? ''}
            onChangeText={(t) => handleTypeaheadChange(slotKey, t)}
            placeholder="ابحث عن طعام..."
            placeholderTextColor={colors.textDisabled}
            textAlign="right"
          />
          {tResults.length > 0 && (
            <View style={styles.typeaheadDropdown}>
              <FlatList
                data={tResults}
                keyExtractor={(item) => item.foodNameAr}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.typeaheadItem}
                    onPress={() => selectTypeaheadItem(slotKey, item)}
                  >
                    <Text style={styles.typeaheadItemText}>{item.foodNameAr}</Text>
                    <Text style={styles.typeaheadItemSub}>
                      {item.caloriesKcal} كال | {item.carbsG}g كرب | {item.proteinG}g بروتين
                    </Text>
                  </TouchableOpacity>
                )}
                style={{ maxHeight: 180 }}
              />
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* ===== Session Metadata ===== */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>بيانات جلسة التغذية الراجعة</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaHalf}>
            <DropdownField
              label="نوع اليوم"
              options={DAY_TYPE_OPTIONS}
              selectedValue={dayType}
              onValueChange={setDayType}
            />
          </View>
          <View style={styles.metaHalf}>
            <DropdownField
              label="مصداقية التذكر"
              options={RELIABILITY_OPTIONS}
              selectedValue={reliabilityScore}
              onValueChange={setReliabilityScore}
            />
          </View>
        </View>
        <TextInputField
          label="تاريخ المقابلة"
          value={interviewDate}
          onChangeText={setInterviewDate}
          placeholder="YYYY-MM-DD"
        />
      </View>

      {/* ===== Progress Bars ===== */}
      {analysisResult && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>مؤشرات التغطية الغذائية</Text>
          {renderProgressBar(
            'السعرات الحرارية', 'كيلو كالوري',
            analysisResult.actualTotals.calories,
            targets.calories,
            analysisResult.coveragePercentages.calories,
          )}
          {renderProgressBar(
            'البروتين', 'غرام',
            analysisResult.actualTotals.protein,
            targets.protein,
            analysisResult.coveragePercentages.protein,
          )}
          {renderProgressBar(
            'الكربوهيدرات', 'غرام',
            analysisResult.actualTotals.carbs,
            targets.carbs,
            analysisResult.coveragePercentages.carbs,
          )}
          {renderProgressBar(
            'الدهون', 'غرام',
            analysisResult.actualTotals.fat,
            targets.fat,
            analysisResult.coveragePercentages.fat,
          )}
          {renderProgressBar(
            'السوائل', 'مل',
            analysisResult.actualTotals.fluidMl,
            targets.fluidMl,
            analysisResult.coveragePercentages.fluid,
          )}
        </View>
      )}

      {/* ===== 6-Meal Matrix ===== */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>مصفوفة الوجبات</Text>
        {MEAL_SLOT_ORDER.map(renderMealSlot)}
      </View>

      {/* ===== Alerts & Educational Cards ===== */}
      {analysisResult && (analysisResult.clinicalAlerts.length > 0 || analysisResult.educationalCards.length > 0) && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>التنبيهات والتوجيهات السريرية</Text>
          {analysisResult.clinicalAlerts.map((alert, i) => (
            <View
              key={`alert-${i}`}
              style={[
                styles.alertCard,
                alert.severity === 'critical'
                  ? styles.alertCritical
                  : alert.severity === 'warning'
                    ? styles.alertWarning
                    : styles.alertInfo,
              ]}
            >
              <Ionicons
                name={
                  alert.severity === 'critical'
                    ? 'warning'
                    : alert.severity === 'warning'
                      ? 'alert-circle'
                      : 'information-circle'
                }
                size={22}
                color={
                  alert.severity === 'critical'
                    ? colors.danger
                    : alert.severity === 'warning'
                      ? colors.warning
                      : colors.info
                }
              />
              <Text style={styles.alertText}>{alert.arabicMessage}</Text>
            </View>
          ))}
          {analysisResult.educationalCards.map((card, i) => (
            <View key={`edu-${i}`} style={styles.educationalCard}>
              <Ionicons name="bulb" size={22} color={colors.warning} />
              <Text style={styles.educationalText}>{card}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ===== Save Session ===== */}
      {onSaveSession && analysisResult && (
        <View style={styles.sectionCard}>
          <Button
            title="حفظ الجلسة"
            onPress={handleSaveSession}
            loading={saving}
            disabled={saving}
          />
        </View>
      )}

      {/* ===== Quick Food Injector ===== */}
      <View style={styles.sectionCard}>
        <TouchableOpacity
          style={styles.injectorToggle}
          onPress={() => setShowInjector(!showInjector)}
        >
          <Ionicons
            name={showInjector ? 'chevron-up' : 'add-circle'}
            size={22}
            color={colors.primary}
          />
          <Text style={styles.injectorToggleText}>
            {showInjector ? 'إخفاء إضافة طعام جديد' : 'إضافة طعام مخصص جديد'}
          </Text>
        </TouchableOpacity>

        {showInjector && (
          <View style={styles.injectorForm}>
            <TextInputField
              label="اسم الطعام (عربي)"
              value={injectFoodName}
              onChangeText={setInjectFoodName}
            />
            <DropdownField
              label="مجموعة التبادل"
              options={EXCHANGE_GROUP_OPTIONS}
              selectedValue={injectExchangeGroup}
              onValueChange={setInjectExchangeGroup}
            />
            <View style={styles.metaRow}>
              <View style={styles.metaHalf}>
                <TextInputField
                  label="كربوهيدرات (غ)"
                  value={injectCarbs}
                  onChangeText={setInjectCarbs}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.metaHalf}>
                <TextInputField
                  label="بروتين (غ)"
                  value={injectProtein}
                  onChangeText={setInjectProtein}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            <View style={styles.metaRow}>
              <View style={styles.metaHalf}>
                <TextInputField
                  label="دهون (غ)"
                  value={injectFat}
                  onChangeText={setInjectFat}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.metaHalf}>
                <TextInputField
                  label="سعرات (ك.كال)"
                  value={injectCalories}
                  onChangeText={setInjectCalories}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            <TextInputField
              label="مؤشر جلايسمي"
              value={injectGlycemicIndex}
              onChangeText={setInjectGlycemicIndex}
              keyboardType="decimal-pad"
            />
            <View style={styles.metaRow}>
              <View style={styles.metaHalf}>
                <DropdownField
                  label="مستوى البوتاسيوم"
                  options={MINERAL_LEVEL_OPTIONS}
                  selectedValue={injectPotassium}
                  onValueChange={setInjectPotassium}
                />
              </View>
              <View style={styles.metaHalf}>
                <DropdownField
                  label="مستوى الفوسفور"
                  options={MINERAL_LEVEL_OPTIONS}
                  selectedValue={injectPhosphorus}
                  onValueChange={setInjectPhosphorus}
                />
              </View>
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>خالٍ من الغلوتين</Text>
              <Switch
                value={injectGlutenFree}
                onValueChange={setInjectGlutenFree}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>منخفض الفودماب</Text>
              <Switch
                value={injectLowFodmap}
                onValueChange={setInjectLowFodmap}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>خالٍ من اللاكتوز</Text>
              <Switch
                value={injectLactoseFree}
                onValueChange={setInjectLactoseFree}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
            <TextInputField
              label="وسوم غذائية دقيقة (JSON)"
              value={injectMicronutrients}
              onChangeText={setInjectMicronutrients}
              placeholder='["zinc","vitamin_c"]'
            />
            <Button
              title="حفظ الطعام المخصص"
              onPress={handleAddNewFood}
              disabled={!injectFoodName.trim()}
              variant="secondary"
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
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
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metaHalf: {
    flex: 1,
  },
  progressCard: {
    marginBottom: spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    fontSize: 13,
    fontFamily: fontFamilies.regular,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  progressValue: {
    fontSize: 12,
    fontFamily: fontFamilies.regular,
    color: colors.textSecondary,
    textAlign: 'left',
  },
  progressTrack: {
    height: 10,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  mealSlotCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mealSlotTitle: {
    fontSize: 15,
    fontFamily: fontFamilies.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
    textAlign: 'right',
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: fontFamilies.regular,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textAlign: 'right',
  },
  timeInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: 14,
    color: colors.textPrimary,
    fontFamily: fontFamilies.regular,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
    textAlign: 'right',
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.xs,
  },
  entryName: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamilies.regular,
    color: colors.textPrimary,
    textAlign: 'right',
  },
  entryQtyInput: {
    width: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: spacing.xs,
    fontSize: 14,
    color: colors.textPrimary,
    fontFamily: fontFamilies.regular,
    backgroundColor: colors.surfaceSecondary,
  },
  typeaheadContainer: {
    marginTop: spacing.xs,
  },
  typeaheadInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: 14,
    color: colors.textPrimary,
    fontFamily: fontFamilies.regular,
    backgroundColor: colors.surface,
    textAlign: 'right',
  },
  typeaheadDropdown: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  typeaheadItem: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  typeaheadItemText: {
    fontSize: 14,
    fontFamily: fontFamilies.regular,
    color: colors.textPrimary,
    textAlign: 'right',
  },
  typeaheadItemSub: {
    fontSize: 11,
    fontFamily: fontFamilies.regular,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  alertCritical: {
    backgroundColor: '#3B1515',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  alertWarning: {
    backgroundColor: '#3B2E15',
    borderWidth: 1,
    borderColor: colors.warning,
  },
  alertInfo: {
    backgroundColor: '#15273B',
    borderWidth: 1,
    borderColor: colors.info,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fontFamilies.regular,
    color: colors.textPrimary,
    textAlign: 'right',
    lineHeight: 20,
  },
  educationalCard: {
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
  educationalText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fontFamilies.regular,
    color: colors.textPrimary,
    textAlign: 'right',
    lineHeight: 20,
  },
  injectorToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  injectorToggleText: {
    fontSize: 14,
    fontFamily: fontFamilies.bold,
    color: colors.primary,
    textAlign: 'right',
  },
  injectorForm: {
    marginTop: spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
  },
  switchLabel: {
    fontSize: 14,
    fontFamily: fontFamilies.regular,
    color: colors.textPrimary,
    textAlign: 'right',
  },
});
