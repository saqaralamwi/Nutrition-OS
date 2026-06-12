import { LaboratoryRecordRecord } from '../repositories/ILaboratoryRepository';
import { LaboratoryRepository } from '../../data/repositories/LaboratoryRepository';

export interface AddLaboratoryRecordInput {
  patientId: string;
  testDate: number;
  testType: string;
  alt?: number;
  ast?: number;
  albumin?: number;
  bilirubin?: number;
  potassium?: number;
  sodium?: number;
  phosphorus?: number;
  urea?: number;
  creatinine?: number;
  bloodGlucose?: number;
  hba1c?: number;
}

export class AddLaboratoryRecordUseCase {
  private repository: LaboratoryRepository;

  constructor() {
    this.repository = new LaboratoryRepository();
  }

  async execute(input: AddLaboratoryRecordInput): Promise<string> {
    const record: LaboratoryRecordRecord = {
      patientId: input.patientId,
      testDate: input.testDate,
      testType: input.testType,
      alt: input.alt,
      ast: input.ast,
      albumin: input.albumin,
      bilirubin: input.bilirubin,
      potassium: input.potassium,
      sodium: input.sodium,
      phosphorus: input.phosphorus,
      urea: input.urea,
      creatinine: input.creatinine,
      bloodGlucose: input.bloodGlucose,
      hba1c: input.hba1c,
    };

    return this.repository.create(record);
  }
}
