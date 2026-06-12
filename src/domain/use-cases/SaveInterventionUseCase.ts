import { InterventionRecord } from '../repositories/IInterventionRepository';
import { InterventionRepository } from '../../data/repositories/InterventionRepository';

export class SaveInterventionUseCase {
  private repository: InterventionRepository;

  constructor() {
    this.repository = new InterventionRepository();
  }

  async execute(record: InterventionRecord): Promise<string> {
    return this.repository.save(record);
  }
}
