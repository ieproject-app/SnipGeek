"use client";

import React from "react";
import { useUser, useAuth, isFirebaseInitialized } from "@/firebase";
import { initiateGoogleSignIn } from "@/firebase/non-blocking-login";
import { signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Chrome,
  LogOut,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Terminal,
  ShieldX,
} from "lucide-react";
import { useNotification } from "@/hooks/use-notification";
import type { Dictionary } from "@/lib/get-dictionary";
import { Separator } from "@/components/ui/separator";

interface ToolWrapperProps {
  children: React.ReactNode;
  title: string;
  description: string;
  dictionary: Dictionary;
  isPublic?: boolean;
}

const INTERNAL_TOOL_ALLOWLIST_RAW =
  process.env.NEXT_PUBLIC_INTERNAL_TOOL_ALLOWLIST || "";

// Supports entries like: alice@company.com,bob@company.com,@company.com
const INTERNAL_TOOL_ALLOWLIST = INTERNAL_TOOL_ALLOWLIST_RAW
  .split(",")
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean);

const hasInternalAllowlist = INTERNAL_TOOL_ALLOWLIST.length > 0;

function isInternalUserAllowed(email: string | null | undefined) {
  if (!hasInternalAllowlist) return true;
  if (!email) return false;

  const normalizedEmail = email.toLowerCase();

  return INTERNAL_TOOL_ALLOWLIST.some((entry) => {
    if (entry.startsWith("@")) {
      return normalizedEmail.endsWith(entry);
    }

    return normalizedEmail === entry;
  });
}

export function ToolWrapper({
  children,
  title,
  description,
  dictionary,
  isPublic = false,
}: ToolWrapperProps) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { notify } = useNotification();

  const t = dictionary?.tools?.systemNotReady || {
    title: "SISTEM BELUM SIAP",
    description: "Kunci API Firebase tidak terdeteksi.",
    connecting: "Menghubungkan...",
    restrictedAccess: "Akses Terbatas",
    restrictedDesc: "Tool ini memerlukan login.",
    loginWithGoogle: "Masuk dengan Google",
  };

  const handleGoogleLogin = () => {
    if (!auth) return;
    initiateGoogleSignIn(auth);
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      notify(
        dictionary?.notifications?.logoutSuccess || "Berhasil keluar.",
        <LogOut className="h-4 w-4" />,
      );
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">
          {t.connecting}
        </p>
      </div>
    );
  }

  if (isPublic) {
    return (
      <div className="space-y-8 animate-in fade-in duration-700">
        {!isFirebaseInitialized && (
          <div className="p-4 bg-amber-500/10 border-l-4 border-amber-500 rounded-lg text-amber-700">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5" />
              <p className="text-xs font-bold italic">
                Sistem Cloud sedang dalam pemeliharaan.
              </p>
            </div>
          </div>
        )}

        {user && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-muted/30 backdrop-blur-sm rounded-2xl border border-primary/5 shadow-inner">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 border-2 border-background shadow-md">
                <AvatarImage
                  src={user.photoURL || ""}
                  alt={user.displayName || "User"}
                />
                <AvatarFallback className="bg-primary text-primary-foreground font-black">
                  {user.displayName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black uppercase tracking-tight text-primary">
                    {user.displayName}
                  </p>
                  <Badge
                    variant="secondary"
                    className="h-4 px-1.5 text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-600 border-none"
                  >
                    <CheckCircle2 className="h-2 w-2 mr-1" /> Verified
                  </Badge>
                </div>
                <p className="text-[10px] font-mono text-muted-foreground opacity-60">
                  {user.email}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="rounded-full text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
            >
              <LogOut className="h-3.5 w-3.5 mr-2" /> Keluar Akun
            </Button>
          </div>
        )}

        <header className="text-center space-y-3">
          <h1 className="font-display text-4xl font-extrabold tracking-tighter text-primary uppercase">
            {title}
          </h1>
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-8 bg-accent/30" />
            <p className="text-muted-foreground italic text-lg font-medium">
              {description}
            </p>
            <div className="h-px w-8 bg-accent/30" />
          </div>
        </header>

        <main className="relative">{children}</main>
      </div>
    );
  }

  if (!isFirebaseInitialized) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 animate-in fade-in duration-700">
        <Card className="border-destructive/20 bg-destructive/[0.02] p-8 rounded-2xl shadow-xl border-t-4 border-t-destructive">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto p-4 bg-destructive/10 rounded-full w-fit">
              <ShieldX className="h-12 w-12 text-destructive" />
            </div>
            <div className="space-y-1">
              <CardTitle className="font-display text-3xl font-black tracking-tighter text-destructive uppercase">
                {t.title}
              </CardTitle>
              <CardDescription className="text-base">
                {t.description}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="mt-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  step: "1",
                  title: "Push Kode",
                  desc: "Pastikan file apphosting.yaml sudah dikirim.",
                },
                {
                  step: "2",
                  title: "Rollout",
                  desc: "Klik Start Rollout di dashboard Firebase.",
                },
                {
                  step: "3",
                  title: "Cek Status",
                  desc: "Pastikan status Build berwarna hijau.",
                },
              ].map((s) => (
                <div
                  key={s.step}
                  className="p-4 rounded-xl bg-background border border-destructive/10 space-y-2"
                >
                  <span className="text-2xl font-black text-destructive/20">
                    0{s.step}
                  </span>
                  <p className="text-xs font-black uppercase tracking-tight text-primary">
                    {s.title}
                  </p>
                  <p className="text-[10px] leading-relaxed text-muted-foreground">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
            <Separator className="bg-destructive/10" />
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex items-center gap-2 p-3 bg-destructive/5 rounded-lg border border-destructive/10 w-full justify-center">
                <Terminal className="h-4 w-4 text-destructive" />
                <p className="text-[10px] font-mono text-destructive font-bold uppercase">
                  Status: Auth Disabled
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto animate-in fade-in zoom-in-95 duration-500">
        <Card className="text-center mt-8 border-primary/10 bg-card/50 shadow-xl rounded-2xl overflow-hidden">
          <div className="h-1.5 w-full bg-accent" />
          <CardHeader className="pt-10 pb-6 space-y-4">
            <div className="mx-auto p-4 bg-primary/5 rounded-full w-fit border border-primary/5">
              <Lock className="h-8 w-8 text-primary opacity-40" />
            </div>
            <div className="space-y-1">
              <CardTitle className="font-display text-2xl font-black uppercase tracking-tighter">
                {t.restrictedAccess}
              </CardTitle>
              <CardDescription className="text-xs uppercase font-bold tracking-widest opacity-60">
                Internal Team Only
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-10 pb-12 space-y-8">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Silakan login dengan Google untuk mengakses tool {title}.
            </p>
            <Button
              onClick={handleGoogleLogin}
              className="w-full h-12 rounded-full gap-3 font-black uppercase tracking-widest shadow-lg shadow-primary/10 hover:scale-[1.02] transition-transform"
            >
              <Chrome className="h-5 w-5" />
              {t.loginWithGoogle}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isInternalUserAllowed(user.email)) {
    return (
      <div className="max-w-md mx-auto animate-in fade-in zoom-in-95 duration-500">
        <Card className="text-center mt-8 border-destructive/20 bg-card/50 shadow-xl rounded-2xl overflow-hidden">
          <div className="h-1.5 w-full bg-destructive/80" />
          <CardHeader className="pt-10 pb-6 space-y-4">
            <div className="mx-auto p-4 bg-destructive/10 rounded-full w-fit border border-destructive/20">
              <ShieldX className="h-8 w-8 text-destructive opacity-80" />
            </div>
            <div className="space-y-1">
              <CardTitle className="font-display text-2xl font-black uppercase tracking-tighter text-destructive">
                Akses Ditolak
              </CardTitle>
              <CardDescription className="text-xs uppercase font-bold tracking-widest opacity-70">
                Internal Allowlist Required
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-10 pb-12 space-y-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Akun Google ini belum terdaftar untuk mengakses tool internal.
              Hubungi admin jika akun perlu ditambahkan ke allowlist.
            </p>
            <p className="text-[10px] font-mono text-muted-foreground/70 break-all rounded-lg bg-muted/40 px-3 py-2">
              {user.email}
            </p>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full h-11 rounded-full gap-2 font-black uppercase tracking-widest"
            >
              <LogOut className="h-4 w-4" />
              Keluar Akun
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-muted/30 backdrop-blur-sm rounded-2xl border border-primary/5 shadow-inner">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 border-2 border-background shadow-md">
            <AvatarImage
              src={user.photoURL || ""}
              alt={user.displayName || "User"}
            />
            <AvatarFallback className="bg-primary text-primary-foreground font-black">
              {user.displayName?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <p className="text-sm font-black uppercase tracking-tight text-primary">
                {user.displayName}
              </p>
              <Badge
                variant="secondary"
                className="h-4 px-1.5 text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-600 border-none"
              >
                <CheckCircle2 className="h-2 w-2 mr-1" /> Verified
              </Badge>
            </div>
            <p className="text-[10px] font-mono text-muted-foreground opacity-60">
              {user.email}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="rounded-full text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
        >
          <LogOut className="h-3.5 w-3.5 mr-2" /> Keluar Akun
        </Button>
      </div>

      <header className="text-center space-y-3">
        <h1 className="font-display text-4xl font-extrabold tracking-tighter text-primary uppercase">
          {title}
        </h1>
        <div className="flex items-center justify-center gap-3">
          <div className="h-px w-8 bg-accent/30" />
          <p className="text-muted-foreground italic text-lg font-medium">
            {description}
          </p>
          <div className="h-px w-8 bg-accent/30" />
        </div>
      </header>

      <main className="relative">{children}</main>
    </div>
  );
}
