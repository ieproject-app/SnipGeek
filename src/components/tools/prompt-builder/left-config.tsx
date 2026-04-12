import { useState } from "react";
import { usePrompt } from "./index";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { DownloadIdPicker, getDraftAgeDays, parseNaturalDate, type ArticleSummary } from "./use-prompt-logic";
import { Search, FileText, Sparkles, Plus, Trash2, Copy, Settings2, ImageIcon, Download, Grid3X3, GalleryHorizontal, Import } from "lucide-react";
import { cn } from "@/lib/utils";

export function LeftConfig() {
  const { mode } = usePrompt();
  
  return (
    <div className="flex flex-col gap-6">
      {mode === "modify" && <ArticleSelectorCard />}
      {mode === "create" && <WorkflowContextCard />}
      <TechnicalTabsCard />
    </div>
  );
}

function ArticleSelectorCard() {
  const {
    contentType, articleStats, statusFilter, setStatusFilter,
    urgentDrafts, staleDraftCount,
    articleSearch, setArticleSearch, filteredArticles,
    selectedSlug, setSelectedSlug, selectedArticle, dictionary
  } = usePrompt();

  const focusRing = "focus-visible:ring-primary/20 focus-visible:ring-offset-0 focus-visible:border-primary/30 transition-all duration-300";

  return (
    <ScrollReveal direction="up" delay={0.1}>
      <Card className="overflow-hidden rounded-xl border-l-4 border-l-amber-400 border-primary/10 bg-card/50 shadow-sm">
        <CardHeader className="flex flex-row items-center gap-2 border-b bg-muted/5 px-5 py-3">
          <Search className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          <CardTitle className="text-[10px] font-black uppercase tracking-widest">
            {dictionary.selectArticleLabel}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-primary/10 bg-background/40 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-muted-foreground">
              {contentType} · {articleStats.total}
            </span>
            <button
              onClick={() => setStatusFilter("all")}
              className={cn("rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-wider transition-colors", statusFilter === "all" ? "bg-primary text-primary-foreground" : "bg-primary/5 text-muted-foreground hover:bg-primary/10 hover:text-primary")}
            >
              All {articleStats.total}
            </button>
            <button
              onClick={() => setStatusFilter("published")}
              className={cn("rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-wider transition-colors", statusFilter === "published" ? "bg-emerald-500 text-white" : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400")}
            >
              Live {articleStats.published}
            </button>
            <button
              onClick={() => setStatusFilter("draft")}
              className={cn("rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-wider transition-colors", statusFilter === "draft" ? "bg-amber-500 text-white" : "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400")}
            >
              Draft {articleStats.draft}
            </button>
          </div>
          
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-amber-600 dark:text-amber-400">
                Draft Queue ({contentType})
              </p>
              <button
                type="button"
                onClick={() => setStatusFilter("draft")}
                className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-wider text-amber-700 transition-colors hover:bg-amber-500/20 dark:text-amber-300"
              >
                Show Draft Only
              </button>
            </div>

            {articleStats.draft > 0 ? (
              <>
                <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                  Total {articleStats.draft} draft · {staleDraftCount} stale (&ge;30d)
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {urgentDrafts.map((article: ArticleSummary) => {
                    const ageDays = getDraftAgeDays(article.date);
                    const isStale = ageDays !== null && ageDays >= 30;

                    return (
                      <button
                        key={article.slug}
                        type="button"
                        onClick={() => setSelectedSlug(article.slug)}
                        className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-wide transition-colors", isStale ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-amber-500/25 bg-amber-500/8 text-amber-700 dark:text-amber-300")}
                      >
                        <span className="max-w-30 truncate">{article.slug}</span>
                        <span className="opacity-75">{parseNaturalDate(article.date)}</span>
                        {ageDays !== null && <span>· {ageDays}d</span>}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                No draft in this content type. Queue is clear.
              </p>
            )}
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={dictionary.searchArticlePlaceholder}
              value={articleSearch}
              onChange={(e) => setArticleSearch(e.target.value)}
              className={cn("h-10 rounded-lg bg-background/50 pl-9 text-xs", focusRing)}
            />
          </div>
          <ScrollArea className="h-50 rounded-lg border border-primary/5 bg-background/20 p-2">
            <div className="grid grid-cols-1 gap-1.5">
              {filteredArticles.length === 0 && (
                <p className="col-span-1 py-8 text-center text-[10px] text-muted-foreground">
                  No articles found.
                </p>
              )}
              {filteredArticles.map((article: ArticleSummary) => (
                <button
                  key={article.slug}
                  onClick={() => setSelectedSlug(article.slug)}
                  className={cn("flex flex-col gap-1 rounded-lg border p-3 text-left transition-all", selectedSlug === article.slug ? "border-amber-400 bg-amber-500 text-white shadow-sm" : "border-transparent hover:border-primary/10 hover:bg-background")}
                >
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-2.5 w-2.5 shrink-0 opacity-60" />
                    <span className="truncate text-[11px] font-bold leading-tight">
                      {article.title}
                    </span>
                    <span className={cn("ml-auto rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider", article.published ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/15 text-amber-600 dark:text-amber-400")}>
                      {article.published ? "Live" : "Draft"}
                    </span>
                  </div>
                  <span className="truncate pl-4 font-mono text-[9px] opacity-60">
                    {article.slug}
                  </span>
                </button>
              ))}
            </div>
          </ScrollArea>
          {selectedSlug && selectedArticle && (
            <div className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2">
              <div className="min-w-0">
                <span className="block truncate font-mono text-[9px] text-amber-600 dark:text-amber-400">
                  ✓ {selectedSlug}
                </span>
                <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground">
                  {selectedArticle.published ? "Published article" : "Draft article"}
                </span>
              </div>
              <button
                onClick={() => setSelectedSlug("")}
                className="ml-2 shrink-0 text-[10px] font-black uppercase text-muted-foreground hover:text-destructive"
              >
                Clear
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </ScrollReveal>
  );
}

function WorkflowContextCard() {
  const {
    contentType, dictionary,
    seriesPhase, setSeriesPhase,
    seriesArticleNumber, setSeriesArticleNumber,
    seriesPhaseOptions, seriesArticleOptions,
    seriesTarget, seriesTone,
    newsSourceUrls, updateNewsSourceUrl, removeNewsSourceUrl, addNewsSourceUrl,
    newsAngle, setNewsAngle, isIndonesianLocale,
    tipsStandalone, setTipsStandalone,
    noteIntent, setNoteIntent, noteIntentOptions, noteIntentLabelMap
  } = usePrompt();

  return (
    <ScrollReveal direction="up" delay={0.14}>
      <Card className="overflow-hidden rounded-xl border-l-4 border-l-emerald-400 border-primary/10 bg-card/50 shadow-sm">
        <CardHeader className="flex flex-row items-center gap-2 border-b bg-muted/5 px-5 py-3">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
          <CardTitle className="text-[10px] font-black uppercase tracking-widest">
            Workflow Context
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          {contentType === "series" && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">{dictionary.seriesPhaseLabel}</p>
                <Select value={seriesPhase} onValueChange={(v: string) => setSeriesPhase(v as typeof seriesPhase)}>
                  <SelectTrigger className="h-9 border-primary/10 bg-background/50 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {seriesPhaseOptions.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">{dictionary.seriesArticleLabel}</p>
                <Select value={seriesArticleNumber} onValueChange={setSeriesArticleNumber}>
                  <SelectTrigger className="h-9 border-primary/10 bg-background/50 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {seriesArticleOptions.map((n: string) => (
                      <SelectItem key={n} value={n}>#{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">{dictionary.seriesTargetLabel}</p>
                <Input readOnly value={seriesTarget} className="h-9 border-primary/10 bg-background/50 text-xs" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">{dictionary.seriesToneLabel}</p>
                <Input readOnly value={seriesTone} className="h-9 border-primary/10 bg-background/50 text-xs" />
              </div>
            </div>
          )}

          {contentType === "news" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">{dictionary.newsSourceUrlsLabel}</p>
                <div className="space-y-2">
                  {newsSourceUrls.map((url: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={url}
                        onChange={(e) => updateNewsSourceUrl(index, e.target.value)}
                        placeholder={`https://example.com/source-${index + 1}`}
                        className="h-9 border-primary/10 bg-background/50 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewsSourceUrl(index)}
                        className="h-9 w-9 rounded-md border border-primary/10 text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
                      >
                        <Trash2 className="mx-auto h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addNewsSourceUrl}
                  disabled={newsSourceUrls.length >= 3}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-primary/15 px-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-3 w-3" /> Add URL (max 3)
                </button>
              </div>
              <div className="space-y-1.5">
                <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">{dictionary.newsAngleLabel}</p>
                <Input
                  value={newsAngle}
                  onChange={(e) => setNewsAngle(e.target.value)}
                  placeholder={isIndonesianLocale ? "Contoh: fokus ke dampak untuk daily Ubuntu user" : "Example: focus on impact for daily Ubuntu users"}
                  className="h-9 border-primary/10 bg-background/50 text-xs"
                />
              </div>
            </div>
          )}

          {contentType === "tips" && (
            <div className="flex items-center justify-between rounded-lg border border-primary/10 bg-background/40 px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{dictionary.tipsStandaloneLabel}</p>
              <Switch checked={tipsStandalone} onCheckedChange={setTipsStandalone} />
            </div>
          )}

          {contentType === "notes" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">{dictionary.notesIntentLabel}</p>
                <Select value={noteIntent} onValueChange={(v: string) => setNoteIntent(v as typeof noteIntent)}>
                  <SelectTrigger className="h-9 border-primary/10 bg-background/50 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {noteIntentOptions.map((i: string) => (
                      <SelectItem key={i} value={i}>{noteIntentLabelMap[i as keyof typeof noteIntentLabelMap]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {isIndonesianLocale
                  ? "Catatan diarahkan ke _notes/{locale}/{YYYY-H1 atau YYYY-H2}/ berdasarkan tanggal artikel."
                  : "Notes are routed to _notes/{locale}/{YYYY-H1 or YYYY-H2}/ based on the article date."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </ScrollReveal>
  );
}

function TechnicalTabsCard() {
  const {
    showImages, showDownloads, showGrids, showGallery, showSpecs,
    heroImage, setHeroImage, images, setImages,
    downloadItems, updateDownloadItem, removeDownloadItem, addDownloadItem, downloadIds, copyLinkCaller,
    imageGridMappings, setImageGridMappings, copyGridCaller,
    galleryMappings, setGalleryMappings, copyGalleryCaller,
    specsMappings, setSpecsMappings, copySpecCaller, specsGroups,
    captionMode, setCaptionMode, captionAlignment, setCaptionAlignment, captionCoverage, setCaptionCoverage, captionMaxCount, setCaptionMaxCount,
    dictionary
  } = usePrompt();

  const focusRing = "focus-visible:ring-primary/20 focus-visible:ring-offset-0 focus-visible:border-primary/30 transition-all duration-300";
  const hasFeatures = showImages || showDownloads || showGrids || showGallery || showSpecs;

  if (!hasFeatures) {
    return (
      <ScrollReveal direction="up" delay={0.2}>
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-primary/10 bg-muted/2 py-8 text-center">
          <Settings2 className="h-6 w-6 text-muted-foreground/20" />
          <p className="text-[10px] font-medium text-muted-foreground/40">
            Enable features above to show technical configurations here.
          </p>
        </div>
      </ScrollReveal>
    );
  }

  // Determine an active default tab nicely
  const defaultTab = showImages ? "images" : showDownloads ? "downloads" : showGrids ? "grids" : showGallery ? "gallery" : showSpecs ? "specs" : "";

  return (
    <ScrollReveal direction="up" delay={0.2}>
      <Card className="overflow-hidden rounded-xl border-primary/10 bg-card/50 shadow-sm border-l-4 border-l-muted-foreground/30">
        <Tabs defaultValue={defaultTab} className="w-full">
          <div className="border-b border-primary/5 bg-muted/5 flex items-center justify-between">
            <TabsList className="h-12 bg-transparent justify-start overflow-x-auto gap-1 px-2 no-scrollbar">
               {showImages && (
                 <TabsTrigger value="images" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-500 text-[10px] font-black uppercase tracking-wider rounded-md h-8 px-3">
                   <ImageIcon className="h-3 w-3 mr-1.5" /> Images
                 </TabsTrigger>
               )}
               {showDownloads && (
                 <TabsTrigger value="downloads" className="data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-500 text-[10px] font-black uppercase tracking-wider rounded-md h-8 px-3">
                   <Download className="h-3 w-3 mr-1.5" /> DLs
                 </TabsTrigger>
               )}
               {showGrids && (
                 <TabsTrigger value="grids" className="data-[state=active]:bg-violet-500/10 data-[state=active]:text-violet-500 text-[10px] font-black uppercase tracking-wider rounded-md h-8 px-3">
                   <Grid3X3 className="h-3 w-3 mr-1.5" /> Grids
                 </TabsTrigger>
               )}
               {showGallery && (
                 <TabsTrigger value="gallery" className="data-[state=active]:bg-fuchsia-500/10 data-[state=active]:text-fuchsia-500 text-[10px] font-black uppercase tracking-wider rounded-md h-8 px-3">
                   <GalleryHorizontal className="h-3 w-3 mr-1.5" /> Gallery
                 </TabsTrigger>
               )}
               {showSpecs && (
                 <TabsTrigger value="specs" className="data-[state=active]:bg-orange-500/10 data-[state=active]:text-orange-500 text-[10px] font-black uppercase tracking-wider rounded-md h-8 px-3">
                   <Settings2 className="h-3 w-3 mr-1.5" /> Specs
                 </TabsTrigger>
               )}
            </TabsList>
          </div>

          <div className="p-4">
            {showImages && (
              <TabsContent value="images" className="space-y-4 m-0 border-none outline-none">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <p className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Hero / Banner</p>
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[8px] font-black uppercase tracking-wide text-emerald-600 dark:text-emerald-400">HERO</span>
                  </div>
                  <Input
                    placeholder="path/to/hero.webp | Alt text (optional)"
                    value={heroImage}
                    onChange={(e) => setHeroImage(e.target.value)}
                    className={cn("bg-background/50 font-mono text-[11px] focus-visible:border-emerald-500/50", focusRing)}
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Body Images <span className="font-mono text-xs normal-case tracking-normal opacity-40">path | alt | caption hint</span></p>
                  <Textarea
                    placeholder={dictionary.imagesPlaceholder}
                    value={images}
                    onChange={(e) => setImages(e.target.value)}
                    className={cn("min-h-32 rounded-lg bg-background/50 p-3 font-mono text-[11px]", focusRing)}
                  />
                </div>

                <div className="rounded-lg border border-primary/10 bg-background/35 p-3">
                   <div className="flex items-center justify-between gap-2">
                     <p className="text-[9px] font-black uppercase tracking-[0.12em] text-muted-foreground">Auto Caption Policy</p>
                   </div>
                   <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Mode</p>
                        <Select value={captionMode} onValueChange={(v: string) => setCaptionMode(v as typeof captionMode)}>
                          <SelectTrigger className="h-8 border-primary/10 bg-background/60 text-[10px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="off">Off</SelectItem>
                            <SelectItem value="auto">Auto</SelectItem>
                            <SelectItem value="manual">Manual Hint</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Alignment</p>
                        <Select value={captionAlignment} onValueChange={(v: string) => setCaptionAlignment(v as typeof captionAlignment)}>
                          <SelectTrigger className="h-8 border-primary/10 bg-background/60 text-[10px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Coverage</p>
                        <Select value={captionCoverage} onValueChange={(v: string) => setCaptionCoverage(v as typeof captionCoverage)}>
                          <SelectTrigger className="h-8 border-primary/10 bg-background/60 text-[10px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="selective">Selective</SelectItem>
                            <SelectItem value="all">All Non-Hero</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Max</p>
                        <Input
                          value={captionMaxCount}
                          onChange={(e) => setCaptionMaxCount(e.target.value.replace(/[^0-9]/g, ""))}
                          className="h-8 border-primary/10 bg-background/60 text-[10px]"
                        />
                      </div>
                   </div>
                </div>
              </TabsContent>
            )}

            {showDownloads && (
              <TabsContent value="downloads" className="space-y-3 m-0 border-none outline-none">
                 {downloadItems.map((item, index) => (
                   <div key={item.id} className="flex items-center gap-2 rounded-lg border border-primary/5 bg-background/30 p-2">
                     <Select value={item.type} onValueChange={(val: string) => updateDownloadItem(item.id, { type: val as "id" | "url", value: "" })}>
                       <SelectTrigger className="h-7 w-15 border-primary/10 text-[9px]">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="id">ID</SelectItem>
                         <SelectItem value="url">URL</SelectItem>
                       </SelectContent>
                     </Select>
                     {item.type === "id" ? (
                       <DownloadIdPicker value={item.value} onSelect={(next: string) => updateDownloadItem(item.id, { value: next })} downloadIds={downloadIds as string[]} />
                     ) : (
                       <Input value={item.value} onChange={(e) => updateDownloadItem(item.id, { value: e.target.value })} placeholder="https://..." className="h-7 flex-1 border-primary/10 text-[10px]" />
                     )}
                     <button type="button" onClick={() => removeDownloadItem(item.id)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                       <Trash2 className="h-3 w-3" />
                     </button>
                     <button type="button" onClick={() => copyLinkCaller(index)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-blue-500/10 hover:text-blue-500">
                       <Copy className="h-3 w-3" />
                     </button>
                   </div>
                 ))}
                 <button type="button" onClick={addDownloadItem} className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-primary/20 text-[10px] font-black uppercase tracking-wide text-muted-foreground transition-all hover:border-primary/40 hover:text-primary">
                    <Plus className="h-3 w-3" /> Add Link
                 </button>
              </TabsContent>
            )}

            {showGrids && (
              <TabsContent value="grids" className="space-y-3 m-0 border-none outline-none">
                 <Textarea placeholder={"2 | path1.webp, path2.webp\n3 | img1, img2, img3"} value={imageGridMappings} onChange={(e) => setImageGridMappings(e.target.value)} className={cn("min-h-24 bg-background/50 p-3 font-mono text-[11px]", focusRing)} />
                 {imageGridMappings.trim() && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {imageGridMappings.split("\n").filter((l: string) => l.trim()).map((_, i: number) => (
                        <button key={i} onClick={() => copyGridCaller(i)} className="flex items-center gap-1 rounded-md border border-violet-500/20 bg-violet-500/10 px-2 py-1 font-mono text-[9px] text-violet-500 transition-colors hover:bg-violet-500/20">
                          <Copy className="h-2.5 w-2.5" /> {`{{Grid ${i + 1}}}`}
                        </button>
                      ))}
                    </div>
                 )}
              </TabsContent>
            )}

            {showGallery && (
               <GalleryTab
                 galleryMappings={galleryMappings}
                 setGalleryMappings={setGalleryMappings}
                 copyGalleryCaller={copyGalleryCaller}
                 focusRing={focusRing}
               />
            )}

            {showSpecs && (
              <TabsContent value="specs" className="space-y-3 m-0 border-none outline-none">
                <Textarea placeholder={"Min specs: CPU i3, RAM 4GB..."} value={specsMappings} onChange={(e) => setSpecsMappings(e.target.value)} className={cn("min-h-24 bg-background/50 p-3 font-mono text-[11px]", focusRing)} />
                {specsMappings.trim() && (
                   <div className="flex flex-wrap gap-1 mt-2">
                      {specsGroups.map((_, i) => (
                        <button key={i} onClick={() => copySpecCaller(i)} className="flex items-center gap-1 rounded-md border border-orange-500/20 bg-orange-500/10 px-2 py-1 font-mono text-[9px] text-orange-500 transition-colors hover:bg-orange-500/20">
                          <Copy className="h-2.5 w-2.5" /> {`{{Specs ${i + 1}}}`}
                        </button>
                      ))}
                   </div>
                )}
              </TabsContent>
            )}
          </div>
        </Tabs>
      </Card>
    </ScrollReveal>
  );
}

// ── Gallery Tab with Quick Import ──────────────────────────────────────────
function GalleryTab({
  galleryMappings,
  setGalleryMappings,
  copyGalleryCaller,
  focusRing,
}: {
  galleryMappings: string;
  setGalleryMappings: (v: string) => void;
  copyGalleryCaller: (i: number) => void;
  focusRing: string;
}) {
  const [importPaths, setImportPaths] = useState("");
  const [showImport, setShowImport] = useState(false);

  const handleGenerate = () => {
    const paths = importPaths
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (paths.length === 0) return;

    // Group into chunks of 3
    const galleries: string[] = [];
    for (let i = 0; i < paths.length; i += 3) {
      const chunk = paths.slice(i, i + 3);
      galleries.push(chunk.join(", "));
    }

    // Append to existing mappings (or set fresh)
    const existing = galleryMappings.trim();
    const result = existing
      ? existing + "\n" + galleries.join("\n")
      : galleries.join("\n");
    setGalleryMappings(result);
    setImportPaths("");
    setShowImport(false);
  };

  const pathLines = importPaths.split("\n").map((l) => l.trim()).filter(Boolean);
  const previewCount = Math.ceil(pathLines.length / 3);

  return (
    <TabsContent value="gallery" className="space-y-3 m-0 border-none outline-none">
      {/* Quick Import toggle */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowImport(!showImport)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-wider transition-colors",
            showImport
              ? "border-fuchsia-500/40 bg-fuchsia-500/15 text-fuchsia-500"
              : "border-primary/15 text-muted-foreground hover:border-fuchsia-500/30 hover:text-fuchsia-500"
          )}
        >
          <Import className="h-3 w-3" /> Quick Import
        </button>
        {!showImport && galleryMappings.trim() && (
          <span className="text-[9px] text-muted-foreground">
            {galleryMappings.split("\n").filter((l: string) => l.trim()).length} gallery(s)
          </span>
        )}
      </div>

      {/* Quick Import area */}
      {showImport && (
        <div className="rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/5 p-3 space-y-2.5">
          <p className="text-[9px] font-black uppercase tracking-wider text-fuchsia-600 dark:text-fuchsia-400">
            Paste paths (1 per line) — auto-grouped per 3
          </p>
          <Textarea
            placeholder={
              "public/images/_posts/apps/example/img-1.webp\npublic/images/_posts/apps/example/img-2.webp\npublic/images/_posts/apps/example/img-3.webp"
            }
            value={importPaths}
            onChange={(e) => setImportPaths(e.target.value)}
            className={cn(
              "min-h-28 bg-background/60 p-3 font-mono text-[11px] border-fuchsia-500/15",
              focusRing
            )}
          />
          {pathLines.length > 0 && (
            <p className="text-[10px] text-muted-foreground">
              {pathLines.length} image{pathLines.length !== 1 ? "s" : ""} → {previewCount} gallery(s)
              {pathLines.length % 3 !== 0 && (
                <span className="ml-1 text-amber-500">
                  (last gallery: {pathLines.length % 3} image{pathLines.length % 3 !== 1 ? "s" : ""})
                </span>
              )}
            </p>
          )}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={pathLines.length === 0}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/15 px-4 text-[9px] font-black uppercase tracking-wider text-fuchsia-600 transition-colors hover:bg-fuchsia-500/25 disabled:cursor-not-allowed disabled:opacity-40 dark:text-fuchsia-400"
          >
            <GalleryHorizontal className="h-3 w-3" /> Generate {previewCount > 0 ? previewCount : ""} Gallery{previewCount !== 1 ? "s" : ""}
          </button>
        </div>
      )}

      {/* Main gallery mappings textarea */}
      <Textarea
        placeholder={"Optional caption | path1.webp, path2.webp, path3.webp"}
        value={galleryMappings}
        onChange={(e) => setGalleryMappings(e.target.value)}
        className={cn("min-h-24 bg-background/50 p-3 font-mono text-[11px]", focusRing)}
      />

      {/* Gallery caller buttons */}
      {galleryMappings.trim() && (
        <div className="flex flex-wrap gap-1 mt-2">
          {galleryMappings
            .split("\n")
            .filter((l: string) => l.trim())
            .map((_, i: number) => (
              <button
                key={i}
                onClick={() => copyGalleryCaller(i)}
                className="flex items-center gap-1 rounded-md border border-fuchsia-500/20 bg-fuchsia-500/10 px-2 py-1 font-mono text-[9px] text-fuchsia-500 transition-colors hover:bg-fuchsia-500/20"
              >
                <Copy className="h-2.5 w-2.5" /> {`{{Gallery ${i + 1}}}`}
              </button>
            ))}
        </div>
      )}
    </TabsContent>
  );
}
