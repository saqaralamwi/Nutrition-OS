import React from 'react';

interface MedicationLogItem {
  id: string;
  nameAr: string;
  nameEn: string;
  dosage: number;
  unit: string;
  taken: boolean;
  takenAt: string;
  scheduledFor: string;
  notes: string;
}

const MEDICATIONS = [
  { nameAr: 'ميتفورمين', nameEn: 'Metformin', defaultDose: 500, unit: 'ملغم' },
  { nameAr: 'أنسولين', nameEn: 'Insulin', defaultDose: 10, unit: 'وحدة' },
  { nameAr: 'أملوديبين', nameEn: 'Amlodipine', defaultDose: 5, unit: 'ملغم' },
  { nameAr: 'أتورفاستاتين', nameEn: 'Atorvastatin', defaultDose: 10, unit: 'ملغم' },
  { nameAr: 'أوميبرازول', nameEn: 'Omeprazole', defaultDose: 20, unit: 'ملغم' },
];

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function MedicationLogPage(): React.ReactElement {
  const [selectedMed, setSelectedMed] = React.useState(MEDICATIONS[0]);
  const [dosage, setDosage] = React.useState(MEDICATIONS[0].defaultDose);
  const [scheduledFor, setScheduledFor] = React.useState('08:00');
  const [logs, setLogs] = React.useState<MedicationLogItem[]>([]);

  const saveLog = (taken: boolean) => {
    const log: MedicationLogItem = {
      id: Date.now().toString(),
      nameAr: selectedMed.nameAr,
      nameEn: selectedMed.nameEn,
      dosage,
      unit: selectedMed.unit,
      taken,
      takenAt: new Date().toISOString(),
      scheduledFor,
      notes: '',
    };
    setLogs([log, ...logs]);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 arabic">الأدوية</h2>
        <p className="text-gray-600 arabic mt-2">تسجيل ومتابعة الأدوية اليومية</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 arabic mb-4">تسجيل دواء</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 arabic mb-2">الدواء</label>
          <select
            value={selectedMed.nameEn}
            onChange={(e) => {
              const med = MEDICATIONS.find((m) => m.nameEn === e.target.value) || MEDICATIONS[0];
              setSelectedMed(med);
              setDosage(med.defaultDose);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg arabic"
          >
            {MEDICATIONS.map((med) => (
              <option key={med.nameEn} value={med.nameEn}>{med.nameAr} - {med.nameEn}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 arabic mb-2">الجرعة</label>
            <input
              type="number"
              value={dosage}
              onChange={(e) => setDosage(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 arabic mb-2">الوقت المحدد</label>
            <input
              type="time"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => saveLog(true)}
            className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition arabic"
          >
            تم تناول الدواء
          </button>
          <button
            onClick={() => saveLog(false)}
            className="flex-1 bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition arabic"
          >
            لم يتم تناوله
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 arabic mb-4">سجل الأدوية</h3>
        {logs.length === 0 ? (
          <div className="text-center text-gray-500 arabic py-8">لا يوجد سجل للأدوية</div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className={`border rounded-lg p-4 flex items-center justify-between ${
                log.taken ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}>
                <div>
                  <div className="font-semibold text-gray-800 arabic">{log.nameAr}</div>
                  <div className="text-sm text-gray-600">{log.nameEn}</div>
                  <div className="text-sm text-gray-500 arabic mt-1">
                    الجرعة: {log.dosage} {log.unit} - {log.scheduledFor}
                  </div>
                </div>
                <div className="text-left">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    log.taken ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                  } arabic`}>
                    {log.taken ? 'تم التناول' : 'لم يتم'}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">{formatTime(log.takenAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
