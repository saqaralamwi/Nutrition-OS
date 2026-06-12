export type EntityType = 'patient' | 'patient_metrics' | 'nutrition_plan';

export type SyncAction = 'create' | 'update' | 'delete';

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface SyncOperation {
  id: number;
  entityType: EntityType;
  entityId: string;
  action: SyncAction;
  payload: string;
  status: SyncStatus;
  retryCount: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SyncStats {
  pending: number;
  synced: number;
  failed: number;
  total: number;
}

export interface SyncResult {
  pushed: number;
  pushedErrors: number;
  pulled: number;
  pulledErrors: number;
}

export interface SyncMetadata {
  id: string;
  entityType: EntityType;
  lastSyncedAt: string;
}

export const MAX_RETRY_COUNT = 5;

export const SYNC_TABLE_MAP: Record<EntityType, string> = {
  patient: 'patients',
  patient_metrics: 'patient_metrics',
  nutrition_plan: 'nutrition_plans',
};

export const SYNC_METADATA_IDS: Record<EntityType, string> = {
  patient: 'meta_patients_last_sync',
  patient_metrics: 'meta_metrics_last_sync',
  nutrition_plan: 'meta_plans_last_sync',
};
