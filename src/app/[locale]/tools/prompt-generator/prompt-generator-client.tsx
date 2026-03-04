
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  StickyNote, 
  Download, 
  Grid3X3, 
  ImageIcon, 
  Calendar, 
  Zap,
  RefreshCw,
  Sparkles,
  ListFilter,
  Search,
  Terminal,
  Type,
  MousePointer2,
} from 'lucide-react';
import { downloadLinks } from '@/lib/data-downloads';
import { useNotification } from '@/hooks/use-notification';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { InternalToolWrapper } from '@/components/tools/internal-tool-wrapper';
import type { Dictionary } from '@/lib/get-dictionary';

type DownloadItem = {
  id: string;
  type: 'id' | 'url';
  value: string;
};

type ArticleSummary = {
  slug: string;
  title: string;
  type: 'blog' | 'note';
};

interface PromptGeneratorClientProps {
  dictionary: any; 
  existingArticles: ArticleSummary[];
  fullDictionary: Dictionary;
}

export function PromptGeneratorClient({ dictionary, existingArticles, fullDictionary }: PromptGeneratorClientProps) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<'create' | 'modify'>('create');
  const [contentType, setContentType] = useState<'blog' | 'note'>('blog');
  const [selectedSlug, setSelectedSlug] = useState<string>('');
  const [articleSearch, setArticleSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [modInstructions, setModInstructions] = useState('');
  
  const [showDownloads, setShowDownloads] = useState(false);
  const [showGrids, setShowGrids] = useState(false);
  const [showImages, setShowImages] = useState(true);

  const [isTechnicalExpanded, setIsTechnicalExpanded] = useState(true);

  const [downloadItems, setDownloadItems] = useState<DownloadItem[]>([]);
  const [imageGridMappings, setImageGridMappings] = useState('');
  const [images, setImages] = useState('');

  const [publishDate, setPublishDate] = useState<string>('');
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isIdOnly, setIsIdOnly] = useState(false);

  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const { notify } = useNotification();

  const downloadIds = useMemo(() => Object.keys(downloadLinks).sort(), []);

  const filteredArticles = useMemo(() => {
    if (!articleSearch.trim()) return existingArticles;
    const query = articleSearch.toLowerCase();
    return existingArticles.filter(a => 
      a.title.toLowerCase().includes(query) || 
      a.slug.toLowerCase().includes(query)
    );
  }, [existingArticles, articleSearch]);

  const counters = useMemo(() => {
    const text = mode === 'modify' ? originalContent : draft;
    return {
      chars: text.length,
      lines: text.split('\n').filter(l => l.trim() !== '').length,
      words: text.trim() === '' ? 0 : text.trim().split(/\s+/).length
    };
  }, [draft, originalContent, mode]);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('snipgeek-prompt-features');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setShowDownloads(!!parsed.showDownloads);
        setShowGrids(!!parsed.showGrids);
        setShowImages(parsed.showImages !== undefined ? !!parsed.showImages : true);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('snipgeek-prompt-features', JSON.stringify({
        showDownloads,
        showGrids,
        showImages
      }));
    }
  }, [showDownloads, showGrids, showImages, mounted]);

  useEffect(() => {
    const buildPrompt = () => {
      const isBlog = contentType === 'blog';
      const isModify = mode === 'modify';
      
      let prompt = "";
      
      if (isModify) {
        prompt = `${dictionary.modifyPromptBase}\n\n`;
        if (selectedSlug) {
          prompt += `**TARGET ARTICLE SLUG:** \`${selectedSlug}\`\n\n`;
        }
      } else {
        let promptBase = isBlog ? (isIdOnly ? dictionary.promptBaseBlogIdOnly : dictionary.promptBaseBlog) : (isIdOnly ? dictionary.promptBaseNoteIdOnly : dictionary.promptBaseNote);
        prompt = `${promptBase}\n\n`;
      }

      prompt += `**${dictionary.frontmatterDetails}:**\n`;
      prompt += `- ${dictionary.contentTypeLabel}: ${isBlog ? dictionary.contentTypeBlog : dictionary.contentTypeNote}\n`;
      prompt += `- ${dictionary.titleLabel}: ${isModify ? '[KEEP ORIGINAL UNLESS CHANGED]' : '[AI: generate SEO-optimized title 50-60 chars]'}\n`;
      
      if (!isModify) {
        prompt += `- slug: [AI: Generate unique kebab-case English slug]\n`;
        prompt += `- translationKey: [AI: Generate unique kebab-case key]\n`;
      }
      
      prompt += `- ${dictionary.dateLabel}: ${publishDate || (isModify ? '[KEEP ORIGINAL]' : new Date().toISOString().split('T')[0])}\n`;
      if (isModify) prompt += `- updated: ${new Date().toISOString().split('T')[0]}\n`;

      let frontmatterStatus = `published: ${isPublished}`;
      if (isBlog) frontmatterStatus += `, featured: ${isFeatured}`;
      prompt += `- ${dictionary.statusLabel}: ${frontmatterStatus}\n`;

      const imageLines = images.split('\n').filter(line => line.trim() !== '');

      if (isBlog && !isModify) {
        const heroImageLine = (showImages && imageLines.length > 0) ? imageLines[0] : '';
        const [heroImagePath, heroImageAlt] = heroImageLine.split('|').map(s => s ? s.trim() : '');
        prompt += `- heroImage: "${heroImagePath || "/images/blank/blank.webp"}"\n`;
        prompt += `- imageAlt: "${heroImageAlt || '[AI: GENERATE DESCRIPTIVE ALT]'}"\n`;
      }
      
      if (!isModify) prompt += `- tags: [AI: Generate 3-5 relevant tags]\n\n`;

      if (showImages && imageLines.length > (isBlog && !isModify ? 1 : 0)) {
          prompt += `**${isBlog ? dictionary.supportingImagesLabel : dictionary.supportingImagesLabelNote}:**\n`;
          const sliceIndex = (isBlog && !isModify) ? 1 : 0;
          imageLines.slice(sliceIndex).forEach((line, index) => {
              const [imgPath, imgAlt] = line.split('|').map(s => s ? s.trim() : '');
              prompt += `- Image ${index + 1} Path: "${imgPath}" | Alt: "${imgAlt || '[AI: GENERATE ALT]'}"\n`;
          });
          prompt += `\n`;
      }

      if (showDownloads && downloadItems.length > 0) {
          prompt += `\n**${dictionary.downloadLinks.promptTitle}:**\n`;
          downloadItems.forEach((item, index) => {
              prompt += `- [DOWNLOAD_${index + 1}] -> ${item.type === 'id' ? 'ID: "' + item.value + '"' : 'URL: "' + item.value + '"'}\n`;
          });
      }

      if (showGrids && imageGridMappings) {
        prompt += `\n**${dictionary.imageGrid.promptTitle}:**\n`;
        const gridMappings = imageGridMappings.split('\n').filter(line => line.trim() !== '');
        gridMappings.forEach((line, index) => {
            prompt += `- [GRID_${index + 1}] -> Paths: ${line}\n`;
        });
      }

      if (isModify) {
        prompt += `---\n\n**${dictionary.originalContentLabel}:**\n\n${originalContent || "[PASTE CONTENT]"}\n\n**${dictionary.modInstructionsLabel}:**\n\n${modInstructions || "[INSTRUCTIONS]"}`;
      } else {
        prompt += `---\n\n**${dictionary.draftContentLabel}:**\n\n${draft}`;
      }
      
      prompt += `\n\n---\n**${dictionary.finalInstruction}**`;
      setGeneratedPrompt(prompt);
    };

    buildPrompt();
  }, [mode, draft, originalContent, modInstructions, publishDate, isPublished, isFeatured, isIdOnly, images, dictionary, contentType, downloadItems, imageGridMappings, showDownloads, showGrids, showImages, selectedSlug]);

  const handleCopyMain = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setIsCopied(true);
    notify(dictionary.copiedButton, <Check className="h-4 w-4 text-emerald-400" />);
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  const addDownloadItem = () => setDownloadItems([...downloadItems, { id: crypto.randomUUID(), type: 'id', value: '' }]);
  const removeDownloadItem = (id: string) => setDownloadItems(downloadItems.filter(item => item.id !== id));
  const updateDownloadItem = (id: string, updates: Partial<DownloadItem>) => setDownloadItems(downloadItems.map(item => item.id === id ? { ...item, ...updates } : item));

  const applyQuickAction = (action: string) => {
    let text = action === 'narrative' ? dictionary.quickActions.narrative : action === 'images' ? dictionary.quickActions.images : dictionary.quickActions.metadata;
    setModInstructions(prev => prev ? `${prev}\n- ${text}` : `- ${text}`);
  };

  const focusInputClass = "focus-visible:ring-primary/20 focus-visible:ring-offset-0 focus-visible:border-primary/30 transition-all duration-300";

  return (
    <InternalToolWrapper 
        title={dictionary.title} 
        description={dictionary.description}
        dictionary={fullDictionary}
        isPublic={true}
    >
        <div className="max-w-[1600px] mx-auto space-y-10">
            {/* Toolbar */}
            <Card className="bg-background/80 backdrop-blur-xl border-primary/10 shadow-xl overflow-hidden rounded-lg">
                <div className="p-3 flex flex-wrap items-center justify-between gap-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="relative flex bg-muted/40 p-1 rounded-lg border border-primary/5 min-w-[240px]">
                            <button onClick={() => setMode('create')} className={cn("relative flex-1 h-9 rounded-lg text-[10px] font-black uppercase transition-colors z-10", mode === 'create' ? "text-primary" : "text-muted-foreground")}>{dictionary.modes.create}</button>
                            <button onClick={() => setMode('modify')} className={cn("relative flex-1 h-9 rounded-lg text-[10px] font-black uppercase transition-colors z-10", mode === 'modify' ? "text-primary" : "text-muted-foreground")}>{dictionary.modes.modify}</button>
                            <div className={cn("absolute top-1 bottom-1 w-[calc(50%-4px)] bg-background rounded-lg shadow-sm transition-all duration-300 z-0", mode === 'modify' ? "translate-x-full" : "translate-x-0")} />
                        </div>
                        <div className="flex bg-muted/20 p-1 rounded-lg">
                            <Button variant={contentType === 'blog' ? 'secondary' : 'ghost'} onClick={() => setContentType('blog')} className="h-9 px-4 rounded-lg text-[10px] font-bold uppercase">{dictionary.contentTypeBlog}</Button>
                            <Button variant={contentType === 'note' ? 'secondary' : 'ghost'} onClick={() => setContentType('note')} className="h-9 px-4 rounded-lg text-[10px] font-bold uppercase">{dictionary.contentTypeNote}</Button>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-3 bg-muted/20 p-1.5 rounded-lg border border-primary/5">
                            <Calendar className="h-4 w-4 text-muted-foreground ml-2" />
                            <Input value={publishDate} onChange={(e) => setPublishDate(e.target.value)} placeholder={mode === 'modify' ? "ORIGINAL DATE" : "YYYY-MM-DD"} className="h-8 w-32 border-none bg-transparent text-[10px] font-mono" />
                        </div>
                        <div className="flex items-center gap-6 pr-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground">Live</Label>
                            <Switch checked={isPublished} onCheckedChange={setIsPublished} className="scale-75" />
                        </div>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-8 pb-32">
                    {mode === 'modify' && (
                        <Card className="bg-card/50 border-primary/10 shadow-sm overflow-hidden border-l-4 border-l-amber-400 rounded-lg">
                            <CardHeader className="py-4 px-6 border-b bg-muted/5 flex flex-row items-center justify-between">
                                <CardTitle className="text-[11px] font-black uppercase tracking-widest">{dictionary.selectArticleLabel}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder={dictionary.searchArticlePlaceholder} value={articleSearch} onChange={(e) => setArticleSearch(e.target.value)} className={cn("pl-10 h-11 bg-background/50 rounded-lg", focusInputClass)} />
                                </div>
                                <ScrollArea className="h-[220px] rounded-lg border border-primary/5 bg-background/20 p-2">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {filteredArticles.map((article) => (
                                            <button key={article.slug} onClick={() => setSelectedSlug(article.slug)} className={cn("text-left p-3 rounded-lg transition-all flex flex-col gap-1 border", selectedSlug === article.slug ? "bg-amber-500 text-white border-amber-400" : "hover:bg-background hover:border-primary/10")}>
                                                <span className="font-bold text-xs truncate">{article.title}</span>
                                                <span className="text-[10px] font-mono opacity-60 truncate">{article.slug}</span>
                                            </button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    )}

                    <Card className={cn("bg-card/50 border-primary/10 flex flex-col overflow-hidden shadow-lg border-l-4 transition-all rounded-lg", mode === 'modify' ? "border-l-sky-400" : "border-l-primary")}>
                        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/5 px-6 py-4">
                            <CardTitle className="text-[11px] font-black uppercase tracking-widest">{mode === 'modify' ? dictionary.originalContentTitle : dictionary.draftTitle}</CardTitle>
                            <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase">
                                <span className="flex items-center gap-1"><Type className="h-3 w-3" /> {counters.chars} chars</span>
                            </div>
                        </CardHeader>
                        <Textarea placeholder={mode === 'modify' ? dictionary.originalContentPlaceholder : dictionary.draftPlaceholder} value={mode === 'modify' ? originalContent : draft} onChange={(e) => mode === 'modify' ? setOriginalContent(e.target.value) : setDraft(e.target.value)} className="w-full border-none rounded-none bg-transparent font-mono text-xs p-8 resize-none focus-visible:ring-0 leading-relaxed min-h-[500px]" />
                    </Card>

                    {mode === 'modify' && (
                        <Card className="bg-card/50 border-primary/10 shadow-md border-l-4 border-l-accent rounded-lg">
                            <CardHeader className="border-b bg-muted/5 px-6 py-4">
                                <CardTitle className="text-[11px] font-black uppercase tracking-widest">{dictionary.modInstructionsTitle}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="flex flex-wrap gap-2">
                                    {['narrative', 'images', 'metadata'].map(action => (
                                        <Button key={action} variant="outline" size="sm" onClick={() => applyQuickAction(action)} className="text-[10px] font-bold rounded-lg px-4 h-8">{action.toUpperCase()}</Button>
                                    ))}
                                </div>
                                <Textarea placeholder={dictionary.modInstructionsPlaceholder} value={modInstructions} onChange={(e) => setModInstructions(e.target.value)} className={cn("min-h-[120px] bg-background/30 rounded-lg font-mono text-xs p-4", focusInputClass)} />
                            </CardContent>
                        </Card>
                    )}

                    <div className="space-y-4">
                        <button onClick={() => setIsTechnicalExpanded(!isTechnicalExpanded)} className="w-full flex items-center justify-between px-2 py-4 group">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground group-hover:text-primary transition-colors">Technical Details & Media</span>
                            {isTechnicalExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                        {isTechnicalExpanded && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                <Card className="bg-card/50 border-primary/10 overflow-hidden shadow-sm border-l-4 border-l-emerald-400 rounded-lg">
                                    <CardHeader className="bg-muted/5 py-3 border-b px-6"><CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><ImageIcon className="h-4 w-4 text-emerald-500" /> {dictionary.imagesTitle}</CardTitle></CardHeader>
                                    <CardContent className="p-6">
                                        <Textarea placeholder={dictionary.imagesPlaceholder} value={images} onChange={(e) => setImages(e.target.value)} className={cn("font-mono text-[11px] bg-background/50 rounded-lg p-4 min-h-[100px]", focusInputClass)} />
                                    </CardContent>
                                </Card>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {showDownloads && (
                                        <Card className="bg-card/50 border-primary/10 shadow-sm border-l-4 border-l-blue-400 rounded-lg">
                                            <CardHeader className="border-b bg-muted/5 py-3 px-6"><CardTitle className="text-[10px] font-black flex items-center gap-2 uppercase tracking-widest"><Download className="h-4 w-4 text-blue-500" /> Downloads</CardTitle></CardHeader>
                                            <CardContent className="p-6 space-y-4">
                                                {downloadItems.map((item, idx) => (
                                                    <div key={item.id} className="flex items-center gap-2 p-2 border border-primary/5 rounded-lg">
                                                        <Select value={item.type} onValueChange={(val) => updateDownloadItem(item.id, { type: val as 'id' | 'url', value: '' })}>
                                                            <SelectTrigger className="w-[70px] h-8 text-[10px]"><SelectValue /></SelectTrigger>
                                                            <SelectContent><SelectItem value="id">ID</SelectItem><SelectItem value="url">URL</SelectItem></SelectContent>
                                                        </Select>
                                                        <Input value={item.value} onChange={(e) => updateDownloadItem(item.id, { value: e.target.value })} className="flex-1 h-8 text-[10px]" />
                                                        <Button variant="ghost" size="icon" onClick={() => removeDownloadItem(item.id)} className="h-8 w-8 text-muted-foreground"><Trash2 className="h-3.5 w-3.5" /></Button>
                                                    </div>
                                                ))}
                                                <Button onClick={addDownloadItem} variant="outline" size="sm" className="w-full border-dashed h-10">Add Download</Button>
                                            </CardContent>
                                        </Card>
                                    )}
                                    {showGrids && (
                                        <Card className="bg-card/50 border-primary/10 shadow-sm border-l-4 border-l-violet-400 rounded-lg">
                                            <CardHeader className="border-b bg-muted/5 py-3 px-6"><CardTitle className="text-[10px] font-black flex items-center gap-2 uppercase tracking-widest"><Grid3X3 className="h-4 w-4 text-violet-500" /> Grids</CardTitle></CardHeader>
                                            <CardContent className="p-6"><Textarea placeholder="cols | path1, path2..." value={imageGridMappings} onChange={(e) => setImageGridMappings(e.target.value)} className={cn("min-h-[100px] font-mono text-[11px] bg-background/50 p-4", focusInputClass)} /></CardContent>
                                        </Card>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-5 h-full">
                    <div className="sticky top-32">
                        <Card className="border-primary/20 shadow-2xl overflow-hidden ring-4 ring-primary/5 rounded-lg bg-[#0a0a0a]">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-white/[0.05] bg-white/[0.02] py-3 px-6">
                                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-white/60">Generated Prompt</CardTitle>
                                <Button onClick={handleCopyMain} size="sm" className={cn("gap-2 px-5 rounded-full h-8 transition-all", isCopied ? "bg-emerald-500" : "bg-primary")}>
                                    {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                    <span className="text-[9px] font-black uppercase">{isCopied ? 'Copied' : 'Copy'}</span>
                                </Button>
                            </CardHeader>
                            <ScrollArea className="h-[calc(100vh-220px)] bg-transparent">
                                <Textarea readOnly value={generatedPrompt} className="min-h-[800px] border-none bg-transparent font-mono text-[12px] p-8 resize-none focus-visible:ring-0 leading-relaxed text-slate-300" />
                            </ScrollArea>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    </InternalToolWrapper>
  );
}
