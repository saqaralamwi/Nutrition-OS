export interface ParsedLabResult {
  testName: string;
  resultValue: number;
  confidence?: number;
  isVerified?: boolean;
}

export interface OcrRawData {
  text: string;
  words?: OcrWord[];
}

export interface OcrWord {
  text: string;
  confidence: number;
  bbox?: { x0: number; y0: number; x1: number; y1: number };
}
