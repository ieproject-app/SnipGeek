
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
  Layers,
  Zap
} from 'lucide-react';
import { downloadLinks } from '@/lib/data-downloads';
import { useNotification } from '@/hooks/use-notification';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type DownloadItem = {
  id: string;
  type: 'id' | 'url';
  value: string;
};

export function PromptGeneratorClient({ dictionary }: { dictionary: any }) {
  const [contentType, setContentType] = useState<'blog' | 'note'>('blog');
  const [draft, setDraft] = useState('');
  
  // Feature Toggles
  const [showDownloads, setShowDownloads] = useState(false);
  const [showGrids, setShowGrids] = useState(false);
  const [showImages, setShowImages] = useState(true);

  // UI State for Expansion
  const [isDraftExpanded, setIsDraftExpanded] = useState(false);

  // Data Inputs
  const [downloadItems, setDownloadItems] = useState<DownloadItem[]>([]);
  const [imageGridMappings, setImageGridMappings] = useState('');
  const [images, setImages] = useState('');

  // Metadata
  const [publishDate, setPublishDate] = useState<string>('');
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

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
      
      let prompt = isBlog
        ? `${dictionary.promptBaseBlog}\n\n`
        : `${dictionary.promptBaseNote}\n\n`;

      prompt += `**${dictionary.frontmatterDetails}:**\n`;
      prompt += `- ${dictionary.contentTypeLabel}: ${isBlog ? dictionary.contentTypeBlog : dictionary.contentTypeNote}\n`;
      prompt += `- ${dictionary.titleLabel}: [AI: Please generate a high-quality, SEO-optimized title between 50-60 characters based on the content]\n`;
      prompt += `- slug: [AI: Generate a unique kebab-case English slug. This MUST be identical for both language versions]\n`;
      prompt += `- translationKey: [AI: Generate a unique, short kebab-case key based on the topic to link both translations]\n`;
      prompt += `- ${dictionary.dateLabel}: ${publishDate || new Date().toISOString().split('T')[0]}\n`;
      
      let frontmatterStatus = `published: ${isPublished}`;
      if (isBlog) {
        frontmatterStatus += `, featured: ${isFeatured}`;
      }
      prompt += `- ${dictionary.statusLabel}: ${frontmatterStatus}\n`;

      const imageLines = images.split('\n').filter(line => line.trim() !== '');

      if (isBlog) {
        const heroImageLine = (showImages && imageLines.length > 0) ? imageLines[0] : '';
        const [heroImagePath, heroImageAlt] = heroImageLine.split('|').map(s => s ? s.trim() : '');
        prompt += `- heroImage: "${heroImagePath || "/images/blank/blank.webp"}"\n`;
        prompt += `- imageAlt: "${heroImageAlt || '[AI: PLEASE GENERATE DESCRIPTIVE SEO ALT TEXT]'}"\n`;
      }
      
      prompt += `- tags: [AI: Generate 3-5 relevant tags as an array of strings]\n`;
      prompt += `\n`;

      if (showImages && imageLines.length > (isBlog ? 1 : 0)) {
          prompt += `**${isBlog ? dictionary.supportingImagesLabel : dictionary.supportingImagesLabelNote}:**\n`;
          imageLines.slice(isBlog ? 1 : 0).forEach((line, index) => {
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
                prompt += `- Placeholder [DOWNLOAD_${index + 1}] -> Use New URL: "${item.value}" (AI: recommend a suitable kebab-case ID and use it in the component)\n`;
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
            prompt += `  (AI: AUTOMATICALLY calculate the best column count [1-4] based on the number of paths provided for this grid)\n`;
        });
        prompt += `\n`;
      }

      prompt += `---\n\n`;
      prompt += `**${dictionary.draftContentLabel}:**\n\n`;
      prompt += draft;
      prompt += `\n\n---\n**${dictionary.finalInstruction}**`;
      
      setGeneratedPrompt(prompt);
    };

    buildPrompt();
  }, [draft, publishDate, isPublished, isFeatured, images, dictionary, contentType, downloadItems, imageGridMappings, showDownloads, showGrids, showImages]);

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

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* 1. Header Toolbar - Improved Flex Layout to prevent overlapping */}
      <Card className="bg-card/50 border-primary/10 shadow-sm overflow-hidden">
        <div className="p-4 md:p-5 flex flex-wrap items-center justify-between gap-6">
          
          <div className="flex flex-wrap items-center gap-6">
            {/* Group A: Content Type */}
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/5 rounded-lg border border-primary/10 hidden sm:block">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div className="flex bg-muted/30 p-1 rounded-xl border">
                <Button 
                  variant={contentType === 'blog' ? 'default' : 'ghost'} 
                  onClick={() => setContentType('blog')}
                  className="h-9 px-3 rounded-lg transition-all gap-2 text-[10px] font-bold uppercase"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{dictionary.contentTypeBlog}</span>
                </Button>
                <Button 
                  variant={contentType === 'note' ? 'default' : 'ghost'} 
                  onClick={() => setContentType('note')}
                  className="h-9 px-3 rounded-lg transition-all gap-2 text-[10px] font-bold uppercase"
                >
                  <StickyNote className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{dictionary.contentTypeNote}</span>
                </Button>
              </div>
            </div>

            {/* Group B: Feature Toggles */}
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={showDownloads ? 'secondary' : 'outline'} 
                      onClick={() => setShowDownloads(!showDownloads)}
                      className={cn("h-10 w-10 sm:w-auto sm:px-3 rounded-xl border-dashed transition-all", showDownloads && "bg-primary/10 text-primary border-primary/40")}
                    >
                      <Download className="h-4 w-4" />
                      <span className="ml-2 text-[9px] font-bold uppercase hidden lg:inline">{dictionary.features.downloads}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>{dictionary.features.downloads}</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={showGrids ? 'secondary' : 'outline'} 
                      onClick={() => setShowGrids(!showGrids)}
                      className={cn("h-10 w-10 sm:w-auto sm:px-3 rounded-xl border-dashed transition-all", showGrids && "bg-primary/10 text-primary border-primary/40")}
                    >
                      <Grid3X3 className="h-4 w-4" />
                      <span className="ml-2 text-[9px] font-bold uppercase hidden lg:inline">{dictionary.features.grids}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>{dictionary.features.grids}</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={showImages ? 'secondary' : 'outline'} 
                      onClick={() => setShowImages(!showImages)}
                      className={cn("h-10 w-10 sm:w-auto sm:px-3 rounded-xl border-dashed transition-all", showImages && "bg-primary/10 text-primary border-primary/40")}
                    >
                      <LucideImage className="h-4 w-4" />
                      <span className="ml-2 text-[9px] font-bold uppercase hidden lg:inline">{dictionary.features.images}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>{dictionary.features.images}</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Group C: Metadata Mini-Form - Improved spacing and alignment */}
          <div className="flex flex-wrap items-center gap-6 border-t pt-4 w-full md:w-auto md:border-t-0 md:border-l md:pt-0 md:pl-6 border-primary/10">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                  value={publishDate}
                  onChange={(e) => setPublishDate(e.target.value)}
                  placeholder="YYYY-MM-DD"
                  className="bg-background/50 h-9 w-28 rounded-lg text-[10px] font-mono"
              />
            </div>
            
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <Label htmlFor="published" className="text-[9px] font-bold uppercase cursor-pointer whitespace-nowrap">{dictionary.publishSwitchLabel}</Label>
                <Switch id="published" checked={isPublished} onCheckedChange={setIsPublished} className="scale-75" />
              </div>
              
              {contentType === 'blog' && (
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Label htmlFor="featured" className="text-[9px] font-bold uppercase cursor-pointer whitespace-nowrap">{dictionary.featuredSwitchLabel}</Label>
                  <Switch id="featured" checked={isFeatured} onCheckedChange={setIsFeatured} className="scale-75" />
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Main Draft Area - Improved container synchronization */}
      <Card className="bg-card/50 border-primary/10 flex flex-col overflow-hidden shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10 px-6 py-4 shrink-0">
          <CardTitle className="text-lg font-headline flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg"><FileText className="h-5 w-5 text-primary" /></div>
            {dictionary.draftTitle}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsDraftExpanded(!isDraftExpanded)} className="h-8 w-8 rounded-full">
            {isDraftExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CardHeader>
        <div className="flex-1 min-h-0 bg-transparent">
          <Textarea
            placeholder={dictionary.draftPlaceholder}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className={cn(
                "w-full border-none rounded-none bg-transparent font-mono text-sm p-6 md:p-8 resize-none focus-visible:ring-0 leading-relaxed transition-all duration-500",
                isDraftExpanded ? "min-h-[800px]" : "min-h-[400px]"
            )}
          />
        </div>
      </Card>

      {/* 3. Dynamic Technical Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {showImages && (
          <Card className="bg-card/50 border-primary/10 overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-4 duration-300 md:col-span-2">
            <CardHeader className="bg-muted/20 py-3 border-b">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <LucideImage className="h-4 w-4 text-primary" /> {contentType === 'blog' ? dictionary.imagesTitle : dictionary.imagesTitleNote}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <Textarea
                    placeholder={contentType === 'blog' ? dictionary.imagesPlaceholder : dictionary.imagesPlaceholderNote}
                    value={images}
                    onChange={(e) => setImages(e.target.value)}
                    className="font-mono text-[13px] bg-background/50 rounded-xl p-4 min-h-[120px] leading-relaxed"
                />
                <p className="mt-3 text-[10px] text-muted-foreground uppercase font-bold tracking-widest pl-1 leading-tight">
                    {contentType === 'blog' ? dictionary.imagesDescription : dictionary.imagesDescriptionNote}
                </p>
            </CardContent>
          </Card>
        )}

        {showDownloads && (
          <Card className="bg-card/50 border-primary/10 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300 flex flex-col">
              <CardHeader className="border-b bg-muted/10 px-6 py-4">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Download className="h-4 w-4 text-primary" /> {dictionary.downloadLinks.title}
                  </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 flex-1">
                  <div className="space-y-3">
                      {downloadItems.map((item, index) => (
                      <div key={item.id} className="flex items-center gap-2 p-3 border rounded-xl bg-background/30 relative group transition-all hover:bg-background/50">
                          <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0">[D_{index + 1}]</Badge>
                          
                          <Select value={item.type} onValueChange={(val) => updateDownloadItem(item.id, { type: val as 'id' | 'url', value: '' })}>
                              <SelectTrigger className="w-[80px] h-8 text-[10px] rounded-lg">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="id">ID</SelectItem>
                                <SelectItem value="url">URL</SelectItem>
                              </SelectContent>
                          </Select>

                          {item.type === 'id' ? (
                              <Select value={item.value} onValueChange={(val) => updateDownloadItem(item.id, { value: val })}>
                              <SelectTrigger className="flex-1 h-8 text-[10px] rounded-lg">
                                  <SelectValue placeholder="..." />
                              </SelectTrigger>
                              <SelectContent>
                                  {downloadIds.map(id => <SelectItem key={id} value={id}>{id}</SelectItem>)}
                              </SelectContent>
                              </Select>
                          ) : (
                              <Input 
                                placeholder="URL..." 
                                value={item.value} 
                                onChange={(e) => updateDownloadItem(item.id, { value: e.target.value })}
                                className="flex-1 h-8 text-[10px] bg-background/50 rounded-lg"
                              />
                          )}

                          <Button variant="ghost" size="icon" onClick={() => removeDownloadItem(item.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0">
                              <Trash2 className="h-4 w-4" />
                          </Button>
                      </div>
                      ))}
                  </div>
                  <Button onClick={addDownloadItem} variant="outline" size="sm" className="w-full h-10 border-dashed rounded-xl bg-background/20 hover:bg-primary/5">
                    <Plus className="h-4 w-4 mr-2" /> {dictionary.downloadLinks.addDownload || "Add Download"}
                  </Button>
              </CardContent>
          </Card>
        )}

        {showGrids && (
          <Card className="bg-card/50 border-primary/10 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
            <CardHeader className="border-b bg-muted/10 px-6 py-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4 text-primary" /> {dictionary.imageGrid.title}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <Textarea
                    placeholder={dictionary.imageGrid.placeholder}
                    value={imageGridMappings}
                    onChange={(e) => setImageGridMappings(e.target.value)}
                    className="min-h-[120px] font-mono text-sm bg-background/50 rounded-xl p-4 leading-relaxed"
                />
                <p className="mt-3 text-[10px] text-muted-foreground uppercase font-bold tracking-widest pl-1 leading-tight">
                  {dictionary.imageGrid.description}
                </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 4. Final Generated Prompt Section */}
      <Card className="border-primary/20 shadow-2xl overflow-hidden ring-4 ring-primary/5">
        <CardHeader className="flex flex-col sm:flex-row items-center justify-between border-b bg-muted/30 py-5 px-8 gap-4">
          <CardTitle className="text-xl font-headline flex items-center gap-3">
            <div className="p-1.5 bg-green-500/10 rounded-full">
                <Check className="h-5 w-5 text-green-600" />
            </div>
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
            className="min-h-[500px] border-none rounded-none bg-muted/5 font-mono text-sm p-8 resize-none focus-visible:ring-0 leading-loose"
          />
        </CardContent>
      </Card>
    </div>
  );
}
