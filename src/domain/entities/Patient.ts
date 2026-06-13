export type PatientGender = 'male' | 'female';
export type PatientStatus = 'active' | 'discharged' | 'follow-up' | 'complete' | 'incomplete';
export type PatientType = 'inpatient' | 'outpatient' | 'consultation';

export interface Patient {
  id: string;
  userId?: string;
  fileNumber: string;
  fullName: string;
  age: number;
  dateOfBirth: string | null;
  gender: PatientGender;
  nationalId: string | null;
  nationality: string | null;
  phoneNumber: string | null;
  department: string;
  bedNumber: string | null;
  admissionDate: string;
  referringPhysician: string | null;
  primaryDiagnosis: string;
  patientType: PatientType;
  status: PatientStatus;
  notes: string | null;
  incompleteSections?: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientInput {
  fullName: string;
  age: number;
  dateOfBirth: string | null;
  gender: PatientGender;
  nationalId: string | null;
  nationality?: string | null;
  phoneNumber: string | null;
  department: string;
  userId?: string;
  bedNumber?: string | null;
  referringPhysician?: string | null;
  admissionDate?: string;
  primaryDiagnosis: string;
  patientType: PatientType;
  notes?: string | null;
  status?: PatientStatus;
  incompleteSections?: string[] | null;
}
