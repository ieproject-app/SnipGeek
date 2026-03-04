
'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance);
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  createUserWithEmailAndPassword(authInstance, email, password);
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  signInWithEmailAndPassword(authInstance, email, password);
}

/** 
 * Initiate Google sign-in (non-blocking). 
 * Added domain verification notice.
 */
export function initiateGoogleSignIn(authInstance: Auth): void {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  // CRITICAL: Call signInWithPopup directly. Do NOT use 'await' in this wrapper.
  signInWithPopup(authInstance, provider).catch((error) => {
    if (
      error.code === 'auth/popup-closed-by-user' || 
      error.code === 'auth/cancelled-popup-request'
    ) {
      // User cancelled, safe to ignore.
      return;
    }
    
    if (error.code === 'auth/unauthorized-domain') {
      alert(`Domain ini belum didaftarkan di Firebase Console. Silakan tambahkan domain situs Mas Iwan ke: Auth > Settings > Authorized Domains.`);
    }

    console.error("Firebase Auth Error:", error.code, error.message);
  });
}
