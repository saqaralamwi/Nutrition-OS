import { MedicationRepository } from '../../data/repositories/MedicationRepository';

export class DeleteMedicationUseCase {
  private repository: MedicationRepository;

  constructor() {
    this.repository = new MedicationRepository();
  }

  async execute(id: string): Promise<void> {
    if (!id) throw new Error('Medication ID is required');
    return this.repository.delete(id);
  }
}
