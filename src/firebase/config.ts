
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from 'firebase/app';

// Your web app's Firebase configuration
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

// Initialize Firebase defensively
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const firebaseApp = app;
export const isFirebaseInitialized = isFirebaseConfigValid();

// Metadata for diagnostics UI
export const firebaseConfigStatus = {
  isComplete: isFirebaseConfigValid(),
  config: firebaseConfig,
};
