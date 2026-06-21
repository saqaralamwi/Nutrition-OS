export type ReportSectionType =
  | 'header'
  | 'patient_info'
  | 'clinical_findings'
  | 'computed_results'
  | 'recommendations'
  | 'footer';

export type ReportType = 'clinical-summary' | 'full-assessment';

export interface ReportFindingRow {
  label: string;
  value: string;
  unit?: string;
  severity?: 'normal' | 'warning' | 'critical';
  reference?: string;
}

export interface ReportSection {
  id: string;
  type: ReportSectionType;
  title: string;
  findings: ReportFindingRow[];
  narrative?: string;
  badges?: { label: string; color: string }[];
}

export interface ReportPatientProfile {
  fullName: string;
  fileNumber: string;
  age: number;
  gender: string;
  department: string;
  diagnosis: string;
  admissionDate?: string;
  bedNumber?: string;
}

export interface ReportPayload {
  reportId: string;
  patientId: string;
  reportType: ReportType;
  generatedAt: number;
  profile: ReportPatientProfile;
  sections: ReportSection[];
  certificationFingerprint?: string;
}
