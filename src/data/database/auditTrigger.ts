import { Collection, Model } from '@nozbe/watermelondb';
import { useSettingsStore } from '../../presentation/stores/settingsStore';

const CRITICAL_TABLES = ['patients', 'lab_results', 'interventions', 'meal_plans'];

let triggersInstalled = false;

export function setupAuditTriggers() {
  if (triggersInstalled) return;
  triggersInstalled = true;

  const originalCreate = Collection.prototype.create;
  Collection.prototype.create = async function (recordBuilder) {
    const table = this.table;
    const record = await originalCreate.call(this, recordBuilder);

    if (CRITICAL_TABLES.includes(table) && table !== 'audit_logs') {
      try {
        const db = this.database;
        const auditCollection = db.collections.get('audit_logs');
        const activeUser = useSettingsStore.getState().username;

        await originalCreate.call(auditCollection, (log: any) => {
          log.actionType = 'EDIT_PATIENT';
          log.userId = activeUser;
          log.details = JSON.stringify({
            action: 'CREATE',
            table,
            recordId: record.id,
            values: record._raw,
          });
        });
      } catch (e) {
        console.error('[AuditTrigger] Create logging failed:', e);
      }
    }

    return record;
  };

  const originalUpdate = Model.prototype.update;
  Model.prototype.update = async function (recordBuilder) {
    const table = this.collection.table;
    const beforeValues = { ...this._raw };
    const record = await originalUpdate.call(this, recordBuilder);

    if (CRITICAL_TABLES.includes(table) && table !== 'audit_logs') {
      try {
        const db = this.collection.database;
        const auditCollection = db.collections.get('audit_logs');
        const activeUser = useSettingsStore.getState().username;

        await Collection.prototype.create.call(auditCollection, (log: any) => {
          log.actionType = 'EDIT_PATIENT';
          log.userId = activeUser;
          log.details = JSON.stringify({
            action: 'UPDATE',
            table,
            recordId: record.id,
            before: beforeValues,
            after: record._raw,
          });
        });
      } catch (e) {
        console.error('[AuditTrigger] Update logging failed:', e);
      }
    }

    return record;
  };
}

export async function logManualAuditEvent(
  actionType: 'LOGIN' | 'EDIT_PATIENT' | 'EXPORT_PDF' | 'DB_BACKUP',
  details: object
) {
  try {
    const { getDatabaseInstance } = require('./index');
    const db = getDatabaseInstance();
    if (!db) return;

    const activeUser = useSettingsStore.getState().username;
    await db.write(async () => {
      const collection = db.collections.get('audit_logs');
      await collection.create((log: any) => {
        log.actionType = actionType;
        log.userId = activeUser;
        log.details = JSON.stringify(details);
      });
    });
  } catch (err) {
    console.error('[AuditTrigger] Manual logging failed:', err);
  }
}
