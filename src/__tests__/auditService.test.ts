import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { audit, generateAuditId } from '../data/services/AuditService';

describe('AuditService - audit()', () => {
  it('should include patient_id in audit log entry', () => {
    const entry = audit('view_patient', 'user1', 'patient1');
    expect(entry.patientId).toBe('patient1');
  });

  it('should include userId in audit log entry', () => {
    const entry = audit('edit_patient', 'user2', 'patient1');
    expect(entry.userId).toBe('user2');
  });

  it('should include action type in audit log entry', () => {
    const entry = audit('delete_patient', 'user1', 'patient1');
    expect(entry.action).toBe('delete_patient');
  });

  it('should generate unique IDs', () => {
    const id1 = generateAuditId();
    const id2 = generateAuditId();
    expect(id1).not.toBe(id2);
  });

  it('should timestamp audit entries', () => {
    const before = Date.now();
    const entry = audit('view_patient', 'user1', 'patient1');
    const after = Date.now();
    expect(entry.timestamp.getTime()).toBeGreaterThanOrEqual(before);
    expect(entry.timestamp.getTime()).toBeLessThanOrEqual(after);
  });
});

describe('AuditService - source file structure', () => {
  it('should export logAudit function', () => {
    const code = readFileSync('src/data/services/AuditService.ts', 'utf-8');
    expect(code).toContain('export async function logAudit');
  });

  it('should export getAuditLogsByPatient function', () => {
    const code = readFileSync('src/data/services/AuditService.ts', 'utf-8');
    expect(code).toContain('export async function getAuditLogsByPatient');
  });

  it('should export getAuditLogsByUser function', () => {
    const code = readFileSync('src/data/services/AuditService.ts', 'utf-8');
    expect(code).toContain('export async function getAuditLogsByUser');
  });

  it('should export getAuditLogsByAction function', () => {
    const code = readFileSync('src/data/services/AuditService.ts', 'utf-8');
    expect(code).toContain('export async function getAuditLogsByAction');
  });

  it('should export countAuditLogsByPatient function', () => {
    const code = readFileSync('src/data/services/AuditService.ts', 'utf-8');
    expect(code).toContain('export async function countAuditLogsByPatient');
  });

  it('should use Q API for WatermelonDB queries', () => {
    const code = readFileSync('src/data/services/AuditService.ts', 'utf-8');
    expect(code).toContain("import { Q } from '@nozbe/watermelondb'");
    expect(code).toContain('Q.where');
    expect(code).toContain('Q.sortBy');
  });

  it('should use getDatabase for DB access', () => {
    const code = readFileSync('src/data/services/AuditService.ts', 'utf-8');
    expect(code).toContain('getDatabase');
  });
});

describe('AuditLogViewer component', () => {
  it('should export default component', () => {
    const code = readFileSync('src/presentation/components/AuditLogViewer.tsx', 'utf-8');
    expect(code).toContain('export default function AuditLogViewer');
  });

  it('should accept patientId prop', () => {
    const code = readFileSync('src/presentation/components/AuditLogViewer.tsx', 'utf-8');
    expect(code).toContain('patientId: string');
  });

  it('should call getAuditLogsByPatient', () => {
    const code = readFileSync('src/presentation/components/AuditLogViewer.tsx', 'utf-8');
    expect(code).toContain('getAuditLogsByPatient');
  });
});
