import { MedicationRecord } from '../repositories/IMedicationRepository';
import { MedicationRepository } from '../../data/repositories/MedicationRepository';

export class GetMedicationsUseCase {
  private repository: MedicationRepository;

  constructor() {
    this.repository = new MedicationRepository();
  }

  async execute(patientId: string): Promise<MedicationRecord[]> {
    if (!patientId) {
      throw new Error('Patient ID is required');
    }
    return this.repository.getByPatientId(patientId);
  }
}
