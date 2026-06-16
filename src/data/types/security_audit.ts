export interface IClinicalAuditLog {
  actorId: string;
  actorName: string;
  actorRole: 'nutritionist' | 'pharmacist' | 'systems_consultant';
  actionType: 'NCP_OVERRIDE' | 'MEDICATION_BYPASS' | 'REPORT_GENERATION';
  patientId: string;
  metadataSnapshot: string;
  clinicalJustification: string;
  digitalFingerprintHash: string;
  createdAt: number;
}
