import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration using environment variables
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Helper function to check if configuration is actually loaded
export const isFirebaseConfigValid = () => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
};

// Metadata for diagnostics UI
export const firebaseConfigStatus = {
  isComplete: isFirebaseConfigValid(),
  config: firebaseConfig,
};

/**
 * Single entry point for initializing Firebase services.
 * This ensures we don't initialize multiple instances.
 */
export const initializeFirebase = () => {
  if (!isFirebaseConfigValid()) return null;
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  return { firebaseApp: app, auth, firestore };
};

// Legacy exports for components that use them directly
const initializedApp = isFirebaseConfigValid() ? (!getApps().length ? initializeApp(firebaseConfig) : getApp()) : null;
export const firebaseApp = initializedApp;
export const isFirebaseInitialized = !!initializedApp;
