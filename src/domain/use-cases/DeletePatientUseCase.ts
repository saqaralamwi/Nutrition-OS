import { PatientRepository } from '../../data/repositories/PatientRepository';

export class DeletePatientUseCase {
  private repository = new PatientRepository();

  async execute(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
