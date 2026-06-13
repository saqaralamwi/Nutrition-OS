// @ts-ignore
import MlkitOcr from 'rn-mlkit-ocr';

export async function recognizeTextFromImage(fileUri: string): Promise<string> {
  if (!fileUri) return '';
  
  try {
    // Run on-device Google ML Kit OCR from local image URI
    const result = await MlkitOcr.recognizeText(fileUri, 'latin');
    return result.text || '';
  } catch (error: any) {
    console.error('MlkitOcr Error:', error);
    throw new Error('فشل قراءة الصورة محلياً عبر محرك الهاتف. تأكد من إعداد حزمة التطبيق التطويرية.');
  }
}
