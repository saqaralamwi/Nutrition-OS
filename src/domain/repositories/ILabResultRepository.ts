export interface LabResultRecord {
  id?: string;
  patientId: string;
  testName: string;
  resultValue: number;
  unit: string;
  referenceRangeLow: number;
  referenceRangeHigh: number;
  interpretation: string;
  overrideReason?: string;
  testDate: string;
  comments?: string;
  attachedImagePath?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ILabResultRepository {
  getByPatientId(patientId: string): Promise<LabResultRecord[]>;
  getByTestName(patientId: string, testName: string): Promise<LabResultRecord[]>;
  save(record: LabResultRecord): Promise<string>;
  delete(id: string): Promise<void>;
}
