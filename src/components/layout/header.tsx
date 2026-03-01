'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  ArrowUpRight,
  ChevronRight
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
import NextLink from 'next/link';

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
  const params = useParams();
  const [mounted, setMounted] = useState(false);
  const [isGlowing, setIsGlowing] = useState(false);
  const prevCount = useRef(readingListItems.length);

  const isSearchOpen = activeView === 'search';
  const isMenuOpen = activeView === 'menu';
  const isReadingListOpen = activeView === 'readingList';

  const currentLocale = (params.locale as string) || 'en';
  const linkPrefix = currentLocale === 'en' ? '' : `/${currentLocale}`;

  const favoriteTags = [
    { label: 'Windows', slug: 'windows' },
    { label: 'Android', slug: 'android' },
    { label: 'Tutorial', slug: 'tutorial' },
    { label: 'Hardware', slug: 'hardware' },
    { label: 'Automation', slug: 'automation' },
    { label: 'Office', slug: 'office' },
    { label: 'News', slug: 'news' },
  ];

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
      const delta = currentScrollY - lastScrollY.current;

      if (currentScrollY < 10) {
        setIsVisible(true);
      } else if (delta > 8 && currentScrollY > 68) {
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

  const directLinks = [
    { name: dictionary.navigation.blog, href: '/blog', icon: BookOpen },
    { name: dictionary.navigation.notes, href: '/notes', icon: StickyNote },
    { name: dictionary.navigation.tools, href: '/tools', icon: LayoutGrid },
  ];

  const moreItems = [
    { name: dictionary.navigation.about, href: '/about', icon: User },
    { name: dictionary.navigation.contact, href: '/contact', icon: Mail },
  ];

  const navItemClass = "transition-all duration-300 text-foreground/70 hover:text-foreground";

  return (
    <header 
      ref={headerRef} 
      style={{ willChange: 'transform' }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/50 transition-transform [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] will-change-transform",
        isVisible 
          ? "translate-y-0 duration-500" 
          : "-translate-y-full duration-300"
    )}>
        {/* Row 1: Brand & Primary Nav (Compact 36px) */}
        <div className="max-w-4xl mx-auto h-9 px-4 flex items-center justify-between relative">
            
            {/* Notification Overlay */}
            <div className={cn(
                "absolute inset-0 z-40 bg-background/95 backdrop-blur-md transition-all flex items-center justify-center px-6",
                isGlowing && "ring-b-2 ring-accent/20",
                (mounted && message) 
                    ? "translate-y-0 opacity-100 ease-out duration-500" 
                    : "translate-y-[-100%] opacity-0 ease-in duration-300 pointer-events-none"
            )}>
                <div className="flex items-center gap-3">
                    {icon && <div className="text-accent">{React.cloneElement(icon as React.ReactElement, { className: "h-4 w-4" })}</div>}
                    <p className="text-[9px] font-black uppercase tracking-widest text-foreground">
                        {message}
                    </p>
                </div>
            </div>

            {/* Left: Branding */}
            <div className={cn(
                "flex items-center transition-all duration-500",
                isSearchOpen ? "opacity-0 pointer-events-none" : "opacity-100"
            )}>
                <NextLink href="/" className="flex items-center gap-2 group" aria-label="SnipGeek Home">
                    <SnipGeekLogo className="h-6 w-6 group-hover:animate-wiggle" />
                    <div className="font-headline text-lg font-black tracking-tighter hidden sm:flex items-baseline">
                        <span className="text-foreground">Snip</span>
                        <span className="text-accent dark:text-foreground ml-px">Geek</span>
                    </div>
                </NextLink>
            </div>

            {/* Right: Nav + Utilities */}
            <div className={cn(
                "flex items-center gap-1 sm:gap-4 transition-all duration-500",
                isSearchOpen ? "opacity-0 pointer-events-none" : "opacity-100"
            )}>
                <nav className="hidden md:flex items-center gap-1">
                    {directLinks.map((item) => (
                        <NextLink 
                            key={item.href}
                            href={`${linkPrefix}${item.href}`}
                            className={cn(
                                "px-2 py-1 text-[9px] font-black uppercase tracking-widest transition-all",
                                "hover:-translate-y-0.5 active:scale-95",
                                pathname.includes(item.href) ? "text-accent" : "text-foreground/60 hover:text-foreground"
                            )}
                        >
                            {item.name}
                        </NextLink>
                    ))}
                </nav>

                <div className="flex items-center gap-0.5">
                    <Button 
                        variant="ghost" 
                        size="icon"
                        className={cn("h-8 w-8 rounded-full group", navItemClass)} 
                        onClick={() => toggleView('menu')}
                        aria-label="More Menu"
                    >
                        <div className="relative flex items-center justify-center">
                            {isMenuOpen ? <X className="h-4 w-4" /> : <MoreHorizontal className="h-4 w-4" />}
                        </div>
                    </Button>

                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn("relative h-8 w-8 rounded-full group", navItemClass)} 
                        onClick={() => toggleView('readingList')}
                        aria-label="Reading List"
                    >
                        <Bookmark className="h-4 w-4 transition-transform group-hover:-translate-y-1" />
                        {mounted && readingListItems.length > 0 && (
                            <span className="absolute top-1 right-1 flex h-3 min-w-[12px] items-center justify-center rounded-full bg-accent text-accent-foreground text-[8px] font-black px-1 animate-badge-pop">
                                {readingListItems.length}
                            </span>
                        )}
                    </Button>

                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn("h-8 w-8 rounded-full group", navItemClass)} 
                        onClick={() => toggleView('search')}
                        aria-label="Search"
                    >
                        <Search className="h-4 w-4 transition-transform group-hover:scale-110 group-hover:rotate-12" />
                    </Button>
                </div>
            </div>

            {/* Search Input Overlay */}
            <div className={cn(
                "absolute inset-0 w-full h-full flex items-center transition-all duration-500 z-10 px-4",
                isSearchOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
            )}>
                <Search className="h-5 w-5 text-foreground/40 mr-3" />
                <Input 
                    ref={searchInputRef}
                    placeholder={dictionary.search.placeholder}
                    className="flex-1 bg-transparent border-none text-base font-headline focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-foreground/20"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full h-8 w-8 hover:bg-transparent text-foreground/40 hover:text-foreground"
                  onClick={() => { setActiveView('none'); setQuery(''); }}
                >
                   <X className="h-5 w-5" />
                </Button>
            </div>
        </div>

        {/* Row 2: Tag Bar (Pill Navigation - Compact 32px) */}
        <div className="border-t border-border/10">
            <div className="max-w-4xl mx-auto h-8 flex items-center relative overflow-hidden">
                <ScrollArea className="w-full whitespace-nowrap" orientation="horizontal">
                    <div className="flex items-center gap-2 px-4 py-1.5">
                        {favoriteTags.map((tag) => {
                            const isActive = pathname.includes(`/tags/${tag.slug}`);
                            return (
                                <NextLink 
                                    key={tag.slug} 
                                    href={`${linkPrefix}/tags/${tag.slug}`}
                                    className={cn(
                                        "px-3 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all duration-300",
                                        isActive 
                                            ? "bg-accent text-accent-foreground border-accent shadow-md shadow-accent/10" 
                                            : "bg-muted/10 text-muted-foreground border-border/30 hover:bg-muted/30 hover:text-foreground hover:border-border"
                                    )}
                                >
                                    {tag.label}
                                </NextLink>
                            );
                        })}
                    </div>
                </ScrollArea>
                <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
            </div>
        </div>

        <div className="max-w-4xl mx-auto relative px-4">
            {/* More Menu */}
            <div className={cn(
                "absolute top-0 right-4 z-40 w-48 bg-background border border-border shadow-2xl rounded-lg overflow-hidden transition-all duration-300",
                isMenuOpen ? "opacity-100 scale-100 translate-y-2" : "opacity-0 scale-95 pointer-events-none"
            )}>
                <div className="py-1">
                    <div className="md:hidden border-b border-border pb-1 mb-1">
                        {directLinks.map((item) => (
                            <NextLink key={item.href} href={`${linkPrefix}${item.href}`} className="flex items-center gap-3 px-4 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-muted transition-colors">
                                <item.icon className="h-3.5 w-3.5 text-accent" />
                                {item.name}
                            </NextLink>
                        ))}
                    </div>
                    {moreItems.map((item) => (
                        <NextLink key={item.href} href={`${linkPrefix}${item.href}`} className="flex items-center gap-3 px-4 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-muted transition-colors">
                            <item.icon className="h-3.5 w-3.5 text-accent" />
                            {item.name}
                        </NextLink>
                    ))}
                </div>
            </div>

            {/* Reading List Overlay */}
            <div className={cn(
                "absolute top-0 left-4 right-4 z-30 bg-background border border-border shadow-2xl rounded-lg overflow-hidden transition-all duration-300",
                isReadingListOpen ? "opacity-100 scale-100 translate-y-2" : "opacity-0 scale-95 pointer-events-none"
            )}>
                <div className="p-3 border-b border-border bg-muted/10">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                        {readingListItems.length} {dictionary.readingList.inYourList}
                    </p>
                </div>
                <ScrollArea className="max-h-[300px]">
                    <div className="p-1.5">
                        {readingListItems.length > 0 ? (
                            <ul className="space-y-0.5">
                                {readingListItems.map((item) => {
                                    const config = typeConfig[item.type];
                                    return (
                                        <li key={`${item.type}-${item.slug}`} className={cn("transition-all", removingSlug === item.slug && "opacity-0 scale-95")}>
                                            <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-all group relative">
                                                <div className={cn("w-8 h-8 rounded-md flex items-center justify-center shrink-0", config.bg, config.color)}>
                                                    <config.icon className="w-4 h-4" />
                                                </div>
                                                <NextLink href={item.href} className="flex-1 min-w-0">
                                                    <h4 className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-accent transition-colors">{item.title}</h4>
                                                    <p className="text-[10px] text-muted-foreground line-clamp-1 opacity-60">/{item.slug}</p>
                                                </NextLink>
                                                <Button 
                                                    variant="ghost" size="icon" 
                                                    className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => handleRemoveReadingListItem(item.slug)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <div className="py-12 text-center text-muted-foreground flex flex-col items-center gap-3">
                                <Bookmark className="h-8 w-8 opacity-10" />
                                <p className="text-[9px] font-black uppercase tracking-widest opacity-40">{dictionary.readingList.empty}</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Search Results Overlay */}
            <div className={cn(
                "absolute top-0 left-4 right-4 z-30 bg-background border border-border shadow-2xl rounded-lg overflow-hidden transition-all duration-300",
                isSearchOpen ? "opacity-100 scale-100 translate-y-2" : "opacity-0 scale-95 pointer-events-none"
            )}>
                <ScrollArea className="max-h-[350px]">
                    <div className="p-1.5">
                        {query.length > 1 ? (
                            results.length > 0 ? (
                                <ul className="space-y-0.5">
                                    {results.map((item) => {
                                        const config = typeConfig[item.type];
                                        return (
                                            <li key={`${item.type}-${item.slug}`}>
                                                <NextLink href={item.href} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-all group">
                                                    <div className={cn("w-8 h-8 rounded-md flex items-center justify-center shrink-0", config.bg, config.color)}>
                                                        <config.icon className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-accent transition-colors">
                                                            <HighlightMatch text={item.title} query={query} />
                                                        </h4>
                                                        <p className="text-[10px] text-muted-foreground line-clamp-1">
                                                            <HighlightMatch text={item.description} query={query} />
                                                        </p>
                                                    </div>
                                                </NextLink>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <div className="py-10 text-center text-[10px] text-muted-foreground italic">No results found for "{query}".</div>
                            )
                        ) : (
                            <div className="p-6 text-center">
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-4">{dictionary.search.prompt}</p>
                                <div className="flex flex-wrap justify-center gap-1.5">
                                    {['Windows', 'Android', 'Hardware'].map(cat => (
                                        <Badge key={cat} variant="outline" className="px-3 py-0.5 rounded-full cursor-pointer hover:bg-accent hover:text-accent-foreground text-[8px] uppercase font-black" onClick={() => setQuery(cat)}>{cat}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    </header>
  );
}
