'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Plus, Trash2, Link as LinkIcon, Hash } from 'lucide-react';
import { downloadLinks } from '@/lib/data-downloads';
import { useNotification } from '@/hooks/use-notification';

type DownloadItem = {
  id: string;
  type: 'id' | 'url';
  value: string;
};

export function PromptGeneratorClient({ dictionary }: { dictionary: any }) {
  const [contentType, setContentType] = useState<'blog' | 'note'>('blog');
  const [draft, setDraft] = useState('');
  
  // Feature Toggles (Persisted in localStorage)
  const [showDownloads, setShowDownloads] = useState(false);
  const [showGrids, setShowGrids] = useState(false);
  const [showImages, setShowImages] = useState(true);

  // Download Items & Grid Logic
  const [downloadItems, setDownloadItems] = useState<DownloadItem[]>([]);
  const [imageGridMappings, setImageGridMappings] = useState('');
  const [images, setImages] = useState('');

  // Simplified Metadata
  const [publishDate, setPublishDate] = useState<string>('');
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const { notify } = useNotification();

  const downloadIds = Object.keys(downloadLinks).sort();

  // Load persisted features
  useEffect(() => {
    const savedFeatures = localStorage.getItem('snipgeek-prompt-features');
    if (savedFeatures) {
      try {
        const parsed = JSON.parse(savedFeatures);
        setShowDownloads(!!parsed.showDownloads);
        setShowGrids(!!parsed.showGrids);
        setShowImages(parsed.showImages !== undefined ? !!parsed.showImages : true);
      } catch (e) {
        console.error("Failed to load persisted features", e);
      }
    }
  }, []);

  // Save features on change
  useEffect(() => {
    localStorage.setItem('snipgeek-prompt-features', JSON.stringify({
      showDownloads,
      showGrids,
      showImages
    }));
  }, [showDownloads, showGrids, showImages]);

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

        const finalHeroImagePath = heroImagePath || "/images/blank/blank.webp";
        const finalHeroImageAlt = heroImageAlt || '[AI: PLEASE GENERATE DESCRIPTIVE SEO ALT TEXT]';

        prompt += `- heroImage: "${finalHeroImagePath}"\n`;
        prompt += `- imageAlt: "${finalHeroImageAlt}"\n`;
      }
      
      prompt += `- tags: [AI: Generate 3-5 relevant tags as an array of strings]\n`;
      prompt += `\n`;

      if (isBlog && showImages && imageLines.length > 1) {
          prompt += `**${dictionary.supportingImagesLabel}:**\n`;
          imageLines.slice(1).forEach((line, index) => {
              const [imgPath, imgAlt] = line.split('|').map(s => s ? s.trim() : '');
              prompt += `- Image ${index + 1} Path: "${imgPath}"\n`;
              prompt += `- Image ${index + 1} Alt: "${imgAlt || '[AI: PLEASE GENERATE DESCRIPTIVE SEO ALT TEXT]'}"\n`;
          });
          prompt += `\n`;
      }

      if (!isBlog && showImages && imageLines.length > 0) {
        prompt += `**${dictionary.supportingImagesLabelNote}:**\n`;
        imageLines.forEach((line) => {
            const [imgPath, imgAlt] = line.split('|').map(s => s ? s.trim() : '');
            if (imgPath) {
              prompt += `- Path: "${imgPath}"\n`;
              prompt += `- Alt: "${imgAlt || '[AI: PLEASE GENERATE DESCRIPTIVE SEO ALT TEXT]'}"\n`;
            }
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
                prompt += `- Placeholder [DOWNLOAD_${index + 1}] -> Use New URL: "${item.value}" (Please recommend a suitable kebab-case ID for this URL and use it in the component)\n`;
              }
          });
          prompt += `\n`;
      }

      if (showGrids && imageGridMappings && dictionary.imageGrid) {
        prompt += `\n**${dictionary.imageGrid.promptTitle}:**\n`;
        prompt += `${dictionary.imageGrid.promptInstruction}\n`;
        
        const gridMappings = imageGridMappings.split('\n').filter(line => line.trim() !== '');
        gridMappings.forEach((line, index) => {
            const parts = line.split('|').map(s => s.trim());
            if (parts.length >= 2) {
                const [cols, pathsStr] = parts;
                const paths = pathsStr.split(',').map(p => p.trim());
                prompt += `- Placeholder [GRID_${index + 1}] -> Columns: ${cols}, Paths: ${paths.join(', ')}\n`;
            }
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
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
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
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Toggles & Metadata */}
        <div className="space-y-8">
          <Card>
              <CardHeader>
                  <CardTitle className="text-lg">{dictionary.contentTypeLabel}</CardTitle>
              </CardHeader>
              <CardContent>
                  <RadioGroup value={contentType} onValueChange={(value) => setContentType(value as 'blog' | 'note')} className="flex flex-col sm:flex-row gap-4">
                      <div className="flex items-center space-x-2">
                          <RadioGroupItem value="blog" id="r-blog" />
                          <Label htmlFor="r-blog" className="cursor-pointer">{dictionary.contentTypeBlog}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                          <RadioGroupItem value="note" id="r-note" />
                          <Label htmlFor="r-note" className="cursor-pointer">{dictionary.contentTypeNote}</Label>
                      </div>
                  </RadioGroup>
              </CardContent>
          </Card>

          <Card>
              <CardHeader>
                  <CardTitle className="text-lg">{dictionary.features.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                      <Label htmlFor="f-downloads" className="cursor-pointer">{dictionary.features.downloads}</Label>
                      <Switch id="f-downloads" checked={showDownloads} onCheckedChange={setShowDownloads} />
                  </div>
                  <div className="flex items-center justify-between">
                      <Label htmlFor="f-grids" className="cursor-pointer">{dictionary.features.grids}</Label>
                      <Switch id="f-grids" checked={showGrids} onCheckedChange={setShowGrids} />
                  </div>
                  <div className="flex items-center justify-between">
                      <Label htmlFor="f-images" className="cursor-pointer">{dictionary.features.images}</Label>
                      <Switch id="f-images" checked={showImages} onCheckedChange={setShowImages} />
                  </div>
              </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{dictionary.metadataTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="publishDate">{dictionary.publishDateLabel}</Label>
                <Input
                    id="publishDate"
                    type="text"
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                    placeholder={dictionary.publishDatePlaceholder || 'YYYY-MM-DD'}
                />
              </div>
              
              <div className="grid gap-2">
                <Label>{dictionary.statusLabel}</Label>
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="published" className="text-xs font-normal cursor-pointer">{dictionary.publishSwitchLabel}</Label>
                        <Switch id="published" checked={isPublished} onCheckedChange={setIsPublished} />
                    </div>
                    {contentType === 'blog' && (
                        <div className="flex items-center justify-between">
                            <Label htmlFor="featured" className="text-xs font-normal cursor-pointer">{dictionary.featuredSwitchLabel}</Label>
                            <Switch id="featured" checked={isFeatured} onCheckedChange={setIsFeatured} />
                        </div>
                    )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Main Inputs */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{dictionary.draftTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder={dictionary.draftPlaceholder}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="min-h-[300px] text-sm"
              />
            </CardContent>
          </Card>

          {showDownloads && (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{dictionary.downloadLinks.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {downloadItems.map((item, index) => (
                      <div key={item.id} className="flex flex-col gap-2 p-3 border rounded-lg bg-muted/20">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="shrink-0">[DOWNLOAD_{index + 1}]</Badge>
                          <Button variant="ghost" size="icon" onClick={() => removeDownloadItem(item.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="flex gap-2">
                          <Select value={item.type} onValueChange={(val) => updateDownloadItem(item.id, { type: val as 'id' | 'url', value: '' })}>
                            <SelectTrigger className="w-[100px] h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="id">ID</SelectItem>
                              <SelectItem value="url">URL</SelectItem>
                            </SelectContent>
                          </Select>

                          {item.type === 'id' ? (
                            <Select value={item.value} onValueChange={(val) => updateDownloadItem(item.id, { value: val })}>
                              <SelectTrigger className="flex-1 h-9">
                                <SelectValue placeholder="..." />
                              </SelectTrigger>
                              <SelectContent>
                                {downloadIds.map(id => <SelectItem key={id} value={id}>{id}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input 
                              placeholder="Paste URL..." 
                              value={item.value} 
                              onChange={(e) => updateDownloadItem(item.id, { value: e.target.value })}
                              className="flex-1 h-9"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                    <Button onClick={addDownloadItem} variant="outline" size="sm" className="w-full border-dashed">
                      <Plus className="h-4 w-4 mr-2" /> {dictionary.downloadLinks.addDownload || "Add Download"}
                    </Button>
                </CardContent>
            </Card>
          )}

          {(showGrids && dictionary.imageGrid) && (
            <Card>
              <CardHeader>
                  <CardTitle className="text-lg">{dictionary.imageGrid.title}</CardTitle>
              </CardHeader>
              <CardContent>
                  <Textarea
                      placeholder={dictionary.imageGrid.placeholder}
                      value={imageGridMappings}
                      onChange={(e) => setImageGridMappings(e.target.value)}
                      className="min-h-[100px] font-mono text-xs"
                  />
              </CardContent>
            </Card>
          )}

          {showImages && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{contentType === 'blog' ? dictionary.imagesTitle : dictionary.imagesTitleNote}</CardTitle>
            </CardHeader>
            <CardContent>
                <Textarea
                    placeholder={contentType === 'blog' ? dictionary.imagesPlaceholder : dictionary.imagesPlaceholderNote}
                    value={images}
                    onChange={(e) => setImages(e.target.value)}
                    className="min-h-[100px] font-mono text-xs"
                />
            </CardContent>
          </Card>
          )}
        </div>
      </div>

      <Card className="border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30">
          <CardTitle className="text-lg">{dictionary.generatedPromptTitle}</CardTitle>
          <Button onClick={handleCopyMain} variant="default" size="sm" className="gap-2">
            {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {isCopied ? dictionary.copiedButton : dictionary.copyButton}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Textarea
            readOnly
            value={generatedPrompt}
            className="min-h-[400px] border-none rounded-none bg-muted/10 font-mono text-xs resize-none focus-visible:ring-0"
          />
        </CardContent>
      </Card>
    </div>
  );
}
