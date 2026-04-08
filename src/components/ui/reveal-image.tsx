"use client";

import Image, { type ImageLoaderProps, type ImageProps } from "next/image";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

interface RevealImageProps extends Omit<ImageProps, "onLoad"> {
  wrapperClassName?: string;
  imageClassName?: string;
  placeholderClassName?: string;
  revealDurationMs?: number;
  holdUntilLoaded?: boolean;
  initialVisitOnly?: boolean;
  showSkeleton?: boolean;
}

export function RevealImage({
  alt,
  className,
  wrapperClassName,
  imageClassName,
  placeholderClassName,
  revealDurationMs = 320,
  holdUntilLoaded = true,
  initialVisitOnly = false,
  showSkeleton = true,
  priority,
  loading,
  sizes,
  src,
  unoptimized,
  loader: providedLoader,
  ...props
}: RevealImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [shouldHold, setShouldHold] = useState(holdUntilLoaded);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    setIsLoaded(false);
  }, [src]);

  useEffect(() => {
    if (!initialVisitOnly) {
      setShouldHold(holdUntilLoaded);
      return;
    }

    if (typeof window === "undefined") {
      setShouldHold(holdUntilLoaded);
      return;
    }

    const visitKey = "snipgeek-initial-visit-complete";
    const hasVisited = window.sessionStorage.getItem(visitKey) === "1";
    setShouldHold(holdUntilLoaded && !hasVisited);
    if (!hasVisited) {
      window.sessionStorage.setItem(visitKey, "1");
    }
  }, [holdUntilLoaded, initialVisitOnly]);

  const shouldHideImage = shouldHold && !isLoaded;
  const shouldShowPlaceholder = !isLoaded && (!hasMounted || shouldHold || showSkeleton);

  const mergedImageClassName = useMemo(
    () =>
      cn(
        "object-cover will-change-transform",
        shouldHold
          ? "transition-opacity ease-out"
          : "transition-opacity duration-300 ease-out",
        shouldHideImage ? "opacity-0" : "opacity-100",
        className,
        imageClassName,
      ),
    [className, imageClassName, shouldHideImage, shouldHold],
  );

  const localImageLoader = useMemo(() => {
    if (providedLoader) return providedLoader;
    if (typeof src !== "string") return undefined;

    const normalizedSrc = (() => {
      if (src.startsWith("/images/")) return src;
      if (/^https?:\/\//i.test(src)) {
        try {
          const parsed = new URL(src);
          if (parsed.pathname.startsWith("/images/")) {
            return `${parsed.pathname}${parsed.search}`;
          }
        } catch {
          return undefined;
        }
      }
      return undefined;
    })();

    if (!normalizedSrc) return undefined;

    return ({ src, width, quality }: ImageLoaderProps) => {
      const params = new URLSearchParams({
        src: src.startsWith("/images/") ? src : normalizedSrc,
        w: String(width),
        q: String(quality ?? 68),
      });
      return `/api/img?${params.toString()}`;
    };
  }, [providedLoader, src]);

  const directLocalOptimizedSrc = useMemo(() => {
    if (providedLoader) return undefined;
    if (typeof src !== "string") return undefined;

    const normalizedSrc = (() => {
      if (src.startsWith("/images/")) return src;
      if (/^https?:\/\//i.test(src)) {
        try {
          const parsed = new URL(src);
          if (parsed.pathname.startsWith("/images/")) {
            return `${parsed.pathname}${parsed.search}`;
          }
        } catch {
          return undefined;
        }
      }
      return undefined;
    })();

    if (!normalizedSrc) return undefined;

    const params = new URLSearchParams({
      src: normalizedSrc,
      q: "68",
    });
    return `/api/img?${params.toString()}`;
  }, [providedLoader, src]);

  return (
    <div className={cn("relative h-full w-full overflow-hidden", wrapperClassName)}>
      {shouldShowPlaceholder && (
        <div
          className={cn(
            "skeleton absolute inset-0 z-10",
            showSkeleton ? "" : "bg-muted",
            placeholderClassName,
          )}
          data-variant={showSkeleton ? "shimmer" : "static"}
          aria-hidden="true"
        />
      )}

      <Image
        alt={alt}
        src={directLocalOptimizedSrc ?? src}
        className={mergedImageClassName}
        loader={localImageLoader}
        unoptimized={Boolean(directLocalOptimizedSrc) || unoptimized}
        priority={priority}
        loading={loading}
        sizes={sizes}
        onLoad={() => setIsLoaded(true)}
        {...props}
        style={{
          ...(props.style ?? {}),
          transitionDuration: `${revealDurationMs}ms`,
        }}
      />
    </div>
  );
}
