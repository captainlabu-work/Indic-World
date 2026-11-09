import { AwsClient } from 'aws4fetch';
import { jwtVerify, createRemoteJWKSet } from 'jose';

// Firebase publishes its public keys here for ID token verification
const FIREBASE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

const VALID_FOLDERS = new Set(['videos', 'articles', 'thumbnails', 'content', 'avatars']);
const MAX_FILENAME = 200;
const PRESIGN_EXPIRES = 3600; // 1 hour

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

    const { fileName, contentType, folder } = body;
    if (!fileName || typeof fileName !== 'string') {
      return jsonResponse({ error: 'fileName required' }, { status: 400 }, cors);
    }
    if (!contentType || typeof contentType !== 'string') {
      return jsonResponse({ error: 'contentType required' }, { status: 400 }, cors);
    }

    const safeFolder = VALID_FOLDERS.has(folder) ? folder : 'uploads';
    const safeName = sanitizeFileName(fileName);
    if (!safeName) {
      return jsonResponse({ error: 'Invalid fileName' }, { status: 400 }, cors);
    }

    // Object key: folder/timestamp_uid_filename
    const key = `${safeFolder}/${Date.now()}_${uid}_${safeName}`;

    // === Generate presigned URL via S3 v4 signing ===
    const aws = new AwsClient({
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      region: 'auto',
      service: 's3',
    });

    const objectUrl = `${env.R2_ENDPOINT}/${env.R2_BUCKET_NAME}/${encodeURIComponent(key).replace(/%2F/g, '/')}?X-Amz-Expires=${PRESIGN_EXPIRES}`;

    const signed = await aws.sign(
      new Request(objectUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
      }),
      { aws: { signQuery: true } }
    );

    const publicUrl = `${env.R2_PUBLIC_BASE}/${key}`;

    return jsonResponse({
      uploadUrl: signed.url,
      publicUrl,
      key,
      contentType,
      expiresIn: PRESIGN_EXPIRES,
    }, { status: 200 }, cors);
  },
};
