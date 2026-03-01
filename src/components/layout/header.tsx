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

const typeConfig = {
  blog: { 
    icon: BookOpen, 
    color: 'text-sky-400', 
    bg: 'bg-sky-500/10', 
    accent: 'bg-sky-500',
    label: 'Article'
  },
  note: { 
    icon: StickyNote, 
    color: 'text-amber-400', 
    bg: 'bg-amber-400/10', 
    accent: 'bg-amber-400',
    label: 'Note'
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

  const navItemClass = "h-9 w-9 rounded-xl transition-all duration-300 text-foreground/70 hover:text-foreground hover:bg-muted/60 flex items-center justify-center";

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
        {/* Main Bar: High Impact 64px */}
        <div className="max-w-4xl mx-auto h-16 min-h-[64px] px-4 flex items-center justify-between relative">
            
            {/* Notification Overlay */}
            <div className={cn(
                "absolute inset-0 z-40 bg-background/95 backdrop-blur-md transition-all flex items-center justify-center px-6",
                isGlowing && "border-b-2 border-accent/20",
                (mounted && message) 
                    ? "translate-y-0 opacity-100 ease-out duration-500 h-16" 
                    : "translate-y-[-100%] opacity-0 ease-in duration-300 pointer-events-none h-16"
            )}>
                <div className="flex items-center gap-3">
                    {icon && <div className="text-accent">{React.cloneElement(icon as React.ReactElement, { className: "h-5 w-5" })}</div>}
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground">
                        {message}
                    </p>
                </div>
            </div>

            {/* Left: Branding */}
            <div className={cn(
                "flex items-center transition-all duration-500",
                (isSearchOpen || isReadingListOpen) ? "opacity-0 pointer-events-none" : "opacity-100"
            )}>
                <NextLink href="/" className="flex items-center gap-3 group" aria-label="SnipGeek Home">
                    <SnipGeekLogo className="h-8 w-8 group-hover:animate-wiggle" />
                    <div className="font-headline text-xl font-black tracking-tighter hidden sm:flex items-baseline">
                        <span className="text-foreground">Snip</span>
                        <span className="text-accent dark:text-foreground ml-px">Geek</span>
                    </div>
                </NextLink>
            </div>

            {/* Right: Nav + Utilities */}
            <div className={cn(
                "flex items-center gap-4 transition-all duration-500",
                (isSearchOpen || isReadingListOpen) ? "opacity-0 pointer-events-none" : "opacity-100"
            )}>
                <nav className="hidden md:flex items-center gap-0">
                    {directLinks.map((item) => (
                        <NextLink 
                            key={item.href}
                            href={`${linkPrefix}${item.href}`}
                            className={cn(
                                "px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                                "hover:-translate-y-0.5 active:scale-95",
                                pathname.includes(item.href) ? "text-accent" : "text-foreground/60 hover:text-foreground"
                            )}
                        >
                            {item.name}
                        </NextLink>
                    ))}
                </nav>

                <div className="w-px h-4 bg-border hidden md:block" />

                <div className="relative flex items-center gap-1">
                    <Button 
                        variant="ghost" 
                        size="icon"
                        className={navItemClass} 
                        onClick={() => toggleView('menu')}
                        aria-label="More Menu"
                    >
                        {isMenuOpen ? <X className="h-5 w-5" /> : <MoreHorizontal className="h-5 w-5" />}
                    </Button>

                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn("relative", navItemClass)} 
                        onClick={() => toggleView('readingList')}
                        aria-label="Reading List"
                    >
                        <Bookmark className="h-5 w-5 transition-transform group-hover:-translate-y-1" />
                        {mounted && readingListItems.length > 0 && (
                            <span className="absolute top-1.5 right-1.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-accent text-accent-foreground text-[8px] font-black px-1 animate-badge-pop shadow-sm">
                                {readingListItems.length}
                            </span>
                        )}
                    </Button>

                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className={navItemClass} 
                        onClick={() => toggleView('search')}
                        aria-label="Search"
                    >
                        <Search className="h-5 w-5 transition-transform group-hover:scale-110 group-hover:rotate-12" />
                    </Button>

                    {/* More Menu Dropdown - Anchored to icon group */}
                    <div className={cn(
                        "absolute top-full left-0 mt-2 z-40 w-48 bg-background/95 backdrop-blur-md border border-border shadow-xl shadow-black/5 rounded-xl overflow-hidden transition-all duration-300",
                        isMenuOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                    )}>
                        <div className="py-2">
                            <div className="md:hidden border-b border-border pb-1 mb-1">
                                {directLinks.map((item) => (
                                    <NextLink key={item.href} href={`${linkPrefix}${item.href}`} className="flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider hover:bg-muted transition-colors rounded-lg mx-1">
                                        <item.icon className="h-4 w-4 text-accent" />
                                        {item.name}
                                    </NextLink>
                                ))}
                            </div>
                            {moreItems.map((item) => (
                                <NextLink key={item.href} href={`${linkPrefix}${item.href}`} className="flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider hover:bg-muted transition-colors rounded-lg mx-1">
                                    <item.icon className="h-4 w-4 text-accent" />
                                    {item.name}
                                </NextLink>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Input Overlay */}
            <div className={cn(
                "absolute inset-0 w-full h-16 flex items-center transition-all duration-500 z-10 px-6 bg-background",
                isSearchOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
            )}>
                <Search className="h-6 w-6 text-foreground/40 mr-4" />
                <Input 
                    ref={searchInputRef}
                    placeholder={dictionary.search.placeholder}
                    className="flex-1 bg-transparent border-none text-xl font-headline focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-foreground/20"
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

            {/* Reading List Bar Overlay */}
            <div className={cn(
                "absolute inset-0 w-full h-16 flex items-center justify-between transition-all duration-500 z-10 px-6 bg-background",
                isReadingListOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
            )}>
                <div className="flex items-center gap-3">
                    <Bookmark className="h-6 w-6 text-accent fill-current" />
                    <span className="font-headline text-xl font-black uppercase tracking-tight">Reading List</span>
                    {mounted && (
                        <Badge variant="secondary" className="rounded-full bg-accent/10 text-accent border-none font-black h-6 px-3">
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

        <div className="max-w-4xl mx-auto relative px-4">
            {/* Reading List Overlay (Compact Queue Style) */}
            <div className={cn(
                "absolute top-0 left-4 right-4 z-30 bg-background border border-border shadow-2xl rounded-xl overflow-hidden transition-all duration-300",
                isReadingListOpen ? "opacity-100 scale-100 translate-y-2" : "opacity-0 scale-95 pointer-events-none"
            )}>
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-4 pt-3 pb-2 border-b border-border">
                    {dictionary.readingList.inYourList}
                </div>
                <ScrollArea className="max-h-[300px]">
                    <div className="p-2 space-y-1">
                        {readingListItems.length > 0 ? (
                            readingListItems.map((item) => {
                                const dataItem = searchableData.find(d => d.slug === item.slug);
                                const imgUrl = dataItem ? getResolvedImage(dataItem) : '/images/blank/blank.webp';
                                const config = typeConfig[item.type];
                                
                                return (
                                    <div key={`${item.type}-${item.slug}`} className={cn("group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:bg-muted/50", removingSlug === item.slug && "opacity-0 scale-95")}>
                                        <NextLink href={item.href} className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-[52px] h-[39px] relative rounded-md overflow-hidden bg-muted shrink-0 border border-border/50">
                                                <Image src={imgUrl} alt="" fill className="object-cover" sizes="52px" />
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col">
                                                <h4 className="text-sm font-bold font-serif text-foreground line-clamp-1 group-hover:text-accent transition-colors">
                                                    {item.title}
                                                </h4>
                                                <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-wider">
                                                    {dataItem?.category || config.label}
                                                </span>
                                            </div>
                                        </NextLink>
                                        <Button 
                                            variant="ghost" size="icon" 
                                            className="h-8 w-8 rounded-full text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveReadingListItem(item.slug); }}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
                                <Bookmark className="h-8 w-8 opacity-20" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{dictionary.readingList.empty}</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                {readingListItems.length > 0 && (
                    <div className="border-t border-border mt-1 pt-2 px-4 pb-3">
                        <NextLink 
                            href={`${linkPrefix}/blog`} 
                            className="text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-accent transition-colors flex items-center gap-1"
                            onClick={() => setActiveView('none')}
                        >
                            Browse all posts <ArrowRight className="h-3 w-3" />
                        </NextLink>
                    </div>
                )}
            </div>

            {/* Search Results Overlay */}
            <div className={cn(
                "absolute top-0 left-4 right-4 z-30 bg-background border border-border shadow-2xl rounded-xl overflow-hidden transition-all duration-300",
                isSearchOpen ? "opacity-100 scale-100 translate-y-2" : "opacity-0 scale-95 pointer-events-none"
            )}>
                <ScrollArea className="max-h-[450px]">
                    <div className="p-2">
                        {query.length > 1 ? (
                            <>
                                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-4 py-2 border-b border-border">
                                    {results.length} {dictionary.search.resultsFound}
                                </div>
                                {results.length > 0 ? (
                                    <ul className="space-y-1 pt-1">
                                        {results.map((item) => {
                                            const resolvedHero = getResolvedImage(item);
                                            const config = typeConfig[item.type];
                                            return (
                                                <li key={`${item.type}-${item.slug}`}>
                                                    <NextLink href={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-all group">
                                                        <div className="w-[52px] h-[39px] relative rounded-md overflow-hidden bg-muted shrink-0 border border-border/50">
                                                            {item.heroImage ? (
                                                                <Image src={resolvedHero} alt="" fill className="object-cover" sizes="52px" />
                                                            ) : (
                                                                <div className={cn("w-full h-full flex items-center justify-center", config.bg, config.color)}>
                                                                    <config.icon className="w-4 h-4" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-sm font-bold font-serif text-foreground line-clamp-1 group-hover:text-accent transition-colors">
                                                                <HighlightMatch text={item.title} query={query} />
                                                            </h4>
                                                            <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-wider">
                                                                {item.category || config.label}
                                                            </span>
                                                        </div>
                                                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-accent transition-all group-hover:translate-x-1" />
                                                    </NextLink>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : (
                                    <div className="py-16 text-center flex flex-col items-center gap-3">
                                        <Search className="h-8 w-8 opacity-10 text-muted-foreground" />
                                        <p className="italic text-xs text-muted-foreground">{dictionary.search.noResults} "{query}"</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="p-0 space-y-4 pb-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-4 pt-3 pb-2">Quick picks</p>
                                    <div className="px-2 space-y-1">
                                        {quickPicks.map((item) => {
                                            const resolvedHero = getResolvedImage(item);
                                            const config = typeConfig[item.type];
                                            return (
                                                <NextLink key={item.slug} href={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-all group">
                                                    <div className="w-[52px] h-[39px] relative rounded-md overflow-hidden bg-muted shrink-0 border border-border/50">
                                                        <Image src={resolvedHero} alt="" fill className="object-cover" sizes="52px" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-bold font-serif text-foreground line-clamp-1 group-hover:text-accent transition-colors">
                                                            {item.title}
                                                        </h4>
                                                        <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-wider">
                                                            {item.category || config.label}
                                                        </span>
                                                    </div>
                                                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/20 group-hover:text-accent transition-all group-hover:translate-x-1" />
                                                </NextLink>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="px-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-3">{dictionary.search.prompt}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {['Windows', 'Android', 'Hardware'].map(cat => (
                                            <Badge key={cat} variant="outline" className="px-4 py-1 rounded-full cursor-pointer hover:bg-accent hover:text-accent-foreground text-[9px] uppercase font-black" onClick={() => setQuery(cat)}>{cat}</Badge>
                                        ))}
                                    </div>
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
