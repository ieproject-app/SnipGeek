'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { Heading } from '@/lib/mdx-utils';
import { ChevronRight, ListIcon } from 'lucide-react';

interface TableOfContentsProps {
  headings: Heading[];
  title: string;
}

export function TableOfContents({ headings, title }: TableOfContentsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeId, setActiveId] = useState<string>('');

    // Scroll Spy Logic: Highlight active heading as user scrolls
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            { rootMargin: '-100px 0% -70% 0%', threshold: 1.0 }
        );

        headings.forEach((heading) => {
            const element = document.getElementById(heading.id);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, [headings]);

    if (headings.length === 0) return null;

    return (
        <div className={cn(
            "my-8 rounded-2xl border border-primary/10 overflow-hidden transition-all duration-300",
            "bg-gradient-to-br from-muted/40 via-background to-muted/10 shadow-sm hover:shadow-md",
            "border-l-4 border-l-primary/50"
        )}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-5 text-left transition-all duration-200 hover:bg-muted/40 active:scale-[0.99] group"
            >
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg transition-transform duration-300 group-hover:rotate-12">
                        <ListIcon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-headline font-bold text-primary text-base tracking-wide">
                        {title}
                    </span>
                </div>
                <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full bg-muted/50 transition-all duration-300",
                    isOpen && "bg-primary text-primary-foreground rotate-90"
                )}>
                    <ChevronRight className="h-5 w-5" />
                </div>
            </button>

            <div className={cn(
                "overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                isOpen ? "max-h-[1000px] opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-4"
            )}>
                <div className="border-t border-primary/5 mx-4" />
                <ul className="p-5 space-y-1 text-sm">
                    {headings.map((heading) => {
                        const isActive = activeId === heading.id;
                        return (
                            <li 
                                key={heading.id}
                                className={cn(
                                    "transition-all duration-300",
                                    heading.level === 3 ? "ml-4 border-l-2 border-muted-foreground/20 pl-4" : ""
                                )}
                            >
                                <a 
                                    href={`#${heading.id}`}
                                    className={cn(
                                        "group flex items-center gap-3 px-2 py-1.5 rounded-md transition-all duration-200 -mx-2",
                                        "text-muted-foreground hover:text-foreground hover:bg-muted/30 hover:translate-x-1.5",
                                        isActive && "text-accent font-semibold bg-accent/5 translate-x-1"
                                    )}
                                >
                                    {/* Active Dot Indicator */}
                                    {isActive && (
                                        <span className="flex h-1.5 w-1.5 shrink-0 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(var(--accent),0.6)]" />
                                    )}
                                    <span className="line-clamp-1">{heading.text}</span>
                                </a>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
