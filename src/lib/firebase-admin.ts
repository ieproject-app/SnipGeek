import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    // Local dev: service account via env vars
    admin.initializeApp({
      projectId,
      credential: admin.credential.cert({
        projectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    // Production (Firebase App Hosting / Cloud Run): ADC is provided automatically
    admin.initializeApp({ projectId });
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
