import { LabResultRecord } from '../repositories/ILabResultRepository';
import { LabResultRepository } from '../../data/repositories/LabResultRepository';

export class GetLabResultsUseCase {
  private repository: LabResultRepository;

  constructor() {
    this.repository = new LabResultRepository();
  }

  async execute(patientId: string): Promise<LabResultRecord[]> {
    if (!patientId) throw new Error('Patient ID is required');
    return this.repository.getByPatientId(patientId);
  }
}
