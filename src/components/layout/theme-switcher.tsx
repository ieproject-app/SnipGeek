'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, Laptop } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

const themeOptions = [
  { theme: 'light', icon: Sun },
  { theme: 'system', icon: Laptop },
  { theme: 'dark', icon: Moon },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const currentThemeIndex = themeOptions.findIndex((t) => t.theme === theme);
  const activeIndex = currentThemeIndex === -1 ? 1 : currentThemeIndex; // Default to system

  return (
    <div 
      className="relative flex items-center bg-muted rounded-full p-1 text-sm min-h-[28px] min-w-[90px] shadow-inner"
      suppressHydrationWarning
    >
      {!mounted ? (
        <div className="w-full h-full animate-pulse bg-muted-foreground/10 rounded-full" />
      ) : (
        <>
          <div
            className={cn(
              'absolute h-5 w-7 bg-background shadow-sm rounded-full transition-transform duration-300 ease-in-out'
            )}
            style={{ transform: `translateX(${activeIndex * 100}%)` }}
          />
          {themeOptions.map((option) => (
            <button
              key={option.theme}
              onClick={() => setTheme(option.theme)}
              className={cn(
                'relative z-10 w-7 h-5 flex items-center justify-center rounded-full transition-colors',
                theme === option.theme
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={`Switch to ${option.theme} mode`}
            >
              <option.icon className="h-3 w-3" />
            </button>
          ))}
        </>
      )}
    </div>
  );
}
