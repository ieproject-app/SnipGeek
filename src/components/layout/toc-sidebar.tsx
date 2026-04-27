"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Heading } from "@/lib/mdx-utils";

type TocSidebarProps = {
  headings: Heading[];
  className?: string;
};

export function TocSidebar({ headings, className }: TocSidebarProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter(Boolean) as HTMLElement[];

    if (elements.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-80px 0px -60% 0px",
        threshold: 0.1,
      },
    );

    elements.forEach((el) => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, [headings]);

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav
      className={cn("space-y-1", className)}
      aria-label="Table of contents"
    >
      {headings.map((h) => {
        const isActive = activeId === h.id;
        const isH3 = h.level === 3;

        return (
          <button
            key={h.id}
            onClick={() => handleClick(h.id)}
            className={cn(
              "block w-full text-left text-sm transition-all duration-200 rounded-md px-2 py-1.5",
              isH3 && "pl-5",
              isActive
                ? "font-semibold text-primary bg-primary/8"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
          >
            {h.text}
          </button>
        );
      })}
    </nav>
  );
}

type TocMobileProps = {
  headings: Heading[];
  className?: string;
};

export function TocMobile({ headings, className }: TocMobileProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  useEffect(() => {
    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter(Boolean) as HTMLElement[];

    if (elements.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-80px 0px -60% 0px",
        threshold: 0.1,
      },
    );

    elements.forEach((el) => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, [headings]);

  // Note: we intentionally do NOT auto-center the active pill horizontally
  // while the user scrolls. On mobile browsers, programmatic scroll on an
  // overflow container can interfere with momentum scrolling of the page
  // (symptom: page jumps back toward the top). The pill only auto-centers
  // when the user taps a pill.

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });

    // Center the tapped pill horizontally in its own container only.
    const container = scrollRef.current;
    const btn = buttonRefs.current.get(id);
    if (container && btn) {
      const containerRect = container.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      const delta =
        btnRect.left +
        btnRect.width / 2 -
        (containerRect.left + containerRect.width / 2);
      if (Math.abs(delta) > 1) {
        container.scrollBy({ left: delta, behavior: "smooth" });
      }
    }
  };

  return (
    <div
      ref={scrollRef}
      className={cn(
        "flex gap-2 overflow-x-auto overflow-y-hidden pb-2 scrollbar-none overscroll-x-contain",
        className,
      )}
    >
      {headings.map((h) => {
        const isActive = activeId === h.id;

        return (
          <button
            key={h.id}
            ref={(el) => {
              if (el) buttonRefs.current.set(h.id, el);
            }}
            onClick={() => handleClick(h.id)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 whitespace-nowrap",
              isActive
                ? "border-primary/30 bg-primary/10 text-primary font-semibold"
                : "border-border/50 bg-muted/30 text-muted-foreground hover:border-primary/20 hover:text-foreground",
            )}
          >
            {h.text}
          </button>
        );
      })}
    </div>
  );
}
