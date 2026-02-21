'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Search, X, Menu, Bookmark, Trash2, MoreHorizontal } from 'lucide-react';
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

export function Header({ searchableData, dictionary }: { searchableData: SearchableItem[], dictionary: Dictionary }) {
  const [isVisible, setIsVisible] = useState(true);
  const [activeView, setActiveView] = useState<ActiveView>('none');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchableItem[]>([]);
  const { items: readingListItems, removeItem: removeReadingListItem } = useReadingList();
  const lastScrollY = useRef(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  const isSearchOpen = activeView === 'search';
  const isMenuOpen = activeView === 'menu';
  const isReadingListOpen = activeView === 'readingList';

  useEffect(() => {
    setMounted(true);
  }, []);

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
  ];

  const moreMenuItems = [
    { name: dictionary.navigation.about, href: '/about' },
    { name: dictionary.navigation.contact, href: '/contact' },
  ];
  
  const allMobileMenuItems = [...menuItems, ...moreMenuItems];

  const navItemClass = "transition-all duration-300 text-primary-foreground/70 hover:text-primary-foreground";

  return (
    <header ref={headerRef} className={cn(
        "fixed top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:right-auto z-50 transition-all duration-300 ease-in-out",
        isSearchOpen ? 'md:w-[560px]' : 'md:w-[520px]',
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-16"
    )}>
        <nav className={cn(
            "relative mx-auto bg-primary/90 backdrop-blur-sm text-primary-foreground shadow-lg ring-1 ring-black/5 flex items-center justify-between h-12 transition-all duration-300 ease-in-out pr-4 rounded-full overflow-hidden"
        )}>
            <div className={cn(
                "flex items-center flex-grow md:flex-grow-0 h-full transition-all duration-300 ease-in-out",
                isSearchOpen ? 'w-0 opacity-0 -translate-x-10 pointer-events-none' : 'w-auto opacity-100 translate-x-0'
            )}>
                <Link href="/" className="flex items-center h-full group"><span className="h-full w-14 flex items-center justify-center bg-accent text-primary font-headline font-black text-lg transition-all duration-300 group-hover:w-16 rounded-l-full shrink-0 z-10">SG</span><span className="overflow-hidden max-w-0 opacity-0 group-hover:max-w-40 group-hover:opacity-100 transition-all duration-500 ease-in-out inline-block"><span className="font-headline text-xl font-bold tracking-tighter whitespace-nowrap text-primary-foreground pl-3 pr-4 block transform -translate-x-4 group-hover:translate-x-0 transition-transform duration-500 ease-in-out">SnipGeek</span></span></Link>
            </div>
            
            <div className={cn(
                "flex items-center gap-1 transition-opacity duration-300",
                isSearchOpen ? "opacity-0 pointer-events-none" : "opacity-100"
            )}>
                <div className="flex md:hidden items-center gap-0">
                    <Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-full bg-transparent hover:bg-transparent", navItemClass)} onClick={() => toggleView('menu')}>
                        <Menu className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className={cn("relative rounded-full h-9 w-9 bg-transparent hover:bg-transparent", navItemClass)} onClick={() => toggleView('readingList')}>
                       <Bookmark className="h-5 w-5" />
                       {mounted && readingListItems.length > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-bold px-1">
                                {readingListItems.length}
                            </span>
                       )}
                    </Button>
                    <Button variant="ghost" size="icon" className={cn("rounded-full h-9 w-9 bg-transparent hover:bg-transparent", navItemClass)} onClick={() => toggleView('search')}>
                       <Search className="h-5 w-5" />
                    </Button>
                </div>

                <div className="hidden md:flex items-center gap-1">
                    {menuItems.map(item => (
                        <Link key={item.name} href={item.href} className={cn("px-2 py-1 text-sm font-medium", navItemClass)}>
                            {item.name}
                        </Link>
                    ))}
                    <div className="flex items-center">
                        <Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-full bg-transparent hover:bg-transparent", navItemClass)} onClick={() => toggleView('menu')}>
                            <MoreHorizontal className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className={cn("relative h-9 w-9 rounded-full bg-transparent hover:bg-transparent", navItemClass)} onClick={() => toggleView('readingList')}>
                           <Bookmark className="h-5 w-5" />
                           {mounted && readingListItems.length > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-bold px-1">
                                    {readingListItems.length}
                                </span>
                           )}
                        </Button>
                        <Button variant="ghost" size="icon" className={cn("rounded-full h-9 w-9 bg-transparent hover:bg-transparent", navItemClass)} onClick={() => toggleView('search')}>
                           <Search className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>
            
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

        <div className={cn(
            "absolute top-full left-0 right-0 z-40 mt-2 bg-primary/90 backdrop-blur-sm shadow-xl ring-1 ring-black/5 rounded-2xl overflow-hidden transition-all duration-300 ease-in-out",
            "transform-origin-top",
            isMenuOpen ? "opacity-100 scale-y-100" : "opacity-0 scale-y-95 pointer-events-none"
        )}>
            <div className="p-2">
                <div className="md:hidden">
                    {allMobileMenuItems.map((item) => (
                        <Link key={item.name} href={item.href} className={cn("block px-4 py-3 text-base rounded-lg", navItemClass)} onClick={() => setActiveView('none')}>
                            {item.name}
                        </Link>
                    ))}
                </div>
                <div className="hidden md:block">
                    {moreMenuItems.map((item) => (
                        <Link key={item.name} href={item.href} className={cn("block px-4 py-3 text-base rounded-lg", navItemClass)} onClick={() => setActiveView('none')}>
                            {item.name}
                        </Link>
                    ))}
                </div>
            </div>
        </div>

        <div className="absolute top-full left-0 right-0 z-30 mt-2">
          {isSearchOpen && (
            <div className="bg-background rounded-2xl border shadow-xl max-h-[400px] overflow-hidden">
                  {query.length > 1 ? (
                      results.length > 0 ? (
                          <ScrollArea className="h-full max-h-[400px]">
                              <div className="p-2">
                                  <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{results.length} {dictionary.search.resultsFound}</p>
                                  <ul>
                                      {results.map((item) => (
                                      <li key={`${item.type}-${item.slug}`}>
                                          <Link href={item.href} onClick={handleResultClick} className="block p-3 rounded-xl hover:bg-muted transition-colors">
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

          {isReadingListOpen && (
            <div className="bg-background rounded-2xl border shadow-xl max-h-[400px] overflow-hidden">
                <ScrollArea className="h-full max-h-[400px]">
                  <div className="p-2">
                    <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      {mounted ? readingListItems.length : 0} {mounted && readingListItems.length === 1 ? dictionary.readingList.item : dictionary.readingList.items} {dictionary.readingList.inYourList}
                    </p>
                    {mounted && readingListItems.length > 0 ? (
                      <ul>
                        {readingListItems.map((item) => (
                          <li key={`${item.type}-${item.slug}`} className="group relative">
                              <Link href={item.href} onClick={() => setActiveView('none')} className="block p-3 rounded-xl hover:bg-muted transition-colors">
                                  <div className="overflow-hidden pr-8">
                                      <div className="flex items-start justify-between gap-2">
                                          <span className="font-medium text-sm text-primary line-clamp-2 flex-1 min-w-0">{item.title}</span>
                                          <Badge variant="outline" className="capitalize text-xs shrink-0">{item.type}</Badge>
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                                  </div>
                              </Link>
                              <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeReadingListItem(item.slug)}>
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