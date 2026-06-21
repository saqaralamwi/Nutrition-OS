import { describe, it, expect } from 'vitest';
import {
  encryptBackup,
  decryptBackup,
  validatePassphrase,
  BACKUP_WARNING,
} from '../BackupService';

describe('BackupService', () => {
  it('should encrypt and decrypt correctly', async () => {
    const data = JSON.stringify({ patient: 'test', weight: 70 });
    const passphrase = 'strongPassphrase123';

    const encrypted = await encryptBackup(data, passphrase);
    const decrypted = await decryptBackup(encrypted, passphrase);

    expect(decrypted).toBe(data);
  });

  it('should produce different ciphertexts for same data (random IV+salt)', async () => {
    const data = JSON.stringify({ patient: 'test', weight: 70 });
    const passphrase = 'strongPassphrase123';

    const encrypted1 = await encryptBackup(data, passphrase);
    const encrypted2 = await encryptBackup(data, passphrase);

    expect(encrypted1).not.toBe(encrypted2);
  });

  it('should throw error if passphrase is wrong', async () => {
    const data = JSON.stringify({ patient: 'test', weight: 70 });
    const passphrase = 'strongPassphrase123';
    const wrongPassphrase = 'wrongPassphrase';

    const encrypted = await encryptBackup(data, passphrase);

    await expect(decryptBackup(encrypted, wrongPassphrase)).rejects.toThrow();
  });

  it('should handle empty data', async () => {
    const data = '';
    const passphrase = 'testPassphrase123';

    const encrypted = await encryptBackup(data, passphrase);
    const decrypted = await decryptBackup(encrypted, passphrase);

    expect(decrypted).toBe(data);
  });

  it('should handle Arabic and Unicode data', async () => {
    const data = JSON.stringify({
      name: 'محمد',
      diagnosis: 'ارتفاع الكوليسترول',
      notes: 'نظام غذائي ✅',
    });
    const passphrase = 'strongPassphrase123';

    const encrypted = await encryptBackup(data, passphrase);
    const decrypted = await decryptBackup(encrypted, passphrase);

    expect(decrypted).toBe(data);
  });

  it('should include BACKUP_WARNING', () => {
    expect(BACKUP_WARNING).toContain('HIPAA');
    expect(BACKUP_WARNING).toContain('⚠️');
  });

  it('should validate passphrase strength', () => {
    expect(validatePassphrase('short').strength).toBe('weak');
    expect(validatePassphrase('medium12').strength).toBe('medium');
    expect(validatePassphrase('strongPass123').strength).toBe('strong');
  });

  it('should validate passphrase edge cases', () => {
    const weak = validatePassphrase('ab');
    expect(weak.strength).toBe('weak');
    expect(weak.passphrase).toBe('ab');

    const boundary = validatePassphrase('12345678');
    expect(boundary.strength).toBe('medium');

    const strong = validatePassphrase('123456789012');
    expect(strong.strength).toBe('strong');
  });
});
