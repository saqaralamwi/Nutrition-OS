import { PhysicalExamRecord } from '../repositories/IPhysicalExamRepository';
import { PhysicalExamRepository } from '../../data/repositories/PhysicalExamRepository';

export class SavePhysicalExamUseCase {
  private repository: PhysicalExamRepository;

  constructor() {
    this.repository = new PhysicalExamRepository();
  }

  async execute(patientId: string, items: PhysicalExamRecord[]): Promise<void> {
    if (!patientId) throw new Error('Patient ID is required');
    if (!items.length) throw new Error('At least one exam item is required');
    for (const item of items) {
      if (!item.itemKey) throw new Error('Item key is required');
      if (!item.response?.trim()) throw new Error(`Response required for ${item.itemKey}`);
    }
    return this.repository.saveBatch(patientId, items);
  }
}
