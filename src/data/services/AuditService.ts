import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../database';
import AuditLogModel from '../models/AuditLog';

export type AuditActionType = 'view_patient' | 'edit_patient' | 'delete_patient' | 'create_patient' | 'LOGIN' | 'EDIT_PATIENT' | 'EXPORT_PDF' | 'DB_BACKUP';

export interface AuditLogEntry {
  id: string;
  action: AuditActionType;
  timestamp: Date;
  userId: string;
  patientId: string;
  details?: string;
}

let counter = 0;

export function generateAuditId(): string {
  counter += 1;
  return `audit_${Date.now()}_${counter}`;
}

export function audit(
  action: AuditActionType,
  userId: string,
  patientId: string,
  details?: string
): AuditLogEntry {
  return {
    id: generateAuditId(),
    action,
    timestamp: new Date(),
    userId,
    patientId,
    details,
  };
}

export async function logAudit(
  entry: AuditLogEntry
): Promise<void> {
  const db = await getDatabase();
  await db.write(async () => {
    const collection = db.get<AuditLogModel>('audit_logs');
    await collection.create((log: any) => {
      log.actionType = entry.action;
      log.userId = entry.userId;
      log.patientId = entry.patientId;
      log.details = entry.details || JSON.stringify({ action: entry.action });
    });
  });
}

export async function getAuditLogsByPatient(
  patientId: string,
  limit: number = 100
): Promise<AuditLogEntry[]> {
  const db = await getDatabase();
  const logs = await db.get<AuditLogModel>('audit_logs')
    .query(
      Q.where('patient_id', patientId),
      Q.sortBy('created_at', 'desc'),
      Q.take(limit)
    )
    .fetch();

  return logs.map(toEntry);
}

export async function getAuditLogsByUser(
  userId: string,
  limit: number = 100
): Promise<AuditLogEntry[]> {
  const db = await getDatabase();
  const logs = await db.get<AuditLogModel>('audit_logs')
    .query(
      Q.where('user_id', userId),
      Q.sortBy('created_at', 'desc'),
      Q.take(limit)
    )
    .fetch();

  return logs.map(toEntry);
}

export async function getAuditLogsByAction(
  action: AuditActionType,
  limit: number = 100
): Promise<AuditLogEntry[]> {
  const db = await getDatabase();
  const logs = await db.get<AuditLogModel>('audit_logs')
    .query(
      Q.where('action_type', action),
      Q.sortBy('created_at', 'desc'),
      Q.take(limit)
    )
    .fetch();

  return logs.map(toEntry);
}

export async function getRecentAuditLogs(
  limit: number = 100
): Promise<AuditLogEntry[]> {
  const db = await getDatabase();
  const logs = await db.get<AuditLogModel>('audit_logs')
    .query(
      Q.sortBy('created_at', 'desc'),
      Q.take(limit)
    )
    .fetch();

  return logs.map(toEntry);
}

export async function countAuditLogsByPatient(
  patientId: string
): Promise<number> {
  const db = await getDatabase();
  const count = await db.get<AuditLogModel>('audit_logs')
    .query(Q.where('patient_id', patientId))
    .fetchCount();

  return count;
}

function toEntry(model: AuditLogModel): AuditLogEntry {
  return {
    id: model.id,
    action: model.actionType as AuditActionType,
    timestamp: model.createdAt,
    userId: model.userId,
    patientId: model.patientId,
  };
}
