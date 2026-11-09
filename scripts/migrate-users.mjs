#!/usr/bin/env node
// One-off migration for the security update. See docs/SECURITY_ROLLOUT.md.
//
// What it does (with --apply):
//   1. Copies each user record from its old random-ID document in `users` to
//      users/{uid} (email, name, photo, earliest createdAt).
//   2. Removes `role` from every users/{uid} document. Roles used to be
//      self-assignable, so none can be trusted; the script prints the old roles,
//      and you then set your own admin role by hand (see the rollout guide).
//   3. Creates/updates publicProfiles/{uid} (name, photo, subscriber count) for
//      every user, and for any story author who has no user record.
//   4. Converts subscriptions to the ID "{subscriberId}_{authorId}", removes
//      duplicates and self-subscriptions, and recounts subscribers.
// With --delete-legacy --apply it instead deletes the old random-ID user
// documents (run this later, once the new version is live and checked).
//
// Usage:
//   node scripts/migrate-users.mjs --key path/to/service-account.json                  (dry run)
//   node scripts/migrate-users.mjs --key path/to/service-account.json --apply
//   node scripts/migrate-users.mjs --key path/to/service-account.json --delete-legacy --apply
// Emulator: FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node scripts/migrate-users.mjs --project demo-indic [--apply]

import { readFileSync } from 'node:fs';
import { cert, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const APPLY = flag('--apply');
const DELETE_LEGACY = flag('--delete-legacy');
const keyPath = option('--key');
const projectOption = option('--project');

function init() {
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    const projectId = projectOption || 'demo-indic';
    console.log(`Using the Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST} (project ${projectId})`);
    initializeApp({ projectId });
    return projectId;
  }
  if (!keyPath) {
    console.error('Missing --key <service-account.json>. See docs/SECURITY_ROLLOUT.md for how to get one.');
    process.exit(1);
  }
  const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
  initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id });
  return serviceAccount.project_id;
}

const projectId = init();
const db = getFirestore();

const firstNonEmpty = (...values) => values.find((v) => typeof v === 'string' && v.trim() !== '') ?? '';
const millis = (ts) => (ts && typeof ts.toMillis === 'function' ? ts.toMillis() : Infinity);

async function deleteLegacyUsers() {
  const snap = await db.collection('users').get();
  const legacy = snap.docs.filter((d) => d.data().uid && d.id !== d.data().uid);
  console.log(`Found ${legacy.length} old random-ID user document(s).`);

  const toDelete = [];
  for (const d of legacy) {
    const uid = d.data().uid;
    const current = await db.collection('users').doc(uid).get();
    if (!current.exists) {
      console.log(`  SKIP users/${d.id}: users/${uid} does not exist yet — run the migration with --apply first.`);
      continue;
    }
    toDelete.push(d);
    console.log(`  delete users/${d.id} (uid ${uid}, ${d.data().email || 'no email'})`);
  }

  if (!APPLY) {
    console.log('\nDry run — nothing deleted. Add --apply to delete these documents.');
    return;
  }
  const writer = db.bulkWriter();
  toDelete.forEach((d) => writer.delete(d.ref));
  await writer.close();
  console.log(`\nDeleted ${toDelete.length} old user document(s).`);
}

async function migrate() {
  const [usersSnap, subsSnap, articlesSnap] = await Promise.all([
    db.collection('users').get(),
    db.collection('subscriptions').get(),
    db.collection('articles').select('authorId', 'authorName', 'createdAt').get(),
  ]);

  // ---- Users: group every document by the Firebase Auth UID it belongs to
  const byUid = new Map();
  for (const d of usersSnap.docs) {
    const uid = d.data().uid || d.id;
    if (!byUid.has(uid)) byUid.set(uid, []);
    byUid.get(uid).push(d);
  }

  // ---- Subscriptions: one canonical document per (subscriber, author)
  const canonicalSubs = new Map(); // id -> data
  const subsToDelete = [];
  let selfSubs = 0;
  for (const d of subsSnap.docs) {
    const { subscriberId, authorId, subscribedAt } = d.data();
    if (typeof subscriberId !== 'string' || typeof authorId !== 'string' || subscriberId === authorId) {
      if (subscriberId === authorId) selfSubs++;
      subsToDelete.push(d.ref);
      continue;
    }
    const id = `${subscriberId}_${authorId}`;
    const existing = canonicalSubs.get(id);
    if (!existing || millis(subscribedAt) < millis(existing.subscribedAt)) {
      canonicalSubs.set(id, { subscriberId, authorId, subscribedAt: subscribedAt || FieldValue.serverTimestamp() });
    }
    if (d.id !== id) subsToDelete.push(d.ref);
  }
  const subscriberCounts = new Map();
  for (const { authorId } of canonicalSubs.values()) {
    subscriberCounts.set(authorId, (subscriberCounts.get(authorId) || 0) + 1);
  }

  // ---- Story authors without a user record still need a public profile
  const authorNames = new Map();
  for (const d of articlesSnap.docs) {
    const { authorId, authorName } = d.data();
    if (authorId && !byUid.has(authorId) && authorName && !authorNames.has(authorId)) {
      authorNames.set(authorId, authorName);
    }
  }

  // ---- Report
  const legacyCount = usersSnap.docs.filter((d) => d.data().uid && d.id !== d.data().uid).length;
  console.log(`Project: ${projectId}`);
  console.log(`Users: ${byUid.size} account(s) in ${usersSnap.size} document(s) (${legacyCount} old random-ID document(s)).`);

  const roleRows = [];
  for (const [uid, docs] of byUid) {
    for (const d of docs) {
      if (d.data().role) roleRows.push({ uid, email: d.data().email || '', role: d.data().role, doc: d.id });
    }
  }
  if (roleRows.length) {
    console.log('\nRoles that will be REMOVED (re-grant admin by hand afterwards; see the rollout guide):');
    console.table(roleRows);
  }
  console.log(`Subscriptions: ${subsSnap.size} document(s) -> ${canonicalSubs.size} subscription(s); ` +
    `${subsToDelete.length} to remove (old IDs, duplicates, ${selfSubs} self-subscription(s)).`);
  if (authorNames.size) {
    console.log(`Story authors with no user record (public profile created from the story byline): ${authorNames.size}`);
  }

  if (!APPLY) {
    console.log('\nDry run — nothing written. Add --apply to make these changes.');
    return;
  }

  // ---- Write
  const writer = db.bulkWriter();
  const now = FieldValue.serverTimestamp();

  for (const [uid, docs] of byUid) {
    const current = docs.find((d) => d.id === uid)?.data() || {};
    const others = docs.filter((d) => d.id !== uid).map((d) => d.data());
    const all = [current, ...others];
    const createdAt = all.map((u) => u.createdAt).filter(Boolean).sort((a, b) => millis(a) - millis(b))[0] || now;
    const displayName = firstNonEmpty(...all.map((u) => u.displayName));
    const photoURL = firstNonEmpty(...all.map((u) => u.photoURL));

    writer.set(db.collection('users').doc(uid), {
      uid,
      email: firstNonEmpty(...all.map((u) => u.email)),
      displayName,
      photoURL,
      createdAt,
      role: FieldValue.delete(),
      articlesCount: FieldValue.delete(),
    }, { merge: true });

    writer.set(db.collection('publicProfiles').doc(uid), {
      displayName,
      photoURL,
      subscriberCount: subscriberCounts.get(uid) || 0,
      updatedAt: now,
    }, { merge: true });
  }

  for (const [authorId, authorName] of authorNames) {
    writer.set(db.collection('publicProfiles').doc(authorId), {
      displayName: authorName,
      subscriberCount: subscriberCounts.get(authorId) || 0,
      updatedAt: now,
    }, { merge: true });
  }

  for (const [id, data] of canonicalSubs) {
    writer.set(db.collection('subscriptions').doc(id), data);
  }
  for (const ref of subsToDelete) {
    if (!canonicalSubs.has(ref.id)) writer.delete(ref);
  }

  await writer.close();
  console.log('\nMigration applied.');
  console.log('Next: set role "admin" on your own users/{uid} document in the Firebase console.');
  console.log('Later, once everything works: run again with --delete-legacy --apply to remove old user documents.');
}

const run = DELETE_LEGACY ? deleteLegacyUsers : migrate;
run().catch((err) => {
  console.error(err);
  process.exit(1);
});
