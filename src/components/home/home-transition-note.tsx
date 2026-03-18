"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

interface HomeTransitionNoteProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  ctaText?: string;
  ctaHref?: string;
}

export function HomeTransitionNote({
  eyebrow,
  title,
  subtitle,
  description,
  ctaText,
  ctaHref,
}: HomeTransitionNoteProps) {
  return (
    <section className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-14 overflow-hidden">
      <ScrollReveal direction="up">
        <div className="mb-4 text-left">
          <p className="font-sans text-[10px] font-black uppercase tracking-[0.16em] text-accent/85 mb-2">
            {eyebrow}
          </p>
          <h3 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-primary mb-1.5">
            {title}
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground">
            {subtitle}
          </p>
          <div className="mt-4 h-0.5 w-14 bg-[linear-gradient(to_right,#0078D4,#E95420)]" />
        </div>

        <div className="rounded-lg border border-dashed border-primary/30 bg-card/60 px-5 py-4 sm:px-6 sm:py-5 shadow-[0_10px_28px_-22px_rgba(0,0,0,0.7)]">
          <p className="text-sm sm:text-base leading-relaxed text-foreground/85">
            {description}
          </p>

          {ctaText && ctaHref && (
            <div className="mt-3">
              <Link
                href={ctaHref}
                className="group inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-accent transition-colors"
              >
                <span>{ctaText}</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          )}
        </div>
      </ScrollReveal>
    </section>
  );
}