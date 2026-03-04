/**
 * Firebase configuration object.
 * Fetches values from environment variables.
 * In Next.js, client-side variables MUST be prefixed with NEXT_PUBLIC_.
 */
export const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ''
};

/**
 * Helper to check if the minimum required configuration is present.
 */
export const isFirebaseConfigValid = () => {
  const hasValues = !!(
    firebaseConfig.apiKey && 
    firebaseConfig.projectId && 
    firebaseConfig.appId
  );
  
  if (!hasValues && typeof window !== 'undefined') {
    console.warn('Firebase config missing from environment variables.');
  }
  
  return hasValues;
};
