export interface LabResult {
  id: string;
  patientId: string;
  testName: string;
  value: number;
  unit: string;
  normalLow?: number | null;
  normalHigh?: number | null;
  isAbnormal: boolean;
  severity?: string | null;
  testDate: string;
  collectedBy?: string | null;
  recordedBy?: string | null;
  labInstanceId?: string | null;
  notes?: string | null;
  notesAr?: string | null;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export type InterpretationResult = 'critically_low' | 'low' | 'normal' | 'high' | 'critically_high';
