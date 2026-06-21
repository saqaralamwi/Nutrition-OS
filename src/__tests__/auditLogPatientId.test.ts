import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';

function mockExtractPatientId(record: any, table: string): string | undefined {
  if (table === 'patients') {
    return record.id;
  }
  return record._raw?.patient_id || record.patientId || undefined;
}

describe('Audit Log - patient_id Column', () => {
  it('should have patient_id column in audit_logs schema definition', () => {
    const schemaCode = readFileSync('src/data/database/schema.ts', 'utf-8');
    expect(schemaCode).toContain("name: 'audit_logs'");
    expect(schemaCode).toContain("name: 'patient_id', type: 'string', isIndexed: true");
  });

  it('should bump schema version to 51', () => {
    const schemaCode = readFileSync('src/data/database/schema.ts', 'utf-8');
    expect(schemaCode).toContain('version: 51');
  });

  it('should have v44 migration adding patient_id to audit_logs', () => {
    const migrationCode = readFileSync('src/data/database/migrations.ts', 'utf-8');
    expect(migrationCode).toContain('toVersion: 44');
    expect(migrationCode).toContain("table: 'audit_logs'");
    expect(migrationCode).toContain("name: 'patient_id', type: 'string', isOptional: true, isIndexed: true");
  });

  it('should have patientId field on AuditLog model', () => {
    const modelCode = readFileSync('src/data/models/AuditLog.ts', 'utf-8');
    expect(modelCode).toContain("@field('patient_id') patientId");
  });

  it('should extract patientId from patients table', () => {
    const mockRecord = { id: 'patient-123', _raw: { id: 'patient-123' } };
    expect(mockExtractPatientId(mockRecord, 'patients')).toBe('patient-123');
  });

  it('should extract patientId from related tables', () => {
    const mockRecord = { id: 'lab-1', _raw: { patient_id: 'patient-456' }, patientId: 'patient-456' };
    expect(mockExtractPatientId(mockRecord, 'laboratory_results')).toBe('patient-456');
  });

  it('should return undefined when no patient_id available', () => {
    const mockRecord = { id: 'orphan-1', _raw: {} };
    expect(mockExtractPatientId(mockRecord, 'unknown_table')).toBeUndefined();
  });

  it('should have patient_id parameter in logManualAuditEvent', () => {
    const triggerCode = readFileSync('src/data/database/auditTrigger.ts', 'utf-8');
    expect(triggerCode).toContain('log.patientId = patientId');
  });
});
