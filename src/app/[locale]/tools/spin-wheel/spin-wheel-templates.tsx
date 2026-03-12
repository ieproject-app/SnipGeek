'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Star, ChevronDown, Check, Sparkles } from 'lucide-react';

// ─── Data ────────────────────────────────────────────────────────────────────

interface Template { id: string; name: string; items: string[]; }
interface Category { id: string; title: string; icon: React.ReactNode; templates: Template[]; }

const CATEGORIES: Category[] = [
  {
    id: "quran",
    title: "Al-Qur'an",
    icon: <BookOpen className="w-4 h-4 text-emerald-500" />,
    templates: [
      {
        id: "q1", name: "Surah Pendek",
        items: ["Al-Fatihah","An-Nas","Al-Falaq","Al-Ikhlas","Al-Lahab","An-Nasr","Al-Kafirun","Al-Kausar","Al-Maun"],
      },
      {
        id: "q2", name: "Juz Amma",
        items: ["An-Naba'","An-Nazi'at","'Abasa","At-Takwir","Al-Infitar","Al-Mutaffifin","Al-Inshiqaq"],
      },
    ],
  },
  {
    id: "prayers",
    title: "Doa Harian",
    icon: <Star className="w-4 h-4 text-amber-500" />,
    templates: [
      {
        id: "p1", name: "Aktivitas Harian",
        items: ["Doa Bangun Tidur","Doa Sebelum Tidur","Doa Masuk Rumah","Doa Keluar Rumah","Doa Makan","Doa Sesudah Makan"],
      },
    ],
  },
  {
    id: "misc",
    title: "Umum",
    icon: <Sparkles className="w-4 h-4 text-violet-500" />,
    templates: [
      {
        id: "m1", name: "Hari dalam Seminggu",
        items: ["Senin","Selasa","Rabu","Kamis","Jumat","Sabtu","Minggu"],
      },
      {
        id: "m2", name: "Yes / No / Maybe",
        items: ["Yes","No","Maybe","Ask Again","Definitely!","Skip This"],
      },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface SpinWheelTemplatesProps {
  onSelectTemplate: (items: string[], context?: string) => void;
}

export function SpinWheelTemplates({ onSelectTemplate }: SpinWheelTemplatesProps) {
  const [selected, setSelected] = useState<Template | null>(null);
  const [open, setOpen] = useState<Set<string>>(new Set(["quran"]));

  const toggle = (id: string) =>
    setOpen(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  return (
    <div className="flex h-[500px] divide-x">
      {/* Left: category + template list */}
      <ScrollArea className="w-1/2 p-3">
        <div className="space-y-1">
          {CATEGORIES.map(cat => (
            <div key={cat.id}>
              <button
                onClick={() => toggle(cat.id)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-muted/50 transition-colors text-sm font-bold"
              >
                <span className="flex items-center gap-2">
                  {cat.icon} {cat.title}
                </span>
                <ChevronDown
                  className={cn(
                    "w-3.5 h-3.5 text-muted-foreground transition-transform duration-200",
                    open.has(cat.id) && "rotate-180"
                  )}
                />
              </button>

              {open.has(cat.id) && (
                <div className="ml-4 mt-1 mb-2 space-y-1">
                  {cat.templates.map(tpl => (
                    <button
                      key={tpl.id}
                      onClick={() => setSelected(tpl)}
                      className={cn(
                        "w-full text-left text-xs px-3 py-2.5 rounded-xl transition-all flex items-center justify-between group",
                        selected?.id === tpl.id
                          ? "bg-primary text-primary-foreground font-bold shadow-sm"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground font-medium"
                      )}
                    >
                      <span>{tpl.name}</span>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full font-mono",
                        selected?.id === tpl.id
                          ? "bg-white/20"
                          : "bg-muted-foreground/10"
                      )}>
                        {tpl.items.length}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Right: preview */}
      <div className="w-1/2 flex flex-col bg-muted/20">
        {selected ? (
          <div className="flex flex-col h-full p-4 gap-4">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-sm text-primary">{selected.name}</h4>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                {selected.items.length} item
              </span>
            </div>

            <ScrollArea className="flex-1 border-2 rounded-xl bg-card p-3">
              <ul className="space-y-1.5">
                {selected.items.map((item, i) => (
                  <li key={i} className="text-xs font-medium flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </ScrollArea>

            <Button
              onClick={() => {
                // Find which category this template belongs to
                const cat = CATEGORIES.find(c => c.templates.some(t => t.id === selected.id));
                onSelectTemplate(selected.items, cat?.id);
              }}
              className="w-full h-11 font-black gap-2 text-sm"
            >
              <Check className="w-4 h-4" />
              Gunakan Templat Ini
            </Button>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 gap-4 opacity-40">
            <BookOpen className="w-12 h-12" />
            <p className="font-bold text-sm text-muted-foreground">
              Pilih templat untuk pratinjau isi roda
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
