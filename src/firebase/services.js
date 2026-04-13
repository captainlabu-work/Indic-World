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
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  uploadString,
  getDownloadURL,
  deleteObject
} from "firebase/storage";
import { auth, db, storage } from "./config";

// ==================== Authentication Services ====================

export const authService = {
  // Sign up new user
  async signUp(email, password, displayName) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });

    // Create user document in Firestore
    await addDoc(collection(db, "users"), {
      uid: userCredential.user.uid,
      email: email,
      displayName: displayName,
      photoURL: '',
      role: email === import.meta.env.VITE_ADMIN_EMAIL ? "admin" : "author",
      createdAt: serverTimestamp(),
      articlesCount: 0
    });

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

    console.log('Google sign in result:', result.user);

    // Check if user document exists
    const q = query(collection(db, "users"), where("uid", "==", result.user.uid));
    const querySnapshot = await getDocs(q);

    console.log('User query result:', querySnapshot.empty);

    // If user doesn't exist, create user document
    if (querySnapshot.empty) {
      console.log('Creating new user document for:', result.user.email);
      await addDoc(collection(db, "users"), {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName || '',
        photoURL: result.user.photoURL || '',
        role: result.user.email === import.meta.env.VITE_ADMIN_EMAIL ? "admin" : "author",
        createdAt: serverTimestamp(),
        articlesCount: 0
      });
      console.log('User document created successfully');
    } else {
      console.log('User document already exists');
    }

    return result.user;
  },

  // Sign out
  async signOut() {
    return await signOut(auth);
  },

  // Reset password
  async resetPassword(email) {
    return await sendPasswordResetEmail(auth, email);
  },

  // Get current user
  getCurrentUser() {
    return auth.currentUser;
  }
};

// ==================== User Services ====================

export const userService = {
  // Get user data from Firestore
  async getUserData(uid) {
    const q = query(collection(db, "users"), where("uid", "==", uid));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    }
    return null;
  },

  // Update user profile
  async updateUserProfile(userId, data) {
    const userRef = doc(db, "users", userId);
    return await updateDoc(userRef, data);
  },

  // Update user by UID
  async updateUser(uid, data) {
    const q = query(collection(db, "users"), where("uid", "==", uid));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const userRef = doc(db, "users", querySnapshot.docs[0].id);
      return await updateDoc(userRef, data);
    }
    throw new Error("User not found");
  },

  // Check if user is admin
  async isAdmin(uid) {
    const userData = await this.getUserData(uid);
    return userData?.role === "admin";
  },

  // Update user role (admin only)
  async updateUserRole(userId, newRole) {
    const userRef = doc(db, "users", userId);
    return await updateDoc(userRef, { role: newRole });
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

  // Archive article
  async archiveArticle(articleId) {
    return await this.updateArticle(articleId, {
      status: "archived",
      archivedAt: serverTimestamp()
    });
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

  // Get articles by author
  async getArticlesByAuthor(authorId) {
    const q = query(
      collection(db, "articles"),
      where("authorId", "==", authorId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Get published articles by a specific author
  async getPublishedArticlesByAuthor(authorId, limitCount = 50) {
    try {
      const q = query(
        collection(db, "articles"),
        where("status", "==", "published"),
        where("authorId", "==", authorId),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.warn('Compound query failed, using fallback:', err.message);
      const q = query(
        collection(db, "articles"),
        where("status", "==", "published"),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(a => a.authorId === authorId)
        .slice(0, limitCount);
    }
  },

  // Get published articles
  async getPublishedArticles(limitCount = 20) {
    const q = query(
      collection(db, "articles"),
      where("status", "==", "published"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Get published articles by category
  async getPublishedArticlesByCategory(category, limitCount = 20) {
    try {
      // Compound query (requires composite index in Firestore)
      const q = query(
        collection(db, "articles"),
        where("status", "==", "published"),
        where("category", "==", category),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      // Fallback: fetch all published, filter client-side (before index is created)
      console.warn('Compound query failed (index may be building), using fallback:', err.message);
      const q = query(
        collection(db, "articles"),
        where("status", "==", "published"),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(a => a.category === category)
        .slice(0, limitCount);
    }
  },

  // Get pending articles (for admin)
  async getPendingArticles() {
    const q = query(
      collection(db, "articles"),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Submit article for review
  async submitForReview(articleId) {
    return await this.updateArticle(articleId, { status: "pending" });
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

  // Get rejected articles (for admin)
  async getRejectedArticles() {
    const q = query(
      collection(db, "articles"),
      where("status", "==", "rejected"),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Get archived articles
  async getArchivedArticles() {
    const q = query(
      collection(db, "articles"),
      where("status", "==", "archived"),
      orderBy("archivedAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Get deleted articles (soft deleted)
  async getDeletedArticles() {
    const q = query(
      collection(db, "articles"),
      where("status", "==", "deleted"),
      orderBy("deletedAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Update article status
  async updateArticleStatus(articleId, status) {
    return await this.updateArticle(articleId, { status });
  },

  // Get top picks (most viewed published articles)
  async getTopPicks(limitCount = 10) {
    try {
      const q = query(
        collection(db, "articles"),
        where("status", "==", "published"),
        orderBy("views", "desc"),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      // Fallback: fetch all published, sort client-side
      console.warn('Top picks query failed (index may be building), using fallback:', err.message);
      const q = query(
        collection(db, "articles"),
        where("status", "==", "published"),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, limitCount);
    }
  },

  // Get staff picks (articles marked as staff pick by admin)
  // Sorted by staffPickOrder (ascending, nulls last), then by publishedAt desc
  async getStaffPicks(limitCount = 10) {
    try {
      const q = query(
        collection(db, "articles"),
        where("status", "==", "published"),
        where("staffPick", "==", true),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      const picks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Client-side sort: staffPickOrder ascending (nulls last), then publishedAt desc
      return picks.sort((a, b) => {
        const aOrder = a.staffPickOrder ?? Infinity;
        const bOrder = b.staffPickOrder ?? Infinity;
        if (aOrder !== bOrder) return aOrder - bOrder;
        const aTime = a.publishedAt?.seconds || a.createdAt?.seconds || 0;
        const bTime = b.publishedAt?.seconds || b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
    } catch (err) {
      console.warn('Staff picks query failed (index may be building), using fallback:', err.message);
      const q = query(
        collection(db, "articles"),
        where("status", "==", "published"),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const picks = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(a => a.staffPick === true);
      return picks.sort((a, b) => {
        const aOrder = a.staffPickOrder ?? Infinity;
        const bOrder = b.staffPickOrder ?? Infinity;
        if (aOrder !== bOrder) return aOrder - bOrder;
        const aTime = a.publishedAt?.seconds || a.createdAt?.seconds || 0;
        const bTime = b.publishedAt?.seconds || b.createdAt?.seconds || 0;
        return bTime - aTime;
      }).slice(0, limitCount);
    }
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

  // Update just the focal point of the current cover story
  async updateCoverFocal(focalX, focalY) {
    const settingsRef = doc(db, "siteSettings", "homepage");
    return await updateDoc(settingsRef, {
      coverFocalX: focalX,
      coverFocalY: focalY,
      updatedAt: serverTimestamp()
    });
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

  // Increment article views
  async incrementViews(articleId) {
    const articleRef = doc(db, "articles", articleId);
    const articleSnap = await getDoc(articleRef);
    if (articleSnap.exists()) {
      const currentViews = articleSnap.data().views || 0;
      await updateDoc(articleRef, { views: currentViews + 1 });
    }
  }
};

// ==================== Subscriber Services ====================

export const subscriberService = {
  // Subscribe to an author
  async subscribe(subscriberId, authorId) {
    // Prevent self-subscribe
    if (subscriberId === authorId) throw new Error("Cannot subscribe to yourself");

    // Check if already subscribed
    const q = query(
      collection(db, "subscriptions"),
      where("subscriberId", "==", subscriberId),
      where("authorId", "==", authorId)
    );
    const existing = await getDocs(q);
    if (!existing.empty) return existing.docs[0].id;

    const docRef = await addDoc(collection(db, "subscriptions"), {
      subscriberId,
      authorId,
      subscribedAt: serverTimestamp()
    });
    return docRef.id;
  },

  // Unsubscribe from an author
  async unsubscribe(subscriberId, authorId) {
    const q = query(
      collection(db, "subscriptions"),
      where("subscriberId", "==", subscriberId),
      where("authorId", "==", authorId)
    );
    const snapshot = await getDocs(q);
    for (const d of snapshot.docs) {
      await deleteDoc(doc(db, "subscriptions", d.id));
    }
  },

  // Check if user is subscribed to an author
  async isSubscribed(subscriberId, authorId) {
    const q = query(
      collection(db, "subscriptions"),
      where("subscriberId", "==", subscriberId),
      where("authorId", "==", authorId)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  },

  // Get subscribers of an author (people who subscribed to them)
  async getSubscribers(authorId) {
    const q = query(
      collection(db, "subscriptions"),
      where("authorId", "==", authorId),
      orderBy("subscribedAt", "desc")
    );
    const snapshot = await getDocs(q);
    const subs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    // Enrich with user data
    const enriched = [];
    for (const sub of subs) {
      const userData = await userService.getUserData(sub.subscriberId);
      enriched.push({
        ...sub,
        displayName: userData?.displayName || "Unknown User",
        photoURL: userData?.photoURL || "",
        email: userData?.email || ""
      });
    }
    return enriched;
  },

  // Get subscriptions count (authors the user is subscribed to)
  async getSubscriptionsCount(subscriberId) {
    const q = query(
      collection(db, "subscriptions"),
      where("subscriberId", "==", subscriberId)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  },

  // Get subscriber count for an author
  async getSubscriberCount(authorId) {
    const q = query(
      collection(db, "subscriptions"),
      where("authorId", "==", authorId)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  }
};

// ==================== Search Services ====================

export const searchService = {
  // Search articles by title (client-side filter on published articles)
  async searchArticles(searchTerm, limitCount = 20) {
    const q = query(
      collection(db, "articles"),
      where("status", "==", "published"),
      orderBy("createdAt", "desc"),
      limit(100)
    );
    const snapshot = await getDocs(q);
    const term = searchTerm.toLowerCase();
    return snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(a =>
        a.title?.toLowerCase().includes(term) ||
        a.authorName?.toLowerCase().includes(term)
      )
      .slice(0, limitCount);
  },

  // Search users by display name
  async searchUsers(searchTerm, limitCount = 10) {
    const snapshot = await getDocs(collection(db, "users"));
    const term = searchTerm.toLowerCase();
    return snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(u => u.displayName?.toLowerCase().includes(term))
      .slice(0, limitCount);
  }
};

// ==================== Storage Services ====================

export const storageService = {
  // Upload image
  async uploadImage(file, path) {
    try {
      // Clean the path - remove any duplicate timestamp/filename
      const cleanPath = path.includes('/') ? path : `articles/${path}`;
      const storageRef = ref(storage, cleanPath);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Storage upload error:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  },

  // Upload file with progress tracking (returns promise, calls onProgress with 0-100)
  uploadWithProgress(file, path, onProgress) {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          if (onProgress) onProgress(progress);
        },
        (error) => reject(new Error(`Upload failed: ${error.message}`)),
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          } catch (e) {
            reject(e);
          }
        }
      );
    });
  },

  // Delete image
  async deleteImage(imageUrl) {
    const imageRef = ref(storage, imageUrl);
    return await deleteObject(imageRef);
  },

  // Upload article image
  async uploadArticleImage(file, authorId) {
    return await this.uploadImage(file, `articles/${authorId}`);
  },

  // Upload user avatar
  async uploadAvatar(file, userId) {
    return await this.uploadImage(file, `avatars/${userId}`);
  },

  // Upload a base64 data URL to Storage, returns download URL
  async uploadDataUrl(dataUrl, path) {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadString(storageRef, dataUrl, 'data_url');
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error('Data URL upload error:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  },

  // Deep-walk any object/array, find all string values starting with "data:image/"
  // Returns array of { obj, key } refs that can be mutated in place
  _collectBase64Refs(value, results = []) {
    if (!value || typeof value !== 'object') return results;

    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        if (typeof value[i] === 'string' && value[i].startsWith('data:image/')) {
          results.push({ obj: value, key: i });
        } else if (typeof value[i] === 'object') {
          this._collectBase64Refs(value[i], results);
        }
      }
    } else {
      for (const k of Object.keys(value)) {
        if (typeof value[k] === 'string' && value[k].startsWith('data:image/')) {
          results.push({ obj: value, key: k });
        } else if (typeof value[k] === 'object') {
          this._collectBase64Refs(value[k], results);
        }
      }
    }

    return results;
  },

  // Upload all base64 images in editor content to Storage, return cleaned content
  async uploadContentImages(htmlContent, contentJSON) {
    // Parse JSON if needed
    let jsonObj = contentJSON;
    if (typeof contentJSON === 'string') {
      try { jsonObj = JSON.parse(contentJSON); } catch { jsonObj = null; }
    }

    // Deep-walk the entire JSON tree to find every base64 data URL string
    const base64Refs = jsonObj ? this._collectBase64Refs(jsonObj) : [];

    console.log(`[uploadContentImages] Found ${base64Refs.length} base64 image(s) in content JSON`);

    if (base64Refs.length === 0) {
      return { html: htmlContent, json: contentJSON };
    }

    // Deduplicate: same data URL may appear in multiple places
    const uniqueUrls = [...new Set(base64Refs.map(r => r.obj[r.key]))];
    const urlMap = new Map();
    const ts = Date.now();

    console.log(`[uploadContentImages] Uploading ${uniqueUrls.length} unique image(s) to Storage...`);

    // Upload all unique base64 images in parallel
    const uploads = uniqueUrls.map(async (dataUrl, i) => {
      const ext = dataUrl.startsWith('data:image/png') ? 'png' : 'jpg';
      const path = `articles/content/${ts}_${i}.${ext}`;
      try {
        const downloadUrl = await this.uploadDataUrl(dataUrl, path);
        urlMap.set(dataUrl, downloadUrl);
        console.log(`[uploadContentImages] Uploaded image ${i + 1}/${uniqueUrls.length}`);
      } catch (err) {
        console.error(`[uploadContentImages] Failed to upload image ${i}:`, err.message);
        throw new Error(`Image upload failed (image ${i + 1}): ${err.message}`);
      }
    });

    await Promise.all(uploads);

    // Replace base64 refs in JSON tree (mutates in place)
    let replaced = 0;
    for (const { obj, key } of base64Refs) {
      const replacement = urlMap.get(obj[key]);
      if (replacement) {
        obj[key] = replacement;
        replaced++;
      }
    }
    console.log(`[uploadContentImages] Replaced ${replaced}/${base64Refs.length} refs in JSON`);

    // Replace base64 in HTML: both inline img src and data-images attributes
    let cleanedHtml = htmlContent;
    for (const [dataUrl, storageUrl] of urlMap) {
      cleanedHtml = cleanedHtml.split(dataUrl).join(storageUrl);
    }

    // Rebuild data-images attributes from cleaned JSON for imageGrid nodes
    if (jsonObj?.content) {
      for (const node of jsonObj.content) {
        if (node.type === 'imageGrid' && Array.isArray(node.attrs?.images)) {
          const cleanImagesJson = JSON.stringify(node.attrs.images);
          // Find existing data-images="..." in HTML and replace with cleaned version
          cleanedHtml = cleanedHtml.replace(
            /(<div[^>]*data-type="image-grid"[^>]*data-images=")([^"]*?)(")/g,
            (_match, pre, _oldVal, post) => pre + cleanImagesJson.replace(/"/g, '&quot;') + post
          );
        }
      }
    }

    // Validate: ensure no base64 remains in JSON
    const jsonStr = JSON.stringify(jsonObj);
    if (jsonStr.includes('data:image/')) {
      const remaining = (jsonStr.match(/data:image\//g) || []).length;
      console.error(`[uploadContentImages] WARNING: ${remaining} base64 image(s) still in JSON after upload`);
    }

    // Return JSON in same format as received
    const cleanedJson = typeof contentJSON === 'string' ? JSON.stringify(jsonObj) : jsonObj;

    return { html: cleanedHtml, json: cleanedJson };
  }
};
