import { SupplementRepository } from '../../data/repositories/SupplementRepository';

export class DeleteSupplementUseCase {
  private repository: SupplementRepository;

  constructor() {
    this.repository = new SupplementRepository();
  }

  async execute(id: string): Promise<void> {
    if (!id) throw new Error('Supplement ID is required');
    return this.repository.delete(id);
  }
}
