import { CalculationOverride } from '../entities/CalculationOverride';

export interface ICalculationOverrideRepository {
  findByCalculationId(calculationId: string): Promise<CalculationOverride[]>;
  create(override: CalculationOverride): Promise<string>;
}
