export interface MedicalHistory {
  id: string;
  patientId: string;
  chiefComplaint: string;
  currentDiagnosis: string;
  icd10Code: string | null;
  comorbidities: string[];
  surgicalHistory: string | null;
  pastMedicalHistory: string | null;
  familyHistory: string | null;
  medicationAllergies: string | null;
  covid19Status: string;
  comments: string | null;
  createdAt: string;
  updatedAt: string;
}
