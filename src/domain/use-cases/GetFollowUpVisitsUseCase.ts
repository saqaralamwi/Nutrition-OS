import { FollowUpVisitRecord } from '../repositories/IFollowUpVisitRepository';
import { FollowUpVisitRepository } from '../../data/repositories/FollowUpVisitRepository';

export class GetFollowUpVisitsUseCase {
  private repository: FollowUpVisitRepository;

  constructor() {
    this.repository = new FollowUpVisitRepository();
  }

  async execute(patientId: string): Promise<FollowUpVisitRecord[]> {
    return this.repository.getByPatientId(patientId);
  }
}
