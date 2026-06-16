import { describe, test, expect, beforeAll } from 'vitest';
import { ImageCompressionService } from '../services/ImageCompressionService';
import fs from 'fs';
import path from 'path';

describe('ImageCompressionService', () => {
  const testImageDir = path.join(__dirname, '..', '..', '..', '..', 'tests', 'images');

  beforeAll(() => {
    if (!fs.existsSync(testImageDir)) {
      fs.mkdirSync(testImageDir, { recursive: true });
    }
  });

  const hasImage = (name: string) => fs.existsSync(path.join(testImageDir, name));

  test('calculateCompressionRatio - returns correct percentage', () => {
    const ratio = ImageCompressionService.calculateCompressionRatio(100000, 25000);
    expect(ratio).toBe(75);
  });

  test('calculateCompressionRatio - returns 0 when original is 0', () => {
    const ratio = ImageCompressionService.calculateCompressionRatio(0, 0);
    expect(ratio).toBe(0);
  });

  test('calculateCompressionRatio - returns 100 when compressed is 0', () => {
    const ratio = ImageCompressionService.calculateCompressionRatio(1000, 0);
    expect(ratio).toBe(100);
  });

  test('compressToWebP - compress image to WebP', async () => {
    if (!hasImage('test-image.jpg')) return;
    const imageBuffer = fs.readFileSync(path.join(testImageDir, 'test-image.jpg'));
    const originalSize = imageBuffer.byteLength;

    const compressed = await ImageCompressionService.compressToWebP(imageBuffer, 80);
    const compressedSize = compressed.byteLength;

    expect(compressedSize).toBeLessThan(originalSize);
    const ratio = ImageCompressionService.calculateCompressionRatio(originalSize, compressedSize);
    expect(ratio).toBeGreaterThan(50);
  });

  test('createThumbnail - create 50x50 thumbnail', async () => {
    if (!hasImage('test-image.jpg')) return;
    const imageBuffer = fs.readFileSync(path.join(testImageDir, 'test-image.jpg'));
    const thumbnail = await ImageCompressionService.createThumbnail(imageBuffer, 50, 50);
    expect(thumbnail.byteLength).toBeLessThan(5000);
  });

  test('createThumbnail - create 80x80 thumbnail', async () => {
    if (!hasImage('test-image.jpg')) return;
    const imageBuffer = fs.readFileSync(path.join(testImageDir, 'test-image.jpg'));
    const thumbnail = await ImageCompressionService.createThumbnail(imageBuffer, 80, 80);
    expect(thumbnail.byteLength).toBeLessThan(10000);
  });

  test('processImage - compress + thumbnails (Food)', async () => {
    if (!hasImage('food-image.jpg')) return;
    const imageBuffer = fs.readFileSync(path.join(testImageDir, 'food-image.jpg')) as Buffer;
    const result = await ImageCompressionService.processImage(imageBuffer, 'food', 80);
    expect(result.compressedSize).toBeLessThan(result.originalSize);
    expect(result.thumbnailSize).toBeLessThan(5000);
    expect(result.compressionRatio).toBeGreaterThan(50);
  });

  test('processImagesBatch - batch processing', async () => {
    if (!hasImage('food-image-1.jpg') || !hasImage('recipe-image-1.jpg')) return;
    const images = [
      { buffer: fs.readFileSync(path.join(testImageDir, 'food-image-1.jpg')), type: 'food' as const },
      { buffer: fs.readFileSync(path.join(testImageDir, 'recipe-image-1.jpg')), type: 'recipe' as const },
    ];
    const results = await ImageCompressionService.processImagesBatch(images, 80);
    expect(results.every(r => r.success)).toBe(true);
    expect(results.every(r => r.success && r.result!.compressedSize < r.result!.originalSize)).toBe(true);
  });
});
