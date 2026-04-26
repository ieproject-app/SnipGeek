"use client";

import { useEffect, useRef, useState } from "react";

interface YouTubeEmbedProps {
  videoid: string;
  title?: string;
}

/**
 * Lazy YouTube embed — shows a thumbnail placeholder until the component
 * scrolls into view (within 200px), then swaps to the real iframe.
 * This avoids loading the YouTube iframe on page load entirely.
 */
export function YouTubeEmbed({ videoid, title }: YouTubeEmbedProps) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Start loading the iframe 200px before it enters the viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const thumbnailUrl = `https://i.ytimg.com/vi/${videoid}/hqdefault.jpg`;
  const resolvedTitle = title ?? "YouTube video player";

  return (
    <span ref={containerRef} className="block my-8 w-full">
      <span
        className="block relative w-full rounded-xl overflow-hidden bg-black"
        style={{ paddingBottom: "56.25%" }}
      >
        {shouldLoad ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoid}`}
            title={resolvedTitle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        ) : (
          /* Thumbnail placeholder — zero iframe cost */
          <span className="absolute inset-0 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnailUrl}
              alt={resolvedTitle}
              className="w-full h-full object-cover opacity-90"
              loading="lazy"
              decoding="async"
            />
            {/* YouTube-style play button */}
            <span
              aria-hidden="true"
              className="absolute flex items-center justify-center w-16 h-12 rounded-xl bg-[#FF0000] shadow-xl transition-transform duration-150 group-hover:scale-110"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-7 h-7 fill-white"
                aria-hidden="true"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </span>
        )}
      </span>
    </span>
  );
}
