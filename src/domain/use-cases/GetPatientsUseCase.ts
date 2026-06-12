import { PatientRepository } from '../../data/repositories/PatientRepository';
import { Patient } from '../entities/Patient';

export class GetPatientsUseCase {
  private repository = new PatientRepository();

  async execute(): Promise<Patient[]> {
    return this.repository.findAll('newest');
  }
}
