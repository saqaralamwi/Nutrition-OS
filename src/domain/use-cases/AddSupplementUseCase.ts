import { SupplementRecord } from '../repositories/ISupplementRepository';
import { SupplementRepository } from '../../data/repositories/SupplementRepository';

export class AddSupplementUseCase {
  private repository: SupplementRepository;

  constructor() {
    this.repository = new SupplementRepository();
  }

  async execute(record: SupplementRecord): Promise<string> {
    if (!record.patientId) throw new Error('Patient ID is required');
    if (!record.supplementName?.trim()) throw new Error('اسم المكمل مطلوب');
    if (!record.supplementType?.trim()) throw new Error('نوع المكمل مطلوب');
    return this.repository.save(record);
  }
}
