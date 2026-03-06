"use client";

import { Sun, Moon, SunMoon } from "lucide-react";
import { useEffect, useState } from "react";
import type { Dictionary } from "@/lib/get-dictionary";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SnipTooltip } from "@/components/ui/snip-tooltip";
import { useThemeMode } from "@/hooks/use-theme-mode";

export function ThemeSwitcher({ dictionary }: { dictionary: Dictionary }) {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { currentMode, cycleTheme, tooltipLabel } = useThemeMode();

  useEffect(() => {
    setMounted(true);

    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 300);
    };

    toggleVisibility();
    window.addEventListener("scroll", toggleVisibility, { passive: true });
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  if (!mounted) return null;

  const showSun = currentMode === "light";
  const showMoon = currentMode === "dark";
  const showMonitor = currentMode === "system";

  return (
    <div
      className={cn(
        "fixed bottom-20 right-6 z-50 transition-all duration-300",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none",
      )}
    >
      <SnipTooltip label={tooltipLabel} side="left">
        <Button
          variant="default"
          size="icon"
          onClick={cycleTheme}
          className="relative inline-flex h-10 w-10 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 bg-background text-foreground border border-border"
          aria-label="Toggle theme mode (light, dark, system)"
        >
          <div className="relative h-5 w-5">
            <Sun
              className={cn(
                "absolute inset-0 h-5 w-5 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-center",
                showSun
                  ? "opacity-100 scale-100 rotate-0"
                  : "opacity-0 scale-0 rotate-180",
              )}
            />
            <Moon
              className={cn(
                "absolute inset-0 h-5 w-5 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-center",
                showMoon
                  ? "opacity-100 scale-100 rotate-0"
                  : "opacity-0 scale-0 -rotate-180",
              )}
            />
            <SunMoon
              className={cn(
                "absolute inset-0 h-5 w-5 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-center",
                showMonitor
                  ? "opacity-100 scale-100 rotate-0"
                  : "opacity-0 scale-0 rotate-180",
              )}
            />
          </div>
        </Button>
      </SnipTooltip>
    </div>
  );
}
