# Indic World

**[indic.world](https://indic.world)**: a publishing site where writers share stories in three
formats:

- **Word** — writing
- **Lens** — photo essays
- **Motion** — films

Writers submit their work, an admin reviews it, and approved stories are published.

## Stack

| Part | What it does | Tool |
|---|---|---|
| Website | All pages, the story editor and the admin panel | React 19, React Router 7, Vite 7 |
| Editor | Rich text with resizable images and 2–3 column image grids | Tiptap 3 |
| Login | Email/password and Google sign-in | Firebase Auth |
| Database | Stories, users, public profiles, subscriptions, contact messages | Cloud Firestore |
| Uploads | Story images, thumbnails and Motion videos | Cloudflare R2, via the upload Worker in `worker/` |
| Older files | Files uploaded before Nov 2026, and profile photos | Firebase Storage |
| Hosting | Builds and serves the site when `main` is pushed | Vercel (Cloudflare handles DNS and proxies in front) |
| Traffic stats | Page views, sessions, devices | Firebase Analytics (Google Analytics 4) |

There is **no backend server**. The browser talks to Firestore directly, so
[`firestore.rules`](firestore.rules) and [`storage.rules`](storage.rules) are what protect the
data. The only server code is the small Cloudflare Worker that hands out upload links.

## Run it locally

Requirements:
- Node 22.
- To run against the local test databases, also Java 21 and the Firebase CLI
  (`npm i -g firebase-tools`).

```bash
npm install
cp .env.example .env      # then fill in the Firebase config and the Worker URL
npm run dev               # http://localhost:3000, against the LIVE Firebase project
```

To try things without touching live data, use the local Firebase emulators:

```bash
npm run emulators         # terminal 1: local Auth / Firestore / Storage (demo project)
npm run seed:emulator     # terminal 2: test accounts and stories
npm run dev:emulator      # http://localhost:3000, against the emulators
```

The seed script creates three accounts, all with the password `password123`:
`admin@indic.test`, `alice@indic.test` and `bob@indic.test`.
Uploads don't work in emulator mode, because the R2 Worker only accepts real logins.

## Tests and checks

| Command | What it checks |
|---|---|
| `npm test` | Story HTML sanitizer and the Worker's upload limits |
| `npm run test:rules` | Firestore and Storage security rules, against the emulators (needs Java 21) |
| `npm run lint` | Code style (passes with no warnings) |
| `npm run build` | Production build into `dist/` |

## Deploying

| What | How | Notes |
|---|---|---|
| Website | Push to `main`; Vercel builds and publishes it | Environment variables are set in the Vercel dashboard |
| Firestore rules | `firebase deploy --only firestore:rules --project indicteam1` | |
| Firestore indexes | `firebase deploy --only firestore:indexes --project indicteam1` | Defined in `firestore.indexes.json` |
| Storage rules | `firebase deploy --only storage --project indicteam1` | |
| Upload Worker | `cd worker && npx wrangler deploy` | Setup and secrets: [`worker/README.md`](worker/README.md) |

When a change needs new rules *and* new site code, the order matters.
[`docs/SECURITY_ROLLOUT.md`](docs/SECURITY_ROLLOUT.md) is the worked example from the November
2026 security update.

## How security works

- **Admins** are users whose `users/{uid}` document has `role: "admin"`. Nobody can set their own
  role; only an existing admin can, through the admin panel. The first admin was set by hand in
  the Firebase console.
- **Personal data:** `users/{uid}` (email, role) is readable only by its owner and admins.
  `publicProfiles/{uid}` (name, photo, subscriber count) is public.
- **Stories:**
  - published stories are public;
  - drafts are visible only to their author and admins;
  - writers can only save their own stories as draft or submit them for review;
  - publishing, rejecting, Staff Picks, the Public Domain badge and homepage settings are
    admin-only.
- **Hidden code:** story HTML is cleaned with DOMPurify before it is shown
  (`src/utils/sanitizeHtml.js`).
- **Uploads:** only images (JPEG/PNG/WebP/AVIF, up to 15 MB; profile photos up to 5 MB) and
  videos (MP4/MOV/WebM, up to 750 MB). These limits live in three places that must match:
  - `src/utils/uploadLimits.js`
  - `storage.rules`
  - `worker/src/index.js`

## Folders

```
src/
  pages/          one file per page (Home, Article, MotionPlayer, CreateStory, Admin, …)
  components/     TiptapEditor + its image nodes, Navbar, Footer, SearchOverlay, notifications
  firebase/       config.js (setup), services.js (all database calls), r2Service.js (uploads)
  contexts/       AuthContext (signed-in user and admin flag)
  utils/          sanitizeHtml, articleBlocks (story layout), uploadLimits, formatters
public/           files served as-is: logos, favicon, optimised images in public/images/
assets-src/       full-size original images (not served); see assets-src/README.md
worker/           Cloudflare Worker that issues R2 upload links
scripts/          migrate-users.mjs (one-off migration), seed-emulator.mjs (test data)
tests/            unit/ (Vitest) and rules/ (Firebase emulator)
docs/             rollout guides
old-static-files/ the original 2025 HTML site (not used)
```

## Conventions

- **Styling:** plain CSS, one file per page or component. Fonts are Crimson Text (site),
  Inter (dashboard and editor UI), Source Serif 4 (editor) and Noto Devanagari (Hindi). They load
  once, from `index.html`.
- **Images:**
  - put full-size originals in `assets-src/` and serve AVIF/WebP copies under 300 KB from
    `public/images/`;
  - lazy-load anything below the fold;
  - keep cover and hero images eager.
- **Lists:** every Firestore list query has a `limit()`. A query that needs a composite index
  must have that index in `firestore.indexes.json`.
