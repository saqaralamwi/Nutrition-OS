import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../../../data/database';
import type { ICardiovascularAssessment } from '../../../data/types/cardiovascular';
import { ReportSection, ReportFindingRow } from '../ReportTemplate';

interface CardioInput {
  systolicBp: number;
  diastolicBp: number;
  heartRate: number;
  totalCholesterol: number;
  ldlCholesterol: number;
  hdlCholesterol: number;
  triglycerides: number;
  edemaGrading: string;
  hasDyspnea: boolean;
  hasOrthopnea: boolean;
  dashScore: number;
}

function computeDashScore(a: ICardiovascularAssessment): number {
  return [
    a.dashLowSodium, a.dashLowSaturatedFat, a.dashFruitVeg,
    a.dashWholeGrains, a.dashLeanProtein, a.dashLowSugar,
    a.dashModerateAlcohol, a.dashDailyExercise,
  ].filter(Boolean).length;
}

interface RiskResult {
  status: string;
  color: string;
  warnings: string[];
  fluidRestriction: number;
}

function computeRisk(input: CardioInput): RiskResult {
  const { systolicBp: sbp, diastolicBp: dbp, totalCholesterol: tc, ldlCholesterol: ldl,
    hdlCholesterol: hdl, triglycerides: tg, heartRate: hr, dashScore } = input;

  const warnings: string[] = [];

  if (sbp >= 180 || dbp >= 120) {
    warnings.push('أزمة فرط ضغط دم (Hypertensive Crisis) — تدخل طبي فوري مطلوب');
  } else if (sbp >= 140 || dbp >= 90) {
    warnings.push('المرحلة الثانية من ارتفاع الضغط — يحتاج علاج دوائي');
  } else if (sbp >= 130 || dbp >= 85) {
    warnings.push('المرحلة الأولى من ارتفاع الضغط — يستلزم متابعة');
  } else if (sbp >= 120 && sbp < 130) {
    warnings.push('ضغط دم مرتفع (Elevated) — يستلزم تغيير نمط الحياة');
  }

  if (tc > 0 && (tc >= 240 || ldl >= 160 || tg >= 200)) {
    warnings.push('فرط شحوم الدم مرتفع الخطورة (High-Risk Dyslipidemia)');
  } else if (tc > 0 && (tc >= 200 || ldl >= 130 || tg >= 150)) {
    warnings.push('فرط شحوم الدم حدودي (Borderline Dyslipidemia)');
  }

  if (hdl > 0 && hdl < 40) {
    warnings.push('HDL منخفض — خطر قلبي وعائي مرتفع');
  }

  if (hr > 0 && hr > 100) {
    warnings.push('تسرع القلب (Tachycardia) — معدل النبض فوق 100/دقيقة');
  }
  if (hr > 0 && hr < 50) {
    warnings.push('بطء القلب (Bradycardia) — معدل النبض أقل من 50/دقيقة');
  }

  if (dashScore < 5) {
    warnings.push('الامتثال لنظام DASH الغذائي منخفض — تحتاج استشارة تغذوية عاجلة');
  }

  let fluidRestriction = 0;
  if (input.edemaGrading !== 'none' || input.hasDyspnea || input.hasOrthopnea) {
    fluidRestriction = 1500;
    if (input.edemaGrading === '3+' || input.edemaGrading === '4+' || input.hasDyspnea || input.hasOrthopnea) {
      fluidRestriction = 1000;
    }
    warnings.push(`تقييد السوائل: ${fluidRestriction} مل/يوم بناءً على حالة الاحتقان`);
  }

  let status: string;
  let color: string;

  if (warnings.some((w) => w.includes('أزمة') || w.includes('مرتفع الخطورة'))) {
    status = 'إنذار أحمر — خطر مرتفع';
    color = '#EF4444';
  } else if (warnings.length > 0) {
    status = 'تنبيه أصفر — بحاجة لمتابعة';
    color = '#F59E0B';
  } else {
    status = 'مستقر — أخضر';
    color = '#10B981';
  }

  return { status, color, warnings, fluidRestriction };
}

export async function buildCardioSection(patientId: string): Promise<ReportSection | null> {
  const db = await getDatabase();
  const records: any[] = await db
    .get('cardiovascular_assessments')
    .query(Q.where('patient_id', patientId), Q.sortBy('recorded_at', 'desc'))
    .fetch();

  if (records.length === 0) return null;

  const record = records[0];
  const domain = record.toDomain() as ICardiovascularAssessment;

  const dashScore = computeDashScore(domain);

  const input: CardioInput = {
    systolicBp: domain.systolicBloodPressure || 0,
    diastolicBp: domain.diastolicBloodPressure || 0,
    heartRate: domain.heartRate || 0,
    totalCholesterol: domain.totalCholesterol || 0,
    ldlCholesterol: domain.ldlCholesterol || 0,
    hdlCholesterol: domain.hdlCholesterol || 0,
    triglycerides: domain.triglycerides || 0,
    edemaGrading: domain.edemaGrading || 'none',
    hasDyspnea: domain.hasDyspnea ?? false,
    hasOrthopnea: domain.hasOrthopnea ?? false,
    dashScore,
  };

  const risk = computeRisk(input);

  const findings: ReportFindingRow[] = [];

  if (domain.systolicBloodPressure) {
    findings.push({ label: 'الضغط الانقباضي', value: String(domain.systolicBloodPressure), unit: 'mmHg' });
  }
  if (domain.diastolicBloodPressure) {
    findings.push({ label: 'الضغط الانبساطي', value: String(domain.diastolicBloodPressure), unit: 'mmHg' });
  }
  if (domain.heartRate) {
    findings.push({ label: 'معدل النبض', value: String(domain.heartRate), unit: 'نبضة/دقيقة' });
  }
  if (domain.totalCholesterol) {
    findings.push({ label: 'الكوليسترول الكلي', value: String(domain.totalCholesterol), unit: 'mg/dL' });
  }
  if (domain.ldlCholesterol) {
    findings.push({ label: 'LDL', value: String(domain.ldlCholesterol), unit: 'mg/dL' });
  }
  if (domain.hdlCholesterol) {
    findings.push({ label: 'HDL', value: String(domain.hdlCholesterol), unit: 'mg/dL' });
  }
  if (domain.triglycerides) {
    findings.push({ label: 'الدهون الثلاثية', value: String(domain.triglycerides), unit: 'mg/dL' });
  }

  findings.push({ label: 'امتثال DASH', value: `${dashScore}/8` });

  if (domain.edemaGrading && domain.edemaGrading !== 'none') {
    findings.push({ label: 'درجة الوذمة', value: `Edema ${domain.edemaGrading}` });
  }

  return {
    id: 'cardio',
    type: 'clinical_findings',
    title: 'تقييم القلب والأوعية الدموية',
    findings,
    narrative: risk.warnings.length > 0 ? risk.warnings.join('\n') : 'لا توجد تحذيرات',
    badges: [
      { label: risk.status.split(' — ')[0], color: risk.color },
      { label: `DASH ${dashScore}/8`, color: dashScore >= 5 ? '#10B981' : '#F59E0B' },
    ],
  };
}
