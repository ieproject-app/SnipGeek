'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from './language-switcher';
import { TranslationsMap } from '@/lib/posts';
import { Search, X, Menu } from 'lucide-react';
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
    { name: 'Notes', href: '/notes' },
    { name: 'Projects', href: '/projects' },
];

const moreMenuItems = [
    { name: 'About', href: '/about' },
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
            "mx-auto bg-primary/90 backdrop-blur-sm text-primary-foreground rounded-full shadow-lg ring-1 ring-black/5 flex items-center justify-between h-12 transition-all duration-500 ease-in-out px-2",
            isSearchOpen ? 'w-full max-w-sm md:max-w-md' : 'w-full md:w-auto'
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
                
                {/* Spacer for desktop */}
                <div className="flex-grow hidden md:block" />

            </div>
            
            <div className={cn(
                "flex items-center gap-1 transition-opacity duration-300",
                isSearchOpen ? "opacity-0" : "opacity-100"
            )}>
                {/* Mobile controls */}
                <div className="flex md:hidden items-center">
                    <LanguageSwitcher translationsMap={translationsMap} />
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full relative z-20 h-9 w-9"
                        onClick={() => setIsSearchOpen(true)}
                        aria-label="Open search"
                    >
                       <Search className="h-5 w-5" />
                    </Button>
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
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
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
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full relative z-20 h-9 w-9"
                        onClick={() => setIsSearchOpen(true)}
                        aria-label={"Open search"}
                    >
                       <Search className="h-5 w-5" />
                    </Button>
                </div>
            </div>
            
            {/* Search Input and Close Button container */}
            <div className={cn(
                "absolute left-0 right-0 w-full h-full flex items-center transition-all duration-300 ease-in-out",
                isSearchOpen ? "opacity-100 z-10 px-2" : "opacity-0 -z-10"
            )}>
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary-foreground/70 pointer-events-none"/>
                <Input 
                    ref={searchInputRef}
                    type="search" 
                    placeholder="Search..."
                    className="w-full h-full bg-transparent border-none rounded-full pl-12 pr-12 focus-visible:ring-0 focus-visible:ring-offset-0 text-primary-foreground placeholder:text-primary-foreground/50"
                    aria-hidden={!isSearchOpen}
                />
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full absolute right-2 z-20 h-9 w-9"
                    onClick={() => setIsSearchOpen(false)}
                    aria-label="Close search"
                >
                   <X className="h-5 w-5" />
                </Button>
            </div>
        </nav>
    </header>
  );
}