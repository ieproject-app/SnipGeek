'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from './language-switcher';
import { TranslationsMap } from '@/lib/posts';
import { Search, X, MoreHorizontal, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const menuItems = [
    { name: 'Blog', href: '/blog' },
    { name: 'Projects', href: '/projects' },
    { name: 'About', href: '/about' },
];

const moreMenuItems = [
    { name: 'Archive', href: '/archive' },
    { name: 'Contact', href: '/contact' },
];

const allMenuItems = [...menuItems, ...moreMenuItems];

export function Header({ translationsMap }: { translationsMap: TranslationsMap }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const lastScrollY = useRef(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  // Scroll visibility logic
  useEffect(() => {
    const handleScroll = () => {
      if (isSearchOpen) return; // Don't hide header if search is open
      const currentScrollY = window.scrollY;
      if (currentScrollY < lastScrollY.current || currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > 100 && currentScrollY > lastScrollY.current) {
        setIsVisible(false);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isSearchOpen]);

  // Focus input when search opens
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
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
        "fixed top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:right-auto z-50 transition-all duration-300 ease-in-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-16"
    )}>
        <nav className={cn(
            "mx-auto bg-primary/90 backdrop-blur-sm text-primary-foreground rounded-full shadow-lg ring-1 ring-black/5 flex items-center justify-end h-12 transition-all duration-500 ease-in-out",
            isSearchOpen ? 'w-full max-w-sm md:w-80 px-2' : 'w-full md:w-auto px-2'
        )}>
            {/* Normal view container */}
            <div className={cn(
                "flex items-center flex-grow md:flex-grow-0 gap-2 transition-all duration-300 ease-in-out",
                isSearchOpen ? 'w-0 opacity-0 -translate-x-10' : 'w-auto opacity-100 translate-x-0'
            )}>
                <Link 
                    href="/" 
                    className="font-headline text-2xl font-bold tracking-tighter ml-2 whitespace-nowrap"
                    aria-hidden={isSearchOpen}
                    tabIndex={isSearchOpen ? -1 : 0}
                >
                    SG
                </Link>
                
                {/* Spacer for mobile */}
                <div className="flex-grow block md:hidden" />

                {/* Mobile controls */}
                <div className="flex md:hidden items-center">
                    <LanguageSwitcher translationsMap={translationsMap} />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {allMenuItems.map((item) => (
                                <DropdownMenuItem key={item.name} asChild>
                                    <Link href={item.href}>
                                        {item.name}
                                    </Link>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Desktop controls */}
                <div className="hidden md:flex items-center gap-2">
                    <LanguageSwitcher translationsMap={translationsMap} />
                    <div className="h-6 w-px bg-primary-foreground/20" />
                    {menuItems.map(item => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="px-3 py-1 text-sm font-medium rounded-full hover:bg-primary-foreground/10 transition-colors"
                        >
                            {item.name}
                        </Link>
                    ))}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-primary-foreground/70 hover:text-primary-foreground">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {moreMenuItems.map((item) => (
                                <DropdownMenuItem key={item.name} asChild>
                                    <Link href={item.href}>
                                        {item.name}
                                    </Link>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

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
            <div className="pl-1">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full relative z-20 h-9 w-9"
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
