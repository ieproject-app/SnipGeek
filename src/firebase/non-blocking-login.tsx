
'use client';
import {
  Auth,
  AuthError,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth';

/** 
 * Utility to check if current device is a mobile or tablet. 
 */
function isMobileOrTablet(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
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
      try { sessionStorage.setItem('sg_pending_google_redirect', '1'); } catch {}
      await signInWithRedirect(authInstance, provider);
    } catch (error: unknown) {
      const authError = error as AuthError;
      console.error("Firebase Auth Redirect Error:", authError.code, authError.message);
      throw error;
    }
    return;
  }

  // CRITICAL: Call signInWithPopup directly for desktop users.
  try {
    await signInWithPopup(authInstance, provider);
  } catch (error: unknown) {
    const authError = error as AuthError;
    if (
      authError.code === 'auth/popup-closed-by-user' || 
      authError.code === 'auth/cancelled-popup-request'
    ) {
      // User cancelled, safe to ignore.
      return;
    }
    
    if (authError.code === 'auth/unauthorized-domain') {
      alert(`Domain ini belum didaftarkan di Firebase Console. Silakan tambahkan domain situs Anda ke: Auth > Settings > Authorized Domains.`);
    }

    if (
      authError.code === 'auth/popup-blocked' ||
      authError.code === 'auth/operation-not-supported-in-this-environment'
    ) {
      try { sessionStorage.setItem('sg_pending_google_redirect', '1'); } catch {}
      await signInWithRedirect(authInstance, provider);
      return;
    }

    console.error("Firebase Auth Error:", authError.code, authError.message);
    throw error;
  }
}

/**
 * Finalize Google redirect flow after returning from provider page.
 * Safe to call on app boot; returns null when no redirect is pending.
 */
export async function finalizeGoogleRedirectSignIn(authInstance: Auth) {
  // Only call getRedirectResult when a redirect is actually pending.
  // Calling it unconditionally loads https://apis.google.com/js/api.js and
  // the gapi iframe on every page load, which sets third-party cookies
  // (COMPASS, __Secure-OSID, __Host-3PLSID) and tanks Lighthouse
  // "Best Practices" (third-party-cookies + inspector-issues audits).
  if (typeof window === 'undefined') return null;
  let pending = false;
  try {
    pending = sessionStorage.getItem('sg_pending_google_redirect') === '1';
  } catch {}
  if (!pending) return null;

  try {
    const result = await getRedirectResult(authInstance);
    try { sessionStorage.removeItem('sg_pending_google_redirect'); } catch {}
    return result;
  } catch (error: unknown) {
    try { sessionStorage.removeItem('sg_pending_google_redirect'); } catch {}
    const authError = error as AuthError;
    if (authError?.code === 'auth/unauthorized-domain') {
      alert('Domain ini belum didaftarkan di Firebase Console (Authorized Domains).');
    }
    throw error;
  }
}
