// R2 upload Worker: file type/size limits and presigned URL signing.
import { describe, expect, it } from 'vitest';
import { checkUpload, presignUpload } from '../../worker/src/index.js';

const MB = 1024 * 1024;

describe('checkUpload', () => {
  it('accepts allowed images and videos within limits', () => {
    expect(checkUpload({ folder: 'articles', contentType: 'image/jpeg', size: 2 * MB })).toBeNull();
    expect(checkUpload({ folder: 'content', contentType: 'image/webp', size: 15 * MB })).toBeNull();
    expect(checkUpload({ folder: 'thumbnails', contentType: 'image/avif', size: 1 })).toBeNull();
    expect(checkUpload({ folder: 'avatars', contentType: 'image/png', size: 5 * MB })).toBeNull();
    expect(checkUpload({ folder: 'videos', contentType: 'video/mp4', size: 750 * MB })).toBeNull();
    expect(checkUpload({ folder: 'videos', contentType: 'video/quicktime', size: 10 * MB })).toBeNull();
    expect(checkUpload({ folder: 'videos', contentType: 'video/webm', size: 10 * MB })).toBeNull();
  });

  it('rejects files over the size limit', () => {
    expect(checkUpload({ folder: 'articles', contentType: 'image/jpeg', size: 15 * MB + 1 })?.status).toBe(413);
    expect(checkUpload({ folder: 'avatars', contentType: 'image/jpeg', size: 5 * MB + 1 })?.status).toBe(413);
    expect(checkUpload({ folder: 'videos', contentType: 'video/mp4', size: 750 * MB + 1 })?.status).toBe(413);
  });

  it('rejects other file types, including video in image folders', () => {
    for (const contentType of ['text/html', 'image/svg+xml', 'image/gif', 'application/pdf', 'video/x-msvideo']) {
      expect(checkUpload({ folder: 'articles', contentType, size: 100 })?.status).toBe(415);
    }
    expect(checkUpload({ folder: 'articles', contentType: 'video/mp4', size: 100 })?.status).toBe(415);
    expect(checkUpload({ folder: 'videos', contentType: 'image/jpeg', size: 100 })?.status).toBe(415);
  });

  it('rejects unknown folders and missing or invalid sizes', () => {
    expect(checkUpload({ folder: 'uploads', contentType: 'image/jpeg', size: 100 })?.status).toBe(400);
    expect(checkUpload({ folder: '../secret', contentType: 'image/jpeg', size: 100 })?.status).toBe(400);
    expect(checkUpload({ folder: 'articles', contentType: 'image/jpeg' })?.status).toBe(400);
    expect(checkUpload({ folder: 'articles', contentType: 'image/jpeg', size: -1 })?.status).toBe(400);
    expect(checkUpload({ folder: 'articles', contentType: 'image/jpeg', size: '100' })?.status).toBe(400);
  });
});

describe('presignUpload', () => {
  const env = {
    R2_ENDPOINT: 'https://account.r2.cloudflarestorage.com',
    R2_BUCKET_NAME: 'indic-world-media',
    R2_ACCESS_KEY_ID: 'test-key-id',
    R2_SECRET_ACCESS_KEY: 'test-secret',
  };

  it('signs Content-Type and Content-Length so R2 rejects a different file', async () => {
    const url = new URL(await presignUpload(env, 'articles/1_uid_photo.jpg', 'image/jpeg', 12345));
    expect(url.pathname).toBe('/indic-world-media/articles/1_uid_photo.jpg');
    expect(url.searchParams.get('X-Amz-SignedHeaders')).toBe('content-length;content-type;host');
    expect(url.searchParams.get('X-Amz-Expires')).toBe('3600');
    expect(url.searchParams.get('X-Amz-Signature')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces a different signature for a different size or type', async () => {
    const sig = async (type, size) =>
      new URL(await presignUpload(env, 'articles/k.jpg', type, size)).searchParams.get('X-Amz-Signature');
    const base = await sig('image/jpeg', 100);
    expect(await sig('image/jpeg', 101)).not.toBe(base);
    expect(await sig('image/png', 100)).not.toBe(base);
  });
});
