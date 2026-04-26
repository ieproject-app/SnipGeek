"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRedirectResult } from "firebase/auth";
import { useAuth, useUser } from "@/firebase";
import { initiateGoogleSignIn } from "@/firebase/non-blocking-login";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SnipGeekLogo } from "@/components/icons/snipgeek-logo";
import { Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { GoogleLogo } from "@/components/icons/google-logo";

export default function AdminLoginPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  /**
   * `redirectChecked` starts as false and flips to true once
   * getRedirectResult() has fully resolved (success, null, or error).
   *
   * Why call getRedirectResult() here instead of relying on sessionStorage?
   * - sessionStorage is cleared by provider.tsx BEFORE this component reads it
   * → race condition that left isRedirectPending stuck at false
   * - OR sessionStorage persists across refreshes, leaving isRedirectPending
   * stuck at true forever when getRedirectResult() already returned null
   *
   * Calling getRedirectResult() directly is the only reliable source of truth.
   * Firebase SDK returns null quickly when no redirect is pending, so there is
   * no meaningful performance cost on normal page loads.
   */
  const [redirectChecked, setRedirectChecked] = useState(false);
  const [redirectError, setRedirectError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!auth) {
      Promise.resolve().then(() => {
        if (isMounted) setRedirectChecked(true);
      });
      return () => {
        isMounted = false;
      };
    }

    getRedirectResult(auth)
      .then(() => {
        // Success: onAuthStateChanged in provider will fire with the user.
        // Nothing to do here — the user redirect below handles navigation.
      })
      .catch((err: { code?: string; message?: string }) => {
        if (err?.code === "auth/unauthorized-domain") {
          setRedirectError(
            "Domain ini belum didaftarkan di Firebase Console (Authorized Domains).",
          );
        } else if (err?.code && err.code !== "auth/no-auth-event") {
          setRedirectError(`Login gagal: ${err.code}`);
        }
        // auth/no-auth-event = no redirect was pending, not a real error
      })
      .finally(() => {
        // Always clean up the localStorage flag (belt-and-suspenders).
        try { localStorage.removeItem("sg_pending_google_redirect"); } catch {}
        setRedirectChecked(true);
      });
  }, [auth]);

  // Redirect to dashboard once user is confirmed
  useEffect(() => {
    if (user) router.push("/admin");
  }, [user, router]);

  // ── Loading states ────────────────────────────────────────
  // Show spinner while EITHER Firebase is resolving auth state
  // OR we haven't finished checking getRedirectResult yet.
  if (isUserLoading || !redirectChecked) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="h-9 w-9 animate-spin text-accent" />
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-muted-foreground animate-pulse">
          Memeriksa sesi&hellip;
        </p>
      </div>
    );
  }

  // Redirect will happen via useEffect; render nothing in the meantime
  if (user) return null;

  // ── Error state ───────────────────────────────────────────
  if (redirectError) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center px-4 py-12 bg-background">
        <Card className="w-full max-w-md rounded-none border-destructive bg-card shadow-none">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center border border-destructive bg-destructive/10">
              <AlertCircle className="h-7 w-7 text-destructive" />
            </div>
            <CardTitle className="font-display text-xl font-bold uppercase tracking-tight text-destructive">
              Login Gagal
            </CardTitle>
            <CardDescription>{redirectError}</CardDescription>
          </CardHeader>
          <CardContent className="pb-8 px-8">
            <Button
              className="w-full rounded-none"
              onClick={() => setRedirectError(null)}
            >
              Coba Lagi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Firebase not configured ───────────────────────────────
  if (!auth) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center px-4 py-12 bg-background">
        <Card className="w-full max-w-md rounded-none border-destructive bg-card shadow-none">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center border border-destructive bg-destructive/10">
              <AlertCircle className="h-7 w-7 text-destructive" />
            </div>
            <CardTitle className="font-display text-xl font-bold uppercase tracking-tight text-destructive">
              Firebase belum siap
            </CardTitle>
            <CardDescription>
              Pastikan variabel <code>NEXT_PUBLIC_FIREBASE_*</code> tersedia.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // ── Login form ────────────────────────────────────────────
  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 py-12 bg-background">
      <Card className="w-full max-w-md rounded-none border-border bg-card shadow-none overflow-hidden">
        <div className="h-1 w-full bg-accent" />
        <CardHeader className="space-y-4 text-center pt-10 pb-6">
          <div className="flex justify-center">
            <SnipGeekLogo className="h-14 w-14" />
          </div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.35em] text-muted-foreground">
            SnipGeek · Admin
          </p>
          <CardTitle className="font-display text-2xl font-bold tracking-tight">
            Admin Console
          </CardTitle>
          <CardDescription className="text-sm px-6">
            Dashboard internal SnipGeek. Login hanya untuk pemilik situs.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-10 px-10 space-y-4">
          <Button
            type="button"
            className="w-full h-11 font-bold uppercase tracking-wider gap-3 rounded-none"
            onClick={() => auth && initiateGoogleSignIn(auth)}
          >
            <GoogleLogo className="h-5 w-5" />
            Lanjut dengan Google
          </Button>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-bold justify-center">
            <ShieldCheck className="h-3 w-3" />
            Akses diverifikasi via roles_admin
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
