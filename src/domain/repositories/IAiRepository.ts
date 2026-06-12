import { AiGenerateInput, AiGenerateResult, AiPlan } from '../entities/AiPlan';

export interface IAiRepository {
  generatePlan(input: AiGenerateInput): Promise<AiGenerateResult>;
  getCachedPlan(input: AiGenerateInput): AiPlan | null;
  clearCache(): void;
}
