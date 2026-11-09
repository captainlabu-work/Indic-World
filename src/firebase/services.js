import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getCountFromServer,
  query,
  where,
  orderBy,
  limit,
  increment,
  runTransaction,
  writeBatch,
  serverTimestamp
} from "firebase/firestore";
import { auth, db } from "./config";

// ==================== Authentication Services ====================

export const authService = {
  // Sign up new user
  async signUp(email, password, displayName) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    await userService.ensureUserDocuments(userCredential.user, { displayName });
    return userCredential.user;
  },

  // Sign in existing user
  async signIn(email, password) {
    return await signInWithEmailAndPassword(auth, email, password);
  },

  // Sign in with Google
  async signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    await userService.ensureUserDocuments(result.user);
    return result.user;
  },

  // Sign out
  async signOut() {
    return await signOut(auth);
  },

  // Reset password
  async resetPassword(email) {
    return await sendPasswordResetEmail(auth, email);
  }
};

// ==================== User Services ====================

// Each account has two documents, both keyed by the Firebase Auth UID:
// - users/{uid}: private record (email, role). Readable only by its owner and admins.
// - publicProfiles/{uid}: name, photo and subscriber count. Readable by anyone.
// `role` is never written by the app for the signed-in user; the rules only let
// an admin set it (the first admin is set by hand in the Firebase console).
export const userService = {
  // Get the signed-in user's private record (or any user's, for admins)
  async getUserData(uid) {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  // Get the public profile shown on author pages and in search
  async getPublicProfile(uid) {
    const snap = await getDoc(doc(db, "publicProfiles", uid));
    return snap.exists() ? { id: snap.id, uid: snap.id, ...snap.data() } : null;
  },

  // Create users/{uid} and publicProfiles/{uid} if they don't exist yet.
  // Runs in a transaction because sign-up and the auth listener can both call it.
  async ensureUserDocuments(user, { displayName } = {}) {
    const name = displayName ?? user.displayName ?? '';
    const userRef = doc(db, "users", user.uid);
    const profileRef = doc(db, "publicProfiles", user.uid);

    await runTransaction(db, async (tx) => {
      const userSnap = await tx.get(userRef);
      const profileSnap = await tx.get(profileRef);

      if (!userSnap.exists()) {
        tx.set(userRef, {
          uid: user.uid,
          email: user.email || '',
          displayName: name,
          photoURL: user.photoURL || '',
          createdAt: serverTimestamp()
        });
      } else if (displayName && !userSnap.data().displayName) {
        tx.update(userRef, { displayName, updatedAt: serverTimestamp() });
      }

      if (!profileSnap.exists()) {
        tx.set(profileRef, {
          displayName: name,
          photoURL: user.photoURL || '',
          subscriberCount: 0,
          updatedAt: serverTimestamp()
        });
      } else if (displayName && !profileSnap.data().displayName) {
        tx.update(profileRef, { displayName, updatedAt: serverTimestamp() });
      }
    });
  },

  // Update name and/or photo on both the private record and the public profile
  async updateUserProfile(uid, { displayName, photoURL }) {
    const data = { updatedAt: serverTimestamp() };
    if (displayName !== undefined) data.displayName = displayName;
    if (photoURL !== undefined) data.photoURL = photoURL;

    const batch = writeBatch(db);
    batch.update(doc(db, "users", uid), data);
    batch.set(doc(db, "publicProfiles", uid), data, { merge: true });
    return await batch.commit();
  },

  // Update user role (admin only — enforced by Firestore rules)
  async updateUserRole(uid, newRole) {
    return await updateDoc(doc(db, "users", uid), { role: newRole });
  }
};

// ==================== Article Services ====================

// ==================== Payload Validation ====================

// Recursively scan an object for Firestore-invalid values.
// Returns array of { path, issue } for every problem found.
export function validateFirestorePayload(obj, path = 'root', issues = []) {
  if (obj === undefined) {
    issues.push({ path, issue: 'undefined value' });
    return issues;
  }
  if (obj === null || typeof obj === 'boolean' || typeof obj === 'number') {
    return issues;
  }
  if (typeof obj === 'string') {
    if (obj.startsWith('data:image/')) {
      issues.push({ path, issue: `base64 data URL (${obj.length} chars)` });
    } else if (obj.startsWith('blob:')) {
      issues.push({ path, issue: 'blob: URL' });
    }
    return issues;
  }
  if (typeof obj === 'function') {
    issues.push({ path, issue: 'function' });
    return issues;
  }
  if (obj instanceof File) {
    issues.push({ path, issue: `File object (${obj.name})` });
    return issues;
  }
  if (obj instanceof Blob) {
    issues.push({ path, issue: `Blob object (${obj.size} bytes)` });
    return issues;
  }
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      validateFirestorePayload(obj[i], `${path}[${i}]`, issues);
    }
    return issues;
  }
  if (typeof obj === 'object') {
    // Skip Firestore sentinel values (serverTimestamp, etc.)
    if (obj.constructor && obj.constructor.name !== 'Object') {
      return issues;
    }
    for (const key of Object.keys(obj)) {
      validateFirestorePayload(obj[key], `${path}.${key}`, issues);
    }
  }
  return issues;
}

// Sanitize a payload: remove undefined values, File/Blob objects, functions
export function sanitizePayload(obj) {
  if (obj === null || obj === undefined || typeof obj !== 'object') return obj;
  if (obj instanceof File || obj instanceof Blob) return null;
  if (typeof obj === 'function') return null;

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizePayload(item));
  }

  const cleaned = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === undefined) continue;
    if (val instanceof File || val instanceof Blob) continue;
    if (typeof val === 'function') continue;
    if (typeof val === 'object' && val !== null && !(val.constructor && val.constructor.name !== 'Object')) {
      cleaned[key] = sanitizePayload(val);
    } else {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

// Run a query on `articles`. If it fails — usually because the Firestore index it
// needs is missing or still building — log it and return an empty list instead of
// reading the whole collection. Required indexes are in firestore.indexes.json.
async function listArticles(label, ...constraints) {
  try {
    const snap = await getDocs(query(collection(db, "articles"), ...constraints));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error(`[${label}] query failed (missing Firestore index? see firestore.indexes.json):`, err.message);
    return [];
  }
}

const published = where("status", "==", "published");

// Staff picks: staffPickOrder ascending (unset last), then newest first
const byStaffPickOrder = (a, b) => {
  const aOrder = a.staffPickOrder ?? Infinity;
  const bOrder = b.staffPickOrder ?? Infinity;
  if (aOrder !== bOrder) return aOrder - bOrder;
  const aTime = a.publishedAt?.seconds || a.createdAt?.seconds || 0;
  const bTime = b.publishedAt?.seconds || b.createdAt?.seconds || 0;
  return bTime - aTime;
};

export const articleService = {
  // Create new article
  async createArticle(articleData) {
    return await addDoc(collection(db, "articles"), {
      status: "draft",
      views: 0,
      ...articleData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  // Update article
  async updateArticle(articleId, data) {
    const articleRef = doc(db, "articles", articleId);
    return await updateDoc(articleRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  },

  // Soft delete article (move to deleted status)
  async deleteArticle(articleId) {
    return await this.updateArticle(articleId, {
      status: "deleted",
      deletedAt: serverTimestamp()
    });
  },

  // Permanently delete article
  async permanentlyDeleteArticle(articleId) {
    const articleRef = doc(db, "articles", articleId);
    return await deleteDoc(articleRef);
  },

  // Unarchive article
  async unarchiveArticle(articleId, previousStatus = "draft") {
    return await this.updateArticle(articleId, {
      status: previousStatus,
      archivedAt: null
    });
  },

  // Restore deleted article
  async restoreArticle(articleId, previousStatus = "draft") {
    return await this.updateArticle(articleId, {
      status: previousStatus,
      deletedAt: null
    });
  },

  // Get single article
  async getArticle(articleId) {
    const articleRef = doc(db, "articles", articleId);
    const articleSnap = await getDoc(articleRef);
    if (articleSnap.exists()) {
      return { id: articleSnap.id, ...articleSnap.data() };
    }
    return null;
  },

  // Published articles by one author (index: status + authorId + createdAt)
  async getPublishedArticlesByAuthor(authorId, limitCount = 50) {
    return listArticles('author stories',
      published, where("authorId", "==", authorId), orderBy("createdAt", "desc"), limit(limitCount));
  },

  // Newest published articles (index: status + createdAt)
  async getPublishedArticles(limitCount = 20) {
    return listArticles('latest stories', published, orderBy("createdAt", "desc"), limit(limitCount));
  },

  // Newest published articles in a category (index: status + category + createdAt)
  async getPublishedArticlesByCategory(category, limitCount = 20) {
    return listArticles(`${category} stories`,
      published, where("category", "==", category), orderBy("createdAt", "desc"), limit(limitCount));
  },

  // Approve article (admin only)
  async approveArticle(articleId) {
    return await this.updateArticle(articleId, {
      status: "published",
      publishedAt: serverTimestamp(),
      isRevised: false, // Clear revised flag when published
      revisionNote: '' // Clear any revision notes
    });
  },

  // Request changes (admin only) - sends article back to author for revision
  async requestChanges(articleId, feedback) {
    return await this.updateArticle(articleId, {
      status: "needs-revision",
      revisionNote: feedback
    });
  },

  // Reject article permanently (admin only)
  async rejectArticle(articleId, reason) {
    return await this.updateArticle(articleId, {
      status: "rejected",
      rejectionReason: reason
    });
  },

  // Update article status
  async updateArticleStatus(articleId, status) {
    return await this.updateArticle(articleId, { status });
  },

  // Most-viewed published articles (index: status + views)
  async getTopPicks(limitCount = 10) {
    return listArticles('top picks', published, orderBy("views", "desc"), limit(limitCount));
  },

  // Staff picks, in the admin's chosen order (index: status + staffPick + createdAt)
  async getStaffPicks(limitCount = 10) {
    const picks = await listArticles('staff picks',
      published, where("staffPick", "==", true), orderBy("createdAt", "desc"), limit(limitCount));
    return picks.sort(byStaffPickOrder);
  },

  // Get the admin-selected cover story for the homepage
  async getCoverStory() {
    try {
      const settingsRef = doc(db, "siteSettings", "homepage");
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists()) {
        const { coverStoryId, coverFocalX, coverFocalY } = settingsSnap.data();
        if (coverStoryId) {
          const article = await this.getArticle(coverStoryId);
          if (article && article.status === 'published') {
            return { ...article, coverFocalX: coverFocalX ?? 50, coverFocalY: coverFocalY ?? 50 };
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch cover story setting:', err.message);
    }
    return null;
  },

  // Set the homepage cover story (admin only)
  async setCoverStory(articleId, focalX = 50, focalY = 50) {
    const { setDoc } = await import("firebase/firestore");
    const settingsRef = doc(db, "siteSettings", "homepage");
    return await setDoc(settingsRef, {
      coverStoryId: articleId,
      coverFocalX: focalX,
      coverFocalY: focalY,
      updatedAt: serverTimestamp()
    }, { merge: true });
  },

  // Remove the cover story (falls back to latest)
  async clearCoverStory() {
    const { setDoc } = await import("firebase/firestore");
    const settingsRef = doc(db, "siteSettings", "homepage");
    return await setDoc(settingsRef, {
      coverStoryId: null,
      coverFocalX: 50,
      coverFocalY: 50,
      updatedAt: serverTimestamp()
    }, { merge: true });
  },

  // Add one view. The rules only accept views going up by exactly 1 on a
  // published story, so this must use increment() rather than writing a total.
  async incrementViews(articleId) {
    return await updateDoc(doc(db, "articles", articleId), { views: increment(1) });
  }
};

// ==================== Subscriber Services ====================

// Subscription documents use the ID "{subscriberId}_{authorId}" and are written in
// the same batch as the author's public subscriberCount, so the Firestore rules can
// check that the count only ever moves by one for a real subscribe/unsubscribe.
const subscriptionRef = (subscriberId, authorId) =>
  doc(db, "subscriptions", `${subscriberId}_${authorId}`);

export const subscriberService = {
  // Subscribe to an author
  async subscribe(subscriberId, authorId) {
    if (subscriberId === authorId) throw new Error("Cannot subscribe to yourself");

    const subRef = subscriptionRef(subscriberId, authorId);
    if ((await getDoc(subRef)).exists()) return subRef.id;

    const batch = writeBatch(db);
    batch.set(subRef, { subscriberId, authorId, subscribedAt: serverTimestamp() });
    batch.update(doc(db, "publicProfiles", authorId), { subscriberCount: increment(1) });
    await batch.commit();
    return subRef.id;
  },

  // Unsubscribe from an author
  async unsubscribe(subscriberId, authorId) {
    const subRef = subscriptionRef(subscriberId, authorId);
    if (!(await getDoc(subRef)).exists()) return;

    const batch = writeBatch(db);
    batch.delete(subRef);
    batch.update(doc(db, "publicProfiles", authorId), { subscriberCount: increment(-1) });
    await batch.commit();
  },

  // Check if user is subscribed to an author
  async isSubscribed(subscriberId, authorId) {
    return (await getDoc(subscriptionRef(subscriberId, authorId))).exists();
  },

  // Get subscribers of an author (people who subscribed to them).
  // Only public profile fields are shown; subscribers' emails stay private.
  async getSubscribers(authorId, limitCount = 500) {
    const q = query(
      collection(db, "subscriptions"),
      where("authorId", "==", authorId),
      orderBy("subscribedAt", "desc"),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    const subs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    return await Promise.all(subs.map(async (sub) => {
      const profile = await userService.getPublicProfile(sub.subscriberId);
      return {
        ...sub,
        displayName: profile?.displayName || "Unknown User",
        photoURL: profile?.photoURL || ""
      };
    }));
  },

  // Get subscriptions count (authors the user is subscribed to), counted on the
  // server so the documents themselves aren't downloaded
  async getSubscriptionsCount(subscriberId) {
    const q = query(collection(db, "subscriptions"), where("subscriberId", "==", subscriberId));
    return (await getCountFromServer(q)).data().count;
  },

  // Get subscriber count for an author (public, kept on their public profile)
  async getSubscriberCount(authorId) {
    const profile = await userService.getPublicProfile(authorId);
    return profile?.subscriberCount || 0;
  }
};

// ==================== Search Services ====================

// Firestore has no text search, so search filters a bounded sample in the browser:
// the 100 newest published stories and up to 300 author profiles. The sample is
// loaded once and reused for 5 minutes instead of being re-read on every keystroke.
const SEARCH_CACHE_MS = 5 * 60 * 1000;
let searchSample = null; // { loadedAt, promise }

function loadSearchSample() {
  if (!searchSample || Date.now() - searchSample.loadedAt > SEARCH_CACHE_MS) {
    const promise = Promise.all([
      listArticles('search', published, orderBy("createdAt", "desc"), limit(100)),
      getDocs(query(collection(db, "publicProfiles"), limit(300))),
    ]).then(([stories, profiles]) => ({
      stories,
      authors: profiles.docs.map(d => ({ id: d.id, uid: d.id, ...d.data() })),
    }));
    searchSample = { loadedAt: Date.now(), promise };
    promise.catch(() => { searchSample = null; });
  }
  return searchSample.promise;
}

export const searchService = {
  // Search published stories by title or author name
  async searchArticles(searchTerm, limitCount = 20) {
    const term = searchTerm.toLowerCase();
    const { stories } = await loadSearchSample();
    return stories
      .filter(a => a.title?.toLowerCase().includes(term) || a.authorName?.toLowerCase().includes(term))
      .slice(0, limitCount);
  },

  // Search authors by display name (public profiles, so it works when logged out)
  async searchUsers(searchTerm, limitCount = 10) {
    const term = searchTerm.toLowerCase();
    const { authors } = await loadSearchSample();
    return authors
      .filter(u => u.displayName?.toLowerCase().includes(term))
      .slice(0, limitCount);
  }
};

// ==================== Storage Services ====================
// Story images and videos upload to Cloudflare R2 through the upload Worker
// (see firebase/r2Service.js and worker/). Files uploaded before the move stay
// in Firebase Storage and keep working through their existing URLs.

export { r2Service as storageService } from './r2Service';
