import { PatientRepository } from '../../data/repositories/PatientRepository';
import { Patient } from '../entities/Patient';

export class GetPatientUseCase {
  private repository = new PatientRepository();

  async execute(id: string): Promise<Patient | null> {
    return this.repository.findById(id);
  }
}
