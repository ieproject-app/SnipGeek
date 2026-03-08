import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeShiki from "@shikijs/rehype";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { mdxComponents } from "@/components/mdx-components";
import { cn } from "@/lib/utils";
import {
  Shield,
  FileText,
  Mail,
  ScrollText,
  BadgeInfo,
  type LucideIcon,
} from "lucide-react";

type StaticPageTemplateProps = {
  title: string;
  description?: string;
  lastUpdated?: string;
  content: string;
  badgeLabel?: string;
  icon?: LucideIcon;
  maxWidthClassName?: string;
  contentClassName?: string;
  footerNote?: string;
};

const iconMap: Record<string, LucideIcon> = {
  shield: Shield,
  filetext: FileText,
  mail: Mail,
  scrolltext: ScrollText,
  badgeinfo: BadgeInfo,
};

export function resolveStaticPageIcon(icon?: string | LucideIcon): LucideIcon {
  if (!icon) return FileText;
  if (typeof icon !== "string") return icon;

  const normalized = icon.replace(/[\s_-]/g, "").toLowerCase();
  return iconMap[normalized] || FileText;
}

export function StaticPageTemplate({
  title,
  description,
  lastUpdated,
  content,
  badgeLabel = "Official Document",
  icon: Icon = FileText,
  maxWidthClassName = "max-w-3xl",
  contentClassName,
  footerNote,
}: StaticPageTemplateProps) {
  return (
    <div className="w-full">
      <main
        className={cn(
          "mx-auto px-4 pt-12 pb-24 sm:px-6 lg:px-8",
          maxWidthClassName,
        )}
      >
        <ScrollReveal direction="down" delay={0.05}>
          <header className="mb-14 space-y-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-accent">
              <Icon className="h-3.5 w-3.5" />
              {badgeLabel}
            </div>

            <h1
              className="font-display font-black tracking-tighter text-primary"
              style={{
                fontSize: "clamp(2rem, 1.75rem + 1.25vw, 3rem)",
                lineHeight: "1.1",
                letterSpacing: "-0.03em",
              }}
            >
              {title}
            </h1>

            {description ? (
              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
                {description}
              </p>
            ) : null}

            {lastUpdated ? (
              <p className="text-sm font-mono text-muted-foreground/60">
                Last updated: <time dateTime={lastUpdated}>{lastUpdated}</time>
              </p>
            ) : null}
          </header>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={0.1}>
          <article
            className={cn(
              "rounded-2xl border border-primary/10 bg-card/40 p-6 shadow-sm backdrop-blur-sm sm:p-8",
              contentClassName,
            )}
          >
            <div className="prose-content text-lg text-foreground/80">
              <MDXRemote
                source={content}
                components={mdxComponents}
                options={{
                  mdxOptions: {
                    remarkPlugins: [remarkGfm],
                    rehypePlugins: [[rehypeShiki, { theme: "github-dark" }]],
                  },
                }}
              />
            </div>
          </article>
        </ScrollReveal>

        {footerNote ? (
          <ScrollReveal direction="up" delay={0.15}>
            <div className="mt-10 rounded-xl border border-accent/20 bg-accent/5 p-5 text-center">
              <p className="text-sm text-muted-foreground">{footerNote}</p>
            </div>
          </ScrollReveal>
        ) : null}
      </main>
    </div>
  );
}
