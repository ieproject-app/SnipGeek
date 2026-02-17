
'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { Heading } from '@/lib/mdx-utils';
import { ChevronRight, ListIcon } from 'lucide-react';

interface TableOfContentsProps {
  headings: Heading[];
  title: string;
}

export function TableOfContents({ headings, title }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '0% 0% -80% 0%' }
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="space-y-4">
      <div className="flex items-center gap-2 text-primary font-headline font-bold uppercase tracking-wider text-sm">
        <ListIcon className="h-4 w-4" />
        {title}
      </div>
      <ul className="space-y-2 text-sm">
        {headings.map((heading) => (
          <li
            key={heading.id}
            className={cn(
              "transition-all duration-200 border-l-2 pl-4 py-1",
              heading.level === 3 ? "ml-4" : "",
              activeId === heading.id
                ? "border-accent text-accent font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
            )}
          >
            <a
              href={`#${heading.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(heading.id)?.scrollIntoView({
                  behavior: 'smooth',
                });
              }}
              className="block"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function MobileTableOfContents({ headings, title }: TableOfContentsProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (headings.length === 0) return null;

    return (
        <div className="my-8 rounded-xl border bg-muted/30 overflow-hidden">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 text-left font-headline font-bold text-primary"
            >
                <div className="flex items-center gap-2">
                    <ListIcon className="h-5 w-5" />
                    {title}
                </div>
                <ChevronRight className={cn("h-5 w-5 transition-transform", isOpen && "rotate-90")} />
            </button>
            <div className={cn(
                "overflow-hidden transition-all duration-300",
                isOpen ? "max-h-[1000px] border-t" : "max-h-0"
            )}>
                <ul className="p-4 space-y-3 text-sm">
                    {headings.map((heading) => (
                        <li 
                            key={heading.id}
                            className={cn(
                                heading.level === 3 ? "pl-6 relative before:content-[''] before:absolute before:left-2 before:top-1/2 before:w-1.5 before:h-px before:bg-muted-foreground/30" : "font-medium"
                            )}
                        >
                            <a 
                                href={`#${heading.id}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setIsOpen(false);
                                    document.getElementById(heading.id)?.scrollIntoView({
                                        behavior: 'smooth',
                                    });
                                }}
                                className="text-muted-foreground hover:text-accent transition-colors"
                            >
                                {heading.text}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
