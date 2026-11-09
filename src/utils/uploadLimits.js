// Allowed upload types and sizes. The same limits are enforced on the server side in
// storage.rules (Firebase Storage) and worker/src/index.js (Cloudflare R2); these
// client-side checks only give users a clear message before an upload is rejected.

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
export const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

const MB = 1024 * 1024;
export const MAX_IMAGE_BYTES = 15 * MB;
export const MAX_VIDEO_BYTES = 750 * MB;
export const MAX_PROFILE_PHOTO_BYTES = 5 * MB;

export const IMAGE_ACCEPT = IMAGE_TYPES.join(',');
export const VIDEO_ACCEPT = VIDEO_TYPES.join(',');

// Returns an error message, or null if the file is allowed.
export function checkImageFile(file, maxBytes = MAX_IMAGE_BYTES) {
  if (!IMAGE_TYPES.includes(file.type)) return 'Images must be JPEG, PNG, WebP or AVIF.';
  if (file.size > maxBytes) return `Images must be smaller than ${Math.round(maxBytes / MB)} MB.`;
  return null;
}

export function checkVideoFile(file) {
  if (!VIDEO_TYPES.includes(file.type)) return 'Videos must be MP4, MOV or WebM.';
  if (file.size > MAX_VIDEO_BYTES) return 'File exceeds 750MB limit. Please compress your video.';
  return null;
}
