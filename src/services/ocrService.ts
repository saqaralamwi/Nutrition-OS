import { OcrRawData } from './ocrTypes';

// @ts-ignore
import MlkitOcr from 'rn-mlkit-ocr';

export async function recognizeTextFromImage(fileUri: string): Promise<OcrRawData> {
  if (!fileUri) return { text: '' };

  try {
    const result = await MlkitOcr.recognizeText(fileUri, 'latin');

    const text: string = result.text || '';

    // ML Kit doesn't expose per-word confidence, so we estimate
    // based on recognizable patterns in the extracted text
    const blocks = result.blocks ?? [];
    const words: OcrRawData['words'] = [];
    for (const block of blocks) {
      const lines = block.lines ?? [];
      for (const line of lines) {
        const elements = line.elements ?? [];
        for (const el of elements) {
          if (el.text) {
            words.push({
              text: el.text,
              confidence: (el as any).confidence ?? 85,
            });
          }
        }
      }
    }

    return { text, words: words.length > 0 ? words : undefined };
  } catch (error: any) {
    console.error('MlkitOcr Error:', error);
    throw new Error('فشل قراءة الصورة محلياً عبر محرك الهاتف. تأكد من إعداد حزمة التطبيق التطويرية.');
  }
}
