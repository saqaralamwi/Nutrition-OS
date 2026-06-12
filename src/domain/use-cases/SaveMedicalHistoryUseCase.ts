import { MedicalHistoryRecord } from '../repositories/IMedicalHistoryRepository';
import { MedicalHistoryRepository } from '../../data/repositories/MedicalHistoryRepository';

export class SaveMedicalHistoryUseCase {
  private repository: MedicalHistoryRepository;

  constructor() {
    this.repository = new MedicalHistoryRepository();
  }

  async execute(record: MedicalHistoryRecord): Promise<string> {
    if (!record.patientId) {
      throw new Error('Patient ID is required');
    }
    if (!record.chiefComplaint?.trim()) {
      throw new Error('الشكوى الرئيسية مطلوبة');
    }
    if (!record.currentDiagnosis?.trim()) {
      throw new Error('التشخيص الحالي مطلوب');
    }
    if (!record.covid19Status?.trim()) {
      throw new Error('حالة كوفيد-19 مطلوبة');
    }
    return this.repository.save(record);
  }
}
