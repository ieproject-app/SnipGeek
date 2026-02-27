
'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Dictionary } from '@/lib/get-dictionary';

export function BackToTop({ dictionary }: { dictionary: Dictionary }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div className={cn(
        'fixed bottom-6 right-6 z-50 transition-all duration-300 group',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
    )}>
      {/* Standardized Floating Pill Tooltip */}
      <span className={cn(
          "absolute top-1/2 -translate-y-1/2 right-full mr-3 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest shadow-2xl whitespace-nowrap z-20 pointer-events-none",
          "transition-all duration-300 opacity-0 scale-50 translate-x-4",
          "group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0"
      )}>
          {dictionary?.promptGenerator?.tooltips?.backToTop || 'Back to Top'}
          {/* Tooltip Arrow (Points Right) */}
          <span className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 bg-primary rotate-45" />
      </span>

      <Button
        variant="default"
        size="icon"
        className="rounded-full h-10 w-10 shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 bg-primary/90 text-primary-foreground border-none"
        onClick={scrollToTop}
        aria-label="Back to top"
      >
        <ArrowUp className="h-5 w-5" />
      </Button>
    </div>
  );
}
