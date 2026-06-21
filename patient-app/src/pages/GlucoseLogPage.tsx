import React from 'react';
import { View, Text } from 'react-native';

interface GlucoseLogItem {
  id: string;
  value: number;
  unit: string;
  measurementType: string;
  measurementTypeAr: string;
  beforeMeal: boolean;
  notes: string;
  logDate: string;
}

const MEASUREMENT_TYPES = [
  { value: 'fasting', labelAr: 'صائم', labelEn: 'Fasting' },
  { value: 'postprandial', labelAr: 'فاطر', labelEn: 'Postprandial' },
  { value: 'random', labelAr: 'عشوائي', labelEn: 'Random' },
  { value: 'bedtime', labelAr: 'قبل النوم', labelEn: 'Bedtime' },
];

function getTypeAr(value: string): string {
  return MEASUREMENT_TYPES.find((t) => t.value === value)?.labelAr || value;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function GlucoseLogPage(): React.ReactElement {
  const [value, setValue] = React.useState(100);
  const [measurementType, setMeasurementType] = React.useState('fasting');
  const [beforeMeal, setBeforeMeal] = React.useState(true);
  const [notes, setNotes] = React.useState('');
  const [logs, setLogs] = React.useState<GlucoseLogItem[]>([]);

  const getLevel = (v: number, type: string): { label: string; color: string } => {
    if (type === 'fasting') {
      if (v < 70) return { label: 'منخفض', color: 'text-red-600' };
      if (v > 126) return { label: 'مرتفع', color: 'text-red-600' };
      return { label: 'طبيعي', color: 'text-green-600' };
    }
    if (v < 70) return { label: 'منخفض', color: 'text-red-600' };
    if (v > 180) return { label: 'مرتفع', color: 'text-red-600' };
    return { label: 'طبيعي', color: 'text-green-600' };
  };

  const saveLog = () => {
    const log: GlucoseLogItem = {
      id: Date.now().toString(),
      value,
      unit: 'mg/dL',
      measurementType,
      measurementTypeAr: getTypeAr(measurementType),
      beforeMeal,
      notes,
      logDate: new Date().toISOString(),
    };
    setLogs([log, ...logs]);
    setNotes('');
  };

  const level = getLevel(value, measurementType);

  return (
    <View className="space-y-6">
      <View className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 arabic">سكر الدم</h2>
        <p className="text-gray-600 arabic mt-2">تسجيل قراءات سكر الدم اليومية</p>
      </View>

      <View className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 arabic mb-4">تسجيل قراءة جديدة</h3>

        <View className="mb-6 text-center">
          <View className="text-6xl font-bold arabic mb-2" style={{ direction: 'ltr' }}>
            {value}
            <Text className="text-2xl text-gray-500 mr-2">mg/dL</Text>
          </View>
          <input
            type="range"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            min="40"
            max="400"
            className="w-full h-2 bg-primary-100 rounded-lg appearance-none cursor-pointer accent-primary-600"
          />
          <View className={`text-lg font-semibold ${level.color} arabic mt-2`}>{level.label}</View>
        </View>

        <View className="grid grid-cols-2 gap-4 mb-4">
          <View>
            <label className="block text-sm font-medium text-gray-700 arabic mb-2">نوع القياس</label>
            <select
              value={measurementType}
              onChange={(e) => setMeasurementType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg arabic"
            >
              {MEASUREMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.labelAr}</option>
              ))}
            </select>
          </View>
          <View>
            <label className="block text-sm font-medium text-gray-700 arabic mb-2">قبل/بعد الوجبة</label>
            <select
              value={beforeMeal ? 'before' : 'after'}
              onChange={(e) => setBeforeMeal(e.target.value === 'before')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg arabic"
            >
              <option value="before">قبل الوجبة</option>
              <option value="after">بعد الوجبة</option>
            </select>
          </View>
        </View>

        <View className="mb-4">
          <label className="block text-sm font-medium text-gray-700 arabic mb-2">ملاحظات</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg arabic"
            rows={2}
            placeholder="أي ملاحظات إضافية..."
          />
        </View>

        <button
          onClick={saveLog}
          className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition arabic"
        >
          حفظ القراءة
        </button>
      </View>

      <View className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 arabic mb-4">القراءات السابقة</h3>
        {logs.length === 0 ? (
          <View className="text-center text-gray-500 arabic py-8">لا توجد قراءات مسجلة</View>
        ) : (
          <View className="space-y-3">
            {logs.map((log) => {
              const lvl = getLevel(log.value, log.measurementType);
              return (
                <View key={log.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                  <View>
                    <View className={`text-xl font-bold ${lvl.color}`} style={{ direction: 'ltr' }}>
                      {log.value} <Text className="text-sm">mg/dL</Text>
                    </View>
                    <View className="text-sm text-gray-600 arabic mt-1">
                      {log.measurementTypeAr} - {log.beforeMeal ? 'قبل الأكل' : 'بعد الأكل'}
                    </View>
                  </View>
                  <View className="text-left text-sm text-gray-500">
                    <View>{formatTime(log.logDate)}</View>
                    <Text className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${lvl.color} bg-gray-100`}>
                      {lvl.label}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}
