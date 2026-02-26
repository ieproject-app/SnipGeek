'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { 
  Search, 
  X, 
  Bookmark, 
  Trash2, 
  MoreHorizontal, 
  BookOpen, 
  StickyNote, 
  LayoutGrid, 
  User, 
  Mail,
  Languages,
  ArrowUpRight
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
import { ThemeSwitcher } from './theme-switcher';

type SearchableItem = {
  slug: string;
  title: string;
  description: string;
  type: 'blog' | 'note';
  href: string;
};

type ActiveView = 'none' | 'search' | 'menu' | 'readingList';

const typeConfig = {
  blog: { 
    icon: BookOpen, 
    color: 'text-sky-400', 
    bg: 'bg-sky-500/10', 
    accent: 'bg-sky-500' 
  },
  note: { 
    icon: StickyNote, 
    color: 'text-amber-400', 
    bg: 'bg-amber-400/10', 
    accent: 'bg-amber-400' 
  },
};

const HighlightMatch = ({ text, query }: { text: string; query: string }) => {
  if (!query.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-accent/30 text-accent-foreground rounded-[2px] px-0.5 font-semibold">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

export function Header({ searchableData, dictionary }: { searchableData: SearchableItem[], dictionary: Dictionary }) {
  const [isVisible, setIsVisible] = useState(true);
  const [activeView, setActiveView] = useState<ActiveView>('none');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchableItem[]>([]);
  const [removingSlug, setRemovingSlug] = useState<string | null>(null);
  const { items: readingListItems, removeItem: removeReadingListItem } = useReadingList();
  const { message, icon, notify } = useNotification();
  const lastScrollY = useRef(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isGlowing, setIsGlowing] = useState(false);
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
      setIsGlowing(true);
      const timer = setTimeout(() => setIsGlowing(false), 500);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    if (mounted) {
      const pending = localStorage.getItem('snipgeek-pending-notify');
      if (pending) {
        const msg = (dictionary?.notifications as any)?.[pending];
        if (msg) notify(msg, <Languages className="h-4 w-4" />);
        localStorage.removeItem('snipgeek-pending-notify');
      }
    }
  }, [mounted, notify, dictionary]);

  useEffect(() => {
    if (mounted && readingListItems.length > prevCount.current) {
      setIsVisible(true);
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

  const toggleView = (view: ActiveView) => {
    setActiveView(prev => (prev === view ? 'none' : view));
    if (view !== 'search') {
      setQuery('');
    }
  }

  const handleRemoveReadingListItem = (slug: string) => {
    setRemovingSlug(slug);
    setTimeout(() => {
      removeReadingListItem(slug);
      setRemovingSlug(null);
    }, 320);
  };

  const directLinks = [
    { name: dictionary.navigation.blog, href: '/blog', icon: BookOpen },
    { name: dictionary.navigation.notes, href: '/notes', icon: StickyNote },
    { name: dictionary.navigation.tools, href: '/tools', icon: LayoutGrid },
  ];

  const moreItems = [
    { name: dictionary.navigation.about, href: '/about', icon: User },
    { name: dictionary.navigation.contact, href: '/contact', icon: Mail },
  ];

  const navItemClass = "transition-all duration-300 text-primary-foreground/70 hover:text-primary-foreground";

  return (
    <header ref={headerRef} className={cn(
        "fixed top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:right-auto z-50 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
        isSearchOpen ? 'md:w-[600px]' : 'md:w-[580px]',
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-16"
    )}>
        <nav className={cn(
            "relative mx-auto bg-primary/90 backdrop-blur-sm text-primary-foreground shadow-lg ring-1 ring-black/5 h-12 transition-all duration-300 ease-in-out rounded-full flex items-center justify-between px-2"
        )}>
            {/* Notification Bar */}
            <div className={cn(
                "absolute inset-0 z-40 bg-primary/95 backdrop-blur-md transition-all flex items-center justify-center px-6 rounded-full overflow-hidden",
                isGlowing && "ring-2 ring-accent/40 shadow-[0_0_15px_rgba(125,211,252,0.2)]",
                (mounted && message) 
                    ? "translate-y-0 opacity-100 ease-[cubic-bezier(0.34,1.56,0.64,1)] duration-500" 
                    : "translate-y-[-100%] opacity-0 ease-in duration-300 pointer-events-none"
            )}>
                <div className="flex items-center gap-3">
                    {icon && (
                        <div className={cn(
                            "text-accent transition-all duration-300 ease-out",
                            message ? "scale-100 opacity-100 delay-150" : "scale-0 opacity-0"
                        )}>
                            {React.cloneElement(icon as React.ReactElement, { className: "h-4 w-4" })}
                        </div>
                    )}
                    <p className={cn(
                        "text-[10px] font-black uppercase tracking-widest text-primary-foreground transition-all duration-500 delay-100",
                        message ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                    )}>
                        {message}
                    </p>
                </div>
            </div>

            {/* Left Section: Menu + Logo */}
            <div className={cn(
                "flex items-center z-20 transition-all duration-500",
                isSearchOpen ? "opacity-0 pointer-events-none w-0" : "opacity-100"
            )}>
                <Button 
                    variant="ghost" 
                    size="icon"
                    className={cn(
                        "h-10 w-10 rounded-full bg-transparent hover:bg-white/10 transition-all shrink-0 group", 
                        navItemClass
                    )} 
                    onClick={() => toggleView('menu')}
                    aria-label="Toggle More Menu"
                >
                    <div className="relative flex items-center justify-center">
                        {mounted && (
                            <>
                            <MoreHorizontal className={cn(
                                "h-5 w-5 transition-all duration-500 group-hover:rotate-90",
                                isMenuOpen ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
                            )} />
                            <X className={cn(
                                "absolute h-5 w-5 transition-all duration-500",
                                isMenuOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"
                            )} />
                            </>
                        )}
                    </div>
                </Button>

                <Link 
                    href="/" 
                    className={cn(
                        "flex items-center justify-center h-7 w-7 transition-all duration-300 hover:scale-110 active:scale-95 ml-1 group/logo"
                    )} 
                    aria-label="SnipGeek Home"
                >
                    <SnipGeekLogo className="h-full w-full" />
                </Link>
            </div>

            {/* Middle Section: Direct Nav Links */}
            <div className={cn(
                "flex-1 flex items-center justify-center gap-1 transition-all duration-500",
                (isSearchOpen || message) ? "opacity-0 pointer-events-none" : "opacity-100"
            )}>
                {directLinks.map((item) => (
                    <Link 
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all hidden sm:flex items-center gap-2",
                            "hover:bg-white/10 hover:-translate-y-0.5",
                            pathname.includes(item.href) ? "text-primary-foreground bg-white/10" : "text-primary-foreground/60"
                        )}
                    >
                        <item.icon className="h-3.5 w-3.5" />
                        <span>{item.name}</span>
                    </Link>
                ))}
            </div>

            {/* Right Section: Utilities */}
            <div className={cn(
                "flex items-center gap-0.5 transition-all duration-500",
                (isSearchOpen || message) ? "opacity-0 pointer-events-none" : "opacity-100"
            )}>
                <ThemeSwitcher dictionary={dictionary} />
                
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                        "relative rounded-full h-10 w-10 bg-transparent hover:bg-white/10 transition-all group", 
                        navItemClass
                    )} 
                    onClick={() => toggleView('readingList')}
                    aria-label="Reading List"
                >
                    <Bookmark className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-1" />
                    {mounted && readingListItems.length > 0 && (
                        <span className={cn(
                            "absolute top-1.5 right-1.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-accent text-accent-foreground text-[9px] font-bold px-1 transition-all duration-300",
                            readingListItems.length > prevCount.current ? "animate-badge-pop ring-2 ring-accent/30" : "scale-100"
                        )}>
                            {readingListItems.length}
                        </span>
                    )}
                </Button>

                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn("h-10 w-10 rounded-full bg-transparent hover:bg-white/10 group", navItemClass)} 
                    onClick={() => toggleView('search')}
                    aria-label="Search"
                >
                    <Search className="h-5 w-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
                </Button>
            </div>
            
            {/* Search Input Overlay */}
            <div className={cn(
                "absolute inset-0 w-full h-full flex items-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-10",
                isSearchOpen ? "opacity-100 px-2" : "opacity-0 pointer-events-none"
            )}>
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-primary-foreground/70 pointer-events-none" />
                <Input 
                    ref={searchInputRef}
                    type="text" 
                    placeholder={dictionary.search.placeholder}
                    className="w-full h-full bg-transparent border-none rounded-full pl-14 pr-12 focus-visible:ring-0 focus-visible:ring-offset-0 text-primary-foreground placeholder:text-primary-foreground/50"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn("rounded-full absolute right-2 z-20 h-9 w-9 bg-transparent hover:bg-transparent", navItemClass)} 
                  onClick={() => { setActiveView('none'); setQuery(''); }}
                  aria-label={dictionary.search.close || "Close Search"}
                >
                   <X className="h-5 w-5" />
                </Button>
            </div>
        </nav>

        {/* More Menu Dropdown */}
        <div className={cn(
            "absolute top-full left-0 z-40 mt-4 w-48 bg-primary/95 backdrop-blur-md shadow-2xl ring-1 ring-black/5 rounded-xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
            "transform-origin-top-left",
            isMenuOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none invisible"
        )}>
            <div className="grid grid-cols-1">
                {mounted && (
                    <>
                        <div className="sm:hidden border-b border-white/10">
                            {directLinks.map((item) => (
                                <Link 
                                    key={item.href}
                                    href={item.href} 
                                    className={cn(
                                        "group relative flex items-center gap-4 px-6 py-3.5 text-[12px] font-black uppercase tracking-tighter hover:bg-white/5 transition-all", 
                                        navItemClass
                                    )} 
                                >
                                    <item.icon className="h-4 w-4 shrink-0 text-accent" />
                                    <span>{item.name}</span>
                                </Link>
                            ))}
                        </div>
                        {moreItems.map((item) => (
                            <Link 
                                key={item.href}
                                href={item.href} 
                                className={cn(
                                    "group relative flex items-center gap-4 px-6 py-3.5 text-[12px] font-black uppercase tracking-tighter hover:bg-white/5 transition-all", 
                                    navItemClass
                                )} 
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center" />
                                <item.icon className="h-4 w-4 shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:text-accent" />
                                <span className="transition-transform duration-300 group-hover:translate-x-1">{item.name}</span>
                            </Link>
                        ))}
                    </>
                )}
            </div>
        </div>

        {/* Search Results Dropdown */}
        <div className={cn(
            "absolute top-full left-0 right-0 z-30 mt-4 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
            isSearchOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-[0.97] -translate-y-4 pointer-events-none invisible"
        )}>
            <div className="bg-primary/95 backdrop-blur-xl rounded-2xl border border-primary-foreground/[0.08] shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)] max-h-[450px] overflow-hidden">
                  <div className="px-5 py-3 bg-primary-foreground/[0.02] border-b border-primary-foreground/[0.06] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-1.5 h-1.5 rounded-full transition-all duration-500",
                            query.length > 1 && results.length > 0 ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-primary-foreground/20"
                        )} />
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary-foreground/40">
                            {query.length > 1 ? `${results.length} ${dictionary.search.resultsFound}` : dictionary.search.prompt}
                        </p>
                      </div>
                      {query && (
                          <div className="px-2 py-0.5 rounded bg-primary-foreground/[0.05] text-[9px] font-mono text-primary-foreground/30 border border-primary-foreground/[0.05]">
                              &quot;{query}&quot;
                          </div>
                      )}
                  </div>
                  {mounted && (
                    <ScrollArea className="h-full max-h-[400px]">
                        <div className="p-2">
                            {query.length > 1 ? (
                                results.length > 0 ? (
                                    <ul className="grid grid-cols-1 gap-1">
                                        {results.map((item, idx) => {
                                          const config = typeConfig[item.type];
                                          return (
                                            <li key={`${item.type}-${item.slug}`} style={{ animationDelay: `${idx * 45}ms` }} className="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both">
                                                <Link href={item.href} className="block group px-3 py-2.5 rounded-xl hover:bg-primary-foreground/[0.05] transition-all duration-300 relative overflow-hidden">
                                                    {/* Left Accent Bar */}
                                                    <div className={cn("absolute left-0 top-2 bottom-2 w-0.5 rounded-full transition-transform duration-300 origin-center scale-y-0 group-hover:scale-y-100", config.accent)} />
                                                    
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn("w-[34px] h-[34px] rounded-[10px] flex items-center justify-center shrink-0", config.bg, config.color)}>
                                                            <config.icon className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-[13px] font-semibold text-primary-foreground/85 line-clamp-1 leading-snug transition-colors group-hover:text-accent">
                                                                <HighlightMatch text={item.title} query={query} />
                                                            </h4>
                                                            <p className="text-[11px] text-primary-foreground/35 line-clamp-1 mt-0.5">
                                                                <HighlightMatch text={item.description} query={query} />
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1">
                                                            <ArrowUpRight className="h-3.5 w-3.5 text-primary-foreground/20 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                                                            <span className={cn("text-[8px] font-black uppercase tracking-tighter", config.color)}>{item.type}</span>
                                                        </div>
                                                    </div>
                                                </Link>
                                            </li>
                                          );
                                        })}
                                    </ul>
                                ) : (
                                    <div className="p-16 text-center text-sm text-primary-foreground/20 italic flex flex-col items-center gap-4">
                                        <div className="relative">
                                            <Search className="h-10 w-10 opacity-5" />
                                            <X className="h-5 w-5 absolute -top-1 -right-1 opacity-10 text-destructive" />
                                        </div>
                                        <p>{dictionary.search.noResults} &quot;{query}&quot;.</p>
                                    </div>
                                )
                            ) : (
                                <div className="p-12">
                                    <p className="text-center text-[10px] text-primary-foreground/20 font-black uppercase tracking-widest mb-6">{dictionary.search.placeholder}</p>
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {['Hardware', 'Windows', 'Tutorial', 'Automation'].map((cat, i) => (
                                            <Badge 
                                              key={cat} 
                                              variant="outline" 
                                              className="px-4 py-1.5 rounded-full border-primary-foreground/5 bg-primary-foreground/[0.02] text-primary-foreground/40 cursor-pointer hover:bg-primary-foreground/10 hover:text-primary-foreground transition-all duration-300 animate-in fade-in zoom-in-95 fill-mode-both"
                                              style={{ animationDelay: `${i * 100}ms` }}
                                              onClick={() => setQuery(cat)}
                                            >
                                                {cat}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                  )}
              </div>
        </div>

        {/* Reading List Dropdown */}
        <div className={cn(
            "absolute top-full left-0 right-0 z-30 mt-4 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
            isReadingListOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-[0.97] -translate-y-4 pointer-events-none invisible"
        )}>
            <div className="bg-primary/95 backdrop-blur-xl rounded-2xl border border-primary-foreground/[0.08] shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)] max-h-[450px] overflow-hidden">
                <div className="px-5 py-3 bg-primary-foreground/[0.02] border-b border-primary-foreground/[0.06] flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary-foreground/40">
                      {dictionary.readingList.inYourList}
                    </p>
                    {/* Progress Dots */}
                    <div className="flex gap-1.5">
                        {mounted && readingListItems.slice(0, 5).map((item, i) => (
                            <div 
                                key={i} 
                                className={cn(
                                    "w-1.5 h-1.5 rounded-full animate-in fade-in zoom-in-50 duration-500 fill-mode-both",
                                    typeConfig[item.type].accent
                                )} 
                                style={{ animationDelay: `${i * 50}ms` }}
                            />
                        ))}
                    </div>
                </div>
                {mounted && (
                  <ScrollArea className="h-full max-h-[400px]">
                    <div className="p-2">
                      {readingListItems.length > 0 ? (
                        <ul className="grid grid-cols-1 gap-1">
                          {readingListItems.map((item, idx) => {
                            const config = typeConfig[item.type];
                            const ItemIcon = config.icon;
                            return (
                              <li 
                                  key={`${item.type}-${item.slug}`} 
                                  style={{ transitionDelay: `${idx * 30}ms` }} 
                                  className={cn(
                                      "group relative animate-in fade-in slide-in-from-left-2 duration-300",
                                      removingSlug === item.slug && "animate-out fade-out slide-out-to-right-4 duration-300 fill-mode-forwards"
                                  )}
                              >
                                  <div className="relative hover:bg-primary-foreground/[0.05] rounded-xl transition-all duration-300 overflow-hidden group">
                                      {/* Left Accent Bar */}
                                      <div className={cn("absolute left-0 top-2 bottom-2 w-0.5 rounded-full transition-transform duration-300 origin-center scale-y-0 group-hover:scale-y-100", config.accent)} />
                                      
                                      <div className="flex items-center gap-3 px-3 py-2.5 pr-12">
                                          {/* Morphing Number/Icon */}
                                          <div className="relative w-[34px] h-[34px] flex items-center justify-center shrink-0">
                                              <span className="text-[11px] font-black text-primary-foreground/20 group-hover:opacity-0 transition-opacity duration-200">
                                                  {idx + 1}
                                              </span>
                                              <div className="absolute inset-0 flex items-center justify-center opacity-0 scale-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200">
                                                  <div className={cn("w-full h-full rounded-[10px] flex items-center justify-center", config.bg, config.color)}>
                                                      <ItemIcon className="w-4 h-4" />
                                                  </div>
                                              </div>
                                          </div>

                                          <Link href={item.href} className="block flex-1 min-w-0">
                                              <h4 className="text-[13px] font-semibold text-primary-foreground/85 line-clamp-1 leading-snug transition-colors group-hover:text-accent">
                                                  {item.title}
                                              </h4>
                                              <p className="text-[11px] text-primary-foreground/35 line-clamp-1 mt-0.5 italic">
                                                  {item.description}
                                              </p>
                                          </Link>
                                      </div>

                                      <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="absolute top-1/2 -translate-y-1/2 right-3 h-7 w-7 rounded-full bg-red-500/10 text-red-400/70 hover:text-red-400 hover:bg-red-500/20 transition-all duration-300 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0" 
                                          onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              handleRemoveReadingListItem(item.slug);
                                          }}
                                          aria-label="Remove from Reading List"
                                      >
                                          <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                  </div>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <div className="p-20 text-center text-sm text-primary-foreground/20 italic flex flex-col items-center gap-6">
                          <div className="relative">
                              <div className="absolute inset-0 bg-primary-foreground/[0.04] rounded-full animate-ping scale-150" />
                              <div className="w-14 h-14 rounded-full bg-primary-foreground/[0.04] border border-primary-foreground/[0.08] flex items-center justify-center relative z-10">
                                  <Bookmark className="h-6 w-6 text-primary-foreground/30" />
                              </div>
                          </div>
                          <p className="max-w-[200px] leading-relaxed font-medium text-[12px] opacity-50">{dictionary.readingList.empty}</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </div>
        </div>
    </header>
  );
}
