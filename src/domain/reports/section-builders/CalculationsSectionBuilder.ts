import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../../../data/database';
import {
  calculateHarrisBenedictBMR,
  calculateMifflinStJeorBMR,
  calculateHollidaySegarFluid,
} from '../../../domain/utils/kauRequirementsEngine';
import type { CalculationInputValues } from '../../../domain/entities/Calculation';
import { ReportSection, ReportFindingRow } from '../ReportTemplate';

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  comatose: 1.1,
  sedentary: 1.2,
  active: 1.3,
  very_active: 1.5,
};

export async function buildCalculationsSection(patientId: string): Promise<ReportSection | null> {
  const db = await getDatabase();
  const records = await db
    .get('calculations')
    .query(
      Q.where('patient_id', patientId),
      Q.where('calculation_type', 'calculation_inputs'),
      Q.sortBy('created_at', Q.desc),
    )
    .fetch();

  if (records.length === 0) return null;

  const record = records[0];
  const raw = record._raw as any;
  const inputValues: CalculationInputValues = JSON.parse(raw.input_values || '{}');

  const w = inputValues.weightKg || 0;
  const h = inputValues.heightCm || 0;
  const age = inputValues.age || 0;
  const isMale = inputValues.isMale ?? true;

  const findings: ReportFindingRow[] = [];

  findings.push({ label: 'الوزن', value: String(w), unit: 'kg' });
  findings.push({ label: 'الطول', value: String(h), unit: 'cm' });

  const bmi = w > 0 && h > 0 ? w / Math.pow(h / 100, 2) : 0;
  findings.push({ label: 'مؤشر كتلة الجسم (BMI)', value: bmi > 0 ? bmi.toFixed(2) : '—', unit: 'kg/m²' });

  let bmrNote = '';
  if (w > 0 && h > 0) {
    const mifflin = calculateMifflinStJeorBMR(w, h, age, isMale);
    const harris = calculateHarrisBenedictBMR(w, h, age, isMale);
    findings.push({ label: 'معدل الأيض الأساسي (Mifflin-St Jeor)', value: `${Math.round(mifflin)}`, unit: 'kcal/day' });
    findings.push({ label: 'معدل الأيض الأساسي (Harris-Benedict)', value: `${Math.round(harris)}`, unit: 'kcal/day' });
    bmrNote = `Mifflin: ${Math.round(mifflin)} kcal, Harris-Benedict: ${Math.round(harris)} kcal`;
  }

  const activityLevel = inputValues.activityLevel || 'sedentary';
  const activityFactor = ACTIVITY_MULTIPLIERS[activityLevel] || 1.2;
  const stressFactor = inputValues.stressFactor || 1.0;

  findings.push({ label: 'مستوى النشاط', value: activityLevel === 'comatose' ? 'غيبوبة' : activityLevel === 'sedentary' ? 'خامل' : activityLevel === 'active' ? 'نشط' : 'نشط جداً', unit: `x${activityFactor}` });
  findings.push({ label: 'عامل الإجهاد', value: String(stressFactor) });

  if (w > 0) {
    const fluid = calculateHollidaySegarFluid(w);
    findings.push({ label: 'السوائل (Holliday-Segar)', value: `${Math.round(fluid)}`, unit: 'ml/day' });
  }

  if (inputValues.fever) {
    findings.push({ label: 'حمى', value: 'نعم', severity: 'warning' });
    if (inputValues.currentTemp) {
      findings.push({ label: 'درجة الحرارة', value: String(inputValues.currentTemp), unit: inputValues.tempUnit === 'F' ? '°F' : '°C' });
    }
  }

  if (inputValues.selectedIllness) {
    findings.push({ label: 'المرض المحدد', value: inputValues.selectedIllness });
  }

  return {
    id: 'calculations',
    type: 'computed_results',
    title: 'حسابات الطاقة والتغذية',
    findings,
    narrative: bmrNote || undefined,
    badges: [
      { label: `BMI ${bmi.toFixed(1)}`, color: bmi >= 30 ? '#EF4444' : bmi >= 25 ? '#F59E0B' : bmi >= 18.5 ? '#10B981' : '#F59E0B' },
    ],
  };
}
