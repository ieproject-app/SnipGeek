
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useFirestore, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { uploadFile } from '@/firebase/storage';
import { slugify } from '@/lib/slugify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Save, 
  ArrowLeft, 
  Image as ImageIcon, 
  Loader2, 
  Eye, 
  Code2, 
  CheckCircle2 
} from 'lucide-react';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

interface PostEditorProps {
  initialData?: any;
  id?: string;
}

export function PostEditor({ initialData, id }: PostEditorProps) {
  const db = useFirestore();
  const router = useRouter();
  const { locale } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    excerpt: initialData?.excerpt || '',
    contentMdx: initialData?.contentMdx || '',
    heroImageUrl: initialData?.heroImageUrl || '',
    heroImageAltText: initialData?.heroImageAltText || '',
    isPublished: initialData?.isPublished ?? false,
    featured: initialData?.featured ?? false,
    category: initialData?.category || '',
    tags: initialData?.tags?.join(', ') || '',
    translationKey: initialData?.translationKey || '',
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData(prev => ({
      ...prev,
      title,
      slug: initialData ? prev.slug : slugify(title)
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const path = `blog-posts/${fileName}`;
      const url = await uploadFile(file, path);
      setFormData(prev => ({ ...prev, heroImageUrl: url }));
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const docId = id || crypto.randomUUID();
    const currentCollection = formData.isPublished ? 'blogPosts_published' : 'blogPosts_drafts';
    const oldCollection = initialData?.isPublished ? 'blogPosts_published' : 'blogPosts_drafts';

    const postData = {
      ...formData,
      id: docId,
      locale: initialData?.locale || locale || 'en',
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t !== ''),
      publishDate: initialData?.publishDate || new Date().toISOString(),
      updatedDate: new Date().toISOString(),
      translationKey: formData.translationKey || `blog-${docId}`,
      authorId: 'admin-user', 
    };

    if (id && currentCollection !== oldCollection) {
      deleteDocumentNonBlocking(doc(db, oldCollection, id));
    }

    setDocumentNonBlocking(doc(db, currentCollection, docId), postData, { merge: true });
    
    setTimeout(() => {
      setIsSubmitting(false);
      router.push('/admin/posts');
    }, 1000);
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="rounded-full">
            <Link href="/admin/posts"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <h1 className="font-headline text-3xl font-black tracking-tighter uppercase">
            {id ? 'Edit Article' : 'New Article'}
          </h1>
        </div>
        <Button onClick={handleSubmit} disabled={isSubmitting} className="rounded-lg shadow-lg shadow-primary/20 h-11 px-8 font-bold">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {id ? 'Update Content' : 'Save & Continue'}
        </Button>
      </header>

      <form className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Main Content */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="border-primary/10">
            <CardHeader className="border-b bg-muted/5">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Editor</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="write" className="w-full">
                <div className="flex items-center justify-between px-6 py-2 border-b bg-muted/10">
                  <TabsList className="bg-transparent border-none">
                    <TabsTrigger value="write" className="gap-2 data-[state=active]:bg-background"><Code2 className="h-3.5 w-3.5" /> Write</TabsTrigger>
                    <TabsTrigger value="preview" className="gap-2 data-[state=active]:bg-background"><Eye className="h-3.5 w-3.5" /> Preview</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="write" className="m-0 p-6">
                  <Textarea 
                    placeholder="Write your MDX content here..."
                    className="min-h-[600px] font-mono text-sm leading-relaxed border-none focus-visible:ring-0 resize-none p-0"
                    value={formData.contentMdx}
                    onChange={(e) => setFormData(prev => ({ ...prev, contentMdx: e.target.value }))}
                  />
                </TabsContent>
                <TabsContent value="preview" className="m-0 p-8 prose prose-slate dark:prose-invert max-w-none bg-background min-h-[600px]">
                  <div className="whitespace-pre-wrap">{formData.contentMdx || 'Nothing to preview yet...'}</div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right: Sidebar / Settings */}
        <div className="lg:col-span-4 space-y-8">
          {/* Hero Image Card */}
          <Card className="border-primary/10 overflow-hidden">
            <CardHeader className="bg-muted/5 py-3 border-b">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <ImageIcon className="h-3 w-3 text-sky-500" /> Hero Image
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="relative aspect-video rounded-lg bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-primary/10">
                {formData.heroImageUrl ? (
                  <Image src={formData.heroImageUrl} alt="Hero" fill className="object-cover" />
                ) : (
                  <div className="text-center p-4">
                    <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground opacity-20 mb-2" />
                    <p className="text-[10px] font-bold text-muted-foreground/40 uppercase">No image selected</p>
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <Input type="file" accept="image/*" onChange={handleImageUpload} className="cursor-pointer text-xs" />
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Alt Text (SEO)</Label>
                <Input 
                  placeholder="Descriptive image description..." 
                  value={formData.heroImageAltText}
                  onChange={(e) => setFormData(prev => ({ ...prev, heroImageAltText: e.target.value }))}
                  className="bg-muted/30"
                />
              </div>
            </CardContent>
          </Card>

          {/* Metadata Card */}
          <Card className="border-primary/10">
            <CardHeader className="bg-muted/5 py-3 border-b">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Title</Label>
                <Input value={formData.title} onChange={handleTitleChange} placeholder="Article Title" className="font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Slug (URL)</Label>
                <Input value={formData.slug} onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))} placeholder="url-friendly-slug" className="font-mono text-xs" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Translation Key</Label>
                <Input value={formData.translationKey} onChange={(e) => setFormData(prev => ({ ...prev, translationKey: e.target.value }))} placeholder="my-blog-key" className="font-mono text-xs" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Category</Label>
                <Input value={formData.category} onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))} placeholder="e.g. Tutorial" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Excerpt</Label>
                <Textarea value={formData.excerpt} onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))} placeholder="Brief summary..." className="h-20 text-xs" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Tags (Comma separated)</Label>
                <Input value={formData.tags} onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))} placeholder="Windows, Tech, Hardware" />
              </div>
            </CardContent>
          </Card>

          {/* Publish Settings */}
          <Card className="border-primary/10 bg-emerald-500/[0.02]">
            <CardHeader className="py-3 border-b">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest">Publish Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold">Publish Article</Label>
                  <p className="text-[10px] text-muted-foreground">Make it visible on the blog.</p>
                </div>
                <Switch 
                  checked={formData.isPublished} 
                  onCheckedChange={(val) => setFormData(prev => ({ ...prev, isPublished: val }))} 
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold">Featured</Label>
                  <p className="text-[10px] text-muted-foreground">Show in the hero gallery.</p>
                </div>
                <Switch 
                  checked={formData.featured} 
                  onCheckedChange={(val) => setFormData(prev => ({ ...prev, featured: val }))} 
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
