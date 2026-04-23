"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface AdminGuardProps {
  children: ReactNode;
}

/**
 * AdminGuard - Protects routes by checking if the user is logged in
 * and exists in the 'roles_admin' Firestore collection.
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  // Memoize the document reference to the user's role
  const adminDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "roles_admin", user.uid);
  }, [firestore, user?.uid]);

  // Subscribe to the admin document
  const {
    data: adminDoc,
    isLoading: isAdminLoading,
    error: adminError,
  } = useDoc(adminDocRef);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    console.log("[AdminGuard STATE]", {
      uid: user?.uid,
      email: user?.email,
      isUserLoading,
      isAdminLoading,
      adminDocExists: !!adminDoc,
      adminDocData: adminDoc,
      adminError: adminError?.message,
    });
  }, [user, isUserLoading, isAdminLoading, adminDoc, adminError]);

  useEffect(() => {
    // If auth is finished and no user, redirect to login
    if (!isUserLoading && !user) {
      router.replace("/admin/login");
    }
  }, [user, isUserLoading, router]);

  // 1. Show loading while checking auth or firestore role
  if (isUserLoading || isAdminLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">
          Verifying Credentials...
        </p>
      </div>
    );
  }

  // 2. If no user, the useEffect will handle redirection, but we return null here
  if (!user) return null;

  // 3. If admin doc doesn't exist, access is denied
  if (!adminDoc) {
    if (process.env.NODE_ENV === "development") {
      console.log("[AdminGuard DEBUG]", {
        uid: user.uid,
        email: user.email,
        expectedFirestorePath: `roles_admin/${user.uid}`,
      });
    }

    return (
      <div className="flex h-screen w-full flex-col items-center justify-center p-6 text-center bg-background">
        <div className="mb-6 p-4 bg-destructive/10 rounded-full">
          <TriangleAlert className="h-12 w-12 text-destructive" />
        </div>
        <h1 className="font-display text-3xl font-black tracking-tighter mb-2">
          Access Denied
        </h1>
        <p className="text-muted-foreground max-w-md mb-8">
          Your account (<strong>{user.email}</strong>) does not have
          administrative privileges. Please contact the system owner to grant
          access.
        </p>
        <div className="flex gap-4">
          <Button asChild variant="outline">
            <Link href="/">Back to Website</Link>
          </Button>
          <Button onClick={() => router.replace("/admin/login")}>
            Try Different Account
          </Button>
        </div>
      </div>
    );
  }

  // 4. Everything is fine, render the admin content
  return <>{children}</>;
}
