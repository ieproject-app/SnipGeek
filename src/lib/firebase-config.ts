
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFunctions, type Functions } from "firebase/functions";

// Firebase config for pdf-signatories-index project
// All values stored in environment variables — never hardcode credentials in source.
const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_PDF_FIREBASE_PROJECT_ID || "pdf-signatories-index",
  appId: process.env.NEXT_PUBLIC_PDF_FIREBASE_APP_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_PDF_FIREBASE_STORAGE_BUCKET || "",
  apiKey: process.env.NEXT_PUBLIC_PDF_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_PDF_FIREBASE_AUTH_DOMAIN || "",
  messagingSenderId: process.env.NEXT_PUBLIC_PDF_FIREBASE_MESSAGING_SENDER_ID || "",
  measurementId: process.env.NEXT_PUBLIC_PDF_FIREBASE_MEASUREMENT_ID || "",
};


// Initialize Firebase
// This new pattern is more robust for Next.js App Router environments.
let app: FirebaseApp;
let storage: FirebaseStorage;
let functions: Functions;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

storage = getStorage(app);
// Ensure functions are initialized for the correct region
functions = getFunctions(app, 'asia-southeast2');

export { app, storage, functions };
