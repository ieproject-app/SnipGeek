
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigValid = () => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
};

export interface FirebaseServices {
  firebaseApp: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
}

/**
 * Singleton-like initialization to ensure stable instances across the app.
 */
let memoizedServices: FirebaseServices | null = null;

export function initializeFirebase(): FirebaseServices {
  if (typeof window === 'undefined') {
    return { firebaseApp: null, auth: null, firestore: null };
  }

  if (memoizedServices) return memoizedServices;

  try {
    let app: FirebaseApp;
    if (getApps().length > 0) {
      app = getApp();
    } else if (isFirebaseConfigValid()) {
      app = initializeApp(firebaseConfig);
    } else {
      return { firebaseApp: null, auth: null, firestore: null };
    }

    memoizedServices = {
      firebaseApp: app,
      auth: getAuth(app),
      firestore: getFirestore(app)
    };
    return memoizedServices;
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    return { firebaseApp: null, auth: null, firestore: null };
  }
}

// Diagnostics helper
export const firebaseConfigStatus = {
  isComplete: isFirebaseConfigValid(),
  config: { ...firebaseConfig, apiKey: '***' }, // Mask sensitive info in logs
};

export const isFirebaseInitialized = isFirebaseConfigValid();
