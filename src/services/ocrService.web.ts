import Tesseract from 'tesseract.js';

export async function recognizeTextFromImage(file: File | Blob | string): Promise<string> {
  if (!file) return '';
  const result = await Tesseract.recognize(
    file,
    'eng+ara',
    {
      logger: (m) => console.log('OCR status:', m),
    }
  );
  return result.data?.text || '';
}
