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
  update(patient: Patient): Promise<void>;
  delete(id: string): Promise<void>;
  count(): Promise<number>;
  generateFileNumber(): Promise<string>;
}
