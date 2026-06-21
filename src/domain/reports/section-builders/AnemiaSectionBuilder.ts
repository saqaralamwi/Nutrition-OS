import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../../../data/database';
import { AnemiaNutritionEngine } from '../../calculators/AnemiaNutritionEngine';
import type { AnemiaAssessment, AnemiaSeverity } from '../../types/anemia';
import { ReportSection, ReportFindingRow } from '../ReportTemplate';

function computeTransferrinSaturation(iron: number, tibc: number): number {
  return Math.round((iron / (tibc || 1)) * 100) || 0;
}

function computeIronStatus(ferritin: number, tsat: number): string {
  if (ferritin < 15 || tsat < 16) return 'depleted';
  if (ferritin < 30) return 'very_low';
  if (ferritin < 50) return 'low';
  return 'normal';
}

function computeB12Status(b12: number): string {
  if (b12 < 150) return 'deficient';
  if (b12 < 200) return 'very_low';
  if (b12 < 300) return 'low';
  return 'normal';
}

function computeFolateStatus(folate: number): string {
  if (folate < 3) return 'deficient';
  if (folate < 4) return 'very_low';
  if (folate < 6) return 'low';
  return 'normal';
}

const SEVERITY_LABELS: Record<AnemiaSeverity, { ar: string; severity: ReportFindingRow['severity'] }> = {
  none: { ar: 'لا يوجد', severity: 'normal' },
  mild: { ar: 'خفيف', severity: 'warning' },
  moderate: { ar: 'متوسط', severity: 'warning' },
  severe: { ar: 'شديد', severity: 'critical' },
  critical: { ar: 'حرج', severity: 'critical' },
};

const ANEMIA_TYPE_LABELS: Record<string, string> = {
  iron_deficiency: 'فقر الدم بعوز الحديد',
  b12_deficiency: 'فقر الدم بعوز B12',
  folate_deficiency: 'فقر الدم بعوز الفولات',
  mixed_deficiency: 'فقر الدم المختلط',
  hemolytic: 'فقر الدم الانحلالي',
  sickle_cell: 'فقر الدم المنجلي',
  chronic_disease: 'فقر الدم الناتج عن الأمراض المزمنة',
  unknown: 'غير محدد',
};

async function fetchPatientGender(patientId: string): Promise<'male' | 'female'> {
  try {
    const db = await getDatabase();
    const patients = await db
      .get('patients')
      .query(Q.where('id', patientId))
      .fetch();
    if (patients.length > 0) {
      const raw = (patients[0] as any)._raw;
      return raw.gender === 'female' ? 'female' : 'male';
    }
  } catch {
    /* fallback */
  }
  return 'male';
}

export async function buildAnemiaSection(patientId: string): Promise<ReportSection | null> {
  const db = await getDatabase();
  const records: any[] = await db
    .get('anemia_assessments')
    .query(Q.where('patient_id', patientId), Q.sortBy('created_at', Q.desc))
    .fetch();

  if (records.length === 0) return null;

  const record = records[0];
  const domain = record.toDomain();

  const findings: ReportFindingRow[] = [];

  const gender = await fetchPatientGender(patientId);
  const isPregnant = domain.isPregnant ?? false;

  const severity = AnemiaNutritionEngine.classifySeverity(
    domain.hemoglobin || 0,
    domain.hemoglobinUnit || 'g/dL',
    gender,
    isPregnant,
  );

  const tsat = computeTransferrinSaturation(domain.serumIron || 0, domain.tibc || 1);
  const ironStatus = computeIronStatus(domain.ferritin || 0, tsat);
  const b12Status = computeB12Status(domain.vitaminB12 || 0);
  const folateStatus = computeFolateStatus(domain.serumFolate || 0);

  const assessmentWithStatus: AnemiaAssessment = {
    ...domain,
    ironStatus: ironStatus as any,
    b12Status: b12Status as any,
    folateStatus: folateStatus as any,
  };
  const anemiaType = AnemiaNutritionEngine.determineAnemiaType(assessmentWithStatus);

  const severityMeta = SEVERITY_LABELS[severity] || SEVERITY_LABELS.none;

  findings.push({
    label: 'الهيموغلوبين',
    value: String(domain.hemoglobin ?? 0),
    unit: domain.hemoglobinUnit || 'g/dL',
    severity: severityMeta.severity,
  });

  findings.push({ label: 'شدة فقر الدم', value: severityMeta.ar, severity: severityMeta.severity });
  findings.push({ label: 'نوع فقر الدم', value: ANEMIA_TYPE_LABELS[anemiaType] || anemiaType });

  findings.push({ label: 'الحديد في المصل', value: String(domain.serumIron ?? 0), unit: 'µg/dL' });
  findings.push({ label: 'السعة الرابطة للحديد (TIBC)', value: String(domain.tibc ?? 0), unit: 'µg/dL' });
  findings.push({ label: 'تشبع الترانسفيرين', value: `${tsat}%`, severity: ironStatus === 'depleted' ? 'critical' : ironStatus !== 'normal' ? 'warning' : 'normal' });
  findings.push({ label: 'فيريتين المصل', value: String(domain.ferritin ?? 0), unit: 'ng/mL', severity: ironStatus === 'depleted' ? 'critical' : ironStatus !== 'normal' ? 'warning' : 'normal' });

  findings.push({ label: 'حالة الحديد', value: ironStatus === 'normal' ? 'طبيعي' : ironStatus === 'depleted' ? 'مستنفذ' : ironStatus === 'very_low' ? 'منخفض جداً' : 'منخفض' });

  findings.push({ label: 'فيتامين B12', value: String(domain.vitaminB12 ?? 0), unit: 'pg/mL', severity: b12Status === 'deficient' ? 'critical' : b12Status !== 'normal' ? 'warning' : 'normal' });
  findings.push({ label: 'حالة B12', value: b12Status === 'normal' ? 'طبيعي' : b12Status === 'deficient' ? 'عوز' : b12Status === 'very_low' ? 'منخفض جداً' : 'منخفض' });

  findings.push({ label: 'فولات المصل', value: String(domain.serumFolate ?? 0), unit: 'ng/mL', severity: folateStatus === 'deficient' ? 'critical' : folateStatus !== 'normal' ? 'warning' : 'normal' });
  findings.push({ label: 'حالة الفولات', value: folateStatus === 'normal' ? 'طبيعي' : folateStatus === 'deficient' ? 'عوز' : folateStatus === 'very_low' ? 'منخفض جداً' : 'منخفض' });

  if (domain.mcv) {
    findings.push({ label: 'MCV', value: String(domain.mcv), unit: 'fL' });
  }
  if (domain.mch) {
    findings.push({ label: 'MCH', value: String(domain.mch), unit: 'pg' });
  }

  const symptomaticSymptoms: string[] = [];
  if (domain.hasFatigue) symptomaticSymptoms.push('إرهاق');
  if (domain.hasDyspnea) symptomaticSymptoms.push('ضيق نفس');
  if (domain.hasPalpitations) symptomaticSymptoms.push('خفقان');
  if (domain.hasDizziness) symptomaticSymptoms.push('دوخة');

  return {
    id: 'anemia',
    type: 'clinical_findings',
    title: 'تقييم فقر الدم',
    findings,
    narrative: symptomaticSymptoms.length > 0
      ? `الأعراض المسجلة: ${symptomaticSymptoms.join('، ')}`
      : undefined,
    badges: [
      { label: severityMeta.ar, color: severityMeta.severity === 'critical' ? '#EF4444' : severityMeta.severity === 'warning' ? '#F59E0B' : '#10B981' },
    ],
  };
}
