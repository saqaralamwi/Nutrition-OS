import { describe, it, expect, vi } from 'vitest';

vi.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digestStringAsync: vi.fn(async (_algorithm: string, data: string) => {
    let hash1 = 0xdeadbeef;
    let hash2 = 0x41c6ce57;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash1 = ((hash1 << 5) - hash1 + char) | 0;
      hash2 = ((hash2 << 13) - hash2 + char) | 0;
      hash1 = (hash1 ^ (hash2 >>> 16)) | 0;
      hash2 = (hash2 ^ (hash1 >>> 8)) | 0;
    }
    return ((hash1 >>> 0).toString(16).padStart(8, '0')) +
      ((hash2 >>> 0).toString(16).padStart(8, '0'));
  }),
}));

import { CertifiedReportEngine } from '../CertifiedReportEngine';

const validInput = {
  patientId: 'P-001',
  patientName: 'فاطمة الزهراء',
  clinicalMetrics: {
    weightKg: 72.5,
    bmi: 26.8,
    egfrValue: 95.3,
    netCaloriesTarget: 1800,
    proteinTargetGrams: 90,
  },
  securityContext: {
    actorName: 'د. أحمد',
    actorRole: 'nutritionist' as const,
    justificationText: 'تعديل السعرات حسب مؤشرات المريض السريرية',
  },
};

describe('CertifiedReportEngine', () => {
  it('generates deterministic fingerprint hash for identical inputs', async () => {
    const result1 = await CertifiedReportEngine.generateCertifiedPayload(validInput);
    const result2 = await CertifiedReportEngine.generateCertifiedPayload(validInput);

    expect(result1.isVerifiedSecure).toBe(true);
    expect(result1.digitalFingerprintHash).toBeTruthy();
    expect(result1.digitalFingerprintHash).toMatch(/^sha256-/);
    expect(result1.digitalFingerprintHash).toBe(result2.digitalFingerprintHash);
    expect(result1.certificationStamp).toContain('Nutrition-OS');
  });

  it('small change in netCaloriesTarget produces different hash (avalanche)', async () => {
    const inputA = { ...validInput };
    const inputB = {
      ...validInput,
      clinicalMetrics: { ...validInput.clinicalMetrics, netCaloriesTarget: 1800.01 },
    };

    const resultA = await CertifiedReportEngine.generateCertifiedPayload(inputA);
    const resultB = await CertifiedReportEngine.generateCertifiedPayload(inputB);

    expect(resultA.digitalFingerprintHash).not.toBe(resultB.digitalFingerprintHash);
  });

  it('invalid input (empty patientId) returns unverified payload', async () => {
    const result = await CertifiedReportEngine.generateCertifiedPayload({
      ...validInput,
      patientId: '',
    });

    expect(result.isVerifiedSecure).toBe(false);
    expect(result.documentId).toBe('');
    expect(result.digitalFingerprintHash).toBe('');
  });
});
