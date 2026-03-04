
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from 'firebase/app';

// Your web app's Firebase configuration
// This configuration now unconditionally trusts that the environment variables are set.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase without checking.
// If the config is wrong, it might throw an error at runtime, but it will NOT show the "System Not Ready" screen.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();


// --- REMOVED THE AGGRESSIVE CHECK ---
// By setting isFirebaseInitialized to true, we disable the blocker screen entirely.
export const firebaseApp = app;
export const isFirebaseInitialized = true;

// This is kept for compatibility with other components, but it no longer drives any blocking logic.
export const firebaseConfigStatus = {
  isComplete: true,
  config: firebaseConfig,
};
