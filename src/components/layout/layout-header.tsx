"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { cn, getLinkPrefix } from "@/lib/utils";
import {
  Search,
  X,
  ClipboardPenLine,
  Bookmark,
  Trash2,
  MoreHorizontal,
  BookOpen,
  StickyNote,
  ChevronRight,
  ArrowRight,
  Sun,
  Moon,
  SunMoon,
  Hash,
  Monitor,
  Terminal,
  Smartphone,
  Cpu,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { usePathname, useParams, useRouter } from "next/navigation";
import { useReadingList } from "@/hooks/use-reading-list";
import { useNotification } from "@/hooks/use-notification";
import type { Dictionary } from "@/lib/get-dictionary";
import { SnipGeekLogo } from "@/components/icons/snipgeek-logo";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import NextLink from "next/link";
import Image from "next/image";
import {
  CategoryBadge,
  getBadgeStyle,
} from "@/components/layout/category-badge";
import { useThemeMode } from "@/hooks/use-theme-mode";
import { SnipTooltip } from "@/components/ui/snip-tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SearchableItem = {
  slug: string;
  title: string;
  description: string;
  type: "blog" | "note";
  href: string;
  heroImage?: string;
  category?: string;
  tags?: string[];
};

type ActiveView = "none" | "search" | "menu" | "readingList";

const getTimeLabel = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "🌤 Good Morning Reads";
  if (hour >= 12 && hour < 17) return "☀️ Afternoon Picks";
  if (hour >= 17 && hour < 21) return "🌆 Evening Picks";
  return "🌙 Night Owl Picks";
};

// Helper to escape regex special characters
const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const HighlightMatch = ({ text, query }: { text: string; query: string }) => {
  if (!text || typeof text !== "string" || !query.trim())
    return <>{text || ""}</>;

  const escapedQuery = escapeRegExp(query.trim());
  let parts: string[] = [text];
  try {
    parts = text.split(new RegExp(`(${escapedQuery})`, "gi"));
  } catch {
    return <>{text}</>;
  }

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase().trim() ? (
          <mark
            key={i}
            className="bg-accent/30 text-accent-foreground rounded-xs px-0.5 font-bold"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
};

export function LayoutHeader({
  searchableData,
  dictionary,
}: {
  searchableData: SearchableItem[];
  dictionary: Dictionary;
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>("none");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchableItem[]>([]);
  const [removingSlug, setRemovingSlug] = useState<string | null>(null);
  const [timeLabel, setTimeLabel] = useState("");
  const [mounted, setMounted] = useState(false);

  const {
    items: readingListItems,
    removeItem: removeReadingListItem,
    clearItems: clearReadingListItems,
  } =
    useReadingList();
  const { message, icon, progress, clear } = useNotification();
  const {
    currentMode,
    cycleTheme,
    tooltipLabel: themeTooltipLabel,
  } = useThemeMode();

  const lastScrollY = useRef(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const prevCount = useRef(readingListItems.length);

  const isSearchOpen = activeView === "search";
  const isMenuOpen = activeView === "menu";
  const isReadingListOpen = activeView === "readingList";

  const currentLocale = (params.locale as string) || "en";
  const linkPrefix = getLinkPrefix(currentLocale);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setTimeLabel(getTimeLabel());
  }, []);

  useEffect(() => {
    if (mounted && readingListItems.length > prevCount.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsVisible(true);
    }
    prevCount.current = readingListItems.length;
  }, [readingListItems.length, mounted]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveView("none");
    setQuery("");
    if (typeof window !== "undefined") {
      const root = document.documentElement;
      const previousScrollBehavior = root.style.scrollBehavior;

      root.style.scrollBehavior = "auto";
      window.scrollTo(0, 0);
      lastScrollY.current = 0;
      setIsVisible(true);
      setIsScrolled(false);

      requestAnimationFrame(() => {
        root.style.scrollBehavior = previousScrollBehavior;
      });
    }
  }, [pathname]);

  useEffect(() => {
    if (query.length > 1) {
      const lowerCaseQuery = query.toLowerCase();
      const filteredData = (searchableData || []).filter(
        (item) =>
          (item.title || "").toLowerCase().includes(lowerCaseQuery) ||
          (item.description || "").toLowerCase().includes(lowerCaseQuery),
      );
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults(filteredData);
    } else {
      setResults([]);
    }
  }, [query, searchableData]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 10);

      if (activeView !== "none") return;
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

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeView, message]);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        headerRef.current &&
        !headerRef.current.contains(event.target as Node)
      ) {
        setActiveView("none");
        setQuery("");
      }
    };
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveView("none");
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [headerRef]);

  const toggleView = (view: ActiveView) => {
    setActiveView((prev) => (prev === view ? "none" : view));
    if (view !== "search") {
      setQuery("");
    }
  };

  const handleRemoveReadingListItem = (slug: string) => {
    setRemovingSlug(slug);
    setTimeout(() => {
      removeReadingListItem(slug);
      setRemovingSlug(null);
    }, 320);
  };

  const getResolvedImage = (item: SearchableItem) => {
    if (!item.heroImage) return "/images/blank/blank.webp";
    if (item.heroImage.startsWith("http") || item.heroImage.startsWith("/")) {
      return item.heroImage;
    }
    const placeholder = PlaceHolderImages.find((p) => p.id === item.heroImage);
    return placeholder?.imageUrl || "/images/blank/blank.webp";
  };

  const quickPicks = useMemo(() => {
    return (searchableData || []).slice(0, 3);
  }, [searchableData]);

  const ubuntuFocusHref =
    currentLocale === "id"
      ? "/blog/ubuntu-26-04-lts-resolute-raccoon-fitur-baru-dan-perubahan-utama"
      : "/blog/ubuntu-26-04-lts-resolute-raccoon-new-features-major-changes";

  const directLinks = [
    { name: dictionary.navigation.blog, href: "/blog", icon: BookOpen },
    { name: dictionary.navigation.notes, href: "/notes", icon: StickyNote },
    { name: "Ubuntu 26.04", href: ubuntuFocusHref, icon: Terminal },
  ];

  // ── Curated Featured Topics — update manually each year ──
  const moreItems = [
    { name: "Windows 11", href: "/tags/windows-11", icon: Monitor },
    { name: "Linux", href: "/tags/linux", icon: Terminal },
    { name: "Android", href: "/tags/android", icon: Smartphone },
    { name: "Hardware", href: "/tags/hardware", icon: Cpu },
    { name: "Tutorial", href: "/tags/tutorial", icon: GraduationCap },
  ];

  const topTagLinks = useMemo(() => {
    const tagCount = new Map<string, number>();
    const tagLabel = new Map<string, string>();

    (searchableData || []).forEach((item) => {
      (item.tags || []).forEach((rawTag) => {
        const normalizedTag = rawTag.trim();
        if (!normalizedTag) return;

        const key = normalizedTag.toLowerCase();
        tagCount.set(key, (tagCount.get(key) || 0) + 1);
        if (!tagLabel.has(key)) {
          tagLabel.set(key, normalizedTag);
        }
      });
    });

    const dynamicTagLinks = [...tagCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag]) => ({
        name: tagLabel.get(tag) || tag,
        href: `/tags/${encodeURIComponent(tag)}`,
        icon: Hash,
      }));

    if (dynamicTagLinks.length >= 3) {
      return dynamicTagLinks;
    }

    const fallbackTags = ["windows", "android", "tutorial"];
    const existingHrefs = new Set(dynamicTagLinks.map((item) => item.href));
    const fallbackLinks = fallbackTags
      .filter((tag) => !existingHrefs.has(`/tags/${tag}`))
      .slice(0, 3 - dynamicTagLinks.length)
      .map((tag) => ({
        name: tag.charAt(0).toUpperCase() + tag.slice(1),
        href: `/tags/${tag}`,
        icon: Hash,
      }));

    return [...dynamicTagLinks, ...fallbackLinks];
  }, [searchableData]);

  const secondaryLinks = [
    { name: dictionary.tags.allTagsTitle, href: "/tags", icon: Hash },
    ...topTagLinks,
  ];

  const normalizedPath = useMemo(() => {
    if (!pathname) return "/";
    const stripped = pathname.replace(/\/+$/, "");
    return stripped || "/";
  }, [pathname]);

  const isArticleDetailPage = useMemo(() => {
    const blogDetailPrefix = `${linkPrefix}/blog/`;
    const noteDetailPrefix = `${linkPrefix}/notes/`;

    return (
      (normalizedPath.startsWith(blogDetailPrefix) &&
        !normalizedPath.slice(blogDetailPrefix.length).includes("/")) ||
      (normalizedPath.startsWith(noteDetailPrefix) &&
        !normalizedPath.slice(noteDetailPrefix.length).includes("/"))
    );
  }, [linkPrefix, normalizedPath]);

  const isHomePage = useMemo(
    () => normalizedPath === (linkPrefix || "/"),
    [linkPrefix, normalizedPath],
  );

  const showDevPromptShortcut =
    process.env.NODE_ENV === "development" && (isArticleDetailPage || isHomePage);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const handlePromptShortcut = (event: KeyboardEvent) => {
      const isPromptShortcut =
        event.key.toLowerCase() === "p" &&
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        !event.altKey;

      if (!isPromptShortcut) return;

      const target = event.target as HTMLElement | null;
      const isTypingContext = Boolean(
        target?.closest("input, textarea, [contenteditable='true']"),
      );

      if (isTypingContext) return;

      event.preventDefault();
      router.push(`${linkPrefix}/tools/prompt-generator`);
    };

    window.addEventListener("keydown", handlePromptShortcut);
    return () => window.removeEventListener("keydown", handlePromptShortcut);
  }, [linkPrefix, router]);

  const contextualSecondaryLink = useMemo(() => {
    const blogDetailPrefix = `${linkPrefix}/blog/`;
    const noteDetailPrefix = `${linkPrefix}/notes/`;
    const isDetailPage =
      (normalizedPath.startsWith(blogDetailPrefix) &&
        !normalizedPath.slice(blogDetailPrefix.length).includes("/")) ||
      (normalizedPath.startsWith(noteDetailPrefix) &&
        !normalizedPath.slice(noteDetailPrefix.length).includes("/"));

    if (!isDetailPage) return null;

    const currentItem = (searchableData || []).find(
      (item) => item.href === normalizedPath,
    );

    if (!currentItem) return null;

    const selectedTag = (currentItem.tags || []).find((tag) => tag.trim());

    if (selectedTag) {
      const tagLabel = selectedTag.trim();
      const tagKey = tagLabel.toLowerCase();
      return {
        name: tagLabel,
        href: `/tags/${encodeURIComponent(tagKey)}`,
        icon: Hash,
      };
    }

    const selectedCategory = currentItem.category?.trim();
    if (!selectedCategory) return null;

    const categoryKey = selectedCategory.toLowerCase();
    return {
      name: selectedCategory,
      href: `/tags/${encodeURIComponent(categoryKey)}`,
      icon: Hash,
    };
  }, [linkPrefix, normalizedPath, searchableData]);

  const finalSecondaryLinks = useMemo(() => {
    const merged = contextualSecondaryLink
      ? [secondaryLinks[0], contextualSecondaryLink, ...secondaryLinks.slice(1)]
      : secondaryLinks;

    const seen = new Set<string>();
    return merged.filter((item) => {
      if (seen.has(item.href)) return false;
      seen.add(item.href);
      return true;
    });
  }, [contextualSecondaryLink, secondaryLinks]);

  const getIsActivePath = (href: string) => {
    const localizedHref = `${linkPrefix}${href}` || "/";

    if (href === "/tags") {
      return pathname === localizedHref;
    }

    return (
      pathname === localizedHref || pathname.startsWith(`${localizedHref}/`)
    );
  };

  const trackSecondaryNavClick = (item: {
    name: string;
    href: string;
  }, position: number) => {
    if (typeof window === "undefined") return;

    const detail = {
      name: item.name,
      href: item.href,
      position,
      locale: currentLocale,
      sourcePath: normalizedPath,
    };

    window.dispatchEvent(
      new CustomEvent("snipgeek:secondary-nav-click", { detail }),
    );

    const gtag = (
      window as typeof window & {
        gtag?: (...args: unknown[]) => void;
      }
    ).gtag;

    if (typeof gtag === "function") {
      gtag("event", "secondary_nav_click", detail);
    }
  };

  const navItemClass =
    "h-9 w-9 p-0 rounded-xl transition-all duration-300 text-foreground/75 hover:text-foreground hover:bg-accent/15 hover:shadow-sm flex items-center justify-center relative";

  const secondaryHoverStyles = [
    "hover:border-white/45 hover:bg-white/20 hover:text-nav-primary-foreground",
    "hover:border-white/55 hover:bg-white/24 hover:text-nav-primary-foreground",
    "hover:border-white/50 hover:bg-white/18 hover:text-nav-primary-foreground",
    "hover:border-white/60 hover:bg-white/26 hover:text-nav-primary-foreground",
  ] as const;

  return (
    <>
      <header
        ref={headerRef}
        data-scrolled={isScrolled}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 w-full bg-background border-b border-border transition-all [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] will-change-transform overflow-visible",
          isVisible
            ? "translate-y-0 duration-500"
            : "-translate-y-full duration-300",
          isScrolled && "shadow-sm border-border/90",
        )}
      >
        <div className="max-w-4xl mx-auto h-16 min-h-16 px-4 md:px-6 flex items-center justify-between relative overflow-visible">
          {/* Left: Branding & Back to Site */}
          <div
            className={cn(
              "flex items-center transition-all duration-500",
              isSearchOpen || isReadingListOpen
                ? "opacity-0 pointer-events-none"
                : "opacity-100",
            )}
          >
            {pathname !== "/" && pathname !== `/${currentLocale}` ? (
              <NextLink
                href="/"
                className="flex items-center gap-3 group text-foreground hover:text-foreground transition-colors duration-300"
                aria-label="Back to Site"
              >
                <div className="flex items-center gap-1 shrink-0">
                  <div className="opacity-100 translate-x-0 transition-all duration-300 md:opacity-0 md:-translate-x-1 md:group-hover:opacity-100 md:group-hover:translate-x-0">
                    <ChevronRight className="h-4 w-4 rotate-180 text-accent" />
                  </div>
                  <div className="relative h-9 w-9 flex items-center justify-center shrink-0">
                    <div className="absolute inset-0 bg-accent/10 rounded-xl transition-all duration-500 group-hover:bg-accent/20 group-hover:shadow-sm group-hover:rotate-6 group-hover:scale-110" />
                    <SnipGeekLogo className="h-6 w-6 relative z-10 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="font-display text-base font-black tracking-tight leading-tight">
                    Back to Home
                  </span>
                  <span className="font-sans text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground/70 mt-0.5 group-hover:text-foreground/90 transition-colors">
                    {(params.locale as string) === "en"
                      ? "Return Home"
                      : "Kembali"}
                  </span>
                </div>
              </NextLink>
            ) : (
              <NextLink
                href="/"
                className="flex items-center gap-2 sm:gap-3 group"
                aria-label="SnipGeek Home"
              >
                <SnipGeekLogo className="h-7 w-7 sm:h-8 sm:w-8 transition-transform duration-500 ease-in-out group-hover:scale-[1.15] group-hover:rotate-3" />
                <div className="font-display text-lg sm:text-xl font-black tracking-[-0.03em] flex items-baseline leading-none">
                  <span className="text-foreground">Snip</span>
                  <span className="text-accent ml-px">
                    Geek
                  </span>
                </div>
              </NextLink>
            )}
          </div>

          {/* Center: Navigation (md+) */}
          <nav
            className={cn(
              "hidden md:flex items-center gap-0 absolute left-1/2 -translate-x-1/2 transition-all duration-500",
              isSearchOpen || isReadingListOpen
                ? "opacity-0 pointer-events-none"
                : "opacity-100",
            )}
          >
            {directLinks.map((item) => {
              const isActive = getIsActivePath(item.href);
              return (
                <NextLink
                  key={item.href}
                  href={`${linkPrefix}${item.href}`}
                  className={cn(
                    "px-3 py-2 font-sans text-[10px] font-black uppercase tracking-[0.12em] transition-all relative rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
                    isActive
                      ? "text-accent"
                      : "text-foreground/65 hover:text-foreground",
                  )}
                >
                  {item.name}
                  <div
                    className={cn(
                      "absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-accent transition-all duration-300",
                      isActive ? "w-4" : "w-0",
                    )}
                  />
                </NextLink>
              );
            })}
          </nav>

          {/* Right: Utilities Container */}
          <div
            className={cn(
              "flex items-center gap-1 transition-all duration-500",
              isSearchOpen || isReadingListOpen
                ? "opacity-0 pointer-events-none"
                : "opacity-100",
            )}
          >
            {/* 1. More Menu Toggle */}
            <DropdownMenu
              open={isMenuOpen}
              onOpenChange={(open) => setActiveView(open ? "menu" : "none")}
            >
              <div className="relative z-110">
                <SnipTooltip
                  label={
                    dictionary?.promptGenerator?.tooltips?.moreMenu ?? "More Menu"
                  }
                  side="bottom"
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(navItemClass, "relative inline-flex")}
                      aria-label="More Menu"
                    >
                      <MoreHorizontal
                        className={cn(
                          "h-5 w-5 transition-all duration-300",
                          isMenuOpen
                            ? "rotate-90 opacity-0 scale-0 absolute"
                            : "opacity-100 scale-100",
                        )}
                      />
                      <X
                        className={cn(
                          "h-5 w-5 transition-all duration-300",
                          isMenuOpen
                            ? "opacity-100 scale-100"
                            : "-rotate-90 opacity-0 scale-0 absolute",
                        )}
                      />
                    </Button>
                  </DropdownMenuTrigger>
                </SnipTooltip>
              </div>

              <DropdownMenuContent
                align="end"
                side="bottom"
                sideOffset={18}
                className="z-200 min-w-55 rounded-2xl border border-border bg-background p-0 shadow-2xl ring-1 ring-black/3 overflow-hidden"
              >
                <div className="py-3">
                  <div className="px-4 py-2 mb-1">
                    <p className="font-sans text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                      SnipGeek · Navigate
                    </p>
                  </div>

                  <div className="md:hidden border-b border-border mb-1 pb-1">
                    {directLinks.map((item) => (
                      <NextLink
                        key={item.href}
                        href={`${linkPrefix}${item.href}`}
                        className="group/item relative mx-1 flex cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 font-sans text-[11px] font-bold uppercase tracking-wider text-foreground/80 transition-colors hover:bg-accent/10 hover:text-foreground"
                        onClick={() => setActiveView("none")}
                      >
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-accent opacity-0 group-hover/item:opacity-60 transition-opacity" />
                        <item.icon className="h-4 w-4 text-accent" />
                        {item.name}
                      </NextLink>
                    ))}
                  </div>

                  <div className="pt-1">
                    <div className="px-4 py-2">
                      <p className="font-sans text-[8px] font-black uppercase tracking-[0.15em] text-accent">
                        Featured Topics
                      </p>
                    </div>
                    {moreItems.map((item) => (
                      <NextLink
                        key={item.href}
                        href={`${linkPrefix}${item.href}`}
                        className="group/item relative mx-1 flex cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 font-sans text-[11px] font-bold uppercase tracking-wider text-foreground/80 transition-colors hover:bg-accent/15 hover:text-foreground"
                        onClick={() => setActiveView("none")}
                      >
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-accent opacity-0 group-hover/item:opacity-60 transition-opacity" />
                        <item.icon className="h-4 w-4 text-accent" />
                        {item.name}
                      </NextLink>
                    ))}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Vertical Divider */}
            <div className="w-px h-4 bg-border/70 mx-0.5 hidden sm:block" />

            {/* 2. Bookmark Icon */}
            <SnipTooltip
              label={
                dictionary?.promptGenerator?.tooltips?.readingList ??
                "Reading List"
              }
              side="bottom"
            >
              <Button
                variant="ghost"
                size="icon"
                className={cn(navItemClass, "relative inline-flex")}
                onClick={() => toggleView("readingList")}
                aria-label="Reading List"
              >
                <Bookmark
                  className={cn(
                    "h-5 w-5 transition-all duration-300",
                    readingListItems.length > 0 ? "fill-accent text-accent" : "",
                  )}
                />
                {mounted && readingListItems.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-accent text-accent-foreground font-sans text-[8px] font-black px-1 animate-badge-pop shadow-sm">
                    {readingListItems.length}
                  </span>
                )}
              </Button>
            </SnipTooltip>

            {/* 3. Theme Toggle (light → dark → system) */}
            <SnipTooltip label={themeTooltipLabel} side="bottom">
              <button
                type="button"
                className={cn(navItemClass, "group/theme relative inline-flex")}
                onClick={cycleTheme}
                aria-label="Toggle Theme"
              >
                <div className="relative h-5 w-5">
                  {(() => {
                    return (
                      <>
                        {/* Sun — visible in light mode */}
                        <Sun
                          className={cn(
                            "absolute inset-0 h-5 w-5 origin-center transition-all duration-500 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",
                            mounted && currentMode === "light"
                              ? "opacity-100 scale-100 rotate-0"
                              : "opacity-0 scale-0 rotate-180",
                          )}
                        />
                        {/* Moon — visible in dark mode */}
                        <Moon
                          className={cn(
                            "absolute inset-0 h-5 w-5 origin-center transition-all duration-500 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",
                            mounted && currentMode === "dark"
                              ? "opacity-100 scale-100 rotate-0"
                              : "opacity-0 scale-0 -rotate-180",
                          )}
                        />
                        {/* SunMoon — visible in system mode */}
                        <SunMoon
                          className={cn(
                            "absolute inset-0 h-5 w-5 origin-center transition-all duration-500 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",
                            mounted && currentMode === "system"
                              ? "opacity-100 scale-100 rotate-0"
                              : "opacity-0 scale-0 rotate-180",
                          )}
                        />
                      </>
                    );
                  })()}
                </div>
              </button>
            </SnipTooltip>

            {/* 4. Search Icon */}
            <SnipTooltip
              label={dictionary?.promptGenerator?.tooltips?.search ?? "Search"}
              side="bottom"
            >
              <Button
                variant="ghost"
                size="icon"
                className={cn(navItemClass, "relative inline-flex")}
                onClick={() => toggleView("search")}
                aria-label="Search"
              >
                <Search className="h-5 w-5 transition-transform group-hover:scale-110 group-hover:rotate-12" />
              </Button>
            </SnipTooltip>
          </div>

          {/* BAR OVERLAYS (Only for Search and Reading List) */}
          <div
            className={cn(
              "absolute inset-0 z-10 flex h-16 w-full items-center bg-background border-b border-border px-6 transition-all [transition-duration:280ms] [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",
              isSearchOpen
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-full pointer-events-none",
            )}
          >
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
              className="rounded-full h-10 w-10 hover:bg-accent/10 text-foreground/40 hover:text-accent"
              onClick={() => {
                setActiveView("none");
                setQuery("");
              }}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          <div
            className={cn(
              "absolute inset-0 z-10 flex h-16 w-full items-center justify-between bg-background border-b border-border px-6 transition-all [transition-duration:280ms] [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",
              isReadingListOpen
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-full pointer-events-none",
            )}
          >
            <div className="flex items-center gap-3">
              <Bookmark className="h-6 w-6 text-accent fill-current" />
              <span className="font-display text-xl font-black uppercase tracking-tight">
                Reading List
              </span>
              {mounted && (
                <Badge
                  variant="secondary"
                  className="rounded-full bg-accent/10 text-accent border-none font-sans font-black h-6 px-3"
                >
                  {readingListItems.length}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-10 w-10 hover:bg-transparent text-foreground/40 hover:text-foreground"
              onClick={() => {
                setActiveView("none");
              }}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto relative px-4 md:px-6 overflow-visible">
          {/* Reading List Results Panel */}
          <div
            className={cn(
              "absolute top-0 left-4 right-4 md:left-6 md:right-6 z-30 bg-background border border-border shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]",
              isReadingListOpen
                ? "opacity-100 scale-100 translate-y-2"
                : "opacity-0 scale-[0.97] -translate-y-1 pointer-events-none",
            )}
          >
            <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-border bg-background/60">
              <p className="font-sans text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">
                Queue · {readingListItems.length} items
              </p>
              {readingListItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => clearReadingListItems()}
                  className="font-sans text-[9px] font-black uppercase tracking-wider text-destructive hover:opacity-70 transition-opacity"
                >
                  Clear all
                </button>
              )}
            </div>
            <ScrollArea className="max-h-75">
              <div className="p-2 space-y-1">
                {readingListItems.length > 0 ? (
                  readingListItems.map((item) => {
                    const dataItem = (searchableData || []).find(
                      (d) => d.slug === item.slug,
                    );
                    const imgUrl = dataItem
                      ? getResolvedImage(dataItem as SearchableItem)
                      : "/images/blank/blank.webp";

                    return (
                      <div
                        key={`${item.type}-${item.slug}`}
                        className={cn(
                          "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all [transition-duration:320ms] hover:bg-accent/10",
                          removingSlug === item.slug &&
                          "opacity-0 -translate-x-2 scale-[0.96] ease-in",
                        )}
                      >
                        <NextLink
                          href={item.href}
                          className="flex items-center gap-3 flex-1 min-w-0"
                          onClick={() => setActiveView("none")}
                        >
                          <div className="w-13 h-9.75 relative rounded-md overflow-hidden bg-muted shrink-0 border border-border/50">
                            <Image
                              src={imgUrl}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="52px"
                            />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col">
                            <h4 className="font-sans text-sm font-bold text-foreground line-clamp-1 group-hover:text-accent transition-colors leading-tight">
                              {item.title}
                            </h4>
                            <div className="mt-1">
                              <CategoryBadge
                                category={dataItem?.category}
                                type={item.type}
                              />
                            </div>
                          </div>
                        </NextLink>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-destructive opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemoveReadingListItem(item.slug);
                          }}
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
                      <p className="font-sans text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                        {dictionary.readingList.empty}
                      </p>
                      <NextLink
                        href={`${linkPrefix}/blog`}
                        onClick={() => setActiveView("none")}
                        className="font-sans text-[11px] font-bold text-accent hover:underline flex items-center justify-center gap-1"
                      >
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
                  className="w-full py-2.5 flex items-center justify-center gap-2 font-sans text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:bg-accent/10 hover:text-accent transition-all rounded-lg"
                  onClick={() => setActiveView("none")}
                >
                  Browse all posts <ArrowRight className="h-3 w-3" />
                </NextLink>
              </div>
            )}
          </div>

          {/* Search Results Panel */}
          <div
            className={cn(
              "absolute top-0 left-4 right-4 md:left-6 md:right-6 z-30 bg-background border border-border shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]",
              isSearchOpen
                ? "opacity-100 scale-100 translate-y-2"
                : "opacity-0 scale-[0.97] -translate-y-1 pointer-events-none",
            )}
          >
            <ScrollArea className="max-h-112.5">
              <div className="p-2">
                {query.length > 1 ? (
                  <>
                    <div className="font-sans text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 px-4 py-2 border-b border-border bg-background/60">
                      {results.length} {dictionary.search.resultsFound} for &quot;
                      {query}&quot;
                    </div>
                    {results.length > 0 ? (
                      <ul className="space-y-1 pt-1">
                        {results.map((item) => {
                          const resolvedHero = getResolvedImage(item);
                          return (
                            <li key={`${item.type}-${item.slug}`}>
                              <NextLink
                                href={item.href}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent/10 transition-all group"
                                onClick={() => setActiveView("none")}
                              >
                                <div className="w-13 h-9.75 relative rounded-md overflow-hidden bg-muted shrink-0 border border-border/50">
                                  <Image
                                    src={resolvedHero}
                                    alt=""
                                    fill
                                    className="object-cover"
                                    sizes="52px"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-sans text-sm font-bold text-foreground line-clamp-1 group-hover:text-accent transition-colors leading-tight">
                                    <HighlightMatch
                                      text={item.title}
                                      query={query}
                                    />
                                  </h4>
                                  <div className="mt-1">
                                    <CategoryBadge
                                      category={item.category}
                                      type={item.type}
                                    />
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
                        <p className="font-sans italic text-xs text-muted-foreground">
                          {dictionary.search.noResults} &quot;{query}&quot;
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-0 space-y-4 pb-4">
                    <div className="space-y-1">
                      <p className="font-sans text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 px-4 pt-3 pb-2">
                        {mounted ? timeLabel : ""}
                      </p>
                      <div className="px-2 space-y-1">
                        {quickPicks.map((item) => {
                          const resolvedHero = getResolvedImage(item);
                          return (
                            <NextLink
                              key={item.slug}
                              href={item.href}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent/10 transition-all group"
                              onClick={() => setActiveView("none")}
                            >
                              <div className="w-13 h-9.75 relative rounded-md overflow-hidden bg-muted shrink-0 border border-border/50">
                                <Image
                                  src={resolvedHero}
                                  alt=""
                                  fill
                                  className="object-cover "
                                  sizes="52px"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-sans text-sm font-bold text-foreground line-clamp-1 group-hover:text-accent transition-colors leading-tight">
                                  {item.title}
                                </h4>
                                <div className="mt-1">
                                  <CategoryBadge
                                    category={item.category}
                                    type={item.type}
                                  />
                                </div>
                              </div>
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/20 group-hover:text-accent transition-all group-hover:translate-x-1" />
                            </NextLink>
                          );
                        })}
                      </div>
                    </div>
                    <div className="px-4">
                      <p className="font-sans text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/40 mb-3">
                        {dictionary.search.prompt}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "Windows",
                          "Android",
                          "Hardware",
                          "Tutorial",
                          "Tips",
                        ].map((cat) => {
                          const style = getBadgeStyle(cat);
                          return (
                            <button
                              key={cat}
                              className={cn(
                                "px-3 py-1.5 rounded-full border font-sans text-[9px] font-black uppercase tracking-wider transition-all",
                                "hover:scale-105 active:scale-95",
                                style.border,
                                style.text,
                                style.bg,
                                "hover:opacity-80",
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
            <div className="px-4 py-2 border-t border-border bg-background/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded border bg-background font-sans text-[8px] font-bold shadow-sm">
                    ESC
                  </kbd>
                  <span className="font-sans text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">
                    to close
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded border bg-background font-sans text-[8px] font-bold shadow-sm">
                    ↑↓
                  </kbd>
                  <span className="font-sans text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">
                    to navigate
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-20 w-full bg-linear-[140deg] from-[hsl(var(--nav-primary)/0.98)] to-[hsl(var(--accent)/0.78)] border-b border-nav-primary/70 pt-16">
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          <nav
            aria-label="Quick navigation"
            data-nav-slot="secondary"
            className="flex h-16 items-center justify-start md:justify-center gap-2 overflow-x-auto whitespace-nowrap py-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {finalSecondaryLinks.map((item, index) => {
              const isActive = getIsActivePath(item.href);
              const hoverStyle =
                secondaryHoverStyles[index % secondaryHoverStyles.length];
              return (
                <NextLink
                  key={item.href}
                  href={`${linkPrefix}${item.href}`}
                  aria-current={isActive ? "page" : undefined}
                  data-nav-item={item.href.replace("/", "") || "home"}
                  onClick={() => trackSecondaryNavClick(item, index + 1)}
                  className={cn(
                    "group inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 font-sans text-[10px] font-black uppercase tracking-[0.13em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
                    isActive
                      ? "border-white/80 bg-white text-nav-primary shadow-sm"
                      : cn(
                          "border-white/20 bg-white/[0.07] text-nav-primary-foreground/90",
                          hoverStyle,
                        ),
                  )}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  <span>{item.name}</span>
                </NextLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Notification Toast Pill (Floating Center, Outside Header bounds) ── */}
      <div
        className={cn(
          "fixed top-3 left-1/2 z-100 -translate-x-1/2 pointer-events-none transition-all duration-300",
          mounted && message
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-8",
        )}
      >
        <div
          className={cn(
            "relative flex items-center justify-center gap-2.5 h-10 px-6 bg-background border border-border shadow-2xl rounded-full overflow-hidden ring-1 ring-black/3",
            message ? "pointer-events-auto" : "pointer-events-none",
          )}
        >
          {/* Icon */}
          <span
            className={cn(
              "text-accent transition-all duration-300 delay-100",
              message
                ? "opacity-100 scale-100"
                : "opacity-0 scale-50",
            )}
          >
            {icon &&
              React.cloneElement(
                icon as React.ReactElement<{ className?: string }>,
                {
                className: "h-3.5 w-3.5",
                },
              )}
          </span>

          {/* Message */}
          <p
            className={cn(
              "font-sans text-[10px] sm:text-xs font-black tracking-wide text-foreground/80 whitespace-nowrap transition-all duration-300 delay-150",
              message ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
            )}
          >
            {message}
          </p>

          {/* Dismiss */}
          <button
            onClick={clear}
            className="ml-1 h-6 w-6 rounded-full flex items-center justify-center text-foreground/30 hover:text-foreground/80 hover:bg-muted/80 transition-all active:scale-90"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          {/* Progress line at the very bottom of the pill */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-transparent">
            <div
              className="h-full bg-accent/60 transition-none"
              style={{ width: `${progress}%`, borderRadius: "0 0 0 16px" }}
            />
          </div>
        </div>
      </div>

      {showDevPromptShortcut && (
        <NextLink
          href={`${linkPrefix}/tools/prompt-generator`}
          className="fixed right-4 bottom-5 z-90 inline-flex h-11 items-center gap-2 rounded-full border border-accent/35 bg-background/90 px-3.5 text-[10px] font-black uppercase tracking-[0.12em] text-accent shadow-xl backdrop-blur transition-all hover:-translate-y-0.5 hover:border-accent/55 hover:bg-background"
          aria-label="Open Prompt Generator"
        >
          <ClipboardPenLine className="h-3.5 w-3.5" />
          Prompt Studio
        </NextLink>
      )}
    </>
  );
}
