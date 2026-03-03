'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

export interface FirebaseServices {
  firebaseApp: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
}

/**
 * Initializes Firebase and returns an object with the SDK instances.
 * Returns null properties if configuration is missing to prevent total server crash.
 * Optimized for robustness during environment variable synchronization.
 */
export function initializeFirebase(): FirebaseServices {
  let firebaseApp: FirebaseApp | null = null;

  // 1. If already initialized, get the existing app
  if (getApps().length > 0) {
    firebaseApp = getApp();
  } else {
    // 2. Try automatic initialization (for Firebase App Hosting)
    try {
      firebaseApp = initializeApp();
    } catch (e) {
      // 3. Fallback to manual config object if apiKey exists
      if (firebaseConfig.apiKey) {
        try {
          firebaseApp = initializeApp(firebaseConfig);
        } catch (initError) {
          console.error('Firebase manual initialization failed:', initError);
        }
      }
    }
  }

  // Final check: if no app was created, return nulls safely
  if (!firebaseApp) {
    return { firebaseApp: null, auth: null, firestore: null };
  }

  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp): FirebaseServices {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
