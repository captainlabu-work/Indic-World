// Firebase Storage security rules tests. Run with `npm run test:rules` (starts the emulator).
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteObject, getBytes, ref, uploadBytes } from 'firebase/storage';

const MB = 1024 * 1024;
let testEnv;

const storageOf = (uid) =>
  (uid ? testEnv.authenticatedContext(uid) : testEnv.unauthenticatedContext()).storage();
const upload = (uid, path, contentType, size = 1024) =>
  uploadBytes(ref(storageOf(uid), path), new Uint8Array(size), { contentType });

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-indic',
    storage: { rules: readFileSync('storage.rules', 'utf8') },
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearStorage();
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await uploadBytes(ref(ctx.storage(), 'articles/1700000000_old.jpg'), new Uint8Array(10), { contentType: 'image/jpeg' });
  });
});

describe('profile photos', () => {
  it('a user can upload their own profile photo (image, up to 5 MB)', async () => {
    await assertSucceeds(upload('alice', 'profile-photos/alice', 'image/jpeg'));
    await assertSucceeds(upload('alice', 'profile-photos/alice', 'image/webp', 5 * MB));
  });

  it("a user cannot upload someone else's profile photo", async () => {
    await assertFails(upload('bob', 'profile-photos/alice', 'image/jpeg'));
  });

  it('rejects non-images and photos over 5 MB', async () => {
    await assertFails(upload('alice', 'profile-photos/alice', 'text/html'));
    await assertFails(upload('alice', 'profile-photos/alice', 'image/svg+xml'));
    await assertFails(upload('alice', 'profile-photos/alice', 'image/gif'));
    await assertFails(upload('alice', 'profile-photos/alice', 'image/jpeg', 5 * MB + 1));
  });

  it('anyone can view a profile photo', async () => {
    await assertSucceeds(upload('alice', 'profile-photos/alice', 'image/png'));
    await assertSucceeds(getBytes(ref(storageOf(null), 'profile-photos/alice')));
  });
});

describe('story images and videos', () => {
  it('a writer can upload images (up to 15 MB) and videos to their own folders', async () => {
    await assertSucceeds(upload('alice', 'articles/alice/photo.jpg', 'image/jpeg'));
    await assertSucceeds(upload('alice', 'articles/alice/content/1.png', 'image/png', 15 * MB));
    await assertSucceeds(upload('alice', 'articles/alice/cover.avif', 'image/avif'));
    await assertSucceeds(upload('alice', 'videos/alice/film.mp4', 'video/mp4'));
    await assertSucceeds(upload('alice', 'videos/alice/film.mov', 'video/quicktime'));
    await assertSucceeds(upload('alice', 'videos/alice/film.webm', 'video/webm'));
  });

  it("a writer cannot upload into someone else's folder", async () => {
    await assertFails(upload('bob', 'articles/alice/photo.jpg', 'image/jpeg'));
    await assertFails(upload('bob', 'videos/alice/film.mp4', 'video/mp4'));
  });

  it('rejects wrong types and oversized images', async () => {
    await assertFails(upload('alice', 'articles/alice/page.html', 'text/html'));
    await assertFails(upload('alice', 'articles/alice/film.mp4', 'video/mp4'));
    await assertFails(upload('alice', 'videos/alice/photo.jpg', 'image/jpeg'));
    await assertFails(upload('alice', 'videos/alice/film.avi', 'video/x-msvideo'));
    await assertFails(upload('alice', 'articles/alice/big.jpg', 'image/jpeg', 15 * MB + 1));
  });

  it('logged-out visitors cannot upload anything', async () => {
    await assertFails(upload(null, 'articles/alice/photo.jpg', 'image/jpeg'));
    await assertFails(upload(null, 'profile-photos/alice', 'image/jpeg'));
  });

  it('a writer can delete their own files but not others', async () => {
    await assertSucceeds(upload('alice', 'articles/alice/photo.jpg', 'image/jpeg'));
    await assertFails(deleteObject(ref(storageOf('bob'), 'articles/alice/photo.jpg')));
    await assertSucceeds(deleteObject(ref(storageOf('alice'), 'articles/alice/photo.jpg')));
  });
});

describe('older files and other paths', () => {
  it('files uploaded before per-user folders stay publicly readable', async () => {
    await assertSucceeds(getBytes(ref(storageOf(null), 'articles/1700000000_old.jpg')));
  });

  it('old shared folders and unknown paths can no longer be written', async () => {
    await assertFails(upload('alice', 'articles/1700000001_new.jpg', 'image/jpeg'));
    await assertFails(upload('alice', 'uploads/alice/x.jpg', 'image/jpeg'));
    await assertFails(upload('alice', 'alice/x.jpg', 'image/jpeg'));
  });
});
