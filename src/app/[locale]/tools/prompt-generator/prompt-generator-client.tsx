
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  ArrowUpRight,
  Terminal,
  Type,
  MousePointer2,
  LogOut,
  LogIn,
  User as UserIcon,
  Loader2
} from 'lucide-react';
import { downloadLinks } from '@/lib/data-downloads';
import { useNotification } from '@/hooks/use-notification';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import Link from 'next/link';

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
  dictionary: any; // The promptGenerator dictionary section
  existingArticles: ArticleSummary[];
}

export function PromptGeneratorClient({ dictionary, existingArticles }: PromptGeneratorClientProps) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<'create' | 'modify'>('create');
  const [contentType, setContentType] = useState<'blog' | 'note'>('blog');
  const [selectedSlug, setSelectedSlug] = useState<string>('');
  const [articleSearch, setArticleSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [modInstructions, setModInstructions] = useState('');
  
  // Feature Toggles
  const [showDownloads, setShowDownloads] = useState(false);
  const [showGrids, setShowGrids] = useState(false);
  const [showImages, setShowImages] = useState(true);

  // UI State
  const [isTechnicalExpanded, setIsTechnicalExpanded] = useState(true);

  // Data Inputs
  const [downloadItems, setDownloadItems] = useState<DownloadItem[]>([]);
  const [imageGridMappings, setImageGridMappings] = useState('');
  const [images, setImages] = useState('');

  // Metadata
  const [publishDate, setPublishDate] = useState<string>('');
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isIdOnly, setIsIdOnly] = useState(false);

  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const { notify } = useNotification();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  const downloadIds = useMemo(() => Object.keys(downloadLinks).sort(), []);

  // Filter articles based on search query
  const filteredArticles = useMemo(() => {
    if (!articleSearch.trim()) return existingArticles;
    const query = articleSearch.toLowerCase();
    return existingArticles.filter(a => 
      a.title.toLowerCase().includes(query) || 
      a.slug.toLowerCase().includes(query)
    );
  }, [existingArticles, articleSearch]);

  // Content Counters
  const counters = useMemo(() => {
    const text = mode === 'modify' ? originalContent : draft;
    return {
      chars: text.length,
      lines: text.split('\n').filter(l => l.trim() !== '').length,
      words: text.trim() === '' ? 0 : text.trim().split(/\s+/).length
    };
  }, [draft, originalContent, mode]);

  // Persistence for feature toggles & hydration fix
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

  // Prompt Builder Logic
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
        let promptBase = "";
        if (isBlog) {
          promptBase = isIdOnly ? dictionary.promptBaseBlogIdOnly : dictionary.promptBaseBlog;
        } else {
          promptBase = isIdOnly ? dictionary.promptBaseNoteIdOnly : dictionary.promptBaseNote;
        }
        prompt = `${promptBase}\n\n`;
      }

      prompt += `**${dictionary.frontmatterDetails}:**\n`;
      prompt += `- ${dictionary.contentTypeLabel}: ${isBlog ? dictionary.contentTypeBlog : dictionary.contentTypeNote}\n`;
      prompt += `- ${dictionary.titleLabel}: ${isModify ? '[KEEP ORIGINAL UNLESS CHANGED]' : '[AI: Please generate a high-quality, SEO-optimized title between 50-60 characters]'}\n`;
      
      if (!isModify) {
        prompt += `- slug: [AI: Generate a unique kebab-case English slug. This MUST be identical for both language versions]\n`;
        prompt += `- translationKey: [AI: Generate a unique, short kebab-case key based on the topic]\n`;
      }
      
      prompt += `- ${dictionary.dateLabel}: ${publishDate || (isModify ? '[KEEP ORIGINAL]' : new Date().toISOString().split('T')[0])}\n`;
      
      if (isModify) {
        prompt += `- updated: ${new Date().toISOString().split('T')[0]}\n`;
      }

      let frontmatterStatus = `published: ${isPublished}`;
      if (isBlog) {
        frontmatterStatus += `, featured: ${isFeatured}`;
      }
      prompt += `- ${dictionary.statusLabel}: ${frontmatterStatus}\n`;

      const imageLines = images.split('\n').filter(line => line.trim() !== '');

      if (isBlog && !isModify) {
        const heroImageLine = (showImages && imageLines.length > 0) ? imageLines[0] : '';
        const [heroImagePath, heroImageAlt] = heroImageLine.split('|').map(s => s ? s.trim() : '');
        prompt += `- heroImage: "${heroImagePath || "/images/blank/blank.webp"}"\n`;
        prompt += `- imageAlt: "${heroImageAlt || '[AI: PLEASE GENERATE DESCRIPTIVE SEO ALT TEXT]'}"\n`;
      }
      
      if (!isModify) {
        prompt += `- tags: [AI: Generate 3-5 relevant tags]\n`;
      }
      prompt += `\n`;

      if (showImages && imageLines.length > (isBlog && !isModify ? 1 : 0)) {
          prompt += `**${isBlog ? dictionary.supportingImagesLabel : dictionary.supportingImagesLabelNote}:**\n`;
          const sliceIndex = (isBlog && !isModify) ? 1 : 0;
          imageLines.slice(sliceIndex).forEach((line, index) => {
              const [imgPath, imgAlt] = line.split('|').map(s => s ? s.trim() : '');
              prompt += `- Image ${index + 1} Path: "${imgPath}"\n`;
              prompt += `- Image ${index + 1} Alt: "${imgAlt || '[AI: PLEASE GENERATE DESCRIPTIVE SEO ALT TEXT]'}"\n`;
          });
          prompt += `\n`;
      }

      if (showDownloads && downloadItems.length > 0) {
          prompt += `\n**${dictionary.downloadLinks.promptTitle}:**\n`;
          prompt += `${dictionary.downloadLinks.promptInstruction}\n`;
          downloadItems.forEach((item, index) => {
              if (item.type === 'id') {
                prompt += `- Placeholder [DOWNLOAD_${index + 1}] -> Use Existing ID: "${item.value}"\n`;
              } else {
                prompt += `- Placeholder [DOWNLOAD_${index + 1}] -> Use New URL: "${item.value}"\n`;
              }
          });
          prompt += `\n`;
      }

      if (showGrids && imageGridMappings && dictionary.imageGrid) {
        prompt += `\n**${dictionary.imageGrid.promptTitle}:**\n`;
        prompt += `${dictionary.imageGrid.promptInstruction}\n`;
        const gridMappings = imageGridMappings.split('\n').filter(line => line.trim() !== '');
        gridMappings.forEach((line, index) => {
            prompt += `- Placeholder [GRID_${index + 1}] -> Paths: ${line}\n`;
        });
        prompt += `\n`;
      }

      if (isModify) {
        prompt += `---\n\n`;
        prompt += `**${dictionary.originalContentLabel}:**\n\n`;
        prompt += originalContent || "[PASTE CONTENT HERE]";
        prompt += `\n\n**${dictionary.modInstructionsLabel}:**\n\n`;
        prompt += modInstructions || "[WRITE INSTRUCTIONS HERE]";
      } else {
        prompt += `---\n\n`;
        prompt += `**${dictionary.draftContentLabel}:**\n\n`;
        prompt += draft;
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
  
  const addDownloadItem = () => {
    setDownloadItems([...downloadItems, { id: crypto.randomUUID(), type: 'id', value: '' }]);
  };

  const removeDownloadItem = (id: string) => {
    setDownloadItems(downloadItems.filter(item => item.id !== id));
  };

  const updateDownloadItem = (id: string, updates: Partial<DownloadItem>) => {
    setDownloadItems(downloadItems.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const applyQuickAction = (action: string) => {
    let text = "";
    switch (action) {
      case 'narrative': text = dictionary.quickActions.narrative; break;
      case 'images': text = dictionary.quickActions.images; break;
      case 'metadata': text = dictionary.quickActions.metadata; break;
    }
    setModInstructions(prev => prev ? `${prev}\n- ${text}` : `- ${text}`);
  };

  const handleLogout = async () => {
    try {
        await signOut(auth);
        notify("Berhasil keluar akun.", <LogOut className="h-4 w-4" />);
    } catch (error) {
        console.error("Logout error:", error);
    }
  };

  if (isUserLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-accent" />
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Menghubungkan ke Akun...</p>
        </div>
    );
  }

  if (!user) {
    return (
        <div className="max-w-md mx-auto">
            <Card className="text-center mt-8 border-primary/10 bg-card/50 shadow-xl rounded-2xl overflow-hidden">
                <div className="h-1.5 w-full bg-accent" />
                <CardHeader className="pt-8 pb-4">
                    <CardTitle className="font-headline text-3xl font-black uppercase tracking-tighter">Akses Terbatas</CardTitle>
                    <CardDescription className="text-sm px-6">Tool ini memerlukan login untuk menjaga integritas format konten SnipGeek.</CardDescription>
                </CardHeader>
                <CardContent className="pb-10">
                    <Button asChild className="h-14 px-10 rounded-full shadow-lg shadow-primary/20 transition-all duration-200 active:scale-95 text-lg font-black uppercase tracking-widest">
                        <Link href="/login">
                            <LogIn className="mr-3 h-5 w-5"/>
                            Masuk dengan Google
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }

  const focusInputClass = "focus-visible:ring-primary/20 focus-visible:ring-offset-0 focus-visible:border-primary/30 transition-all duration-300";

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 animate-in fade-in duration-700">
      
      {/* 0. User Profile Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-muted/30 backdrop-blur-sm rounded-2xl border border-primary/5 shadow-inner">
          <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-background shadow-md">
                  <AvatarImage src={user.photoURL || ''} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-black">
                      {user.email?.charAt(0).toUpperCase() || <UserIcon className="h-4 w-4" />}
                  </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                  <span className="text-sm font-black text-primary leading-none mb-1">{user.displayName || 'Editor SnipGeek'}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">{user.email}</span>
              </div>
          </div>
          <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="text-[10px] font-black uppercase tracking-widest text-destructive hover:bg-destructive/10 hover:text-destructive rounded-full h-9 px-6 transition-all active:scale-95"
          >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Keluar Akun
          </Button>
      </div>

      {/* 1. Main Toolbar */}
      <div className="px-4">
        <Card className="bg-background/80 backdrop-blur-xl border-primary/10 shadow-xl overflow-hidden rounded-lg ring-1 ring-black/[0.03]">
          <div className="p-3 flex flex-wrap items-center justify-between gap-6">
            
            <div className="flex flex-wrap items-center gap-4">
              {/* Mode Switcher */}
              <div className="relative flex bg-muted/40 p-1 rounded-lg border border-primary/5 min-w-[240px]">
                  <div className={cn(
                      "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-background rounded-lg shadow-sm transition-all duration-300 ease-in-out z-0",
                      mode === 'modify' ? "translate-x-full" : "translate-x-0"
                  )} />
                  <button 
                    onClick={() => setMode('create')}
                    className={cn(
                        "relative flex-1 h-9 rounded-lg text-[10px] font-black uppercase transition-colors flex items-center justify-center gap-2 z-10",
                        mode === 'create' ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Sparkles className={cn("h-3.5 w-3.5", mode === 'create' ? "text-accent" : "")} />
                    {dictionary.modes.create}
                  </button>
                  <button 
                    onClick={() => setMode('modify')}
                    className={cn(
                        "relative flex-1 h-9 rounded-lg text-[10px] font-black uppercase transition-colors flex items-center justify-center gap-2 z-10",
                        mode === 'modify' ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5", mode === 'modify' ? "text-accent" : "")} />
                    {dictionary.modes.modify}
                  </button>
              </div>

              <Separator orientation="vertical" className="h-8 hidden lg:block" />

              {/* Content Type Selection */}
              <div className="flex bg-muted/20 p-1 rounded-lg">
                  <Button 
                    variant={contentType === 'blog' ? 'secondary' : 'ghost'} 
                    onClick={() => setContentType('blog')}
                    className={cn("h-9 px-4 rounded-lg gap-2 text-[10px] font-bold uppercase", contentType !== 'blog' && "text-muted-foreground")}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{dictionary.contentTypeBlog}</span>
                  </Button>
                  <Button 
                    variant={contentType === 'note' ? 'secondary' : 'ghost'} 
                    onClick={() => setContentType('note')}
                    className={cn("h-9 px-4 rounded-lg gap-2 text-[10px] font-bold uppercase", contentType !== 'note' && "text-muted-foreground")}
                  >
                    <StickyNote className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{dictionary.contentTypeNote}</span>
                  </Button>
              </div>

              {/* Feature Toggles */}
              <div className="flex items-center gap-2">
                <Button 
                    variant={showDownloads ? 'default' : 'outline'} 
                    onClick={() => setShowDownloads(!showDownloads)} 
                    className={cn("h-10 w-10 p-0 rounded-lg transition-all duration-300", showDownloads && "ring-2 ring-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.2)]")}
                >
                    <Download className="h-4 w-4" />
                </Button>
                <Button 
                    variant={showGrids ? 'default' : 'outline'} 
                    onClick={() => setShowGrids(!showGrids)} 
                    className={cn("h-10 w-10 p-0 rounded-lg transition-all duration-300", showGrids && "ring-2 ring-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.2)]")}
                >
                    <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button 
                    variant={showImages ? 'default' : 'outline'} 
                    onClick={() => setShowImages(!showImages)} 
                    className={cn("h-10 w-10 p-0 rounded-lg transition-all duration-300", showImages && "ring-2 ring-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.2)]")}
                >
                    <ImageIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Metadata Controls */}
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3 bg-muted/20 p-1.5 rounded-lg border border-primary/5">
                <Calendar className="h-4 w-4 text-muted-foreground ml-2" />
                <Input 
                    value={publishDate} 
                    onChange={(e) => setPublishDate(e.target.value)} 
                    placeholder={mode === 'modify' ? "ORIGINAL DATE" : "YYYY-MM-DD"} 
                    className={cn("h-8 w-32 border-none bg-transparent text-[10px] font-mono", focusInputClass)} 
                />
              </div>
              
              <div className="flex items-center gap-6 pr-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="published" className="text-[10px] font-black uppercase text-muted-foreground">{dictionary.publishSwitchLabel}</Label>
                  <Switch id="published" checked={isPublished} onCheckedChange={setIsPublished} className="scale-75" />
                </div>
                {contentType === 'blog' && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="featured" className="text-[10px] font-black uppercase text-muted-foreground">{dictionary.featuredSwitchLabel}</Label>
                    <Switch id="featured" checked={isFeatured} onCheckedChange={setIsFeatured} className="scale-75" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 2. MainPersistent Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4">
        
        {/* Left Column: Input Areas */}
        <div className="lg:col-span-7 space-y-8 pb-32">
            
            {/* Article Selection */}
            {mode === 'modify' && (
                <Card className="bg-card/50 border-primary/10 shadow-sm overflow-hidden border-l-4 border-l-amber-400 animate-in fade-in slide-in-from-top-4 duration-500 rounded-lg">
                    <CardHeader className="py-4 px-6 border-b bg-muted/5 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-400/10 rounded-lg"><ListFilter className="h-4 w-4 text-amber-500" /></div>
                            <CardTitle className="text-[11px] font-black uppercase tracking-widest">{dictionary.selectArticleLabel}</CardTitle>
                        </div>
                        {selectedSlug && <Badge variant="outline" className="text-[9px] font-mono border-amber-400/30 text-amber-600 bg-amber-50">Selected: {selectedSlug}</Badge>}
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-amber-500 transition-colors" />
                            <Input 
                                placeholder={dictionary.searchArticlePlaceholder} 
                                value={articleSearch} 
                                onChange={(e) => setArticleSearch(e.target.value)}
                                className={cn("pl-10 h-11 bg-background/50 rounded-lg", focusInputClass)}
                            />
                        </div>
                        
                        <ScrollArea className="h-[220px] rounded-lg border border-primary/5 bg-background/20 p-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {filteredArticles.length > 0 ? (
                                    filteredArticles.map((article) => (
                                        <button
                                            key={article.slug}
                                            onClick={() => setSelectedSlug(article.slug)}
                                            className={cn(
                                                "text-left p-3 rounded-lg transition-all flex flex-col gap-1 group/item border border-transparent",
                                                selectedSlug === article.slug 
                                                    ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20 border-amber-400" 
                                                    : "hover:bg-background hover:border-primary/10 hover:-translate-y-0.5 hover:shadow-md text-muted-foreground hover:text-primary"
                                            )}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-bold text-xs truncate flex-1">{article.title}</span>
                                                <Badge 
                                                    variant="outline" 
                                                    className={cn(
                                                        "text-[8px] h-4 px-1.5 uppercase shrink-0 font-black", 
                                                        selectedSlug === article.slug ? "border-white/40 text-white" : "text-muted-foreground"
                                                    )}
                                                >
                                                    {article.type}
                                                </Badge>
                                            </div>
                                            <span className={cn(
                                                "text-[10px] font-mono opacity-60 truncate", 
                                                selectedSlug === article.slug ? "text-white" : "text-muted-foreground"
                                            )}>
                                                {article.slug}
                                            </span>
                                        </button>
                                    ))
                                ) : (
                                    <div className="col-span-2 p-12 text-center text-xs text-muted-foreground italic bg-muted/5 rounded-lg border border-dashed border-primary/10">
                                        No articles found matching your query.
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            )}

            {/* Main Draft Area */}
            <Card className={cn(
                "bg-card/50 border-primary/10 flex flex-col overflow-hidden shadow-lg border-l-4 transition-all duration-500 rounded-lg",
                mode === 'modify' ? "border-l-sky-400" : "border-l-primary"
            )}>
                <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/5 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", mode === 'modify' ? "bg-sky-400/10" : "bg-primary/10")}>
                            {mode === 'modify' ? <Terminal className="h-4 w-4 text-sky-500" /> : <FileText className="h-4 w-4 text-primary" />}
                        </div>
                        <CardTitle className="text-[11px] font-black uppercase tracking-widest">
                            {mode === 'modify' ? dictionary.originalContentTitle : dictionary.draftTitle}
                        </CardTitle>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                        <span className="flex items-center gap-1"><Type className="h-3 w-3" /> {counters.chars} chars</span>
                        <Separator orientation="vertical" className="h-3" />
                        <span className="flex items-center gap-1"><MousePointer2 className="h-3 w-3" /> {counters.lines} lines</span>
                    </div>
                </CardHeader>
                <div className="relative">
                    <Textarea
                        placeholder={mode === 'modify' ? dictionary.originalContentPlaceholder : dictionary.draftPlaceholder}
                        value={mode === 'modify' ? originalContent : draft}
                        onChange={(e) => mode === 'modify' ? setOriginalContent(e.target.value) : setDraft(e.target.value)}
                        className={cn(
                            "w-full border-none rounded-none bg-transparent font-mono text-xs p-8 resize-none focus-visible:ring-0 leading-relaxed min-h-[500px]",
                            "placeholder:text-muted-foreground/30"
                        )}
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background/50 to-transparent pointer-events-none" />
                </div>
            </Card>

            {/* Modification Instructions */}
            {mode === 'modify' && (
                <Card className="bg-card/50 border-primary/10 shadow-md border-l-4 border-l-accent animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-lg">
                    <CardHeader className="border-b bg-muted/5 px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-accent/10 rounded-lg"><Zap className="h-4 w-4 text-accent" /></div>
                            <CardTitle className="text-[11px] font-black uppercase tracking-widest">{dictionary.modInstructionsTitle}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-3">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{dictionary.quickActions.label}</p>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    {id: 'narrative', label: dictionary.quickActions.narrative},
                                    {id: 'images', label: dictionary.quickActions.images},
                                    {id: 'metadata', label: dictionary.quickActions.metadata}
                                ].map(action => (
                                    <Button 
                                        key={action.id} 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => applyQuickAction(action.id)} 
                                        className="text-[10px] font-bold rounded-lg px-4 h-8 border-accent/20 hover:bg-accent/5 hover:text-accent hover:border-accent transition-all active:scale-95"
                                    >
                                        {action.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <Textarea
                            placeholder={dictionary.modInstructionsPlaceholder}
                            value={modInstructions}
                            onChange={(e) => setModInstructions(e.target.value)}
                            className={cn("min-h-[120px] bg-background/30 rounded-lg font-mono text-xs p-4", focusInputClass)}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Technical Sections */}
            <div className="space-y-4">
                <button 
                    onClick={() => setIsTechnicalExpanded(!isTechnicalExpanded)}
                    className="w-full flex items-center justify-between px-2 py-4 group"
                >
                    <div className="flex items-center gap-3">
                        <div className="h-px w-8 bg-primary/10 group-hover:w-12 transition-all duration-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground group-hover:text-primary transition-colors">Technical Details & Media</span>
                    </div>
                    {isTechnicalExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>

                {isTechnicalExpanded && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                        {showImages && (
                            <Card className="bg-card/50 border-primary/10 overflow-hidden shadow-sm border-l-4 border-l-emerald-400 rounded-lg">
                                <CardHeader className="bg-muted/5 py-3 border-b px-6">
                                    <CardTitle className="text-[10px] font-black flex items-center gap-2 uppercase tracking-widest">
                                        <ImageIcon className="h-4 w-4 text-emerald-500" /> {contentType === 'blog' ? dictionary.imagesTitle : dictionary.imagesTitleNote}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <Textarea
                                        placeholder={contentType === 'blog' ? dictionary.imagesPlaceholder : dictionary.imagesPlaceholderNote}
                                        value={images}
                                        onChange={(e) => setImages(e.target.value)}
                                        className={cn("font-mono text-[11px] bg-background/50 rounded-lg p-4 min-h-[100px]", focusInputClass)}
                                    />
                                    <p className="mt-3 text-[9px] text-muted-foreground/60 uppercase font-black tracking-widest">
                                        {contentType === 'blog' ? dictionary.imagesDescription : dictionary.imagesDescriptionNote}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {showDownloads && (
                                <Card className="bg-card/50 border-primary/10 shadow-sm border-l-4 border-l-blue-400 flex flex-col animate-in fade-in zoom-in-95 duration-500 rounded-lg">
                                    <CardHeader className="border-b bg-muted/5 py-3 px-6">
                                        <CardTitle className="text-[10px] font-black flex items-center gap-2 uppercase tracking-widest">
                                            <Download className="h-4 w-4 text-blue-500" /> {dictionary.downloadLinks.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-4">
                                        <div className="space-y-3">
                                            {downloadItems.map((item, index) => (
                                            <div key={item.id} className="flex items-center gap-2 p-2.5 border border-primary/5 rounded-lg bg-background/30 group animate-in slide-in-from-left-2 duration-300">
                                                <Badge variant="secondary" className="text-[9px] font-black h-6 min-w-[32px] justify-center">D{index + 1}</Badge>
                                                <Select value={item.type} onValueChange={(val) => updateDownloadItem(item.id, { type: val as 'id' | 'url', value: '' })}>
                                                    <SelectTrigger className="w-[70px] h-8 text-[10px] rounded-lg border-none bg-muted/50"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="rounded-lg"><SelectItem value="id">ID</SelectItem><SelectItem value="url">URL</SelectItem></SelectContent>
                                                </Select>
                                                {item.type === 'id' ? (
                                                    <Select value={item.value} onValueChange={(val) => updateDownloadItem(item.id, { value: val })}>
                                                        <SelectTrigger className="flex-1 h-8 text-[10px] rounded-lg border-none bg-muted/50"><SelectValue placeholder="..." /></SelectTrigger>
                                                        <SelectContent className="rounded-lg max-h-[300px]">{downloadIds.map(id => <SelectItem key={id} value={id} className="text-[10px]">{id}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                ) : (
                                                    <Input placeholder="URL..." value={item.value} onChange={(e) => updateDownloadItem(item.id, { value: e.target.value })} className="flex-1 h-8 text-[10px] border-none bg-muted/50" />
                                                )}
                                                <Button variant="ghost" size="icon" onClick={() => removeDownloadItem(item.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5 shrink-0 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></Button>
                                            </div>
                                            ))}
                                        </div>
                                        <Button onClick={addDownloadItem} variant="outline" size="sm" className="w-full border-dashed rounded-lg h-10 border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all">
                                            <Plus className="h-4 w-4 mr-2" /> {dictionary.downloadLinks.addDownload}
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}

                            {showGrids && (
                                <Card className="bg-card/50 border-primary/10 shadow-sm border-l-4 border-l-violet-400 flex flex-col animate-in fade-in zoom-in-95 duration-500 rounded-lg">
                                    <CardHeader className="border-b bg-muted/5 py-3 px-6">
                                        <CardTitle className="text-[10px] font-black flex items-center gap-2 uppercase tracking-widest">
                                            <Grid3X3 className="h-4 w-4 text-violet-500" /> {dictionary.imageGrid.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-4">
                                        <Textarea
                                            placeholder={dictionary.imageGrid.placeholder}
                                            value={imageGridMappings}
                                            onChange={(e) => setImageGridMappings(e.target.value)}
                                            className={cn("min-h-[100px] font-mono text-[11px] bg-background/50 rounded-lg p-4", focusInputClass)}
                                        />
                                        <p className="text-[9px] text-muted-foreground/60 uppercase font-black tracking-widest">
                                            {dictionary.imageGrid.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Right Column: Generated Prompt Preview */}
        <div className="lg:col-span-5 h-full">
            <div className="sticky top-32 space-y-6">
                <Card className="border-primary/20 shadow-2xl overflow-hidden ring-4 ring-primary/5 rounded-lg bg-[#0a0a0a] group/preview">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-white/[0.05] bg-white/[0.02] py-3 px-6">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-white/60">
                            {dictionary.generatedPromptTitle}
                        </CardTitle>
                        <Button 
                            onClick={handleCopyMain} 
                            variant="default" 
                            size="sm" 
                            className={cn(
                                "gap-2 px-5 rounded-full shadow-lg h-8 transition-all duration-300",
                                isCopied ? "bg-emerald-500 hover:bg-emerald-600 scale-105" : "bg-primary hover:bg-primary/90"
                            )}
                        >
                            {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            <span className="text-[9px] font-black uppercase tracking-widest">{isCopied ? dictionary.copiedButton : dictionary.copyButton}</span>
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[calc(100vh-220px)]">
                            <div className="relative">
                                {/* Editor-like line indicators */}
                                <div className="absolute left-0 top-0 bottom-0 w-12 border-r border-white/[0.03] bg-white/[0.01] pointer-events-none flex flex-col items-center pt-8 gap-[1.125rem]">
                                    {Array.from({length: 40}).map((_, i) => (
                                        <span key={i} className="text-[9px] font-mono text-white/10">{i + 1}</span>
                                    ))}
                                </div>
                                <Textarea
                                    readOnly
                                    value={generatedPrompt}
                                    className={cn(
                                        "min-h-[calc(100vh-220px)] border-none rounded-none bg-transparent font-mono text-[12px] pl-16 pr-8 pt-8 pb-32 resize-none focus-visible:ring-0 leading-relaxed text-slate-300 selection:bg-primary/30",
                                        "scrollbar-hide"
                                    )}
                                />
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
}
