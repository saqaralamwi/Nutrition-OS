import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../database';

export interface DraftInfo {
  screenKey: string;
  label: string;
  moduleRoute: string;
  lastSavedAt: number | null;
  hasDraft: boolean;
}

const DRAFT_TABLES: { table: string; screenKey: string; label: string; moduleRoute: string; dateField: string }[] = [
  { table: 'anemia_assessments', screenKey: 'anemia-assessment', label: 'تقييم فقر الدم', moduleRoute: 'anemia-assessment', dateField: 'created_at' },
  { table: 'cardiovascular_assessments', screenKey: 'cardio-assessment', label: 'تقييم القلب والأوعية', moduleRoute: 'cardio-assessment', dateField: 'recorded_at' },
  { table: 'calculations', screenKey: 'calculations', label: 'حسابات الطاقة', moduleRoute: 'calculations', dateField: 'created_at' },
];

async function fetchLastTimestamp(db: any, table: string, patientId: string, dateField: string): Promise<number | null> {
  const records = await db
    .get(table)
    .query(
      Q.where('patient_id', patientId),
      ...(table === 'calculations' ? [Q.where('calculation_type', 'calculation_inputs')] : []),
      Q.sortBy(dateField, Q.desc),
      Q.take(1),
    )
    .fetch();

  if (records.length === 0) return null;

  const raw = records[0]._raw;
  const ts = raw[dateField] ?? raw.created_at ?? null;
  return ts != null ? Number(ts) : null;
}

export async function getPatientDrafts(patientId: string): Promise<DraftInfo[]> {
  const db = await getDatabase();
  const results: DraftInfo[] = [];

  for (const { table, screenKey, label, moduleRoute, dateField } of DRAFT_TABLES) {
    const lastSavedAt = await fetchLastTimestamp(db, table, patientId, dateField);
    results.push({ screenKey, label, moduleRoute, lastSavedAt, hasDraft: lastSavedAt !== null });
  }

  return results;
}

export async function hasAnyDraft(patientId: string): Promise<boolean> {
  const drafts = await getPatientDrafts(patientId);
  return drafts.some((d) => d.hasDraft);
}

export async function dismissDraft(patientId: string, table: string): Promise<void> {
  const db = await getDatabase();

  const records = await db
    .get(table)
    .query(
      Q.where('patient_id', patientId),
      ...(table === 'calculations' ? [Q.where('calculation_type', 'calculation_inputs')] : []),
    )
    .fetch();

  if (records.length === 0) return;

  await db.write(async () => {
    for (const record of records) {
      await record.markAsDeleted();
    }
  });
}

export async function dismissAllDrafts(patientId: string): Promise<void> {
  for (const { table } of DRAFT_TABLES) {
    await dismissDraft(patientId, table);
  }
}
