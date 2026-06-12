export interface Medication {
  id: string;
  patientId: string;
  drugName: string;
  dosage: string | null;
  frequency: string | null;
  route: string;
  startDate: string | null;
  endDate: string | null;
  prescribingPhysician: string | null;
  dniRisk: string;
  dniNotes: string | null;
  createdAt: string;
  updatedAt: string;
}
