import React from 'react';
import { View, Text } from 'react-native';

interface WeightLogItem {
  id: string;
  weight: number;
  bmi: number;
  notes: string;
  logDate: string;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ar-YE', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return '';
  }
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function calcBmi(weight: number, heightCm: number): number {
  if (heightCm <= 0) return 0;
  return Math.round((weight / ((heightCm / 100) * (heightCm / 100))) * 10) / 10;
}

function getBmiCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'نقص وزن', color: 'text-yellow-600' };
  if (bmi < 25) return { label: 'وزن طبيعي', color: 'text-green-600' };
  if (bmi < 30) return { label: 'زيادة وزن', color: 'text-orange-600' };
  return { label: 'سمنة', color: 'text-red-600' };
}

export function WeightLogPage(): React.ReactElement {
  const [weight, setWeight] = React.useState(70);
  const [height, setHeight] = React.useState(165);
  const [notes, setNotes] = React.useState('');
  const [logs, setLogs] = React.useState<WeightLogItem[]>([]);

  const bmi = calcBmi(weight, height);
  const category = getBmiCategory(bmi);

  const saveLog = () => {
    const log: WeightLogItem = {
      id: Date.now().toString(),
      weight,
      bmi,
      notes,
      logDate: new Date().toISOString(),
    };
    setLogs([log, ...logs]);
    setNotes('');
  };

  return (
    <View className="space-y-6">
      <View className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 arabic">الوزن</h2>
        <p className="text-gray-600 arabic mt-2">تسجيل ومتابعة الوزن ومؤشر كتلة الجسم</p>
      </View>

      <View className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 arabic mb-4">تسجيل وزن جديد</h3>

        <View className="grid grid-cols-2 gap-4 mb-6">
          <View>
            <label className="block text-sm font-medium text-gray-700 arabic mb-2">الوزن (كغم)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              min="20"
              max="300"
              step="0.1"
            />
          </View>
          <View>
            <label className="block text-sm font-medium text-gray-700 arabic mb-2">الطول (سم)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              min="50"
              max="250"
            />
          </View>
        </View>

        <View className="bg-primary-50 rounded-lg p-4 mb-4 text-center">
          <View className="text-5xl font-bold text-primary-700" style={{ direction: 'ltr' }}>
            {bmi}
          </View>
          <View className={`text-lg font-semibold ${category.color} arabic mt-1`}>{category.label}</View>
          <View className="text-sm text-gray-600 arabic mt-1">مؤشر كتلة الجسم (BMI)</View>
        </View>

        <View className="mb-4">
          <label className="block text-sm font-medium text-gray-700 arabic mb-2">ملاحظات</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg arabic"
            rows={2}
            placeholder="أي ملاحظات..."
          />
        </View>

        <button
          onClick={saveLog}
          className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition arabic"
        >
          حفظ الوزن
        </button>
      </View>

      <View className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 arabic mb-4">سجل الوزن</h3>
        {logs.length === 0 ? (
          <View className="text-center text-gray-500 arabic py-8">لا توجد قراءات مسجلة</View>
        ) : (
          <View className="space-y-3">
            {logs.map((log) => (
              <View key={log.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                <View>
                  <View className="text-xl font-bold text-gray-800" style={{ direction: 'ltr' }}>
                    {log.weight} <Text className="text-sm font-normal text-gray-500">كغم</Text>
                  </View>
                  <View className="text-sm text-gray-500 arabic">
                    BMI: {log.bmi} - {getBmiCategory(log.bmi).label}
                  </View>
                </View>
                <View className="text-left text-sm text-gray-500">
                  <View>{formatDate(log.logDate)}</View>
                  <View>{formatTime(log.logDate)}</View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
