import React from 'react';
import { View, Text } from 'react-native';
import { SearchInput } from '../components/SearchInput';
import { FoodCard } from '../components/FoodCard';

interface FoodItem {
  id: string;
  nameEn: string;
  nameAr: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  potassium: number;
  image_url?: string;
  thumbnail_url?: string;
}

interface LogEntry {
  id: string;
  food_name_ar: string;
  food_name_en: string;
  amount: number;
  unit_ar: string;
  calories: number;
  meal_type_ar: string;
  log_date: string;
}

const FOODS: FoodItem[] = [
  { id: 'food-001', nameEn: 'Brown Rice', nameAr: 'أرز بني', category: 'grains', calories: 111, protein: 2.6, carbs: 23, fat: 0.9, fiber: 1.8, sodium: 5, potassium: 86 },
  { id: 'food-002', nameEn: 'White Rice', nameAr: 'أرز أبيض', category: 'grains', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, sodium: 1, potassium: 35 },
  { id: 'food-011', nameEn: 'Apple', nameAr: 'تفاح', category: 'fruits', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, sodium: 1, potassium: 107 },
  { id: 'food-012', nameEn: 'Banana', nameAr: 'موز', category: 'fruits', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, sodium: 1, potassium: 358 },
  { id: 'food-016', nameEn: 'Chicken Breast', nameAr: 'صدر دجاج', category: 'proteins', calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sodium: 74, potassium: 217 },
];

function getMealTypeAr(mealType: string): string {
  const map: Record<string, string> = {
    breakfast: 'إفطار',
    lunch: 'غداء',
    dinner: 'عشاء',
    snack: 'وجبة خفيفة',
  };
  return map[mealType] || mealType;
}

export function FoodLogPage(): React.ReactElement {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedFood, setSelectedFood] = React.useState<FoodItem | null>(null);
  const [amount, setAmount] = React.useState(100);
  const [mealType, setMealType] = React.useState<string>('breakfast');
  const [logs, setLogs] = React.useState<LogEntry[]>([]);

  const searchedFoods = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return FOODS.filter((f) => f.nameEn.toLowerCase().includes(q) || f.nameAr.includes(q));
  }, [searchQuery]);

  const caloriesForAmount = selectedFood
    ? (selectedFood.calories * amount) / 100
    : 0;

  const saveFoodLog = () => {
    if (!selectedFood) return;
    const entry: LogEntry = {
      id: Date.now().toString(),
      food_name_ar: selectedFood.nameAr,
      food_name_en: selectedFood.nameEn,
      amount,
      unit_ar: 'غم',
      calories: caloriesForAmount,
      meal_type_ar: getMealTypeAr(mealType),
      log_date: new Date().toISOString(),
    };
    setLogs([entry, ...logs]);
    setSelectedFood(null);
    setAmount(100);
    setSearchQuery('');
  };

  return (
    <View className="space-y-6">
      <View className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 arabic">سجل الطعام</h2>
        <p className="text-gray-600 arabic mt-2">تسجيل الطعام اليومي مع حساب السعرات والمكونات</p>
      </View>

      <View className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 arabic mb-4">إضافة طعام</h3>

        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="ابحث عن طعام..."
          placeholderEn="Search for food..."
        />

        {searchedFoods.length > 0 && (
          <View className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchedFoods.slice(0, 6).map((food) => (
              <FoodCard
                key={food.id}
                food={food}
                isSelected={selectedFood?.id === food.id}
                onSelect={() => setSelectedFood(food)}
              />
            ))}
          </View>
        )}

        {selectedFood && (
          <View className="mt-6 space-y-4">
            <View>
              <label className="block text-sm font-medium text-gray-700 arabic mb-2">
                الكمية: {amount} غم
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min="1"
                max="1000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
            </View>

            <View>
              <label className="block text-sm font-medium text-gray-700 arabic mb-2">نوع الوجبة</label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="breakfast">إفطار</option>
                <option value="lunch">غداء</option>
                <option value="dinner">عشاء</option>
                <option value="snack">وجبة خفيفة</option>
              </select>
            </View>

            <View className="bg-primary-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 arabic mb-2">المكونات الغذائية</h4>
              <View className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <View>
                  <Text className="text-gray-600">سعرات: </Text>
                  <Text className="font-semibold text-primary-700">{caloriesForAmount.toFixed(1)} kcal</Text>
                </View>
                <View>
                  <Text className="text-gray-600">بروتين: </Text>
                  <Text className="font-semibold text-primary-700">{((selectedFood.protein * amount) / 100).toFixed(1)} غم</Text>
                </View>
                <View>
                  <Text className="text-gray-600">كربوهيدرات: </Text>
                  <Text className="font-semibold text-primary-700">{((selectedFood.carbs * amount) / 100).toFixed(1)} غم</Text>
                </View>
                <View>
                  <Text className="text-gray-600">دهون: </Text>
                  <Text className="font-semibold text-primary-700">{((selectedFood.fat * amount) / 100).toFixed(1)} غم</Text>
                </View>
              </View>
            </View>

            <button
              onClick={saveFoodLog}
              className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
            >
              حفظ في السجل
            </button>
          </View>
        )}
      </View>

      <View className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 arabic mb-4">سجل الطعام اليومي</h3>

        {logs.length === 0 ? (
          <View className="text-center text-gray-500 arabic py-8">لا يوجد طعام مسجل اليوم</View>
        ) : (
          <View className="space-y-4">
            {logs.map((log) => (
              <View key={log.id} className="border border-gray-200 rounded-lg p-4">
                <View className="flex items-center justify-between">
                  <View>
                    <h4 className="font-semibold text-gray-800 arabic">{log.food_name_ar}</h4>
                    <p className="text-sm text-gray-600">{log.food_name_en}</p>
                  </View>
                  <View className="text-right">
                    <p className="font-semibold text-primary-700">{log.calories.toFixed(1)} kcal</p>
                    <p className="text-sm text-gray-600">{log.amount} {log.unit_ar}</p>
                  </View>
                </View>
                <View className="mt-2 text-sm text-gray-600">
                  <Text className="bg-primary-100 px-2 py-1 rounded arabic">{log.meal_type_ar}</Text>
                  <Text className="ml-2">{new Date(log.log_date).toLocaleTimeString('ar-YE')}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
