export interface MedicationRecord {
  id?: string;
  patientId: string;
  drugName?: string;
  dosage?: string;
  frequency?: string;
  route?: string;
  startDate?: string;
  endDate?: string;
  prescribingPhysician?: string;
  dniRisk?: string;
  dniNotes?: string;

  name?: string;
  nameAr?: string;
  type?: string;
  mlPerHour?: number;
  totalMlPerDay?: number;
  percent?: number;
  durationHours?: number;
  isActive?: boolean;
  notes?: string;
  notesAr?: string;
  hiddenCalories?: number;

  recordedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IMedicationRepository {
  getByPatientId(patientId: string): Promise<MedicationRecord[]>;
  save(record: MedicationRecord): Promise<string>;
  delete(id: string): Promise<void>;
}
