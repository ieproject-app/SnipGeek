"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background font-sans text-foreground antialiased">
        <main className="flex min-h-screen items-center justify-center px-6 py-12">
          <section className="w-full max-w-2xl text-center">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
              SnipGeek error
            </p>
            <h1 className="mt-4 font-display text-4xl font-black tracking-tight text-primary">
              Something went wrong
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              The page failed to render. Try again, or return to the homepage.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={reset}
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Try again
              </button>
              <Link
                href="/"
                className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Go home
              </Link>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
