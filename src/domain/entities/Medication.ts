export interface Medication {
  id: string;
  patientId: string;
  drugName?: string;
  dosage: string | null;
  frequency: string | null;
  route?: string;
  startDate: string | null;
  endDate: string | null;
  prescribingPhysician: string | null;
  dniRisk?: string;
  dniNotes: string | null;
  
  name?: string;
  nameAr?: string;
  type?: string;
  mlPerHour?: number;
  totalMlPerDay?: number;
  percent?: number;
  durationHours?: number;
  isActive?: boolean;
  notes?: string | null;
  notesAr?: string | null;
  hiddenCalories?: number;

  createdAt: string;
  updatedAt: string;
}
