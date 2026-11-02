// Firebase configuration — AQUANET X (aquanetx project)
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCtFv8A-S4oRVD8KY5CdZV15OWHmb9uaWY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'aquanetx.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'aquanetx',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'aquanetx.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '771574958441',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:771574958441:web:0648647d112e89ad3255f8',
};

// Prevent duplicate app registration during hot-reload
const _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const app = _app;
export const auth = getAuth(_app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
export const firebaseReady = true;

console.log('[AQUANET X] Firebase ready — project:', firebaseConfig.projectId);
