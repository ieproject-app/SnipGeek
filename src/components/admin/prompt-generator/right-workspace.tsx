import { usePrompt } from "./index";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Copy, Map, Layers, PenLine, AlignLeft, BookOpen, Type, FileText, Zap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function RightWorkspace() {
  const { mode } = usePrompt();

  return (
    <div className="flex flex-col gap-6">
      <DraftContentCard />
      {mode === "modify" && <ModInstructionsCard />}
    </div>
  );
}

function DraftContentCard() {
  const {
    mode, contentType, dictionary, counters,
    originalContent, setOriginalContent, draft, setDraft,
    handleOriginalSelection, originalContentRef, selectedArticle, isOriginalLoading,
    blockComposerRef, selectedBlockLine, selectedBlock, setSelectedBlock,
    selectedBlockRows, selectedBlockComment, setSelectedBlockComment, addSelectedBlockToInstructions
  } = usePrompt();

  const focusRing = "focus-visible:ring-primary/20 focus-visible:ring-offset-0 focus-visible:border-primary/30 transition-all duration-300";

  return (
    <ScrollReveal direction="up" delay={mode === "modify" ? 0.2 : 0.1} className="flex-1 flex flex-col">
      <Card className={cn("flex flex-1 flex-col overflow-hidden rounded-xl border-l-4 border-primary/10 bg-card/50 shadow-lg transition-all duration-300", mode === "modify" ? "border-l-sky-400" : "border-l-primary")}>
        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/5 px-5 py-3">
          <div className="flex items-center gap-2">
            {mode === "modify" ? <Layers className="h-3.5 w-3.5 shrink-0 text-sky-500" /> : <PenLine className="h-3.5 w-3.5 shrink-0 text-primary" />}
            <CardTitle className="text-[10px] font-black uppercase tracking-widest">
              {mode === "modify" ? dictionary.originalContentTitle : contentType === "series" ? "Series Key Points" : contentType === "news" ? "News Notes / Extra Points" : contentType === "tips" ? "Tips Key Points" : "Notes Key Points / Findings"}
            </CardTitle>
          </div>
          <div className="flex items-center gap-3 text-[9px] font-bold uppercase text-muted-foreground">
            <span className="flex items-center gap-1"><AlignLeft className="h-3 w-3" /> {counters.lines}L</span>
            <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {counters.words}W</span>
            <span className="flex items-center gap-1 opacity-50"><Type className="h-3 w-3" /> {counters.chars}C</span>
          </div>
        </CardHeader>
        
        <Textarea
          ref={originalContentRef}
          value={mode === "modify" ? originalContent : draft}
          onChange={(e) => mode === "modify" ? setOriginalContent(e.target.value) : setDraft(e.target.value)}
          onSelect={handleOriginalSelection}
          placeholder={mode === "modify" ? dictionary.originalContentPlaceholder : "Write your draft or paste points here..."}
          className="min-h-120 w-full resize-y rounded-none border-none bg-transparent p-6 font-mono text-xs leading-relaxed focus-visible:ring-0"
        />

        <div className="flex items-center gap-2 border-t bg-muted/5 px-5 py-2">
          <span className="font-mono text-[9px] text-muted-foreground/40">
            {mode === "modify" ? "Paste the existing MDX content above" : "Write your draft in MDX or plain text above"}
          </span>
          {mode === "modify" && selectedArticle && (
            <span className="ml-auto font-mono text-[9px] text-muted-foreground/55">
              {isOriginalLoading ? `Loading ${selectedArticle.slug}...` : `Loaded ${selectedArticle.slug}`}
            </span>
          )}
        </div>

        {mode === "modify" && (
          <div ref={blockComposerRef} className="border-t border-primary/10 bg-sky-500/[0.06] px-5 py-4">
             <div className="flex items-center justify-between gap-2">
               <p className="text-[9px] font-black uppercase tracking-[0.12em] text-sky-600 dark:text-sky-400">
                 Block Comment Composer
               </p>
               {selectedBlockLine !== null && (
                 <span className="rounded-full border border-sky-500/30 bg-background/80 px-2.5 py-1 text-[8px] font-black uppercase tracking-wider text-sky-700 dark:text-sky-300">
                   Line {selectedBlockLine}
                 </span>
               )}
             </div>
             <p className="mt-2 text-[10px] text-muted-foreground">
               Select (highlight) a block from the original content above, write the intended change, then insert it into modification instructions.
             </p>
             <div className="mt-3 space-y-2">
                <Textarea
                  rows={selectedBlockRows}
                  value={selectedBlock}
                  onChange={(e) => setSelectedBlock(e.target.value)}
                  placeholder="Selected block preview will appear here"
                  className="bg-background/60 font-mono text-[11px]"
                />
                <Textarea
                  value={selectedBlockComment}
                  onChange={(e) => setSelectedBlockComment(e.target.value)}
                  placeholder="Comment the exact change you want for this selected block"
                  className="min-h-16 bg-background/60 text-[11px]"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={addSelectedBlockToInstructions}
                    disabled={!selectedBlock.trim()}
                    className="rounded-md border border-sky-500/35 bg-sky-500/10 px-4 py-2 text-[9px] font-black uppercase tracking-wider text-sky-700 transition-colors hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:text-sky-300"
                  >
                    Insert To Instructions
                  </button>
                </div>
             </div>
          </div>
        )}
      </Card>
    </ScrollReveal>
  );
}

function ModInstructionsCard() {
  const {
    dictionary, modInstructions, setModInstructions, 
    applyQuickAction, getQuickActionLabel, modInstructionsRef
  } = usePrompt();

  const focusRing = "focus-visible:ring-primary/20 focus-visible:ring-offset-0 focus-visible:border-primary/30 transition-all duration-300";

  return (
    <ScrollReveal direction="left" delay={0.3}>
      <Card className="rounded-xl border-l-4 border-l-accent border-primary/10 bg-card/50 shadow-md">
        <CardHeader className="flex flex-row items-center gap-2 border-b bg-muted/5 px-5 py-3">
          <Zap className="h-3.5 w-3.5 shrink-0 text-accent" />
          <CardTitle className="text-[10px] font-black uppercase tracking-widest">
            {dictionary.modInstructionsTitle || "Modification Instructions"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
           <div className="flex flex-wrap gap-1.5">
             {(["readability", "narrative", "images", "metadata", "polish"] as const).map((action) => (
                <button
                  key={action}
                  onClick={() => applyQuickAction(action)}
                  className={cn(
                    "flex h-7 items-center gap-1.5 rounded-full px-3 text-[9px] font-black uppercase tracking-wide transition-all",
                    action === "readability" ? "border border-sky-500/20 bg-sky-500/10 text-sky-500 hover:bg-sky-500/20" :
                    action === "polish" ? "border border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-500 hover:bg-fuchsia-500/20" :
                    action === "images" ? "border border-violet-500/20 bg-violet-500/10 text-violet-500 hover:bg-violet-500/20" :
                    "border border-accent/20 bg-accent/10 text-accent hover:bg-accent/20"
                  )}
                >
                  <Sparkles className="h-3 w-3" /> {getQuickActionLabel(action)}
                </button>
             ))}
           </div>
           <Textarea
             ref={modInstructionsRef as React.Ref<HTMLTextAreaElement>}
             placeholder={dictionary.modInstructionsPlaceholder || "Write specific changes to implement..."}
             value={modInstructions}
             onChange={(e) => setModInstructions(e.target.value)}
             className={cn("min-h-32 rounded-lg bg-background/30 p-4 font-mono text-xs", focusRing)}
           />
        </CardContent>
      </Card>
    </ScrollReveal>
  );
}
