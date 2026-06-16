import { ParsedLabResult, OcrRawData } from './ocrTypes';

export interface OcrConfidenceReport {
  overallConfidence: number;
  perFieldConfidence: Record<string, number>;
  extractionMethod: 'ocr_high' | 'ocr_medium' | 'ocr_low' | 'manual';
  lowConfidenceFields: string[];
  needsReview: boolean;
}

function normalizeTesseractWords(words: OcrRawData['words']): number {
  if (!words || words.length === 0) return 50;
  const avg = words.reduce((sum, w) => sum + (w.confidence ?? 0), 0) / words.length;
  return Math.round(Math.min(100, Math.max(0, avg)));
}

function computeExtractionConfidence(
  testName: string,
  rawText: string,
  resultValue: number
): number {
  const lines = rawText.split('\n');
  let bestScore = 0;

  for (const line of lines) {
    const trimmed = line.trim().toLowerCase();
    if (!trimmed) continue;

    const testLower = testName.toLowerCase();
    const valueStr = String(resultValue);

    const exactMatch = new RegExp(`\\b${testLower}\\b`, 'i');
    const hasExact = exactMatch.test(trimmed);
    const valueNearby = trimmed.includes(valueStr);

    let score = 0;
    if (hasExact && valueNearby) {
      score = 95;
    } else if (hasExact) {
      score = 80;
    } else if (trimmed.includes(testLower) && valueNearby) {
      score = 65;
    } else if (trimmed.includes(testLower)) {
      score = 50;
    } else if (valueNearby) {
      score = 30;
    }

    if (score > bestScore) bestScore = score;
  }

  return bestScore;
}

function computeOverallConfidence(ocrConfidence: number, fieldConfidences: number[]): number {
  if (fieldConfidences.length === 0) return ocrConfidence;
  const avgField = fieldConfidences.reduce((a, b) => a + b, 0) / fieldConfidences.length;
  return Math.round((ocrConfidence * 0.4 + avgField * 0.6));
}

export function analyzeOcrConfidence(
  ocrRawData: OcrRawData | null,
  parsedResults: ParsedLabResult[],
  rawText: string
): OcrConfidenceReport {
  const ocrConfidence = ocrRawData?.words
    ? normalizeTesseractWords(ocrRawData.words)
    : 70;

  const perFieldConfidence: Record<string, number> = {};
  const lowConfidenceFields: string[] = [];

  for (const result of parsedResults) {
    const conf = computeExtractionConfidence(result.testName, rawText, result.resultValue);
    perFieldConfidence[result.testName] = conf;
    if (conf < 60) {
      lowConfidenceFields.push(result.testName);
    }
  }

  const fieldConfidences = Object.values(perFieldConfidence);
  const overallConfidence = computeOverallConfidence(ocrConfidence, fieldConfidences);

  let extractionMethod: OcrConfidenceReport['extractionMethod'] = 'manual';
  if (parsedResults.length > 0) {
    if (overallConfidence >= 80) extractionMethod = 'ocr_high';
    else if (overallConfidence >= 60) extractionMethod = 'ocr_medium';
    else extractionMethod = 'ocr_low';
  }

  return {
    overallConfidence,
    perFieldConfidence,
    extractionMethod,
    lowConfidenceFields,
    needsReview: lowConfidenceFields.length > 0,
  };
}

export function getConfidenceColor(score: number): string {
  if (score >= 80) return '#10B981';
  if (score >= 60) return '#F59E0B';
  return '#EF4444';
}

export function getConfidenceLabel(score: number): string {
  if (score >= 80) return 'عالية';
  if (score >= 60) return 'متوسطة';
  return 'منخفضة';
}
