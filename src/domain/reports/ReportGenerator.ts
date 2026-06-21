import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../../data/database';
import {
  ReportPayload,
  ReportSection,
  ReportPatientProfile,
  ReportType,
} from './ReportTemplate';
import { buildAnemiaSection } from './section-builders/AnemiaSectionBuilder';
import { buildCardioSection } from './section-builders/CardioSectionBuilder';
import { buildCalculationsSection } from './section-builders/CalculationsSectionBuilder';
import { CertifiedReportEngine, type ICertifiedReportInput } from './CertifiedReportEngine';

async function fetchPatientProfile(patientId: string): Promise<ReportPatientProfile | null> {
  try {
    const db = await getDatabase();
    const records = await db
      .get('patients')
      .query(Q.where('id', patientId))
      .fetch();
    if (records.length === 0) return null;

    const raw = (records[0] as any)._raw;
    return {
      fullName: raw.full_name || raw.name || '',
      fileNumber: raw.file_number || '',
      age: raw.age || 0,
      gender: raw.gender === 'female' ? 'أنثى' : 'ذكر',
      department: raw.department || '',
      diagnosis: raw.primary_diagnosis || '',
      admissionDate: raw.admission_date ? new Date(Number(raw.admission_date)).toLocaleDateString('ar-SA') : undefined,
      bedNumber: raw.bed_number || undefined,
    };
  } catch {
    return null;
  }
}

function generateReportId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `RPT-${ts}-${rand}`.toUpperCase();
}

const SECTION_BUILDERS: Record<ReportType, Array<(patientId: string) => Promise<ReportSection | null>>> = {
  'clinical-summary': [
    buildAnemiaSection,
    buildCardioSection,
    buildCalculationsSection,
  ],
  'full-assessment': [
    buildAnemiaSection,
    buildCardioSection,
    buildCalculationsSection,
  ],
};

export class ReportGenerator {
  static async generate(
    patientId: string,
    reportType: ReportType = 'full-assessment',
  ): Promise<ReportPayload | null> {
    const profile = await fetchPatientProfile(patientId);
    if (!profile) return null;

    const builders = SECTION_BUILDERS[reportType];
    const sectionResults = await Promise.allSettled(
      builders.map((builder) => builder(patientId)),
    );

    const sections: ReportSection[] = [];
    for (const result of sectionResults) {
      if (result.status === 'fulfilled' && result.value !== null) {
        sections.push(result.value);
      }
    }

    const payload: ReportPayload = {
      reportId: generateReportId(),
      patientId,
      reportType,
      generatedAt: Date.now(),
      profile,
      sections,
    };

    return payload;
  }

  static async generateSummary(patientId: string): Promise<ReportPayload | null> {
    return ReportGenerator.generate(patientId, 'clinical-summary');
  }

  static async generateFullAssessment(patientId: string): Promise<ReportPayload | null> {
    return ReportGenerator.generate(patientId, 'full-assessment');
  }

  static async certifyReport(
    patientId: string,
    reportType: ReportType,
    actorName: string,
    actorRole: ICertifiedReportInput['securityContext']['actorRole'],
    justificationText: string,
  ): Promise<{ payload: ReportPayload; hash: string; stamp: string } | null> {
    const payload = await ReportGenerator.generate(patientId, reportType);
    if (!payload) return null;

    const clinicalMetrics: ICertifiedReportInput['clinicalMetrics'] = {
      weightKg: 0,
      bmi: 0,
      egfrValue: 0,
      netCaloriesTarget: 0,
      proteinTargetGrams: 0,
    };
    for (const section of payload.sections) {
      for (const f of section.findings) {
        const numeric = parseFloat(f.value);
        if (isNaN(numeric)) continue;
        if (f.label.includes('وزن') || f.label.includes('الوزن')) clinicalMetrics.weightKg = numeric;
        if (f.label.includes('BMI') || f.label.includes('كتلة')) clinicalMetrics.bmi = numeric;
        if (f.label.includes('eGFR') || f.label.includes('GFR')) clinicalMetrics.egfrValue = numeric;
        if (f.label.includes('سعرات') || f.label.includes('Calories')) clinicalMetrics.netCaloriesTarget = numeric;
        if (f.label.includes('بروتين') || f.label.includes('Protein')) clinicalMetrics.proteinTargetGrams = numeric;
      }
    }

    const certifiedInput: ICertifiedReportInput = {
      patientId,
      patientName: payload.profile.fullName,
      clinicalMetrics,
      securityContext: { actorName, actorRole, justificationText },
    };

    const certified = await CertifiedReportEngine.generateCertifiedPayload(certifiedInput);
    if (!certified.isVerifiedSecure) return null;

    payload.certificationFingerprint = certified.digitalFingerprintHash;

    return { payload, hash: certified.digitalFingerprintHash, stamp: certified.certificationStamp };
  }

  static async saveToDatabase(
    payload: ReportPayload,
    pdfBlob?: string,
  ): Promise<string | null> {
    try {
      const db = await getDatabase();
      const collection = db.get('reports');
      const record = await collection.create((r: any) => {
        r.patientId = payload.patientId;
        r.reportType = payload.reportType;
        r.generatedAt = payload.generatedAt;
        r.digitalFingerprintHash = payload.certificationFingerprint || '';
        if (pdfBlob) r.pdfBlob = pdfBlob;
        r.inputSnapshot = JSON.stringify(payload);
      });
      return record.id;
    } catch {
      return null;
    }
  }

  static async fetchReports(patientId: string): Promise<any[]> {
    try {
      const db = await getDatabase();
      const records = await db
        .get('reports')
        .query(Q.where('patient_id', patientId), Q.sortBy('generated_at', Q.desc))
        .fetch();
      return records.map((r: any) => ({
        id: r.id,
        reportType: r.reportType,
        generatedAt: r.generatedAt,
        digitalFingerprintHash: r.digitalFingerprintHash,
        inputSnapshot: r.inputSnapshot,
      }));
    } catch {
      return [];
    }
  }
}
