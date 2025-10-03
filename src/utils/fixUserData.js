import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase/config';

// This function creates a Firestore user document for the currently logged-in user if it doesn't exist
export async function ensureUserDocument() {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    console.log('No user logged in');
    return;
  }

  console.log('Checking user document for:', currentUser.email);

  // Check if user document exists
  const q = query(collection(db, "users"), where("uid", "==", currentUser.uid));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    console.log('Creating missing user document for:', currentUser.email);

    // Determine role
    const role = currentUser.email === import.meta.env.VITE_ADMIN_EMAIL ? "admin" : "author";

    // Create user document
    await addDoc(collection(db, "users"), {
      uid: currentUser.uid,
      email: currentUser.email,
      displayName: currentUser.displayName || '',
      photoURL: currentUser.photoURL || '',
      role: role,
      createdAt: serverTimestamp(),
      articlesCount: 0
    });

    console.log('User document created successfully with role:', role);

    // Reload the page to refresh the auth context
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } else {
    console.log('User document already exists');
  }
}
