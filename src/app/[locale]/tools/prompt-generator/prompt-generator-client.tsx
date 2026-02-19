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
import { useToast } from '@/hooks/use-toast';
import type { Dictionary } from '@/lib/get-dictionary';
import { downloadLinks } from '@/lib/data-downloads';

type DownloadItem = {
  id: string;
  type: 'id' | 'url';
  value: string;
};

type PromptGeneratorProps = {
  dictionary: Dictionary['promptGenerator'];
};

export function PromptGeneratorClient({ dictionary }: PromptGeneratorProps) {
  const [contentType, setContentType] = useState<'blog' | 'note'>('blog');
  const [draft, setDraft] = useState('');
  
  // Feature Toggles
  const [showDownloads, setShowDownloads] = useState(false);
  const [showGrids, setShowGrids] = useState(false);
  const [showImages, setShowImages] = useState(true);

  const [downloadItems, setDownloadItems] = useState<DownloadItem[]>([]);
  const [imageGridMappings, setImageGridMappings] = useState('');
  const [images, setImages] = useState('');

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [publishDate, setPublishDate] = useState<string>('');
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [tags, setTags] = useState('');
  const [translationKey, setTranslationKey] = useState('');

  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const downloadIds = Object.keys(downloadLinks).sort();

  useEffect(() => {
    const buildPrompt = () => {
      const isBlog = contentType === 'blog';
      
      let prompt = isBlog
        ? `${dictionary.promptBaseBlog}\n\n`
        : `${dictionary.promptBaseNote}\n\n`;

      prompt += `**${dictionary.frontmatterDetails}:**\n`;
      prompt += `- ${dictionary.contentTypeLabel}: ${isBlog ? dictionary.contentTypeBlog : dictionary.contentTypeNote}\n`;
      prompt += `- ${dictionary.titleLabel}: ${title ? `"${title}"` : dictionary.titlePlaceholder}\n`;
      prompt += `- slug: "${slug}"\n`;
      prompt += `- translationKey: "${translationKey}"\n`;
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
        const finalHeroImageAlt = heroImageAlt || 'Please create a descriptive alt text.';

        prompt += `- heroImage: "${finalHeroImagePath}"\n`;
        prompt += `- imageAlt: "${finalHeroImageAlt}"\n`;
      }
      
      if (tags) {
        const tagArray = tags.split(',').map(t => `"${t.trim()}"`).join(', ');
        prompt += `- tags: [${tagArray}]\n`;
      } else {
        prompt += `- tags: Please generate relevant tags based on the content.\n`;
      }
      
      prompt += `\n`;

      if (isBlog && showImages && imageLines.length > 1) {
          prompt += `**${dictionary.supportingImagesLabel}:**\n`;
          imageLines.slice(1).forEach((line, index) => {
              const [imgPath, imgAlt] = line.split('|').map(s => s ? s.trim() : '');
              prompt += `- Image ${index + 1} Path: "${imgPath}"\n`;
              prompt += `- Image ${index + 1} Alt: "${imgAlt || `Please create alt text for supporting image ${index + 1}`}"\n`;
          });
          prompt += `\n`;
      }

      if (!isBlog && showImages && imageLines.length > 0) {
        prompt += `**${dictionary.supportingImagesLabelNote}:**\n`;
        imageLines.forEach((line) => {
            const [imgPath, imgAlt] = line.split('|').map(s => s ? s.trim() : '');
            if (imgPath) {
              prompt += `- Path: "${imgPath}"\n`;
              prompt += `- Alt: "${imgAlt || `Please create alt text for this image`}"\n`;
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
  }, [draft, title, slug, publishDate, isPublished, isFeatured, images, tags, translationKey, dictionary, contentType, downloadItems, imageGridMappings, showDownloads, showGrids, showImages]);

  const handleCopyMain = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setIsCopied(true);
    toast({
      title: dictionary.copiedButton,
      description: dictionary.copySuccessDescription,
    });
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

  const isBlog = contentType === 'blog';

  return (
    <div className="space-y-8">
      <Card>
          <CardHeader>
              <CardTitle>{dictionary.contentTypeLabel}</CardTitle>
          </CardHeader>
          <CardContent>
              <RadioGroup value={contentType} onValueChange={(value) => setContentType(value as 'blog' | 'note')} className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center space-x-2">
                      <RadioGroupItem value="blog" id="r-blog" />
                      <Label htmlFor="r-blog">{dictionary.contentTypeBlog}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                      <RadioGroupItem value="note" id="r-note" />
                      <Label htmlFor="r-note">{dictionary.contentTypeNote}</Label>
                  </div>
              </RadioGroup>
          </CardContent>
      </Card>

      <Card>
          <CardHeader>
              <CardTitle>{dictionary.features.title}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                  <Switch id="f-downloads" checked={showDownloads} onCheckedChange={setShowDownloads} />
                  <Label htmlFor="f-downloads">{dictionary.features.downloads}</Label>
              </div>
              <div className="flex items-center space-x-2">
                  <Switch id="f-grids" checked={showGrids} onCheckedChange={setShowGrids} />
                  <Label htmlFor="f-grids">{dictionary.features.grids}</Label>
              </div>
              <div className="flex items-center space-x-2">
                  <Switch id="f-images" checked={showImages} onCheckedChange={setShowImages} />
                  <Label htmlFor="f-images">{dictionary.features.images}</Label>
              </div>
          </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>{dictionary.draftTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder={dictionary.draftPlaceholder}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-h-[200px]"
          />
        </CardContent>
      </Card>

      {showDownloads && (
        <Card>
            <CardHeader>
                <CardTitle>{dictionary.downloadLinks.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Label className="text-sm text-muted-foreground block mb-2">
                    {dictionary.downloadLinks.description}
                </Label>
                
                {downloadItems.map((item, index) => (
                  <div key={item.id} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center p-3 border rounded-lg bg-muted/20">
                    <Badge variant="outline" className="shrink-0 mb-2 sm:mb-0">[DOWNLOAD_{index + 1}]</Badge>
                    
                    <Select value={item.type} onValueChange={(val) => updateDownloadItem(item.id, { type: val as 'id' | 'url', value: '' })}>
                      <SelectTrigger className="w-full sm:w-[140px] h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="id">
                          <div className="flex items-center gap-2"><Hash className="h-3 w-3"/> ID</div>
                        </SelectItem>
                        <SelectItem value="url">
                          <div className="flex items-center gap-2"><LinkIcon className="h-3 w-3"/> URL</div>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {item.type === 'id' ? (
                      <Select value={item.value} onValueChange={(val) => updateDownloadItem(item.id, { value: val })}>
                        <SelectTrigger className="flex-1 h-9">
                          <SelectValue placeholder={dictionary.downloadLinks.selectId || "Select ID..."} />
                        </SelectTrigger>
                        <SelectContent>
                          {downloadIds.map(id => <SelectItem key={id} value={id}>{id}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input 
                        placeholder={dictionary.downloadLinks.urlPlaceholder || "Paste URL..."} 
                        value={item.value} 
                        onChange={(e) => updateDownloadItem(item.id, { value: e.target.value })}
                        className="flex-1 h-9"
                      />
                    )}

                    <Button variant="ghost" size="icon" onClick={() => removeDownloadItem(item.id)} className="h-9 w-9 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
              <CardTitle>{dictionary.imageGrid.title}</CardTitle>
          </CardHeader>
          <CardContent>
              <Label htmlFor="grid-mappings" className="text-sm text-muted-foreground">
                  {dictionary.imageGrid.description}
              </Label>
              <Textarea
                  id="grid-mappings"
                  placeholder={dictionary.imageGrid.placeholder}
                  value={imageGridMappings}
                  onChange={(e) => setImageGridMappings(e.target.value)}
                  className="min-h-[120px] font-mono text-xs mt-2"
              />
          </CardContent>
        </Card>
      )}

      {showImages && (
       <Card>
        <CardHeader>
          <CardTitle>{isBlog ? dictionary.imagesTitle : dictionary.imagesTitleNote}</CardTitle>
        </CardHeader>
        <CardContent>
            <Label htmlFor="images" className="text-sm text-muted-foreground">
                {isBlog ? dictionary.imagesDescription : dictionary.imagesDescriptionNote}
            </Label>
            <Textarea
                id="images"
                placeholder={isBlog ? dictionary.imagesPlaceholder : dictionary.imagesPlaceholderNote}
                value={images}
                onChange={(e) => setImages(e.target.value)}
                className="min-h-[120px] font-mono text-xs mt-2"
            />
        </CardContent>
      </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>{dictionary.metadataTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="title">{dictionary.articleTitleLabel}</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <p className="text-sm text-muted-foreground">{dictionary.articleTitleDescription}</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="slug">{dictionary.slugLabel}</Label>
            <Input id="slug" placeholder={dictionary.slugPlaceholder} value={slug} onChange={(e) => setSlug(e.target.value)} />
            <p className="text-sm text-muted-foreground">{dictionary.slugDescription}</p>
          </div>

           <div className="grid gap-2">
            <Label htmlFor="translationKey">{dictionary.translationKeyLabel}</Label>
            <Input 
                id="translationKey" 
                placeholder={dictionary.translationKeyPlaceholder}
                value={translationKey}
                onChange={(e) => setTranslationKey(e.target.value)} 
            />
            <p className="text-sm text-muted-foreground">{dictionary.translationKeyDescription}</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="publishDate">{dictionary.publishDateLabel}</Label>
            <Input
                id="publishDate"
                type="text"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
                placeholder={dictionary.publishDatePlaceholder || 'YYYY-MM-DD'}
                className="w-full sm:w-[280px]"
            />
            <p className="text-sm text-muted-foreground">{dictionary.publishDateDescription}</p>
          </div>
          
          <div className="grid gap-2">
            <Label>{dictionary.statusLabel}</Label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center space-x-2">
                    <Switch id="published" checked={isPublished} onCheckedChange={setIsPublished} />
                    <Label htmlFor="published">{dictionary.publishSwitchLabel}</Label>
                </div>
                {isBlog && (
                    <div className="flex items-center space-x-2">
                        <Switch id="featured" checked={isFeatured} onCheckedChange={setIsFeatured} />
                        <Label htmlFor="featured">{dictionary.featuredSwitchLabel}</Label>
                    </div>
                )}
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="tags">{dictionary.tagsLabel}</Label>
            <Input id="tags" placeholder={dictionary.tagsPlaceholder} value={tags} onChange={(e) => setTags(e.target.value)} />
            <p className="text-sm text-muted-foreground">{dictionary.tagsDescription}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{dictionary.generatedPromptTitle}</CardTitle>
          <Button onClick={handleCopyMain} variant="ghost" size="icon" className="h-8 w-8">
            {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            <span className="sr-only">{isCopied ? dictionary.copiedButton : dictionary.copyButton}</span>
          </Button>
        </CardHeader>
        <CardContent>
          <Textarea
            readOnly
            value={generatedPrompt}
            className="min-h-[300px] bg-muted/50 font-mono text-xs"
          />
        </CardContent>
      </Card>
    </div>
  );
}
