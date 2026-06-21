import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ImageCompressionService } from './ImageCompressionService';
import { v4 as uuidV4 } from 'uuid';

export class UploadService {
  private s3Client: S3Client;
  private bucketName: string;
  private cdnDomain: string;
  private credentialVersion: string = 'v1'; // ✅ Track version of credentials
  private endpoint: string;
  private region: string;

  constructor(env: any) {
    const accessKeyId = env.CLOUDFLARE_ACCESS_KEY_ID || env.accessKeyId;
    const secretAccessKey = env.CLOUDFLARE_ACCESS_KEY || env.secretAccessKey;

    // ✅ Validate credentials exist
    if (!accessKeyId || !secretAccessKey) {
      throw new Error('R2 credentials (accessKeyId / CLOUDFLARE_ACCESS_KEY_ID, secretAccessKey / CLOUDFLARE_ACCESS_KEY) are required');
    }

    this.credentialVersion = env.credentialVersion || 'v1';
    this.endpoint = env.CLOUDFLARE_ACCOUNT_ID
      ? `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`
      : (env.endpoint || '');
    this.region = env.region || 'us-east-1';

    this.s3Client = new S3Client({
      endpoint: this.endpoint || undefined,
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    this.bucketName = 'adcn-storage';
    this.cdnDomain = env.CDN_DOMAIN || 'cdn.adcn.io';
  }

  // ✅ Rotation method
  public rotateCredentials(newAccessKeyId: string, newSecretAccessKey: string, newVersion: string): void {
    this.s3Client = new S3Client({
      endpoint: this.endpoint || undefined,
      region: this.region,
      credentials: {
        accessKeyId: newAccessKeyId,
        secretAccessKey: newSecretAccessKey
      }
    });
    this.credentialVersion = newVersion;
  }

  // ✅ Get current credential version (for monitoring)
  public getCredentialVersion(): string {
    return this.credentialVersion;
  }

  async uploadImage(
    imageBuffer: Buffer,
    type: 'food' | 'recipe',
    category: string = 'foods',
    _userId: string
  ): Promise<{
    compressedUrl: string;
    thumbnailUrl: string;
    thumbnailSmallUrl: string;
    uuid: string;
    metadata: {
      originalSize: number;
      compressedSize: number;
      thumbnailSize: number;
      thumbnailSmallSize: number;
      compressionRatio: number;
      width: number;
      height: number;
      format: string;
    };
  }> {
    try {
      const processingResult = await ImageCompressionService.processImage(imageBuffer, type, 80);

      const uuid = uuidV4();

      const compressedPath = `${category}/${uuid}.webp`;
      const thumbnailPath = `${category}/thumbnails/${uuid}.webp`;
      const thumbnailSmallPath = `${category}/thumbnails-small/${uuid}.webp`;

      await Promise.all([
        this.uploadToR2(processingResult.compressed, compressedPath),
        this.uploadToR2(processingResult.thumbnail, thumbnailPath),
        this.uploadToR2(processingResult.thumbnailSmall, thumbnailSmallPath),
      ]);

      const compressedUrl = `https://${this.cdnDomain}/${compressedPath}`;
      const thumbnailUrl = `https://${this.cdnDomain}/${thumbnailPath}`;
      const thumbnailSmallUrl = `https://${this.cdnDomain}/${thumbnailSmallPath}`;

      return {
        compressedUrl,
        thumbnailUrl,
        thumbnailSmallUrl,
        uuid,
        metadata: {
          originalSize: processingResult.originalSize,
          compressedSize: processingResult.compressedSize,
          thumbnailSize: processingResult.thumbnailSize,
          thumbnailSmallSize: processingResult.thumbnailSmallSize,
          compressionRatio: processingResult.compressionRatio,
          width: processingResult.metadata.width,
          height: processingResult.metadata.height,
          format: processingResult.metadata.format,
        },
      };
    } catch (error: any) {
      // ✅ Removed sensitive error object logging
      console.error('Upload failed');
      throw new UploadError(
        `Failed to upload image: ${error.message}`,
        'UPLOAD_FAILED',
        500
      );
    }
  }

  private async uploadToR2(buffer: Buffer, path: string): Promise<void> {
    try {
      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.bucketName,
        Key: path,
        Body: buffer,
        ContentType: 'image/webp',
        ContentLength: buffer.byteLength,
        CacheControl: 'public, max-age=31536000, immutable',
      }));
    } catch (error: any) {
      // ✅ Removed sensitive error object logging
      console.error('R2 upload operation failed');
      throw new UploadError(
        `Failed to upload to R2: ${error.message}`,
        'R2_UPLOAD_FAILED',
        500
      );
    }
  }

  async getImageFromR2(path: string): Promise<Buffer> {
    try {
      const response = await this.s3Client.send(new GetObjectCommand({
        Bucket: this.bucketName,
        Key: path,
      }));
      const uint8 = await response.Body?.transformToByteArray();
      if (!uint8) throw new Error('Empty response from R2');
      return Buffer.from(uint8);
    } catch (error: any) {
      // ✅ Removed sensitive error object logging
      console.error('R2 download operation failed');
      throw new UploadError(
        `Failed to download from R2: ${error.message}`,
        'R2_DOWNLOAD_FAILED',
        404
      );
    }
  }

  async deleteImagesFromR2(paths: string[]): Promise<void> {
    try {
      for (const path of paths) {
        await this.s3Client.send(new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: path,
        }));
      }
    } catch (error: any) {
      // ✅ Removed sensitive error object logging
      console.error('R2 delete operation failed');
      throw new UploadError(
        `Failed to delete images from R2: ${error.message}`,
        'R2_DELETE_FAILED',
        500
      );
    }
  }

  async calculateUploadStats(
    images: Array<{ buffer: Buffer; type: 'food' | 'recipe' }>
  ): Promise<{
    totalImages: number;
    totalOriginalSize: number;
    totalCompressedSize: number;
    totalThumbnailSize: number;
    totalThumbnailSmallSize: number;
    totalSize: number;
    avgCompressionRatio: number;
    successfulUploads: number;
    failedUploads: number;
  }> {
    let totalOriginalSize = 0;
    let totalCompressedSize = 0;
    let totalThumbnailSize = 0;
    let totalThumbnailSmallSize = 0;
    let successfulUploads = 0;
    let failedUploads = 0;

    for (const image of images) {
      try {
        const result = await ImageCompressionService.processImage(image.buffer, image.type, 80);
        totalOriginalSize += result.originalSize;
        totalCompressedSize += result.compressedSize;
        totalThumbnailSize += result.thumbnailSize;
        totalThumbnailSmallSize += result.thumbnailSmallSize;
        successfulUploads++;
      } catch {
        failedUploads++;
      }
    }

    const totalSize = totalCompressedSize + totalThumbnailSize + totalThumbnailSmallSize;
    const avgCompressionRatio = totalOriginalSize > 0
      ? ((totalOriginalSize - totalSize) / totalOriginalSize) * 100
      : 0;

    return {
      totalImages: images.length,
      totalOriginalSize,
      totalCompressedSize,
      totalThumbnailSize,
      totalThumbnailSmallSize,
      totalSize,
      avgCompressionRatio,
      successfulUploads,
      failedUploads,
    };
  }
}

export class UploadError extends Error {
  public code: string;
  public statusCode: number;

  constructor(message: string, code: string, statusCode: number = 500) {
    super(message);
    this.name = 'UploadError';
    this.code = code;
    this.statusCode = statusCode;
  }
}
