import { SocialHistoryRecord } from '../repositories/ISocialHistoryRepository';
import { SocialHistoryRepository } from '../../data/repositories/SocialHistoryRepository';

export class GetSocialHistoryUseCase {
  private repository: SocialHistoryRepository;

  constructor() {
    this.repository = new SocialHistoryRepository();
  }

  async execute(patientId: string): Promise<SocialHistoryRecord | null> {
    if (!patientId) {
      throw new Error('Patient ID is required');
    }
    return this.repository.getByPatientId(patientId);
  }
}
