"use client";

import Link from "next/link";
import { Hash, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArticleTopicsProps {
  tags: string[];
  linkPrefix: string;
  title?: string;
  description?: string;
  className?: string;
}

export function ArticleTopics({
  tags,
  linkPrefix,
  title = "Topics in this article",
  description = "Explore related topics and continue reading similar content.",
  className,
}: ArticleTopicsProps) {
  if (!tags || tags.length === 0) return null;

  return (
    <section
      aria-labelledby="article-topics-title"
      className={cn(
        "mt-12 rounded-2xl border border-primary/10 bg-card/50 p-5 shadow-sm sm:p-6",
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            <Hash className="h-3.5 w-3.5" />
            Topics
          </div>

          <h2
            id="article-topics-title"
            className="text-xl font-bold tracking-tight text-primary sm:text-2xl"
          >
            {title}
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
            {description}
          </p>
        </div>

        <div className="hidden items-center gap-2 rounded-full border border-primary/10 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground sm:inline-flex">
          <span>{tags.length}</span>
          <span>{tags.length === 1 ? "topic" : "topics"}</span>
          <ArrowRight className="h-3.5 w-3.5 text-primary" />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2.5">
        {tags.map((tag) => (
          <Link
            key={tag}
            href={`${linkPrefix}/tags/${encodeURIComponent(tag.toLowerCase())}`}
            className={cn(
              "group inline-flex items-center gap-2 rounded-full border border-primary/10 bg-background px-3.5 py-2",
              "text-sm font-semibold text-foreground/80 transition-all duration-200",
              "hover:-translate-y-0.5 hover:border-primary/25 hover:bg-primary/5 hover:text-primary hover:shadow-sm",
            )}
          >
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-primary/60 transition-colors duration-200 group-hover:bg-primary" />
            <span>{tag}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
