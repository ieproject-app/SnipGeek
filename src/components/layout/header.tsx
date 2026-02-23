'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { 
  Search, 
  X, 
  Bookmark, 
  Trash2, 
  Menu, 
  BookOpen, 
  StickyNote, 
  LayoutGrid, 
  User, 
  Mail 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { usePathname } from 'next/navigation';
import { useReadingList } from '@/hooks/use-reading-list';
import { useNotification } from '@/hooks/use-notification';
import type { Dictionary } from '@/lib/get-dictionary';
import { SnipGeekLogo } from '@/components/icons/snipgeek-logo';

type SearchableItem = {
  slug: string;
  title: string;
  description: string;
  type: 'blog' | 'note';
  href: string;
};

type ActiveView = 'none' | 'search' | 'menu' | 'readingList';

export function Header({ searchableData, dictionary }: { searchableData: SearchableItem[], dictionary: Dictionary }) {
  const [isVisible, setIsVisible] = useState(true);
  const [activeView, setActiveView] = useState<ActiveView>('none');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchableItem[]>([]);
  const { items: readingListItems, removeItem: removeReadingListItem } = useReadingList();
  const { message, notify } = useNotification();
  const lastScrollY = useRef(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const prevCount = useRef(readingListItems.length);

  const isSearchOpen = activeView === 'search';
  const isMenuOpen = activeView === 'menu';
  const isReadingListOpen = activeView === 'readingList';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
    }
  }, [message]);

  useEffect(() => {
    if (mounted) {
      const pending = localStorage.getItem('snipgeek-pending-notify');
      if (pending) {
        const msg = (dictionary?.notifications as any)?.[pending];
        if (msg) notify(msg);
        localStorage.removeItem('snipgeek-pending-notify');
      }
    }
  }, [mounted, notify, dictionary]);

  useEffect(() => {
    if (mounted && readingListItems.length > prevCount.current) {
      setIsVisible(true);
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 2000);
      return () => clearTimeout(timer);
    }
    prevCount.current = readingListItems.length;
  }, [readingListItems.length, mounted]);

  useEffect(() => {
    setActiveView('none');
    setQuery('');
  }, [pathname]);

  useEffect(() => {
    if (query.length > 1) {
      const lowerCaseQuery = query.toLowerCase();
      const filteredData = searchableData.filter(
        item =>
          item.title.toLowerCase().includes(lowerCaseQuery) ||
          (item.description && item.description.toLowerCase().includes(lowerCaseQuery))
      );
      setResults(filteredData);
    } else {
      setResults([]);
    }
  }, [query, searchableData]);

  useEffect(() => {
    const handleScroll = () => {
      if (activeView !== 'none' || message) return;
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
  }, [activeView, message]);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setActiveView('none');
        setQuery('');
      }
    };
    const handleKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            setActiveView('none');
            setQuery('');
        }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeydown);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeydown);
    };
  }, [headerRef]);

  const handleResultClick = () => {
    setActiveView('none');
    setQuery('');
  };

  const toggleView = (view: ActiveView) => {
    setActiveView(prev => (prev === view ? 'none' : view));
    if (view !== 'search') {
      setQuery('');
    }
  }

  const menuItems = [
    { name: dictionary.navigation.blog, href: '/blog', icon: BookOpen, type: 'primary' },
    { name: dictionary.navigation.notes, href: '/notes', icon: StickyNote, type: 'primary' },
    { name: dictionary.navigation.tools, href: '/tools', icon: LayoutGrid, type: 'primary' },
    { name: dictionary.navigation.about, href: '/about', icon: User, type: 'secondary' },
    { name: dictionary.navigation.contact, href: '/contact', icon: Mail, type: 'secondary' },
  ];

  const navItemClass = "transition-all duration-300 text-primary-foreground/70 hover:text-primary-foreground";

  return (
    <header ref={headerRef} className={cn(
        "fixed top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:right-auto z-50 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
        isSearchOpen ? 'md:w-[560px]' : 'md:w-[480px]',
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-16"
    )}>
        <nav className={cn(
            "relative mx-auto bg-primary/90 backdrop-blur-sm text-primary-foreground shadow-lg ring-1 ring-black/5 h-12 transition-all duration-300 ease-in-out rounded-full"
        )}>
            {/* Centered Logo */}
            <div className={cn(
                "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 transition-all duration-500 ease-in-out",
                (isSearchOpen || (mounted && message)) ? "opacity-0 scale-75 pointer-events-none" : "opacity-100 scale-100"
            )}>
                <Link 
                    href="/" 
                    className="flex items-center justify-center h-7 w-7 transition-all duration-300 hover:scale-110 active:scale-95" 
                    aria-label="SnipGeek Home"
                >
                    <SnipGeekLogo className="h-full w-full" />
                </Link>
            </div>

            {/* Status Notification Pill */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[60]">
              <div className={cn(
                "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter flex items-center gap-2 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] backdrop-blur-md",
                (mounted && message) 
                  ? "opacity-100 translate-y-0 scale-100 bg-white dark:bg-slate-100 text-slate-900 ring-1 ring-black/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)]" 
                  : "opacity-0 -translate-y-4 scale-90 bg-white/40 text-transparent"
              )}>
                  <div className={cn(
                    "h-1.5 w-1.5 rounded-full animate-pulse transition-colors duration-500",
                    message ? "bg-accent" : "bg-transparent"
                  )} />
                  {message || "Status"}
              </div>
            </div>

            {/* Main Header Content */}
            <div className={cn(
                "grid grid-cols-3 items-center h-full px-1 transition-all duration-300 ease-in-out",
                isSearchOpen ? "opacity-0 pointer-events-none" : "opacity-100"
            )}>
                {/* LEFT SIDE: Menu Toggle */}
                <div className="flex justify-start">
                    <Button 
                        variant="ghost" 
                        size="icon"
                        className={cn(
                            "h-10 w-10 rounded-full bg-transparent hover:bg-white/10 transition-all", 
                            navItemClass
                        )} 
                        onClick={() => toggleView('menu')}
                        aria-label="Toggle Navigation Menu"
                    >
                        <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
                            <Menu className={cn(
                                "absolute inset-0 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                                isMenuOpen ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
                            )} />
                            <X className={cn(
                                "absolute inset-0 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                                isMenuOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"
                            )} />
                        </div>
                    </Button>
                </div>

                {/* CENTER: Placeholder */}
                <div className="flex justify-center" />

                {/* RIGHT SIDE: Bookmark & Search */}
                <div className="flex justify-end items-center">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn(
                            "relative rounded-full h-10 w-10 bg-transparent hover:bg-white/10 transition-all", 
                            navItemClass
                        )} 
                        onClick={() => toggleView('readingList')}
                        aria-label="Reading List"
                    >
                       <Bookmark className="h-5 w-5" />
                       {mounted && readingListItems.length > 0 && (
                            <span className={cn(
                                "absolute top-1.5 right-1.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-accent text-accent-foreground text-[9px] font-bold px-1 transition-all duration-300",
                                isPulsing ? "animate-badge-pop ring-2 ring-accent/30" : "scale-100"
                            )}>
                                {readingListItems.length}
                            </span>
                       )}
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn("h-10 w-10 rounded-full bg-transparent hover:bg-white/10", navItemClass)} 
                        onClick={() => toggleView('search')}
                        aria-label="Search"
                    >
                       <Search className="h-5 w-5" />
                    </Button>
                </div>
            </div>
            
            {/* Search Input Overlay */}
            <div className={cn(
                "absolute inset-0 w-full h-full flex items-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                isSearchOpen ? "opacity-100 z-10 px-2" : "opacity-0 -z-10 pointer-events-none"
            )}>
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-primary-foreground/70 pointer-events-none"/>
                <Input 
                    ref={searchInputRef}
                    type="text" 
                    placeholder={dictionary.search.placeholder}
                    className="w-full h-full bg-transparent border-none rounded-full pl-14 pr-12 focus-visible:ring-0 focus-visible:ring-offset-0 text-primary-foreground placeholder:text-primary-foreground/50"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <Button variant="ghost" size="icon" className={cn("rounded-full absolute right-2 z-20 h-9 w-9 bg-transparent hover:bg-transparent", navItemClass)} onClick={() => { setActiveView('none'); setQuery(''); }}>
                   <X className="h-5 w-5" />
                </Button>
            </div>
        </nav>

        {/* Dropdowns (Menu, Search Results, Reading List) */}
        <div className={cn(
            "absolute top-full left-0 z-40 mt-4 w-48 bg-primary/95 backdrop-blur-md shadow-2xl ring-1 ring-black/5 rounded-xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
            "transform-origin-top",
            isMenuOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
        )}>
            <div className="grid grid-cols-1">
                {mounted && menuItems.map((item, index) => {
                    const isFirstSecondary = item.type === 'secondary' && menuItems[index - 1]?.type === 'primary';
                    return (
                        <React.Fragment key={item.name}>
                            {isFirstSecondary && <div className="h-px bg-white/10 mx-4 my-1" />}
                            <Link 
                                href={item.href} 
                                style={{ 
                                    transitionDelay: isMenuOpen ? `${index * 40}ms` : '0ms' 
                                }}
                                className={cn(
                                    "group relative flex items-center gap-4 px-6 py-3.5 text-[12px] font-black uppercase tracking-tighter hover:bg-white/5 transition-all duration-500", 
                                    isMenuOpen ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0",
                                    navItemClass
                                )} 
                                onClick={() => setActiveView('none')}
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center" />
                                <item.icon className="h-4 w-4 shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:text-accent" />
                                <span className="transition-transform duration-300 group-hover:translate-x-1">{item.name}</span>
                            </Link>
                        </React.Fragment>
                    );
                })}
            </div>
        </div>

        <div className="absolute top-full left-0 right-0 z-30 mt-4">
          {isSearchOpen && (
            <div className={cn(
                "bg-background rounded-xl border shadow-2xl max-h-[450px] overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
                isSearchOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2"
            )}>
                  <div className="px-6 py-3 border-b bg-muted/20 flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                        {query.length > 1 ? `${results.length} ${dictionary.search.resultsFound}` : dictionary.search.prompt}
                      </p>
                  </div>
                  <ScrollArea className="h-full max-h-[400px]">
                      <div>
                          {query.length > 1 ? (
                              results.length > 0 ? (
                                  <ul className="grid grid-cols-1">
                                      {results.map((item, idx) => (
                                      <li key={`${item.type}-${item.slug}`} style={{ transitionDelay: `${idx * 30}ms` }} className="animate-in fade-in slide-in-from-left-2 duration-300">
                                          <Link href={item.href} onClick={handleResultClick} className="block group px-6 py-4 hover:bg-muted/50 transition-all duration-300">
                                              <h4 className="font-bold text-sm text-primary line-clamp-2 leading-snug mb-2 transition-colors group-hover:text-accent">
                                                  {item.title}
                                              </h4>
                                              <div className="flex items-center gap-2">
                                                  <Badge variant="secondary" className="text-[9px] h-4 uppercase font-black tracking-wider px-1.5 rounded-sm shrink-0">
                                                      {item.type}
                                                  </Badge>
                                                  <span className="text-[10px] text-muted-foreground font-medium opacity-30">•</span>
                                                  <p className="text-[11px] text-muted-foreground line-clamp-1 italic opacity-70">
                                                      {item.description}
                                                  </p>
                                              </div>
                                          </Link>
                                      </li>
                                      ))}
                                  </ul>
                              ) : (
                                  <div className="p-12 text-center text-sm text-muted-foreground italic">
                                      {dictionary.search.noResults} &quot;{query}&quot;.
                                  </div>
                              )
                          ) : (
                              <div className="p-12 text-center text-sm text-muted-foreground font-medium">
                                  {dictionary.search.placeholder}
                              </div>
                          )}
                      </div>
                  </ScrollArea>
              </div>
          )}

          {isReadingListOpen && (
            <div className={cn(
                "bg-background rounded-xl border shadow-2xl max-h-[450px] overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
                isReadingListOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2"
            )}>
                <div className="px-6 py-3 border-b bg-muted/20 flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                      {mounted ? readingListItems.length : 0} {mounted && readingListItems.length === 1 ? dictionary.readingList.item : dictionary.readingList.items} {dictionary.readingList.inYourList}
                    </p>
                </div>
                <ScrollArea className="h-full max-h-[400px]">
                  <div>
                    {mounted && readingListItems.length > 0 ? (
                      <ul className="grid grid-cols-1">
                        {readingListItems.map((item, idx) => (
                          <li key={`${item.type}-${item.slug}`} style={{ transitionDelay: `${idx * 30}ms` }} className="group relative animate-in fade-in slide-in-from-left-2 duration-300">
                              <div className="relative hover:bg-muted/50 transition-all duration-300 overflow-hidden">
                                  <Link href={item.href} onClick={() => setActiveView('none')} className="block px-6 py-4 pr-14">
                                      <h4 className="font-bold text-sm text-primary line-clamp-2 leading-snug mb-2 transition-colors group-hover:text-accent">
                                          {item.title}
                                      </h4>
                                      <div className="flex items-center gap-2">
                                          <Badge variant="secondary" className="text-[9px] h-4 uppercase font-black tracking-wider px-1.5 rounded-sm shrink-0">
                                              {item.type}
                                          </Badge>
                                          <span className="text-[10px] text-muted-foreground font-medium opacity-30">•</span>
                                          <p className="text-[11px] text-muted-foreground line-clamp-1 italic opacity-70">
                                              {item.description}
                                          </p>
                                      </div>
                                  </Link>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute top-1/2 -translate-y-1/2 right-4 h-8 w-8 rounded-full text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all duration-300" 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        removeReadingListItem(item.slug);
                                    }}
                                    aria-label="Remove from Reading List"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                              </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-12 text-center text-sm text-muted-foreground italic flex flex-col items-center gap-3">
                        <Bookmark className="h-8 w-8 opacity-10" />
                        {dictionary.readingList.empty}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
          )}
        </div>
    </header>
  );
}
