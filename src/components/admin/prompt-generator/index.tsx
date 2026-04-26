"use client";

import { createContext, useContext, useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, FileText, Layers, PenLine, Sparkles } from "lucide-react";
import { usePromptLogic } from "./use-prompt-logic";
import type { ToolPromptsProps } from "./use-prompt-logic";
import { cn } from "@/lib/utils";
import { IslandToolbar, StickyBottomBar } from "./island-toolbar";
import { LeftConfig } from "./left-config";
import { RightWorkspace } from "./right-workspace";

export type PromptStore = ReturnType<typeof usePromptLogic>;

type PromptBuilderProps = ToolPromptsProps & {
  adminRouteBase?: string;
  locales?: readonly string[];
};

export const PromptContext = createContext<PromptStore | null>(null);

export function usePrompt() {
  const ctx = useContext(PromptContext);
  if (!ctx) throw new Error("Missing PromptProvider. Component must be wrapped in it.");
  return ctx;
}

export function PromptBuilder(props: PromptBuilderProps) {
  const store = usePromptLogic(props);
  const toolMeta = props.fullDictionary.tools?.tool_list?.prompt_generator
    ?? props.fullDictionary.tools?.tool_list?.ai_prompt_generator
    ?? { title: props.dictionary.title, description: props.dictionary.description };

  return (
    <PromptContext.Provider value={store}>
      <div className="min-h-screen bg-background">
        <PromptBuilderAdminHeader
          title={toolMeta.title}
          description={toolMeta.description}
          locale={props.locale}
          locales={props.locales}
          adminRouteBase={props.adminRouteBase}
          existingArticles={props.existingArticles}
        />

        <div className="mx-auto w-full max-w-[1540px] space-y-4 px-4 py-5 pb-32 md:px-6 lg:px-8">
          <PromptBuilderControlStrip />

          <div className="sticky top-18 z-40">
            <div className="border border-border bg-card p-2">
              <IslandToolbar />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(360px,420px)_minmax(0,1fr)] xl:gap-6">
            <PromptBuilderRail
              eyebrow="Source rail"
              title="Source & configuration"
              description="Pick workflow context, switch article source, and tune metadata plus mappings before generating the final prompt."
            >
              <LeftConfig />
            </PromptBuilderRail>

            <PromptBuilderRail
              eyebrow="Draft rail"
              title="Drafting & revision workspace"
              description="Write the source brief, inspect original content, and shape final modification instructions in one focused workspace."
            >
              <RightWorkspace />
            </PromptBuilderRail>
          </div>
        </div>

        <StickyBottomBar />
      </div>
    </PromptContext.Provider>
  );
}

function PromptBuilderAdminHeader({
  title,
  description,
  locale,
  locales,
  adminRouteBase,
  existingArticles,
}: {
  title: string;
  description: string;
  locale: string;
  locales?: readonly string[];
  adminRouteBase?: string;
  existingArticles: ToolPromptsProps["existingArticles"];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const localeOptions = locales && locales.length > 0 ? [...locales] : ["en", "id"];

  const stats = useMemo(() => {
    const drafts = existingArticles.filter((article) => !article.published).length;
    const published = existingArticles.length - drafts;
    return { total: existingArticles.length, drafts, published };
  }, [existingArticles]);

  const handleLocaleChange = (nextLocale: string) => {
    if (nextLocale === locale) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("locale", nextLocale);
    const basePath = adminRouteBase || pathname || "/admin/prompt-generator";
    startTransition(() => {
      router.push(`${basePath}?${params.toString()}`);
    });
  };

  return (
    <header className="border-b border-border bg-background px-4 py-5 md:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1540px] flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
            Editorial · Prompt Generator
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-[-0.03em]">
            {title}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats.total} entries · {stats.published} published · {stats.drafts} drafts · {description}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {localeOptions.map((localeOption) => (
            <button
              key={localeOption}
              type="button"
              disabled={isPending}
              onClick={() => handleLocaleChange(localeOption)}
              className={cn(
                "inline-flex h-8 min-w-[3rem] items-center justify-center border px-3 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors",
                localeOption === locale
                  ? "border-accent bg-accent/10 text-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                isPending && "cursor-wait opacity-70",
              )}
            >
              {localeOption}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

function PromptBuilderControlStrip() {
  const {
    mode,
    contentType,
    promptStats,
    hasBlockingIssues,
    hasUnresolvedMarkers,
    unresolvedMarkers,
    blockingValidationIssues,
    selectedArticle,
  } = usePrompt();

  const validationCount = blockingValidationIssues.length + unresolvedMarkers.length;

  return (
    <div className="grid gap-2 lg:grid-cols-4">
      <div className="border border-border bg-card px-3.5 py-2.5">
        <div className="flex items-center gap-2 text-muted-foreground">
          {mode === "modify" ? <Layers className="h-3.5 w-3.5 text-sky-500" /> : <PenLine className="h-3.5 w-3.5 text-primary" />}
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.24em]">
            Active mode
          </p>
        </div>
        <p className="mt-1.5 text-sm font-bold uppercase tracking-[0.14em] text-foreground">
          {mode}
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          {mode === "modify" ? "Revision flow enabled." : "Draft-first composition."}
        </p>
      </div>

      <div className="border border-border bg-card px-3.5 py-2.5">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.24em]">
            Content track
          </p>
        </div>
        <p className="mt-1.5 text-sm font-bold uppercase tracking-[0.14em] text-foreground">
          {contentType}
        </p>
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
          {selectedArticle ? `Selected source: ${selectedArticle.slug}` : "No source article pinned yet."}
        </p>
      </div>

      <div className="border border-border bg-card px-3.5 py-2.5">
        <div className="flex items-center gap-2 text-muted-foreground">
          <FileText className="h-3.5 w-3.5 text-primary" />
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.24em]">
            Prompt output
          </p>
        </div>
        <p className="mt-1.5 text-sm font-bold uppercase tracking-[0.14em] text-foreground">
          {promptStats.words} words · {promptStats.chars} chars
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          Review before copying.
        </p>
      </div>

      <div className={cn(
        "border px-3.5 py-2.5",
        hasBlockingIssues ? "border-destructive bg-destructive/5" : "border-emerald-500/40 bg-emerald-500/5",
      )}>
        <div className="flex items-center gap-2 text-muted-foreground">
          {hasBlockingIssues ? <AlertTriangle className="h-3.5 w-3.5 text-destructive" /> : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.24em]">
            Validation state
          </p>
        </div>
        <p className="mt-1.5 text-sm font-bold uppercase tracking-[0.14em] text-foreground">
          {hasBlockingIssues ? `${validationCount} issue${validationCount === 1 ? "" : "s"} to review` : "Ready to copy"}
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          {hasBlockingIssues
            ? hasUnresolvedMarkers
              ? `Resolve ${unresolvedMarkers.length} marker${unresolvedMarkers.length === 1 ? "" : "s"} before export.`
              : "Blocking validation needs attention."
            : "No blocking markers detected."}
        </p>
      </div>
    </div>
  );
}

function PromptBuilderRail({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-border bg-card">
      <div className="border-b border-border bg-muted/30 px-4 py-3">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.26em] text-muted-foreground">
          {eyebrow}
        </p>
        <h2 className="mt-1 font-display text-base font-bold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="p-4 md:p-5">
        {children}
      </div>
    </section>
  );
}

export default PromptBuilder;
