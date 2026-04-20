"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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

  useEffect(() => {
    if (user) {
      router.push("/admin");
    }
  }, [user, router]);

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!auth) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border-destructive/20 bg-destructive/5">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto p-4 bg-destructive/10 rounded-full w-fit">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <CardTitle className="font-display text-2xl font-black uppercase text-destructive">
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

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 py-12 bg-muted/30">
      <Card className="w-full max-w-md shadow-2xl border-primary/10 bg-card/60 backdrop-blur-sm overflow-hidden">
        <div className="h-1.5 w-full bg-accent" />
        <CardHeader className="space-y-4 text-center pt-10 pb-6">
          <div className="flex justify-center">
            <SnipGeekLogo className="h-14 w-14" />
          </div>
          <CardTitle className="font-display text-3xl font-black tracking-tighter uppercase">
            Admin Console
          </CardTitle>
          <CardDescription className="text-sm px-6">
            Dashboard internal SnipGeek. Login hanya untuk pemilik situs.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-10 px-10 space-y-4">
          <Button
            type="button"
            className="w-full h-12 font-black uppercase tracking-widest gap-3 rounded-full"
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
