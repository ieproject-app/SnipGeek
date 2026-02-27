
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  CheckCircle2,
  Image as LucideImage,
  Languages,
  Zap,
  RefreshCw,
  Sparkles,
  Type
} from 'lucide-react';
import { downloadLinks } from '@/lib/data-downloads';
import { useNotification } from '@/hooks/use-notification';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type DownloadItem = {
  id: string;
  type: 'id' | 'url';
  value: string;
};

export function PromptGeneratorClient({ dictionary }: { dictionary: any }) {
  const [mode, setMode] = useState<'create' | 'modify'>('create');
  const [contentType, setContentType] = useState<'blog' | 'note'>('blog');
  const [draft, setDraft] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [modInstructions, setModInstructions] = useState('');
  
  // Feature Toggles
  const [showDownloads, setShowDownloads] = useState(false);
  const [showGrids, setShowGrids] = useState(false);
  const [showImages, setShowImages] = useState(true);

  // UI State
  const [isDraftExpanded, setIsDraftExpanded] = useState(false);

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

  const downloadIds = Object.keys(downloadLinks).sort();

  // Persistence for feature toggles
  useEffect(() => {
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
    localStorage.setItem('snipgeek-prompt-features', JSON.stringify({
      showDownloads,
      showGrids,
      showImages
    }));
  }, [showDownloads, showGrids, showImages]);

  // Prompt Builder Logic
  useEffect(() => {
    const buildPrompt = () => {
      const isBlog = contentType === 'blog';
      const isModify = mode === 'modify';
      
      let prompt = "";
      
      if (isModify) {
        prompt = `${dictionary.modifyPromptBase}\n\n`;
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
  }, [mode, draft, originalContent, modInstructions, publishDate, isPublished, isFeatured, isIdOnly, images, dictionary, contentType, downloadItems, imageGridMappings, showDownloads, showGrids, showImages]);

  const handleCopyMain = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setIsCopied(true);
    notify(dictionary.copiedButton);
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

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* 1. Header Toolbar */}
      <Card className="bg-card/50 border-primary/10 shadow-sm overflow-hidden">
        <div className="p-4 flex flex-wrap items-center justify-between gap-6">
          
          <div className="flex flex-wrap items-center gap-6">
            {/* Mode Switcher */}
            <div className="flex bg-muted/30 p-1 rounded-xl border border-primary/5">
                <Button 
                  variant={mode === 'create' ? 'default' : 'ghost'} 
                  onClick={() => setMode('create')}
                  className={cn("h-9 px-4 rounded-lg text-[10px] font-bold uppercase", mode !== 'create' && "text-muted-foreground")}
                >
                  <Sparkles className="h-3.5 w-3.5 mr-2" />
                  {dictionary.modes.create}
                </Button>
                <Button 
                  variant={mode === 'modify' ? 'default' : 'ghost'} 
                  onClick={() => setMode('modify')}
                  className={cn("h-9 px-4 rounded-lg text-[10px] font-bold uppercase", mode !== 'modify' && "text-muted-foreground")}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-2" />
                  {dictionary.modes.modify}
                </Button>
            </div>

            {/* Content Type Selection */}
            <div className="flex bg-muted/30 p-1 rounded-xl border border-primary/5">
                <Button 
                  variant={contentType === 'blog' ? 'default' : 'ghost'} 
                  onClick={() => setContentType('blog')}
                  className={cn("h-9 px-3 rounded-lg gap-2 text-[10px] font-bold uppercase", contentType !== 'blog' && "text-muted-foreground")}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{dictionary.contentTypeBlog}</span>
                </Button>
                <Button 
                  variant={contentType === 'note' ? 'default' : 'ghost'} 
                  onClick={() => setContentType('note')}
                  className={cn("h-9 px-3 rounded-lg gap-2 text-[10px] font-bold uppercase", contentType !== 'note' && "text-muted-foreground")}
                >
                  <StickyNote className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{dictionary.contentTypeNote}</span>
                </Button>
            </div>

            {/* Feature Toggles */}
            <div className="flex items-center gap-2">
              <Button variant={showDownloads ? 'default' : 'outline'} onClick={() => setShowDownloads(!showDownloads)} className="h-10 w-10 p-0 rounded-lg"><Download className="h-4 w-4" /></Button>
              <Button variant={showGrids ? 'default' : 'outline'} onClick={() => setShowGrids(!showGrids)} className="h-10 w-10 p-0 rounded-lg"><Grid3X3 className="h-4 w-4" /></Button>
              <Button variant={showImages ? 'default' : 'outline'} onClick={() => setShowImages(!showImages)} className="h-10 w-10 p-0 rounded-lg"><LucideImage className="h-4 w-4" /></Button>
            </div>
          </div>

          {/* Metadata Form */}
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input value={publishDate} onChange={(e) => setPublishDate(e.target.value)} placeholder={mode === 'modify' ? "ORIGINAL DATE" : "YYYY-MM-DD"} className="h-9 w-32 rounded-lg text-[10px] font-mono" />
            </div>
            
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2 group cursor-pointer">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <Label htmlFor="published" className="text-[10px] font-bold uppercase cursor-pointer text-muted-foreground group-hover:text-primary">{dictionary.publishSwitchLabel}</Label>
                <Switch id="published" checked={isPublished} onCheckedChange={setIsPublished} className="scale-75" />
              </div>
              {contentType === 'blog' && (
                <div className="flex items-center gap-2 group cursor-pointer">
                  <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <Label htmlFor="featured" className="text-[10px] font-bold uppercase cursor-pointer text-muted-foreground group-hover:text-primary">{dictionary.featuredSwitchLabel}</Label>
                  <Switch id="featured" checked={isFeatured} onCheckedChange={setIsFeatured} className="scale-75" />
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Draft or Original Content */}
        <div className={cn("space-y-8", mode === 'modify' ? "lg:col-span-7" : "lg:col-span-12")}>
            <Card className="bg-card/50 border-primary/10 flex flex-col overflow-hidden shadow-md">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10 px-6 py-4">
                    <CardTitle className="text-sm font-bold flex items-center gap-3 uppercase tracking-wider">
                        <div className="p-2 bg-primary/10 rounded-lg"><FileText className="h-4 w-4 text-primary" /></div>
                        {mode === 'modify' ? dictionary.originalContentTitle : dictionary.draftTitle}
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setIsDraftExpanded(!isDraftExpanded)} className="h-8 w-8 rounded-full">
                        {isDraftExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </CardHeader>
                <Textarea
                    placeholder={mode === 'modify' ? dictionary.originalContentPlaceholder : dictionary.draftPlaceholder}
                    value={mode === 'modify' ? originalContent : draft}
                    onChange={(e) => mode === 'modify' ? setOriginalContent(e.target.value) : setDraft(e.target.value)}
                    className={cn(
                        "w-full border-none rounded-none bg-transparent font-mono text-xs p-6 resize-none focus-visible:ring-0 leading-relaxed transition-all duration-500",
                        isDraftExpanded ? "min-h-[800px]" : "min-h-[400px]"
                    )}
                />
            </Card>
        </div>

        {/* Right Column: Modification Instructions (Only in Modify Mode) */}
        {mode === 'modify' && (
            <div className="lg:col-span-5 space-y-8">
                <Card className="bg-card/50 border-primary/10 shadow-md h-full flex flex-col">
                    <CardHeader className="border-b bg-muted/10 px-6 py-4">
                        <CardTitle className="text-sm font-bold flex items-center gap-3 uppercase tracking-wider">
                            <div className="p-2 bg-accent/10 rounded-lg"><Zap className="h-4 w-4 text-accent" /></div>
                            {dictionary.modInstructionsTitle}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6 flex-1 flex flex-col">
                        <div className="space-y-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{dictionary.quickActions.label}</p>
                            <div className="flex flex-wrap gap-2">
                                <Button variant="outline" size="sm" onClick={() => applyQuickAction('narrative')} className="text-[10px] rounded-full px-4 h-8 border-accent/20 hover:bg-accent/5 hover:text-accent">
                                    {dictionary.quickActions.narrative}
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => applyQuickAction('images')} className="text-[10px] rounded-full px-4 h-8 border-accent/20 hover:bg-accent/5 hover:text-accent">
                                    {dictionary.quickActions.images}
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => applyQuickAction('metadata')} className="text-[10px] rounded-full px-4 h-8 border-accent/20 hover:bg-accent/5 hover:text-accent">
                                    {dictionary.quickActions.metadata}
                                </Button>
                            </div>
                        </div>
                        <Textarea
                            placeholder={dictionary.modInstructionsPlaceholder}
                            value={modInstructions}
                            onChange={(e) => setModInstructions(e.target.value)}
                            className="flex-1 min-h-[300px] bg-background/30 rounded-lg border-muted-foreground/20 focus:border-accent/40 font-mono text-xs leading-relaxed"
                        />
                    </CardContent>
                </Card>
            </div>
        )}
      </div>

      {/* 3. Technical Sections (Downloads, Grids, Images) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {showImages && (
          <Card className="bg-card/50 border-primary/10 overflow-hidden shadow-sm md:col-span-2">
            <CardHeader className="bg-muted/20 py-3 border-b">
              <CardTitle className="text-xs font-bold flex items-center gap-2 uppercase tracking-widest">
                <LucideImage className="h-4 w-4 text-primary" /> {contentType === 'blog' ? dictionary.imagesTitle : dictionary.imagesTitleNote}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <Textarea
                    placeholder={contentType === 'blog' ? dictionary.imagesPlaceholder : dictionary.imagesPlaceholderNote}
                    value={images}
                    onChange={(e) => setImages(e.target.value)}
                    className="font-mono text-xs bg-background/50 rounded-lg p-4 min-h-[100px] border-muted-foreground/20"
                />
                <p className="mt-3 text-[9px] text-muted-foreground uppercase font-bold tracking-widest">
                    {contentType === 'blog' ? dictionary.imagesDescription : dictionary.imagesDescriptionNote}
                </p>
            </CardContent>
          </Card>
        )}

        {showDownloads && (
          <Card className="bg-card/50 border-primary/10 shadow-sm flex flex-col">
              <CardHeader className="border-b bg-muted/10 py-3">
                  <CardTitle className="text-xs font-bold flex items-center gap-2 uppercase tracking-widest">
                    <Download className="h-4 w-4 text-primary" /> {dictionary.downloadLinks.title}
                  </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 flex-1">
                  <div className="space-y-3">
                      {downloadItems.map((item, index) => (
                      <div key={item.id} className="flex items-center gap-2 p-3 border rounded-lg bg-background/30 group">
                          <Badge variant="secondary" className="text-[10px] font-bold shrink-0">[D_{index + 1}]</Badge>
                          <Select value={item.type} onValueChange={(val) => updateDownloadItem(item.id, { type: val as 'id' | 'url', value: '' })}>
                              <SelectTrigger className="w-[80px] h-8 text-[10px]"><SelectValue /></SelectTrigger>
                              <SelectContent><SelectItem value="id">ID</SelectItem><SelectItem value="url">URL</SelectItem></SelectContent>
                          </Select>
                          {item.type === 'id' ? (
                              <Select value={item.value} onValueChange={(val) => updateDownloadItem(item.id, { value: val })}>
                                <SelectTrigger className="flex-1 h-8 text-[10px]"><SelectValue placeholder="..." /></SelectTrigger>
                                <SelectContent>{downloadIds.map(id => <SelectItem key={id} value={id}>{id}</SelectItem>)}</SelectContent>
                              </Select>
                          ) : (
                              <Input placeholder="URL..." value={item.value} onChange={(e) => updateDownloadItem(item.id, { value: e.target.value })} className="flex-1 h-8 text-[10px]" />
                          )}
                          <Button variant="ghost" size="icon" onClick={() => removeDownloadItem(item.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                      ))}
                  </div>
                  <Button onClick={addDownloadItem} variant="outline" size="sm" className="w-full border-dashed rounded-lg h-10 hover:bg-primary/5">
                    <Plus className="h-4 w-4 mr-2" /> {dictionary.downloadLinks.addDownload}
                  </Button>
              </CardContent>
          </Card>
        )}

        {showGrids && (
          <Card className="bg-card/50 border-primary/10 shadow-sm flex flex-col">
            <CardHeader className="border-b bg-muted/10 py-3">
                <CardTitle className="text-xs font-bold flex items-center gap-2 uppercase tracking-widest">
                  <Grid3X3 className="h-4 w-4 text-primary" /> {dictionary.imageGrid.title}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                <Textarea
                    placeholder={dictionary.imageGrid.placeholder}
                    value={imageGridMappings}
                    onChange={(e) => setImageGridMappings(e.target.value)}
                    className="min-h-[100px] font-mono text-xs bg-background/50 rounded-lg border-muted-foreground/20"
                />
                <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">
                  {dictionary.imageGrid.description}
                </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 4. Final Generated Prompt Section */}
      <Card className="border-primary/20 shadow-2xl overflow-hidden ring-4 ring-primary/5">
        <CardHeader className="flex flex-col sm:flex-row items-center justify-between border-b bg-muted/30 py-5 px-8 gap-4">
          <CardTitle className="text-lg font-headline flex items-center gap-3 uppercase tracking-tighter">
            <div className="p-1.5 bg-green-500/10 rounded-full"><Check className="h-5 w-5 text-green-600" /></div>
            {dictionary.generatedPromptTitle}
          </CardTitle>
          <Button onClick={handleCopyMain} variant="default" size="lg" className="gap-2 px-10 rounded-full shadow-lg h-12 transition-all hover:scale-[1.02] active:scale-95">
            {isCopied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            {isCopied ? dictionary.copiedButton : dictionary.copyButton}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Textarea
            readOnly
            value={generatedPrompt}
            className="min-h-[500px] border-none rounded-none bg-muted/5 font-mono text-[13px] p-8 resize-none focus-visible:ring-0 leading-loose"
          />
        </CardContent>
      </Card>
    </div>
  );
}
