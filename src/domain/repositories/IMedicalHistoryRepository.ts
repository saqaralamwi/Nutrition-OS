export interface MedicalHistoryRecord {
  id?: string;
  patientId: string;
  chiefComplaint: string;
  currentDiagnosis: string;
  icd10Code?: string;
  comorbidities?: string;
  surgicalHistory?: string;
  pastMedicalHistory?: string;
  familyHistory?: string;
  medicationAllergies?: string;
  covid19Status: string;
  comments?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IMedicalHistoryRepository {
  getByPatientId(patientId: string): Promise<MedicalHistoryRecord | null>;
  save(record: MedicalHistoryRecord): Promise<string>;
  delete(id: string): Promise<void>;
}
