"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

export type GalleryImageItem = {
  src: string;
  alt: string;
  title?: string;
};

type GalleryLightboxProps = {
  images: GalleryImageItem[];
  caption?: React.ReactNode;
  className?: string;
};

export function GalleryLightbox({
  images,
  caption,
  className,
}: GalleryLightboxProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const total = images.length;
  const activeImage = images[activeIndex] ?? images[0];

  const goTo = useCallback(
    (nextIndex: number) => {
      if (total === 0) return;
      const normalized = (nextIndex + total) % total;
      setActiveIndex(normalized);
    },
    [total],
  );

  const goPrev = useCallback(() => {
    goTo(activeIndex - 1);
  }, [activeIndex, goTo]);

  const goNext = useCallback(() => {
    goTo(activeIndex + 1);
  }, [activeIndex, goTo]);

  const openAt = useCallback((index: number) => {
    setActiveIndex(index);
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev, open]);

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.changedTouches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) {
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartXRef.current;
    const deltaY = touch.clientY - touchStartYRef.current;

    touchStartXRef.current = null;
    touchStartYRef.current = null;

    const horizontalThreshold = 44;
    if (
      Math.abs(deltaX) > horizontalThreshold &&
      Math.abs(deltaX) > Math.abs(deltaY)
    ) {
      if (deltaX < 0) {
        goNext();
      } else {
        goPrev();
      }
    }
  };

  return (
    <div
      className={cn(
        "my-12 w-full relative sm:-mx-8 lg:-mx-16 sm:w-[calc(100%+4rem)] lg:w-[calc(100%+8rem)]",
        className,
      )}
    >
      <div className={cn("grid grid-cols-1 gap-4", total === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3")}>
        {images.map((image, index) => (
          <button
            key={`${image.src}-${index}`}
            type="button"
            onClick={() => openAt(index)}
            className="group relative overflow-hidden rounded-xl ring-1 ring-border/45 transition-[box-shadow,transform] duration-300 hover:shadow-md hover:ring-border/70"
          >
            <img
              src={image.src}
              alt={image.alt || `Gallery image ${index + 1}`}
              loading="lazy"
              decoding="async"
              className="block h-full w-full rounded-xl object-cover transition-transform duration-300 group-hover:scale-[1.015]"
            />
          </button>
        ))}
      </div>

      {caption && (
        <p className="mt-5 text-center text-[13px] font-medium italic text-muted-foreground/85">
          {caption}
        </p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="z-[100] flex max-h-screen max-w-[100vw] items-center justify-center border-none bg-transparent p-0 shadow-none outline-none [&>button]:hidden">
          <DialogTitle className="sr-only">Image gallery preview</DialogTitle>
          <DialogDescription className="sr-only">
            Use left and right controls to move between gallery images.
          </DialogDescription>

          <div className="relative h-screen w-screen overflow-hidden bg-black/85 backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white transition-colors hover:bg-black/55"
              aria-label="Close gallery"
            >
              <X className="h-5 w-5" />
            </button>

            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  className="absolute left-3 top-1/2 z-30 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white transition-colors hover:bg-black/55"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>

                <button
                  type="button"
                  onClick={goNext}
                  className="absolute right-3 top-1/2 z-30 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white transition-colors hover:bg-black/55"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            <div
              className="flex h-full w-full items-center justify-center p-4 md:p-10"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {activeImage && (
                <img
                  src={activeImage.src}
                  alt={activeImage.alt || "Gallery image"}
                  loading="eager"
                  decoding="async"
                  className="max-h-[86vh] max-w-[92vw] rounded-2xl border border-white/10 object-contain shadow-[0_0_100px_-20px_rgba(0,0,0,0.55)]"
                />
              )}
            </div>

            {total > 1 && (
              <div className="pointer-events-none absolute bottom-5 left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/20 bg-black/35 px-3 py-1 text-xs font-semibold text-white/90">
                {activeIndex + 1} / {total}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
