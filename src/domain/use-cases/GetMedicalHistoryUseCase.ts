import { MedicalHistoryRecord } from '../repositories/IMedicalHistoryRepository';
import { MedicalHistoryRepository } from '../../data/repositories/MedicalHistoryRepository';

export class GetMedicalHistoryUseCase {
  private repository: MedicalHistoryRepository;

  constructor() {
    this.repository = new MedicalHistoryRepository();
  }

  async execute(patientId: string): Promise<MedicalHistoryRecord | null> {
    if (!patientId) {
      throw new Error('Patient ID is required');
    }
    return this.repository.getByPatientId(patientId);
  }
}
