
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFunctions, type Functions } from "firebase/functions";

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "pdf-signatories-index",
  "appId": "1:1006635758733:web:12a0343b389648af985ec4",
  "storageBucket": "pdf-signatories-index.appspot.com",
  "apiKey": "***REMOVED***",
  "authDomain": "pdf-signatories-index.firebaseapp.com",
  "messagingSenderId": "1006635758733",
  "measurementId": "G-41Q3HZZ51P"
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
