import { InterventionRecord } from '../repositories/IInterventionRepository';
import { InterventionRepository } from '../../data/repositories/InterventionRepository';

export class GetActiveInterventionUseCase {
  private repository: InterventionRepository;

  constructor() {
    this.repository = new InterventionRepository();
  }

  async execute(patientId: string): Promise<InterventionRecord | null> {
    return this.repository.getActiveByPatientId(patientId);
  }
}
