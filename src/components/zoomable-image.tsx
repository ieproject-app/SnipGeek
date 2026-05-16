"use client";

import { useState, type SyntheticEvent } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

/**
 * ZoomableImage - Wrapper component to make images clickable and expandabe.
 */
type ZoomableImageProps = {
  src: string;
  alt?: string;
  className?: string;
  priority?: boolean;
  width?: number | string;
  height?: number | string;
  loading?: "lazy" | "eager";
  sizes?: string;
  quality?: number;
  fetchPriority?: "auto" | "high" | "low";
  onLoad?: (event: SyntheticEvent<HTMLImageElement>) => void;
};

export const ZoomableImage = ({
  src,
  alt,
  className,
  priority,
  width: rawWidth,
  height: rawHeight,
  loading,
  sizes,
  quality,
  fetchPriority,
  onLoad,
}: ZoomableImageProps) => {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);

  const parseDimension = (value: number | string | undefined) => {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      return value;
    }

    if (typeof value === "string") {
      const parsed = Number.parseFloat(value);
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }

    return null;
  };

  const width = parseDimension(rawWidth);
  const height = parseDimension(rawHeight);
  const renderWidth = Math.round(width ?? 1600);
  const renderHeight = Math.round(height ?? 900);
  const previewWidth = renderWidth;
  const previewHeight = renderHeight;
  const reservedAspectRatio = width && height ? `${width} / ${height}` : undefined;
  const shouldDisableOptimization =
    src.startsWith("data:") || src.startsWith("blob:");
  const isLoaded = loadedSrc === src;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="group relative cursor-zoom-in overflow-hidden rounded-xl ring-1 ring-inset ring-border/45 transition-[box-shadow,transform] duration-300 hover:shadow-lg hover:ring-border/70 transform-gpu bg-transparent">
          <div className="relative w-full overflow-hidden rounded-xl transform-gpu">
            {!isLoaded && (
              <div
                className="skeleton absolute inset-0 z-0 bg-muted/45"
                data-variant="shimmer"
                aria-hidden="true"
              />
            )}

            <Image
              src={src}
              alt={alt || "SnipGeek Image"}
              width={renderWidth}
              height={renderHeight}
              unoptimized={shouldDisableOptimization}
              loading={loading ?? "lazy"}
              fetchPriority={fetchPriority}
              preload={Boolean(priority)}
              quality={quality}
              sizes={sizes ?? "(max-width: 768px) 100vw, 900px"}
              onLoad={(event) => {
                setLoadedSrc(src);
                onLoad?.(event);
              }}
              className={cn(
                "relative z-[1] block h-auto w-full object-cover transition-[opacity,transform] duration-300 ease-out group-hover:scale-[1.01]",
                isLoaded ? "opacity-100" : "opacity-0",
                !reservedAspectRatio && !isLoaded && "min-h-48",
                className,
              )}
            />
          </div>

          <div className="pointer-events-none absolute top-3 right-3 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="flex items-center gap-1.5 rounded-full border border-white/30 bg-black/45 px-3 py-1.5 text-white shadow-lg backdrop-blur-sm">
              <Plus className="h-3.5 w-3.5" />
              <span className="text-[10px] font-black uppercase tracking-[0.18em]">
                Zoom
              </span>
            </div>
          </div>
        </div>
      </DialogTrigger>

      <DialogContent className="max-w-[100vw] max-h-screen border-none bg-transparent p-0 shadow-none outline-none flex items-center justify-center z-[100] [&>button]:hidden">
        <DialogTitle className="sr-only">Pratinjau Gambar</DialogTitle>
        <DialogDescription className="sr-only">
          Tampilan gambar diperbesar untuk {alt || "gambar artikel"}
        </DialogDescription>

        <DialogClose asChild>
          <div className="relative h-screen w-screen flex items-center justify-center p-4 md:p-8 overflow-hidden bg-black/80 backdrop-blur-xl cursor-zoom-out">
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  transition: {
                    type: "spring",
                    damping: 25,
                    stiffness: 300,
                  },
                }}
                className="relative max-w-full max-h-full"
              >
                <Image
                  src={src}
                  alt={alt || "SnipGeek Image"}
                  width={previewWidth}
                  height={previewHeight}
                  unoptimized={shouldDisableOptimization}
                  loading="eager"
                  fetchPriority="high"
                  className="max-w-full max-h-212.5 object-contain rounded-2xl shadow-[0_0_100px_-20px_rgba(0,0,0,0.5)] border border-white/5"
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};
