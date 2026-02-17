'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from './language-switcher';
import { TranslationsMap } from '@/lib/posts';
import { Search, X, Menu, Bookmark, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { usePathname } from 'next/navigation';
import { useReadingList } from '@/hooks/use-reading-list';
import type { Dictionary } from '@/lib/get-dictionary';

type SearchableItem = {
  slug: string;
  title: string;
  description: string;
  type: 'blog' | 'note';
  href: string;
};

type ActiveView = 'none' | 'search' | 'menu' | 'readingList';

export function Header({ translationsMap, searchableData, dictionary }: { translationsMap: TranslationsMap, searchableData: SearchableItem[], dictionary: Dictionary }) {
  const [isVisible, setIsVisible] = useState(true);
  const [activeView, setActiveView] = useState<ActiveView>('none');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchableItem[]>([]);
  const { items: readingListItems, removeItem: removeReadingListItem } = useReadingList();
  const lastScrollY = useRef(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  const isSearchOpen = activeView === 'search';
  const isMenuOpen = activeView === 'menu';
  const isReadingListOpen = activeView === 'readingList';

  // Close all views on route change
  useEffect(() => {
    setActiveView('none');
    setQuery('');
  }, [pathname]);

  // Search logic
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


  // Scroll visibility logic
  useEffect(() => {
    const handleScroll = () => {
      if (activeView !== 'none') return;
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
  }, [activeView]);

  // Focus input when search opens
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);
  
  // Close all views on click outside or escape key
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
  ];

  const moreMenuItems = [
    { name: dictionary.navigation.about, href: '/about' },
  ];
  
  const allMobileMenuItems = [...menuItems, ...moreMenuItems];

  return (
    <header ref={headerRef} className={cn(
        "fixed top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:right-auto z-50 transition-all duration-300 ease-in-out",
        isSearchOpen ? 'md:w-full max-w-lg' : 'md:w-auto',
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-16"
    )}>
        <nav className={cn(
            "relative mx-auto bg-primary/90 backdrop-blur-sm text-primary-foreground shadow-lg ring-1 ring-black/5 flex items-center justify-between h-12 transition-all duration-300 ease-in-out px-2",
            isSearchOpen && 'md:w-full',
            isSearchOpen ? 'rounded-full' : 'w-full md:w-auto',
            (isMenuOpen || isReadingListOpen) ? 'rounded-t-2xl rounded-b-none' : 'rounded-full'
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
                
                <div className="flex-grow hidden md:block" />

            </div>
            
            <div className={cn(
                "flex items-center gap-1 transition-opacity duration-300",
                isSearchOpen ? "opacity-0 pointer-events-none" : "opacity-100"
            )}>
                {/* Mobile controls */}
                <div className={cn("flex md:hidden items-center", isSearchOpen && "opacity-0 pointer-events-none")}>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full relative z-20 h-9 w-9"
                        onClick={() => toggleView('search')}
                        aria-label="Open search"
                    >
                       <Search className="h-5 w-5" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full relative z-20 h-9 w-9"
                        onClick={() => toggleView('readingList')}
                        aria-label="Open reading list"
                    >
                       <Bookmark className="h-5 w-5" />
                       {readingListItems.length > 0 && (
                            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-bold px-1">
                                {readingListItems.length}
                            </span>
                       )}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => toggleView('menu')}>
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </div>

                {/* Desktop controls */}
                <div className="hidden md:flex items-center gap-2">
                    {menuItems.map(item => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="px-3 py-1 text-sm font-medium rounded-full hover:bg-primary-foreground/10 transition-colors"
                        >
                            {item.name}
                        </Link>
                    ))}
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-full text-primary-foreground/70 hover:text-primary-foreground" 
                        onClick={() => toggleView('menu')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                        <span className="sr-only">Open more menu items</span>
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="relative z-20 h-9 w-9 rounded-full"
                        onClick={() => toggleView('readingList')}
                        aria-label="Open reading list"
                    >
                       <Bookmark className="h-5 w-5" />
                       {readingListItems.length > 0 && (
                            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-bold px-1">
                                {readingListItems.length}
                            </span>
                       )}
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn("rounded-full relative z-20 h-9 w-9", isSearchOpen && "opacity-0 pointer-events-none")}
                        onClick={() => toggleView('search')}
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
                    placeholder={dictionary.search.placeholder}
                    className="w-full h-full bg-transparent border-none rounded-full pl-12 pr-12 focus-visible:ring-0 focus-visible:ring-offset-0 text-primary-foreground placeholder:text-primary-foreground/50"
                    aria-hidden={!isSearchOpen}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full absolute right-2 z-20 h-9 w-9"
                    onClick={() => { setActiveView('none'); setQuery(''); }}
                    aria-label="Close search"
                >
                   <X className="h-5 w-5" />
                </Button>
            </div>
        </nav>

        {/* Custom Menu */}
        <div className={cn(
            "absolute top-full left-0 right-0 z-40 bg-primary/90 backdrop-blur-sm shadow-lg ring-1 ring-black/5 rounded-b-2xl overflow-hidden transition-all duration-300 ease-in-out",
            "transform-origin-top",
            isMenuOpen ? "opacity-100 scale-y-100" : "opacity-0 scale-y-95 pointer-events-none"
        )}>
            {/* Mobile Menu */}
            <div className="md:hidden p-2">
                {allMobileMenuItems.map((item) => (
                    <Link key={item.name} href={item.href} className="block px-4 py-3 text-base text-primary-foreground rounded-lg hover:bg-primary-foreground/10 transition-colors" onClick={() => setActiveView('none')}>
                        {item.name}
                    </Link>
                ))}
            </div>
            {/* Desktop Menu */}
            <div className="hidden md:block p-2">
                {moreMenuItems.map((item) => (
                    <Link key={item.name} href={item.href} className="block px-4 py-2 text-sm text-primary-foreground rounded-lg hover:bg-primary-foreground/10 transition-colors" onClick={() => setActiveView('none')}>
                        {item.name}
                    </Link>
                ))}
            </div>
        </div>

        {/* Results Container */}
        <div className="absolute top-full left-0 right-0 z-30 mt-2">
          {/* Search Results */}
          {isSearchOpen && (
            <div className="bg-background rounded-lg border shadow-lg max-h-[400px] overflow-hidden">
                  {query.length > 1 ? (
                      results.length > 0 ? (
                          <ScrollArea className="h-full max-h-[400px]">
                              <div className="p-2">
                                  <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{results.length} {dictionary.search.resultsFound}</p>
                                  <ul>
                                      {results.map((item) => (
                                      <li key={`${item.type}-${item.slug}`}>
                                          <Link 
                                              href={item.href} 
                                              onClick={handleResultClick} 
                                              className="block p-3 rounded-md hover:bg-accent transition-colors"
                                          >
                                              <div className="overflow-hidden">
                                                  <div className="flex items-start justify-between gap-2">
                                                      <span className="font-medium text-sm text-primary line-clamp-2 flex-1 min-w-0">{item.title}</span>
                                                      <Badge variant="outline" className="capitalize text-xs shrink-0">{item.type}</Badge>
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
                          <div className="p-6 text-center text-sm text-muted-foreground">
                              {dictionary.search.noResults} &quot;{query}&quot;.
                          </div>
                      )
                  ) : (
                      <div className="p-6 text-center text-sm text-muted-foreground">
                          {dictionary.search.prompt}
                      </div>
                  )}
              </div>
          )}

          {/* Reading List Results */}
          {isReadingListOpen && (
            <div className="bg-background rounded-lg border shadow-lg max-h-[400px] overflow-hidden">
                <ScrollArea className="h-full max-h-[400px]">
                  <div className="p-2">
                    <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      {readingListItems.length} {readingListItems.length === 1 ? dictionary.readingList.item : dictionary.readingList.items} {dictionary.readingList.inYourList}
                    </p>
                    {readingListItems.length > 0 ? (
                      <ul>
                        {readingListItems.map((item) => (
                          <li key={`${item.type}-${item.slug}`} className="group relative">
                              <Link 
                                  href={item.href} 
                                  onClick={() => setActiveView('none')} 
                                  className="block p-3 rounded-md hover:bg-accent transition-colors"
                              >
                                  <div className="overflow-hidden pr-8">
                                      <div className="flex items-start justify-between gap-2">
                                          <span className="font-medium text-sm text-primary line-clamp-2 flex-1 min-w-0">{item.title}</span>
                                          <Badge variant="outline" className="capitalize text-xs shrink-0">{item.type}</Badge>
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                                  </div>
                              </Link>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeReadingListItem(item.slug)}
                                aria-label={`Remove ${item.title} from reading list`}
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-6 text-center text-sm text-muted-foreground">
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
