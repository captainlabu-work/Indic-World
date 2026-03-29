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
  }
};
