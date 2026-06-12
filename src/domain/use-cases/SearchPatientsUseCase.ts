import { PatientRepository } from '../../data/repositories/PatientRepository';
import { Patient } from '../entities/Patient';

export class SearchPatientsUseCase {
  private repository = new PatientRepository();

  async execute(query: string): Promise<Patient[]> {
    return this.repository.search({ name: query });
  }
}
