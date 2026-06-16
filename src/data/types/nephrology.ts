export interface IRenalAssessment {
  patientId: string;
  serumCreatinine: number;
  bun: number;
  serumPotassium: number;
  serumPhosphorus: number;
  serumSodium: number;
  ckdStage: 'stage_1' | 'stage_2' | 'stage_3' | 'stage_4' | 'stage_5';
  dialysisStatus: 'none' | 'hemodialysis' | 'peritoneal';
  measuredUrineOutput: number;
  recordedAt: number;
}
