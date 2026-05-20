"use client";

import { useEffect, useRef, useState } from "react";

type CloudinaryVideoEmbedProps = {
  src: string;
  title?: string;
};

type VideoSource = {
  src: string;
  type: string;
};

const getCloudinaryVideoSource = (
  src: string,
  format: "mp4" | "webm",
): string | null => {
  try {
    const url = new URL(src);

    if (
      url.hostname !== "res.cloudinary.com" ||
      !url.pathname.includes("/video/upload/")
    ) {
      return null;
    }

    const pathParts = url.pathname.split("/");
    const uploadIndex = pathParts.indexOf("upload");
    const versionIndex = pathParts.findIndex((part, index) => {
      return index > uploadIndex && /^v\d+$/.test(part);
    });

    if (uploadIndex === -1 || versionIndex === -1) {
      return null;
    }

    const transformParts = pathParts.slice(uploadIndex + 1, versionIndex);
    const baseTransforms =
      transformParts.length > 0 ? transformParts.join(",").split(",") : [];
    const filteredTransforms = baseTransforms.filter((transform) => {
      return (
        transform &&
        !transform.startsWith("f_") &&
        !transform.startsWith("vc_") &&
        !transform.startsWith("ac_")
      );
    });
    const formatTransforms =
      format === "mp4" ? ["f_mp4", "vc_h264", "ac_aac"] : ["f_webm", "vc_vp9"];

    pathParts.splice(
      uploadIndex + 1,
      versionIndex - uploadIndex - 1,
      [...filteredTransforms, ...formatTransforms].join(","),
    );

    const publicIdIndex = uploadIndex + 2;
    const lastPartIndex = pathParts.length - 1;
    pathParts[lastPartIndex] = pathParts[lastPartIndex].replace(
      /\.[^/.]+$/,
      `.${format}`,
    );

    if (lastPartIndex <= publicIdIndex) {
      return null;
    }

    url.pathname = pathParts.join("/");
    return url.toString();
  } catch {
    return null;
  }
};

const getVideoSources = (src: string): VideoSource[] => {
  const webmSrc = getCloudinaryVideoSource(src, "webm");
  const mp4Src = getCloudinaryVideoSource(src, "mp4") ?? src;

  return [
    ...(webmSrc ? [{ src: webmSrc, type: "video/webm" }] : []),
    { src: mp4Src, type: "video/mp4" },
  ];
};

export function CloudinaryVideoEmbed({ src, title }: CloudinaryVideoEmbedProps) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const resolvedTitle = title ?? "Video player";
  const sources = getVideoSources(src);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting) {
          setShouldLoad(true);
        }
      },
      { rootMargin: "100px 0px", threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldLoad || !videoRef.current) return;

    if (isIntersecting) {
      videoRef.current.play().catch((err) => {
        console.warn("Autoplay blocked or interrupted:", err);
      });
    } else {
      videoRef.current.pause();
    }
  }, [shouldLoad, isIntersecting]);

  return (
    <span ref={containerRef} className="block my-8 w-full">
      <span
        className="block relative w-full rounded-xl overflow-hidden bg-black"
        style={{ paddingBottom: "56.25%" }}
      >
        {shouldLoad ? (
          <video
            ref={videoRef}
            controls
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full"
            aria-label={resolvedTitle}
          >
            {sources.map((source) => (
              <source key={`${source.type}:${source.src}`} {...source} />
            ))}
          </video>
        ) : (
          <button
            type="button"
            onClick={() => setShouldLoad(true)}
            className="absolute inset-0 w-full h-full flex items-center justify-center"
            aria-label={`Load video: ${resolvedTitle}`}
          >
            <span
              aria-hidden="true"
              className="absolute flex items-center justify-center w-16 h-12 rounded-xl bg-white/10 border border-white/15 shadow-xl backdrop-blur-sm"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-7 h-7 fill-white"
                aria-hidden="true"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        )}
      </span>
    </span>
  );
}
