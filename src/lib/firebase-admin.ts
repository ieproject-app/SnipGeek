import * as admin from 'firebase-admin';

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const hasServiceAccountEnv = Boolean(
  process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL,
);
const isDevelopment = process.env.NODE_ENV !== 'production';

let adminInitError: Error | null = null;

function parsePrivateKey(raw: string): string {
  let key = raw.trim();

  // Strip surrounding double or single quotes added by some env systems
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }

  // Replace literal \n with real newlines
  key = key.replace(/\\n/g, '\n');

  // If the key is raw base64 without PEM headers, wrap it
  if (!key.includes('-----BEGIN')) {
    // Remove any whitespace/newlines in the base64 content, then re-chunk at 64 chars
    const base64 = key.replace(/\s+/g, '');
    const lines = base64.match(/.{1,64}/g) || [];
    key = `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----\n`;
  }

  return key;
}

if (!admin.apps.length) {
  try {
    if (hasServiceAccountEnv) {
      admin.initializeApp({
        projectId,
        credential: admin.credential.cert({
          projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: parsePrivateKey(process.env.FIREBASE_PRIVATE_KEY!),
        }),
      });
    } else {
      admin.initializeApp({ projectId });
    }
  } catch (error) {
    adminInitError = error instanceof Error ? error : new Error('Firebase Admin initialization failed.');
  }
}

export function getFirebaseAdminInitError() {
  if (adminInitError) {
    return adminInitError;
  }

  if (!admin.apps.length) {
    return new Error('Firebase Admin belum terinisialisasi.');
  }

  return null;
}

export function assertFirebaseAdminReady() {
  const initError = getFirebaseAdminInitError();

  if (initError) {
    if (isDevelopment && !hasServiceAccountEnv) {
      throw new Error('Firebase Admin belum siap di local development. Isi FIREBASE_CLIENT_EMAIL dan FIREBASE_PRIVATE_KEY agar generator publik bisa mengakses Firestore.');
    }

    throw new Error(`Firebase Admin tidak siap: ${initError.message}`);
  }
}

export const adminDb = admin.apps.length ? admin.firestore() : null;
export const adminAuth = admin.apps.length ? admin.auth() : null;
