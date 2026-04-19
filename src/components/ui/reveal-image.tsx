"use client";

import Image, { type ImageLoaderProps, type ImageProps } from "next/image";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Module-level cache of image sources that have already loaded during this
 * session. Prevents skeleton flash when the same image is rendered again
 * (e.g. Back navigation, HMR, scroll-triggered remount).
 */
const loadedSources = new Set<string>();

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

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
  width,
  loader: providedLoader,
  ...props
}: RevealImageProps) {
  const srcKey = typeof src === "string" ? src : "";
  const [isLoaded, setIsLoaded] = useState(() => loadedSources.has(srcKey));
  const [hasMounted, setHasMounted] = useState(false);
  const [shouldHold, setShouldHold] = useState(holdUntilLoaded);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    // When src changes, check the global cache first before resetting.
    if (loadedSources.has(srcKey)) {
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [srcKey]);

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

  // Synchronously detect images already in browser cache (before paint).
  useIsomorphicLayoutEffect(() => {
    if (isLoaded) return;
    const img = wrapperRef.current?.querySelector("img");
    if (img?.complete && img.naturalWidth > 0) {
      setIsLoaded(true);
      if (srcKey) loadedSources.add(srcKey);
    }
  }, [srcKey]);

  const shouldHideImage = shouldHold && !isLoaded;
  const shouldShowPlaceholder = !isLoaded && (!hasMounted || shouldHold || showSkeleton);

  const mergedImageClassName = useMemo(
    () =>
      cn(
        "object-cover",
        shouldHideImage ? "opacity-0" : "opacity-100",
        className,
        imageClassName,
      ),
    [className, imageClassName, shouldHideImage],
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
      w: width ? String(Math.min(Number(width), 1200)) : "640",
      q: "68",
    });
    return `/api/img?${params.toString()}`;
  }, [providedLoader, src, width]);

  return (
    <div ref={wrapperRef} className={cn("relative h-full w-full overflow-hidden", wrapperClassName)}>
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
        fetchPriority={priority ? "high" : undefined}
        loading={loading}
        sizes={sizes}
        width={width}
        onLoad={() => {
          setIsLoaded(true);
          if (srcKey) loadedSources.add(srcKey);
        }}
        {...props}
        style={{
          ...(props.style ?? {}),
          transition: `opacity ${shouldHold ? revealDurationMs : 300}ms ease-out`,
        }}
      />
    </div>
  );
}
