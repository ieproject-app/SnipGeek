// src/firebase/config.ts
import { initializeApp, getApps, getApp } from 'firebase/app';

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

// Metadata for diagnostics UI - MUST BE EXPORTED
export const firebaseConfigStatus = {
  isComplete: isFirebaseConfigValid(),
  config: firebaseConfig,
};

// Initialize Firebase only if config is valid to prevent SDK crashes
const getInitializedApp = () => {
  if (!isFirebaseConfigValid()) return null;
  return !getApps().length ? initializeApp(firebaseConfig) : getApp();
};

export const firebaseApp = getInitializedApp();
export const isFirebaseInitialized = !!firebaseApp;
