/**
 * Firebase config for PDF tools — now uses the main SnipGeek project.
 * Reuses the app initialized by src/firebase/config.ts to avoid double-init.
 */
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFunctions, type Functions } from "firebase/functions";

const snipgeekConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let storage: FirebaseStorage;
let functions: Functions;

if (getApps().length > 0) {
  app = getApp(); // Reuse the already-initialized SnipGeek app
} else {
  app = initializeApp(snipgeekConfig);
}

storage = getStorage(app);
functions = getFunctions(app, "asia-southeast2");

export { app, storage, functions };
