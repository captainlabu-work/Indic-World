#!/usr/bin/env node
// Fill the local Firebase emulators with test accounts and stories, for trying the
// app with `npm run dev:emulator`. Refuses to run against anything but a demo project.
//
//   npm run emulators          (terminal 1)
//   npm run seed:emulator      (terminal 2)
//   npm run dev:emulator       (terminal 2) → sign in as admin@indic.test / password123
//
// --legacy seeds data in the OLD format (random-ID user documents with
// self-assigned roles, random-ID subscriptions) for testing scripts/migrate-users.mjs.

import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
const projectId = process.env.GCLOUD_PROJECT || 'demo-indic';
if (!projectId.startsWith('demo-')) {
  console.error(`Refusing to seed project "${projectId}": only demo-* emulator projects are allowed.`);
  process.exit(1);
}

initializeApp({ projectId });
const auth = getAuth();
const db = getFirestore();
const LEGACY = process.argv.includes('--legacy');
const now = FieldValue.serverTimestamp();

const PASSWORD = 'password123';
const accounts = [
  { uid: 'admin-uid', email: 'admin@indic.test', displayName: 'Indic Admin', role: 'admin' },
  { uid: 'alice-uid', email: 'alice@indic.test', displayName: 'Alice Writer' },
  { uid: 'bob-uid', email: 'bob@indic.test', displayName: 'Bob Reader' },
];

const storyHtml = [
  '<h2>Monsoon notebooks</h2>',
  '<p style="text-align: center;"><em>A short walk through the city in the rain.</em></p>',
  '<p>The first rain arrived on a Tuesday. <strong>Bold</strong>, <u>underlined</u> and a ',
  '<a target="_blank" rel="noopener noreferrer nofollow" href="https://example.com">link</a>.</p>',
  '<blockquote><p>Every street remembers the water.</p></blockquote>',
  '<figure data-type="image" data-width="100%" data-layout="center" class="article-image img-full layout-center">',
  '<img src="/kyrie-isaac-b5yyiiRflis-unsplash.jpg" alt=""><figcaption>A single full-width image</figcaption></figure>',
  '<div data-type="image-grid" data-images="[]" class="image-grid cols-2">',
  '<figure class="grid-cell"><div class="image-frame"><img src="/vasiko-gorkovoy-OkBBRDHoxNw-unsplash.jpg" alt=""></div><figcaption>Left</figcaption></figure>',
  '<figure class="grid-cell"><div class="image-frame"><img src="/kyrie-isaac-b5yyiiRflis-unsplash.jpg" alt=""></div><figcaption>Right</figcaption></figure>',
  '</div>',
  '<ul><li><p>One</p></li><li><p>Two</p></li></ul>',
].join('');

// Each payload tries to change the page title; if sanitizing works the title stays normal.
const attackHtml = [
  '<p>This story tries to run hidden code. None of it should work.</p>',
  '<img src="x" onerror="document.title=\'HACKED-onerror\'">',
  '<script>document.title=\'HACKED-script\'</script>',
  '<p><a href="javascript:document.title=\'HACKED-link\'">A javascript: link</a></p>',
  '<p style="position:fixed;inset:0;background:#c00;color:#fff;z-index:99999" class="admin-modal-overlay">FAKE OVERLAY</p>',
  '&lt;img src=x onerror="document.title=\'HACKED-escaped\'"&gt;',
  '<svg onload="document.title=\'HACKED-svg\'"></svg>',
  '<iframe src="https://example.com"></iframe>',
].join('');

const story = (overrides) => ({
  title: 'Untitled', excerpt: '', content: '<p>Story</p>', category: 'word', featuredImage: '',
  thumbnailCaption: '', sourceText: '', tags: [], authorId: 'alice-uid', authorName: 'Alice Writer',
  status: 'draft', views: 0, isVisualStory: true, createdAt: now, updatedAt: now, ...overrides,
});

async function seed() {
  for (const { uid, email, displayName } of accounts) {
    await auth.deleteUser(uid).catch(() => {});
    await auth.createUser({ uid, email, displayName, password: PASSWORD });
  }

  const batch = db.batch();
  for (const { uid, email, displayName, role } of accounts) {
    if (LEGACY) {
      // Old format: random document ID with a uid field; Bob gave himself admin.
      batch.set(db.collection('users').doc(), {
        uid, email, displayName, photoURL: '', role: uid === 'alice-uid' ? 'author' : 'admin',
        createdAt: now, articlesCount: 0,
      });
    } else {
      batch.set(db.collection('users').doc(uid), {
        uid, email, displayName, photoURL: '', createdAt: now, ...(role ? { role } : {}),
      });
      batch.set(db.collection('publicProfiles').doc(uid), { displayName, photoURL: '', subscriberCount: 0, updatedAt: now });
    }
  }

  batch.set(db.collection('articles').doc('monsoon-notebooks'), story({
    title: 'Monsoon notebooks', excerpt: 'A short walk through the city in the rain.',
    content: storyHtml, status: 'published', publishedAt: now, views: 12,
    featuredImage: '/kyrie-isaac-b5yyiiRflis-unsplash.jpg', tags: ['Travel & Places'],
  }));
  batch.set(db.collection('articles').doc('hidden-code-test'), story({
    title: 'Hidden code test', excerpt: 'Checks that story HTML is sanitized.', content: attackHtml,
    status: 'published', publishedAt: now, authorId: 'bob-uid', authorName: 'Bob Reader',
  }));
  batch.set(db.collection('articles').doc('alice-draft'), story({ title: "Alice's private draft" }));
  batch.set(db.collection('articles').doc('bob-pending'), story({
    title: "Bob's story awaiting review", status: 'pending', authorId: 'bob-uid', authorName: 'Bob Reader',
  }));
  batch.set(db.collection('siteSettings').doc('homepage'), { coverStoryId: 'monsoon-notebooks', coverFocalX: 50, coverFocalY: 50 });

  if (LEGACY) {
    batch.set(db.collection('subscriptions').doc(), { subscriberId: 'bob-uid', authorId: 'alice-uid', subscribedAt: now });
  }

  await batch.commit();
  console.log(`Seeded ${LEGACY ? 'OLD-format' : 'current-format'} data into ${projectId}.`);
  console.log(`Accounts (password "${PASSWORD}"): ${accounts.map((a) => a.email).join(', ')}`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
