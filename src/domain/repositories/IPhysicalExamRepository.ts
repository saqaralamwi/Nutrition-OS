import { PhysicalExamItem } from '../entities/PhysicalExamItem';

export interface PhysicalExamRecord {
  id?: string;
  patientId: string;
  domain: string;
  itemKey: string;
  response: string;
  comments?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IPhysicalExamRepository {
  getByPatientId(patientId: string): Promise<PhysicalExamRecord[]>;
  getByDomain(patientId: string, domain: string): Promise<PhysicalExamRecord[]>;
  saveBatch(patientId: string, items: PhysicalExamRecord[]): Promise<void>;
}
