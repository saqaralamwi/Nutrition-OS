import { SupplementRecord } from '../repositories/ISupplementRepository';
import { SupplementRepository } from '../../data/repositories/SupplementRepository';

export class GetSupplementsUseCase {
  private repository: SupplementRepository;

  constructor() {
    this.repository = new SupplementRepository();
  }

  async execute(patientId: string): Promise<SupplementRecord[]> {
    if (!patientId) {
      throw new Error('Patient ID is required');
    }
    return this.repository.getByPatientId(patientId);
  }
}
