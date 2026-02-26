'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, Laptop } from 'lucide-react';
import { cn } from '@/lib/utils';
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
    return <div className="h-10 w-10" />;
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
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      className="h-10 w-10 rounded-full bg-transparent hover:bg-white/10 transition-all duration-300 group active:scale-90"
      aria-label="Toggle theme mode"
    >
      <div className="transition-transform duration-500 ease-in-out group-hover:rotate-[12deg]">
        {getIcon()}
      </div>
    </Button>
  );
}
