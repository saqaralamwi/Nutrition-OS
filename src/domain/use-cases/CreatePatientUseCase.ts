import { PatientRepository } from '../../data/repositories/PatientRepository';
import { Patient, CreatePatientInput } from '../entities/Patient';

export class CreatePatientUseCase {
  private repository = new PatientRepository();

  async execute(input: CreatePatientInput): Promise<Patient> {
    return this.repository.create(input);
  }
}
