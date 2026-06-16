import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Platform, KeyboardAvoidingView,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontFamilies, fontSizes } from '../../src/presentation/theme';
import { getDatabase } from '../../src/data/database';
import TherapeuticFood from '../../src/data/models/TherapeuticFood';

export default function TherapeuticFoodsDashboard() {
  const router = useRouter();
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [potassium, setPotassium] = useState('');
  const [phosphorus, setPhosphorus] = useState('');
  const [sodium, setSodium] = useState('');
  const [calcium, setCalcium] = useState('');
  const [glycemicIndex, setGlycemicIndex] = useState('');
  const [purineLevel, setPurineLevel] = useState('');
  const [allergenTagsInput, setAllergenTagsInput] = useState('');
  const [therapeuticBenefitsInput, setTherapeuticBenefitsInput] = useState('');
  const [foods, setFoods] = useState<TherapeuticFood[]>([]);
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
      const data = await db.get<TherapeuticFood>('therapeutic_foods').query().fetch();
      setFoods(data);
    } catch (err) {
      console.error(err);
      Alert.alert('خطأ', 'فشل في تحميل الأطعمة العلاجية');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadFoods();
    return () => { cancelled = true; };
  }, [loadFoods]);

  const resetForm = () => {
    setSelectedFoodId(null);
    setNameAr('');
    setNameEn('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setPotassium('');
    setPhosphorus('');
    setSodium('');
    setCalcium('');
    setGlycemicIndex('');
    setPurineLevel('');
    setAllergenTagsInput('');
    setTherapeuticBenefitsInput('');
  };

  const handleEditFood = (food: TherapeuticFood) => {
    setSelectedFoodId(food.id);
    setNameAr(food.nameAr);
    setNameEn(food.nameEn);
    setCalories(String(food.caloriesPer100g));
    setProtein(String(food.proteinPer100g));
    setCarbs(String(food.carbsPer100g));
    setFat(String(food.fatPer100g));
    setPotassium(String(food.potassiumMg));
    setPhosphorus(String(food.phosphorusMg));
    setSodium(String(food.sodiumMg));
    setCalcium(String(food.calciumMg));
    setGlycemicIndex(String(food.glycemicIndex));
    setPurineLevel(food.purineLevel);
    setAllergenTagsInput(food.allergenTags.join(', '));
    const benefits = food.therapeuticBenefits;
    setTherapeuticBenefitsInput((benefits as Record<string, string>).description || '');
  };

  const handleDeleteFood = (food: TherapeuticFood) => {
    Alert.alert(
      'تأكيد الحذف',
      `هل تريد حذف "${food.nameAr}" نهائياً؟`,
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
              await loadFoods();
            } catch (err: any) {
              Alert.alert('خطأ', err.message || 'فشل في حذف الطعام');
            }
          },
        },
      ]
    );
  };

  const handleSaveFood = async () => {
    if (!nameAr.trim() || !nameEn.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم الطعام بالعربية والإنجليزية');
      return;
    }

    setSaving(true);
    try {
      const db = await getDatabase();
      const allergenArray = allergenTagsInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      const benefitsObj = therapeuticBenefitsInput.trim()
        ? { description: therapeuticBenefitsInput.trim() }
        : {};

      await db.write(async () => {
        const collection = db.get<TherapeuticFood>('therapeutic_foods');
        if (selectedFoodId) {
          const existing = await collection.find(selectedFoodId);
          await existing.update(record => {
            record.nameAr = nameAr.trim();
            record.nameEn = nameEn.trim();
            record.caloriesPer100g = parseFloat(calories) || 0;
            record.proteinPer100g = parseFloat(protein) || 0;
            record.carbsPer100g = parseFloat(carbs) || 0;
            record.fatPer100g = parseFloat(fat) || 0;
            record.potassiumMg = parseFloat(potassium) || 0;
            record.phosphorusMg = parseFloat(phosphorus) || 0;
            record.sodiumMg = parseFloat(sodium) || 0;
            record.calciumMg = parseFloat(calcium) || 0;
            record.glycemicIndex = parseFloat(glycemicIndex) || 0;
            record.purineLevel = purineLevel || '';
            record.allergenTagsRaw = JSON.stringify(allergenArray);
            record.therapeuticBenefitsRaw = JSON.stringify(benefitsObj);
          });
        } else {
          await collection.create(record => {
            record.nameAr = nameAr.trim();
            record.nameEn = nameEn.trim();
            record.caloriesPer100g = parseFloat(calories) || 0;
            record.proteinPer100g = parseFloat(protein) || 0;
            record.carbsPer100g = parseFloat(carbs) || 0;
            record.fatPer100g = parseFloat(fat) || 0;
            record.potassiumMg = parseFloat(potassium) || 0;
            record.phosphorusMg = parseFloat(phosphorus) || 0;
            record.sodiumMg = parseFloat(sodium) || 0;
            record.calciumMg = parseFloat(calcium) || 0;
            record.glycemicIndex = parseFloat(glycemicIndex) || 0;
            record.purineLevel = purineLevel || '';
            record.allergenTagsRaw = JSON.stringify(allergenArray);
            record.therapeuticBenefitsRaw = JSON.stringify(benefitsObj);
          });
        }
      });

      Alert.alert(
        'نجاح',
        selectedFoodId ? 'تم تحديث الطعام بنجاح' : 'تم إضافة الطعام بنجاح'
      );
      resetForm();
      await loadFoods();
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'فشل في حفظ الطعام');
    } finally {
      setSaving(false);
    }
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
        <Text style={styles.headerTitle}>إدارة الأطعمة العلاجية</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {selectedFoodId ? 'تعديل طعام علاجي' : 'إضافة طعام علاجي جديد'}
            </Text>
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>الاسم (عربي)</Text>
              <TextInput
                style={styles.formInput}
                value={nameAr}
                onChangeText={setNameAr}
                placeholder="مثال: تفاح"
                placeholderTextColor={colors.textDisabled}
                textAlign="right"
              />
            </View>
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>الاسم (إنجليزي)</Text>
              <TextInput
                style={styles.formInput}
                value={nameEn}
                onChangeText={setNameEn}
                placeholder="e.g. Apple"
                placeholderTextColor={colors.textDisabled}
                textAlign="left"
              />
            </View>
            <View style={styles.numericGrid}>
              {[
                { label: 'السعرات', value: calories, setter: setCalories },
                { label: 'البروتين (غ)', value: protein, setter: setProtein },
                { label: 'الكربوهيدرات (غ)', value: carbs, setter: setCarbs },
                { label: 'الدهون (غ)', value: fat, setter: setFat },
              ].map(field => (
                <View key={field.label} style={styles.numericField}>
                  <Text style={styles.formLabel}>{field.label}</Text>
                  <TextInput
                    style={styles.formInput}
                    value={field.value}
                    onChangeText={field.setter}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textDisabled}
                    textAlign="right"
                  />
                </View>
              ))}
            </View>
            <View style={styles.numericGrid}>
              {[
                { label: 'البوتاسيوم (ملغ)', value: potassium, setter: setPotassium },
                { label: 'الفوسفور (ملغ)', value: phosphorus, setter: setPhosphorus },
                { label: 'الصوديوم (ملغ)', value: sodium, setter: setSodium },
                { label: 'الكالسيوم (ملغ)', value: calcium, setter: setCalcium },
              ].map(field => (
                <View key={field.label} style={styles.numericField}>
                  <Text style={styles.formLabel}>{field.label}</Text>
                  <TextInput
                    style={styles.formInput}
                    value={field.value}
                    onChangeText={field.setter}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textDisabled}
                    textAlign="right"
                  />
                </View>
              ))}
            </View>
            <View style={styles.numericGrid}>
              <View style={styles.numericField}>
                <Text style={styles.formLabel}>مؤشر السكري (GI)</Text>
                <TextInput
                  style={styles.formInput}
                  value={glycemicIndex}
                  onChangeText={setGlycemicIndex}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textDisabled}
                  textAlign="right"
                />
              </View>
              <View style={styles.numericField}>
                <Text style={styles.formLabel}>مستوى البيورين</Text>
                <TextInput
                  style={styles.formInput}
                  value={purineLevel}
                  onChangeText={setPurineLevel}
                  placeholder="high / medium / low"
                  placeholderTextColor={colors.textDisabled}
                  textAlign="right"
                />
              </View>
            </View>
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>مسببات الحساسية (مفصولة بفاصلة)</Text>
              <TextInput
                style={styles.formInput}
                value={allergenTagsInput}
                onChangeText={setAllergenTagsInput}
                placeholder="gluten, lactose, soy"
                placeholderTextColor={colors.textDisabled}
                textAlign="right"
              />
            </View>
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>الفوائد العلاجية</Text>
              <TextInput
                style={[styles.formInput, styles.multilineInput]}
                value={therapeuticBenefitsInput}
                onChangeText={setTherapeuticBenefitsInput}
                placeholder="وصف الفوائد العلاجية..."
                placeholderTextColor={colors.textDisabled}
                textAlign="right"
                multiline
                numberOfLines={3}
              />
            </View>
            <View style={styles.formActions}>
              {selectedFoodId && (
                <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
                  <Text style={styles.cancelButtonText}>إلغاء</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.disabledButton]}
                onPress={handleSaveFood}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.primaryContrast} />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {selectedFoodId ? 'تحديث' : 'إضافة'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>قائمة الأطعمة العلاجية</Text>
            {foods.length === 0 ? (
              <Text style={styles.emptyText}>
                لا توجد أطعمة علاجية مسجلة حالياً. أضف طعاماً جديداً باستخدام النموذج أعلاه.
              </Text>
            ) : (
              foods.map(food => (
                <View key={food.id} style={styles.foodRow}>
                  <View style={styles.foodInfo}>
                    <Text style={styles.foodName}>{food.nameAr}</Text>
                    <Text style={styles.foodNameEn}>{food.nameEn}</Text>
                    <Text style={styles.foodMeta}>
                      {food.caloriesPer100g} kcal | بروتين {food.proteinPer100g}g | كارب {food.carbsPer100g}g | دهون {food.fatPer100g}g
                    </Text>
                  </View>
                  <View style={styles.foodActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEditFood(food)}
                    >
                      <Ionicons name="create-outline" size={18} color={colors.info} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteFood(food)}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
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
  body: {
    flex: 1,
  } as const,
  bodyContent: {
    padding: spacing.md,
  } as const,
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  } as const,
  cardTitle: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'right',
    fontFamily: fontFamilies?.medium || 'System',
  } as const,
  formRow: {
    marginBottom: spacing.md,
  } as const,
  formLabel: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textAlign: 'right',
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  formInput: {
    height: 44,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    fontSize: fontSizes.md,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  multilineInput: {
    height: 80,
    paddingTop: spacing.sm,
    textAlignVertical: 'top',
  } as const,
  numericGrid: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    marginBottom: spacing.md,
  } as const,
  numericField: {
    flex: 1,
  } as const,
  formActions: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    marginTop: spacing.sm,
  } as const,
  saveButton: {
    height: 44,
    flex: 1,
    borderRadius: 8,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  } as const,
  disabledButton: {
    opacity: 0.6,
  } as const,
  saveButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.primaryContrast,
    fontFamily: fontFamilies?.medium || 'System',
  } as const,
  cancelButton: {
    height: 44,
    flex: 1,
    borderRadius: 8,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  } as const,
  cancelButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: fontFamilies?.medium || 'System',
  } as const,
  emptyText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: fontFamilies?.regular || 'System',
    paddingVertical: spacing.lg,
  } as const,
  foodRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
  } as const,
  foodInfo: {
    flex: 1,
    marginLeft: spacing.md,
  } as const,
  foodName: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'right',
    fontFamily: fontFamilies?.medium || 'System',
  } as const,
  foodNameEn: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'right',
    fontFamily: fontFamilies?.regular || 'System',
    marginTop: 2,
  } as const,
  foodMeta: {
    fontSize: fontSizes.xs,
    color: colors.textDisabled,
    textAlign: 'right',
    marginTop: 4,
    fontFamily: fontFamilies?.regular || 'System',
  } as const,
  foodActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  } as const,
  editButton: {
    padding: spacing.sm,
  } as const,
  deleteButton: {
    padding: spacing.sm,
  } as const,
};
