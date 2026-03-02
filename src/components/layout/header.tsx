'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { usePathname, useParams } from 'next/navigation';
import { useReadingList } from '@/hooks/use-reading-list';
import { useNotification } from '@/hooks/use-notification';
import type { Dictionary } from '@/lib/get-dictionary';
import { SnipGeekLogo } from '@/components/icons/snipgeek-logo';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import NextLink from 'next/link';
import Image from 'next/image';
import { CategoryBadge, categoryColorMap } from '@/components/layout/category-badge';

type SearchableItem = {
  slug: string;
  title: string;
  description: string;
  type: 'blog' | 'note';
  href: string;
  heroImage?: string;
  category?: string;
};

type ActiveView = 'none' | 'search' | 'menu' | 'readingList';

const getTimeLabel = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "🌤 Good Morning Reads";
  if (hour >= 12 && hour < 17) return "☀️ Afternoon Picks";
  if (hour >= 17 && hour < 21) return "🌆 Evening Picks";
  return "🌙 Night Owl Picks";
};

const HighlightMatch = ({ text, query }: { text: string; query: string }) => {
  if (!query.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-accent/30 text-accent-foreground rounded-[2px] px-0.5 font-bold">
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
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>('none');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchableItem[]>([]);
  const [removingSlug, setRemovingSlug] = useState<string | null>(null);
  const [timeLabel, setTimeLabel] = useState("");
  const [mounted, setMounted] = useState(false);
  
  const { items: readingListItems, removeItem: removeReadingListItem } = useReadingList();
  const { message, icon, progress, notify, clear } = useNotification();
  
  const lastScrollY = useRef(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const params = useParams();
  const prevCount = useRef(readingListItems.length);

  const isSearchOpen = activeView === 'search';
  const isMenuOpen = activeView === 'menu';
  const isReadingListOpen = activeView === 'readingList';

  const currentLocale = (params.locale as string) || 'en';
  const linkPrefix = currentLocale === 'en' ? '' : `/${currentLocale}`;

  useEffect(() => {
    setMounted(true);
    setTimeLabel(getTimeLabel());
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
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 10);

      if (activeView !== 'none' || message) return;
      const delta = currentScrollY - lastScrollY.current;

      if (currentScrollY < 10) {
        setIsVisible(true);
      } else if (delta > 8 && currentScrollY > 64) {
        setIsVisible(false);
      } else if (delta < -8) {
        setIsVisible(true);
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

  const getResolvedImage = (item: SearchableItem) => {
    if (!item.heroImage) return '/images/blank/blank.webp';
    if (item.heroImage.startsWith('http') || item.heroImage.startsWith('/')) {
      return item.heroImage;
    }
    const placeholder = PlaceHolderImages.find(p => p.id === item.heroImage);
    return placeholder?.imageUrl || '/images/blank/blank.webp';
  };

  const quickPicks = useMemo(() => {
    return searchableData.slice(0, 3);
  }, [searchableData]);

  const directLinks = [
    { name: dictionary.navigation.blog, href: '/blog', icon: BookOpen },
    { name: dictionary.navigation.notes, href: '/notes', icon: StickyNote },
    { name: dictionary.navigation.tools, href: '/tools', icon: LayoutGrid },
  ];

  const moreItems = [
    { name: dictionary.navigation.about, href: '/about', icon: User },
    { name: dictionary.navigation.contact, href: '/contact', icon: Mail },
  ];

  const navItemClass = "h-9 w-9 rounded-xl transition-all duration-300 text-foreground/70 hover:text-foreground hover:bg-muted/60 flex items-center justify-center relative";

  return (
    <header 
      ref={headerRef} 
      data-scrolled={isScrolled}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/50 transition-all [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] will-change-transform overflow-visible",
        isVisible ? "translate-y-0 duration-500" : "-translate-y-full duration-300",
        isScrolled && "shadow-sm border-border/80"
    )}>
        <div className="max-w-4xl mx-auto h-16 min-h-[64px] px-4 md:px-6 flex items-center justify-between relative overflow-visible">
            
            {/* Notification Overlay - Solid Background Version */}
            <div className={cn(
                "absolute inset-0 z-40 h-16 flex flex-col overflow-hidden",
                "bg-background border-b border-border shadow-sm", // Solid background, no blur
                (mounted && message)
                ? [
                    "translate-y-0 opacity-100",
                    "duration-500 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",
                    ].join(" ")
                : [
                    "translate-y-[-100%] opacity-0",
                    "duration-[200ms] ease-in pointer-events-none",
                    ].join(" ")
            )}>
                {/* Content row with stagger */}
                <div className="flex-1 flex items-center justify-center gap-3 px-6 relative">
                    {/* Icon — slide from left, delay 80ms */}
                    <div className={cn(
                        "text-accent transition-all duration-300",
                        message
                        ? "opacity-100 translate-x-0 scale-100 delay-[80ms]"
                        : "opacity-0 -translate-x-2 scale-75"
                    )}>
                        {icon && React.cloneElement(icon as React.ReactElement,
                        { className: "h-5 w-5" }
                        )}
                    </div>

                    {/* Text — slide from bottom, delay 120ms */}
                    <p className={cn(
                        "font-sans text-[10px] font-black uppercase tracking-widest",
                        "transition-all duration-300",
                        message
                        ? "opacity-100 translate-y-0 delay-[120ms]"
                        : "opacity-0 translate-y-1"
                    )}>
                        {message}
                    </p>

                    {/* Dismiss button */}
                    <button
                        onClick={clear}
                        className={cn(
                        "absolute right-4 h-8 w-8 rounded-full flex items-center justify-center",
                        "text-foreground/25 hover:text-foreground/60 hover:bg-muted/50",
                        "transition-all duration-150",
                        message ? "opacity-100 delay-[200ms]" : "opacity-0"
                        )}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Progress bar countdown */}
                <div className="h-[2px] bg-accent/10">
                    <div
                        className="h-full bg-accent/50 transition-none"
                        style={{
                        width: `${progress}%`,
                        boxShadow: '0 0 6px hsl(var(--accent) / 0.4)',
                        borderRadius: '0 2px 2px 0',
                        }}
                    />
                </div>
            </div>

            {/* Left: Branding */}
            <div className={cn(
                "flex items-center transition-all duration-500",
                (isSearchOpen || isReadingListOpen) ? "opacity-0 pointer-events-none" : "opacity-100"
            )}>
                <NextLink href="/" className="flex items-center gap-3 group" aria-label="SnipGeek Home">
                    <SnipGeekLogo className="h-8 w-8 group-hover:animate-wiggle" />
                    <div className="font-display text-xl font-black tracking-[-0.03em] hidden sm:flex items-baseline">
                        <span className="text-foreground">Snip</span>
                        <span className="text-accent dark:text-foreground ml-px">Geek</span>
                    </div>
                </NextLink>
            </div>

            {/* Center: Navigation (md+) */}
            <nav className={cn(
                "hidden md:flex items-center gap-0 absolute left-1/2 -translate-x-1/2 transition-all duration-500",
                (isSearchOpen || isReadingListOpen) ? "opacity-0 pointer-events-none" : "opacity-100"
            )}>
                {directLinks.map((item) => {
                    const isActive = pathname.includes(item.href);
                    return (
                        <NextLink 
                            key={item.href}
                            href={`${linkPrefix}${item.href}`}
                            className={cn(
                                "px-3 py-2 font-sans text-[10px] font-black uppercase tracking-[0.12em] transition-all relative",
                                isActive ? "text-accent" : "text-foreground/60 hover:text-foreground"
                            )}
                        >
                            {item.name}
                            <div className={cn(
                                "absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] bg-accent transition-all duration-300",
                                isActive ? "w-4" : "w-0"
                            )} />
                        </NextLink>
                    );
                })}
            </nav>

            {/* Right: Utilities Container */}
            <div className={cn(
                "flex items-center gap-1 transition-all duration-500",
                (isSearchOpen || isReadingListOpen) ? "opacity-0 pointer-events-none" : "opacity-100"
            )}>
                {/* 1. More Menu Toggle */}
                <div className="relative">
                    <Button 
                        variant="ghost" 
                        size="icon"
                        className={navItemClass} 
                        onClick={() => toggleView('menu')}
                        aria-label="More Menu"
                    >
                        <MoreHorizontal className={cn(
                            "h-5 w-5 transition-all duration-300",
                            isMenuOpen ? "rotate-90 opacity-0 scale-0 absolute" : "opacity-100 scale-100"
                        )} />
                        <X className={cn(
                            "h-5 w-5 transition-all duration-300",
                            isMenuOpen ? "opacity-100 scale-100" : "-rotate-90 opacity-0 scale-0 absolute"
                        )} />
                    </Button>

                    {/* FLOATING MORE MENU DROPDOWN */}
                    <div className={cn(
                        "absolute top-full right-0 mt-5 min-w-[220px] bg-background/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl overflow-hidden origin-top-right transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] z-[100] ring-1 ring-black/[0.03]",
                        isMenuOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-[0.95] -translate-y-2 pointer-events-none"
                    )}>
                        <div className="py-3">
                            <div className="px-4 py-2 mb-1">
                                <p className="font-sans text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">SnipGeek · Navigate</p>
                            </div>
                            
                            <div className="md:hidden border-b border-border mb-1 pb-1">
                                {directLinks.map((item) => (
                                    <NextLink 
                                        key={item.href} 
                                        href={`${linkPrefix}${item.href}`} 
                                        className="group/item flex items-center gap-3 px-4 py-2.5 font-sans text-[11px] font-bold uppercase tracking-wider hover:bg-muted transition-colors rounded-lg mx-1 relative"
                                        onClick={() => setActiveView('none')}
                                    >
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-accent opacity-0 group-hover/item:opacity-60 transition-opacity" />
                                        <item.icon className="h-4 w-4 text-accent" />
                                        {item.name}
                                    </NextLink>
                                ))}
                            </div>

                            <div className="pt-1">
                                <div className="px-4 py-2">
                                    <p className="font-sans text-[8px] font-black uppercase tracking-[0.15em] text-accent">Connect</p>
                                </div>
                                {moreItems.map((item) => (
                                    <NextLink 
                                        key={item.href} 
                                        href={`${linkPrefix}${item.href}`} 
                                        className="group/item flex items-center gap-3 px-4 py-2.5 font-sans text-[11px] font-bold uppercase tracking-wider hover:bg-muted transition-colors rounded-lg mx-1 relative"
                                        onClick={() => setActiveView('none')}
                                    >
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-accent opacity-0 group-hover/item:opacity-60 transition-opacity" />
                                        <item.icon className="h-4 w-4 text-accent" />
                                        {item.name}
                                    </NextLink>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vertical Divider */}
                <div className="w-px h-4 bg-border/70 mx-0.5 hidden sm:block" />

                {/* 2. Bookmark Icon */}
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={navItemClass} 
                    onClick={() => toggleView('readingList')}
                    aria-label="Reading List"
                >
                    <Bookmark className={cn(
                        "h-5 w-5 transition-all duration-300",
                        readingListItems.length > 0 ? "fill-accent text-accent" : ""
                    )} />
                    {mounted && readingListItems.length > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-accent text-accent-foreground font-sans text-[8px] font-black px-1 animate-badge-pop shadow-sm">
                            {readingListItems.length}
                        </span>
                    )}
                </Button>

                {/* 3. Search Icon */}
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={navItemClass} 
                    onClick={() => toggleView('search')}
                    aria-label="Search"
                >
                    <Search className="h-5 w-5 transition-transform group-hover:scale-110 group-hover:rotate-12" />
                </Button>
            </div>

            {/* BAR OVERLAYS (Only for Search and Reading List) */}
            <div className={cn(
                "absolute inset-0 w-full h-16 flex items-center transition-all duration-[280ms] [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] z-10 px-6 bg-background",
                isSearchOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
            )}>
                <Search className="h-6 w-6 text-foreground/40 mr-4" />
                <Input 
                    ref={searchInputRef}
                    placeholder={dictionary.search.placeholder}
                    className="flex-1 bg-transparent border-none text-xl font-display font-black tracking-tight focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:font-sans placeholder:text-foreground/20 placeholder:font-normal placeholder:tracking-normal"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full h-10 w-10 hover:bg-transparent text-foreground/40 hover:text-foreground"
                  onClick={() => { setActiveView('none'); setQuery(''); }}
                >
                   <X className="h-6 w-6" />
                </Button>
            </div>

            <div className={cn(
                "absolute inset-0 w-full h-16 flex items-center justify-between transition-all duration-[280ms] [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] z-10 px-6 bg-background",
                isReadingListOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
            )}>
                <div className="flex items-center gap-3">
                    <Bookmark className="h-6 w-6 text-accent fill-current" />
                    <span className="font-display text-xl font-black uppercase tracking-tight">Reading List</span>
                    {mounted && (
                        <Badge variant="secondary" className="rounded-full bg-accent/10 text-accent border-none font-sans font-black h-6 px-3">
                            {readingListItems.length}
                        </Badge>
                    )}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full h-10 w-10 hover:bg-transparent text-foreground/40 hover:text-foreground"
                  onClick={() => { setActiveView('none'); }}
                >
                   <X className="h-6 w-6" />
                </Button>
            </div>
        </div>

        <div className="max-w-4xl mx-auto relative px-4 md:px-6 overflow-visible">
            {/* Reading List Results Panel */}
            <div className={cn(
                "absolute top-0 left-4 right-4 md:left-6 md:right-6 z-30 bg-background border border-border shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]",
                isReadingListOpen ? "opacity-100 scale-100 translate-y-2" : "opacity-0 scale-[0.97] -translate-y-1 pointer-events-none"
            )}>
                <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-border bg-muted/5">
                    <p className="font-sans text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">Queue · {readingListItems.length} items</p>
                    {readingListItems.length > 0 && (
                        <button className="font-sans text-[9px] font-black uppercase tracking-wider text-destructive hover:opacity-70 transition-opacity">Clear all</button>
                    )}
                </div>
                <ScrollArea className="max-h-[300px]">
                    <div className="p-2 space-y-1">
                        {readingListItems.length > 0 ? (
                            readingListItems.map((item) => {
                                const dataItem = searchableData.find(d => d.slug === item.slug);
                                const imgUrl = dataItem ? getResolvedImage(dataItem as SearchableItem) : '/images/blank/blank.webp';
                                
                                return (
                                    <div key={`${item.type}-${item.slug}`} className={cn(
                                        "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-[320ms] hover:bg-muted/50", 
                                        removingSlug === item.slug && "opacity-0 -translate-x-2 scale-[0.96] ease-in"
                                    )}>
                                        <NextLink href={item.href} className="flex items-center gap-3 flex-1 min-w-0" onClick={() => setActiveView('none')}>
                                            <div className="w-[52px] h-[39px] relative rounded-md overflow-hidden bg-muted shrink-0 border border-border/50">
                                                <Image src={imgUrl} alt="" fill className="object-cover" sizes="52px" />
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col">
                                                <h4 className="font-sans text-sm font-bold text-foreground line-clamp-1 group-hover:text-accent transition-colors leading-tight">
                                                    {item.title}
                                                </h4>
                                                <div className="mt-1">
                                                    <CategoryBadge category={dataItem?.category} type={item.type} />
                                                </div>
                                            </div>
                                        </NextLink>
                                        <Button 
                                            variant="ghost" size="icon" 
                                            className="h-8 w-8 rounded-full text-destructive opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0"
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveReadingListItem(item.slug); }}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-4">
                                <div className="p-4 bg-muted/30 rounded-2xl">
                                    <Bookmark className="h-8 w-8 opacity-20" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-sans text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{dictionary.readingList.empty}</p>
                                    <NextLink href={`${linkPrefix}/blog`} onClick={() => setActiveView('none')} className="font-sans text-[11px] font-bold text-accent hover:underline flex items-center justify-center gap-1">
                                        Start Reading <ArrowRight className="h-3 w-3" />
                                    </NextLink>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                {readingListItems.length > 0 && (
                    <div className="border-t border-border mt-1 p-1">
                        <NextLink 
                            href={`${linkPrefix}/blog`} 
                            className="w-full py-2.5 flex items-center justify-center gap-2 font-sans text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:bg-muted hover:text-accent transition-all rounded-lg"
                            onClick={() => setActiveView('none')}
                        >
                            Browse all posts <ArrowRight className="h-3 w-3" />
                        </NextLink>
                    </div>
                )}
            </div>

            {/* Search Results Panel */}
            <div className={cn(
                "absolute top-0 left-4 right-4 md:left-6 md:right-6 z-30 bg-background border border-border shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]",
                isSearchOpen ? "opacity-100 scale-100 translate-y-2" : "opacity-0 scale-[0.97] -translate-y-1 pointer-events-none"
            )}>
                <ScrollArea className="max-h-[450px]">
                    <div className="p-2">
                        {query.length > 1 ? (
                            <>
                                <div className="font-sans text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 px-4 py-2 border-b border-border bg-muted/5">
                                    {results.length} {dictionary.search.resultsFound} for "{query}"
                                </div>
                                {results.length > 0 ? (
                                    <ul className="space-y-1 pt-1">
                                        {results.map((item) => {
                                            const resolvedHero = getResolvedImage(item);
                                            return (
                                                <li key={`${item.type}-${item.slug}`}>
                                                    <NextLink href={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-all group" onClick={() => setActiveView('none')}>
                                                        <div className="w-[52px] h-[39px] relative rounded-md overflow-hidden bg-muted shrink-0 border border-border/50">
                                                            <Image src={resolvedHero} alt="" fill className="object-cover" sizes="52px" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-sans text-sm font-bold text-foreground line-clamp-1 group-hover:text-accent transition-colors leading-tight">
                                                                <HighlightMatch text={item.title} query={query} />
                                                            </h4>
                                                            <div className="mt-1">
                                                                <CategoryBadge category={item.category} type={item.type} />
                                                            </div>
                                                        </div>
                                                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-accent transition-all group-hover:translate-x-1" />
                                                    </NextLink>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : (
                                    <div className="py-16 text-center flex flex-col items-center gap-3">
                                        <div className="p-4 bg-muted/30 rounded-2xl">
                                            <Search className="h-8 w-8 opacity-10 text-muted-foreground" />
                                        </div>
                                        <p className="font-sans italic text-xs text-muted-foreground">{dictionary.search.noResults} "{query}"</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="p-0 space-y-4 pb-4">
                                <div className="space-y-1">
                                    <p className="font-sans text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 px-4 pt-3 pb-2">{mounted ? timeLabel : ''}</p>
                                    <div className="px-2 space-y-1">
                                        {quickPicks.map((item) => {
                                            const resolvedHero = getResolvedImage(item);
                                            return (
                                                <NextLink key={item.slug} href={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-all group" onClick={() => setActiveView('none')}>
                                                    <div className="w-[52px] h-[39px] relative rounded-md overflow-hidden bg-muted shrink-0 border border-border/50">
                                                        <Image src={resolvedHero} alt="" fill className="object-cover" sizes="52px" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-sans text-sm font-bold text-foreground line-clamp-1 group-hover:text-accent transition-colors leading-tight">
                                                            {item.title}
                                                        </h4>
                                                        <div className="mt-1">
                                                            <CategoryBadge category={item.category} type={item.type} />
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/20 group-hover:text-accent transition-all group-hover:translate-x-1" />
                                                </NextLink>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="px-4">
                                    <p className="font-sans text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/40 mb-3">{dictionary.search.prompt}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {['Windows', 'Android', 'Hardware', 'Tutorial', 'Tips'].map(cat => {
                                            const style = categoryColorMap[cat] || { border: 'border-border', text: 'text-muted-foreground', bg: 'bg-muted/50' };
                                            return (
                                                <button 
                                                    key={cat} 
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-full border font-sans text-[9px] font-black uppercase tracking-wider transition-all",
                                                        "hover:scale-105 active:scale-95",
                                                        style.border, style.text, style.bg, "hover:opacity-80"
                                                    )}
                                                    onClick={() => setQuery(cat)}
                                                >
                                                    {cat}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <div className="px-4 py-2 border-t border-border bg-muted/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <kbd className="px-1.5 py-0.5 rounded border bg-background font-sans text-[8px] font-bold shadow-sm">ESC</kbd>
                            <span className="font-sans text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">to close</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <kbd className="px-1.5 py-0.5 rounded border bg-background font-sans text-[8px] font-bold shadow-sm">↑↓</kbd>
                            <span className="font-sans text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">to navigate</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </header>
  );
}