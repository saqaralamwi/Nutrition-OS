import React from 'react';
import { View, Text } from 'react-native';

interface PatientProfile {
  nameAr: string;
  nameEn: string;
  dateOfBirth: string;
  gender: string;
  genderAr: string;
  phone: string;
  email: string;
  mrn: string;
  bloodType: string;
  bloodTypeAr: string;
  height: number;
  weight: number;
  conditions: string[];
}

const MOCK_PROFILE: PatientProfile = {
  nameAr: 'أحمد محمد',
  nameEn: 'Ahmed Mohammed',
  dateOfBirth: '1985-03-15',
  gender: 'male',
  genderAr: 'ذكر',
  phone: '+967 777 123 456',
  email: 'ahmed@example.com',
  mrn: 'MRN-2024-0001',
  bloodType: 'O+',
  bloodTypeAr: 'O+',
  height: 170,
  weight: 75,
  conditions: ['السكري من النوع الثاني', 'ارتفاع ضغط الدم'],
};

export function ProfilePage(): React.ReactElement {
  const [language] = React.useState<'en' | 'ar'>('ar');
  const profile = MOCK_PROFILE;

  const bmi = profile.height > 0
    ? Math.round((profile.weight / ((profile.height / 100) * (profile.height / 100))) * 10) / 10
    : 0;

  return (
    <View className="space-y-6">
      <View className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 arabic">الملف الشخصي</h2>
        <p className="text-gray-600 arabic mt-2">معلومات المريض والحالة الصحية</p>
      </View>

      <View className="bg-white rounded-lg shadow p-6">
        <View className="flex items-center mb-6">
          <View className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center text-3xl">
            👤
          </View>
          <View className="mr-4">
            <h3 className="text-xl font-bold text-gray-800 arabic">{profile.nameAr}</h3>
            <p className="text-gray-600">{profile.nameEn}</p>
          </View>
        </View>

        <View className="grid grid-cols-2 gap-4">
          <View>
            <label className="text-sm text-gray-500 arabic">رقم الملف الطبي</label>
            <p className="font-semibold text-gray-800">{profile.mrn}</p>
          </View>
          <View>
            <label className="text-sm text-gray-500 arabic">الجنس</label>
            <p className="font-semibold text-gray-800 arabic">{profile.genderAr}</p>
          </View>
          <View>
            <label className="text-sm text-gray-500 arabic">تاريخ الميلاد</label>
            <p className="font-semibold text-gray-800">{profile.dateOfBirth}</p>
          </View>
          <View>
            <label className="text-sm text-gray-500 arabic">فصيلة الدم</label>
            <p className="font-semibold text-gray-800 arabic">{profile.bloodTypeAr}</p>
          </View>
          <View>
            <label className="text-sm text-gray-500 arabic">الهاتف</label>
            <p className="font-semibold text-gray-800" style={{ direction: 'ltr' }}>{profile.phone}</p>
          </View>
          <View>
            <label className="text-sm text-gray-500 arabic">البريد الإلكتروني</label>
            <p className="font-semibold text-gray-800">{profile.email}</p>
          </View>
        </View>
      </View>

      <View className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 arabic mb-4">القياسات الحيوية</h3>
        <View className="grid grid-cols-3 gap-4">
          <View className="bg-primary-50 rounded-lg p-4 text-center">
            <View className="text-2xl font-bold text-primary-700">{profile.weight}</View>
            <View className="text-sm text-gray-600 arabic">الوزن (كغم)</View>
          </View>
          <View className="bg-primary-50 rounded-lg p-4 text-center">
            <View className="text-2xl font-bold text-primary-700">{profile.height}</View>
            <View className="text-sm text-gray-600 arabic">الطول (سم)</View>
          </View>
          <View className="bg-primary-50 rounded-lg p-4 text-center">
            <View className="text-2xl font-bold text-primary-700">{bmi}</View>
            <View className="text-sm text-gray-600 arabic">مؤشر BMI</View>
          </View>
        </View>
      </View>

      <View className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 arabic mb-4">الحالات الصحية</h3>
        {profile.conditions.length === 0 ? (
          <p className="text-gray-500 arabic">لا توجد حالات صحية مسجلة</p>
        ) : (
          <View className="space-y-2">
            {profile.conditions.map((c, i) => (
              <View key={i} className="flex items-center bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <Text className="text-yellow-600 ml-2">⚠️</Text>
                <Text className="text-gray-800 arabic">{c}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
