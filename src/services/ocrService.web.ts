import Tesseract from 'tesseract.js';
import { OcrRawData } from './ocrTypes';

export async function recognizeTextFromImage(file: File | Blob | string): Promise<OcrRawData> {
  if (!file) return { text: '' };

  const result = await Tesseract.recognize(
    file,
    'eng+ara',
    {
      logger: (m) => console.log('OCR status:', m),
    }
  );

  const words = (result.data as any)?.words?.map((w: any) => ({
    text: w.text,
    confidence: w.confidence ?? 0,
    bbox: w.bbox ? { x0: w.bbox.x0, y0: w.bbox.y0, x1: w.bbox.x1, y1: w.bbox.y1 } : undefined,
  })) ?? [];

  return {
    text: result.data?.text || '',
    words,
  };
}
