import { LabResultRecord } from '../repositories/ILabResultRepository';
import { LabResultRepository } from '../../data/repositories/LabResultRepository';
import { InterpretLabResultUseCase } from './InterpretLabResultUseCase';

export class AddLabResultUseCase {
  private repository: LabResultRepository;
  private interpreter: InterpretLabResultUseCase;

  constructor() {
    this.repository = new LabResultRepository();
    this.interpreter = new InterpretLabResultUseCase();
  }

  async execute(record: LabResultRecord, criticalLowFactor?: number | null, criticalHighFactor?: number | null): Promise<string> {
    if (!record.patientId) throw new Error('Patient ID is required');
    if (!record.testName?.trim()) throw new Error('اسم الفحص مطلوب');
    if (record.resultValue == null || isNaN(record.resultValue)) throw new Error('النتيجة مطلوبة');
    if (!record.unit?.trim()) throw new Error('الوحدة مطلوبة');

    const interpretation = this.interpreter.execute({
      resultValue: record.resultValue,
      referenceRangeLow: record.referenceRangeLow,
      referenceRangeHigh: record.referenceRangeHigh,
      criticalLowFactor,
      criticalHighFactor,
    });

    return this.repository.save({
      ...record,
      interpretation,
    });
  }
}
