'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNotification } from '@/hooks/use-notification';
import type { Dictionary } from '@/lib/get-dictionary';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ThemeSwitcher({ dictionary }: { dictionary: Dictionary }) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { notify } = useNotification();
  
  useEffect(() => {
    setMounted(true);
    
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
  
  if (!mounted) {
    return null;
  }

  const toggleTheme = () => {
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    
    const key = `theme${nextTheme.charAt(0).toUpperCase() + nextTheme.slice(1)}`;
    const msg = (dictionary?.notifications as any)?.[key];
    
    const getNotifyIcon = (t: string) => {
        switch (t) {
            case 'light': return <Sun className="h-4 w-4" />;
            case 'dark': return <Moon className="h-4 w-4" />;
            default: return <Sun className="h-4 w-4" />;
        }
    };

    if (msg) notify(msg, getNotifyIcon(nextTheme));
  };

  const getIcon = () => {
    if (resolvedTheme === 'dark') {
        return <Moon className="h-5 w-5" />;
    }
    return <Sun className="h-5 w-5" />;
  };

  return (
    <div className={cn(
        "fixed bottom-20 right-6 z-50 transition-all duration-300 group",
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
    )}>
      {/* Floating Pill Tooltip (Left Position) */}
      <span className={cn(
          "absolute top-1/2 -translate-y-1/2 right-full mr-3 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest shadow-2xl whitespace-nowrap",
          "opacity-0 scale-50 translate-x-4 transition-all duration-300 pointer-events-none z-20",
          "group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0"
      )}>
          {dictionary.promptGenerator.tooltips.theme}
          {/* Tooltip Arrow (Points Right) */}
          <span className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 bg-primary rotate-45" />
      </span>

      <Button
        variant="default"
        size="icon"
        onClick={toggleTheme}
        className="h-10 w-10 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 bg-primary/90 text-primary-foreground border-none"
        aria-label="Toggle theme mode"
      >
        <div className="transition-transform duration-500 ease-in-out group-hover:rotate-[12deg]">
          {getIcon()}
        </div>
      </Button>
    </div>
  );
}