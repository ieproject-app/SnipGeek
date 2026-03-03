'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore'

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
  if (!getApps().length) {
    let firebaseApp: FirebaseApp | null = null;
    try {
      // Attempt to initialize via Firebase App Hosting environment variables
      firebaseApp = initializeApp();
    } catch (e) {
      // Fallback to config object if automatic init fails
      if (firebaseConfig.apiKey) {
        try {
          firebaseApp = initializeApp(firebaseConfig);
        } catch (initError) {
          console.error('Firebase initialization failed with config:', initError);
        }
      } else {
        console.warn('Firebase configuration is missing. App will run with limited functionality.');
      }
    }

    if (!firebaseApp) {
      return { firebaseApp: null, auth: null, firestore: null };
    }

    return getSdks(firebaseApp);
  }

  const app = getApp();
  return getSdks(app);
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
