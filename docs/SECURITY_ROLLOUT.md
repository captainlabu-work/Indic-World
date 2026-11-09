# Security update — rollout guide

How to put the `fix/security` branch live without locking yourself out of the admin panel.
Nothing in this guide has been deployed yet. Do the steps **in order**.

> `fix/security` was built on top of `wip/r2-uploads`, so merging it also switches story
> images and videos to Cloudflare R2. That is why step 4 (the R2 checks) is part of this rollout.

## What changes for people using the site

- Admins are now decided by `role: "admin"` on the user's Firestore record `users/{uid}`, checked by
  Firestore itself. `VITE_ADMIN_EMAIL` is no longer used.
- Each account has a private record `users/{uid}` (email, role) and a public profile
  `publicProfiles/{uid}` (name, photo, subscriber count). Other users can no longer see emails.
- Writers can create and edit only their own stories, and can only set them to draft or
  "submitted for review". Only admins can publish, reject, request changes, set Staff Picks,
  the Public Domain badge or the homepage cover story.
- Subscribe, the contact form, public author pages, search (also when logged out) and role
  changes in the admin panel now work.
- Story HTML is cleaned before it is shown, so hidden code in a story cannot run.
- Uploads are limited to JPEG/PNG/WebP/AVIF images (15 MB, profile photos 5 MB) and
  MP4/MOV/WebM videos (750 MB). AVI is no longer accepted.
- Writers no longer see their subscribers' email addresses.

## Before you start

- Firebase CLI logged in: `firebase login` (check with `firebase projects:list`).
- Wrangler logged in for the Worker: `cd worker`, then `npx wrangler whoami`.
- Pick a quiet time for step 7. Steps 1–6 don't affect the live site.

## 1. Get a service account key (for the migration script)

1. Firebase console → ⚙ Project settings → **Service accounts** → **Generate new private key**.
2. Save the file **outside the repository**, e.g. `C:\Users\thaku\keys\indic-service-account.json`.
   (The repo's `.gitignore` also ignores service-account key files, just in case.)

## 2. Migrate existing users (live site keeps working)

From the repository root, on the `fix/security` branch:

```powershell
# Dry run: shows what would change, writes nothing
node scripts/migrate-users.mjs --key C:\Users\thaku\keys\indic-service-account.json

# Apply
node scripts/migrate-users.mjs --key C:\Users\thaku\keys\indic-service-account.json --apply
```

The script:
- copies each user to `users/{uid}`;
- creates their public profile;
- converts subscriptions to the new format and recounts them.

It also **removes every `role`**, because until now anyone could give themselves a role.
It prints a table of the roles it removed, so you can see if anyone had made themselves admin.
Old user documents are kept for now; step 9 removes them.

## 3. Make yourself the first admin (do this AFTER step 2)

1. Firebase console → **Authentication** → **Users** → find your email → copy the **User UID**.
2. Firebase console → **Firestore Database** → collection `users` → open the document whose ID is
   that UID (it was created in step 2).
3. **Add field**: name `role`, type `string`, value `admin` → **Add**.

If you re-run the migration with `--apply` later, it removes roles again: repeat this step.
To make someone else an admin later, use the admin panel's Users tab.

## 4. Prepare R2 uploads (needed because this branch uploads to R2)

1. Deploy the Worker with the new type/size limits:
   ```powershell
   cd worker
   npx wrangler deploy
   cd ..
   ```
2. Cloudflare dashboard → R2 → `indic-world-media` → Settings → **CORS policy**. Check it allows:
   - method `PUT`
   - header `Content-Type`
   - origins `https://indic.world` and `https://www.indic.world`
3. Check that `https://media.indic.world` serves the bucket's files.
4. Vercel → Project → Settings → **Environment Variables** (Production): add
   `VITE_R2_UPLOAD_WORKER_URL` with the same value as in your local `.env`.

## 5. Add the Firestore index for subscribers

Firebase console → Firestore → **Indexes** → **Composite** → **Create index**:
- Collection ID: `subscriptions`
- Fields: `authorId` Ascending, `subscribedAt` Descending
- Query scope: Collection

Wait until its status is **Enabled**. (Without it the Subscribers page and the Stats subscriber
chart show nothing.)

## 6. Check everything locally (optional but recommended)

```powershell
npm test              # sanitizer + Worker unit tests
npm run test:rules    # Firestore + Storage rules tests (needs Java 21 on PATH)
npm run build
```

## 7. Go live — do these three back to back

```powershell
git checkout main
git merge --ff-only fix/security
git push origin main
```

Wait until Vercel shows the new deployment as **Ready** (about 1–2 minutes), then immediately:

```powershell
firebase deploy --only firestore:rules --project indicteam1
firebase deploy --only storage --project indicteam1
```

**Why this order:**
- **Old site with new rules:** sign-in profiles would break for everyone, because the old site
  looks users up in a way the new rules block.
- **New site with old rules:** only author pages and search fail. That lasts the minute or two
  until the rules deploy, and new sign-ups may error during that time.

**Storage rules come last.** The old site uploads story images to Firebase in shared folders,
which the new Storage rules block.

## 8. Smoke test on indic.world

- **Logged out:**
  - open a story and an author page;
  - search for an author;
  - send the contact form.
- **Logged in as a normal user:**
  - subscribe, then unsubscribe;
  - upload an image in the editor and a short MP4 in Motion.
- **As admin:**
  - open the admin panel;
  - change a test user's role;
  - approve a pending story.

## 9. Clean up (a few days later, once everything works)

```powershell
node scripts/migrate-users.mjs --key C:\Users\thaku\keys\indic-service-account.json --delete-legacy
node scripts/migrate-users.mjs --key C:\Users\thaku\keys\indic-service-account.json --delete-legacy --apply
```

Then:
- delete the key file and revoke it (Google Cloud console → IAM → Service accounts → Keys);
- remove `VITE_ADMIN_EMAIL` from Vercel's environment variables and your local `.env`.

## If something goes wrong

- **Locked out of the admin panel:** edits in the Firebase console ignore the rules, so redo step 3.
- **Roll back the rules:**
  - Firebase console → Firestore → **Rules** → history → pick the previous version → **Publish**.
    Do the same for Storage.
  - Or from a `main` checkout before this merge: `firebase deploy --only firestore:rules,storage`.
- **Roll back the site:** Vercel → Deployments → previous deployment → **Instant Rollback**.
- Roll back the site **and** the rules together. The old site only works with the old rules.

## Testing on your own machine

| Command | What it does |
|---|---|
| `npm test` | Unit tests: HTML sanitizer, Worker upload limits |
| `npm run test:rules` | Starts the emulators and runs the Firestore and Storage rules tests (needs Java 21) |
| `npm run emulators` | Starts local Auth/Firestore/Storage emulators (demo project, no real data) |
| `npm run seed:emulator` | Adds test accounts and stories to the emulators |
| `npm run dev:emulator` | Runs the site against the emulators at http://localhost:3000 |

Test accounts: `admin@indic.test`, `alice@indic.test`, `bob@indic.test` (password `password123`).
Uploads are disabled in emulator mode, because the R2 Worker only accepts real logins.
