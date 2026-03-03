
/**
 * Firebase configuration object.
 * Mengambil data dari environment variables.
 * Penting: Variabel client-side WAJIB diawali dengan NEXT_PUBLIC_.
 */
export const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || '',
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || process.env.FIREBASE_MEASUREMENT_ID || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || ''
};

/**
 * Helper untuk mengecek apakah konfigurasi sudah lengkap.
 */
export const isFirebaseConfigValid = () => {
  return !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
};
