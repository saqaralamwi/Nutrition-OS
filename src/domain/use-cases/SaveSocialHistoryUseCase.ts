import { SocialHistoryRecord } from '../repositories/ISocialHistoryRepository';
import { SocialHistoryRepository } from '../../data/repositories/SocialHistoryRepository';

export class SaveSocialHistoryUseCase {
  private repository: SocialHistoryRepository;

  constructor() {
    this.repository = new SocialHistoryRepository();
  }

  async execute(record: SocialHistoryRecord): Promise<string> {
    if (!record.patientId) {
      throw new Error('Patient ID is required');
    }
    if (!record.smoking) {
      throw new Error('Smoking status is required');
    }
    if (!record.alcoholSubstanceUse) {
      throw new Error('Alcohol/substance use status is required');
    }
    if (!record.physicalActivity) {
      throw new Error('Physical activity status is required');
    }
    if (!record.specialDietBeforeAdmission) {
      throw new Error('Special diet before admission status is required');
    }
    return this.repository.save(record);
  }
}
