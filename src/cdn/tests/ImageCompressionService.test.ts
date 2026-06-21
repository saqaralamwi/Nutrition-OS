import { describe, test, expect, beforeAll } from 'vitest';
import { ImageCompressionService } from '../services/ImageCompressionService';
import sharp from 'sharp';

describe('ImageCompressionService', () => {
  let testImageBuffer: Buffer;
  let testImageBuffer2: Buffer;
  let foodImageBuffer: Buffer;

  beforeAll(async () => {
    // Generate synthetic test images using sharp instead of requiring physical files
    testImageBuffer = await sharp({
      create: {
        width: 200,
        height: 200,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    }).jpeg().toBuffer();

    testImageBuffer2 = await sharp({
      create: {
        width: 150,
        height: 150,
        channels: 3,
        background: { r: 0, g: 255, b: 0 },
      },
    }).jpeg().toBuffer();

    foodImageBuffer = await sharp({
      create: {
        width: 300,
        height: 200,
        channels: 3,
        background: { r: 0, g: 0, b: 255 },
      },
    }).jpeg().toBuffer();
  });

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
    const originalSize = testImageBuffer.byteLength;
    const compressed = await ImageCompressionService.compressToWebP(testImageBuffer, 80);
    const compressedSize = compressed.byteLength;
    expect(compressedSize).toBeLessThan(originalSize);
    const ratio = ImageCompressionService.calculateCompressionRatio(originalSize, compressedSize);
    expect(ratio).toBeGreaterThan(50);
  });

  test('createThumbnail - create 50x50 thumbnail', async () => {
    const thumbnail = await ImageCompressionService.createThumbnail(testImageBuffer, 50, 50);
    expect(thumbnail.byteLength).toBeLessThan(5000);
  });

  test('createThumbnail - create 80x80 thumbnail', async () => {
    const thumbnail = await ImageCompressionService.createThumbnail(testImageBuffer, 80, 80);
    expect(thumbnail.byteLength).toBeLessThan(10000);
  });

  test('processImage - compress + thumbnails (Food)', async () => {
    const result = await ImageCompressionService.processImage(foodImageBuffer, 'food', 80);
    expect(result.compressedSize).toBeLessThan(result.originalSize);
    expect(result.thumbnailSize).toBeLessThan(5000);
    expect(result.compressionRatio).toBeGreaterThan(50);
  });

  test('processImagesBatch - batch processing', async () => {
    const images = [
      { buffer: testImageBuffer, type: 'food' as const },
      { buffer: testImageBuffer2, type: 'recipe' as const },
    ];
    const results = await ImageCompressionService.processImagesBatch(images, 80);
    expect(results.every(r => r.success)).toBe(true);
    expect(results.every(r => r.success && r.result!.compressedSize < r.result!.originalSize)).toBe(true);
  });
});
