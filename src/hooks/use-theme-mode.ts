"use client";

import { useTheme } from "next-themes";
import { useMemo } from "react";
import { STORAGE_KEYS } from "@/lib/constants";

export type ThemeMode = "light" | "dark" | "system";

const THEME_ORDER: ThemeMode[] = ["light", "dark", "system"];

/**
 * useThemeMode — centralized theme cycling and persistence logic.
 *
 * Consolidates all theme-related state and actions that were previously
 * duplicated across ThemeSwitcher, header.tsx, and ThemeProvider.
 *
 * Usage:
 *   const { currentMode, nextMode, cycleTheme, tooltipLabel } = useThemeMode();
 */
export function useThemeMode() {
  const { setTheme, resolvedTheme, theme } = useTheme();

  /** The logical mode the user has chosen: "light" | "dark" | "system". */
  const currentMode = useMemo<ThemeMode>(() => {
    if (theme === "system") return "system";
    return resolvedTheme === "dark" ? "dark" : "light";
  }, [theme, resolvedTheme]);

  /** The next mode in the cycle: light → dark → system → light … */
  const nextMode = useMemo<ThemeMode>(() => {
    const idx = THEME_ORDER.indexOf(currentMode);
    return THEME_ORDER[(idx + 1) % THEME_ORDER.length];
  }, [currentMode]);

  /**
   * Applies a theme mode and persists the manual override expiry.
   * - "light" / "dark"  → stores a 1-week expiry timestamp.
   * - "system"          → removes the expiry so the system preference is fully active.
   */
  const applyTheme = (mode: ThemeMode) => {
    setTheme(mode);

    if (mode === "system") {
      localStorage.removeItem(STORAGE_KEYS.THEME_MANUAL_EXPIRE);
      return;
    }

    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem(
      STORAGE_KEYS.THEME_MANUAL_EXPIRE,
      (Date.now() + oneWeek).toString(),
    );
  };

  /**
   * Advances to the next theme in the cycle.
   * Uses the View Transitions API for a smooth crossfade when the browser
   * supports it and the user hasn't requested reduced motion.
   */
  const cycleTheme = () => {
    const run = () => applyTheme(nextMode);

    if (
      typeof document !== "undefined" &&
      "startViewTransition" in document &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      document.startViewTransition(() => run());
    } else {
      run();
    }
  };

  /** Human-readable label for the tooltip describing the *next* action. */
  const tooltipLabel =
    nextMode === "dark"
      ? "Ganti ke Gelap"
      : nextMode === "light"
        ? "Ganti ke Terang"
        : "Ganti ke Sistem";

  return {
    /** The mode the user has actively chosen ("light" | "dark" | "system"). */
    currentMode,
    /** The mode that will be applied on the next cycleTheme() call. */
    nextMode,
    /** Advance to the next theme mode with optional view-transition animation. */
    cycleTheme,
    /** Apply a specific theme mode directly. */
    applyTheme,
    /** Tooltip label describing the next action (ready for display). */
    tooltipLabel,
    /** The actual rendered theme ("light" | "dark"), resolved from system if needed. */
    resolvedTheme,
  } as const;
}
