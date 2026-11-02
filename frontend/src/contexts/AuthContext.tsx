import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

// auth is always initialized (non-null) in new firebase.ts
const firebaseReady = true;

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isDemo?: boolean;
}

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  firebaseReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  demoLogin: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Demo user for when Firebase is not configured
const DEMO_USER: AppUser = {
  uid: 'demo-user-001',
  email: 'demo@aquanetx.app',
  displayName: 'Demo User',
  photoURL: null,
  isDemo: true,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const demoActive = localStorage.getItem('aquanetx_demo_session') === '1';

    const unsub = onAuthStateChanged(auth, (fbUser: User | null) => {
      if (fbUser) {
        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
          photoURL: fbUser.photoURL,
        });
      } else if (demoActive) {
        setUser(DEMO_USER);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    setUser((prev) => prev ? { ...prev, displayName: name } : prev);
  };

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider as GoogleAuthProvider);
  };

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem('aquanetx_demo_session');
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const demoLogin = () => {
    localStorage.setItem('aquanetx_demo_session', '1');
    setUser(DEMO_USER);
  };

  return (
    <AuthContext.Provider value={{ user, loading, firebaseReady, login, register, loginWithGoogle, logout, resetPassword, demoLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
