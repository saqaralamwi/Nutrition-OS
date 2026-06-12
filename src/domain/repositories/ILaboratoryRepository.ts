export interface LaboratoryRecordRecord {
  id?: string;
  patientId: string;
  testDate: number;
  testType: string;
  // Hepatic Profile
  alt?: number;
  ast?: number;
  albumin?: number;
  bilirubin?: number;
  // Renal/Electrolytes
  potassium?: number;
  sodium?: number;
  phosphorus?: number;
  urea?: number;
  creatinine?: number;
  // Metabolic Markers
  bloodGlucose?: number;
  hba1c?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ILaboratoryRepository {
  getByPatientId(patientId: string): Promise<LaboratoryRecordRecord[]>;
  create(record: LaboratoryRecordRecord): Promise<string>;
}
