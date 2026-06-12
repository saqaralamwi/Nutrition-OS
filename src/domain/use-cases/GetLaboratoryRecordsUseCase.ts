import { LaboratoryRecordRecord } from '../repositories/ILaboratoryRepository';
import { LaboratoryRepository } from '../../data/repositories/LaboratoryRepository';

export class GetLaboratoryRecordsUseCase {
  private repository: LaboratoryRepository;

  constructor() {
    this.repository = new LaboratoryRepository();
  }

  async execute(patientId: string): Promise<LaboratoryRecordRecord[]> {
    return this.repository.getByPatientId(patientId);
  }
}
