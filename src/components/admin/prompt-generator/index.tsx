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
      <div className="mx-auto w-full max-w-[1540px] space-y-4 pb-32">
        <PromptBuilderAdminHeader
          title={toolMeta.title}
          description={toolMeta.description}
        />

        <PromptBuilderAdminBar
          locale={props.locale}
          locales={props.locales}
          adminRouteBase={props.adminRouteBase}
          existingArticles={props.existingArticles}
        />

        <div className="mb-2 w-full">
          <PromptBuilderControlStrip />
        </div>

        <div className="sticky top-18 z-40 mb-4 w-full">
          <div className="rounded-3xl border border-border/70 bg-background/90 p-2.5 shadow-sm backdrop-blur-xl">
            <div className="rounded-2xl border border-border/60 bg-card/50 px-2.5 py-2.5">
              <IslandToolbar />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(360px,420px)_minmax(0,1fr)] xl:gap-8">
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

        <StickyBottomBar />
      </div>
    </PromptContext.Provider>
  );
}

function PromptBuilderAdminHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-3xl border border-border/70 bg-card/35 p-4 shadow-sm backdrop-blur-sm md:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
            — Admin workspace
          </p>
          <h1 className="mt-1.5 font-display text-2xl font-black tracking-[-0.03em] text-foreground md:text-3xl">
            {title}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <span className="inline-flex items-center rounded-full border border-border/70 bg-background/75 px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-foreground">
            Admin only
          </span>
          <span className="inline-flex items-center rounded-full border border-border/70 bg-background/75 px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-foreground">
            Create + modify
          </span>
        </div>
      </div>
    </section>
  );
}

function PromptBuilderAdminBar({
  locale,
  locales,
  adminRouteBase,
  existingArticles,
}: {
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
    const blogs = existingArticles.filter((article) => article.type === "blog").length;
    const notes = existingArticles.filter((article) => article.type === "note").length;

    return {
      total: existingArticles.length,
      drafts,
      published,
      blogs,
      notes,
    };
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
    <div className="rounded-3xl border border-border/70 bg-card/40 p-3.5 shadow-sm backdrop-blur-sm md:p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-2 xl:max-w-4xl">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
            — Editorial operations
          </p>
          <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
            <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1.5 font-mono font-bold uppercase tracking-[0.18em] text-foreground">
              {locale.toUpperCase()} active
            </span>
            <span className="rounded-full border border-border/70 bg-background/60 px-3 py-1.5 font-mono font-bold uppercase tracking-[0.18em]">
              {stats.total} entries loaded
            </span>
            <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 font-mono font-bold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
              {stats.drafts} drafts queued
            </span>
            <span className="rounded-full border border-border/70 bg-background/60 px-3 py-1.5 font-mono font-bold uppercase tracking-[0.18em]">
              {stats.published} published ready
            </span>
            <span className="rounded-full border border-border/70 bg-background/60 px-3 py-1.5 font-mono font-bold uppercase tracking-[0.18em]">
              {stats.blogs} blogs · {stats.notes} notes
            </span>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Use this admin workspace to prepare new briefs, inspect existing articles, and push revision-ready prompts without leaving the editorial shell.
          </p>
        </div>

        <div className="space-y-1.5 xl:min-w-[250px] xl:max-w-[280px]">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-muted-foreground xl:text-right">
            — Content locale
          </p>
          <div className="flex flex-wrap gap-2 xl:justify-end">
            {localeOptions.map((localeOption) => (
              <button
                key={localeOption}
                type="button"
                disabled={isPending}
                onClick={() => handleLocaleChange(localeOption)}
                className={cn(
                  "inline-flex min-w-[76px] items-center justify-center rounded-2xl border px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.22em] transition-all",
                  localeOption === locale
                    ? "border-accent/45 bg-accent/10 text-foreground shadow-sm"
                    : "border-border/70 bg-background/75 text-muted-foreground hover:border-border hover:bg-background hover:text-foreground",
                  isPending && "cursor-wait opacity-70",
                )}
              >
                {localeOption}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground xl:text-right">
            Switching locale refreshes dictionary copy, draft inventory, and original-content lookup for this workspace.
          </p>
        </div>
      </div>
    </div>
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
      <div className="rounded-2xl border border-border/70 bg-card/55 px-3.5 py-2.5 shadow-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          {mode === "modify" ? <Layers className="h-3.5 w-3.5 text-sky-500" /> : <PenLine className="h-3.5 w-3.5 text-primary" />}
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.24em]">
            Active mode
          </p>
        </div>
        <p className="mt-1.5 text-sm font-black uppercase tracking-[0.14em] text-foreground">
          {mode}
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          {mode === "modify" ? "Revision flow enabled." : "Draft-first composition."}
        </p>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card/55 px-3.5 py-2.5 shadow-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.24em]">
            Content track
          </p>
        </div>
        <p className="mt-1.5 text-sm font-black uppercase tracking-[0.14em] text-foreground">
          {contentType}
        </p>
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
          {selectedArticle ? `Selected source: ${selectedArticle.slug}` : "No source article pinned yet."}
        </p>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card/55 px-3.5 py-2.5 shadow-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <FileText className="h-3.5 w-3.5 text-primary" />
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.24em]">
            Prompt output
          </p>
        </div>
        <p className="mt-1.5 text-sm font-black uppercase tracking-[0.14em] text-foreground">
          {promptStats.words} words · {promptStats.chars} chars
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          Review before copying.
        </p>
      </div>

      <div className={cn(
        "rounded-2xl border px-3.5 py-2.5 shadow-sm",
        hasBlockingIssues ? "border-destructive/30 bg-destructive/5" : "border-emerald-500/20 bg-emerald-500/5",
      )}>
        <div className="flex items-center gap-2 text-muted-foreground">
          {hasBlockingIssues ? <AlertTriangle className="h-3.5 w-3.5 text-destructive" /> : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.24em]">
            Validation state
          </p>
        </div>
        <p className="mt-1.5 text-sm font-black uppercase tracking-[0.14em] text-foreground">
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
    <section className="rounded-3xl border border-border/70 bg-card/25 p-4 shadow-sm backdrop-blur-sm md:p-5">
      <div className="border-b border-border/60 pb-4">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.26em] text-muted-foreground">
          — {eyebrow}
        </p>
        <h2 className="mt-2 font-display text-xl font-black tracking-tight text-foreground">
          {title}
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="mt-5">
        {children}
      </div>
    </section>
  );
}

export default PromptBuilder;
