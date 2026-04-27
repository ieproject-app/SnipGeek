"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type ReadingProgressProps = {
  className?: string;
};

/**
 * Thin progress bar pinned to the top of the viewport that reflects how far
 * the user has scrolled through the document. Designed to live inside static
 * pages (legal, narrative, contact) for a polished docs-grade feel.
 */
export function ReadingProgress({ className }: ReadingProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const next = docHeight > 0 ? Math.min(1, Math.max(0, scrollTop / docHeight)) : 0;
      setProgress(next);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-50 h-[2px] bg-transparent",
        className,
      )}
    >
      <div
        className="h-full origin-left bg-linear-to-r from-accent via-primary to-accent transition-[transform] duration-150 ease-out"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}
