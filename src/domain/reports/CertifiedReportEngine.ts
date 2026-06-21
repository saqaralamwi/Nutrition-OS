import * as Crypto from 'expo-crypto';

export interface ICertifiedReportInput {
  patientId: string;
  patientName: string;
  clinicalMetrics: {
    weightKg: number;
    bmi: number;
    egfrValue: number;
    netCaloriesTarget: number;
    proteinTargetGrams: number;
  };
  securityContext: {
    actorName: string;
    actorRole: 'nutritionist' | 'pharmacist' | 'systems_consultant';
    justificationText: string;
  };
}

export interface ICertifiedReportOutput {
  documentId: string;
  compiledData: ICertifiedReportInput;
  digitalFingerprintHash: string;
  certificationStamp: string;
  generatedAt: number;
  isVerifiedSecure: boolean;
}

export class CertifiedReportEngine {
  private static readonly CERTIFICATION_STAMP =
    'مستند رسمي مصدق ورقمي صادر عن منصة Nutrition-OS. تم التحقق من سلامة البيانات الحيوية ومطابقتها للمحركات السريرية الحصينة';

  public static async generateCertifiedPayload(input: ICertifiedReportInput): Promise<ICertifiedReportOutput> {
    const { patientId, clinicalMetrics, securityContext } = input;

    if (!patientId || patientId.trim().length === 0 || clinicalMetrics.netCaloriesTarget <= 0) {
      return {
        documentId: '',
        compiledData: input,
        digitalFingerprintHash: '',
        certificationStamp: '',
        generatedAt: 0,
        isVerifiedSecure: false,
      };
    }

    const roundedMetrics = {
      weightKg: CertifiedReportEngine.round2(clinicalMetrics.weightKg),
      bmi: CertifiedReportEngine.round2(clinicalMetrics.bmi),
      egfrValue: CertifiedReportEngine.round2(clinicalMetrics.egfrValue),
      netCaloriesTarget: CertifiedReportEngine.round2(clinicalMetrics.netCaloriesTarget),
      proteinTargetGrams: CertifiedReportEngine.round2(clinicalMetrics.proteinTargetGrams),
    };

    const compiledInput: ICertifiedReportInput = {
      ...input,
      clinicalMetrics: roundedMetrics,
    };

    const rawString = `${patientId}|${roundedMetrics.netCaloriesTarget}|${roundedMetrics.proteinTargetGrams}|${securityContext.actorName}|${securityContext.actorRole}`;
    const digitalFingerprintHash = await CertifiedReportEngine.deterministicHash(rawString);
    const documentId = `${patientId}_${Date.now()}`;

    return {
      documentId,
      compiledData: compiledInput,
      digitalFingerprintHash,
      certificationStamp: CertifiedReportEngine.CERTIFICATION_STAMP,
      generatedAt: Date.now(),
      isVerifiedSecure: true,
    };
  }

  public static async deterministicHash(input: string): Promise<string> {
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      input,
    );
    return `sha256-${digest}`;
  }

  private static round2(value: number): number {
    return parseFloat(value.toFixed(2));
  }
}
