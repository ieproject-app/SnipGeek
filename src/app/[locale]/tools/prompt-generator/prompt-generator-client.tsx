'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Dictionary } from '@/lib/get-dictionary';

type PromptGeneratorProps = {
  dictionary: Dictionary['promptGenerator'];
};

export function PromptGeneratorClient({ dictionary }: PromptGeneratorProps) {
  const [draft, setDraft] = useState('');
  const [title, setTitle] = useState('');
  const [publishDate, setPublishDate] = useState<Date | undefined>(new Date());
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [heroImage, setHeroImage] = useState('https://placehold.co/1200x630/e2e8f0/64748b?text=Hero+Image');
  const [imageAlt, setImageAlt] = useState('');
  const [tags, setTags] = useState('');
  const [needsTranslation, setNeedsTranslation] = useState(true);

  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const buildPrompt = () => {
      let prompt = `Tolong buat dan terbitkan artikel blog baru untuk saya berdasarkan detail berikut.\n\n`;
      prompt += `**Detail Frontmatter:**\n`;
      prompt += `- Judul: ${title ? `"${title}"` : 'Tolong buatkan judul SEO-friendly berdasarkan konten.'}\n`;
      prompt += `- Tanggal Terbit: ${publishDate ? publishDate.toISOString() : new Date().toISOString()}\n`;
      prompt += `- Status: published: ${isPublished}, featured: ${isFeatured}\n`;
      prompt += `- heroImage: "${heroImage}"\n`;
      prompt += `- imageAlt: "${imageAlt}"\n`;
      if (tags) {
        const tagArray = tags.split(',').map(t => `"${t.trim()}"`).join(', ');
        prompt += `- tags: [${tagArray}]\n`;
      }
      prompt += `- Buatkan Terjemahan: ${needsTranslation ? 'Ya (Inggris & Indonesia), pastikan translationKey sama.' : 'Tidak.'}\n\n`;
      prompt += `---\n\n`;
      prompt += `**Konten/Draf Utama:**\n\n`;
      prompt += draft;
      
      setGeneratedPrompt(prompt);
    };

    buildPrompt();
  }, [draft, title, publishDate, isPublished, isFeatured, heroImage, imageAlt, tags, needsTranslation]);

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
  
  return (
    <div className="space-y-8">
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
                    initialFocus
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
                <div className="flex items-center space-x-2">
                    <Switch id="featured" checked={isFeatured} onCheckedChange={setIsFeatured} />
                    <Label htmlFor="featured">{dictionary.featuredSwitchLabel}</Label>
                </div>
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="heroImage">{dictionary.heroImageLabel}</Label>
            <Input id="heroImage" value={heroImage} onChange={(e) => setHeroImage(e.target.value)} />
            <p className="text-sm text-muted-foreground">{dictionary.heroImageDescription}</p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="imageAlt">{dictionary.imageAltLabel}</Label>
            <Input id="imageAlt" value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} />
            <p className="text-sm text-muted-foreground">{dictionary.imageAltDescription}</p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="tags">{dictionary.tagsLabel}</Label>
            <Input id="tags" placeholder={dictionary.tagsPlaceholder} value={tags} onChange={(e) => setTags(e.target.value)} />
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
        <CardHeader>
          <CardTitle>{dictionary.generatedPromptTitle}</CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <Textarea
            readOnly
            value={generatedPrompt}
            className="min-h-[300px] bg-muted/50 font-mono text-xs"
          />
          <Button onClick={handleCopy} size="icon" className="absolute top-4 right-4 sm:top-8 sm:right-8">
            {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span className="sr-only">{isCopied ? dictionary.copiedButton : dictionary.copyButton}</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
