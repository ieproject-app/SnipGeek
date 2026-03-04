
/**
 * Firebase configuration object.
 * Fetches values from environment variables.
 * In Next.js, client-side variables MUST be prefixed with NEXT_PUBLIC_.
 */

// Function to safely parse JSON
const safeJsonParse = (str: string | undefined) => {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch (e) {
    console.error("Failed to parse JSON string:", str, e);
    return null;
  }
};

// Attempt to get config from the system-provided FIREBASE_WEBAPP_CONFIG first
const webAppConfig = safeJsonParse(process.env.NEXT_PUBLIC_FIREBASE_WEBAPP_CONFIG);

export const firebaseConfig = webAppConfig ? {
    // Use the parsed config if it exists and is valid
    projectId: webAppConfig.projectId || '',
    appId: webAppConfig.appId || '',
    apiKey: webAppConfig.apiKey || '',
    authDomain: webAppConfig.authDomain || '',
    measurementId: webAppConfig.measurementId || '',
    messagingSenderId: webAppConfig.messagingSenderId || ''
} : {
    // Fallback to individual variables for local development or other environments
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
    // This warning will now be much more informative
    console.warn('Firebase config missing. Checked FIREBASE_WEBAPP_CONFIG and individual NEXT_PUBLIC_ variables.');
  }
  
  return hasValues;
};
