"use client";

import Link from "next/link";
import { Hash, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryBadge } from "@/components/layout/category-badge";

interface ArticleTagsProps {
  tags: string[];
  linkPrefix: string;
  title?: string;
  description?: string;
  className?: string;
}

export function ArticleTags({
  tags,
  linkPrefix,
  title = "Topics in this article",
  description = "Explore related topics and continue reading similar content.",
  className,
}: ArticleTagsProps) {
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

        <Link
          href={`${linkPrefix}/tags`}
          className="hidden items-center gap-2 rounded-full border border-primary/10 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:text-primary sm:inline-flex"
        >
          <span>{tags.length}</span>
          <span>{tags.length === 1 ? "topic" : "topics"}</span>
          <ArrowRight className="h-3.5 w-3.5 text-primary" />
        </Link>
      </div>

      <div className="mt-5 border-t border-primary/10 pt-4 sm:pt-5">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            return (
              <Link
                key={tag}
                href={`${linkPrefix}/tags/${encodeURIComponent(tag.toLowerCase())}`}
                className="group inline-flex"
              >
                <CategoryBadge
                  label={tag}
                  size="xs"
                  className={cn(
                    "transition-all duration-200",
                    "group-hover:-translate-y-0.5 group-hover:shadow-sm group-hover:border-primary/25",
                  )}
                />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
