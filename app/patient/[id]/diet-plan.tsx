import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, safeHeaderPaddingTop } from '../../../src/presentation/theme';
import ArabicText from '../../../src/presentation/components/ArabicText';
import TextInputField from '../../../src/presentation/components/TextInputField';
import DropdownField from '../../../src/presentation/components/DropdownField';
import DatePickerField from '../../../src/presentation/components/DatePickerField';
import Button from '../../../src/presentation/components/Button';
import { usePatientStore } from '../../../src/presentation/stores/patientStore';
import { useToastStore } from '../../../src/presentation/stores/toastStore';
import { getDatabase } from '../../../src/data/database';
import { Q } from '@nozbe/watermelondb';
import { Patient } from '../../../src/domain/entities/Patient';

interface SelectedFood {
  id: string;
  nameAr: string;
  nameEn?: string;
  category: string;
  servingSize: string;
  calories: number;
  carbohydrates: number;
  protein: number;
  fat: number;
  potassium?: number;
  sodium?: number;
  quantity: number; // exchange multiplier
}

interface DailyMeals {
  breakfast: SelectedFood[];
  lunch: SelectedFood[];
  dinner: SelectedFood[];
  snacks: SelectedFood[];
}

const CATEGORIES = [
  { label: 'النشويات (Starches)', value: 'النشويات' },
  { label: 'اللحوم وبدائلها (Meats)', value: 'اللحوم وبدائلها' },
  { label: 'الخضار (Vegetables)', value: 'الخضار' },
  { label: 'الفواكه (Fruits)', value: 'الفواكه' },
  { label: 'الحليب ومنتجاته (Dairy)', value: 'الحليب ومنتجاته' },
  { label: 'الدهون (Fats)', value: 'الدهون' },
  { label: 'أطباق تقليدية (Traditional)', value: 'أطباق تقليدية' },
];

export default function DietPlanScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const showToast = useToastStore((s) => s.showToast);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Meal lists
  const [meals, setMeals] = useState<DailyMeals>({
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: [],
  });

  // Food catalog & search
  const [foodCatalog, setFoodCatalog] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');

  // Modals visibility
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [activeMealType, setActiveMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snacks'>('breakfast');
  const [showCustomFoodModal, setShowCustomFoodModal] = useState(false);

  // Custom Food Form state
  const [customFood, setCustomFood] = useState({
    nameAr: '',
    nameEn: '',
    category: 'النشويات',
    servingSize: 'حصّة واحدة',
    calories: '',
    carbohydrates: '',
    protein: '',
    fat: '',
    potassium: '',
    sodium: '',
  });

  // KAU targets
  const [targets, setTargets] = useState({
    calories: 2000,
    carbs: 250,
    protein: 75,
    fat: 65,
  });

  useEffect(() => {
    loadData();
  }, [patientId, selectedDate]);

  async function loadData() {
    try {
      setIsLoading(true);
      let db;
      try {
        db = await getDatabase();
      } catch {
        showToast('تعذر الاتصال بقاعدة البيانات', 'error');
        return;
      }
      if (!db) return;

      // 1. Load patient details
      const { GetPatientUseCase } = await import('../../../src/domain/use-cases/GetPatientUseCase');
      const patientUc = new GetPatientUseCase();
      const p = await patientUc.execute(patientId);
      setPatient(p);

      // 2. Fetch KAU targets from calculations
      const calcResults = (await db.get('calculations')
        .query(Q.where('patient_id', patientId))
        .fetch()) as any[];

      let tee = 2000;
      let targetProtein = 75;
      let targetCarbs = 250;
      let targetFat = 65;

      const energyCalc = calcResults.find((c: any) => c.calculationType === 'total_energy');
      if (energyCalc) {
        tee = energyCalc.overrideValue ?? energyCalc.resultValue;
      }

      const macrosCalc = calcResults.find((c: any) => c.calculationType === 'macros');
      if (macrosCalc) {
        const inputs = JSON.parse(macrosCalc.inputValues || '{}');
        if (inputs.weightKg && tee) {
          const { calculateMacros } = await import('../../../src/domain/calculators/MacronutrientCalculator');
          const macros = calculateMacros(tee, inputs.weightKg);
          targetProtein = macros.proteinGrams;
          targetCarbs = macros.carbsGrams;
          targetFat = macros.fatGrams;
        }
      }

      setTargets({
        calories: Math.round(tee),
        carbs: Math.round(targetCarbs),
        protein: Math.round(targetProtein),
        fat: Math.round(targetFat),
      });

      // 3. Load catalog food items
      await loadFoodCatalog(db);

      // 4. Load saved meal plan for the selected date
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);

      const savedPlans = await db.get('meal_plans')
        .query(
          Q.where('patient_id', patientId),
          Q.where('plan_date', startOfDay.getTime())
        )
        .fetch();

      const newMeals: DailyMeals = {
        breakfast: [],
        lunch: [],
        dinner: [],
        snacks: [],
      };

      savedPlans.forEach((plan: any) => {
        const type = plan.mealType as keyof DailyMeals;
        if (newMeals[type]) {
          try {
            newMeals[type] = JSON.parse(plan.foodDetails || '[]');
          } catch (e) {
            console.error('Error parsing food details:', e);
          }
        }
      });

      setMeals(newMeals);
    } catch (error) {
      console.error('Error loading diet plan data:', error);
      showToast('فشل في تحميل بيانات البدائل الغذائية', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadFoodCatalog(db: any) {
    if (!db) {
      showToast('قاعدة البيانات غير متاحة', 'error');
      return;
    }
    const collection = db.get('food_items');
    if (!collection) return;
    const items = await collection.query().fetch();
    setFoodCatalog(items);
  }

  // Pre-populate template helper
  const loadClinicalTemplate = useCallback(async (templateType: 'diabetic_renal' | 'traditional' | 'low_sodium') => {
    try {
      let db;
      try {
        db = await getDatabase();
      } catch {
        showToast('تعذر الاتصال بقاعدة البيانات', 'error');
        return;
      }
      if (!db) return;
      const foodCollection = db.get('food_items');
      if (!foodCollection) return;
      const allFoods = await foodCollection.query().fetch();

      const findFood = (nameAr: string) => {
        return allFoods.find((f: any) => f.nameAr.includes(nameAr) || nameAr.includes(f.nameAr));
      };

      const mapModelToSelectedFood = (food: any, quantity: number): SelectedFood => ({
        id: food.id,
        nameAr: food.nameAr || food.name_ar,
        nameEn: food.nameEn || food.name_en,
        category: food.category,
        servingSize: food.servingSize || food.serving_size,
        calories: food.calories,
        carbohydrates: food.carbohydrates,
        protein: food.protein,
        fat: food.fat,
        potassium: food.potassium ?? undefined,
        sodium: food.sodium ?? undefined,
        quantity,
      });

      let templateMeals: DailyMeals = {
        breakfast: [],
        lunch: [],
        dinner: [],
        snacks: [],
      };

      if (templateType === 'diabetic_renal') {
        // Starches/Protein, low potassium & sodium
        const bread = findFood('خبز بر');
        const egg = findFood('بيض مسلوق');
        const cucumber = findFood('خيار طازج');
        const apple = findFood('تفاح طازج');
        const rice = findFood('أرز مطبوخ');
        const chicken = findFood('صدر دجاج مطبوخ');
        const salad = findFood('سلطة خضراء');
        const cheese = findFood('جبنة بيضاء');

        if (bread) templateMeals.breakfast.push(mapModelToSelectedFood(bread, 1.0));
        if (egg) templateMeals.breakfast.push(mapModelToSelectedFood(egg, 1.0));
        if (cucumber) templateMeals.breakfast.push(mapModelToSelectedFood(cucumber, 0.5));

        if (rice) templateMeals.lunch.push(mapModelToSelectedFood(rice, 1.5));
        if (chicken) templateMeals.lunch.push(mapModelToSelectedFood(chicken, 2.0));
        if (salad) templateMeals.lunch.push(mapModelToSelectedFood(salad, 1.0));

        if (bread) templateMeals.dinner.push(mapModelToSelectedFood(bread, 1.0));
        if (cheese) templateMeals.dinner.push(mapModelToSelectedFood(cheese, 1.0));

        if (apple) templateMeals.snacks.push(mapModelToSelectedFood(apple, 1.0));

      } else if (templateType === 'traditional') {
        // Yemeni Arabic rich proteins
        const malooj = findFood('خبز ملوج');
        const egg = findFood('بيض مسلوق');
        const haqeen = findFood('حقين يمني');
        const fahsah = findFood('فحسة لحم');
        const shafoot = findFood('شفوت يمني');
        const saltah = findFood('سلتة يمنية');
        const roti = findFood('روتي يمني');
        const dates = findFood('تمر رطب');

        if (malooj) templateMeals.breakfast.push(mapModelToSelectedFood(malooj, 0.5));
        if (egg) templateMeals.breakfast.push(mapModelToSelectedFood(egg, 2.0));
        if (haqeen) templateMeals.breakfast.push(mapModelToSelectedFood(haqeen, 1.0));

        if (fahsah) templateMeals.lunch.push(mapModelToSelectedFood(fahsah, 1.0));
        if (malooj) templateMeals.lunch.push(mapModelToSelectedFood(malooj, 0.5));
        if (shafoot) templateMeals.lunch.push(mapModelToSelectedFood(shafoot, 1.0));

        if (saltah) templateMeals.dinner.push(mapModelToSelectedFood(saltah, 1.0));
        if (roti) templateMeals.dinner.push(mapModelToSelectedFood(roti, 1.0));

        if (dates) templateMeals.snacks.push(mapModelToSelectedFood(dates, 2.0)); // 6 dates

      } else if (templateType === 'low_sodium') {
        // Standard cardioprotective
        const bread = findFood('خبز بر');
        const egg = findFood('بيض مسلوق');
        const orange = findFood('برتقال طازج');
        const fish = findFood('سمك طازج');
        const rice = findFood('أرز مطبوخ');
        const veg = findFood('خضار مشكلة');
        const cheese = findFood('جبنة بيضاء');
        const cucumber = findFood('خيار طازج');
        const apple = findFood('تفاح طازج');

        if (bread) templateMeals.breakfast.push(mapModelToSelectedFood(bread, 2.0));
        if (egg) templateMeals.breakfast.push(mapModelToSelectedFood(egg, 1.0));
        if (orange) templateMeals.breakfast.push(mapModelToSelectedFood(orange, 1.0));

        if (fish) templateMeals.lunch.push(mapModelToSelectedFood(fish, 3.0));
        if (rice) templateMeals.lunch.push(mapModelToSelectedFood(rice, 2.0));
        if (veg) templateMeals.lunch.push(mapModelToSelectedFood(veg, 1.0));

        if (cheese) templateMeals.dinner.push(mapModelToSelectedFood(cheese, 1.0));
        if (bread) templateMeals.dinner.push(mapModelToSelectedFood(bread, 1.0));
        if (cucumber) templateMeals.dinner.push(mapModelToSelectedFood(cucumber, 1.0));

        if (apple) templateMeals.snacks.push(mapModelToSelectedFood(apple, 1.0));
      }

      setMeals(templateMeals);
      showToast('تم تحميل النموذج الغذائي بنجاح', 'success');
    } catch (e) {
      console.error(e);
      showToast('فشل في تحميل النموذج الغذائي الكلاسيكي', 'error');
    }
  }, [showToast]);

  // Real-time calculated totals
  const dailyTotals = useMemo(() => {
    let kcal = 0;
    let carbs = 0;
    let protein = 0;
    let fat = 0;
    let potassium = 0;
    let sodium = 0;

    const sumMeal = (foodList: SelectedFood[]) => {
      foodList.forEach((f) => {
        const mult = f.quantity || 1;
        kcal += f.calories * mult;
        carbs += f.carbohydrates * mult;
        protein += f.protein * mult;
        fat += f.fat * mult;
        potassium += (f.potassium || 0) * mult;
        sodium += (f.sodium || 0) * mult;
      });
    };

    sumMeal(meals.breakfast);
    sumMeal(meals.lunch);
    sumMeal(meals.dinner);
    sumMeal(meals.snacks);

    return {
      calories: Math.round(kcal),
      carbs: Math.round(carbs),
      protein: Math.round(protein),
      fat: Math.round(fat),
      potassium: Math.round(potassium),
      sodium: Math.round(sodium),
    };
  }, [meals]);

  const handleSavePlan = useCallback(async () => {
    try {
      setIsSaving(true);
      const db = await getDatabase();
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);

      await db.write(async () => {
        const mealTypes: ('breakfast' | 'lunch' | 'dinner' | 'snacks')[] = ['breakfast', 'lunch', 'dinner', 'snacks'];

        for (const type of mealTypes) {
          const mealFoods = meals[type];

          // Compute meal-level totals
          let mKcal = 0, mCarbs = 0, mProtein = 0, mFat = 0;
          mealFoods.forEach((f) => {
            const mult = f.quantity || 1;
            mKcal += f.calories * mult;
            mCarbs += f.carbohydrates * mult;
            mProtein += f.protein * mult;
            mFat += f.fat * mult;
          });

          const existingPlans = await db.get('meal_plans')
            .query(
              Q.where('patient_id', patientId),
              Q.where('plan_date', startOfDay.getTime()),
              Q.where('meal_type', type)
            ).fetch();

          if (existingPlans.length > 0) {
            await existingPlans[0].update((record: any) => {
              record.foodDetails = JSON.stringify(mealFoods);
              record.totalCalories = Math.round(mKcal);
              record.totalCarbs = Math.round(mCarbs);
              record.totalProtein = Math.round(mProtein);
              record.totalFat = Math.round(mFat);
            });
          } else {
            await db.get('meal_plans').create((record: any) => {
              record.patientId = patientId;
              record.planDate = startOfDay.getTime();
              record.mealType = type;
              record.foodDetails = JSON.stringify(mealFoods);
              record.totalCalories = Math.round(mKcal);
              record.totalCarbs = Math.round(mCarbs);
              record.totalProtein = Math.round(mProtein);
              record.totalFat = Math.round(mFat);
            });
          }
        }
      });

      showToast('تم حفظ خطة الوجبات لليوم المختار بنجاح', 'success');
      router.replace({ pathname: "/patient/[id]", params: { id: patientId } });
    } catch (error) {
      console.error('Error saving meal plan:', error);
      showToast('فشل في حفظ خطة التغذية والبدائل', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [patientId, selectedDate, meals, showToast]);

  const updateMultiplier = (mealType: keyof DailyMeals, foodId: string, value: string) => {
    let num = parseFloat(value);
    if (isNaN(num) || num < 0) num = 0;

    setMeals((prev) => {
      const updated = prev[mealType].map((f) => {
        if (f.id === foodId) {
          return { ...f, quantity: num };
        }
        return f;
      });
      return { ...prev, [mealType]: updated };
    });
  };

  const removeFoodFromMeal = (mealType: keyof DailyMeals, foodId: string) => {
    setMeals((prev) => {
      const filtered = prev[mealType].filter((f) => f.id !== foodId);
      return { ...prev, [mealType]: filtered };
    });
  };

  const addFoodToMeal = (mealType: keyof DailyMeals, food: any) => {
    const selected: SelectedFood = {
      id: food.id,
      nameAr: food.nameAr || food.name_ar,
      nameEn: food.nameEn || food.name_en,
      category: food.category,
      servingSize: food.servingSize || food.serving_size,
      calories: food.calories,
      carbohydrates: food.carbohydrates,
      protein: food.protein,
      fat: food.fat,
      potassium: food.potassium ?? undefined,
      sodium: food.sodium ?? undefined,
      quantity: 1.0,
    };

    setMeals((prev) => {
      // Avoid duplicate food item addition in the same meal for clean layout
      const exists = prev[mealType].some((f) => f.id === food.id);
      if (exists) {
        showToast('هذا البديل مضاف مسبقاً في هذه الوجبة', 'info');
        return prev;
      }
      return { ...prev, [mealType]: [...prev[mealType], selected] };
    });

    setShowAddFoodModal(false);
    showToast(`تمت إضافة ${selected.nameAr} بنجاح`, 'success');
  };

  const filteredFoods = useMemo(() => {
    return foodCatalog.filter((food) => {
      const matchQuery =
        food.nameAr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        food.nameEn?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'الكل' || food.category === selectedCategory;
      return matchQuery && matchCat;
    });
  }, [foodCatalog, searchQuery, selectedCategory]);

  const handleCreateCustomFood = async () => {
    const { nameAr, category, servingSize, calories, carbohydrates, protein, fat, potassium, sodium } = customFood;

    if (!nameAr.trim()) {
      Alert.alert('خطأ في التحقق', 'اسم الطعام بالعربية مطلوب');
      return;
    }
    if (!servingSize.trim()) {
      Alert.alert('خطأ في التحقق', 'حجم الحصة مطلوب');
      return;
    }

    const kcalNum = parseFloat(calories);
    const carbsNum = parseFloat(carbohydrates);
    const protNum = parseFloat(protein);
    const fatNum = parseFloat(fat);

    if (isNaN(kcalNum) || kcalNum < 0 || isNaN(carbsNum) || carbsNum < 0 || isNaN(protNum) || protNum < 0 || isNaN(fatNum) || fatNum < 0) {
      Alert.alert('خطأ في التحقق', 'يرجى ملء جميع القيم الغذائية الكبرى بأرقام صحيحة غير سالبة');
      return;
    }

    try {
      let db;
      try {
        db = await getDatabase();
      } catch {
        Alert.alert('خطأ', 'تعذر الاتصال بقاعدة البيانات');
        return;
      }
      if (!db) return;
      let createdRecord: any;

      await db.write(async () => {
        createdRecord = await db.get('food_items').create((record: any) => {
          record.nameAr = nameAr.trim();
          record.nameEn = customFood.nameEn.trim() || null;
          record.category = category;
          record.servingSize = servingSize.trim();
          record.calories = kcalNum;
          record.carbohydrates = carbsNum;
          record.protein = protNum;
          record.fat = fatNum;
          record.potassium = potassium ? parseFloat(potassium) : null;
          record.sodium = sodium ? parseFloat(sodium) : null;
        });
      });

      showToast('تم حفظ البديل الغذائي المخصص بنجاح', 'success');
      setShowCustomFoodModal(false);

      // Reset form
      setCustomFood({
        nameAr: '',
        nameEn: '',
        category: 'النشويات',
        servingSize: 'حصّة واحدة',
        calories: '',
        carbohydrates: '',
        protein: '',
        fat: '',
        potassium: '',
        sodium: '',
      });

      // Reload list and auto add
      const foodItemsCollection = db.get('food_items');
      if (foodItemsCollection) {
        const updatedCatalog = await foodItemsCollection.query().fetch();
        setFoodCatalog(updatedCatalog);
      }

      // Auto add to the active meal
      addFoodToMeal(activeMealType, createdRecord);

    } catch (e) {
      console.error(e);
      Alert.alert('خطأ في النظام', 'فشل في حفظ البديل المخصص بقاعدة البيانات');
    }
  };

  const getStatusPercentage = (current: number, target: number) => {
    if (!target) return 0;
    return Math.min(Math.round((current / target) * 100), 100);
  };

  const getBarColor = (current: number, target: number) => {
    const ratio = current / target;
    if (ratio < 0.85) return colors.warning;
    if (ratio > 1.15) return colors.danger;
    return colors.success;
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ArabicText style={styles.loadingText}>جاري تحميل البدائل والملفات الغذائية...</ArabicText>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-forward" size={24} color={colors.primaryContrast} />
            </TouchableOpacity>
            <ArabicText bold style={styles.headerTitle}>تخطيط الوجبات والبدائل الغذائية</ArabicText>
            {patient && <ArabicText style={styles.headerSubtitle}>{patient.fullName} | {patient.fileNumber}</ArabicText>}
          </View>

          {/* Configuration Card: Date & Clinical Templates */}
          <View style={styles.section}>
            <DatePickerField
              label="تاريخ خطة التغذية"
              value={selectedDate}
              onChange={(d) => setSelectedDate(d)}
              required
            />

            <ArabicText bold style={styles.subheading}>نماذج الوجبات السريرية (KAU Templates)</ArabicText>
            <View style={styles.templateGrid}>
              <TouchableOpacity
                style={[styles.templateButton, { borderColor: '#E74C3C' }]}
                onPress={() => loadClinicalTemplate('diabetic_renal')}
              >
                <Ionicons name="medical-outline" size={16} color="#E74C3C" />
                <ArabicText style={styles.templateButtonText}>مرضى السكري والكلى</ArabicText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.templateButton, { borderColor: '#2E7D32' }]}
                onPress={() => loadClinicalTemplate('traditional')}
              >
                <Ionicons name="restaurant-outline" size={16} color="#2E7D32" />
                <ArabicText style={styles.templateButtonText}>أطباق يمنية/عربية تقليدية</ArabicText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.templateButton, { borderColor: '#2980B9' }]}
                onPress={() => loadClinicalTemplate('low_sodium')}
              >
                <Ionicons name="heart-outline" size={16} color="#2980B9" />
                <ArabicText style={styles.templateButtonText}>منخفض الصوديوم والقلب</ArabicText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Daily Summary Comparison vs KAU targets */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="stats-chart" size={20} color={colors.primary} />
              <ArabicText bold style={styles.sectionTitle}>الملخص اليومي المقارن بمستهدفات البرتوكولات</ArabicText>
            </View>

            <View style={styles.macroDashboard}>
              {/* Calories comparison */}
              <View style={styles.dashboardMetric}>
                <View style={styles.metricLabelRow}>
                  <ArabicText style={styles.metricLabelText}>الطاقة اليومية</ArabicText>
                  <ArabicText bold style={styles.metricValueText}>
                    {dailyTotals.calories} / {targets.calories} سعرة ({getStatusPercentage(dailyTotals.calories, targets.calories)}%)
                  </ArabicText>
                </View>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${getStatusPercentage(dailyTotals.calories, targets.calories)}%`,
                        backgroundColor: getBarColor(dailyTotals.calories, targets.calories),
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Protein comparison */}
              <View style={styles.dashboardMetric}>
                <View style={styles.metricLabelRow}>
                  <ArabicText style={styles.metricLabelText}>البروتين</ArabicText>
                  <ArabicText bold style={styles.metricValueText}>
                    {dailyTotals.protein} / {targets.protein} غم ({getStatusPercentage(dailyTotals.protein, targets.protein)}%)
                  </ArabicText>
                </View>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${getStatusPercentage(dailyTotals.protein, targets.protein)}%`,
                        backgroundColor: getBarColor(dailyTotals.protein, targets.protein),
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Carbs & Fat grid info */}
              <View style={styles.gridStats}>
                <View style={styles.gridStatBox}>
                  <ArabicText style={styles.gridStatLabel}>الكربوهيدرات المخططة</ArabicText>
                  <ArabicText bold style={styles.gridStatValue}>{dailyTotals.carbs} غم (الهدف: {targets.carbs} غم)</ArabicText>
                </View>
                <View style={styles.gridStatBox}>
                  <ArabicText style={styles.gridStatLabel}>الدهون المخططة</ArabicText>
                  <ArabicText bold style={styles.gridStatValue}>{dailyTotals.fat} غم (الهدف: {targets.fat} غم)</ArabicText>
                </View>
              </View>

              {/* Electrolytes stats */}
              <View style={styles.gridStats}>
                <View style={[styles.gridStatBox, { backgroundColor: dailyTotals.potassium > 2000 ? '#FFF3CD' : colors.surfaceSecondary }]}>
                  <ArabicText style={styles.gridStatLabel}>البوتاسيوم الكلي</ArabicText>
                  <ArabicText bold style={[styles.gridStatValue, dailyTotals.potassium > 2000 ? { color: '#856404' } : undefined]}>
                    {dailyTotals.potassium} ملغم
                  </ArabicText>
                </View>
                <View style={[styles.gridStatBox, { backgroundColor: dailyTotals.sodium > 2300 ? '#F8D7DA' : colors.surfaceSecondary }]}>
                  <ArabicText style={styles.gridStatLabel}>الصوديوم الكلي</ArabicText>
                  <ArabicText bold style={[styles.gridStatValue, dailyTotals.sodium > 2300 ? { color: '#721C24' } : undefined]}>
                    {dailyTotals.sodium} ملغم
                  </ArabicText>
                </View>
              </View>
            </View>

            {dailyTotals.sodium > 2300 && (
              <View style={[styles.alertBanner, { backgroundColor: '#F8D7DA', borderColor: '#F5C6CB' }]}>
                <Ionicons name="warning-outline" size={18} color="#721C24" />
                <ArabicText style={[styles.alertText, { color: '#721C24' }]}>
                  تنبيه: محتوى الصوديوم اليومي يتجاوز 2300 ملغم. يرجى مراقبة مستويات ضغط الدم والبدائل المقترحة.
                </ArabicText>
              </View>
            )}

            {dailyTotals.potassium > 2000 && patient?.primaryDiagnosis?.toLowerCase().includes('renal') && (
              <View style={[styles.alertBanner, { backgroundColor: '#FFF3CD', borderColor: '#FFEBAA' }]}>
                <Ionicons name="warning-outline" size={18} color="#856404" />
                <ArabicText style={[styles.alertText, { color: '#856404' }]}>
                  تنبيه قصور كلوي: المريض يعاني من مشاكل كلوية ويتجاوز البوتاسيوم المقترح 2000 ملغم. يرجى تقليل حصص التمور والأطباق الغنية بالبوتاسيوم.
                </ArabicText>
              </View>
            )}
          </View>

          {/* Dynamic Meal Matrix Grid */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="grid" size={20} color={colors.primary} />
              <ArabicText bold style={styles.sectionTitle}>مصفوفة تخطيط وجبات اليوم</ArabicText>
            </View>

            {/* Breakfast Section */}
            <MealCard
              title="وجبة الفطور (Breakfast)"
              icon="sunny"
              foods={meals.breakfast}
              onAddFood={() => {
                setActiveMealType('breakfast');
                setShowAddFoodModal(true);
              }}
              onRemoveFood={(id) => removeFoodFromMeal('breakfast', id)}
              onChangeMultiplier={(id, val) => updateMultiplier('breakfast', id, val)}
            />

            {/* Lunch Section */}
            <MealCard
              title="وجبة الغداء (Lunch)"
              icon="restaurant"
              foods={meals.lunch}
              onAddFood={() => {
                setActiveMealType('lunch');
                setShowAddFoodModal(true);
              }}
              onRemoveFood={(id) => removeFoodFromMeal('lunch', id)}
              onChangeMultiplier={(id, val) => updateMultiplier('lunch', id, val)}
            />

            {/* Dinner Section */}
            <MealCard
              title="وجبة العشاء (Dinner)"
              icon="moon"
              foods={meals.dinner}
              onAddFood={() => {
                setActiveMealType('dinner');
                setShowAddFoodModal(true);
              }}
              onRemoveFood={(id) => removeFoodFromMeal('dinner', id)}
              onChangeMultiplier={(id, val) => updateMultiplier('dinner', id, val)}
            />

            {/* Snacks Section */}
            <MealCard
              title="الوجبات الخفيفة والبدائل (Snacks)"
              icon="cafe"
              foods={meals.snacks}
              onAddFood={() => {
                setActiveMealType('snacks');
                setShowAddFoodModal(true);
              }}
              onRemoveFood={(id) => removeFoodFromMeal('snacks', id)}
              onChangeMultiplier={(id, val) => updateMultiplier('snacks', id, val)}
            />
          </View>

          {/* Save Action */}
          <View style={styles.actions}>
            <Button
              title="حفظ خطة الوجبات لليوم"
              onPress={handleSavePlan}
              loading={isSaving}
              disabled={isSaving}
              icon={<Ionicons name="save-outline" size={20} color={colors.primaryContrast} />}
            />
            <Button
              title="عودة لملف المريض"
              onPress={() => router.back()}
              variant="secondary"
              disabled={isSaving}
            />
          </View>

          <View style={styles.spacer} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 1. Modal: Add Food Selection */}
      <Modal
        visible={showAddFoodModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddFoodModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAddFoodModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
              <ArabicText bold style={styles.modalTitle}>إضافة بديل غذائي للوجبة</ArabicText>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={colors.textDisabled} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="ابحث عن الغذاء بالاسم..."
                placeholderTextColor={colors.textDisabled}
                value={searchQuery}
                onChangeText={setSearchQuery}
                textAlign="right"
              />
            </View>

            {/* Category Select tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
              <TouchableOpacity
                style={[styles.categoryTab, selectedCategory === 'الكل' && styles.categoryTabActive]}
                onPress={() => setSelectedCategory('الكل')}
              >
                <ArabicText style={[styles.categoryTabText, selectedCategory === 'الكل' && styles.categoryTabTextActive]}>الكل</ArabicText>
              </TouchableOpacity>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[styles.categoryTab, selectedCategory === cat.value && styles.categoryTabActive]}
                  onPress={() => setSelectedCategory(cat.value)}
                >
                  <ArabicText style={[styles.categoryTabText, selectedCategory === cat.value && styles.categoryTabTextActive]}>{cat.value}</ArabicText>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Create Custom Food Shortcut */}
            <TouchableOpacity
              style={styles.customFoodShortcut}
              onPress={() => {
                setShowAddFoodModal(false);
                setShowCustomFoodModal(true);
              }}
            >
              <Ionicons name="add-circle" size={20} color={colors.primary} />
              <ArabicText bold style={styles.customFoodShortcutText}>تعريف وإضافة غذاء/طبق يمني مخصص</ArabicText>
            </TouchableOpacity>

            {/* Foods List */}
            <ScrollView style={styles.foodsList}>
              {filteredFoods.length === 0 ? (
                <ArabicText style={styles.noFoodsText}>لا توجد بدائل تطابق البحث الحالي</ArabicText>
              ) : (
                filteredFoods.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.foodRow}
                    onPress={() => addFoodToMeal(activeMealType, item)}
                  >
                    <View style={styles.foodRowLeft}>
                      <Ionicons name="chevron-back" size={18} color={colors.textDisabled} />
                    </View>
                    <View style={styles.foodRowRight}>
                      <ArabicText bold style={styles.foodRowName}>{item.nameAr}</ArabicText>
                      <ArabicText style={styles.foodRowDetails}>
                        الحصة: {item.servingSize} | {item.calories} سعرة | كربوهيدرات: {item.carbohydrates} غم | بروتين: {item.protein} غم | دهون: {item.fat} غم
                      </ArabicText>
                      {(item.potassium !== null || item.sodium !== null) && (
                        <ArabicText style={styles.foodRowElectrolytes}>
                          بوتاسيوم: {item.potassium || 0} ملغم | صوديوم: {item.sodium || 0} ملغم
                        </ArabicText>
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 2. Modal: Create Custom Food */}
      <Modal
        visible={showCustomFoodModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCustomFoodModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowCustomFoodModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
              <ArabicText bold style={styles.modalTitle}>تعريف بديل غذائي مخصص</ArabicText>
            </View>

            <ScrollView style={styles.modalFormScroll}>
              <View style={styles.formGap}>
                <TextInputField
                  label="اسم الغذاء / الطبق بالعربية"
                  value={customFood.nameAr}
                  onChangeText={(v) => setCustomFood((prev) => ({ ...prev, nameAr: v }))}
                  placeholder="مثال: شفوت يمني باللحوح"
                  required
                />

                <TextInputField
                  label="الاسم بالإنجليزي (اختياري)"
                  value={customFood.nameEn}
                  onChangeText={(v) => setCustomFood((prev) => ({ ...prev, nameEn: v }))}
                  placeholder="e.g. Shafoot"
                />

                <DropdownField
                  label="مجموعة البدائل الغذائية"
                  options={CATEGORIES}
                  selectedValue={customFood.category}
                  onValueChange={(val) => setCustomFood((prev) => ({ ...prev, category: val }))}
                  required
                />

                <TextInputField
                  label="حجم الحصة الغذائية"
                  value={customFood.servingSize}
                  onChangeText={(v) => setCustomFood((prev) => ({ ...prev, servingSize: v }))}
                  placeholder="مثال: ربع قرص (50 غرام) أو طبق متوسط"
                  required
                />

                <View style={styles.twoColumnRow}>
                  <View style={styles.columnField}>
                    <TextInputField
                      label="السعرات (سعرة)"
                      value={customFood.calories}
                      onChangeText={(v) => setCustomFood((prev) => ({ ...prev, calories: v }))}
                      placeholder="0"
                      keyboardType="numeric"
                      required
                    />
                  </View>
                  <View style={styles.columnField}>
                    <TextInputField
                      label="بروتين (غم)"
                      value={customFood.protein}
                      onChangeText={(v) => setCustomFood((prev) => ({ ...prev, protein: v }))}
                      placeholder="0"
                      keyboardType="numeric"
                      required
                    />
                  </View>
                </View>

                <View style={styles.twoColumnRow}>
                  <View style={styles.columnField}>
                    <TextInputField
                      label="كربوهيدرات (غم)"
                      value={customFood.carbohydrates}
                      onChangeText={(v) => setCustomFood((prev) => ({ ...prev, carbohydrates: v }))}
                      placeholder="0"
                      keyboardType="numeric"
                      required
                    />
                  </View>
                  <View style={styles.columnField}>
                    <TextInputField
                      label="دهون (غم)"
                      value={customFood.fat}
                      onChangeText={(v) => setCustomFood((prev) => ({ ...prev, fat: v }))}
                      placeholder="0"
                      keyboardType="numeric"
                      required
                    />
                  </View>
                </View>

                <View style={styles.twoColumnRow}>
                  <View style={styles.columnField}>
                    <TextInputField
                      label="البوتاسيوم (ملغم) - اختياري"
                      value={customFood.potassium}
                      onChangeText={(v) => setCustomFood((prev) => ({ ...prev, potassium: v }))}
                      placeholder="0"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.columnField}>
                    <TextInputField
                      label="الصوديوم (ملغم) - اختياري"
                      value={customFood.sodium}
                      onChangeText={(v) => setCustomFood((prev) => ({ ...prev, sodium: v }))}
                      placeholder="0"
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <Button
                    title="حفظ وإضافة الغذاء للوجبة"
                    onPress={handleCreateCustomFood}
                  />
                  <Button
                    title="إلغاء"
                    onPress={() => setShowCustomFoodModal(false)}
                    variant="secondary"
                  />
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

// Subcomponents helper for layout clarity
function MealCard({
  title,
  icon,
  foods,
  onAddFood,
  onRemoveFood,
  onChangeMultiplier,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  foods: SelectedFood[];
  onAddFood: () => void;
  onRemoveFood: (id: string) => void;
  onChangeMultiplier: (id: string, val: string) => void;
}) {
  return (
    <View style={styles.mealCard}>
      <View style={styles.mealCardHeader}>
        <View style={styles.mealTitleRow}>
          <Ionicons name={icon} size={20} color={colors.primary} />
          <ArabicText bold style={styles.mealTitleText}>{title}</ArabicText>
        </View>
        <TouchableOpacity style={styles.addFoodBtn} onPress={onAddFood}>
          <Ionicons name="add" size={18} color={colors.primaryContrast} />
          <ArabicText bold style={styles.addFoodBtnText}>إضافة طعام</ArabicText>
        </TouchableOpacity>
      </View>

      <View style={styles.mealFoodsContainer}>
        {foods.length === 0 ? (
          <ArabicText style={styles.noFoodsInMeal}>لا يوجد أطعمة مضافة لهذه الوجبة بعد.</ArabicText>
        ) : (
          foods.map((food) => {
            const mult = food.quantity ?? 1.0;
            const computedKcal = Math.round(food.calories * mult);
            const computedCarbs = Math.round(food.carbohydrates * mult);
            const computedProtein = Math.round(food.protein * mult);
            const computedFat = Math.round(food.fat * mult);

            return (
              <View key={food.id} style={styles.mealFoodRow}>
                <View style={styles.foodMainInfo}>
                  <ArabicText bold style={styles.foodNameText}>{food.nameAr}</ArabicText>
                  <ArabicText style={styles.foodServingText}>حجم الحصة: {food.servingSize}</ArabicText>
                  <ArabicText style={styles.foodMacrosText}>
                    {computedKcal} سعرة | كربوهيدرات: {computedCarbs} غم | بروتين: {computedProtein} غم | دهون: {computedFat} غم
                  </ArabicText>
                  {(food.potassium !== undefined || food.sodium !== undefined) && (
                    <ArabicText style={styles.foodElectrolytesText}>
                      بوتاسيوم: {Math.round((food.potassium || 0) * mult)} ملغم | صوديوم: {Math.round((food.sodium || 0) * mult)} ملغم
                    </ArabicText>
                  )}
                </View>

                <View style={styles.foodQuantityControls}>
                  <ArabicText style={styles.multiplierLabel}>مضاعف البديل:</ArabicText>
                  <TextInput
                    style={styles.multiplierInput}
                    value={String(food.quantity)}
                    onChangeText={(v) => onChangeMultiplier(food.id, v)}
                    keyboardType="decimal-pad"
                    selectTextOnFocus
                  />
                  <TouchableOpacity style={styles.removeFoodBtn} onPress={() => onRemoveFood(food.id)}>
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.surfaceSecondary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surfaceSecondary, gap: spacing.md },
  loadingText: { fontSize: 16, color: colors.textSecondary },
  header: { backgroundColor: colors.primary, paddingTop: safeHeaderPaddingTop, paddingBottom: spacing.lg, paddingHorizontal: spacing.md },
  backBtn: { position: 'absolute', top: safeHeaderPaddingTop - 6, start: spacing.md, zIndex: 1, padding: 4 },
  headerTitle: { fontSize: 20, color: colors.primaryContrast, textAlign: 'right', marginTop: spacing.lg },
  headerSubtitle: { fontSize: 13, color: colors.primaryContrast, opacity: 0.8, textAlign: 'right', marginTop: spacing.xs },
  section: {
    backgroundColor: colors.surface,
    margin: spacing.md,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
    paddingBottom: spacing.xs,
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: 14, color: colors.textPrimary, flex: 1, textAlign: 'right' },
  subheading: { fontSize: 14, color: colors.textPrimary, textAlign: 'right', marginTop: spacing.sm },
  templateGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  templateButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceSecondary,
  },
  templateButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  macroDashboard: {
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  dashboardMetric: {
    gap: spacing.xs,
  },
  metricLabelRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  metricLabelText: { fontSize: 13, color: colors.textSecondary },
  metricValueText: { fontSize: 13, color: colors.textPrimary },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  gridStats: {
    flexDirection: 'row-reverse',
    gap: spacing.md,
  },
  gridStatBox: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridStatLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: 2 },
  gridStatValue: { fontSize: 13, color: colors.textPrimary },
  alertBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  alertText: { fontSize: 11, fontWeight: '700', flex: 1, textAlign: 'right', lineHeight: 18 },
  mealCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  mealCardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mealTitleRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs },
  mealTitleText: { fontSize: 13, color: colors.primary },
  addFoodBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    gap: spacing.xs,
  },
  addFoodBtnText: { fontSize: 11, color: colors.primaryContrast },
  mealFoodsContainer: { padding: spacing.sm, gap: spacing.sm },
  noFoodsInMeal: { fontSize: 12, color: colors.textSecondary, textAlign: 'right', fontStyle: 'italic', paddingVertical: spacing.xs },
  mealFoodRow: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodMainInfo: { flex: 1, alignItems: 'flex-end', paddingStart: spacing.sm },
  foodNameText: { fontSize: 13, color: colors.textPrimary, textAlign: 'right' },
  foodServingText: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  foodMacrosText: { fontSize: 11, color: colors.primary, fontWeight: '700', marginTop: 2, textAlign: 'right' },
  foodElectrolytesText: { fontSize: 10, color: colors.textSecondary, marginTop: 1, textAlign: 'right' },
  foodQuantityControls: { alignItems: 'center', gap: spacing.xs },
  multiplierLabel: { fontSize: 9, color: colors.textSecondary },
  multiplierInput: {
    width: 60,
    height: 30,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 13,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceSecondary,
  },
  removeFoodBtn: { padding: 4 },
  actions: { padding: spacing.md, gap: spacing.sm },
  spacer: { height: 40 },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: '60%',
    padding: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
  },
  modalTitle: { fontSize: 16, color: colors.textPrimary },
  searchContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchIcon: { marginStart: spacing.xs },
  searchInput: { flex: 1, height: 40, fontSize: 14, color: colors.textPrimary },
  categoryScroll: { flexDirection: 'row-reverse', gap: spacing.xs, marginBottom: spacing.md },
  categoryTab: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryTabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryTabText: { fontSize: 12, color: colors.textSecondary },
  categoryTabTextActive: { color: colors.primaryContrast },
  customFoodShortcut: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    borderRadius: 8,
    marginBottom: spacing.sm,
    justifyContent: 'center',
  },
  customFoodShortcutText: { fontSize: 12, color: colors.primary },
  foodsList: { flex: 1 },
  noFoodsText: { fontSize: 14, color: colors.textDisabled, textAlign: 'center', marginVertical: spacing.lg },
  foodRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
  },
  foodRowLeft: { justifyContent: 'center' },
  foodRowRight: { flex: 1, alignItems: 'flex-end', paddingEnd: spacing.sm },
  foodRowName: { fontSize: 13, color: colors.textPrimary, textAlign: 'right' },
  foodRowDetails: { fontSize: 11, color: colors.textSecondary, marginTop: 2, textAlign: 'right' },
  foodRowElectrolytes: { fontSize: 10, color: colors.primary, marginTop: 1, textAlign: 'right' },

  // Custom food form
  modalFormScroll: { flex: 1 },
  formGap: { gap: spacing.md, paddingBottom: spacing.lg },
  twoColumnRow: { flexDirection: 'row-reverse', gap: spacing.md },
  columnField: { flex: 1 },
  modalActions: { gap: spacing.sm, marginTop: spacing.md },
});
