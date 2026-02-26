'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNotification } from '@/hooks/use-notification';
import type { Dictionary } from '@/lib/get-dictionary';
import { Button } from '@/components/ui/button';

export function ThemeSwitcher({ dictionary }: { dictionary: Dictionary }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { notify } = useNotification();
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return null;
  }

  const cycleTheme = () => {
    const nextTheme = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
    setTheme(nextTheme);
    
    // Trigger notification bar in Header with context icon
    const key = `theme${nextTheme.charAt(0).toUpperCase() + nextTheme.slice(1)}`;
    const msg = (dictionary?.notifications as any)?.[key];
    
    const getIcon = (t: string) => {
        switch (t) {
            case 'light': return <Sun className="h-4 w-4 text-accent" />;
            case 'dark': return <Moon className="h-4 w-4 text-accent" />;
            default: return <Laptop className="h-4 w-4 text-accent" />;
        }
    };

    if (msg) notify(msg, getIcon(nextTheme));
  };

  const getIcon = () => {
    switch (theme) {
      case 'light': return <Sun className="h-5 w-5 text-amber-400 fill-amber-400/20" />;
      case 'dark': return <Moon className="h-5 w-5 text-amber-400 fill-amber-400/10" />;
      default: return <Laptop className="h-5 w-5 text-primary-foreground/70" />;
    }
  };

  return (
    <div className="fixed bottom-20 right-6 z-50">
      <Button
        variant="default"
        size="icon"
        onClick={cycleTheme}
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
