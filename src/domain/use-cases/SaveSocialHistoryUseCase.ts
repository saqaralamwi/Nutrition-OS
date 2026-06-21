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
    if (!record.khatChewing) {
      throw new Error('Khat chewing status is required');
    }
    if (!record.physicalActivity) {
      throw new Error('Physical activity status is required');
    }
    if (!record.specialDietBeforeAdmission) {
      throw new Error('Special diet before admission status is required');
    }
    
    // Default deprecated field
    record.alcoholSubstanceUse = record.alcoholSubstanceUse || 'no';
    return this.repository.save(record);
  }
}
