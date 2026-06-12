import { DischargeSummaryRecord } from '../repositories/IDischargeRepository';
import { DischargeRepository } from '../../data/repositories/DischargeRepository';

export class GetDischargeSummaryUseCase {
  private repository: DischargeRepository;

  constructor() {
    this.repository = new DischargeRepository();
  }

  async execute(patientId: string): Promise<DischargeSummaryRecord | null> {
    return this.repository.getByPatientId(patientId);
  }
}
