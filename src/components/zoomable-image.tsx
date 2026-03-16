"use client";

import { useState, type ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import {
    Plus,
} from "lucide-react";
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
type ZoomableImageProps = ImgHTMLAttributes<HTMLImageElement> & {
    src: string;
    alt?: string;
    priority?: boolean;
};

export const ZoomableImage = ({
    src,
    alt,
    className,
    priority: _priority,
    ...props
}: ZoomableImageProps) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const { onLoad: onImageLoad, ...imageProps } = props;

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

    const width = parseDimension(imageProps.width);
    const height = parseDimension(imageProps.height);
    const reservedAspectRatio = width && height ? `${width} / ${height}` : "16 / 9";

    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="group relative cursor-zoom-in overflow-hidden rounded-xl bg-muted shadow-md transition-all duration-500 hover:shadow-2xl">
                    <div
                        className="relative w-full"
                        style={{ aspectRatio: reservedAspectRatio }}
                    >
                    {!isLoaded && (
                        <div
                            className="skeleton absolute inset-0 z-0"
                            data-variant="shimmer"
                            aria-hidden="true"
                        />
                    )}

                    <img
                        src={src}
                        alt={alt || "SnipGeek Image"}
                        loading={imageProps.loading ?? "lazy"}
                        decoding={imageProps.decoding ?? "async"}
                        {...imageProps}
                        onLoad={(event) => {
                            setIsLoaded(true);
                            onImageLoad?.(event);
                        }}
                        className={cn(
                            "absolute inset-0 z-[1] h-full w-full object-contain transition-all duration-500 ease-out group-hover:scale-[1.03]",
                            isLoaded ? "opacity-100" : "opacity-0",
                            className,
                        )}
                    />
                    </div>

                    {/* Hover Overlay: Plus Pill */}
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/5 opacity-0 transition-all duration-500 group-hover:bg-black/20 group-hover:opacity-100">
                        <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-white shadow-2xl backdrop-blur-md transition-transform duration-500 group-hover:scale-110">
                            <Plus className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                                Zoom
                            </span>
                        </div>
                    </div>
                </div>
            </DialogTrigger>

            <DialogContent className="max-w-[100vw] max-h-screen border-none bg-transparent p-0 shadow-none outline-none flex items-center justify-center z-100 [&>button]:hidden">
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
                                className="relative max-w-7xl max-h-full"
                            >
                                <img
                                    src={src}
                                    alt={alt || "SnipGeek Image"}
                                    loading="eager"
                                    decoding="async"
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
