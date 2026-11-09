// Firestore security rules tests. Run with `npm run test:rules` (starts the emulator).
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

let testEnv;

const asAnon = () => testEnv.unauthenticatedContext().firestore();
const asUser = (uid) => testEnv.authenticatedContext(uid, { email: `${uid}@example.com` }).firestore();

const article = (overrides = {}) => ({
  title: 'A story',
  excerpt: 'Subtitle',
  content: '<p>Body</p>',
  category: 'word',
  featuredImage: '',
  tags: [],
  authorId: 'alice',
  authorName: 'Alice',
  status: 'draft',
  views: 0,
  isVisualStory: true,
  ...overrides,
});

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-indic',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    const now = new Date();
    for (const [uid, extra] of [['admin', { role: 'admin' }], ['alice', {}], ['bob', {}]]) {
      await setDoc(doc(db, 'users', uid), {
        uid, email: `${uid}@example.com`, displayName: uid, photoURL: '', createdAt: now, ...extra,
      });
      await setDoc(doc(db, 'publicProfiles', uid), { displayName: uid, photoURL: '', subscriberCount: 0 });
    }
    await setDoc(doc(db, 'articles', 'published1'), article({ status: 'published', views: 3, createdAt: now, updatedAt: now }));
    await setDoc(doc(db, 'articles', 'draft1'), article({ status: 'draft', title: 'Secret draft', createdAt: now, updatedAt: now }));
    await setDoc(doc(db, 'siteSettings', 'homepage'), { coverStoryId: 'published1' });
  });
});

describe('admin role', () => {
  it('a new user can create their own record without a role', async () => {
    await assertSucceeds(setDoc(doc(asUser('carol'), 'users', 'carol'), {
      uid: 'carol', email: 'carol@example.com', displayName: 'Carol', photoURL: '', createdAt: serverTimestamp(),
    }));
  });

  it('a new user cannot create their own record with a role', async () => {
    await assertFails(setDoc(doc(asUser('carol'), 'users', 'carol'), {
      uid: 'carol', email: 'carol@example.com', displayName: 'Carol', photoURL: '', role: 'admin', createdAt: serverTimestamp(),
    }));
  });

  it('a user cannot create a record for someone else or with another email', async () => {
    await assertFails(setDoc(doc(asUser('carol'), 'users', 'dave'), {
      uid: 'dave', email: 'dave@example.com', displayName: 'Dave', createdAt: serverTimestamp(),
    }));
    await assertFails(setDoc(doc(asUser('carol'), 'users', 'carol'), {
      uid: 'carol', email: 'admin@example.com', displayName: 'Carol', createdAt: serverTimestamp(),
    }));
  });

  it('a user cannot make themselves admin', async () => {
    await assertFails(updateDoc(doc(asUser('alice'), 'users', 'alice'), { role: 'admin' }));
  });

  it('a user can change their own name and photo', async () => {
    await assertSucceeds(updateDoc(doc(asUser('alice'), 'users', 'alice'), {
      displayName: 'Alice A.', photoURL: 'https://example.com/a.jpg', updatedAt: serverTimestamp(),
    }));
  });

  it("a user cannot change someone else's record", async () => {
    await assertFails(updateDoc(doc(asUser('bob'), 'users', 'alice'), { displayName: 'Hacked' }));
  });

  it("an admin can change another user's role", async () => {
    await assertSucceeds(updateDoc(doc(asUser('admin'), 'users', 'alice'), { role: 'editor' }));
    await assertSucceeds(updateDoc(doc(asUser('admin'), 'users', 'bob'), { role: 'admin' }));
  });

  it("an admin cannot change other fields on someone else's record or set an unknown role", async () => {
    await assertFails(updateDoc(doc(asUser('admin'), 'users', 'alice'), { email: 'x@example.com' }));
    await assertFails(updateDoc(doc(asUser('admin'), 'users', 'alice'), { role: 'superuser' }));
  });
});

describe('email privacy', () => {
  it("a user cannot read another user's record (email)", async () => {
    await assertFails(getDoc(doc(asUser('bob'), 'users', 'alice')));
  });

  it('a user can read their own record', async () => {
    await assertSucceeds(getDoc(doc(asUser('alice'), 'users', 'alice')));
  });

  it('only admins can list user records', async () => {
    await assertFails(getDocs(collection(asAnon(), 'users')));
    await assertFails(getDocs(collection(asUser('alice'), 'users')));
    await assertSucceeds(getDocs(collection(asUser('admin'), 'users')));
  });
});

describe('public profiles', () => {
  it('a logged-out visitor can read an author profile and search profiles', async () => {
    await assertSucceeds(getDoc(doc(asAnon(), 'publicProfiles', 'alice')));
    await assertSucceeds(getDocs(collection(asAnon(), 'publicProfiles')));
  });

  it('public profiles cannot hold an email address', async () => {
    await assertFails(setDoc(doc(asUser('carol'), 'publicProfiles', 'carol'), {
      displayName: 'Carol', email: 'carol@example.com', subscriberCount: 0,
    }));
  });

  it("a user cannot edit someone else's profile", async () => {
    await assertFails(updateDoc(doc(asUser('bob'), 'publicProfiles', 'alice'), { displayName: 'Hacked' }));
  });

  it('a user cannot set their own subscriber count', async () => {
    await assertFails(updateDoc(doc(asUser('alice'), 'publicProfiles', 'alice'), { subscriberCount: 1000 }));
    await assertFails(setDoc(doc(asUser('carol'), 'publicProfiles', 'carol'), { displayName: 'Carol', subscriberCount: 50 }));
  });
});

describe('reading stories', () => {
  it('a logged-out visitor can read a published story', async () => {
    await assertSucceeds(getDoc(doc(asAnon(), 'articles', 'published1')));
  });

  it('a logged-out visitor can list published stories', async () => {
    await assertSucceeds(getDocs(query(collection(asAnon(), 'articles'), where('status', '==', 'published'))));
  });

  it('a logged-out visitor cannot list all stories', async () => {
    await assertFails(getDocs(collection(asAnon(), 'articles')));
  });

  it("nobody but the author and admins can read a draft", async () => {
    await assertFails(getDoc(doc(asAnon(), 'articles', 'draft1')));
    await assertFails(getDoc(doc(asUser('bob'), 'articles', 'draft1')));
    await assertSucceeds(getDoc(doc(asUser('alice'), 'articles', 'draft1')));
    await assertSucceeds(getDoc(doc(asUser('admin'), 'articles', 'draft1')));
  });

  it("a writer can list their own stories but not someone else's", async () => {
    await assertSucceeds(getDocs(query(collection(asUser('alice'), 'articles'), where('authorId', '==', 'alice'))));
    await assertFails(getDocs(query(collection(asUser('bob'), 'articles'), where('authorId', '==', 'alice'))));
  });
});

describe('writing stories', () => {
  const newStory = (overrides = {}) => article({ createdAt: serverTimestamp(), updatedAt: serverTimestamp(), ...overrides });

  it('a writer can create a draft or submit a story as themselves', async () => {
    await assertSucceeds(addDoc(collection(asUser('alice'), 'articles'), newStory()));
    await assertSucceeds(addDoc(collection(asUser('alice'), 'articles'), newStory({ status: 'pending' })));
  });

  it('a writer cannot create a story for someone else', async () => {
    await assertFails(addDoc(collection(asUser('bob'), 'articles'), newStory({ authorId: 'alice' })));
  });

  it('a writer cannot create a story that is already published or has admin fields', async () => {
    await assertFails(addDoc(collection(asUser('alice'), 'articles'), newStory({ status: 'published' })));
    await assertFails(addDoc(collection(asUser('alice'), 'articles'), newStory({ staffPick: true })));
    await assertFails(addDoc(collection(asUser('alice'), 'articles'), newStory({ views: 500 })));
  });

  it('rejects invalid titles and statuses', async () => {
    await assertFails(addDoc(collection(asUser('alice'), 'articles'), newStory({ title: 'x'.repeat(301) })));
    await assertFails(addDoc(collection(asUser('alice'), 'articles'), newStory({ title: '' })));
    await assertFails(addDoc(collection(asUser('alice'), 'articles'), newStory({ status: 'live' })));
    await assertFails(addDoc(collection(asUser('alice'), 'articles'), newStory({ category: 'audio' })));
  });

  it("a writer cannot edit someone else's story", async () => {
    await assertFails(updateDoc(doc(asUser('bob'), 'articles', 'draft1'), {
      title: 'Hijacked', updatedAt: serverTimestamp(),
    }));
  });

  it('a writer can edit and submit their own story', async () => {
    await assertSucceeds(updateDoc(doc(asUser('alice'), 'articles', 'draft1'), {
      title: 'Better title', status: 'pending', updatedAt: serverTimestamp(),
    }));
  });

  it('a writer cannot publish without being an admin', async () => {
    await assertFails(updateDoc(doc(asUser('alice'), 'articles', 'draft1'), {
      status: 'published', updatedAt: serverTimestamp(),
    }));
  });

  it('a writer cannot reject, request changes or set admin-only fields', async () => {
    const ref = doc(asUser('alice'), 'articles', 'draft1');
    await assertFails(updateDoc(ref, { status: 'rejected', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref, { status: 'needs-revision', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref, { staffPick: true, updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref, { publicDomainVerified: true, updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref, { authorId: 'bob', updatedAt: serverTimestamp() }));
  });

  it('a writer cannot quietly change a published story; editing sends it back to review', async () => {
    const ref = doc(asUser('alice'), 'articles', 'published1');
    await assertFails(updateDoc(ref, { content: '<p>Changed</p>', updatedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(ref, { content: '<p>Changed</p>', status: 'pending', updatedAt: serverTimestamp() }));
  });

  it('a writer can soft-delete or permanently delete their own story, but not others', async () => {
    await assertSucceeds(updateDoc(doc(asUser('alice'), 'articles', 'draft1'), {
      status: 'deleted', deletedAt: serverTimestamp(), updatedAt: serverTimestamp(),
    }));
    await assertFails(deleteDoc(doc(asUser('bob'), 'articles', 'published1')));
    await assertSucceeds(deleteDoc(doc(asUser('alice'), 'articles', 'published1')));
  });

  it('an admin can publish, reject and set Staff Picks / Public Domain', async () => {
    const ref = doc(asUser('admin'), 'articles', 'draft1');
    await assertSucceeds(updateDoc(ref, {
      status: 'published', publishedAt: serverTimestamp(), isRevised: false, revisionNote: '', updatedAt: serverTimestamp(),
    }));
    await assertSucceeds(updateDoc(ref, { staffPick: true, staffPickOrder: 1, publicDomainVerified: true }));
    await assertSucceeds(updateDoc(ref, { status: 'rejected', rejectionReason: 'Off topic' }));
  });

  it('only admins can change homepage settings', async () => {
    await assertSucceeds(getDoc(doc(asAnon(), 'siteSettings', 'homepage')));
    await assertFails(setDoc(doc(asUser('alice'), 'siteSettings', 'homepage'), { coverStoryId: 'draft1' }, { merge: true }));
    await assertSucceeds(setDoc(doc(asUser('admin'), 'siteSettings', 'homepage'), { coverStoryId: 'published1' }, { merge: true }));
  });
});

describe('view counts', () => {
  it('a logged-out visitor can add one view to a published story', async () => {
    await assertSucceeds(updateDoc(doc(asAnon(), 'articles', 'published1'), { views: increment(1) }));
  });

  it('nobody can set views to an arbitrary number or add more than one', async () => {
    await assertFails(updateDoc(doc(asAnon(), 'articles', 'published1'), { views: 1000000 }));
    await assertFails(updateDoc(doc(asUser('bob'), 'articles', 'published1'), { views: increment(2) }));
    await assertFails(updateDoc(doc(asAnon(), 'articles', 'published1'), { views: increment(-1) }));
  });

  it('a view increment cannot change anything else or touch unpublished stories', async () => {
    await assertFails(updateDoc(doc(asAnon(), 'articles', 'published1'), { views: increment(1), title: 'Spam' }));
    await assertFails(updateDoc(doc(asUser('bob'), 'articles', 'draft1'), { views: increment(1) }));
  });
});

describe('subscriptions', () => {
  const subscribe = (db, subscriberId, authorId, step = 1) => {
    const batch = writeBatch(db);
    batch.set(doc(db, 'subscriptions', `${subscriberId}_${authorId}`), {
      subscriberId, authorId, subscribedAt: serverTimestamp(),
    });
    batch.update(doc(db, 'publicProfiles', authorId), { subscriberCount: increment(step) });
    return batch.commit();
  };

  const unsubscribe = (db, subscriberId, authorId) => {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'subscriptions', `${subscriberId}_${authorId}`));
    batch.update(doc(db, 'publicProfiles', authorId), { subscriberCount: increment(-1) });
    return batch.commit();
  };

  it('a reader can subscribe and unsubscribe as themselves; the count follows', async () => {
    const bob = asUser('bob');
    await assertSucceeds(subscribe(bob, 'bob', 'alice'));
    expect((await getDoc(doc(asAnon(), 'publicProfiles', 'alice'))).data().subscriberCount).toBe(1);
    await assertSucceeds(getDoc(doc(bob, 'subscriptions', 'bob_alice')));
    await assertSucceeds(unsubscribe(bob, 'bob', 'alice'));
    expect((await getDoc(doc(asAnon(), 'publicProfiles', 'alice'))).data().subscriberCount).toBe(0);
  });

  it('a reader cannot subscribe someone else or subscribe to themselves', async () => {
    const bob = asUser('bob');
    const batch = writeBatch(bob);
    batch.set(doc(bob, 'subscriptions', 'admin_alice'), { subscriberId: 'admin', authorId: 'alice', subscribedAt: serverTimestamp() });
    batch.update(doc(bob, 'publicProfiles', 'alice'), { subscriberCount: increment(1) });
    await assertFails(batch.commit());
    await assertFails(subscribe(bob, 'bob', 'bob'));
  });

  it('the count cannot be inflated or changed without a real subscription', async () => {
    const bob = asUser('bob');
    await assertFails(subscribe(bob, 'bob', 'alice', 5));
    await assertFails(updateDoc(doc(bob, 'publicProfiles', 'alice'), { subscriberCount: increment(1) }));
    await assertFails(setDoc(doc(bob, 'subscriptions', 'bob_alice'), {
      subscriberId: 'bob', authorId: 'alice', subscribedAt: serverTimestamp(),
    }));
  });

  it('writers can list their own subscribers; others cannot', async () => {
    await assertSucceeds(subscribe(asUser('bob'), 'bob', 'alice'));
    await assertSucceeds(getDocs(query(collection(asUser('alice'), 'subscriptions'), where('authorId', '==', 'alice'))));
    await assertFails(getDocs(query(collection(asUser('carol'), 'subscriptions'), where('authorId', '==', 'alice'))));
    await assertFails(getDoc(doc(asUser('carol'), 'subscriptions', 'bob_alice')));
    await assertFails(getDocs(query(collection(asAnon(), 'subscriptions'), where('authorId', '==', 'alice'))));
  });

  it('a reader cannot unsubscribe someone else', async () => {
    await assertSucceeds(subscribe(asUser('bob'), 'bob', 'alice'));
    await assertFails(unsubscribe(asUser('carol'), 'bob', 'alice'));
  });
});

describe('contact form', () => {
  const message = (overrides = {}) => ({
    name: 'Reader', email: 'reader@example.com', message: 'Hello!', timestamp: serverTimestamp(), status: 'unread', ...overrides,
  });

  it('a logged-out visitor can submit the contact form', async () => {
    await assertSucceeds(addDoc(collection(asAnon(), 'contact_submissions'), message()));
  });

  it('rejects oversized or malformed submissions', async () => {
    const anon = asAnon();
    await assertFails(addDoc(collection(anon, 'contact_submissions'), message({ message: 'x'.repeat(5001) })));
    await assertFails(addDoc(collection(anon, 'contact_submissions'), message({ name: 'x'.repeat(101) })));
    await assertFails(addDoc(collection(anon, 'contact_submissions'), message({ email: 'not-an-email' })));
    await assertFails(addDoc(collection(anon, 'contact_submissions'), message({ extra: 'field' })));
    await assertFails(addDoc(collection(anon, 'contact_submissions'), message({ status: 'read' })));
  });

  it('only admins can read submissions', async () => {
    await assertSucceeds(addDoc(collection(asAnon(), 'contact_submissions'), message()));
    await assertFails(getDocs(collection(asAnon(), 'contact_submissions')));
    await assertFails(getDocs(collection(asUser('alice'), 'contact_submissions')));
    await assertSucceeds(getDocs(collection(asUser('admin'), 'contact_submissions')));
  });
});
