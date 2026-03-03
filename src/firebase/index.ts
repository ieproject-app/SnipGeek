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
 */
export function initializeFirebase(): FirebaseServices {
  let firebaseApp: FirebaseApp | null = null;

  // 1. Check if already initialized
  if (getApps().length > 0) {
    firebaseApp = getApp();
  } else {
    // 2. Try manual config first if we have the API Key (more reliable on client)
    if (firebaseConfig.apiKey && firebaseConfig.projectId) {
      try {
        firebaseApp = initializeApp(firebaseConfig);
      } catch (e) {
        console.warn('Firebase manual initialization failed, trying automatic...', e);
      }
    }

    // 3. Fallback to automatic (for Firebase App Hosting runtime)
    if (!firebaseApp) {
      try {
        firebaseApp = initializeApp();
      } catch (e) {
        // If everything fails, we don't throw, we just log
        if (typeof window !== 'undefined') {
          console.error('Firebase could not be initialized. Missing environment variables?');
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
