import React from 'react';

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
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 arabic">الملف الشخصي</h2>
        <p className="text-gray-600 arabic mt-2">معلومات المريض والحالة الصحية</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-6">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center text-3xl">
            👤
          </div>
          <div className="mr-4">
            <h3 className="text-xl font-bold text-gray-800 arabic">{profile.nameAr}</h3>
            <p className="text-gray-600">{profile.nameEn}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-500 arabic">رقم الملف الطبي</label>
            <p className="font-semibold text-gray-800">{profile.mrn}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500 arabic">الجنس</label>
            <p className="font-semibold text-gray-800 arabic">{profile.genderAr}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500 arabic">تاريخ الميلاد</label>
            <p className="font-semibold text-gray-800">{profile.dateOfBirth}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500 arabic">فصيلة الدم</label>
            <p className="font-semibold text-gray-800 arabic">{profile.bloodTypeAr}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500 arabic">الهاتف</label>
            <p className="font-semibold text-gray-800" style={{ direction: 'ltr' }}>{profile.phone}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500 arabic">البريد الإلكتروني</label>
            <p className="font-semibold text-gray-800">{profile.email}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 arabic mb-4">القياسات الحيوية</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-primary-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary-700">{profile.weight}</div>
            <div className="text-sm text-gray-600 arabic">الوزن (كغم)</div>
          </div>
          <div className="bg-primary-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary-700">{profile.height}</div>
            <div className="text-sm text-gray-600 arabic">الطول (سم)</div>
          </div>
          <div className="bg-primary-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary-700">{bmi}</div>
            <div className="text-sm text-gray-600 arabic">مؤشر BMI</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 arabic mb-4">الحالات الصحية</h3>
        {profile.conditions.length === 0 ? (
          <p className="text-gray-500 arabic">لا توجد حالات صحية مسجلة</p>
        ) : (
          <div className="space-y-2">
            {profile.conditions.map((c, i) => (
              <div key={i} className="flex items-center bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <span className="text-yellow-600 ml-2">⚠️</span>
                <span className="text-gray-800 arabic">{c}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
