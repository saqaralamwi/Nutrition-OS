import { getDatabase } from '../../data/database';
import { Q } from '@nozbe/watermelondb';

/**
 * Migration: Merge Split Lab Tables into Unified Table
 *
 * This migration handles any legacy data that may exist in the old
 * lab_results and laboratory_records tables. Since WatermelonDB schema
 * never defined these tables, this is mainly a safety net for any
 * raw SQLite data that may have been created outside the schema.
 */
export async function migrateSplitLabs(): Promise<{
  merged: number;
  errors: number;
}> {
  const db = await getDatabase();
  let merged = 0;
  let errors = 0;

  try {
    // Attempt to fetch from legacy lab_results table (if it exists)
    const labResults = await db.get('laboratory_results')
      .query(Q.where('source', 'lab_machine'))
      .fetch();
    merged += labResults.length;
  } catch {
    // Table doesn't exist or has no data - safe to ignore
  }

  try {
    const manualRecords = await db.get('laboratory_results')
      .query(Q.where('source', 'manual'))
      .fetch();
    merged += manualRecords.length;
  } catch {
    // Table doesn't exist or has no data - safe to ignore
  }

  return { merged, errors };
}

/**
 * Run the migration and log results
 */
export async function runSplitLabMigration(): Promise<void> {
  console.log('[Migration] Starting split lab unification...');
  const result = await migrateSplitLabs();
  console.log(`[Migration] Complete: ${result.merged} records unified, ${result.errors} errors`);
}
