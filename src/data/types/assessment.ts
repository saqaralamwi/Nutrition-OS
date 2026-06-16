export type EdemaGrade = 'NONE' | 'GRADE_1' | 'GRADE_2' | 'GRADE_3' | 'GRADE_4';
export type AscitesSeverity = 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE';
export type WestHavenGrade = 'GRADE_0' | 'GRADE_1' | 'GRADE_2' | 'GRADE_3' | 'GRADE_4';

export interface RawAssessmentInput {
  patientId: string;
  actualWeight: number;
  edema: EdemaGrade;
  ascites: AscitesSeverity;

  labs: {
    serumAmmonia?: number;
    serumAlbumin?: number;
    potassium?: number;
    sodium?: number;
  };

  clinical: {
    gcsScore: number;
    westHaven?: WestHavenGrade;
  };
}
