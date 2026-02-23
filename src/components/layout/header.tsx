'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Search, X, AlignLeft, Bookmark, Trash2 } from 'lucide-react';
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

  // Show header when message appears
  useEffect(() => {
    if (message) {
      setIsVisible(true);
    }
  }, [message]);

  // Handle pending notifications (e.g. from language switch)
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
    { name: dictionary.navigation.blog, href: '/blog' },
    { name: dictionary.navigation.notes, href: '/notes' },
    { name: dictionary.navigation.tools, href: '/tools' },
    { name: dictionary.navigation.about, href: '/about' },
    { name: dictionary.navigation.contact, href: '/contact' },
  ];

  const navItemClass = "transition-all duration-300 text-primary-foreground/70 hover:text-primary-foreground";

  return (
    <header ref={headerRef} className={cn(
        "fixed top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:right-auto z-50 transition-all duration-300 ease-in-out",
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

            {/* Status Notification Pill (Centered) */}
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
                "grid grid-cols-3 items-center h-full px-2 transition-all duration-300 ease-in-out",
                isSearchOpen ? "opacity-0 pointer-events-none" : "opacity-100"
            )}>
                {/* LEFT SIDE: Minimalist Menu Toggle with Label */}
                <div className="flex items-center pl-1">
                    <Button 
                        variant="ghost" 
                        className={cn(
                            "h-10 px-3 gap-2 rounded-full bg-transparent hover:bg-white/10 transition-all", 
                            navItemClass
                        )} 
                        onClick={() => toggleView('menu')}
                        aria-label="Toggle Navigation Menu"
                    >
                        <AlignLeft className="h-5 w-5 shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-tighter hidden sm:inline">MENU</span>
                    </Button>
                </div>

                {/* CENTER: Placeholder for Logo absolute placement */}
                <div className="flex justify-center" />

                {/* RIGHT SIDE: Bookmark & Search */}
                <div className="flex items-center justify-end gap-1 pr-1">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn(
                            "relative rounded-full h-10 w-10 bg-transparent hover:bg-white/10 transition-all", 
                            isPulsing && "scale-110 bg-accent/20", 
                            navItemClass
                        )} 
                        onClick={() => toggleView('readingList')}
                        aria-label="Reading List"
                    >
                       <Bookmark className={cn("h-5 w-5", isPulsing && "animate-heartbeat text-accent fill-accent")} />
                       {mounted && readingListItems.length > 0 && (
                            <span className={cn(
                                "absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent text-accent-foreground text-[10px] font-bold px-1 transition-all duration-300",
                                isPulsing && "scale-125 ring-4 ring-accent/30"
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
                "absolute inset-0 w-full h-full flex items-center transition-all duration-300 ease-in-out",
                isSearchOpen ? "opacity-100 z-10 px-2" : "opacity-0 -z-10 pointer-events-none"
            )}>
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-primary-foreground/70 pointer-events-none"/>
                <Input 
                    ref={searchInputRef}
                    type="search" 
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
            "absolute top-full left-0 right-0 z-40 mt-4 bg-primary/95 backdrop-blur-md shadow-2xl ring-1 ring-black/5 rounded-xl overflow-hidden transition-all duration-300 ease-in-out",
            "transform-origin-top",
            isMenuOpen ? "opacity-100 scale-y-100" : "opacity-0 scale-y-95 pointer-events-none"
        )}>
            <div className="p-2">
                <div className="grid grid-cols-1 gap-1">
                    {menuItems.map((item) => (
                        <Link 
                            key={item.name} 
                            href={item.href} 
                            className={cn(
                                "block px-5 py-2.5 text-[10px] font-black uppercase tracking-tighter rounded-xl hover:bg-white/10 transition-colors", 
                                navItemClass
                            )} 
                            onClick={() => setActiveView('none')}
                        >
                            {item.name}
                        </Link>
                    ))}
                </div>
            </div>
        </div>

        <div className="absolute top-full left-0 right-0 z-30 mt-4">
          {isSearchOpen && (
            <div className="bg-background rounded-xl border shadow-2xl max-h-[400px] overflow-hidden">
                  {query.length > 1 ? (
                      results.length > 0 ? (
                          <ScrollArea className="h-full max-h-[400px]">
                              <div className="p-2">
                                  <p className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">{results.length} {dictionary.search.resultsFound}</p>
                                  <ul className="space-y-1">
                                      {results.map((item) => (
                                      <li key={`${item.type}-${item.slug}`}>
                                          <Link href={item.href} onClick={handleResultClick} className="block p-3 rounded-xl hover:bg-muted transition-colors">
                                              <div className="overflow-hidden">
                                                  <div className="flex items-start justify-between gap-2">
                                                      <span className="font-bold text-sm text-primary line-clamp-2 flex-1 min-w-0">{item.title}</span>
                                                      <Badge variant="outline" className="capitalize text-[10px] font-black tracking-tighter shrink-0">{item.type}</Badge>
                                                  </div>
                                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                                              </div>
                                          </Link>
                                      </li>
                                      ))}
                                  </ul>
                              </div>
                          </ScrollArea>
                      ) : (
                          <div className="p-10 text-center text-sm text-muted-foreground italic">
                              {dictionary.search.noResults} &quot;{query}&quot;.
                          </div>
                      )
                  ) : (
                      <div className="p-10 text-center text-sm text-muted-foreground font-medium">
                          {dictionary.search.placeholder}
                      </div>
                  )}
              </div>
          )}

          {isReadingListOpen && (
            <div className="bg-background rounded-xl border shadow-2xl max-h-[400px] overflow-hidden">
                <ScrollArea className="h-full max-h-[400px]">
                  <div className="p-2">
                    <p className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">
                      {mounted ? readingListItems.length : 0} {mounted && readingListItems.length === 1 ? dictionary.readingList.item : dictionary.readingList.items} {dictionary.readingList.inYourList}
                    </p>
                    {mounted && readingListItems.length > 0 ? (
                      <ul className="space-y-1">
                        {readingListItems.map((item) => (
                          <li key={`${item.type}-${item.slug}`} className="group relative">
                              <Link href={item.href} onClick={() => setActiveView('none')} className="block p-3 rounded-xl hover:bg-muted transition-colors">
                                  <div className="overflow-hidden pr-10">
                                      <div className="flex items-start justify-between gap-2">
                                          <span className="font-bold text-sm text-primary line-clamp-2 flex-1 min-w-0">{item.title}</span>
                                          <Badge variant="outline" className="capitalize text-[10px] font-black tracking-tighter shrink-0">{item.type}</Badge>
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                                  </div>
                              </Link>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" 
                                onClick={() => removeReadingListItem(item.slug)}
                                aria-label="Remove from Reading List"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-10 text-center text-sm text-muted-foreground italic">
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
