import React from 'react';
import { View, Text } from 'react-native';

interface Appointment {
  id: string;
  date: string;
  time: string;
  providerNameAr: string;
  providerNameEn: string;
  providerType: string;
  providerTypeAr: string;
  location: string;
  type: string;
  typeAr: string;
  status: string;
  statusAr: string;
  notes: string;
}

const PROVIDER_TYPES = [
  { value: 'dietitian', labelAr: 'أخصائي تغذية', labelEn: 'Dietitian' },
  { value: 'doctor', labelAr: 'طبيب', labelEn: 'Doctor' },
  { value: 'nurse', labelAr: 'ممرض', labelEn: 'Nurse' },
];

const APPT_TYPES = [
  { value: 'follow-up', labelAr: 'متابعة', labelEn: 'Follow-up' },
  { value: 'initial', labelAr: 'استشارة أولى', labelEn: 'Initial Consultation' },
  { value: 'checkup', labelAr: 'فحص دوري', labelEn: 'Checkup' },
];

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('ar-YE', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function AppointmentsPage(): React.ReactElement {
  const [date, setDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = React.useState('10:00');
  const [providerName, setProviderName] = React.useState('');
  const [providerType, setProviderType] = React.useState('dietitian');
  const [location, setLocation] = React.useState('');
  const [apptType, setApptType] = React.useState('follow-up');
  const [notes, setNotes] = React.useState('');
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);

  const saveAppointment = () => {
    const appt: Appointment = {
      id: Date.now().toString(),
      date,
      time,
      providerNameAr: providerName,
      providerNameEn: providerName,
      providerType,
      providerTypeAr: PROVIDER_TYPES.find((p) => p.value === providerType)?.labelAr || providerType,
      location,
      type: apptType,
      typeAr: APPT_TYPES.find((a) => a.value === apptType)?.labelAr || apptType,
      status: 'pending',
      statusAr: 'معلق',
      notes,
    };
    setAppointments([appt, ...appointments]);
    setNotes('');
  };

  return (
    <View className="space-y-6">
      <View className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 arabic">المواعيد</h2>
        <p className="text-gray-600 arabic mt-2">إدارة ومتابعة المواعيد القادمة</p>
      </View>

      <View className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 arabic mb-4">موعد جديد</h3>

        <View className="grid grid-cols-2 gap-4 mb-4">
          <View>
            <label className="block text-sm font-medium text-gray-700 arabic mb-2">التاريخ</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </View>
          <View>
            <label className="block text-sm font-medium text-gray-700 arabic mb-2">الوقت</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </View>
        </View>

        <View className="grid grid-cols-2 gap-4 mb-4">
          <View>
            <label className="block text-sm font-medium text-gray-700 arabic mb-2">مقدم الخدمة</label>
            <input
              type="text"
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg arabic"
              placeholder="اسم الدكتور/الأخصائي"
            />
          </View>
          <View>
            <label className="block text-sm font-medium text-gray-700 arabic mb-2">نوع مقدم الخدمة</label>
            <select
              value={providerType}
              onChange={(e) => setProviderType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg arabic"
            >
              {PROVIDER_TYPES.map((p) => (
                <option key={p.value} value={p.value}>{p.labelAr}</option>
              ))}
            </select>
          </View>
        </View>

        <View className="grid grid-cols-2 gap-4 mb-4">
          <View>
            <label className="block text-sm font-medium text-gray-700 arabic mb-2">الموقع</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg arabic"
              placeholder="العيادة / المستشفى"
            />
          </View>
          <View>
            <label className="block text-sm font-medium text-gray-700 arabic mb-2">نوع الموعد</label>
            <select
              value={apptType}
              onChange={(e) => setApptType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg arabic"
            >
              {APPT_TYPES.map((a) => (
                <option key={a.value} value={a.value}>{a.labelAr}</option>
              ))}
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
            placeholder="أي ملاحظات للموعد..."
          />
        </View>

        <button
          onClick={saveAppointment}
          className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition arabic"
        >
          إضافة موعد
        </button>
      </View>

      <View className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 arabic mb-4">المواعيد القادمة</h3>
        {appointments.length === 0 ? (
          <View className="text-center text-gray-500 arabic py-8">لا توجد مواعيد مسجلة</View>
        ) : (
          <View className="space-y-3">
            {appointments.map((appt) => (
              <View key={appt.id} className="border border-gray-200 rounded-lg p-4">
                <View className="flex items-center justify-between">
                  <View>
                    <View className="font-semibold text-gray-800 arabic">{appt.providerNameAr}</View>
                    <View className="text-sm text-gray-600">{appt.providerNameEn}</View>
                    <View className="text-sm text-gray-500 arabic mt-1">{appt.providerTypeAr}</View>
                  </View>
                  <View className="text-left">
                    <View className="font-semibold text-primary-700">{formatDate(appt.date)}</View>
                    <View className="text-sm text-gray-600">{appt.time}</View>
                    <Text className="inline-block px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800 arabic mt-1">
                      {appt.statusAr}
                    </Text>
                  </View>
                </View>
                <View className="mt-2 text-sm text-gray-500 arabic">
                  {appt.typeAr} - {appt.location}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
