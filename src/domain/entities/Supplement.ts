export interface Supplement {
  id: string;
  patientId: string;
  supplementName: string;
  dosage: string | null;
  supplementType: string;
  createdAt: string;
  updatedAt: string;
}
