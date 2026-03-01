'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useFirestore, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { uploadFile, deleteFile } from '@/firebase/storage';
import { slugify } from '@/lib/slugify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  ArrowLeft, 
  Image as ImageIcon, 
  Loader2, 
  Eye, 
  Code2, 
  Plus,
  Copy,
  Trash2,
  Star
} from 'lucide-react';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PostEditorProps {
  initialData?: any;
  id?: string;
}

export function PostEditor({ initialData, id }: PostEditorProps) {
  const db = useFirestore();
  const router = useRouter();
  const { locale: currentLocale } = useParams();
  const { toast } = useToast();
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
    images: initialData?.images || [], // Array of {url, alt}
    locale: initialData?.locale || currentLocale || 'en'
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData(prev => ({
      ...prev,
      title,
      slug: initialData ? prev.slug : slugify(title)
    }));
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadedImages = [...formData.images];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = `${Date.now()}-${file.name}`;
        const path = `blog-posts/${fileName}`;
        const url = await uploadFile(file, path);
        uploadedImages.push({ url, alt: file.name.split('.')[0] });
      }

      setFormData(prev => ({ 
        ...prev, 
        images: uploadedImages,
        // Set first image as hero if none exists
        heroImageUrl: prev.heroImageUrl || uploadedImages[0].url,
        heroImageAltText: prev.heroImageAltText || uploadedImages[0].alt
      }));

      toast({
        title: "Berhasil!",
        description: `${files.length} gambar berhasil diunggah.`,
      });
    } catch (error: any) {
      console.error("Upload failed", error);
      toast({
        variant: "destructive",
        title: "Gagal Mengunggah",
        description: error.message || "Pastikan izin Storage sudah benar.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const deleteMedia = async (index: number) => {
    const imgToDelete = formData.images[index];
    const newImages = formData.images.filter((_: any, i: number) => i !== index);
    
    setFormData(prev => ({ 
      ...prev, 
      images: newImages,
      heroImageUrl: prev.heroImageUrl === imgToDelete.url ? (newImages[0]?.url || '') : prev.heroImageUrl
    }));

    toast({
      title: "Gambar dihapus",
      description: "Gambar telah dihapus dari galeri lokal artikel ini.",
    });
  };

  const copyMdx = (url: string, alt: string) => {
    const mdx = `![${alt}](${url})`;
    navigator.clipboard.writeText(mdx);
    toast({
      title: "MDX Tersalin!",
      description: "Silakan paste di editor konten.",
    });
  };

  const setAsHero = (url: string, alt: string) => {
    setFormData(prev => ({ ...prev, heroImageUrl: url, heroImageAltText: alt }));
    toast({
      title: "Hero Image Diperbarui",
      description: "Gambar ini sekarang menjadi gambar utama artikel.",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.contentMdx) {
        toast({
            variant: "destructive",
            title: "Data Kurang",
            description: "Judul dan konten wajib diisi.",
        });
        return;
    }

    setIsSubmitting(true);

    const docId = id || crypto.randomUUID();
    const currentCollection = formData.isPublished ? 'blogPosts_published' : 'blogPosts_drafts';
    const oldCollection = initialData?.isPublished ? 'blogPosts_published' : 'blogPosts_drafts';

    const postData = {
      ...formData,
      id: docId,
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
      toast({
        title: "Tersimpan",
        description: "Artikel berhasil diperbarui di database.",
      });
      router.push('/admin/posts');
    }, 1000);
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="rounded-full">
            <Link href="/admin/posts"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="font-headline text-3xl font-black tracking-tighter uppercase">
                {id ? 'Edit Article' : 'New Article'}
            </h1>
            <p className="text-xs text-muted-foreground font-mono">ID: {id || 'NEW'}</p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={isSubmitting} className="rounded-lg shadow-lg shadow-primary/20 h-11 px-8 font-bold">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {id ? 'Update Content' : 'Save & Continue'}
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Main Content & Media */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="border-primary/10 overflow-hidden shadow-sm">
            <Tabs defaultValue="write" className="w-full">
                <CardHeader className="border-b bg-muted/5 p-0">
                    <div className="flex items-center justify-between px-6 py-2">
                        <TabsList className="bg-transparent border-none">
                            <TabsTrigger value="write" className="gap-2 data-[state=active]:bg-background"><Code2 className="h-3.5 w-3.5" /> Write</TabsTrigger>
                            <TabsTrigger value="media" className="gap-2 data-[state=active]:bg-background"><ImageIcon className="h-3.5 w-3.5" /> Media Gallery</TabsTrigger>
                            <TabsTrigger value="preview" className="gap-2 data-[state=active]:bg-background"><Eye className="h-3.5 w-3.5" /> Preview</TabsTrigger>
                        </TabsList>
                    </div>
                </CardHeader>
                
                <TabsContent value="write" className="m-0 p-6">
                  <Textarea 
                    placeholder="Tulis konten MDX Anda di sini..."
                    className="min-h-[650px] font-mono text-sm leading-relaxed border-none focus-visible:ring-0 resize-none p-0 bg-transparent"
                    value={formData.contentMdx}
                    onChange={(e) => setFormData(prev => ({ ...prev, contentMdx: e.target.value }))}
                  />
                </TabsContent>

                <TabsContent value="media" className="m-0 p-6 space-y-6 min-h-[650px]">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Post Media</h3>
                            <p className="text-[10px] text-muted-foreground uppercase">Upload and manage images for this article.</p>
                        </div>
                        <div className="relative">
                            <input 
                                type="file" 
                                multiple 
                                accept="image/*" 
                                onChange={handleMediaUpload} 
                                className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                                disabled={isUploading}
                            />
                            <Button variant="outline" className="gap-2" disabled={isUploading}>
                                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                Upload Images
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {formData.images.map((img: any, idx: number) => (
                            <div key={idx} className={cn(
                                "group relative aspect-square rounded-lg border overflow-hidden bg-muted transition-all",
                                formData.heroImageUrl === img.url ? "ring-2 ring-accent border-accent" : "hover:border-primary/30"
                            )}>
                                <Image src={img.url} alt={img.alt} fill className="object-cover" />
                                
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                    <Button 
                                        size="sm" 
                                        variant="secondary" 
                                        className="w-full h-7 text-[10px] gap-1 px-2"
                                        onClick={() => copyMdx(img.url, img.alt)}
                                    >
                                        <Copy className="h-3 w-3" /> MDX Code
                                    </Button>
                                    <div className="flex w-full gap-1">
                                        <Button 
                                            size="icon" 
                                            variant={formData.heroImageUrl === img.url ? "default" : "secondary"} 
                                            className="flex-1 h-7"
                                            onClick={() => setAsHero(img.url, img.alt)}
                                            title="Set as Hero"
                                        >
                                            <Star className={cn("h-3 w-3", formData.heroImageUrl === img.url && "fill-current")} />
                                        </Button>
                                        <Button 
                                            size="icon" 
                                            variant="destructive" 
                                            className="flex-1 h-7"
                                            onClick={() => deleteMedia(idx)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>

                                {formData.heroImageUrl === img.url && (
                                    <Badge className="absolute top-1 left-1 bg-accent text-accent-foreground text-[8px] font-black h-4 px-1.5 uppercase">Hero</Badge>
                                )}
                            </div>
                        ))}
                        {formData.images.length === 0 && !isUploading && (
                            <div className="col-span-full py-20 text-center border-2 border-dashed rounded-lg bg-muted/20">
                                <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground opacity-20 mb-2" />
                                <p className="text-xs font-bold text-muted-foreground/40 uppercase">No images uploaded yet</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="preview" className="m-0 p-8 prose prose-slate dark:prose-invert max-w-none bg-background min-h-[650px]">
                  <div className="whitespace-pre-wrap">{formData.contentMdx || 'Nothing to preview yet...'}</div>
                </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Right: Sidebar / Settings */}
        <div className="lg:col-span-4 space-y-8">
          {/* Featured Image Card */}
          <Card className="border-primary/10 overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/5 py-3 border-b">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <Star className="h-3 w-3 text-accent" /> Featured Image (Hero)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="relative aspect-video rounded-lg bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-primary/10 shadow-inner">
                {formData.heroImageUrl ? (
                  <Image src={formData.heroImageUrl} alt="Hero" fill className="object-cover" />
                ) : (
                  <div className="text-center p-4">
                    <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground opacity-20 mb-2" />
                    <p className="text-[10px] font-bold text-muted-foreground/40 uppercase">Select from gallery</p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Alt Text (SEO)</Label>
                <Input 
                  placeholder="Descriptive image description..." 
                  value={formData.heroImageAltText}
                  onChange={(e) => setFormData(prev => ({ ...prev, heroImageAltText: e.target.value }))}
                  className="bg-muted/30 h-9 text-xs"
                />
              </div>
            </CardContent>
          </Card>

          {/* Metadata Card */}
          <Card className="border-primary/10 shadow-sm">
            <CardHeader className="bg-muted/5 py-3 border-b">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Language</Label>
                <div className="flex gap-2">
                    <Button 
                        type="button" 
                        variant={formData.locale === 'en' ? 'default' : 'outline'} 
                        className="flex-1 h-8 text-[10px] font-black uppercase"
                        onClick={() => setFormData(prev => ({ ...prev, locale: 'en' }))}
                    >English</Button>
                    <Button 
                        type="button" 
                        variant={formData.locale === 'id' ? 'default' : 'outline'} 
                        className="flex-1 h-8 text-[10px] font-black uppercase"
                        onClick={() => setFormData(prev => ({ ...prev, locale: 'id' }))}
                    >Indonesia</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Title</Label>
                <Input value={formData.title} onChange={handleTitleChange} placeholder="Article Title" className="font-bold h-10" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Slug (URL)</Label>
                <Input value={formData.slug} onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))} placeholder="url-friendly-slug" className="font-mono text-xs h-9" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Category</Label>
                <Input value={formData.category} onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))} placeholder="e.g. Tutorial" className="h-9" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Excerpt</Label>
                <Textarea value={formData.excerpt} onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))} placeholder="Brief summary..." className="h-24 text-xs leading-relaxed" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Tags (Koma pisah)</Label>
                <Input value={formData.tags} onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))} placeholder="Windows, Tech, Hardware" className="h-9" />
              </div>
            </CardContent>
          </Card>

          {/* Publish Settings */}
          <Card className="border-primary/10 bg-emerald-500/[0.02] shadow-sm">
            <CardHeader className="py-3 border-b">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest">Publish Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold">Publish Article</Label>
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">Visible on the blog</p>
                </div>
                <Switch 
                  checked={formData.isPublished} 
                  onCheckedChange={(val) => setFormData(prev => ({ ...prev, isPublished: val }))} 
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold">Featured</Label>
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">Hero gallery placement</p>
                </div>
                <Switch 
                  checked={formData.featured} 
                  onCheckedChange={(val) => setFormData(prev => ({ ...prev, featured: val }))} 
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}