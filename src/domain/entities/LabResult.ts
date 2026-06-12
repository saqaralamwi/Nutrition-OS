export interface LabResult {
  id: string;
  patientId: string;
  testName: string;
  resultValue: number;
  unit: string;
  referenceRangeLow: number;
  referenceRangeHigh: number;
  interpretation: InterpretationResult;
  overrideReason: string | null;
  testDate: string;
  comments: string | null;
  attachedImagePath: string | null;
  createdAt: string;
  updatedAt: string;
}

export type InterpretationResult = 'critically_low' | 'low' | 'normal' | 'high' | 'critically_high';
