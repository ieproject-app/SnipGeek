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
  }, [props.src]);

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
    if (typeof props.src !== "string") return undefined;
    if (!props.src.startsWith("/images/")) return undefined;

    return ({ src, width, quality }: ImageLoaderProps) => {
      const params = new URLSearchParams({
        src,
        w: String(width),
        q: String(quality ?? 68),
      });
      return `/api/img?${params.toString()}`;
    };
  }, [providedLoader, props.src]);

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
        className={mergedImageClassName}
        loader={localImageLoader}
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
