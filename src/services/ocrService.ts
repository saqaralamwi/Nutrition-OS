import { OcrRawData } from './ocrTypes';
import { Platform } from 'react-native';

/**
 * Mobile-First OCR Extraction Service.
 * Leverages Google ML Kit via rn-mlkit-ocr for high-performance,
 * offline text recognition on iOS and Android.
 */
export async function recognizeTextFromImage(fileUri: string): Promise<OcrRawData> {
  if (Platform.OS === 'web') {
    throw new Error('OCR Scanning is optimized for Mobile Native devices only.');
  }

  if (!fileUri) return { text: '' };

  try {
    // Dynamically import to keep bundle lean and prevent web crashes
    const MlkitOcr = (await import('rn-mlkit-ocr')).default;
    
    const result = await MlkitOcr.recognizeText(fileUri);

    const text: string = result.text || '';
    const words: OcrRawData['words'] = [];

    // Map ML Kit blocks to standardized words structure for confidence analysis
    if (result.blocks) {
      for (const block of result.blocks) {
        if (block.lines) {
          for (const line of block.lines) {
            if (line.elements) {
              for (const el of line.elements) {
                if (el.text) {
                  words.push({
                    text: el.text,
                    // Use provided confidence or fallback to high-probability default
                    confidence: (el as any).confidence ?? 90,
                  });
                }
              }
            }
          }
        }
      }
    }

    return { 
      text, 
      words: words.length > 0 ? words : undefined 
    };
  } catch (error: any) {
    console.error('[OCR Service] Extraction Failure:', error);
    throw new Error('فشل استخراج النصوص. يرجى التأكد من جودة الإضاءة ووضوح التقرير.');
  }
}
