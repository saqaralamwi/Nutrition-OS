import sharp from 'sharp';

export class ImageCompressionService {
  static async compressToWebP(imageBuffer: Buffer, quality: number = 80): Promise<Buffer> {
    try {
      const imageMetadata = await sharp(imageBuffer).metadata();
      if (!imageMetadata.width || !imageMetadata.height) {
        throw new Error('Invalid image: missing width or height');
      }
      const compressed = await sharp(imageBuffer)
        .webp({ quality, effort: 6 })
        .toBuffer();
      return compressed;
    } catch (error: any) {
      console.error('WebP compression error:', error);
      throw new Error(`Failed to compress image to WebP: ${error.message}`);
    }
  }

  static async createThumbnail(
    imageBuffer: Buffer,
    width: number,
    height: number,
    fit: 'inside' | 'outside' | 'cover' | 'contain' | 'fill' = 'inside'
  ): Promise<Buffer> {
    try {
      const imageMetadata = await sharp(imageBuffer).metadata();
      if (!imageMetadata.width || !imageMetadata.height) {
        throw new Error('Invalid image: missing width or height');
      }
      const thumbnail = await sharp(imageBuffer)
        .resize(width, height, {
          fit,
          withoutEnlargement: true,
          withoutReduction: false,
        })
        .webp({ quality: 80 })
        .toBuffer();
      return thumbnail;
    } catch (error: any) {
      console.error('Thumbnail creation error:', error);
      throw new Error(`Failed to create thumbnail: ${error.message}`);
    }
  }

  static calculateCompressionRatio(originalSize: number, compressedSize: number): number {
    if (originalSize === 0) return 0;
    return ((originalSize - compressedSize) / originalSize) * 100;
  }

  static async processImage(
    imageBuffer: Buffer,
    type: 'food' | 'recipe',
    quality: number = 80
  ): Promise<{
    compressed: Buffer;
    compressedSize: number;
    thumbnail: Buffer;
    thumbnailSize: number;
    thumbnailSmall: Buffer;
    thumbnailSmallSize: number;
    compressionRatio: number;
    originalSize: number;
    metadata: {
      width: number;
      height: number;
      format: string;
    };
  }> {
    const originalSize = imageBuffer.byteLength;
    const imageMetadata = await sharp(imageBuffer).metadata();
    const metadata = {
      width: imageMetadata.width || 0,
      height: imageMetadata.height || 0,
      format: imageMetadata.format || 'unknown',
    };
    const compressed = await this.compressToWebP(imageBuffer, quality);
    const compressedSize = compressed.byteLength;
    const compressionRatio = this.calculateCompressionRatio(originalSize, compressedSize);
    const thumbnailSize = type === 'food' ? 50 : 80;
    const thumbnailSmallSize = type === 'food' ? 30 : 50;
    const thumbnail = await this.createThumbnail(imageBuffer, thumbnailSize, thumbnailSize);
    const thumbnailSmall = await this.createThumbnail(imageBuffer, thumbnailSmallSize, thumbnailSmallSize);
    return {
      compressed,
      compressedSize,
      thumbnail,
      thumbnailSize: thumbnail.byteLength,
      thumbnailSmall,
      thumbnailSmallSize: thumbnailSmall.byteLength,
      compressionRatio,
      originalSize,
      metadata,
    };
  }

  static async processImagesBatch(
    images: Array<{ buffer: Buffer; type: 'food' | 'recipe' }>,
    quality: number = 80
  ): Promise<Array<{
    success: boolean;
    result?: {
      compressedSize: number;
      thumbnailSize: number;
      thumbnailSmallSize: number;
      compressionRatio: number;
      originalSize: number;
    };
    error?: string;
  }>> {
    const results = [];
    for (const image of images) {
      try {
        const result = await this.processImage(image.buffer, image.type, quality);
        results.push({
          success: true,
          result: {
            compressedSize: result.compressedSize,
            thumbnailSize: result.thumbnailSize,
            thumbnailSmallSize: result.thumbnailSmallSize,
            compressionRatio: result.compressionRatio,
            originalSize: result.originalSize,
          },
        });
      } catch (error: any) {
        results.push({ success: false, error: error.message });
      }
    }
    return results;
  }
}
