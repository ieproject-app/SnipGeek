"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Heading } from "@/lib/mdx-utils";
import { ChevronRight, ListIcon } from "lucide-react";

interface TableOfContentsProps {
  headings: Heading[];
  title: string;
  locale?: string;
}

export function TableOfContents({
  headings,
  title,
  locale = "en",
}: TableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleHeadingClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    headingId: string,
  ) => {
    event.preventDefault();
    setIsOpen(false);

    window.setTimeout(() => {
      const target = document.getElementById(headingId);
      if (!target) return;

      const targetTop =
        target.getBoundingClientRect().top + window.scrollY - 22;

      window.scrollTo({
        top: Math.max(targetTop, 0),
        behavior: "smooth",
      });

      window.history.replaceState(null, "", `#${headingId}`);
    }, 280);
  };

  if (headings.length === 0) return null;

  return (
    <div
      className={cn(
        "my-8 overflow-hidden rounded-2xl border border-primary/10 bg-card/60 shadow-sm transition-all duration-300",
        "border-l-4 border-l-primary/50",
      )}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex w-full items-center justify-between p-5 text-left transition-all duration-200 hover:bg-muted/30 active:scale-[0.99]"
        aria-expanded={isOpen}
        aria-label={title}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2 transition-transform duration-300 group-hover:rotate-12">
            <ListIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-headline text-base font-bold tracking-wide text-primary">
              {title}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {headings.length}{" "}
              {locale === "id"
                ? headings.length === 1
                  ? "bagian"
                  : "bagian"
                : headings.length === 1
                  ? "section"
                  : "sections"}
            </span>
          </div>
        </div>
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full bg-muted/50 transition-all duration-300",
            isOpen && "rotate-90 bg-primary text-primary-foreground",
          )}
        >
          <ChevronRight className="h-5 w-5" />
        </div>
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-out",
          isOpen
            ? "max-h-[1000px] translate-y-0 opacity-100"
            : "max-h-0 -translate-y-2 opacity-0",
        )}
      >
        <div className="mx-4 border-t border-primary/5" />
        <ul className="space-y-1 p-5 text-sm">
          {headings.map((heading) => {
            return (
              <li
                key={heading.id}
                className={cn(
                  "transition-all duration-300",
                  heading.level === 3
                    ? "ml-4 border-l-2 border-muted-foreground/15 pl-4"
                    : "",
                )}
              >
                <a
                  href={`#${heading.id}`}
                  onClick={(event) => handleHeadingClick(event, heading.id)}
                  className="group -mx-2 flex items-center gap-3 rounded-md px-2 py-2 text-muted-foreground transition-all duration-200 hover:bg-muted/30 hover:text-foreground hover:translate-x-1"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30 transition-all duration-200 group-hover:bg-primary/60" />
                  <span className="line-clamp-1">{heading.text}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
