"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";

export default function BlogPostError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams<{ locale?: string }>();
  const blogHref = params?.locale === "id" ? "/id/blog" : "/blog";

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
        Article error
      </p>
      <h1 className="mt-4 font-display text-3xl font-black tracking-tight text-primary">
        This article could not load
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Try rendering the article again, or return to the blog index.
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
          href={blogHref}
          className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          Back to blog
        </Link>
      </div>
    </main>
  );
}
