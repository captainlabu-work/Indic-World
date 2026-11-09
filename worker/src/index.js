import { AwsV4Signer } from 'aws4fetch';
import { jwtVerify, createRemoteJWKSet } from 'jose';

// Firebase publishes its public keys here for ID token verification
const FIREBASE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

const MAX_FILENAME = 200;
const PRESIGN_EXPIRES = 3600; // 1 hour

// Allowed file types and sizes per folder. Mirrors storage.rules and
// src/utils/uploadLimits.js in the web app.
const MB = 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const FOLDER_LIMITS = {
  videos: { types: VIDEO_TYPES, maxBytes: 750 * MB },
  articles: { types: IMAGE_TYPES, maxBytes: 15 * MB },
  thumbnails: { types: IMAGE_TYPES, maxBytes: 15 * MB },
  content: { types: IMAGE_TYPES, maxBytes: 15 * MB },
  avatars: { types: IMAGE_TYPES, maxBytes: 5 * MB },
};

// Check an upload request against the folder's limits.
// Returns { status, error } when it must be rejected, or null when it is allowed.
export function checkUpload({ folder, contentType, size }) {
  const limits = FOLDER_LIMITS[folder];
  if (!limits) return { status: 400, error: 'Unknown upload folder' };
  if (!limits.types.includes(contentType)) return { status: 415, error: 'File type not allowed' };
  if (!Number.isInteger(size) || size <= 0) return { status: 400, error: 'size (bytes) required' };
  if (size > limits.maxBytes) return { status: 413, error: 'File too large' };
  return null;
}

// Presign a PUT for `key`. Content-Type and Content-Length are part of the
// signature, so R2 rejects an upload whose type or size differs from what was
// approved here (aws4fetch leaves both unsigned unless allHeaders is set).
export async function presignUpload(env, key, contentType, size) {
  const objectUrl = `${env.R2_ENDPOINT}/${env.R2_BUCKET_NAME}/${encodeURIComponent(key).replace(/%2F/g, '/')}?X-Amz-Expires=${PRESIGN_EXPIRES}`;
  const signer = new AwsV4Signer({
    url: objectUrl,
    method: 'PUT',
    headers: { 'Content-Type': contentType, 'Content-Length': String(size) },
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    region: 'auto',
    service: 's3',
    signQuery: true,
    allHeaders: true,
  });
  const { url } = await signer.sign();
  return url.toString();
}

function pickCorsOrigin(request, env) {
  const origin = request.headers.get('Origin');
  const allowed = env.ALLOWED_ORIGINS.split(',').map(s => s.trim());
  return allowed.includes(origin) ? origin : null;
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function jsonResponse(body, init = {}, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...extraHeaders, ...(init.headers || {}) },
  });
}

async function verifyFirebaseToken(token, projectId) {
  const { payload } = await jwtVerify(token, FIREBASE_JWKS, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });
  return payload;
}

function sanitizeFileName(name) {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, MAX_FILENAME);
}

export default {
  async fetch(request, env) {
    const origin = pickCorsOrigin(request, env);
    const cors = corsHeaders(origin);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      if (!origin) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: cors });
    }

    if (!origin) {
      return jsonResponse({ error: 'Origin not allowed' }, { status: 403 });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, { status: 405 }, cors);
    }

    // === Auth: verify Firebase ID token ===
    const authHeader = request.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Missing Bearer token' }, { status: 401 }, cors);
    }
    const idToken = authHeader.substring(7).trim();

    let user;
    try {
      user = await verifyFirebaseToken(idToken, env.FIREBASE_PROJECT_ID);
    } catch (err) {
      return jsonResponse({ error: 'Invalid token', detail: err.message }, { status: 401 }, cors);
    }

    const uid = user.user_id || user.sub;
    if (!uid) {
      return jsonResponse({ error: 'Token missing user id' }, { status: 401 }, cors);
    }

    // === Parse and validate request body ===
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, { status: 400 }, cors);
    }

    const { fileName, contentType, folder, size } = body;
    if (!fileName || typeof fileName !== 'string') {
      return jsonResponse({ error: 'fileName required' }, { status: 400 }, cors);
    }
    if (!contentType || typeof contentType !== 'string') {
      return jsonResponse({ error: 'contentType required' }, { status: 400 }, cors);
    }

    // === File type and size limits ===
    const rejection = checkUpload({ folder, contentType, size });
    if (rejection) {
      return jsonResponse({ error: rejection.error }, { status: rejection.status }, cors);
    }

    const safeName = sanitizeFileName(fileName);
    if (!safeName) {
      return jsonResponse({ error: 'Invalid fileName' }, { status: 400 }, cors);
    }

    // Object key: folder/timestamp_uid_filename
    const key = `${folder}/${Date.now()}_${uid}_${safeName}`;

    // === Generate presigned URL via S3 v4 signing ===
    const uploadUrl = await presignUpload(env, key, contentType, size);
    const publicUrl = `${env.R2_PUBLIC_BASE}/${key}`;

    return jsonResponse({
      uploadUrl,
      publicUrl,
      key,
      contentType,
      expiresIn: PRESIGN_EXPIRES,
    }, { status: 200 }, cors);
  },
};
