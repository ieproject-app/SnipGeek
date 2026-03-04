
import { initializeApp, getApps, getApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function isFirebaseConfigComplete(config: typeof firebaseConfig): boolean {
  return !!(config.apiKey && config.authDomain && config.projectId && config.appId);
}

const apps = getApps();
const isConfigComplete = isFirebaseConfigComplete(firebaseConfig);

let app;
if (isConfigComplete) {
  app = !apps.length ? initializeApp(firebaseConfig) : getApp();
} else {
  console.warn('Firebase config is incomplete. Firebase is not initialized.');
}

export const firebaseApp = app;
export const isFirebaseInitialized = !!app && isConfigComplete;
export const firebaseConfigStatus = {
  isComplete: isConfigComplete,
  config: firebaseConfig
};
