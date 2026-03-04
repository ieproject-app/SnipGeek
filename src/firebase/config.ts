/**
 * Firebase configuration object.
 * Fetches values from environment variables.
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

/**
 * App Hosting menyediakan konfigurasi otomatis melalui variabel FIREBASE_WEBAPP_CONFIG.
 * Kita cek versi dengan prefix NEXT_PUBLIC agar bisa dibaca di sisi browser (Client Side).
 */
const webAppConfig = safeJsonParse(process.env.NEXT_PUBLIC_FIREBASE_WEBAPP_CONFIG || process.env.FIREBASE_WEBAPP_CONFIG);

export const firebaseConfig = {
    projectId: webAppConfig?.projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    appId: webAppConfig?.appId || process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
    apiKey: webAppConfig?.apiKey || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: webAppConfig?.authDomain || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    measurementId: webAppConfig?.measurementId || process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
    messagingSenderId: webAppConfig?.messagingSenderId || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ''
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
    // Log info saja, jangan error agar tidak mematikan UI
    console.info('Firebase Config Status:', firebaseConfig);
  }
  
  return hasValues;
};
