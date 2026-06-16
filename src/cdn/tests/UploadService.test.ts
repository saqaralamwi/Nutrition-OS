import { describe, test, expect } from 'vitest';
import { UploadService, UploadError } from '../services/UploadService';

const mockEnv = {
  CLOUDFLARE_ACCOUNT_ID: 'mock-account-id',
  CLOUDFLARE_ACCESS_KEY_ID: 'mock-access-key-id',
  CLOUDFLARE_ACCESS_KEY: 'mock-access-key',
  CDN_DOMAIN: 'cdn.adcn.io',
};

describe('UploadService', () => {
  test('UploadError - error class with code and status', () => {
    const error = new UploadError('Failed to upload image', 'UPLOAD_FAILED', 500);
    expect(error.name).toBe('UploadError');
    expect(error.code).toBe('UPLOAD_FAILED');
    expect(error.statusCode).toBe(500);
    expect(error.message).toBe('Failed to upload image');
  });

  test('UploadError - defaults status to 500', () => {
    const error = new UploadError('Generic error', 'UNKNOWN');
    expect(error.statusCode).toBe(500);
  });

  test('UploadService - constructor sets env', () => {
    const service = new UploadService(mockEnv);
    expect(service).toBeDefined();
  });

  test('UploadService - calculateUploadStats returns stats object', async () => {
    const service = new UploadService(mockEnv);
    const stats = await service.calculateUploadStats([]);
    expect(stats.totalImages).toBe(0);
    expect(stats.successfulUploads).toBe(0);
    expect(stats.failedUploads).toBe(0);
    expect(stats.totalSize).toBe(0);
  });
});
