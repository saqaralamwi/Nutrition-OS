import { describe, it, expect } from 'vitest';
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
  it('generates deterministic fingerprint hash for identical inputs', () => {
    const result1 = CertifiedReportEngine.generateCertifiedPayload(validInput);
    const result2 = CertifiedReportEngine.generateCertifiedPayload(validInput);

    expect(result1.isVerifiedSecure).toBe(true);
    expect(result1.digitalFingerprintHash).toBeTruthy();
    expect(result1.digitalFingerprintHash).toMatch(/^sha256-/);
    expect(result1.digitalFingerprintHash).toBe(result2.digitalFingerprintHash);
    expect(result1.certificationStamp).toContain('Nutrition-OS');
  });

  it('small change in netCaloriesTarget produces different hash (avalanche)', () => {
    const inputA = { ...validInput };
    const inputB = {
      ...validInput,
      clinicalMetrics: { ...validInput.clinicalMetrics, netCaloriesTarget: 1800.01 },
    };

    const resultA = CertifiedReportEngine.generateCertifiedPayload(inputA);
    const resultB = CertifiedReportEngine.generateCertifiedPayload(inputB);

    expect(resultA.digitalFingerprintHash).not.toBe(resultB.digitalFingerprintHash);
  });

  it('invalid input (empty patientId) returns unverified payload', () => {
    const result = CertifiedReportEngine.generateCertifiedPayload({
      ...validInput,
      patientId: '',
    });

    expect(result.isVerifiedSecure).toBe(false);
    expect(result.documentId).toBe('');
    expect(result.digitalFingerprintHash).toBe('');
  });
});
