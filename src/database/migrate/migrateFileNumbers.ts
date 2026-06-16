import { getDatabase } from '../../data/database';
import PatientModel from '../../data/models/Patient';
import FileNumberCounterModel from '../../data/models/FileNumberCounter';
import { Q } from '@nozbe/watermelondb';

/**
 * Migration: Convert Old File Numbers to New Sequential Format
 */
export async function migrateFileNumbers(): Promise<{ migrated: number; errors: number }> {
  const db = await getDatabase();
  const patientsCollection = db.get<PatientModel>('patients');
  const countersCollection = db.get<FileNumberCounterModel>('file_number_counters');

  const allPatients = await patientsCollection.query().fetch();
  let migrated = 0;
  let errors = 0;

  // Regex for new format, e.g. CN-2026-00001
  const newFormatRegex = /^CN-\d{4}-\d+$/;

  await db.write(async () => {
    for (const patient of allPatients) {
      // Skip if already new format
      if (newFormatRegex.test(patient.fileNumber)) {
        continue;
      }

      try {
        const year = patient.createdAt ? new Date(patient.createdAt).getFullYear() : new Date().getFullYear();
        
        // Find or create counter for this year
        const existingCounters = await countersCollection.query(
          Q.where('year', year)
        ).fetch();

        let counterRecord: FileNumberCounterModel;
        let nextCount = 1;

        if (existingCounters.length > 0) {
          counterRecord = existingCounters[0];
          nextCount = counterRecord.count + 1;
          await counterRecord.update((record) => {
            record.count = nextCount;
            record.lastIncrementedAt = new Date();
          });
        } else {
          counterRecord = await countersCollection.create((record) => {
            record.year = year;
            record.count = 1;
            record.lastIncrementedAt = new Date();
          });
          nextCount = 1;
        }

        const padded = String(nextCount).padStart(5, '0');
        const newFileNumber = `CN-${year}-${padded}`;

        await patient.update((record) => {
          record.fileNumber = newFileNumber;
        });

        migrated++;
      } catch (err) {
        console.error(`Failed to migrate patient ${patient.id}:`, err);
        errors++;
      }
    }
  });

  return { migrated, errors };
}
