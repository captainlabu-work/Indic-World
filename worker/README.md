# Indic R2 Uploader Worker

Issues short-lived presigned URLs so authenticated Indic users can upload directly to Cloudflare R2 from the browser.

## How it works

1. Browser sends `POST` to this Worker with `Authorization: Bearer <firebase-id-token>` and a JSON body `{ fileName, contentType, folder, size }`
2. Worker verifies the Firebase ID token against Firebase's public JWKS
3. Worker checks the file type and size against the folder's limits (see below) and rejects anything else
4. Worker signs a presigned `PUT` URL using R2 S3-compatible credentials (via `aws4fetch`). `Content-Type` and `Content-Length` are signed, so R2 refuses an upload whose type or size differs from what was approved
5. Returns `{ uploadUrl, publicUrl, key }` to the browser
6. Browser does `PUT` directly to `uploadUrl` — file goes to R2, no proxy
7. Browser stores `publicUrl` in Firestore

## Upload limits

| Folder | Allowed types | Max size |
|---|---|---|
| `videos` | `video/mp4`, `video/quicktime` (MOV), `video/webm` | 750 MB |
| `articles`, `thumbnails`, `content` | `image/jpeg`, `image/png`, `image/webp`, `image/avif` | 15 MB |
| `avatars` | same image types | 5 MB |

Any other folder is rejected. The same limits apply to Firebase Storage (`storage.rules`) and are checked in the web app (`src/utils/uploadLimits.js`). Unit tests: `npm test` in the repo root.

## One-time setup

### 1. Install wrangler

```powershell
cd worker
npm install
```

### 2. Log in to Cloudflare

```powershell
npx wrangler login
```

This opens a browser window to authorize wrangler to use your Cloudflare account.

### 3. Set the secrets

You'll be prompted to paste each value — they're encrypted server-side and never leave Cloudflare.

```powershell
npx wrangler secret put R2_ACCESS_KEY_ID
# paste your Access Key ID, press Enter

npx wrangler secret put R2_SECRET_ACCESS_KEY
# paste your Secret Access Key, press Enter

npx wrangler secret put R2_ENDPOINT
# paste your endpoint URL (e.g. https://<account-id>.r2.cloudflarestorage.com), press Enter
```

### 4. Deploy

```powershell
npm run deploy
```

Output will show the Worker URL, something like:
`https://indic-r2-uploader.<your-subdomain>.workers.dev`

Copy that URL — you'll need it in the React app's `.env` file as `VITE_R2_UPLOAD_WORKER_URL`.

## Local development

```powershell
npm run dev
```

Runs the Worker locally at `http://localhost:8787`. Useful for testing the auth flow without deploying.

## Logs

```powershell
npm run tail
```

Streams live logs from the deployed Worker.

## Rotating secrets

If a secret leaks:

```powershell
npx wrangler secret put R2_SECRET_ACCESS_KEY
# enter the new value
```

The next request uses the new value automatically.
