import { PhysicalExamRecord } from '../repositories/IPhysicalExamRepository';
import { PhysicalExamRepository } from '../../data/repositories/PhysicalExamRepository';

export class GetPhysicalExamUseCase {
  private repository: PhysicalExamRepository;

  constructor() {
    this.repository = new PhysicalExamRepository();
  }

  async execute(patientId: string): Promise<PhysicalExamRecord[]> {
    if (!patientId) throw new Error('Patient ID is required');
    return this.repository.getByPatientId(patientId);
  }
}
