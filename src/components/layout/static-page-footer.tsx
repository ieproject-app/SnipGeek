import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { cn } from "@/lib/utils";

export type StaticPageFooterCta = {
  label: string;
  href: string;
  external?: boolean;
};

export type StaticPageFooterCardProps = {
  note?: string;
  ctas?: StaticPageFooterCta[];
  className?: string;
};

/**
 * Closing card used at the bottom of every static page so the family
 * shares a consistent end-of-document affordance: a soft accent panel
 * with optional copy and one or two action links.
 */
export function StaticPageFooterCard({
  note,
  ctas,
  className,
}: StaticPageFooterCardProps) {
  if (!note && (!ctas || ctas.length === 0)) return null;

  return (
    <ScrollReveal direction="up" delay={0.15}>
      <div
        className={cn(
          "mt-12 rounded-2xl border border-accent/20 bg-accent/5 p-6 text-center",
          className,
        )}
      >
        {note ? (
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {note}
          </p>
        ) : null}

        {ctas && ctas.length > 0 ? (
          <div
            className={cn(
              "flex flex-wrap items-center justify-center gap-3",
              note ? "mt-5" : "",
            )}
          >
            {ctas.map((cta) => {
              const className =
                "group inline-flex items-center gap-2 rounded-xl border border-primary/15 bg-background/60 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:border-primary/35 hover:bg-primary/5";
              const inner = (
                <>
                  <span>{cta.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </>
              );

              if (cta.external) {
                return (
                  <a
                    key={cta.href}
                    href={cta.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={className}
                  >
                    {inner}
                  </a>
                );
              }

              return (
                <Link key={cta.href} href={cta.href} className={className}>
                  {inner}
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
    </ScrollReveal>
  );
}
