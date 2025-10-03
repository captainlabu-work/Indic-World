import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import { userService } from '../firebase/services';
import { ensureUserDocument } from '../utils/fixUserData';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        // Fetch user data from Firestore
        let data = await userService.getUserData(user.uid);
        console.log('User data from Firestore:', data);
        console.log('User email:', user.email);
        console.log('Admin email from env:', import.meta.env.VITE_ADMIN_EMAIL);

        // If no user data exists, create it
        if (!data) {
          console.log('No user document found, creating one...');
          await ensureUserDocument();
          // Fetch again after creation
          data = await userService.getUserData(user.uid);
          console.log('User data after creation:', data);
        }

        // Check admin by email if role not set properly
        const isAdminUser = data?.role === 'admin' || user.email === import.meta.env.VITE_ADMIN_EMAIL;

        setUserData(data);
        setIsAdmin(isAdminUser);

        console.log('Is admin:', isAdminUser);
      } else {
        setUserData(null);
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    isAdmin,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
