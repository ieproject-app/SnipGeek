'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Dictionary } from '@/lib/get-dictionary';

type PromptGeneratorProps = {
  dictionary: Dictionary['promptGenerator'];
};

export function PromptGeneratorClient({ dictionary }: PromptGeneratorProps) {
  const [contentType, setContentType] = useState<'blog' | 'note'>('blog');
  const [draft, setDraft] = useState('');
  const [title, setTitle] = useState('');
  const [publishDate, setPublishDate] = useState<Date | undefined>(new Date());
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [images, setImages] = useState('');
  const [tags, setTags] = useState('');
  const [needsTranslation, setNeedsTranslation] = useState(true);

  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const buildPrompt = () => {
      const isBlog = contentType === 'blog';
      
      let prompt = isBlog
        ? `${dictionary.promptBaseBlog}\n\n`
        : `${dictionary.promptBaseNote}\n\n`;

      prompt += `**${dictionary.frontmatterDetails}:**\n`;
      prompt += `- ${dictionary.contentTypeLabel}: ${isBlog ? dictionary.contentTypeBlog : dictionary.contentTypeNote}\n`;
      prompt += `- ${dictionary.titleLabel}: ${title ? `"${title}"` : dictionary.titlePlaceholder}\n`;
      prompt += `- ${dictionary.dateLabel}: ${publishDate ? publishDate.toISOString() : new Date().toISOString()}\n`;
      
      let frontmatterStatus = `published: ${isPublished}`;
      if (isBlog) {
        frontmatterStatus += `, featured: ${isFeatured}`;
      }
      prompt += `- ${dictionary.statusLabel}: ${frontmatterStatus}\n`;

      const imageLines = images.split('\n').filter(line => line.trim() !== '');

      if (isBlog) {
        const heroImageLine = imageLines.length > 0 ? imageLines[0] : '';
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
      prompt += `- ${dictionary.translationLabel}: ${needsTranslation ? dictionary.translationYes : dictionary.translationNo}\n\n`;

      if (isBlog && imageLines.length > 1) {
          prompt += `**${dictionary.supportingImagesLabel}:**\n`;
          imageLines.slice(1).forEach((line, index) => {
              const [imgPath, imgAlt] = line.split('|').map(s => s ? s.trim() : '');
              prompt += `- Image ${index + 1} Path: "${imgPath}"\n`;
              prompt += `- Image ${index + 1} Alt: "${imgAlt || `Please create alt text for supporting image ${index + 1}`}"\n`;
          });
          prompt += `\n`;
      }

      if (!isBlog && imageLines.length > 0) {
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

      prompt += `---\n\n`;
      prompt += `**${dictionary.draftContentLabel}:**\n\n`;
      prompt += draft;
      prompt += `\n\n---\n**${dictionary.finalInstruction}**`;
      
      setGeneratedPrompt(prompt);
    };

    buildPrompt();
  }, [draft, title, publishDate, isPublished, isFeatured, images, tags, needsTranslation, dictionary, contentType]);

  const handleCopy = () => {
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
            <Label>{dictionary.publishDateLabel}</Label>
             <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full sm:w-[280px] justify-start text-left font-normal",
                      !publishDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {publishDate ? format(publishDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={publishDate}
                    onSelect={setPublishDate}
                  />
                </PopoverContent>
              </Popover>
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

          <div className="grid gap-2">
            <Label>{dictionary.languageTitle}</Label>
             <div className="flex items-center space-x-2">
                <Switch id="translation" checked={needsTranslation} onCheckedChange={setNeedsTranslation} />
                <Label htmlFor="translation">{dictionary.translationSwitchLabel}</Label>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{dictionary.generatedPromptTitle}</CardTitle>
          <Button onClick={handleCopy} variant="ghost" size="icon" className="h-8 w-8">
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
