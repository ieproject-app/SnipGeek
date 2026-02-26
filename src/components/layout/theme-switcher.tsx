
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
    // Only toggle between light and dark, ignoring system preference
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    
    // Trigger notification bar in Header with context icon
    const key = `theme${nextTheme.charAt(0).toUpperCase() + nextTheme.slice(1)}`;
    const msg = (dictionary?.notifications as any)?.[key];
    
    const getIcon = (t: string) => {
        switch (t) {
            case 'light': return <Sun className="h-4 w-4 text-accent" />;
            case 'dark': return <Moon className="h-4 w-4 text-accent" />;
            default: return <Sun className="h-4 w-4 text-accent" />;
        }
    };

    if (msg) notify(msg, getIcon(nextTheme));
  };

  const getIcon = () => {
    if (resolvedTheme === 'dark') {
        return <Moon className="h-5 w-5 text-accent fill-accent/10" />;
    }
    return <Sun className="h-5 w-5 text-accent fill-accent/20" />;
  };

  return (
    <div className={cn(
        "fixed bottom-20 right-6 z-50 transition-all duration-300",
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
    )}>
      <Button
        variant="default"
        size="icon"
        onClick={toggleTheme}
        className="h-10 w-10 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 bg-primary/90 text-primary-foreground border-none group"
        aria-label="Toggle theme mode"
      >
        <div className="transition-transform duration-500 ease-in-out group-hover:rotate-[12deg]">
          {getIcon()}
        </div>
      </Button>
    </div>
  );
}
