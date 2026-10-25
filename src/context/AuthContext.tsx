import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, checkUserIsAdmin, OWNER_EMAIL } from '../firebase';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isOwner: boolean;
  role: 'admin' | 'pengguna';
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  ownerEmail: string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isOwner: false,
  role: 'pengguna',
  loading: true,
  loginWithGoogle: async () => {},
  logout: async () => {},
  ownerEmail: OWNER_EMAIL,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const adminStatus = await checkUserIsAdmin(currentUser);
          setIsAdmin(adminStatus);
        } catch (err) {
          console.error('Error verifying admin status:', err);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google sign in error:', err);
      // If popup blocked or cancelled, let the user know
      if (err?.code !== 'auth/popup-closed-by-user') {
        alert('Gagal login: ' + (err?.message || 'Silakan coba lagi'));
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const isOwner = Boolean(user?.email && user.email.toLowerCase() === OWNER_EMAIL.toLowerCase());
  const role: 'admin' | 'pengguna' = isAdmin ? 'admin' : 'pengguna';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isOwner,
        role,
        loading,
        loginWithGoogle,
        logout,
        ownerEmail: OWNER_EMAIL,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
