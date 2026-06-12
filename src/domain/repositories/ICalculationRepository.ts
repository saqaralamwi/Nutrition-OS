import { CalculationResult } from '../entities/Calculation';

export interface ICalculationRepository {
  getByPatientId(patientId: string): Promise<CalculationResult[]>;
  getByPatientIdAndType(patientId: string, calculationType: string): Promise<CalculationResult[]>;
  upsert(calculation: CalculationResult): Promise<string>;
  upsertBatch(calculations: CalculationResult[]): Promise<string[]>;
}
