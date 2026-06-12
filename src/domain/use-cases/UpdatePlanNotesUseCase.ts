import { NutritionPlanRepository } from '../../data/repositories/NutritionPlanRepository';

export class UpdatePlanNotesUseCase {
  private repository = new NutritionPlanRepository();

  async execute(planId: string, notes: string): Promise<void> {
    await this.repository.updateNotes(planId, notes);
  }
}
