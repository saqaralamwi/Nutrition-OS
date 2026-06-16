import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Platform, KeyboardAvoidingView, StyleSheet,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontFamilies, fontSizes } from '../../src/presentation/theme';
import { getDatabase } from '../../src/data/database';
import FoodExchange from '../../src/data/models/FoodExchange';
import { ExchangeGroup } from '../../src/data/types/meal_planner';

const EXCHANGE_GROUPS: { key: ExchangeGroup; ar: string }[] = [
  { key: 'starch', ar: 'نشويات' },
  { key: 'meat_lean', ar: 'لحوم قليلة الدسم' },
  { key: 'meat_medium', ar: 'لحوم متوسطة الدسم' },
  { key: 'meat_high', ar: 'لحوم عالية الدسم' },
  { key: 'vegetable', ar: 'خضروات' },
  { key: 'fruit', ar: 'فواكه' },
  { key: 'milk', ar: 'حليب ومنتجات ألبان' },
  { key: 'fat', ar: 'دهون وزيوت' },
];

const GROUP_AR: Record<string, string> = Object.fromEntries(
  EXCHANGE_GROUPS.map((g) => [g.key, g.ar]),
);

function r2(v: number): number {
  return parseFloat(v.toFixed(2));
}

export default function FoodExchangesDashboard() {
  const router = useRouter();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [exchangeGroup, setExchangeGroup] = useState<ExchangeGroup>('starch');
  const [foodNameAr, setFoodNameAr] = useState('');
  const [servingSizeDesc, setServingSizeDesc] = useState('');
  const [carbsG, setCarbsG] = useState('');
  const [proteinG, setProteinG] = useState('');
  const [fatG, setFatG] = useState('');
  const [caloriesKcal, setCaloriesKcal] = useState('');
  const [glycemicIndex, setGlycemicIndex] = useState('');
  const [potassiumLevel, setPotassiumLevel] = useState('low');
  const [phosphorusLevel, setPhosphorusLevel] = useState('low');
  const [isGlutenFree, setIsGlutenFree] = useState(false);
  const [isLowFodmap, setIsLowFodmap] = useState(false);
  const [isLactoseFree, setIsLactoseFree] = useState(false);
  const [isUserDefined, setIsUserDefined] = useState(false);
  const [isCompositeRecipe, setIsCompositeRecipe] = useState(false);
  const [filterGroup, setFilterGroup] = useState<string | null>(null);

  const [foods, setFoods] = useState<FoodExchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadFoods = useCallback(async () => {
    try {
      let db;
      try {
        db = await getDatabase();
      } catch {
        Alert.alert('خطأ', 'تعذر الاتصال بقاعدة البيانات');
        return;
      }
      if (!db) return;
      const data = await db.get<FoodExchange>('food_exchanges').query().fetch();
      setFoods(data);
    } catch (err) {
      console.error(err);
      Alert.alert('خطأ', 'فشل في تحميل بدائل الطعام');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFoods();
  }, [loadFoods]);

  const resetForm = () => {
    setSelectedId(null);
    setExchangeGroup('starch');
    setFoodNameAr('');
    setServingSizeDesc('');
    setCarbsG('');
    setProteinG('');
    setFatG('');
    setCaloriesKcal('');
    setGlycemicIndex('');
    setPotassiumLevel('low');
    setPhosphorusLevel('low');
    setIsGlutenFree(false);
    setIsLowFodmap(false);
    setIsLactoseFree(false);
    setIsUserDefined(false);
    setIsCompositeRecipe(false);
  };

  const handleEdit = (food: FoodExchange) => {
    setSelectedId(food.id);
    setExchangeGroup((food as any).exchangeGroup || 'starch');
    setFoodNameAr(food.foodNameAr);
    setServingSizeDesc(food.servingSizeDesc);
    setCarbsG(String(food.carbsG));
    setProteinG(String(food.proteinG));
    setFatG(String(food.fatG));
    setCaloriesKcal(String(food.caloriesKcal));
    setGlycemicIndex(String((food as any).glycemicIndex ?? ''));
    setPotassiumLevel((food as any).potassiumLevel || 'low');
    setPhosphorusLevel((food as any).phosphorusLevel || 'low');
    setIsGlutenFree(!!(food as any).isGlutenFree);
    setIsLowFodmap(!!(food as any).isLowFodmap);
    setIsLactoseFree(!!(food as any).isLactoseFree);
    setIsUserDefined(true);
    setIsCompositeRecipe(!!(food as any).isCompositeRecipe);
  };

  const handleDelete = (food: FoodExchange) => {
    Alert.alert(
      'تأكيد الحذف',
      `هل تريد حذف "${food.foodNameAr}" نهائياً؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = await getDatabase();
              await db.write(async () => {
                await food.markAsDeleted();
              });
              setFoods((prev) => prev.filter((f) => f.id !== food.id));
              if (selectedId === food.id) resetForm();
            } catch (err) {
              console.error(err);
            }
          },
        },
      ],
    );
  };

  const handleSave = async () => {
    if (!foodNameAr.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم الطعام بالعربية');
      return;
    }
    setSaving(true);
    try {
      const db = await getDatabase();
      const c = parseFloat(caloriesKcal) || 0;
      const p = parseFloat(proteinG) || 0;
      const carbs = parseFloat(carbsG) || 0;
      const f = parseFloat(fatG) || 0;

      await db.write(async () => {
        const collection = db.get<FoodExchange>('food_exchanges');
        const raw: Record<string, any> = {
          exchange_group: exchangeGroup,
          food_name_ar: foodNameAr.trim(),
          serving_size_desc: servingSizeDesc.trim() || 'حصة واحدة',
          carbs_g: r2(carbs),
          protein_g: r2(p),
          fat_g: r2(f),
          calories_kcal: r2(c),
          glycemic_index: parseFloat(glycemicIndex) || 0,
          potassium_level: potassiumLevel,
          phosphorus_level: phosphorusLevel,
          is_gluten_free: isGlutenFree,
          is_low_fodmap: isLowFodmap,
          is_lactose_free: isLactoseFree,
          is_user_defined: true,
          associated_patient_id: null,
          is_composite_recipe: isCompositeRecipe,
          recipe_decomposition_json: '[]',
          household_units_json: JSON.stringify([
            { unit: 'grams', label: 'غرام', ratioToBase: 1 },
          ]),
          micronutrient_tags_json: '[]',
        };

        if (selectedId) {
          const existing = await collection.find(selectedId);
          await existing.update((record: any) => {
            Object.assign(record._raw, raw);
          });
        } else {
          await collection.create((record: any) => {
            Object.assign(record._raw, raw);
          });
        }
      });

      resetForm();
      await loadFoods();
    } catch (err) {
      console.error(err);
      Alert.alert('خطأ', 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const groupedFoods: Record<string, FoodExchange[]> = {};
  for (const food of foods) {
    const g = (food as any).exchangeGroup || 'starch';
    if (filterGroup && g !== filterGroup) continue;
    if (!groupedFoods[g]) groupedFoods[g] = [];
    groupedFoods[g].push(food);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-forward" size={24} color={colors.primaryContrast} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>إدارة بدائل الطعام</Text>
          <Text style={styles.headerCount}>{foods.length} صنف</Text>
        </View>

        {/* Filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, !filterGroup && styles.filterChipActive]}
            onPress={() => setFilterGroup(null)}
          >
            <Text style={[styles.filterChipText, !filterGroup && styles.filterChipTextActive]}>
              الكل
            </Text>
          </TouchableOpacity>
          {EXCHANGE_GROUPS.map((g) => (
            <TouchableOpacity
              key={g.key}
              style={[styles.filterChip, filterGroup === g.key && styles.filterChipActive]}
              onPress={() => setFilterGroup(g.key)}
            >
              <Text style={[styles.filterChipText, filterGroup === g.key && styles.filterChipTextActive]}>
                {g.ar}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {selectedId ? 'تعديل صنف' : 'إضافة صنف جديد'}
          </Text>

          <View style={styles.formRow}>
            <View style={styles.formHalf}>
              <Text style={styles.label}>المجموعة</Text>
              <View style={styles.groupPicker}>
                {EXCHANGE_GROUPS.map((g) => (
                  <TouchableOpacity
                    key={g.key}
                    style={[
                      styles.groupOption,
                      exchangeGroup === g.key && styles.groupOptionActive,
                    ]}
                    onPress={() => setExchangeGroup(g.key as ExchangeGroup)}
                  >
                    <Text
                      style={[
                        styles.groupOptionText,
                        exchangeGroup === g.key && styles.groupOptionTextActive,
                      ]}
                    >
                      {g.ar}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <Text style={styles.label}>اسم الطعام (بالعربية)</Text>
          <TextInput
            style={styles.input}
            value={foodNameAr}
            onChangeText={setFoodNameAr}
            placeholder="مثال: أرز أبيض مطبوخ"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.label}>وصف الحصة</Text>
          <TextInput
            style={styles.input}
            value={servingSizeDesc}
            onChangeText={setServingSizeDesc}
            placeholder="مثال: نصف كوب - 100 غرام"
            placeholderTextColor={colors.textSecondary}
          />

          <View style={styles.nutrientGrid}>
            <View style={styles.nutrientItem}>
              <Text style={styles.label}>سعرات (ك.كال)</Text>
              <TextInput
                style={styles.input}
                value={caloriesKcal}
                onChangeText={setCaloriesKcal}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <View style={styles.nutrientItem}>
              <Text style={styles.label}>بروتين (غ)</Text>
              <TextInput
                style={styles.input}
                value={proteinG}
                onChangeText={setProteinG}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <View style={styles.nutrientItem}>
              <Text style={styles.label}>كربوهيدرات (غ)</Text>
              <TextInput
                style={styles.input}
                value={carbsG}
                onChangeText={setCarbsG}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <View style={styles.nutrientItem}>
              <Text style={styles.label}>دهون (غ)</Text>
              <TextInput
                style={styles.input}
                value={fatG}
                onChangeText={setFatG}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.nutrientGrid}>
            <View style={styles.nutrientItem}>
              <Text style={styles.label}>مؤشر جلايسيمي</Text>
              <TextInput
                style={styles.input}
                value={glycemicIndex}
                onChangeText={setGlycemicIndex}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <View style={styles.nutrientItem}>
              <Text style={styles.label}>بوتاسيوم</Text>
              <View style={styles.levelRow}>
                {(['low', 'medium', 'high'] as const).map((l) => (
                  <TouchableOpacity
                    key={l}
                    style={[styles.levelBtn, potassiumLevel === l && styles.levelBtnActive]}
                    onPress={() => setPotassiumLevel(l)}
                  >
                    <Text
                      style={[styles.levelBtnText, potassiumLevel === l && styles.levelBtnTextActive]}
                    >
                      {l === 'low' ? 'منخفض' : l === 'medium' ? 'متوسط' : 'مرتفع'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.nutrientItem}>
              <Text style={styles.label}>فوسفور</Text>
              <View style={styles.levelRow}>
                {(['low', 'medium', 'high'] as const).map((l) => (
                  <TouchableOpacity
                    key={l}
                    style={[styles.levelBtn, phosphorusLevel === l && styles.levelBtnActive]}
                    onPress={() => setPhosphorusLevel(l)}
                  >
                    <Text
                      style={[styles.levelBtnText, phosphorusLevel === l && styles.levelBtnTextActive]}
                    >
                      {l === 'low' ? 'منخفض' : l === 'medium' ? 'متوسط' : 'مرتفع'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.switchRow}>
            <TouchableOpacity
              style={[styles.switchBtn, isGlutenFree && styles.switchBtnOn]}
              onPress={() => setIsGlutenFree((v) => !v)}
            >
              <Text style={[styles.switchText, isGlutenFree && styles.switchTextOn]}>
                {isGlutenFree ? '✓' : '○'} خالي من الجلوتين
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.switchBtn, isLowFodmap && styles.switchBtnOn]}
              onPress={() => setIsLowFodmap((v) => !v)}
            >
              <Text style={[styles.switchText, isLowFodmap && styles.switchTextOn]}>
                {isLowFodmap ? '✓' : '○'} منخفض الفودماب
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.switchBtn, isLactoseFree && styles.switchBtnOn]}
              onPress={() => setIsLactoseFree((v) => !v)}
            >
              <Text style={[styles.switchText, isLactoseFree && styles.switchTextOn]}>
                {isLactoseFree ? '✓' : '○'} خالي من اللاكتوز
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.switchBtn, styles.switchBtnInline, isCompositeRecipe && styles.switchBtnOn]}
            onPress={() => setIsCompositeRecipe((v) => !v)}
          >
            <Text style={[styles.switchText, isCompositeRecipe && styles.switchTextOn]}>
              {isCompositeRecipe ? '✓' : '○'} وصفة مركبة
            </Text>
          </TouchableOpacity>

          <View style={styles.formActions}>
            {selectedId && (
              <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
                <Text style={styles.cancelBtnText}>إلغاء</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.primaryContrast} />
              ) : (
                <Text style={styles.saveBtnText}>
                  {selectedId ? 'تحديث' : 'إضافة'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* List */}
        {Object.entries(groupedFoods).map(([group, items]) => (
          <View key={group} style={styles.groupSection}>
            <View style={styles.groupHeader}>
              <Ionicons name="folder-open-outline" size={18} color={colors.primary} />
              <Text style={styles.groupTitle}>{GROUP_AR[group] || group}</Text>
              <Text style={styles.groupCount}>{items.length}</Text>
            </View>
            {items.map((food) => (
              <View key={food.id} style={styles.foodRow}>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{food.foodNameAr}</Text>
                  <Text style={styles.foodServing}>{food.servingSizeDesc}</Text>
                  <Text style={styles.foodMacros}>
                    {food.caloriesKcal} ك.كال | {food.proteinG}غ بروتين | {food.carbsG}غ كارب | {food.fatG}غ دهون
                  </Text>
                </View>
                <View style={styles.foodActions}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => handleEdit(food)}
                  >
                    <Ionicons name="create-outline" size={18} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(food)}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
    alignItems: 'center',
  },
  backBtn: { marginRight: spacing.sm, padding: 4 },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: colors.primaryContrast,
  },
  headerCount: {
    fontSize: 14,
    color: colors.primaryContrast,
    opacity: 0.8,
  },
  filterRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.primaryContrast,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: colors.surface,
    margin: spacing.md,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  formRow: { marginBottom: spacing.sm },
  formHalf: { flex: 1 },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  groupPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  groupOption: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  groupOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  groupOptionText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  groupOptionTextActive: {
    color: colors.primaryContrast,
    fontWeight: '600',
  },
  nutrientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  nutrientItem: {
    flex: 1,
    minWidth: 100,
  },
  levelRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: spacing.sm,
  },
  levelBtn: {
    flex: 1,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
  },
  levelBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  levelBtnText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  levelBtnTextActive: {
    color: colors.primaryContrast,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  switchBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  switchBtnInline: { alignSelf: 'flex-start', marginBottom: spacing.md },
  switchBtnOn: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  switchText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  switchTextOn: {
    color: colors.primary,
    fontWeight: '600',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cancelBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  saveBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.primary,
    minWidth: 80,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    fontSize: 14,
    color: colors.primaryContrast,
    fontWeight: '700',
  },
  groupSection: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
    gap: spacing.sm,
  },
  groupTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  groupCount: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
  },
  foodInfo: { flex: 1 },
  foodName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  foodServing: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  foodMacros: {
    fontSize: 11,
    color: colors.textTertiary || colors.textSecondary,
    marginTop: 4,
  },
  foodActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginLeft: spacing.sm,
  },
  editBtn: {
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.surfaceSecondary,
  },
  deleteBtn: {
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.danger + '15',
  },
});
