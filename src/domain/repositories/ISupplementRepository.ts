export interface SupplementRecord {
  id?: string;
  patientId: string;
  supplementName: string;
  dosage?: string;
  supplementType: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ISupplementRepository {
  getByPatientId(patientId: string): Promise<SupplementRecord[]>;
  save(record: SupplementRecord): Promise<string>;
  delete(id: string): Promise<void>;
}
