# CLAUDE.md

Guidance for AI coding assistants working in this repository. The human-facing overview is
[README.md](README.md).

## What this is

Indic World (indic.world) is a React 19 + Vite 7 single-page app with three story formats:
Word (writing), Lens (photo essays) and Motion (films).

- **No backend server.** The browser talks to Firebase directly:
  - Firebase Auth for logins;
  - Firestore for data;
  - Firebase Storage for files uploaded before Nov 2026, and for profile photos.
- **Uploads** go to Cloudflare R2 through the Worker in `worker/`, which checks the Firebase login
  and returns a presigned upload URL.
- **Hosting** is on Vercel. Cloudflare provides DNS, proxies in front of Vercel, and runs the
  Worker.

## Commands

```bash
npm run dev            # dev server on :3000 against the LIVE Firebase project
npm run dev:emulator   # dev server against local emulators (needs `npm run emulators` + `npm run seed:emulator`)
npm run build          # production build -> dist/
npm run lint           # must stay at 0 problems
npm test               # Vitest unit tests (tests/unit): sanitizer, Worker limits
npm run test:rules     # Firestore + Storage rules tests on the emulator (needs Java 21 + firebase CLI)
```

## Rules that keep the site safe — don't break these

- **Security rules are the only protection.** Any new collection, field or query needs a matching
  change in `firestore.rules` / `storage.rules`, plus tests in `tests/rules/`.
- **Admin** is `users/{uid}.role == "admin"`, checked by the rules.
  - The app never writes `role` for the signed-in user; the rules reject it.
  - `AuthContext.isAdmin` only controls what the UI shows.
  - There is no admin email in the code. Don't reintroduce `VITE_ADMIN_EMAIL`.
- **Two documents per user:**
  - `users/{uid}`: private (email, role).
  - `publicProfiles/{uid}`: public (displayName, photoURL, bio, subscriberCount). Anything
    shown on author pages or in search must come from here.
- **Subscriptions:**
  - IDs are `{subscriberId}_{authorId}`;
  - they are written in a batch with `subscriberCount: increment(±1)` on the author's public
    profile;
  - the rules verify the pair, so never write one without the other.
- **Views** may only go up by exactly 1 via `increment(1)` on a published story
  (`articleService.incrementViews`).
- **Story HTML is untrusted.** Render it only through `sanitizeStoryHtml` /
  `buildArticleBlocks` (`src/utils/`). If the editor gains new markup (classes, inline styles),
  allow it in `sanitizeHtml.js` and extend `tests/unit/sanitizeHtml.test.js`.
- **Upload limits** live in three places that must match:
  - `src/utils/uploadLimits.js` (the browser's friendly messages);
  - `storage.rules`;
  - `worker/src/index.js`.

  The Worker signs `Content-Type` and `Content-Length` into the upload URL.

## Data access conventions

- All Firestore access goes through `src/firebase/services.js`. The exceptions are a few pages
  with real-time listeners (Admin, Profile, Stats).
- **Every list query has a `limit()`.** Public lists use the `listArticles()` helper, which logs
  and returns `[]` on failure. Never fall back to reading a whole collection.
- **Composite indexes** must be declared in `firestore.indexes.json`. The live project's current
  set can be listed with `firebase firestore:indexes --project indicteam1` (read-only).
- **Admin counters** use `getCountFromServer`. Don't stream whole collections just to count them.

## Front-end conventions

- Plain CSS, one file per page/component; no CSS framework. Keep the existing editorial look
  (Crimson Text, monochrome palette).
- Fonts load **only** from the `<link>` in `index.html`. Don't add `@import` for fonts in CSS.
- **Images:** originals go in `assets-src/originals/`, which is git-ignored (the owner keeps them
  backed up separately). Serve AVIF/WebP copies under ~300 KB from `public/images/` with
  `srcset`/`image-set`. Lazy-load below-the-fold images; keep
  hero/cover images eager with `fetchPriority="high"`.
- Pages are lazy-loaded in `src/App.jsx`.

## Working agreements

- **Ask the owner before anything that changes the live site.** That covers:
  - pushing to `main` (Vercel deploys it);
  - deploying rules, indexes or the Worker;
  - changing DNS, domains or dashboard settings;
  - deleting files from storage.
- **Test against the emulators**, not production data: `npm run emulators`,
  `npm run seed:emulator`, `npm run dev:emulator`.
- **Docs:**
  - `docs/SECURITY_ROLLOUT.md`: how the Nov 2026 security update was deployed, and the deploy
    order to follow when rules and site code change together;
  - `worker/README.md`: Worker setup;
  - `assets-src/README.md`: how the optimised images were made.
