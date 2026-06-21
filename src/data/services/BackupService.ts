import { Platform } from 'react-native';

const DB_NAME = 'clinical_nutrition';
const BACKUP_FILENAME = 'adcn-clinical-backup';

export const BACKUP_WARNING = '⚠️ هذا الملف يحتوي على معلومات صحية محمية (HIPAA). احفظه في مكان آمن ولا تشاركه مع أي شخص.';

const SQLITE_MAGIC_HEADER = new Uint8Array([
  0x53, 0x51, 0x4C, 0x69, 0x74, 0x65, 0x20, 0x66,
  0x6F, 0x72, 0x6D, 0x61, 0x74, 0x20, 0x33, 0x00,
]);

async function loadFs(): Promise<typeof import('expo-file-system')> {
  return import('expo-file-system');
}

function getDatabasePath(docUri: string): string {
  if (Platform.OS === 'android') {
    const baseDir = docUri.replace(/\/files$/, '');
    return `${baseDir}/databases/${DB_NAME}`;
  }
  return `${docUri}/${DB_NAME}`;
}

async function findDatabaseFile(): Promise<any> {
  const { Paths, File } = await loadFs();
  const docUri = Paths.document.uri.replace(/\/?$/, '');
  const candidates = [
    getDatabasePath(docUri),
    getDatabasePath(docUri) + '.db',
    getDatabasePath(docUri) + '.sqlite',
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

function getCrypto(): Crypto {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto;
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto;
  }
  throw new Error('Web Crypto API غير متاحة على هذا الجهاز.');
}

async function deriveKey(passphrase: string, salt: Uint8Array, usage: KeyUsage[]): Promise<CryptoKey> {
  const crypto = getCrypto();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as unknown as ArrayBuffer, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    usage,
  );
}

export async function encryptBackup(data: string, passphrase: string): Promise<string> {
  const crypto = getCrypto();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt, ['encrypt']);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(data),
  );
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);
  return btoa(String.fromCharCode(...combined));
}

export async function decryptBackup(encryptedData: string, passphrase: string): Promise<string> {
  const crypto = getCrypto();
  const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const encrypted = combined.slice(28);
  const key = await deriveKey(passphrase, salt, ['decrypt']);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted,
  );
  return new TextDecoder().decode(decrypted);
}

async function exportWebBackup(): Promise<string> {
  const { getDatabase } = await import('../database/index');
  const db = await getDatabase();

  const backup: Record<string, any> = {};

  for (const [tableName, collection] of Object.entries(db.collections)) {
    const records = await collection.query().fetch();
    backup[tableName] = records.map((r: any) => r._raw);
  }

  backup._meta = {
    exportedAt: new Date().toISOString(),
    platform: 'web',
    schemaVersion: 41,
    recordCounts: Object.fromEntries(
      Object.entries(backup).map(([k, v]) => [k, (v as any[]).length]),
    ),
  };

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${BACKUP_FILENAME}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return 'web';
}

async function exportNativeBackup(): Promise<string> {
  const { Paths, File } = await loadFs();
  const Sharing = await import('expo-sharing');

  const dbFile = await findDatabaseFile();
  if (!dbFile) {
    throw new Error('تعذر العثور على قاعدة البيانات للنسخ الاحتياطي.');
  }

  const backupFile = new File(Paths.cache, `${BACKUP_FILENAME}.db`);
  if (backupFile.exists) {
    backupFile.delete();
  }

  await dbFile.copy(backupFile.uri, { overwrite: true });

  const isValid = await validateSqliteHeader(backupFile.uri);
  if (!isValid) {
    backupFile.delete();
    throw new Error('النسخة الاحتياطية تالفة. يرجى المحاولة مرة أخرى.');
  }

  const isSharingAvailable = await Sharing.isAvailableAsync();
  if (!isSharingAvailable) {
    console.warn('[BackupService] Sharing not available on this device; backup file saved locally.');
    return backupFile.uri;
  }

  await Sharing.shareAsync(backupFile.uri, {
    mimeType: 'application/octet-stream',
    dialogTitle: 'تصدير النسخة الاحتياطية لقاعدة البيانات',
    UTI: 'public.data',
  });

  return backupFile.uri;
}

export async function exportBackup(): Promise<string> {
  if (Platform.OS === 'web') {
    return exportWebBackup();
  }
  return exportNativeBackup();
}

export async function importBackup(backupUri: string): Promise<void> {
  if (Platform.OS === 'web') {
    throw new Error('استعادة النسخ الاحتياطي غير متاحة على متصفح الويب.');
  }

  const isValid = await validateSqliteHeader(backupUri);
  if (!isValid) {
    throw new Error('الملف المحدد ليس قاعدة بيانات SQLite صالحة.');
  }

  const { File, Directory } = await loadFs();

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

export async function exportEncryptedBackup(passphrase: string): Promise<string> {
  const { getDatabase } = await import('../database/index');
  const db = await getDatabase();

  const backup: Record<string, any> = {};

  for (const [tableName, collection] of Object.entries(db.collections)) {
    const records = await collection.query().fetch();
    backup[tableName] = records.map((r: any) => r._raw);
  }

  backup._meta = {
    exportedAt: new Date().toISOString(),
    platform: 'web',
    schemaVersion: 41,
    recordCounts: Object.fromEntries(
      Object.entries(backup).map(([k, v]) => [k, (v as any[]).length]),
    ),
  };

  const jsonString = JSON.stringify(backup);
  const encrypted = await encryptBackup(jsonString, passphrase);

  return `${BACKUP_WARNING}
${encrypted}`;
}

export async function importEncryptedBackup(encryptedContent: string, passphrase: string): Promise<Record<string, any>> {
  const lines = encryptedContent.split('\n');
  const encrypted = lines.slice(1).join('\n');
  const decrypted = await decryptBackup(encrypted, passphrase);
  return JSON.parse(decrypted);
}

export interface PassphraseValidation {
  passphrase: string;
  confirmPassphrase: string;
  strength: 'weak' | 'medium' | 'strong';
}

export function validatePassphrase(passphrase: string): PassphraseValidation {
  const strength = passphrase.length >= 12 ? 'strong' : passphrase.length >= 8 ? 'medium' : 'weak';
  return {
    passphrase,
    confirmPassphrase: '',
    strength,
  };
}

export { validateSqliteHeader };
