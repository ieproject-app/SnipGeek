"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import type { Dictionary } from "@/lib/get-dictionary";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SnipTooltip } from "@/components/ui/snip-tooltip";

export function ThemeSwitcher({ dictionary }: { dictionary: Dictionary }) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setMounted(true);

    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  if (!mounted) {
    return null;
  }

  const toggleTheme = () => {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";

    const applyThemeChange = () => {
      setTheme(nextTheme);
      // Set 1 week persistence for manual override
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      localStorage.setItem('snipgeek-theme-manual-expire', (Date.now() + oneWeek).toString());
    };

    if (
      typeof document !== "undefined" &&
      "startViewTransition" in document &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      // @ts-ignore — startViewTransition is a modern API not yet in all TS libs
      document.startViewTransition(() => {
        applyThemeChange();
      });
    } else {
      applyThemeChange();
    }
  };

  const getIcon = () => {
    if (resolvedTheme === "dark") {
      return <Moon className="h-5 w-5" />;
    }
    return <Sun className="h-5 w-5" />;
  };

  return (
    <div
      className={cn(
        "fixed bottom-20 right-6 z-50 transition-all duration-300",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none",
      )}
    >
      <SnipTooltip
        label={dictionary?.promptGenerator?.tooltips?.theme || "Switch Theme"}
        side="left"
      >
        <Button
          variant="default"
          size="icon"
          onClick={toggleTheme}
          className="relative inline-flex h-10 w-10 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 bg-primary/90 text-primary-foreground border-none"
          aria-label="Toggle theme mode"
        >
          <div className="transition-transform duration-500 ease-in-out group-hover:rotate-[12deg]">
            {getIcon()}
          </div>
        </Button>
      </SnipTooltip>
    </div>
  );
}
