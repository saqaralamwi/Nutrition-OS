import { Patient, CreatePatientInput } from '../entities/Patient';

export type SortOrder = 'newest' | 'oldest';

export interface PatientSearchQuery {
  name?: string;
  department?: string;
  dateFrom?: string;
  dateTo?: string;
  diagnosis?: string;
  status?: string;
  sortOrder?: SortOrder;
}

export interface IPatientRepository {
  findById(id: string): Promise<Patient | null>;
  findByFileNumber(fileNumber: string): Promise<Patient | null>;
  search(query: PatientSearchQuery): Promise<Patient[]>;
  findAll(sortOrder?: SortOrder): Promise<Patient[]>;
  create(input: CreatePatientInput): Promise<Patient>;
  update(patient: Patient): Promise<{ success: boolean; patient?: Patient }>;
  delete(id: string): Promise<{ success: boolean }>;
  count(): Promise<number>;
  generateFileNumber(): Promise<string>;
  sync(id: string): Promise<{ success: boolean; error?: string }>;
  syncAll(): Promise<{ success: boolean; syncedCount: number; failedCount: number }>;
}
