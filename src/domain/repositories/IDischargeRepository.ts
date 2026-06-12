export interface DischargeSummaryRecord {
  id?: string;
  patientId: string;
  dischargeDate: number;
  dischargeStatus: string;
  finalWeight: number;
  totalDaysOnEn?: number;
  totalDaysOnPn?: number;
  homeNutritionPlan: string;
  followUpRequired: boolean;
  nextFollowUpDate?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface IDischargeRepository {
  getByPatientId(patientId: string): Promise<DischargeSummaryRecord | null>;
  create(record: DischargeSummaryRecord): Promise<string>;
}
