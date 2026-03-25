
'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth';

/** 
 * Utility to check if current device is a mobile or tablet. 
 */
function isMobileOrTablet(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
}

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
 * Automatically switches to Redirect on mobile for better UX.
 */
export async function initiateGoogleSignIn(authInstance: Auth): Promise<void> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  // Use Redirect on mobile as it's more reliable.
  if (isMobileOrTablet()) {
    try {
      await signInWithRedirect(authInstance, provider);
    } catch (error: any) {
      console.error("Firebase Auth Redirect Error:", error.code, error.message);
      throw error;
    }
    return;
  }

  // CRITICAL: Call signInWithPopup directly for desktop users.
  try {
    await signInWithPopup(authInstance, provider);
  } catch (error: any) {
    if (
      error.code === 'auth/popup-closed-by-user' || 
      error.code === 'auth/cancelled-popup-request'
    ) {
      // User cancelled, safe to ignore.
      return;
    }
    
    if (error.code === 'auth/unauthorized-domain') {
      alert(`Domain ini belum didaftarkan di Firebase Console. Silakan tambahkan domain situs Anda ke: Auth > Settings > Authorized Domains.`);
    }

    console.error("Firebase Auth Error:", error.code, error.message);
    throw error;
  }
}
