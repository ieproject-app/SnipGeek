'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from './language-switcher';
import { TranslationsMap } from '@/lib/posts';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Header({ translationsMap }: { translationsMap: TranslationsMap }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const lastScrollY = useRef(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  // Scroll visibility logic
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Hide on scroll down, show on scroll up or at top
      if (currentScrollY < lastScrollY.current || currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > 100 && currentScrollY > lastScrollY.current) {
        setIsVisible(false);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Focus input when search opens
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100); // Timeout for transition
    }
  }, [isSearchOpen]);
  
  // Close search on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    const handleKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            setIsSearchOpen(false);
        }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeydown);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeydown);
    };
  }, [headerRef]);

  return (
    <header ref={headerRef} className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-in-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-16"
    )}>
        <nav className={cn(
            "bg-primary/90 backdrop-blur-sm text-primary-foreground rounded-full shadow-lg ring-1 ring-black/5 flex items-center justify-end h-12 transition-[width] duration-300 ease-in-out",
            isSearchOpen ? 'w-80' : 'w-auto'
        )}>

            {/* Logo & Lang Switcher */}
            <div className={cn(
                "flex items-center transition-all duration-300 ease-in-out",
                isSearchOpen ? 'w-0 opacity-0 -translate-x-10' : 'w-auto opacity-100 translate-x-0'
            )}>
                <Link 
                    href="/" 
                    className="font-headline text-2xl font-bold tracking-tighter ml-4 mr-2 whitespace-nowrap"
                    aria-hidden={isSearchOpen}
                    tabIndex={isSearchOpen ? -1 : 0}
                >
                    SG
                </Link>
                <LanguageSwitcher translationsMap={translationsMap} />
            </div>
            
            {/* Search Input */}
            <div className={cn(
                "absolute left-0 w-full h-full transition-all duration-300 ease-in-out",
                isSearchOpen ? "opacity-100 z-10" : "opacity-0 -z-10"
            )}>
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary-foreground/70 pointer-events-none"/>
                <Input 
                    ref={searchInputRef}
                    type="search" 
                    placeholder="Search..."
                    className="w-full h-full bg-transparent border-none rounded-full pl-12 pr-12 focus-visible:ring-0 focus-visible:ring-offset-0 text-primary-foreground placeholder:text-primary-foreground/50"
                    aria-hidden={!isSearchOpen}
                />
            </div>

            {/* Search/Close Button */}
            <div className="px-1">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full relative z-20"
                    onClick={() => setIsSearchOpen(prev => !prev)}
                    aria-label={isSearchOpen ? "Close search" : "Open search"}
                >
                   <Search className={cn("transition-all duration-300", isSearchOpen ? 'opacity-0 scale-50 rotate-90' : 'opacity-100 scale-100 rotate-0')} />
                   <X className={cn("absolute transition-all duration-300", isSearchOpen ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-90')} />
                </Button>
            </div>
        </nav>
    </header>
  );
}
