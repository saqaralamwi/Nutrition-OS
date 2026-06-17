import { Paths, File, Directory } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

const DB_NAME = 'clinical_nutrition';
const BACKUP_FILENAME = 'adcn-clinical-backup.db';

const SQLITE_MAGIC_HEADER = new Uint8Array([
  0x53, 0x51, 0x4C, 0x69, 0x74, 0x65, 0x20, 0x66,
  0x6F, 0x72, 0x6D, 0x61, 0x74, 0x20, 0x33, 0x00,
]);

function getDatabasePath(): string {
  const docUri = Paths.document.uri.replace(/\/?$/, '');
  if (Platform.OS === 'android') {
    const baseDir = docUri.replace(/\/files$/, '');
    return `${baseDir}/databases/${DB_NAME}`;
  }
  return `${docUri}/${DB_NAME}`;
}

async function findDatabaseFile(): Promise<File | null> {
  const candidates = [
    getDatabasePath(),
    getDatabasePath() + '.db',
    getDatabasePath() + '.sqlite',
  ];

  for (const path of candidates) {
    try {
      const file = new File(path);
      if (file.exists) {
        return file;
      }
    } catch {
      continue;
    }
  }
  return null;
}

async function validateSqliteHeader(fileUri: string): Promise<boolean> {
  try {
    const response = await fetch(fileUri, { headers: { Range: 'bytes=0-15' } });
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    return (
      bytes.length === SQLITE_MAGIC_HEADER.length &&
      bytes.every((byte, i) => byte === SQLITE_MAGIC_HEADER[i])
    );
  } catch {
    return false;
  }
}

export async function exportBackup(): Promise<string> {
  const dbFile = await findDatabaseFile();
  if (!dbFile) {
    throw new Error('تعذر العثور على قاعدة البيانات للنسخ الاحتياطي.');
  }

  const backupFile = new File(Paths.cache, BACKUP_FILENAME);
  if (backupFile.exists) {
    backupFile.delete();
  }

  await dbFile.copy(backupFile, { overwrite: true });

  const isValid = await validateSqliteHeader(backupFile.uri);
  if (!isValid) {
    backupFile.delete();
    throw new Error('النسخة الاحتياطية تالفة. يرجى المحاولة مرة أخرى.');
  }

  const isSharingAvailable = await Sharing.isAvailableAsync();
  if (!isSharingAvailable) {
    backupFile.delete();
    throw new Error('المشاركة غير متاحة على هذا الجهاز.');
  }

  await Sharing.shareAsync(backupFile.uri, {
    mimeType: 'application/octet-stream',
    dialogTitle: 'تصدير النسخة الاحتياطية لقاعدة البيانات',
    UTI: 'public.data',
  });

  return backupFile.uri;
}

export async function importBackup(backupUri: string): Promise<void> {
  const isValid = await validateSqliteHeader(backupUri);
  if (!isValid) {
    throw new Error('الملف المحدد ليس قاعدة بيانات SQLite صالحة.');
  }

  const dbFile = await findDatabaseFile();
  if (!dbFile) {
    throw new Error('تعذر العثور على مسار قاعدة البيانات الحالية.');
  }

  const backupFile = new File(backupUri);
  const targetDir = dbFile.uri.substring(0, dbFile.uri.lastIndexOf('/'));
  const dir = new Directory(targetDir);
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }

  const { resetDatabase } = await import('../database/index');
  await resetDatabase();

  await backupFile.copy(dbFile, { overwrite: true });
}

export { validateSqliteHeader };
