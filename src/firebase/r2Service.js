// R2 upload service — replaces Firebase Storage for new uploads.
// Talks to the Cloudflare Worker (VITE_R2_UPLOAD_WORKER_URL) which verifies the
// user's Firebase ID token and returns a short-lived presigned PUT URL for R2.

import { auth } from './config';
import { checkImageFile, checkVideoFile, MAX_PROFILE_PHOTO_BYTES } from '../utils/uploadLimits';

const WORKER_URL = import.meta.env.VITE_R2_UPLOAD_WORKER_URL;

if (!WORKER_URL && import.meta.env.MODE !== 'test') {
  console.warn('[r2Service] VITE_R2_UPLOAD_WORKER_URL is not set — R2 uploads will fail');
}

// Map a legacy storage path (e.g. "articles/123_pic.jpg") to a R2 folder.
// Anything unrecognized falls back to "uploads".
function folderFromPath(path) {
  if (!path) return 'uploads';
  const lower = path.toLowerCase();
  if (lower.startsWith('videos/')) return 'videos';
  if (lower.startsWith('articles/content/')) return 'content';
  if (lower.startsWith('articles/')) return 'articles';
  if (lower.startsWith('thumbnails/')) return 'thumbnails';
  if (lower.startsWith('avatars/')) return 'avatars';
  return 'uploads';
}

function extractFileName(path, file) {
  const parts = (path || '').split('/');
  const last = parts[parts.length - 1];
  if (last && last.includes('.')) return last;
  return file?.name || `upload-${Date.now()}`;
}

// Same type/size limits the Worker enforces; checked here for a clearer message.
function assertUploadAllowed(file, folder) {
  let problem;
  if (folder === 'videos') problem = checkVideoFile(file);
  else if (folder === 'avatars') problem = checkImageFile(file, MAX_PROFILE_PHOTO_BYTES);
  else problem = checkImageFile(file);
  if (problem) throw new Error(problem);
}

async function getIdToken() {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be signed in to upload');
  return await user.getIdToken();
}

async function requestPresignedUrl({ fileName, contentType, folder, size }) {
  if (!WORKER_URL) throw new Error('R2 upload worker URL not configured');
  const token = await getIdToken();
  const res = await fetch(WORKER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ fileName, contentType, folder, size }),
  });
  if (!res.ok) {
    let detail = '';
    try {
      const errJson = await res.json();
      detail = errJson.error || errJson.detail || '';
    } catch {
      try { detail = await res.text(); } catch { /* */ }
    }
    throw new Error(`Failed to get upload URL: ${res.status} ${detail}`);
  }
  return await res.json();
}

export const r2Service = {
  // Upload a File or Blob, return the public URL on R2
  async uploadImage(file, path) {
    const folder = folderFromPath(path);
    assertUploadAllowed(file, folder);
    const fileName = extractFileName(path, file);
    const contentType = file.type || 'application/octet-stream';

    const { uploadUrl, publicUrl } = await requestPresignedUrl({
      fileName,
      contentType,
      folder,
      size: file.size,
    });

    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: file,
    });
    if (!putRes.ok) {
      throw new Error(`Upload failed: ${putRes.status} ${await putRes.text().catch(() => '')}`);
    }
    return publicUrl;
  },

  // Upload with progress callback (0-100). Used for large video uploads.
  uploadWithProgress(file, path, onProgress) {
    return new Promise((resolve, reject) => {
      const run = async () => {
        try {
          const folder = folderFromPath(path);
          assertUploadAllowed(file, folder);
          const fileName = extractFileName(path, file);
          const contentType = file.type || 'application/octet-stream';

          const { uploadUrl, publicUrl } = await requestPresignedUrl({
            fileName,
            contentType,
            folder,
            size: file.size,
          });

          const xhr = new XMLHttpRequest();
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && onProgress) {
              onProgress(Math.round((e.loaded / e.total) * 100));
            }
          });
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(publicUrl);
            } else {
              reject(new Error(`Upload failed: ${xhr.status} ${xhr.responseText || ''}`));
            }
          });
          xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
          xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));
          xhr.open('PUT', uploadUrl);
          xhr.setRequestHeader('Content-Type', contentType);
          xhr.send(file);
        } catch (err) {
          reject(err);
        }
      };
      run();
    });
  },

  // Upload a base64 data URL (used by the editor for pasted/inline images)
  async uploadDataUrl(dataUrl, path) {
    const fetchRes = await fetch(dataUrl);
    const blob = await fetchRes.blob();
    const fileName = extractFileName(path);
    const file = new File([blob], fileName, { type: blob.type });
    return await this.uploadImage(file, path);
  },

  async uploadArticleImage(file, authorId) {
    return await this.uploadImage(file, `articles/${authorId}/${file.name}`);
  },

  async uploadAvatar(file, userId) {
    return await this.uploadImage(file, `avatars/${userId}/${file.name}`);
  },

  // === Editor content image walker ===
  // Recursively finds every base64 data URL string in a Tiptap JSON tree
  // and returns mutation refs so we can swap them in place after upload.
  _collectBase64Refs(value, results = []) {
    if (!value || typeof value !== 'object') return results;

    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        if (typeof value[i] === 'string' && value[i].startsWith('data:image/')) {
          results.push({ obj: value, key: i });
        } else if (typeof value[i] === 'object') {
          this._collectBase64Refs(value[i], results);
        }
      }
    } else {
      for (const k of Object.keys(value)) {
        if (typeof value[k] === 'string' && value[k].startsWith('data:image/')) {
          results.push({ obj: value, key: k });
        } else if (typeof value[k] === 'object') {
          this._collectBase64Refs(value[k], results);
        }
      }
    }

    return results;
  },

  // Walk editor content, upload every base64 image to R2, replace refs in JSON+HTML
  async uploadContentImages(htmlContent, contentJSON) {
    let jsonObj = contentJSON;
    if (typeof contentJSON === 'string') {
      try { jsonObj = JSON.parse(contentJSON); } catch { jsonObj = null; }
    }

    const base64Refs = jsonObj ? this._collectBase64Refs(jsonObj) : [];

    if (base64Refs.length === 0) {
      return { html: htmlContent, json: contentJSON };
    }

    // Dedupe — same data URL may appear in multiple grid cells
    const uniqueUrls = [...new Set(base64Refs.map(r => r.obj[r.key]))];
    const urlMap = new Map();
    const ts = Date.now();

    const uploads = uniqueUrls.map(async (dataUrl, i) => {
      const ext = dataUrl.startsWith('data:image/png') ? 'png' : 'jpg';
      const path = `articles/content/${ts}_${i}.${ext}`;
      try {
        const url = await this.uploadDataUrl(dataUrl, path);
        urlMap.set(dataUrl, url);
      } catch (err) {
        throw new Error(`Image upload failed (image ${i + 1}): ${err.message}`);
      }
    });

    await Promise.all(uploads);

    // Replace refs in JSON tree (mutates in place)
    for (const { obj, key } of base64Refs) {
      const replacement = urlMap.get(obj[key]);
      if (replacement) obj[key] = replacement;
    }

    // Replace base64 in HTML inline img src too
    let cleanedHtml = htmlContent;
    for (const [dataUrl, storageUrl] of urlMap) {
      cleanedHtml = cleanedHtml.split(dataUrl).join(storageUrl);
    }

    // Rebuild data-images attrs for imageGrid nodes from cleaned JSON
    if (jsonObj?.content) {
      for (const node of jsonObj.content) {
        if (node.type === 'imageGrid' && Array.isArray(node.attrs?.images)) {
          const cleanImagesJson = JSON.stringify(node.attrs.images);
          cleanedHtml = cleanedHtml.replace(
            /(<div[^>]*data-type="image-grid"[^>]*data-images=")([^"]*?)(")/g,
            (_match, pre, _oldVal, post) => pre + cleanImagesJson.replace(/"/g, '&quot;') + post
          );
        }
      }
    }

    const cleanedJson = typeof contentJSON === 'string' ? JSON.stringify(jsonObj) : jsonObj;
    return { html: cleanedHtml, json: cleanedJson };
  },

  // Delete is a no-op for now — R2 deletes need a separate worker endpoint.
  // Stale objects don't break the app; we'll add cleanup later if needed.
  async deleteImage(imageUrl) {
    console.warn('[r2Service] deleteImage not implemented for R2 yet:', imageUrl);
  },
};
