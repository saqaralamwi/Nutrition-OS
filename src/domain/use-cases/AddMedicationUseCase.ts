import { MedicationRecord } from '../repositories/IMedicationRepository';
import { MedicationRepository } from '../../data/repositories/MedicationRepository';

export class AddMedicationUseCase {
  private repository: MedicationRepository;

  constructor() {
    this.repository = new MedicationRepository();
  }

  async execute(record: MedicationRecord): Promise<string> {
    if (!record.patientId) throw new Error('Patient ID is required');
    if (!record.drugName?.trim()) {
      record.drugName = record.name;
    }
    if (!record.drugName?.trim()) throw new Error('اسم الدواء مطلوب');
    if (!record.route?.trim()) {
      record.route = 'IV';
    }
    if (!record.dniRisk?.trim()) {
      record.dniRisk = 'low';
    }
    return this.repository.save(record);
  }
}
