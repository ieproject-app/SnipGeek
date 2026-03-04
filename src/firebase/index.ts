
'use client';

import { firebaseConfig, isFirebaseConfigValid } from './config';
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
 */
export function initializeFirebase(): FirebaseServices {
  try {
    let firebaseApp: FirebaseApp | null = null;

    if (getApps().length > 0) {
      firebaseApp = getApp();
    } else if (isFirebaseConfigValid()) {
      firebaseApp = initializeApp(firebaseConfig);
    }

    if (!firebaseApp) {
      return { firebaseApp: null, auth: null, firestore: null };
    }

    return {
      firebaseApp,
      auth: getAuth(firebaseApp),
      firestore: getFirestore(firebaseApp)
    };
  } catch (error) {
    return { firebaseApp: null, auth: null, firestore: null };
  }
}

// Export config-related variables
export * from './config';
// Export components and hooks
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
