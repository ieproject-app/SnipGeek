"use client";

import NextLink from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getBadgeStyle } from "@/components/layout/category-badge";
import type { Dictionary } from "@/lib/get-dictionary";

type SearchableItem = {
  slug: string;
  title: string;
  description: string;
  type: "blog" | "note";
  href: string;
  heroImage?: string;
  category?: string;
  tags?: string[];
};

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const HighlightMatch = ({ text, query }: { text: string; query: string }) => {
  if (!text || typeof text !== "string" || !query.trim()) {
    return <>{text || ""}</>;
  }

  const escapedQuery = escapeRegExp(query.trim());
  let parts: string[] = [text];

  try {
    parts = text.split(new RegExp(`(${escapedQuery})`, "gi"));
  } catch {
    return <>{text}</>;
  }

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase().trim() ? (
          <mark
            key={i}
            className="bg-accent/30 text-accent-foreground rounded-xs px-0.5 font-bold"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
};

export function LayoutHeaderSearchPanel({
  isSearchOpen,
  query,
  results,
  quickPicks,
  activeIndex,
  mounted,
  timeLabel,
  dictionary,
  onClose,
  onSetQuery,
}: {
  isSearchOpen: boolean;
  query: string;
  results: SearchableItem[];
  quickPicks: SearchableItem[];
  activeIndex: number;
  mounted: boolean;
  timeLabel: string;
  dictionary: Dictionary;
  onClose: () => void;
  onSetQuery: (query: string) => void;
}) {
  return (
    <div
      className={cn(
        "absolute top-0 left-4 right-4 md:left-6 md:right-6 z-30 bg-background border border-border shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]",
        isSearchOpen
          ? "opacity-100 scale-100 translate-y-2"
          : "opacity-0 scale-[0.97] -translate-y-1 pointer-events-none",
      )}
    >
      <ScrollArea className="max-h-112.5">
        <div className="p-2">
          {query.length > 1 ? (
            <>
              <div className="font-sans text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 px-4 py-2 border-b border-border bg-background/60">
                {results.length} {dictionary.search.resultsFound} for &quot;
                {query}&quot;
              </div>
              {results.length > 0 ? (
                <ul className="space-y-1 pt-1">
                  {results.map((item, idx) => (
                    <li key={`${item.type}-${item.slug}`}>
                      <NextLink
                        href={item.href}
                        data-result-index={idx}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                          activeIndex === idx
                            ? "bg-accent/15 ring-1 ring-accent/20"
                            : "hover:bg-accent/10",
                        )}
                        onClick={onClose}
                      >
                        <div className="w-13 h-9.75 rounded-md bg-muted shrink-0 border border-border/50 flex items-center justify-center">
                          <Search className="h-3.5 w-3.5 text-muted-foreground/35" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-sans text-sm font-bold text-foreground line-clamp-2 group-hover:text-accent transition-colors leading-tight">
                            <HighlightMatch text={item.title} query={query} />
                          </h4>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-accent transition-all group-hover:translate-x-1" />
                      </NextLink>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-16 text-center flex flex-col items-center gap-3">
                  <div className="p-4 bg-muted/30 rounded-2xl">
                    <Search className="h-8 w-8 opacity-10 text-muted-foreground" />
                  </div>
                  <p className="font-sans italic text-xs text-muted-foreground">
                    {dictionary.search.noResults} &quot;{query}&quot;
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="p-0 space-y-4 pb-4">
              <div className="space-y-1">
                <p className="font-sans text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 px-4 pt-3 pb-2">
                  {mounted ? timeLabel : ""}
                </p>
                <div className="px-2 space-y-1">
                  {quickPicks.map((item, idx) => (
                    <NextLink
                      key={item.slug}
                      href={item.href}
                      data-result-index={idx}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                        activeIndex === idx
                          ? "bg-accent/15 ring-1 ring-accent/20"
                          : "hover:bg-accent/10",
                      )}
                      onClick={onClose}
                    >
                      <div className="w-13 h-9.75 rounded-md bg-muted shrink-0 border border-border/50 flex items-center justify-center">
                        <Search className="h-3.5 w-3.5 text-muted-foreground/35" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-sans text-sm font-bold text-foreground line-clamp-2 group-hover:text-accent transition-colors leading-tight">
                          {item.title}
                        </h4>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/20 group-hover:text-accent transition-all group-hover:translate-x-1" />
                    </NextLink>
                  ))}
                </div>
              </div>
              <div className="px-4">
                <p className="font-sans text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/40 mb-3">
                  {dictionary.search.prompt}
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Windows", "Android", "Hardware", "Tutorial", "Tips"].map((cat) => {
                    const style = getBadgeStyle(cat);
                    return (
                      <button
                        key={cat}
                        className={cn(
                          "px-3 py-1.5 rounded-full border font-sans text-[9px] font-black uppercase tracking-wider transition-all",
                          "hover:scale-105 active:scale-95",
                          style.border,
                          style.text,
                          style.bg,
                          "hover:opacity-80",
                        )}
                        onClick={() => onSetQuery(cat)}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="px-4 py-2 border-t border-border bg-background/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded border bg-background font-sans text-[8px] font-bold shadow-sm">
              ESC
            </kbd>
            <span className="font-sans text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">
              to close
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded border bg-background font-sans text-[8px] font-bold shadow-sm">
              ↑↓
            </kbd>
            <span className="font-sans text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">
              to navigate
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
