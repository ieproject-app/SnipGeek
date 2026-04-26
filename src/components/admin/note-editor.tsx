"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useFirestore, setDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Save, ArrowLeft, Loader2, StickyNote } from "lucide-react";
import Link from "next/link";
import type { NoteFrontmatter } from "@/lib/notes";

interface NoteEditorProps {
  initialData?: Partial<{
    title: string;
    description: string;
    contentMdx: string;
    tags: string[];
    translationKey: string;
    locale: string | string[];
    date: NoteFrontmatter["date"];
  }>;
  id?: string;
}

export function NoteEditor({ initialData, id }: NoteEditorProps) {
  const db = useFirestore();
  const router = useRouter();
  const { locale } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    contentMdx: initialData?.contentMdx || "",
    tags: initialData?.tags?.join(", ") || "",
    translationKey: initialData?.translationKey || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsSubmitting(true);

    const docId = id || crypto.randomUUID();
    const noteData = {
      ...formData,
      id: docId,
      locale: initialData?.locale || locale || "en",
      published: true,
      tags: formData.tags
        .split(",")
        .map((t: string) => t.trim())
        .filter((t: string) => t !== ""),
      date: initialData?.date || new Date().toISOString(),
      updated: new Date().toISOString(),
      translationKey: formData.translationKey || `note-${docId}`,
    };

    setDocumentNonBlocking(doc(db, "notes_published", docId), noteData, {
      merge: true,
    });

    setTimeout(() => {
      setIsSubmitting(false);
      router.push("/admin/notes");
    }, 1000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="rounded-full">
            <Link href="/admin/notes">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <StickyNote className="h-6 w-6 text-amber-500" />
            <h1 className="font-display text-3xl font-bold tracking-tighter uppercase">
              Quick Note
            </h1>
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className=" shadow-amber-500/20 bg-amber-500 hover:bg-amber-600 h-11 px-8 font-bold"
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Note
        </Button>
      </header>

      <div className="space-y-6">
        <Card className="border-border">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                Title
              </Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Code snippet title..."
                className="text-lg font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                Description
              </Label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="What is this snippet for?"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                Snippet Content (Markdown)
              </Label>
              <Textarea
                value={formData.contentMdx}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    contentMdx: e.target.value,
                  }))
                }
                placeholder="Paste code blocks or notes here..."
                className="min-h-[300px] font-mono text-xs leading-relaxed"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                  Tags
                </Label>
                <Input
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, tags: e.target.value }))
                  }
                  placeholder="React, Tailwind, Hooks"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                  Translation Key (Optional)
                </Label>
                <Input
                  value={formData.translationKey}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      translationKey: e.target.value,
                    }))
                  }
                  placeholder="my-custom-note-key"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
