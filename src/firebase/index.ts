
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
    // 2. Try manual config first if we have the minimum requirements (API Key and Project ID)
    const hasConfig = !!(firebaseConfig.apiKey && firebaseConfig.projectId);
    
    if (hasConfig) {
      try {
        firebaseApp = initializeApp(firebaseConfig);
      } catch (e) {
        // Silent fail, will try automatic fallback
      }
    }

    // 3. Fallback to automatic (only works in specific environments like some CI or JSON files)
    if (!firebaseApp) {
      try {
        firebaseApp = initializeApp();
      } catch (e) {
        // Silent fail, let the UI components handle the null state through hooks
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
