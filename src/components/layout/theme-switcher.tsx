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
      className="relative flex items-center bg-primary/90 backdrop-blur-sm rounded-full p-1 text-sm min-h-[32px] min-w-[108px]"
      suppressHydrationWarning
    >
      {!mounted ? (
        <div className="w-full h-full animate-pulse bg-primary-foreground/10 rounded-full" />
      ) : (
        <>
          <div
            className={cn(
              'absolute h-6 w-9 bg-primary-foreground/20 shadow-sm rounded-full transition-transform duration-300 ease-in-out'
            )}
            style={{ transform: `translateX(${activeIndex * 100}%)` }}
          />
          {themeOptions.map((option) => (
            <button
              key={option.theme}
              onClick={() => setTheme(option.theme)}
              className={cn(
                'relative z-10 w-9 h-6 flex items-center justify-center rounded-full transition-colors',
                theme === option.theme
                  ? 'text-primary-foreground'
                  : 'text-primary-foreground/50 hover:text-primary-foreground'
              )}
              aria-label={`Switch to ${option.theme} mode`}
            >
              <option.icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </>
      )}
    </div>
  );
}
