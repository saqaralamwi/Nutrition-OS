import { MedicationRecord } from '../repositories/IMedicationRepository';
import { MedicationRepository } from '../../data/repositories/MedicationRepository';

export class AddMedicationUseCase {
  private repository: MedicationRepository;

  constructor() {
    this.repository = new MedicationRepository();
  }

  async execute(record: MedicationRecord): Promise<string> {
    if (!record.patientId) throw new Error('Patient ID is required');
    if (!record.drugName?.trim()) throw new Error('اسم الدواء مطلوب');
    if (!record.route?.trim()) throw new Error('طريقة الإعطاء مطلوبة');
    if (!record.dniRisk?.trim()) throw new Error('تقييم التفاعل دوائي غذائي مطلوب');
    return this.repository.save(record);
  }
}
