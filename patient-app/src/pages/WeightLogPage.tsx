import React from 'react';

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
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 arabic">الوزن</h2>
        <p className="text-gray-600 arabic mt-2">تسجيل ومتابعة الوزن ومؤشر كتلة الجسم</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 arabic mb-4">تسجيل وزن جديد</h3>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
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
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 arabic mb-2">الطول (سم)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              min="50"
              max="250"
            />
          </div>
        </div>

        <div className="bg-primary-50 rounded-lg p-4 mb-4 text-center">
          <div className="text-5xl font-bold text-primary-700" style={{ direction: 'ltr' }}>
            {bmi}
          </div>
          <div className={`text-lg font-semibold ${category.color} arabic mt-1`}>{category.label}</div>
          <div className="text-sm text-gray-600 arabic mt-1">مؤشر كتلة الجسم (BMI)</div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 arabic mb-2">ملاحظات</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg arabic"
            rows={2}
            placeholder="أي ملاحظات..."
          />
        </div>

        <button
          onClick={saveLog}
          className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition arabic"
        >
          حفظ الوزن
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 arabic mb-4">سجل الوزن</h3>
        {logs.length === 0 ? (
          <div className="text-center text-gray-500 arabic py-8">لا توجد قراءات مسجلة</div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="text-xl font-bold text-gray-800" style={{ direction: 'ltr' }}>
                    {log.weight} <span className="text-sm font-normal text-gray-500">كغم</span>
                  </div>
                  <div className="text-sm text-gray-500 arabic">
                    BMI: {log.bmi} - {getBmiCategory(log.bmi).label}
                  </div>
                </div>
                <div className="text-left text-sm text-gray-500">
                  <div>{formatDate(log.logDate)}</div>
                  <div>{formatTime(log.logDate)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
